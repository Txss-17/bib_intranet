import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { useHrAlerts } from '@/pages/modules/rh/HRAlerts';

const db = supabase as any;
const count = async (table: string, apply: (q: any) => any) => {
  const { count: c } = await apply(db.from(table).select('id', { count: 'exact', head: true }));
  return c ?? 0;
};

/** KPI RH réels (congés, formations, recrutement, alertes) — filtrés par RLS. */
export function RhLiveKpis() {
  const alerts = useHrAlerts();
  const { data } = useQuery({
    queryKey: ['rh-live-kpis'],
    queryFn: async () => ({
      leaves: await count('hr_leave_requests', (q) => q.eq('status', 'pending')),
      trainings: await count('hr_trainings', (q) => q.in('status', ['planned', 'in_progress'])),
      needs: await count('hr_recruitment_needs', (q) => q.in('status', ['open', 'in_progress'])),
      candidates: await count('hr_candidates', (q) => q.not('status', 'in', '(accepted,rejected,archived)')),
    }),
    staleTime: 30_000,
  });
  const items = [
    { label: 'Congés à traiter', value: data?.leaves, to: '/pole/rh/leave' },
    { label: 'Formations en cours/planifiées', value: data?.trainings, to: '/pole/rh/training' },
    { label: 'Recrutements ouverts', value: data?.needs, to: '/pole/rh/recruitment' },
    { label: 'Candidatures actives', value: data?.candidates, to: '/pole/rh/recruitment' },
    { label: 'Alertes RH', value: alerts.data?.length, to: '/pole/rh/alerts' },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((i) => (
        <Link key={i.label} to={i.to}>
          <Card className="transition-colors hover:bg-muted/50"><CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{i.label}</p>
            <p className="text-2xl font-semibold">{i.value ?? '—'}</p>
          </CardContent></Card>
        </Link>
      ))}
    </div>
  );
}
