import { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  FileDown,
  FileText,
  GitCompare,
  History,
  MessageSquare,
  Paperclip,
  Plus,
  Search,
  ShieldCheck,
  Workflow,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { toast } from '@/hooks/use-toast';

type Scope =
  | 'global'
  | 'security'
  | 'intranet'
  | 'platform'
  | 'operations';

type DocumentStatus =
  | 'draft'
  | 'review'
  | 'validated';

interface DocumentationSection {
  id: string;
  label: string;
}

interface DocumentationScope {
  id: Scope;
  label: string;
}

interface DocumentationComment {
  author: string;
  text: string;
}

interface DocumentationHistory {
  version: string;
  note: string;
  at: string;
}

interface SecurityDocument {
  id: string;
  title: string;
  scope: Scope;
  section: string;
  version: string;
  status: DocumentStatus;
  owner: string;
  updatedAt: string;
  content: string;
  comments: DocumentationComment[];
  attachments: string[];
  history: DocumentationHistory[];
}

const SCOPES: DocumentationScope[] = [
  {
    id: 'global',
    label: 'Documentation globale',
  },
  {
    id: 'security',
    label: 'Security & IT',
  },
  {
    id: 'intranet',
    label: 'Intranet',
  },
  {
    id: 'platform',
    label: 'Plateforme',
  },
  {
    id: 'operations',
    label: 'Exploitation',
  },
];

const SECTIONS: DocumentationSection[] = [
  {
    id: 'standards',
    label: 'Standards & bonnes pratiques',
  },
  {
    id: 'architecture',
    label: 'Architecture & infrastructure',
  },
  {
    id: 'security',
    label: 'Sécurité & contrôle des accès',
  },
  {
    id: 'identity',
    label: 'Identités & habilitations',
  },
  {
    id: 'monitoring',
    label: 'Supervision & monitoring',
  },
  {
    id: 'logs',
    label: 'Logs & audit technique',
  },
  {
    id: 'api',
    label: 'API & endpoints',
  },
  {
    id: 'integrations',
    label: 'Intégrations',
  },
  {
    id: 'deployment',
    label: 'Déploiement',
  },
  {
    id: 'cicd',
    label: 'CI/CD & rollback',
  },
  {
    id: 'backup',
    label: 'Sauvegardes & continuité',
  },
  {
    id: 'incident',
    label: 'Incidents & procédures',
  },
  {
    id: 'versions',
    label: 'Historique des versions & correctifs',
  },
];

const STATUS_META: Record<
  DocumentStatus,
  {
    label: string;
    variant: 'outline' | 'secondary' | 'default';
  }
> = {
  draft: {
    label: 'Brouillon',
    variant: 'outline',
  },
  review: {
    label: 'En validation',
    variant: 'secondary',
  },
  validated: {
    label: 'Validée',
    variant: 'default',
  },
};

function createDocument(
  input: Partial<SecurityDocument> & {
    title: string;
    scope: Scope;
    section: string;
  },
): SecurityDocument {
  return {
    id: crypto.randomUUID(),
    version: 'v1.2',
    status: 'validated',
    owner: 'Security & IT',
    updatedAt: '2026-09-01',
    content: [
      `# ${input.title}`,
      '',
      'Objectif, périmètre et procédures associées.',
      '',
      '## Points clés',
      '- Prérequis et dépendances',
      '- Contrôles de sécurité',
      '- Étapes opérationnelles',
      '- Vérifications',
      '- Procédure de retour arrière',
    ].join('\n'),
    comments: [],
    attachments: [],
    history: [
      {
        version: 'v1.2',
        note: 'Mise à jour des procédures',
        at: '2026-09-01',
      },
      {
        version: 'v1.1',
        note: 'Ajout des contrôles associés',
        at: '2026-07-14',
      },
      {
        version: 'v1.0',
        note: 'Création',
        at: '2026-04-02',
      },
    ],
    ...input,
  };
}

const INITIAL_DOCUMENTS: SecurityDocument[] = [
  createDocument({
    title: 'Standards de sécurité technique',
    scope: 'security',
    section: 'standards',
  }),
  createDocument({
    title: 'Architecture Security & IT',
    scope: 'security',
    section: 'architecture',
    attachments: ['schema-security-architecture.svg'],
  }),
  createDocument({
    title: 'Politique de sécurité des accès',
    scope: 'security',
    section: 'security',
  }),
  createDocument({
    title: 'Gestion des identités & habilitations',
    scope: 'security',
    section: 'identity',
  }),
  createDocument({
    title: 'Supervision des services critiques',
    scope: 'security',
    section: 'monitoring',
  }),
  createDocument({
    title: 'Journalisation & audit technique',
    scope: 'security',
    section: 'logs',
  }),
  createDocument({
    title: 'Procédures de gestion des incidents',
    scope: 'security',
    section: 'incident',
    status: 'review',
  }),
  createDocument({
    title: 'Sauvegardes & continuité de service',
    scope: 'operations',
    section: 'backup',
  }),
  createDocument({
    title: 'Déploiement sécurisé en production',
    scope: 'global',
    section: 'deployment',
  }),
  createDocument({
    title: 'CI/CD & rollback',
    scope: 'global',
    section: 'cicd',
    status: 'review',
  }),
  createDocument({
    title: 'Intranet — architecture technique',
    scope: 'intranet',
    section: 'architecture',
  }),
  createDocument({
    title: 'Intranet — API interne',
    scope: 'intranet',
    section: 'api',
  }),
  createDocument({
    title: 'Plateforme — intégrations',
    scope: 'platform',
    section: 'integrations',
  }),
  createDocument({
    title: 'Historique des versions & correctifs',
    scope: 'global',
    section: 'versions',
  }),
];

function getScopeLabel(scope: Scope) {
  return (
    SCOPES.find((item) => item.id === scope)?.label ??
    scope
  );
}

function getSectionLabel(section: string) {
  return (
    SECTIONS.find((item) => item.id === section)?.label ??
    section
  );
}

export default function SecurityDocumentation() {
  const [documents, setDocuments] = useState<
    SecurityDocument[]
  >(INITIAL_DOCUMENTS);

  const [scope, setScope] = useState<
    Scope | 'all'
  >('all');

  const [section, setSection] = useState('all');

  const [search, setSearch] = useState('');

  const [openDocument, setOpenDocument] =
    useState<SecurityDocument | null>(null);

  const [compareDocument, setCompareDocument] =
    useState<SecurityDocument | null>(null);

  const [comment, setComment] = useState('');

  const notify = (
    title: string,
    description: string,
  ) => {
    toast({
      title,
      description,
    });
  };

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return documents.filter((document) => {
      const matchesScope =
        scope === 'all' ||
        document.scope === scope;

      const matchesSection =
        section === 'all' ||
        document.section === section;

      if (!normalizedSearch) {
        return matchesScope && matchesSection;
      }

      const searchableContent = [
        document.title,
        document.content,
        document.owner,
        getScopeLabel(document.scope),
        getSectionLabel(document.section),
      ]
        .join(' ')
        .toLowerCase();

      return (
        matchesScope &&
        matchesSection &&
        searchableContent.includes(
          normalizedSearch,
        )
      );
    });
  }, [
    documents,
    scope,
    section,
    search,
  ]);

  const saveDocument = (
    document: SecurityDocument,
  ) => {
    setDocuments((current) =>
      current.some(
        (item) => item.id === document.id,
      )
        ? current.map((item) =>
            item.id === document.id
              ? document
              : item,
          )
        : [document, ...current],
    );
  };

  const exportDocument = (
    document: SecurityDocument,
    format: 'pdf' | 'md',
  ) => {
    if (format === 'md') {
      const blob = new Blob(
        [document.content],
        {
          type: 'text/markdown',
        },
      );

      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');

      anchor.href = url;
      anchor.download = `${document.title
        .replace(/\s+/g, '-')
        .toLowerCase()}.md`;

      anchor.click();

      URL.revokeObjectURL(url);
    } else {
      window.print();
    }

    notify(
      `Export ${format.toUpperCase()} — ${document.title}`,
      'Document préparé pour export.',
    );
  };

  const createNewDocument = () => {
    const newDocument = createDocument({
      title: 'Nouvelle procédure Security & IT',
      scope:
        scope === 'all'
          ? 'security'
          : scope,
      section:
        section === 'all'
          ? 'security'
          : section,
      status: 'draft',
      version: 'v0.1',
      owner: 'Security & IT',
    });

    setOpenDocument(newDocument);
  };

  const publishDocument = (
    document: SecurityDocument,
  ) => {
    const updated = {
      ...document,
      status: 'validated' as const,
    };

    saveDocument(updated);
    setOpenDocument(updated);

    notify(
      'Document validé',
      `${document.title} est maintenant publié.`,
    );
  };

  const sendToReview = (
    document: SecurityDocument,
  ) => {
    const updated = {
      ...document,
      status: 'review' as const,
    };

    saveDocument(updated);
    setOpenDocument(updated);

    notify(
      'Document envoyé en validation',
      document.title,
    );
  };

  const addComment = () => {
    if (!openDocument || !comment.trim()) {
      return;
    }

    setOpenDocument({
      ...openDocument,
      comments: [
        ...openDocument.comments,
        {
          author: 'Vous',
          text: comment.trim(),
        },
      ],
    });

    setComment('');
  };

  const saveNewVersion = () => {
    if (!openDocument) {
      return;
    }

    const currentVersion =
      openDocument.version.match(
        /^v(\d+)\.(\d+)$/,
      );

    const major = currentVersion
      ? Number(currentVersion[1])
      : 0;

    const minor = currentVersion
      ? Number(currentVersion[2]) + 1
      : 1;

    const version = `v${major}.${minor}`;

    const date = new Date()
      .toISOString()
      .slice(0, 10);

    const updatedDocument: SecurityDocument = {
      ...openDocument,
      version,
      updatedAt: date,
      history: [
        {
          version,
          note: 'Mise à jour éditoriale',
          at: date,
        },
        ...openDocument.history,
      ],
    };

    saveDocument(updatedDocument);
    setOpenDocument(null);

    notify(
      'Documentation enregistrée',
      `${updatedDocument.title} — ${version}`,
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-7 w-7" />

            <h1 className="text-3xl font-bold">
              Documentation Security & IT
            </h1>
          </div>

          <p className="mt-1 text-muted-foreground">
            Référentiel des procédures, standards,
            architectures, contrôles et opérations
            techniques de B.I.B.
          </p>
        </div>

        <Badge
          variant="outline"
          className="gap-1.5"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Documentation contrôlée
        </Badge>

        <Button onClick={createNewDocument}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nouvelle page
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                className="pl-10"
                placeholder="Rechercher dans la documentation…"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <Select
              value={scope}
              onValueChange={(value) =>
                setScope(
                  value as Scope | 'all',
                )
              }
            >
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Tous les périmètres
                </SelectItem>

                {SCOPES.map((item) => (
                  <SelectItem
                    key={item.id}
                    value={item.id}
                  >
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={section}
              onValueChange={setSection}
            >
              <SelectTrigger className="w-full md:w-[260px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Toutes les sections
                </SelectItem>

                {SECTIONS.map((item) => (
                  <SelectItem
                    key={item.id}
                    value={item.id}
                  >
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredDocuments.map((document) => {
          const status =
            STATUS_META[document.status];

          return (
            <Card
              key={document.id}
              className="flex flex-col"
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-start justify-between gap-2 text-base">
                  <span>{document.title}</span>

                  <Badge variant={status.variant}>
                    {status.label}
                  </Badge>
                </CardTitle>

                <CardDescription>
                  {getScopeLabel(document.scope)}
                  {' · '}
                  {getSectionLabel(
                    document.section,
                  )}

                  <br />

                  {document.version}
                  {' · '}
                  {document.owner}
                  {' · maj '}
                  {document.updatedAt}
                </CardDescription>
              </CardHeader>

              <CardContent className="mt-auto flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setOpenDocument(document)
                  }
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  Ouvrir
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setCompareDocument(document)
                  }
                >
                  <GitCompare className="mr-1.5 h-3.5 w-3.5" />
                  Versions
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    exportDocument(
                      document,
                      'md',
                    )
                  }
                >
                  <FileDown className="mr-1.5 h-3.5 w-3.5" />
                  MD
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    exportDocument(
                      document,
                      'pdf',
                    )
                  }
                >
                  <FileDown className="mr-1.5 h-3.5 w-3.5" />
                  PDF
                </Button>

                {document.status !==
                  'validated' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      publishDocument(
                        document,
                      )
                    }
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Valider
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}

        {!filteredDocuments.length && (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Aucune page ne correspond à la
              recherche actuelle.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog
        open={!!openDocument}
        onOpenChange={(open) => {
          if (!open) {
            setOpenDocument(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-auto">
          {openDocument && (
            <>
              <DialogHeader>
                <DialogTitle>
                  <Input
                    value={openDocument.title}
                    onChange={(event) =>
                      setOpenDocument({
                        ...openDocument,
                        title:
                          event.target.value,
                      })
                    }
                    className="text-base font-semibold"
                  />
                </DialogTitle>

                <DialogDescription>
                  {openDocument.version}
                  {' · '}
                  {
                    STATUS_META[
                      openDocument.status
                    ].label
                  }
                  {' · '}
                  {openDocument.owner}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="content">
                <TabsList className="flex-wrap">
                  <TabsTrigger value="content">
                    Contenu
                  </TabsTrigger>

                  <TabsTrigger value="comments">
                    <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                    Commentaires
                  </TabsTrigger>

                  <TabsTrigger value="attachments">
                    <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                    Pièces jointes
                  </TabsTrigger>

                  <TabsTrigger value="history">
                    <History className="mr-1.5 h-3.5 w-3.5" />
                    Versions
                  </TabsTrigger>

                  <TabsTrigger value="workflow">
                    <Workflow className="mr-1.5 h-3.5 w-3.5" />
                    Validation
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="content"
                  className="mt-4"
                >
                  <Textarea
                    rows={14}
                    value={openDocument.content}
                    onChange={(event) =>
                      setOpenDocument({
                        ...openDocument,
                        content:
                          event.target.value,
                      })
                    }
                    className="font-mono text-xs"
                  />
                </TabsContent>

                <TabsContent
                  value="comments"
                  className="mt-4 space-y-3"
                >
                  {openDocument.comments.map(
                    (item, index) => (
                      <div
                        key={`${item.author}-${index}`}
                        className="rounded-md border border-border p-3 text-sm"
                      >
                        <p className="text-xs text-muted-foreground">
                          {item.author}
                        </p>

                        <p className="mt-1">
                          {item.text}
                        </p>
                      </div>
                    ),
                  )}

                  {!openDocument.comments
                    .length && (
                    <p className="text-sm text-muted-foreground">
                      Aucun commentaire.
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Input
                      placeholder="Ajouter un commentaire…"
                      value={comment}
                      onChange={(event) =>
                        setComment(
                          event.target.value,
                        )
                      }
                    />

                    <Button
                      disabled={!comment.trim()}
                      onClick={addComment}
                    >
                      Publier
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent
                  value="attachments"
                  className="mt-4 space-y-2"
                >
                  {openDocument.attachments.map(
                    (attachment) => (
                      <div
                        key={attachment}
                        className="flex items-center justify-between rounded-md border border-border p-2 text-sm"
                      >
                        <span className="font-mono text-xs">
                          {attachment}
                        </span>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            notify(
                              'Pièce jointe',
                              attachment,
                            )
                          }
                        >
                          Ouvrir
                        </Button>
                      </div>
                    ),
                  )}

                  {!openDocument.attachments
                    .length && (
                    <p className="text-sm text-muted-foreground">
                      Aucune pièce jointe.
                    </p>
                  )}

                  <Button
                    variant="outline"
                    onClick={() =>
                      setOpenDocument({
                        ...openDocument,
                        attachments: [
                          ...openDocument.attachments,
                          `diagramme-security-${openDocument.attachments.length + 1}.svg`,
                        ],
                      })
                    }
                  >
                    <Paperclip className="mr-1.5 h-4 w-4" />
                    Ajouter un diagramme
                  </Button>
                </TabsContent>

                <TabsContent
                  value="history"
                  className="mt-4 space-y-2"
                >
                  {openDocument.history.map(
                    (item) => (
                      <div
                        key={`${item.version}-${item.at}`}
                        className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 text-sm last:border-0"
                      >
                        <span className="font-mono text-xs">
                          {item.version}
                        </span>

                        <span className="text-muted-foreground">
                          {item.note}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {item.at}
                        </span>
                      </div>
                    ),
                  )}
                </TabsContent>

                <TabsContent
                  value="workflow"
                  className="mt-4 space-y-4"
                >
                  <div className="rounded-md border border-border p-3">
                    <p className="text-sm font-medium">
                      Workflow documentaire
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Brouillon → Revue technique →
                      Validation responsable →
                      Publication.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        sendToReview(
                          openDocument,
                        )
                      }
                    >
                      Envoyer en revue
                    </Button>

                    <Button
                      onClick={() =>
                        publishDocument(
                          openDocument,
                        )
                      }
                    >
                      Valider et publier
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() =>
                    setOpenDocument(null)
                  }
                >
                  Fermer
                </Button>

                <Button onClick={saveNewVersion}>
                  Enregistrer une nouvelle version
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!compareDocument}
        onOpenChange={(open) => {
          if (!open) {
            setCompareDocument(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Comparaison de versions
              {compareDocument
                ? ` — ${compareDocument.title}`
                : ''}
            </DialogTitle>

            <DialogDescription>
              Historique des deux dernières versions
              disponibles.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border p-3 text-sm">
              <p className="mb-2 font-mono text-xs">
                {compareDocument
                  ?.history[1]?.version ??
                  '—'}
              </p>

              <p className="text-muted-foreground">
                {compareDocument
                  ?.history[1]?.note ??
                  'Aucune version antérieure.'}
              </p>
            </div>

            <div className="rounded-md border border-primary/50 bg-primary/5 p-3 text-sm">
              <p className="mb-2 font-mono text-xs">
                {compareDocument
                  ?.history[0]?.version ??
                  '—'}
              </p>

              <p className="text-muted-foreground">
                {compareDocument
                  ?.history[0]?.note ??
                  'Aucune information.'}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}