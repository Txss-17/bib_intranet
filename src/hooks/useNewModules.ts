import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const sb = supabase as any;

// ============ Lifecycle: Risk Alerts ============
export const useLifecycleRiskAlerts = () =>
  useQuery({
    queryKey: ['lifecycle_risk_alerts'],
    queryFn: async () => {
      const { data, error } = await sb
        .from('lifecycle_risk_alerts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

export const useCreateRiskAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await sb.from('lifecycle_risk_alerts').insert({ ...payload, created_by: u.user?.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lifecycle_risk_alerts'] }),
  });
};

// ============ Lifecycle: Email Campaigns ============
export const useLifecycleEmailCampaigns = () =>
  useQuery({
    queryKey: ['lifecycle_email_campaigns'],
    queryFn: async () => {
      const { data, error } = await sb
        .from('lifecycle_email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

export const useCreateEmailCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await sb.from('lifecycle_email_campaigns').insert({ ...payload, created_by: u.user?.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lifecycle_email_campaigns'] }),
  });
};

// ============ Direction: Board Reports ============
export const useBoardReports = () =>
  useQuery({
    queryKey: ['direction_board_reports'],
    queryFn: async () => {
      const { data, error } = await sb
        .from('direction_board_reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

export const useCreateBoardReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await sb.from('direction_board_reports').insert({ ...payload, created_by: u.user?.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['direction_board_reports'] }),
  });
};

// ============ Audit Incidents (transversal) ============
export const useAuditIncidents = () =>
  useQuery({
    queryKey: ['audit_incidents'],
    queryFn: async () => {
      const { data, error } = await sb
        .from('audit_incidents')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

export const useDeclareIncident = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await sb.from('audit_incidents').insert({
        ...payload,
        declared_by: u.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit_incidents'] }),
  });
};

export const useUpdateIncidentStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, resolution_notes }: { id: string; status: string; resolution_notes?: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const updates: any = { status };
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = u.user?.id;
      }
      if (resolution_notes !== undefined) updates.resolution_notes = resolution_notes;
      const { error } = await sb.from('audit_incidents').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit_incidents'] }),
  });
};
