import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarCheck, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQualityAlerts } from '@/hooks/useQualityAlerts';
import { usePermissions } from '@/hooks/usePermissions';
import { QUALITY_STATUS } from '@/lib/qualityAlerts';

export default function CorrectiveActions() {
  const { can } = usePermissions();
  const allowed = can('audit.nonconformities', 'read');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const query = useQualityAlerts('audit.nonconformities', 'formal', search, 'all', offset, allowed);
  const actions = useMemo(() => (query.data?.rows ?? [])
    .filter((finding) => finding.corrective_action && !finding.archived_at)
    .sort((a, b) => (a.corrective_due_date ?? '9999').localeCompare(b.corrective_due_date ?? '9999')), [query.data?.rows]);
  const now = new Date().toISOString().slice(0, 10);
  const late = actions.filter((finding) => finding.corrective_due_date && finding.corrective_due_date < now && finding.status !== 'closed');
  const pending = actions.filter((finding) => !['closed', 'resolved', 'reviewed'].includes(finding.status));
  const review = actions.filter((finding) => ['resolved', 'reviewed'].includes(finding.status));

  if (!allowed) return <p role="alert">Vous n’avez pas accès au registre des non-conformités.</p>;
  return <div className="space-y-6">
    <header>
      <h1 className="flex items-center gap-2 text-2xl font-semibold"><CalendarCheck className="h-6 w-6" />Actions correctives</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Plan d’action issu des non-conformités formelles : correction, échéance, preuves et validation indépendante.
        Les décisions sont prises dans la fiche du constat d’origine, sans créer un second dossier concurrent.
      </p>
    </header>
    {query.isError && <p role="alert" className="rounded border p-3 text-sm text-destructive">
      Les actions correctives sont indisponibles. <Button size="sm" variant="outline" onClick={() => void query.refetch()}>Réessayer</Button>
    </p>}
    {!query.isLoading && !query.isError && <div className="grid gap-3 sm:grid-cols-3">
      {[
        ['Corrections en cours', pending.length, ClipboardCheck],
        ['En attente de validation', review.length, CalendarCheck],
        ['En retard', late.length, AlertTriangle],
      ].map(([label, count, Icon]) => {
        const C = Icon as typeof CalendarCheck;
        return <Card key={label as string}><CardContent className="p-4">
          <C className="mb-2 h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{label as string}</p>
          <p className="text-2xl font-semibold">{count as number}</p>
        </CardContent></Card>;
      })}
    </div>}
    <Input aria-label="Rechercher une action corrective" placeholder="Rechercher un constat, un fournisseur, une correction…" value={search}
      onChange={(event) => { setSearch(event.target.value); setOffset(0); }} className="max-w-lg" />
    {query.isLoading && <p role="status">Chargement des corrections…</p>}
    {!query.isLoading && !query.isError && <div className="space-y-3">
      {actions.map((finding) => <Card key={finding.id}>
        <CardHeader><CardTitle className="flex flex-wrap items-start justify-between gap-2 text-base">
          <span>{finding.title}</span>
          <Badge variant="outline">{QUALITY_STATUS[finding.status as keyof typeof QUALITY_STATUS] ?? finding.status}</Badge>
        </CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Correction :</strong> {finding.corrective_action}</p>
          <p><strong>Responsable :</strong> {finding.assignee_name || 'Non attribué'}</p>
          <p><strong>Échéance :</strong> {finding.corrective_due_date || 'Non planifiée'}</p>
          {finding.corrective_due_date && finding.corrective_due_date < now && finding.status !== 'closed'
            && <Badge variant="destructive">Échéance dépassée</Badge>}
          <div><Button asChild variant="outline" size="sm">
            <Link to={`/pole/audit/nonconformities?alert=${encodeURIComponent(finding.id)}`}>Voir le constat et les preuves</Link>
          </Button></div>
        </CardContent>
      </Card>)}
      {!actions.length && <p className="text-sm text-muted-foreground">Aucune correction documentée sur cette page.</p>}
    </div>}
    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
      <span>La liste est paginée : les chiffres représentent uniquement les dossiers chargés sur cette page.</span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={!offset || query.isLoading} onClick={() => setOffset(Math.max(0, offset - 50))}>Précédent</Button>
        <Button size="sm" variant="outline" disabled={!query.data?.has_more || query.isLoading} onClick={() => setOffset(offset + 50)}>Suivant</Button>
      </div>
    </div>
  </div>;
}
