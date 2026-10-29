import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Store, AlertTriangle, Scale, ClipboardCheck, Package, Flag, RefreshCw, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useAnomalyStats } from '@/hooks/useAnomalies';
interface CountResult { count: number | null; error: { message: string } | null }
interface CountQuery extends PromiseLike<CountResult> {
 eq(column: string, value: unknown): CountQuery;neq(column: string, value: unknown): CountQuery;
 in(column: string, values: unknown[]): CountQuery;
}
const countSource = supabase as unknown as { from(table: string): { select(fields: string, options: { count: 'exact'; head: true }): CountQuery } };
const count = async (table: string, build?: (query: CountQuery) => CountQuery) => {
 let query = countSource.from(table).select('id', { count: 'exact', head: true });if (build) query = build(query);
 const result = await query;if (result.error) throw new Error(result.error.message);return result.count ?? 0;
};
function useDirectionOps() {
 const { user, profile } = useAuth();
 return useQuery({ queryKey: ['direction-ops', user?.id, profile?.test_account === true], enabled: !!user && !!profile, refetchInterval: 60_000,
  queryFn: async () => {
   const [shopsActive, shopsTest, reconGaps, auditsToAnalyse, auditsNonCompliant, productsPending, productsActive, escalationsOpen, lastSync] = await Promise.all([
    count('shops', query => query.eq('status', 'active')), count('shops', query => query.eq('status', 'test')),
    count('reconciliation_items', query => query.in('status', ['gap','reviewing'])),
    count('field_audits', query => query.in('workflow_status', ['synced','analysis'])),
    count('field_audits', query => query.in('workflow_status', ['non_compliant','corrective_action'])),
    count('products', query => query.in('lifecycle_status', ['review','audit_required','audit'])),
    count('products', query => query.eq('lifecycle_status', 'active')), count('work_escalations', query => query.neq('status', 'resolved')),
    supabase.from('platform_sync_runs').select('status,started_at').order('started_at', { ascending: false }).limit(1).maybeSingle(),
   ]);
   if (lastSync.error) throw lastSync.error;
   return { shopsActive, shopsTest, reconGaps, auditsToAnalyse, auditsNonCompliant, productsPending, productsActive, escalationsOpen, lastSync: lastSync.data };
  },
 });
}
export default function DirectionOpsPanel() {
 const query = useDirectionOps();const anomalies = useAnomalyStats('direction.overview');const { can } = usePermissions();const data = query.data;const sync = data?.lastSync;
 const tiles = [
  { label: 'Boutiques actives', value: data?.shopsActive, sub: `${data?.shopsTest ?? '—'} en test`, icon: Store, href: '/pole/ops/shops', alert: false },
  { label: 'Anomalies actives', value: anomalies.data?.active, sub: `${anomalies.data?.critical ?? '—'} critiques · ${anomalies.data?.overdue ?? '—'} en retard · ${anomalies.data?.awaiting_review ?? '—'} à valider`, icon: AlertTriangle, href: can('ops.anomalies', 'read') ? '/pole/ops/anomalies' : null, alert: (anomalies.data?.critical || 0) + (anomalies.data?.overdue || 0) > 0 },
  { label: 'Écarts financiers', value: data?.reconGaps, sub: 'à examiner par la Finance', icon: Scale, href: '/pole/finance/reconciliation', alert: (data?.reconGaps || 0) > 0 },
  { label: 'Audits à analyser', value: data?.auditsToAnalyse, sub: `${data?.auditsNonCompliant ?? '—'} non conformes`, icon: ClipboardCheck, href: '/pole/audit/missions', alert: (data?.auditsNonCompliant || 0) > 0 },
  { label: 'Produits en validation', value: data?.productsPending, sub: `${data?.productsActive ?? '—'} actifs`, icon: Package, href: '/pole/ops/product-lifecycle', alert: false },
  { label: 'Escalades ouvertes', value: data?.escalationsOpen, sub: 'module Travail', icon: Flag, href: '/work/escalations', alert: (data?.escalationsOpen || 0) > 0 },
 ];
 return <Card><CardHeader className="flex flex-row items-start justify-between space-y-0"><div><CardTitle>Pilotage opérationnel</CardTitle><CardDescription>Points qui demandent une décision, dans l’environnement du compte courant.</CardDescription></div><Badge variant="outline" className="gap-1"><RefreshCw className="h-4 w-4" />{query.isError ? 'Synchronisation indisponible' : sync ? `BIB Platform : ${new Date(sync.started_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} · ${sync.status}` : query.isLoading ? 'Chargement de la synchronisation…' : 'BIB Platform : aucune synchronisation consignée'}</Badge></CardHeader><CardContent>
 {(query.isError || anomalies.isError) && <p role="alert" className="mb-3">Certains indicateurs sont indisponibles. <Button variant="link" onClick={() => { void query.refetch();void anomalies.refetch(); }}>Réessayer</Button></p>}
 <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{tiles.map(tile => {
  const content = <><div className="flex items-center justify-between"><tile.icon className={`h-5 w-5 ${tile.alert ? 'text-destructive' : 'text-primary'}`} />{tile.href && <ArrowUpRight className="h-4 w-4 text-muted-foreground" />}</div><p className="mt-2 text-2xl font-bold">{tile.value ?? '—'}</p><p className="text-sm font-medium">{tile.label}</p><p className="text-xs text-muted-foreground">{tile.sub}</p></>;
  return tile.href ? <Link key={tile.label} to={tile.href} className="rounded-lg border p-4 hover:bg-muted/50">{content}</Link> : <div key={tile.label} className="rounded-lg border p-4">{content}</div>;
 })}</div></CardContent></Card>;
}
