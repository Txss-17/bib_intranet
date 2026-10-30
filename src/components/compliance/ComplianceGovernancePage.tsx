import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Scale, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import { useIntranetRecords } from '@/hooks/useIntranetRecords';
import { RECORD_STATUS } from '@/lib/intranet';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';

type Mode = 'policies' | 'risks';
const configs = {
  policies: {
    id: 'compliance.policies',
    title: 'Politiques, versions et diffusion',
    intro: 'Gouvernance des politiques internes : périmètre, obligation, révision, entrée en vigueur et preuve de publication contrôlée.',
    related: '/pole/compliance/contracts',
    relatedLabel: 'Contrats et accords',
  },
  risks: {
    id: 'compliance.risks',
    title: 'Cartographie des risques de conformité',
    intro: 'Évaluation des risques contractuels, réglementaires et opérationnels : cause, gravité, vraisemblance, contrôles et risque résiduel.',
    related: '/pole/audit/nonconformities',
    relatedLabel: 'Non-conformités Auditées',
  },
};
const show = (v: unknown) => v === null || v === undefined || v === '' ? 'Non renseigné' : String(v);
const numericRisk = (v: unknown) => {
  const n = Number(v);
  return v === null || v === undefined || v === '' || !Number.isFinite(n) ? null : n;
};

export default function ComplianceGovernancePage({ mode }: { mode: Mode }) {
  const config = configs[mode];
  const { canViewPage } = usePermissions();
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const query = useIntranetRecords(config.id, search, 'all', offset);
  if (!canViewPage(config.id)) return <p role="alert">Accès refusé aux dossiers de conformité.</p>;
  const rows = query.data?.rows ?? [];
  return <div className="space-y-6">
    <header className="space-y-2">
      <h1 className="flex items-center gap-2 text-2xl font-semibold">
        {mode === 'policies' ? <ClipboardCheck className="h-6 w-6" /> : <Scale className="h-6 w-6" />}
        {config.title}
      </h1>
      <p className="text-sm text-muted-foreground">{config.intro}</p>
      <Link className="inline-flex items-center gap-1 text-sm text-primary hover:underline" to={config.related}>
        {config.relatedLabel}<ArrowUpRight className="h-4 w-4" />
      </Link>
    </header>
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">{mode === 'policies' ? 'Versions et échéances' : 'Évaluation et contrôles'}</TabsTrigger>
        <TabsTrigger value="records">Instruction et validations</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
        <Input aria-label="Rechercher des dossiers de conformité" placeholder="Référence, sujet ou entité…" className="max-w-lg"
          value={search} onChange={e => { setSearch(e.target.value); setOffset(0); }} />
        {query.isLoading && <p role="status">Chargement des contrôles…</p>}
        {query.isError && <p role="alert" className="rounded border p-3 text-sm text-destructive">
          Source de conformité indisponible. <Button variant="outline" size="sm" onClick={() => void query.refetch()}>Réessayer</Button>
        </p>}
        {!query.isLoading && !query.isError && <div className={mode === 'risks' ? 'space-y-3' : 'grid gap-4 md:grid-cols-2'}>
          {rows.map(row => <Card key={row.id}>
            <CardHeader><CardTitle className="flex flex-wrap justify-between gap-2 text-base">
              <span>{row.title}</span><Badge variant="outline">{RECORD_STATUS[row.status]}</Badge>
            </CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Entité :</strong> {show(row.payload.entity)}</p>
              <p><strong>Exigence :</strong> {show(row.payload.requirement)}</p>
              <p><strong>Fondement :</strong> {show(row.payload.legal_reference)}</p>
              {mode === 'policies' ? <>
                <p><strong>Version :</strong> {show(row.payload.policy_version)}</p>
                <p><strong>Entrée en vigueur :</strong> {show(row.payload.effective_date)}</p>
                <p><strong>Diffusion contrôlée :</strong> {show(row.payload.publication_reference)}</p>
                <p className="text-xs text-muted-foreground">Une politique approuvée sans référence de diffusion n'est pas déclarée publiée.</p>
              </> : <>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Probabilité : {show(row.payload.likelihood)}</Badge>
                  <Badge variant="secondary">Gravité : {show(row.payload.severity)}</Badge>
                  <Badge variant="outline">Risque résiduel : {show(row.payload.residual_risk)}</Badge>
                </div>
                <p><strong>Maîtrise :</strong> {show(row.payload.mitigation)}</p>
                <p><strong>Responsable :</strong> {show(row.payload.control_owner)}</p>
                {numericRisk(row.payload.likelihood) === null || numericRisk(row.payload.severity) === null
                  ? <p className="text-xs text-muted-foreground">La cotation de risque n'est pas suffisamment documentée pour être classée.</p>
                  : <p className="text-xs text-muted-foreground">Cotations documentées ; aucun classement automatisé sans grille validée.</p>}
              </>}
            </CardContent>
          </Card>)}
          {!rows.length && <p className="text-sm text-muted-foreground">Aucun dossier documenté dans cette vue.</p>}
        </div>}
        <div className="flex justify-end gap-2">
          <span className="self-center text-xs text-muted-foreground">Page {Math.floor(offset / 50) + 1} · liste paginée</span>
          <Button variant="outline" size="sm" disabled={!offset || query.isLoading} onClick={() => setOffset(Math.max(0, offset - 50))}>Précédent</Button>
          <Button variant="outline" size="sm" disabled={!query.data?.has_more || query.isLoading} onClick={() => setOffset(v => v + 50)}>Suivant</Button>
        </div>
      </TabsContent>
      <TabsContent value="records" className="mt-4">
        <p className="mb-3 rounded border p-3 text-xs text-muted-foreground">
          L'enregistrement interne n'exécute ni publication juridique ni certification de conformité sur BIB Platform.
        </p>
        <ModuleWorkspace pageId={config.id} />
      </TabsContent>
    </Tabs>
  </div>;
}
