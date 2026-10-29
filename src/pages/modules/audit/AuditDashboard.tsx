import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useFieldAuditRows } from '@/hooks/useFieldAuditRows';
import { useQualityAlerts, useQualityStats } from '@/hooks/useQualityAlerts';
import { auditMetrics, AUDIT_TYPES } from '@/lib/operationsMetrics';
import { QUALITY_STATUS } from '@/lib/qualityAlerts';

export default function AuditDashboard() {
  const { can } = usePermissions();
  const mayReadAudits = can('audit.field', 'read') || can('audit.missions', 'read');
  const mayReadFindings = can('audit.nonconformities', 'read');
  const audits = useFieldAuditRows(mayReadAudits);
  const findings = useQualityAlerts('audit.nonconformities', 'formal', '', 'active', 0, mayReadFindings);
  const quality = useQualityStats('audit.overview', 'formal');
  const stats = audits.data ? auditMetrics(audits.data) : undefined;
  const counts = Object.entries(AUDIT_TYPES).map(([key, label]) => ({ key, label, count: audits.data?.filter(row => row.audit_type === key).length ?? 0 }));
  const recent = findings.data?.rows.slice(0, 5) || [];
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-3xl font-bold">Pôle Audit</h1><p className="text-muted-foreground">Missions, résultats terrain et non-conformités.</p></div><div className="flex gap-2">{can('audit.missions', 'read') && <Button asChild variant="outline"><Link to="/pole/audit/missions">Missions</Link></Button>}{mayReadFindings && <Button asChild><Link to="/pole/audit/nonconformities">Non-conformités</Link></Button>}</div></div>
    {(audits.isError || quality.isError) && <p role="alert">Certains indicateurs sont indisponibles. <Button variant="link" onClick={() => { if (mayReadAudits) void audits.refetch(); void quality.refetch(); }}>Réessayer</Button></p>}
    <p className="text-xs text-muted-foreground">Audits accessibles, toutes dates. Les non-conformités comptent tous les dossiers actifs de cet environnement.</p>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
      ['Audits planifiés', stats?.scheduled ?? '—'], ['Audits en cours', stats?.inProgress ?? '—'],
      ['Non-conformités à traiter', quality.data?.active ?? '—'], ['Score moyen des audits terminés', stats?.average == null ? '—' : `${stats.average.toFixed(1)}%`],
    ].map(([label, value]) => <Card key={label}><CardHeader><CardTitle className="text-sm">{label}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{value}</p></CardContent></Card>)}</div>
    <p className="text-xs text-muted-foreground">{stats?.samples ?? '—'} audit(s) terminé(s) avec un score renseigné entre 0 et 100. Les scores absents restent exclus de la moyenne.</p>
    <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Audits par type</CardTitle></CardHeader><CardContent>{!mayReadAudits ? <p className="text-sm text-muted-foreground">Le détail des missions nécessite un accès Audits terrain ou Missions.</p> : audits.isLoading ? <p role="status">Chargement…</p> : audits.isError ? <p role="alert">Répartition indisponible.</p> : <ul className="space-y-2">{counts.map(({ key, label, count }) => <li key={key} className="flex justify-between"><span>{label}</span><Badge variant="outline">{count}</Badge></li>)}</ul>}</CardContent></Card>
    <Card><CardHeader><CardTitle>Non-conformités actives récentes</CardTitle></CardHeader><CardContent>{!mayReadFindings ? <p className="text-sm text-muted-foreground">Le détail des constats nécessite l’accès Non-conformités.</p> : findings.isError ? <p role="alert">Constats indisponibles. <Button variant="link" onClick={() => void findings.refetch()}>Réessayer</Button></p> : findings.isLoading ? <p role="status">Chargement…</p> : !recent.length ? <p className="text-sm text-muted-foreground">Aucune non-conformité active.</p> : <ul className="divide-y">{recent.map(row => <li key={row.id}><Link className="flex flex-wrap items-center justify-between gap-2 py-3 hover:underline" to={`/pole/audit/nonconformities?alert=${row.id}`}><span>{row.title}</span><Badge variant="outline">{QUALITY_STATUS[row.status as keyof typeof QUALITY_STATUS]}</Badge></Link></li>)}</ul>}</CardContent></Card></div>
  </div>;
}
