import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { useQualityAlerts } from '@/hooks/useQualityAlerts';
import { QUALITY_STATUS, type QualityKind, type QualityPage } from '@/lib/qualityAlerts';

export default function QualityPreview({ kind = 'all', limit = 5 }: { kind?: QualityKind; limit?: number }) {
  const { can } = usePermissions();
  const page: QualityPage = can('audit.nonconformities', 'read') ? 'audit.nonconformities' : 'supplier.alerts';
  const allowed = can(page, 'read');
  const query = useQualityAlerts(page, kind, '', 'active', 0, allowed);
  if (!allowed) return <p className="text-sm text-muted-foreground">La consultation des constats nécessite un accès Alertes qualité ou Non-conformités.</p>;
  if (query.isLoading) return <p role="status">Chargement des constats…</p>;
  if (query.isError) return <p role="alert">Constats indisponibles. <Button variant="link" onClick={() => void query.refetch()}>Réessayer</Button></p>;
  const rows = query.data?.rows.slice(0, limit) || [];
  const path = page === 'audit.nonconformities' ? '/pole/audit/nonconformities' : '/pole/supplier/alerts';
  return <div className="space-y-3">{!rows.length ? <p className="text-sm text-muted-foreground">Aucun constat actif accessible.</p> : <ul className="divide-y">{rows.map(row => <li key={row.id}><Link className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm hover:underline" to={`${path}?alert=${row.id}`}><span>{row.title}</span><Badge variant={row.severity === 'critical' || row.severity === 'high' ? 'destructive' : 'outline'}>{QUALITY_STATUS[row.status as keyof typeof QUALITY_STATUS]}</Badge></Link></li>)}</ul>}<Button variant="link" asChild className="px-0"><Link to={path}>Ouvrir le suivi qualité</Link></Button><p className="text-xs text-muted-foreground">{limit} fiches récentes au plus, hors archives.</p></div>;
}
