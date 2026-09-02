import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export type TechRequestStatus = 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'in_progress' | 'done';

export const TECH_REQUEST_STATUS: Record<TechRequestStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  submitted: { label: 'Soumise', variant: 'secondary' },
  under_review: { label: 'En revue', variant: 'outline' },
  accepted: { label: 'Validée', variant: 'default' },
  rejected: { label: 'Refusée', variant: 'destructive' },
  in_progress: { label: 'En cours', variant: 'outline' },
  done: { label: 'Livrée', variant: 'default' },
};

export const TECH_REQUEST_CATEGORIES = [
  { value: 'evolution', label: 'Évolution fonctionnelle' },
  { value: 'bug', label: 'Anomalie / bug' },
  { value: 'access', label: 'Accès & habilitations' },
  { value: 'data', label: 'Données & reporting' },
  { value: 'integration', label: 'Intégration / API' },
  { value: 'infra', label: 'Infrastructure' },
];

export const PRIORITIES = [
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Normale' },
  { value: 'high', label: 'Haute' },
  { value: 'critical', label: 'Critique' },
];

export interface TechRequest {
  id: string;
  reference: string;
  title: string;
  description: string;
  requester_id: string | null;
  requester_name: string | null;
  requester_pole: string;
  category: string;
  priority: string;
  status: TechRequestStatus;
  decision_reason: string | null;
  target_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TechRequestComment {
  id: string;
  request_id: string;
  author_name: string | null;
  author_pole: string | null;
  body: string;
  created_at: string;
}

export interface TechRequestEvent {
  id: string;
  request_id: string;
  actor_name: string | null;
  action: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  created_at: string;
}

const db = supabase as unknown as {
  from: (t: string) => any;
};

export const useTechRequests = () =>
  useQuery({
    queryKey: ['tech_requests'],
    queryFn: async (): Promise<TechRequest[]> => {
      const { data, error } = await db.from('tech_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TechRequest[];
    },
  });

export const useTechRequestThread = (requestId?: string) => {
  const comments = useQuery({
    queryKey: ['tech_request_comments', requestId],
    enabled: !!requestId,
    queryFn: async (): Promise<TechRequestComment[]> => {
      const { data, error } = await db.from('tech_request_comments').select('*')
        .eq('request_id', requestId).order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as TechRequestComment[];
    },
  });
  const events = useQuery({
    queryKey: ['tech_request_events', requestId],
    enabled: !!requestId,
    queryFn: async (): Promise<TechRequestEvent[]> => {
      const { data, error } = await db.from('tech_request_events').select('*')
        .eq('request_id', requestId).order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TechRequestEvent[];
    },
  });
  return { comments, events };
};

export const useTechRequestActions = () => {
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  const actorName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Utilisateur';

  const invalidate = (requestId?: string) => {
    qc.invalidateQueries({ queryKey: ['tech_requests'] });
    if (requestId) {
      qc.invalidateQueries({ queryKey: ['tech_request_comments', requestId] });
      qc.invalidateQueries({ queryKey: ['tech_request_events', requestId] });
    }
  };

  const logEvent = async (requestId: string, action: string, extra?: { from?: string; to?: string; note?: string }) => {
    await db.from('tech_request_events').insert({
      request_id: requestId, actor_id: user?.id, actor_name: actorName,
      action, from_status: extra?.from ?? null, to_status: extra?.to ?? null, note: extra?.note ?? null,
    });
  };

  const create = useMutation({
    mutationFn: async (payload: {
      title: string; description: string; requester_pole: string;
      category: string; priority: string; target_date?: string | null;
    }) => {
      const { data, error } = await db.from('tech_requests').insert({
        ...payload,
        requester_id: user?.id,
        requester_name: actorName,
      }).select('*').single();
      if (error) throw error;
      await logEvent(data.id, 'Demande créée', { to: 'submitted' });
      return data as TechRequest;
    },
    onSuccess: (r) => {
      invalidate(r.id);
      toast({ title: 'Demande transmise au Tech Studio', description: `${r.reference} · ${r.title}` });
    },
    onError: (e: Error) => toast({ title: 'Envoi impossible', description: e.message, variant: 'destructive' }),
  });

  const changeStatus = useMutation({
    mutationFn: async (p: { request: TechRequest; status: TechRequestStatus; reason?: string }) => {
      const patch: Record<string, unknown> = { status: p.status };
      if (p.status === 'accepted' || p.status === 'rejected') {
        patch.decision_reason = p.reason ?? null;
        patch.decided_by = user?.id;
        patch.decided_at = new Date().toISOString();
      }
      const { error } = await db.from('tech_requests').update(patch).eq('id', p.request.id);
      if (error) throw error;
      await logEvent(p.request.id, `Statut : ${TECH_REQUEST_STATUS[p.status].label}`, {
        from: p.request.status, to: p.status, note: p.reason,
      });
      return p;
    },
    onSuccess: (p) => {
      invalidate(p.request.id);
      toast({ title: `${p.request.reference} — ${TECH_REQUEST_STATUS[p.status].label}` });
    },
    onError: (e: Error) => toast({ title: 'Mise à jour impossible', description: e.message, variant: 'destructive' }),
  });

  const comment = useMutation({
    mutationFn: async (p: { requestId: string; body: string }) => {
      const { error } = await db.from('tech_request_comments').insert({
        request_id: p.requestId, author_id: user?.id, author_name: actorName,
        author_pole: profile?.poles?.[0] ?? null, body: p.body,
      });
      if (error) throw error;
      await logEvent(p.requestId, 'Commentaire ajouté');
      return p;
    },
    onSuccess: (p) => invalidate(p.requestId),
    onError: (e: Error) => toast({ title: 'Commentaire refusé', description: e.message, variant: 'destructive' }),
  });

  return { create, changeStatus, comment };
};
