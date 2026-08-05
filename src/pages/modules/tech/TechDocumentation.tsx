import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  BookOpen, Search, Plus, FileDown, FileText, GitCompare, MessageSquare, CheckCircle2,
  Paperclip, Workflow, History,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Scope = 'global' | 'marketplace' | 'intranet' | 'audit-hub' | 'business-os';

const SCOPES: { id: Scope; label: string }[] = [
  { id: 'global', label: 'Documentation globale' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'intranet', label: 'Intranet' },
  { id: 'audit-hub', label: 'Audit Hub' },
  { id: 'business-os', label: 'Business OS' },
];

const SECTIONS = [
  { id: 'standards', label: 'Standards & bonnes pratiques' },
  { id: 'architecture', label: 'Architecture globale' },
  { id: 'securite', label: 'Sécurité' },
  { id: 'fonctionnelle', label: 'Documentation fonctionnelle' },
  { id: 'technique', label: 'Documentation technique' },
  { id: 'api', label: 'Documentation API' },
  { id: 'integrations', label: 'Documentation des intégrations' },
  { id: 'deploiement', label: 'Déploiement' },
  { id: 'cicd', label: 'CI/CD & rollback' },
  { id: 'exploitation', label: 'Exploitation (sauvegardes, monitoring, alertes)' },
  { id: 'versions', label: 'Historique des versions & correctifs' },
];

interface Doc {
  id: string;
  title: string;
  scope: Scope;
  section: string;
  version: string;
  status: 'draft' | 'review' | 'validated';
  owner: string;
  updatedAt: string;
  content: string;
  comments: { author: string; text: string }[];
  attachments: string[];
  history: { version: string; note: string; at: string }[];
}

const doc = (o: Partial<Doc> & { title: string; scope: Scope; section: string }): Doc => ({
  id: Math.random().toString(36).slice(2, 9),
  version: 'v1.2',
  status: 'validated',
  owner: 'Pôle Tech',
  updatedAt: '2026-08-01',
  content: `# ${o.title}\n\nObjectif, périmètre et procédures associées.\n\n## Points clés\n- Prérequis et dépendances\n- Étapes détaillées\n- Vérifications et rollback`,
  comments: [],
  attachments: [],
  history: [
    { version: 'v1.2', note: 'Mise à jour des procédures', at: '2026-08-01' },
    { version: 'v1.1', note: 'Ajout des schémas', at: '2026-06-14' },
    { version: 'v1.0', note: 'Création', at: '2026-04-02' },
  ],
  ...o,
});

const INITIAL: Doc[] = [
  doc({ title: 'Standards de développement', scope: 'global', section: 'standards' }),
  doc({ title: 'Architecture globale de la plateforme', scope: 'global', section: 'architecture', attachments: ['schema-architecture.svg'] }),
  doc({ title: 'Politique de sécurité technique', scope: 'global', section: 'securite' }),
  doc({ title: 'Guide de déploiement Production', scope: 'global', section: 'deploiement' }),
  doc({ title: 'Procédure CI/CD & rollback', scope: 'global', section: 'cicd', status: 'review' }),
  doc({ title: 'Exploitation : sauvegardes & alertes', scope: 'global', section: 'exploitation' }),
  doc({ title: 'Intranet — présentation fonctionnelle', scope: 'intranet', section: 'fonctionnelle' }),
  doc({ title: 'Intranet — architecture technique', scope: 'intranet', section: 'technique' }),
  doc({ title: 'Intranet — API interne', scope: 'intranet', section: 'api' }),
  doc({ title: 'Intranet — intégrations (GitHub, IA, Workspace)', scope: 'intranet', section: 'integrations' }),
  doc({ title: 'Marketplace — processus métiers', scope: 'marketplace', section: 'fonctionnelle' }),
  doc({ title: 'Marketplace — endpoints & erreurs', scope: 'marketplace', section: 'api', status: 'draft' }),
  doc({ title: 'Audit Hub — schémas de données', scope: 'audit-hub', section: 'technique' }),
  doc({ title: 'Business OS — dépendances ERP/CRM', scope: 'business-os', section: 'technique' }),
  doc({ title: 'Historique des versions & correctifs', scope: 'global', section: 'versions' }),
];

