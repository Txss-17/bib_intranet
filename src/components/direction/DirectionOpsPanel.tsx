import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, AlertTriangle, Scale, ClipboardCheck, Package, Flag, RefreshCw, ArrowUpRight } from 'lucide-react';

const db = supabase as unknown as { from: (t: string) => any };

const count = async (table: string, build?: (q: any) => any) => {
  let q = db.from(table).select('id', { count: 'exact', head: true });
  if (build) q = build(q);
  const { count: c, error } = await q;
  return error ? 0 : c ?? 0;
};

function useDirectionOps() {
  return useQuery({
    queryKey: ['direction-ops'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const now = new Date().toISOString();
      const [
        shopsActive, shopsTest, anomaliesOpen, anomaliesCritical, anomaliesLate,
        reconGaps, auditsToAnalyse, auditsNonCompliant, productsPending, productsActive,
        escalationsOpen, lastSync,
      ] = await Promise.all([
        count('shops', q => q.eq('status', 'active')),
        count('shops', q => q.eq('status', 'test')),
        count('anomalies', q => q.not('status', 'in', '(resolved,closed)')),
        count('anomalies', q => q.eq('severity', 'critical').not('status', 'in', '(resolved,closed)')),
        count('anomalies', q => q.lt('due_at', now).not('status', 'in', '(resolved,closed)')),
        count('reconciliation_items', q => q.in('status', ['gap', 'reviewing'])),
        count('field_audits', q => q.in('workflow_status', ['synced', 'analysis'])),
        count('field_audits', q => q.in('workflow_status', ['non_compliant', 'corrective_action'])),
        count('products', q => q.in('lifecycle_status', ['review', 'audit_required', 'audit'])),
        count('products', q => q.eq('lifecycle_status', 'active')),
        count('work_escalations', q => q.neq('status', 'resolved')),
        db.from('platform_sync_runs').select('status, started_at').order('started_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      return {
        shopsActive, shopsTest, anomaliesOpen, anomaliesCritical, anomaliesLate,
        reconGaps, auditsToAnalyse, auditsNonCompliant, productsPending, productsActive,
        escalationsOpen, lastSync: lastSync?.data as { status: string; started_at: string } | null,
      };
    },
  });
}

export default function DirectionOpsPanel() {
  const { data, isLoading } = useDirectionOps();
  const d = data;

  const tiles = [
    { label: 'Boutiques actives', value: d?.shopsActive, sub: `${d?.shopsTest ?? 0} en test`, icon: Store, href: '/pole/ops/shops', alert: false },
    { label: 'Anomalies ouvertes', value: d?.anomaliesOpen, sub: `${d?.anomaliesCritical ?? 0} critiques · ${d?.anomaliesLate ?? 0} en retard`, icon: AlertTriangle, href: '/pole/ops/anomalies', alert: (d?.anomaliesCritical ?? 0) + (d?.anomaliesLate ?? 0) > 0 },
    { label: 'Écarts financiers', value: d?.reconGaps, sub: 'à examiner par la Finance', icon: Scale, href: '/pole/finance/reconciliation', alert: (d?.reconGaps ?? 0) > 0 },
    { label: 'Audits à analyser', value: d?.auditsToAnalyse, sub: `${d?.auditsNonCompliant ?? 0} non conformes`, icon: ClipboardCheck, href: '/pole/audit/missions', alert: (d?.auditsNonCompliant ?? 0) > 0 },
    { label: 'Produits en validation', value: d?.productsPending, sub: `${d?.productsActive ?? 0} actifs`, icon: Package, href: '/pole/ops/product-lifecycle', alert: false },
    { label: 'Escalades ouvertes', value: d?.escalationsOpen, sub: 'module Travail', icon: Flag, href: '/work/escalations', alert: (d?.escalationsOpen ?? 0) > 0 },
  ];

  const sync = d?.lastSync;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Pilotage opérationnel</CardTitle>
          <CardDescription>Points qui demandent une décision, issus des données réelles.</CardDescription>
        </div>
        <Badge variant="outline" className="gap-1">
          <RefreshCw className="h-3 w-3" />
          {sync
            ? `B.I.B Platform : ${new Date(sync.started_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} · ${sync.status}`
            : 'B.I.B Platform : jamais synchronisée'}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tiles.map(t => (
            <Link key={t.label} to={t.href} className="group rounded-lg border p-4 transition-colors hover:bg-muted/50">
              <div className="flex items-center justify-between">
                <t.icon className={`h-5 w-5 ${t.alert ? 'text-destructive' : 'text-primary'}`} />
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-2 text-2xl font-bold">{isLoading ? '…' : t.value ?? 0}</p>
              <p className="text-sm font-medium">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.sub}</p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
