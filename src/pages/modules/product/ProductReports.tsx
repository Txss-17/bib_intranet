import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  FileText,
  Lightbulb,
  Loader2,
  Plus,
  Search,
  Ticket,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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

import {
  useCreateProductRecommendation,
  useCreateProductReport,
  useProductRecommendations,
  useProductReports,
  useProductTickets,
  useUpdateProductRecommendationStatus,
  useUpdateProductReportStatus,
  useConvertProductRecommendationToTicket,
  type ProductRecommendation,
  type ProductRecommendationTargetPole,
  type ProductReport,
} from '@/hooks/useRD';

import CreateRecommendationDialog from '@/components/rd/CreateRecommendationDialog';
import { ExportButtons } from '@/components/ExportButtons';

const priorityClass = (
  priority: string,
) => {
  switch (priority) {
    case 'critical':
      return 'bg-destructive text-destructive-foreground';

    case 'high':
      return 'bg-orange-500 text-white';

    case 'medium':
      return 'bg-yellow-500 text-black';

    default:
      return 'bg-muted';
  }
};

const priorityLabel: Record<
  string,
  string
> = {
  critical: 'Critique',
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
};

const reportStatusLabel: Record<
  string,
  string
> = {
  draft: 'Brouillon',
  review: 'En revue',
  published: 'Publié',
  archived: 'Archivé',
};

const targetPoleLabel: Record<
  ProductRecommendationTargetPole,
  string
> = {
  product: 'Produit & Engineering',
  ops: 'Opérations & Logistique',
  supplier: 'Fournisseurs & Produits',
  rse: 'RSE & Impact',
};

