import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { readAllPages } from '@/lib/operationsMetrics';

export function useFieldAuditRows(enabled = true) {
  const { user, profile } = useAuth();
  return useQuery({ queryKey: ['field-audit-rows', user?.id, profile?.test_account === true], enabled: !!user && !!profile && enabled,
    queryFn: async () => {
      const rows = await readAllPages(cursor => {
        let query = supabase.from('field_audits').select('*').order('id').limit(500);
        if (cursor) query = query.gt('id', cursor);
        return query;
      });
      return rows.sort((a, b) => (b.scheduled_date || b.created_at || '').localeCompare(a.scheduled_date || a.created_at || ''));
    },
  });
}
