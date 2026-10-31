import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardCheck, FileCheck2, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIntranetRecords } from '@/hooks/useIntranetRecords';
import { usePermissions } from '@/hooks/usePermissions';
import { RECORD_STATUS } from '@/lib/intranet';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';

const show = (v: unknown) => v == null || v === '' ? 'Non renseigné' : String(v);
export default function AuditReports() {
  const { canViewPage } = usePermissions();
  const allowed = canViewPage('audit.reports');
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get('record') ? 'drafts' : 'reports');
  const openReport = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('record', id);
    setParams(next, { replace: true });
    setTab('drafts');
  };
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const query = useIntranetRecords('audit.reports', search, 'all', offset, allowed);
  if (!allowed) return <p role="alert">Accès aux rapports d’audit non autorisé.</p>;
  const rows = query.data?.rows ?? [];
  return <div className="space-y-6">
    <header>
      <h1 className="flex items-center gap-2 text-2xl font-semibold"><ClipboardCheck className="h-6 w-6" />Rapports et conclusions d’audit</h1>
      <p className="mt-2 text-sm text-muted-foreground">Traçabilité des missions, constats, preuves, opinions et plans de suivi entre l'Intranet et BIB Audit Hub.</p>
      <p className="mt-1 text-xs text-muted-foreground">La validation d’un rapport ne clôt pas automatiquement les non-conformités ni les actions correctives.</p>
    </header>
    <div className="grid gap-3 md:grid-cols-2">
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileCheck2 className="h-4 w-4" />Rapports et preuves</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Constats horodatés, pièces contrôlées, revue indépendante et rapport rattaché à une mission.</CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldAlert className="h-4 w-4" />Suivi des conclusions</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Les écarts et actions correctives sont suivis dans <Link className="underline" to="/pole/audit/corrective-actions">Actions correctives</Link> ; leurs décisions restent distinctes.</CardContent></Card>
    </div>
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList><TabsTrigger value="reports">Rapports et opinions</TabsTrigger><TabsTrigger value="drafts">Édition et validations</TabsTrigger></TabsList>
      <TabsContent value="reports" className="space-y-4">
        <Input className="max-w-xl" aria-label="Rechercher les rapports d'audit" value={search}
          placeholder="Entité, auditeur ou référence…" onChange={e => { setSearch(e.target.value); setOffset(0); }} />
        {query.isLoading && <p role="status">Chargement des rapports…</p>}
        {query.isError && <p role="alert" className="rounded border p-3 text-sm text-destructive">
          Rapports indisponibles. <Button size="sm" variant="outline" onClick={() => void query.refetch()}>Réessayer</Button>
        </p>}
        {!query.isLoading && !query.isError && <div className="space-y-3">
          {rows.map(row => <Card key={row.id}>
            <CardHeader><CardTitle className="flex flex-wrap justify-between gap-2 text-base">
              <span>{row.title}</span><Badge variant="outline">{RECORD_STATUS[row.status]}</Badge>
            </CardTitle></CardHeader>
            <CardContent className="grid gap-2 text-sm md:grid-cols-2">
              <p><strong>Entité :</strong> {show(row.payload.entity)}</p>
              <p><strong>Auditeur :</strong> {show(row.payload.auditor)}</p>
              <p><strong>Mission/référence :</strong> {show(row.payload.reference)}</p>
              <p><strong>Périmètre :</strong> {show(row.payload.audit_scope)}</p>
              <p><strong>Opinion :</strong> {show(row.payload.opinion)}</p>
              <p><strong>Plan correctif :</strong> {show(row.payload.corrective_plan_ref)}</p>
              <p className="md:col-span-2"><strong>Faits et preuves :</strong> {show(row.payload.finding)} · {show(row.payload.evidence)}</p>
              <div className="md:col-span-2">
                <Button variant="outline" size="sm" onClick={() => openReport(row.id)}>Ouvrir la fiche et les validations</Button>
              </div>
            </CardContent>
          </Card>)}
          {!rows.length && <p className="text-sm text-muted-foreground">Aucun rapport documenté sur cette page.</p>}
        </div>}
        <div className="flex justify-end gap-2 text-xs">
          <span className="self-center text-muted-foreground">Page {Math.floor(offset / 50) + 1}</span>
          <Button size="sm" variant="outline" disabled={!offset || query.isFetching || query.isError} onClick={() => setOffset(Math.max(0, offset - 50))}>Précédent</Button>
          <Button size="sm" variant="outline" disabled={!query.data?.has_more || query.isFetching || query.isError} onClick={() => setOffset(v => v + 50)}>Suivant</Button>
        </div>
      </TabsContent>
      <TabsContent value="drafts"><ModuleWorkspace pageId="audit.reports" /></TabsContent>
    </Tabs>
  </div>;
}