const statusMeta = {
  draft: { label: 'Brouillon', variant: 'outline' as const },
  review: { label: 'En validation', variant: 'secondary' as const },
  validated: { label: 'Validée', variant: 'default' as const },
};

export default function TechDocumentation() {
  const [docs, setDocs] = useState<Doc[]>(INITIAL);
  const [scope, setScope] = useState<Scope | 'all'>('all');
  const [section, setSection] = useState('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<Doc | null>(null);
  const [compare, setCompare] = useState<Doc | null>(null);
  const [comment, setComment] = useState('');

  const act = (title: string, description: string) => toast({ title, description });

  const filtered = useMemo(
    () =>
      docs.filter(
        (d) =>
          (scope === 'all' || d.scope === scope) &&
          (section === 'all' || d.section === section) &&
          (d.title.toLowerCase().includes(search.toLowerCase()) || d.content.toLowerCase().includes(search.toLowerCase()))
      ),
    [docs, scope, section, search]
  );

  const save = (d: Doc) => setDocs((l) => (l.some((x) => x.id === d.id) ? l.map((x) => (x.id === d.id ? d : x)) : [d, ...l]));

  const exportDoc = (d: Doc, format: 'pdf' | 'md') => {
    if (format === 'md') {
      const blob = new Blob([d.content], { type: 'text/markdown' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${d.title.replace(/\s+/g, '-').toLowerCase()}.md`;
      a.click();
      URL.revokeObjectURL(a.href);
    } else {
      window.print();
    }
    act(`Export ${format.toUpperCase()} — ${d.title}`, 'Document exporté.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold"><BookOpen className="h-7 w-7" /> Documentation</h1>
          <p className="text-muted-foreground">
            Base de connaissances technique officielle : globale et par projet, versionnée et reliée aux modules du Tech Studio.
          </p>
        </div>
        <Button onClick={() => setOpen(doc({ title: 'Nouvelle page', scope: scope === 'all' ? 'global' : scope, section: section === 'all' ? 'technique' : section, status: 'draft', version: 'v0.1' }))}>
          <Plus className="mr-1.5 h-4 w-4" /> Nouvelle page
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" placeholder="Recherche globale…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={scope} onValueChange={(v) => setScope(v as Scope | 'all')}>
          <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les périmètres</SelectItem>
            {SCOPES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={section} onValueChange={setSection}>
          <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les sections</SelectItem>
            {SECTIONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((d) => (
          <Card key={d.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-start justify-between gap-2 text-base">
                <span>{d.title}</span>
                <Badge variant={statusMeta[d.status].variant}>{statusMeta[d.status].label}</Badge>
              </CardTitle>
              <CardDescription>
                {SCOPES.find((s) => s.id === d.scope)?.label} · {SECTIONS.find((s) => s.id === d.section)?.label}
                <br />
                {d.version} · {d.owner} · maj {d.updatedAt}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-wrap gap-1.5">
              <Button size="sm" variant="outline" onClick={() => setOpen(d)}><FileText className="mr-1.5 h-3.5 w-3.5" /> Ouvrir</Button>
              <Button size="sm" variant="ghost" onClick={() => setCompare(d)}><GitCompare className="mr-1.5 h-3.5 w-3.5" /> Versions</Button>
              <Button size="sm" variant="ghost" onClick={() => exportDoc(d, 'md')}><FileDown className="mr-1.5 h-3.5 w-3.5" /> MD</Button>
              <Button size="sm" variant="ghost" onClick={() => exportDoc(d, 'pdf')}><FileDown className="mr-1.5 h-3.5 w-3.5" /> PDF</Button>
              {d.status !== 'validated' && (
                <Button size="sm" variant="ghost" onClick={() => { save({ ...d, status: 'validated' }); act(`Document validé — ${d.title}`, 'Workflow de validation terminé.'); }}>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Valider
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        {!filtered.length && (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">Aucune page ne correspond à la recherche.</CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-auto">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Input value={open.title} onChange={(e) => setOpen({ ...open, title: e.target.value })} className="text-base font-semibold" />
                </DialogTitle>
                <DialogDescription>{open.version} · {statusMeta[open.status].label} · {open.owner}</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="content">
                <TabsList className="flex-wrap">
                  <TabsTrigger value="content">Contenu</TabsTrigger>
                  <TabsTrigger value="comments"><MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Commentaires</TabsTrigger>
                  <TabsTrigger value="attachments"><Paperclip className="mr-1.5 h-3.5 w-3.5" /> Pièces jointes</TabsTrigger>
                  <TabsTrigger value="history"><History className="mr-1.5 h-3.5 w-3.5" /> Versions</TabsTrigger>
                  <TabsTrigger value="workflow"><Workflow className="mr-1.5 h-3.5 w-3.5" /> Validation</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="mt-4">
                  <Textarea rows={14} value={open.content} onChange={(e) => setOpen({ ...open, content: e.target.value })} className="font-mono text-xs" />
                </TabsContent>

                <TabsContent value="comments" className="mt-4 space-y-3">
                  {open.comments.map((c, i) => (
                    <div key={i} className="rounded-md border border-border p-2 text-sm">
                      <p className="text-xs text-muted-foreground">{c.author}</p>
                      <p>{c.text}</p>
                    </div>
                  ))}
                  {!open.comments.length && <p className="text-sm text-muted-foreground">Aucun commentaire.</p>}
                  <div className="flex gap-2">
                    <Input placeholder="Ajouter un commentaire…" value={comment} onChange={(e) => setComment(e.target.value)} />
                    <Button
                      disabled={!comment.trim()}
                      onClick={() => {
                        setOpen({ ...open, comments: [...open.comments, { author: 'Vous', text: comment }] });
                        setComment('');
                      }}
                    >
                      Publier
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="attachments" className="mt-4 space-y-2">
                  {open.attachments.map((a) => (
                    <div key={a} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                      <span className="font-mono text-xs">{a}</span>
                      <Button size="sm" variant="ghost" onClick={() => act('Pièce jointe', a)}>Ouvrir</Button>
                    </div>
                  ))}
                  {!open.attachments.length && <p className="text-sm text-muted-foreground">Aucune pièce jointe.</p>}
                  <Button
                    variant="outline"
                    onClick={() => setOpen({ ...open, attachments: [...open.attachments, `diagramme-${open.attachments.length + 1}.svg`] })}
                  >
                    <Paperclip className="mr-1.5 h-4 w-4" /> Joindre un diagramme d'architecture
                  </Button>
                </TabsContent>

                <TabsContent value="history" className="mt-4 space-y-2">
                  {open.history.map((h) => (
                    <div key={h.version} className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0">
                      <span className="font-mono text-xs">{h.version}</span>
                      <span className="text-muted-foreground">{h.note}</span>
                      <span className="text-xs text-muted-foreground">{h.at}</span>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="workflow" className="mt-4 space-y-2 text-sm">
                  <p className="text-muted-foreground">Brouillon → Revue technique → Validation responsable → Publication.</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => { setOpen({ ...open, status: 'review' }); act('Envoyée en revue', open.title); }}>Envoyer en revue</Button>
                    <Button onClick={() => { setOpen({ ...open, status: 'validated' }); act('Document validé', open.title); }}>Valider et publier</Button>
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(null)}>Fermer</Button>
                <Button
                  onClick={() => {
                    const bumped = Number(open.version.replace(/[^\d.]/g, '').split('.')[1] ?? 0) + 1;
                    const version = `v${open.version.replace(/[^\d.]/g, '').split('.')[0]}.${bumped}`;
                    save({
                      ...open,
                      version,
                      updatedAt: new Date().toISOString().slice(0, 10),
                      history: [{ version, note: 'Mise à jour éditoriale', at: new Date().toISOString().slice(0, 10) }, ...open.history],
                    });
                    setOpen(null);
                    act('Documentation enregistrée', `${open.title} — ${version}`);
                  }}
                >
                  Enregistrer une nouvelle version
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!compare} onOpenChange={(o) => !o && setCompare(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comparaison de versions — {compare?.title}</DialogTitle>
            <DialogDescription>Écarts entre les deux dernières versions.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-md border border-border p-3">
              <p className="mb-2 font-mono text-xs">{compare?.history[1]?.version ?? '—'}</p>
              <p className="text-muted-foreground">{compare?.history[1]?.note ?? 'Aucune version antérieure.'}</p>
            </div>
            <div className="rounded-md border border-primary/50 bg-primary/5 p-3">
              <p className="mb-2 font-mono text-xs">{compare?.history[0]?.version}</p>
              <p className="text-muted-foreground">{compare?.history[0]?.note}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
