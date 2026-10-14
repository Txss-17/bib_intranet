import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase as typedSupabase } from '@/integrations/supabase/client';
// Supplier tables are not yet in the generated schema types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = typedSupabase as any;
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface SupplierApplication {
  id: string;
  type: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string;
  contact_phone: string | null;
  country: string | null;
  category: string | null;
  lead_time_days: number | null;
  moq: number | null;
  audit_accepted: boolean;
  certifications: Json;
  documents: Json;
  raw_payload: Json;
  score: number;
  priority: string;
  status: string;
  blocking_criteria: string[];
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  assigned_at: string | null;
  decision_notes: string | null;
  decision_by: string | null;
  decision_at: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export type SupplierApplicationStatus =
  | 'new'
  | 'assigned'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'on_hold';

export function useSupplierApplications() {
  return useQuery({
    queryKey: ['supplier_applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as SupplierApplication[];
    },
  });
}

export function useSupplierApplication(id: string | undefined) {
  return useQuery({
    queryKey: ['supplier_application', id],
    enabled: !!id,
    queryFn: async () => {
      const { data: app, error } = await supabase
        .from('supplier_applications')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      const { data: events, error: eventsError } = await supabase
        .from('supplier_application_events')
        .select('*')
        .eq('application_id', id)
        .order('created_at', { ascending: false });
      if (eventsError) throw eventsError;
      return { app, events };
    },
  });
}

export function useUpdateApplicationStatus() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, status, notes, fromStatus }: { id: string; status: SupplierApplicationStatus; notes?: string; fromStatus?: string }) => {
      const update: Record<string, unknown> = { status };
      if (status === 'approved' || status === 'rejected') {
        update.decision_at = new Date().toISOString();
        update.decision_by = user?.id;
        update.decision_notes = notes ?? null;
      }
      const { error } = await supabase.from('supplier_applications').update(update).eq('id', id);
      if (error) throw error;
      const { error: eventError } = await supabase.from('supplier_application_events').insert({
        application_id: id,
        event_type: status === 'approved' || status === 'rejected' ? 'decided' : 'status_changed',
        from_status: fromStatus,
        to_status: status,
        notes: notes ?? null,
        performed_by: user?.id,
      });
      if (eventError) throw eventError;
    },
    onSuccess: (_d, v) => {
      toast.success('Statut mis à jour');
      qc.invalidateQueries({ queryKey: ['supplier_applications'] });
      qc.invalidateQueries({ queryKey: ['supplier_application', v.id] });
    },
    onError: (e: Error) => toast.error('Erreur', { description: e.message }),
  });
}

export function useReassignApplication() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, assigneeId, assigneeName }: { id: string; assigneeId: string; assigneeName: string }) => {
      const { error } = await supabase
        .from('supplier_applications')
        .update({ assigned_to_id: assigneeId, assigned_to_name: assigneeName, assigned_at: new Date().toISOString(), status: 'assigned' })
        .eq('id', id);
      if (error) throw error;
      const { error: eventError } = await supabase.from('supplier_application_events').insert({
        application_id: id,
        event_type: 'assigned',
        to_status: 'assigned',
        notes: `Réassigné à ${assigneeName}`,
        performed_by: user?.id,
        metadata: { assigned_to_id: assigneeId },
      });
      if (eventError) throw eventError;
    },
    onSuccess: (_d, v) => {
      toast.success('Candidature réassignée');
      qc.invalidateQueries({ queryKey: ['supplier_applications'] });
      qc.invalidateQueries({ queryKey: ['supplier_application', v.id] });
    },
    onError: (e: Error) => toast.error('Erreur', { description: e.message }),
  });
}

export function useSupplierManagers() {
  return useQuery({
    queryKey: ['supplier_managers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, position')
        .or('position.eq.supplier_manager,position.eq.ceo');
      if (error) throw error;
      return (data || []).map((p) => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`.trim(),
        position: p.position,
      }));
    },
  });
}