function RecommendationCard({
  recommendation,
}: {
  recommendation: ProductRecommendation;
}) {
  const update =
    useUpdateProductRecommendationStatus();

  const convert =
    useConvertProductRecommendationToTicket();

  const [convertOpen, setConvertOpen] =
    useState(false);

  const [pole, setPole] =
    useState<ProductRecommendationTargetPole>(
      recommendation.target_pole ??
        'product',
    );

  const setStatus = async (
    status: string,
  ) => {
    try {
      await update.mutateAsync({
        id: recommendation.id,
        status,
      });

      toast.success(
        `Statut : ${status}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Impossible de modifier le statut',
      );
    }
  };

  const submitConvert = async () => {
    try {
      await convert.mutateAsync({
        recommendation,
        targetPole: pole,
      });

      toast.success(
        'Ticket Produit créé',
      );

      setConvertOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Impossible de créer le ticket',
      );
    }
  };

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm">
            {recommendation.detail}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {recommendation.category && (
              <Badge variant="secondary">
                {String(
                  recommendation.category,
                )}
              </Badge>
            )}

            <Badge
              className={priorityClass(
                recommendation.priority,
              )}
            >
              {priorityLabel[
                recommendation.priority
              ] ??
                recommendation.priority}
            </Badge>

            <Badge variant="outline">
              {recommendation.status}
            </Badge>

            {recommendation.target_pole && (
              <Badge variant="outline">
                {targetPoleLabel[
                  recommendation
                    .target_pole
                ] ??
                  recommendation.target_pole}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        {recommendation.status ===
          'pending' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setStatus('approved')
            }
            disabled={
              update.isPending
            }
          >
            Approuver
          </Button>
        )}

        {recommendation.status !==
          'rejected' &&
          recommendation.status !==
            'in_progress' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setStatus('rejected')
              }
              disabled={
                update.isPending
              }
            >
              Rejeter
            </Button>
          )}

        {!recommendation.ticket_id && (
          <Dialog
            open={convertOpen}
            onOpenChange={
              setConvertOpen
            }
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Ticket className="mr-2 h-4 w-4" />
                Transformer en ticket
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Transmettre la recommandation
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-2">
                <Label>
                  Pôle cible
                </Label>

                <Select
                  value={pole}
                  onValueChange={(value) => {
                    if (
                      value === 'product' ||
                      value === 'ops' ||
                      value === 'supplier' ||
                      value === 'rse'
                    ) {
                      setPole(value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="product">
                      Produit & Engineering
                    </SelectItem>

                    <SelectItem value="ops">
                      Opérations & Logistique
                    </SelectItem>

                    <SelectItem value="supplier">
                      Fournisseurs & Produits
                    </SelectItem>

                    <SelectItem value="rse">
                      RSE & Impact
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  onClick={
                    submitConvert
                  }
                  disabled={
                    convert.isPending
                  }
                >
                  {convert.isPending
                    ? 'Création...'
                    : 'Créer le ticket'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

function ReportsTab({
  reports,
  isLoading,
}: {
  reports: ProductReport[];
  isLoading: boolean;
}) {
  const updateReport =
    useUpdateProductReportStatus();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Aucun rapport produit pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div
          key={report.id}
          className="rounded-xl border p-4"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <FileText className="h-4 w-4" />

                <h3 className="font-medium">
                  {report.title}
                </h3>

                {report.type && (
                  <Badge variant="outline">
                    {report.type}
                  </Badge>
                )}

                <Badge variant="outline">
                  {reportStatusLabel[
                    report.status ??
                      'draft'
                  ] ??
                    report.status ??
                    'Brouillon'}
                </Badge>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                {report.author_name ??
                  'Auteur non renseigné'}
                {' · '}
                {new Date(
                  report.created_at,
                ).toLocaleDateString(
                  'fr-FR',
                )}
              </p>
            </div>

            {report.status !==
              'published' && (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await updateReport.mutateAsync(
                      {
                        id: report.id,
                        status:
                          'published',
                      },
                    );

                    toast.success(
                      'Rapport publié',
                    );
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : 'Impossible de publier le rapport',
                    );
                  }
                }}
                disabled={
                  updateReport.isPending
                }
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Publier
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecommendationsTab({
  recommendations,
}: {
  recommendations: ProductRecommendation[];
}) {
  if (recommendations.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Aucune recommandation pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map(
        (recommendation) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={
              recommendation
            }
          />
        ),
      )}
    </div>
  );
}

function TicketsTab() {
  const {
    data: tickets = [],
    isLoading,
  } = useProductTickets();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Aucun ticket issu d'une recommandation.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-3">
              Ticket
            </th>
            <th className="p-3">
              Pôle
            </th>
            <th className="p-3">
              Statut
            </th>
            <th className="p-3">
              Priorité
            </th>
            <th className="p-3">
              Responsable
            </th>
            <th className="p-3">
              Créé
            </th>
            <th className="p-3 text-right">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {tickets.map((ticket) => (
            <tr
              key={ticket.ticket_id}
              className="border-b last:border-0"
            >
              <td className="max-w-[320px] p-3">
                <div className="truncate font-medium">
                  {ticket.ticket_title ??
                    'Ticket Produit'}
                </div>

                <div className="truncate text-xs text-muted-foreground">
                  {ticket.detail}
                </div>
              </td>

              <td className="p-3">
                <Badge variant="outline">
                  {ticket.target_pole ??
                    'product'}
                </Badge>
              </td>

              <td className="p-3">
                <Badge variant="outline">
                  {ticket.ticket_status}
                </Badge>
              </td>

              <td className="p-3">
                <Badge
                  className={priorityClass(
                    ticket.priority,
                  )}
                >
                  {priorityLabel[
                    ticket.priority
                  ] ??
                    ticket.priority}
                </Badge>
              </td>

              <td className="p-3">
                {ticket.assignee_name ??
                  'Non assigné'}
              </td>

              <td className="p-3 text-xs text-muted-foreground">
                {new Date(
                  ticket.created_at,
                ).toLocaleDateString(
                  'fr-FR',
                )}
              </td>

              <td className="p-3 text-right">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                >
                  <Link
                    to={`/pole/product/tickets/${ticket.ticket_id}`}
                  >
                    Ouvrir
                  </Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ProductReports() {
  const {
    data: reports = [],
    isLoading: reportsLoading,
  } = useProductReports();

  const {
    data: recommendations = [],
  } = useProductRecommendations();

  const {
    data: tickets = [],
  } = useProductTickets();

  const createReport =
    useCreateProductReport();

  const createRecommendation =
    useCreateProductRecommendation();

  const [reportOpen, setReportOpen] =
    useState(false);

  const [reportForm, setReportForm] =
    useState({
      title: '',
      type: 'analysis',
      summary: '',
    });

  const [search, setSearch] =
    useState('');

  const filteredReports =
    useMemo(() => {
      const normalized =
        search.trim().toLowerCase();

      if (!normalized) {
        return reports;
      }

      return reports.filter(
        (report) =>
          `${report.title} ${
            report.type ?? ''
          } ${
            report.author_name ?? ''
          }`
            .toLowerCase()
            .includes(normalized),
      );
    }, [reports, search]);

  const submitReport =
    async () => {
      if (!reportForm.title.trim()) {
        toast.error(
          'Titre requis',
        );
        return;
      }

      try {
        await createReport.mutateAsync(
          {
            title:
              reportForm.title.trim(),
            type: reportForm.type,
            summary:
              reportForm.summary.trim(),
            status: 'draft',
          },
        );

        toast.success(
          'Rapport créé',
        );

        setReportOpen(false);

        setReportForm({
          title: '',
          type: 'analysis',
          summary: '',
        });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Impossible de créer le rapport',
        );
      }
    };

  const stats = {
    reports: reports.length,
    published: reports.filter(
      (report) =>
        report.status ===
        'published',
    ).length,
    recommendations:
      recommendations.length,
    pending:
      recommendations.filter(
        (recommendation) =>
          recommendation.status ===
            'pending' ||
          recommendation.status ===
            'proposed',
      ).length,
    tickets: tickets.length,
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <FileText className="h-7 w-7" />

            <h1 className="text-2xl font-bold">
              Rapports & recommandations
            </h1>

            <Badge variant="outline">
              Produit & Engineering
            </Badge>
          </div>

          <p className="mt-1 max-w-3xl text-muted-foreground">
            Centraliser les analyses produit,
            recommandations, décisions et
            tickets issus des travaux Produit
            & Engineering.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <CreateRecommendationDialog />

          <Dialog
            open={reportOpen}
            onOpenChange={
              setReportOpen
            }
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau rapport
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Nouveau rapport Produit
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>
                    Titre
                  </Label>

                  <Input
                    value={
                      reportForm.title
                    }
                    onChange={(event) =>
                      setReportForm(
                        (current) => ({
                          ...current,
                          title:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </div>

                <div>
                  <Label>
                    Type
                  </Label>

                  <Select
                    value={
                      reportForm.type
                    }
                    onValueChange={(
                      value,
                    ) =>
                      setReportForm(
                        (current) => ({
                          ...current,
                          type: value,
                        }),
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="analysis">
                        Analyse
                      </SelectItem>

                      <SelectItem value="risk">
                        Risque
                      </SelectItem>

                      <SelectItem value="performance">
                        Performance
                      </SelectItem>

                      <SelectItem value="friction">
                        Friction
                      </SelectItem>

                      <SelectItem value="innovation">
                        Innovation
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>
                    Résumé
                  </Label>

                  <Textarea
                    rows={5}
                    value={
                      reportForm.summary
                    }
                    onChange={(event) =>
                      setReportForm(
                        (current) => ({
                          ...current,
                          summary:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={
                    submitReport
                  }
                  disabled={
                    createReport.isPending
                  }
                >
                  {createReport.isPending
                    ? 'Création...'
                    : 'Créer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <FileText className="h-5 w-5" />
            <p className="mt-3 text-3xl font-bold">
              {stats.reports}
            </p>
            <p className="text-sm text-muted-foreground">
              Rapports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <CheckCircle2 className="h-5 w-5" />
            <p className="mt-3 text-3xl font-bold">
              {stats.published}
            </p>
            <p className="text-sm text-muted-foreground">
              Publiés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Lightbulb className="h-5 w-5" />
            <p className="mt-3 text-3xl font-bold">
              {stats.recommendations}
            </p>
            <p className="text-sm text-muted-foreground">
              Recommandations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Clock3 className="h-5 w-5" />
            <p className="mt-3 text-3xl font-bold">
              {stats.pending}
            </p>
            <p className="text-sm text-muted-foreground">
              À traiter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Ticket className="h-5 w-5" />
            <p className="mt-3 text-3xl font-bold">
              {stats.tickets}
            </p>
            <p className="text-sm text-muted-foreground">
              Tickets
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>
                Production Produit
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Analyses et recommandations
                issues des équipes produit.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Rechercher un rapport..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="reports">
            <TabsList>
              <TabsTrigger value="reports">
                Rapports
              </TabsTrigger>

              <TabsTrigger value="recommendations">
                Recommandations
              </TabsTrigger>

              <TabsTrigger value="tickets">
                Tickets
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="reports"
              className="mt-4"
            >
              <ReportsTab
                reports={
                  filteredReports
                }
                isLoading={
                  reportsLoading
                }
              />
            </TabsContent>

            <TabsContent
              value="recommendations"
              className="mt-4"
            >
              <RecommendationsTab
                recommendations={
                  recommendations
                }
              />
            </TabsContent>

            <TabsContent
              value="tickets"
              className="mt-4"
            >
              <TicketsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <ExportButtons
          filename={`bib-product-reports-${new Date()
            .toISOString()
            .slice(0, 10)}`}
          title="Rapports Produit & Engineering"
          columns={[
            {
              header: 'Titre',
              accessor: 'title',
            },
            {
              header: 'Type',
              accessor: 'type',
            },
            {
              header: 'Statut',
              accessor: 'status',
            },
            {
              header: 'Auteur',
              accessor: 'author_name',
            },
            {
              header: 'Créé',
              accessor: 'created_at',
            },
          ]}
          data={filteredReports}
        />
      </div>
    </div>
  );
}