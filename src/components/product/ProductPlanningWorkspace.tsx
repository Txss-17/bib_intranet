import { useMemo, useState } from 'react';
import { CalendarDays, ClipboardList, KanbanSquare, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIntranetRecords } from '@/hooks/useIntranetRecords';
import { usePermissions } from '@/hooks/usePermissions';
import { RECORD_STATUS, type ModuleRecord } from '@/lib/intranet';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';

type PlanningMode = 'roadmap' | 'backlog';
const configs = {
  roadmap: {
    page: 'product.roadmap',
    title: 'Roadmap produit',
    intro: 'Échéances, livrables, dépendances et arbitrages du développement de BIB Platform, de l’Intranet et d’Audit Hub.',
    groups: ['En retard', 'À venir', 'Sans échéance'] as const,
  },
  backlog: {
    page: 'product.backlog',
    title: 'Backlog Produit & Engineering',
    intro: 'Priorisation des besoins, critères d’acceptation, incidents fonctionnels et livrables à valider.',
    groups: ['Critique et haute', 'Normale et basse', 'Terminées ou archivées'] as const,
  },
};

function groupFor(record: ModuleRecord, mode: PlanningMode): string {
  if (mode === 'backlog') {
    if (['approved', 'archived'].includes(record.status)) return 'Terminées ou archivées';
    return ['critical', 'high'].includes(record.priority) ? 'Critique et haute' : 'Normale et basse';
  }
  if (!record.due_date) return 'Sans échéance';
  const date = new Date(record.due_date + 'T23:59:59');
  return Number.isNaN(date.getTime()) ? 'Sans échéance' : date.getTime() < Date.now() && !['approved', 'archived'].includes(record.status)
    ? 'En retard'
    : 'À venir';
}

const readable = (value: unknown): string => typeof value === 'string' && value.trim() ? value : 'Non renseigné';

export default function ProductPlanningWorkspace({ mode }: { mode: PlanningMode }) {
  const config = configs[mode];
  const { canViewPage } = usePermissions();
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const query = useIntranetRecords(config.page, search, 'all', offset);
  const rows = query.data?.rows ?? [];
  const grouped = useMemo(() => config.groups.map((label) => ({
    label,
    records: rows.filter((record) => groupFor(record, mode) === label),
  })), [rows, mode, config.groups]);

  if (!canViewPage(config.page)) return <p role="alert">Vous ne disposez pas de l’accès à cette section.</p>;

  return <div className="space-y-6">
    <header className="space-y-2">
      <h1 className="flex items-center gap-2 text-2xl font-semibold">
        {mode === 'roadmap' ? <CalendarDays className="h-6 w-6" /> : <KanbanSquare className="h-6 w-6" />}
        {config.title}
      </h1>
      <p className="max-w-3xl text-sm text-muted-foreground">{config.intro}</p>
      <p className="text-xs text-muted-foreground">
        Planification interne. Une fiche validée ne publie ni version, ni fonctionnalité sur BIB Platform.
        Les décisions et preuves sont enregistrées dans le dossier correspondant.
      </p>
    </header>
    <Tabs defaultValue="planning">
      <TabsList>
        <TabsTrigger value="planning">{mode === 'roadmap' ? 'Échéancier' : 'Priorités'}</TabsTrigger>
        <TabsTrigger value="records">Dossiers et décisions</TabsTrigger>
      </TabsList>
      <TabsContent value="planning" className="space-y-4">
        <div className="relative max-w-xl">
          <Search aria-hidden className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input aria-label="Rechercher dans la planification" className="pl-9" value={search}
            placeholder="Rechercher un livrable ou un besoin…"
            onChange={(event) => { setSearch(event.target.value); setOffset(0); }} />
        </div>
        {query.isLoading && <p role="status">Chargement de la planification…</p>}
        {query.isError && <div role="alert" className="space-y-2 rounded-lg border p-4">
          <p>La planification est indisponible. Aucun résultat n’est confirmé.</p>
          <Button variant="outline" onClick={() => void query.refetch()}>Réessayer</Button>
        </div>}
        {!query.isError && !query.isLoading && <div className="grid gap-4 lg:grid-cols-3">
          {grouped.map((group) => <Card key={group.label} className="h-fit">
            <CardHeader><CardTitle className="flex justify-between text-base">
              <span>{group.label}</span><Badge variant="secondary">{group.records.length}</Badge>
            </CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {!group.records.length && <p className="text-sm text-muted-foreground">Aucun dossier dans cette catégorie.</p>}
              {group.records.map((record) => <article key={record.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="min-w-0 flex-1 break-words font-medium">{record.title}</h3>
                  <Badge variant="outline">{RECORD_STATUS[record.status]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Produit ou parcours : {readable(record.payload.area)}</p>
                <p className="line-clamp-3 text-sm">{readable(record.payload.problem)}</p>
                <dl className="space-y-1 text-xs text-muted-foreground">
                  <div><dt className="inline font-medium">Critères :</dt> <dd className="inline">{readable(record.payload.acceptance)}</dd></div>
                  <div><dt className="inline font-medium">Dépendance :</dt> <dd className="inline">{readable(record.payload.dependency)}</dd></div>
                  <div><dt className="inline font-medium">Version :</dt> <dd className="inline">{readable(record.payload.version)}</dd></div>
                  <div><dt className="inline font-medium">Échéance :</dt> <dd className="inline">{record.due_date ?? 'Non planifiée'}</dd></div>
                </dl>
              </article>)}
            </CardContent>
          </Card>)}
        </div>}
        {!query.isError && !query.isLoading && rows.length === 0 &&
          <p className="text-sm text-muted-foreground">Aucun dossier trouvé dans cette vue.</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={offset === 0 || query.isLoading}
            onClick={() => setOffset(Math.max(0, offset - 50))}>Précédent</Button>
          <span className="self-center text-xs text-muted-foreground">Page {Math.floor(offset / 50) + 1}</span>
          <Button variant="outline" disabled={!query.data?.has_more || query.isLoading}
            onClick={() => setOffset((value) => value + 50)}>Suivant</Button>
        </div>
      </TabsContent>
      <TabsContent value="records" className="mt-4">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <ClipboardList className="h-4 w-4" />
          Créer un dossier, joindre des preuves, affecter un responsable et soumettre les décisions.
        </div>
        <ModuleWorkspace pageId={config.page} />
      </TabsContent>
    </Tabs>
  </div>;
}
