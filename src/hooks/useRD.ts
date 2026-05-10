import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const sb = supabase as any;

export const useRDReports = () =>
  useQuery({
    queryKey: ['rd_reports'],
    queryFn: async () => {
      const { data, error } = await sb.from('rd_reports').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

export const useCreateRDReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data: u } = await supabase.auth.getUser();
      const { data: profile } = await sb.from('profiles').select('first_name,last_name').eq('id', u.user?.id).maybeSingle();
      const author_name = profile ? `${profile.first_name} ${profile.last_name}` : null;
      const { error } = await sb.from('rd_reports').insert({ ...payload, author_id: u.user?.id, author_name });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rd_reports'] }),
  });
};

export const useUpdateRDReportStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'published') updates.published_at = new Date().toISOString();
      const { error } = await sb.from('rd_reports').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rd_reports'] }),
  });
};

export const useRDRecommendations = (reportId?: string) =>
  useQuery({
    queryKey: ['rd_recommendations', reportId ?? 'all'],
    queryFn: async () => {
      let q = sb.from('rd_recommendations').select('*').order('created_at', { ascending: false });
      if (reportId) q = q.eq('report_id', reportId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

export const useCreateRDRecommendation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await sb.from('rd_recommendations').insert({ ...payload, created_by: u.user?.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rd_recommendations'] }),
  });
};

export const useUpdateRecommendationStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await sb.from('rd_recommendations').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rd_recommendations'] }),
  });
};

// Tickets created from R&D recommendations (joined with audit_incidents + assignee profile)
export const useRDTickets = () =>
  useQuery({
    queryKey: ['rd_tickets'],
    queryFn: async () => {
      const { data: recos, error: rErr } = await sb
        .from('rd_recommendations')
        .select('id, detail, priority, status, target_pole, ticket_id, ticket_type, created_at')
        .not('ticket_id', 'is', null)
        .order('created_at', { ascending: false });
      if (rErr) throw rErr;
      const ids = (recos || []).map((r: any) => r.ticket_id).filter(Boolean);
      if (ids.length === 0) return [];
      const { data: incidents, error: iErr } = await sb
        .from('audit_incidents')
        .select('id, title, status, severity, pole_id, assigned_to, resolved_at, updated_at')
        .in('id', ids);
      if (iErr) throw iErr;
      const assigneeIds = Array.from(new Set((incidents || []).map((i: any) => i.assigned_to).filter(Boolean)));
      let profilesMap: Record<string, string> = {};
      if (assigneeIds.length > 0) {
        const { data: profiles } = await sb.from('profiles').select('id, first_name, last_name').in('id', assigneeIds);
        (profiles || []).forEach((p: any) => { profilesMap[p.id] = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(); });
      }
      const incidentMap: Record<string, any> = {};
      (incidents || []).forEach((i: any) => { incidentMap[i.id] = i; });
      return (recos || []).map((r: any) => {
        const inc = incidentMap[r.ticket_id];
        return {
          recommendation_id: r.id,
          detail: r.detail,
          priority: r.priority,
          target_pole: r.target_pole,
          created_at: r.created_at,
          ticket_id: r.ticket_id,
          ticket_type: r.ticket_type,
          ticket_title: inc?.title,
          ticket_status: inc?.status ?? 'unknown',
          ticket_severity: inc?.severity,
          assignee_id: inc?.assigned_to,
          assignee_name: inc?.assigned_to ? (profilesMap[inc.assigned_to] || '—') : null,
        };
      });
    },
  });

// Transform a recommendation into a downstream ticket (audit_incidents as a generic actionable ticket).
export const useConvertRecommendationToTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ recommendation, targetPole }: { recommendation: any; targetPole: 'tech' | 'ops' | 'supplier' | 'rse' }) => {
      const { data: u } = await supabase.auth.getUser();
      const { data: incident, error: insErr } = await sb.from('audit_incidents').insert({
        title: `[R&D] ${recommendation.detail.slice(0, 80)}`,
        description: `Issu de la recommandation R&D #${recommendation.id}\n\n${recommendation.detail}`,
        category: 'operational',
        severity: recommendation.priority === 'critical' ? 'critical' : recommendation.priority === 'high' ? 'high' : 'medium',
        pole_id: targetPole,
        declared_by: u.user?.id,
      }).select().single();
      if (insErr) throw insErr;

      const { error: updErr } = await sb.from('rd_recommendations')
        .update({ status: 'in_progress', target_pole: targetPole, ticket_type: 'audit_incident', ticket_id: incident.id })
        .eq('id', recommendation.id);
      if (updErr) throw updErr;
      return incident;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rd_recommendations'] });
      qc.invalidateQueries({ queryKey: ['audit_incidents'] });
      qc.invalidateQueries({ queryKey: ['rd_tickets'] });
    },
  });
};
