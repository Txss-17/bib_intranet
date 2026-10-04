import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  Globe,
  MapPin,
  Package,
  Store,
  XCircle,
} from 'lucide-react';

import { toast } from 'sonner';

import {
  SHOP_STATUS_LABELS,
  SHOP_TRANSITIONS,
  testDaysLeft,
  useShop,
  useShopEvents,
  useShopOrders,
  useShopActions,
} from '@/hooks/useShops';

import {
  SHOP_ACTIVITY_DOCUMENT_STATUS_LABELS,
  useReviewShopActivityDocument,
  useShopActivityDocuments,
} from '@/hooks/useShopActivityDocuments';

import { Button } from '@/components/ui/button';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { Separator } from '@/components/ui/separator';

import { Textarea } from '@/components/ui/textarea';

import { Input } from '@/components/ui/input';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Skeleton } from '@/components/ui/skeleton';

const statusClasses: Record<string, string> = {
  draft:
    'bg-slate-100 text-slate-700 border-slate-200',

  application:
    'bg-slate-100 text-slate-700 border-slate-200',

  review:
    'bg-blue-50 text-blue-700 border-blue-200',

  test:
    'bg-amber-50 text-amber-700 border-amber-200',

  active:
    'bg-emerald-50 text-emerald-700 border-emerald-200',

  inactive:
    'bg-gray-100 text-gray-700 border-gray-200',

  suspended:
    'bg-orange-50 text-orange-700 border-orange-200',

  closed:
    'bg-red-50 text-red-700 border-red-200',
};

const documentStatusClasses: Record<
  string,
  string
> = {
  pending:
    'bg-amber-50 text-amber-700 border-amber-200',

  approved:
    'bg-emerald-50 text-emerald-700 border-emerald-200',

  rejected:
    'bg-red-50 text-red-700 border-red-200',
};

const formatDate = (
  value?: string | null,
) => {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(new Date(value));
};

const formatDateOnly = (
  value?: string | null,
) => {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      dateStyle: 'medium',
    },
  ).format(new Date(value));
};

const formatMoney = (
  value: number | null | undefined,
  currency = 'EUR',
) =>
  new Intl.NumberFormat(
    'fr-FR',
    {
      style: 'currency',
      currency,
    },
  ).format(Number(value ?? 0));

const eventLabel = (event: {
  action: string | null;
  from_status: string | null;
  to_status: string;
}) => {
  if (event.action === 'created') {
    return 'Boutique créée';
  }

  if (event.action === 'test_extended') {
    return 'Période de test prolongée';
  }

  if (
    event.from_status &&
    event.to_status
  ) {
    return `${
      SHOP_STATUS_LABELS[
        event.from_status as keyof typeof SHOP_STATUS_LABELS
      ] ?? event.from_status
    } → ${
      SHOP_STATUS_LABELS[
        event.to_status as keyof typeof SHOP_STATUS_LABELS
      ] ?? event.to_status
    }`;
  }

  return event.to_status;
};

const ShopDetail = () => {
  const { id } =
    useParams<{ id: string }>();

  const navigate = useNavigate();

  const {
    data: shop,
    isLoading: shopLoading,
    error: shopError,
  } = useShop(id);

  const {
    data: events = [],
    isLoading: eventsLoading,
  } = useShopEvents(id);

  const {
    data: orders = [],
    isLoading: ordersLoading,
  } = useShopOrders(id);

  const {
    data: documents = [],
    isLoading: documentsLoading,
  } = useShopActivityDocuments(id);

  const {
    mutateAsync: reviewDocument,
    isPending: reviewDocumentPending,
  } = useReviewShopActivityDocument();

  const {
    changeStatus,
    extendTest,
  } = useShopActions();

  const [
    statusDialogOpen,
    setStatusDialogOpen,
  ] = useState(false);

  const [
    extensionDialogOpen,
    setExtensionDialogOpen,
  ] = useState(false);

  const [
    documentDialogOpen,
    setDocumentDialogOpen,
  ] = useState(false);

  const [
    targetStatus,
    setTargetStatus,
  ] = useState<string>('');

  const [
    selectedDocument,
    setSelectedDocument,
  ] = useState<
    typeof documents[number] | null
  >(null);

  const [
    documentDecision,
    setDocumentDecision,
  ] = useState<
    'approved' | 'rejected'
  >('approved');

  const [reason, setReason] =
    useState('');

  const [testDays, setTestDays] =
    useState('30');

  const [extensionDays, setExtensionDays] =
    useState('7');

  const summary = useMemo(() => {
    const revenue = orders.reduce(
      (sum, order) =>
        sum +
        Number(
          order.total_amount ?? 0,
        ),
      0,
    );

    const inProgress =
      orders.filter(
        (order) =>
          ![
            'delivered',
            'cancelled',
            'refunded',
          ].includes(
            order.status ?? '',
          ),
      ).length;

    return {
      orders: orders.length,
      revenue,
      inProgress,
    };
  }, [orders]);

  const documentSummary =
    useMemo(() => {
      const pending =
        documents.filter(
          (document) =>
            document.status ===
            'pending',
        ).length;

      const approved =
        documents.filter(
          (document) =>
            document.status ===
            'approved',
        ).length;

      const rejected =
        documents.filter(
          (document) =>
            document.status ===
            'rejected',
        ).length;

      return {
        total: documents.length,
        pending,
        approved,
        rejected,
      };
    }, [documents]);

  if (shopLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />

        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-28 rounded-xl"
            />
          ))}
        </div>

        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (shopError || !shop) {
    return (
      <div className="space-y-4 p-6">
        <Button
          variant="ghost"
          onClick={() =>
            navigate(
              '/pole/ops/shops',
            )
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux boutiques
        </Button>

        <Card>
          <CardContent className="flex min-h-48 items-center justify-center">
            <div className="text-center">
              <XCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />

              <h2 className="font-semibold">
                Boutique introuvable
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Cette boutique n'est pas
                accessible ou n'existe plus.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const daysLeft =
    testDaysLeft(shop);

  const allowedTransitions =
    SHOP_TRANSITIONS[
      shop.status
    ] ?? [];

  const openStatusDialog = (
    status: string,
  ) => {
    setTargetStatus(status);
    setReason('');
    setTestDays('30');
    setStatusDialogOpen(true);
  };

  const submitStatusChange =
    async () => {
      if (!targetStatus) {
        return;
      }

      try {
        await changeStatus.mutateAsync({
          shop,
          to:
            targetStatus as typeof shop.status,
          reason,
          testDurationDays:
            targetStatus === 'test'
              ? Number(testDays)
              : undefined,
        });

        setStatusDialogOpen(false);
        setTargetStatus('');
        setReason('');
      } catch {
        // Le hook affiche déjà l'erreur.
      }
    };

  const submitExtension =
    async () => {
      try {
        await extendTest.mutateAsync({
          shop,
          days: Number(
            extensionDays,
          ),
          reason,
        });

        setExtensionDialogOpen(false);
        setReason('');
      } catch {
        // Le hook affiche déjà l'erreur.
      }
    };

  const openDocumentDecision =
    (
      document: typeof documents[number],
      decision:
        | 'approved'
        | 'rejected',
    ) => {
      setSelectedDocument(
        document,
      );
      setDocumentDecision(
        decision,
      );
      setReason('');
      setDocumentDialogOpen(true);
    };

  const submitDocumentDecision =
    async () => {
      if (!selectedDocument) {
        return;
      }

      if (
        documentDecision ===
          'rejected' &&
        !reason.trim()
      ) {
        toast.error(
          'Une justification est obligatoire pour rejeter le document.',
        );
        return;
      }

      try {
        await reviewDocument({
          documentId:
            selectedDocument.id,
          status:
            documentDecision,
          rejectionReason:
            reason,
        });

        setDocumentDialogOpen(false);
        setSelectedDocument(null);
        setReason('');
      } catch {
        // Le hook affiche déjà l'erreur.
      }
    };

  return (
    <div className="space-y-6 p-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              navigate(
                '/pole/ops/shops',
              )
            }
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {shop.name}
              </h1>

              <Badge
                variant="outline"
                className={
                  statusClasses[
                    shop.status
                  ]
                }
              >
                {
                  SHOP_STATUS_LABELS[
                    shop.status
                  ]
                }
              </Badge>
            </div>

            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>
                {shop.shop_code}
              </span>

              {shop.slug && (
                <span>
                  /{shop.slug}
                </span>
              )}

              <span>
                Créée le{' '}
                {formatDate(
                  shop.created_at,
                )}
              </span>
            </div>
          </div>
        </div>

        {shop.slug && (
          <Button
            variant="outline"
            asChild
          >
            <Link
              to={`/boutiques/${shop.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir la boutique
            </Link>
          </Button>
        )}
      </div>

      {/* =====================================================
          KPI
      ===================================================== */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Commandes
              </span>

              <Package className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="mt-2 text-2xl font-semibold">
              {summary.orders}
            </div>

            <p className="text-xs text-muted-foreground">
              {summary.inProgress}{' '}
              en cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Chiffre d'affaires
              </span>

              <Store className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="mt-2 text-2xl font-semibold">
              {formatMoney(
                summary.revenue,
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Commandes rattachées à
              cette boutique
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Documents d'activité
              </span>

              <FileCheck2 className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="mt-2 text-2xl font-semibold">
              {
                documentSummary.approved
              }
              /
              {
                documentSummary.total
              }
            </div>

            <p className="text-xs text-muted-foreground">
              {documentSummary.pending}{' '}
              à vérifier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Période de test
              </span>

              <Clock3 className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="mt-2 text-2xl font-semibold">
              {shop.status === 'test'
                ? daysLeft !== null
                  ? `${Math.max(
                      daysLeft,
                      0,
                    )} j`
                  : '—'
                : '—'}
            </div>

            <p className="text-xs text-muted-foreground">
              {shop.status === 'test'
                ? `${shop.test_extensions} prolongation(s)`
                : 'Pas en période de test'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        {/* ===================================================
            COLONNE PRINCIPALE
        =================================================== */}

        <div className="space-y-6">
          {/* =================================================
              ACTIVITÉ
          ================================================= */}

          <Card>
            <CardHeader>
              <CardTitle>
                Informations liées à l'activité
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex gap-3">
                  <Store className="mt-0.5 h-4 w-4 text-muted-foreground" />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Type d'activité
                    </p>

                    <p className="font-medium">
                      {(
                        shop as any
                      ).activity_type ??
                        '—'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Store className="mt-0.5 h-4 w-4 text-muted-foreground" />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Catégorie
                    </p>

                    <p className="font-medium">
                      {shop.category ??
                        '—'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Pays d'activité
                    </p>

                    <p className="font-medium">
                      {shop.country ??
                        '—'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Globe className="mt-0.5 h-4 w-4 text-muted-foreground" />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Site / vitrine
                    </p>

                    {(shop as any)
                      .website_url ? (
                      <a
                        href={
                          (
                            shop as any
                          ).website_url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-primary hover:underline break-all"
                      >
                        {
                          (
                            shop as any
                          ).website_url
                        }
                      </a>
                    ) : (
                      <p className="font-medium">
                        —
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground">
                  Description de l'activité
                </p>

                <p className="mt-1 text-sm whitespace-pre-wrap">
                  {(
                    shop as any
                  ).activity_description ??
                    'Aucune description renseignée.'}
                </p>
              </div>

              <Separator />

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Origine de la boutique
                  </p>

                  <p className="font-medium">
                    {shop.app_origin}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Synchronisation plateforme
                  </p>

                  <p className="font-medium">
                    {formatDate(
                      shop.platform_synced_at,
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* =================================================
              DOCUMENTS D'ACTIVITÉ
          ================================================= */}

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>
                    Documents liés à l'activité
                  </CardTitle>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Vérification des documents
                    nécessaires à l'examen de
                    l'activité de la boutique.
                  </p>
                </div>

                <Badge variant="outline">
                  {documentSummary.pending}{' '}
                  à vérifier
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              {documentsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

                  <p className="font-medium">
                    Aucun document d'activité
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Aucun document n'a encore été
                    transmis pour cette boutique.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map(
                    (document) => (
                      <div
                        key={document.id}
                        className="rounded-lg border p-4"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex min-w-0 gap-3">
                            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium">
                                  {
                                    document.title
                                  }
                                </p>

                                <Badge
                                  variant="outline"
                                  className={
                                    documentStatusClasses[
                                      document.status
                                    ]
                                  }
                                >
                                  {
                                    SHOP_ACTIVITY_DOCUMENT_STATUS_LABELS[
                                      document.status
                                    ]
                                  }
                                </Badge>
                              </div>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {
                                  document.document_type
                                }
                              </p>

                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span>
                                  Reçu le{' '}
                                  {formatDate(
                                    document.created_at,
                                  )}
                                </span>

                                {document.issued_at && (
                                  <span>
                                    Émis le{' '}
                                    {formatDateOnly(
                                      document.issued_at,
                                    )}
                                  </span>
                                )}

                                {document.expires_at && (
                                  <span>
                                    Expire le{' '}
                                    {formatDateOnly(
                                      document.expires_at,
                                    )}
                                  </span>
                                )}
                              </div>

                              {document.rejection_reason && (
                                <p className="mt-2 text-sm text-destructive">
                                  Motif du rejet :{' '}
                                  {
                                    document.rejection_reason
                                  }
                                </p>
                              )}

                              {document.document_url && (
                                <a
                                  href={
                                    document.document_url
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-3 inline-flex items-center text-sm font-medium text-primary hover:underline"
                                >
                                  <ExternalLink className="mr-1.5 h-4 w-4" />
                                  Ouvrir le document
                                </a>
                              )}
                            </div>
                          </div>

                          {document.status ===
                            'pending' && (
                            <div className="flex shrink-0 gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  openDocumentDecision(
                                    document,
                                    'approved',
                                  )
                                }
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Valider
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  openDocumentDecision(
                                    document,
                                    'rejected',
                                  )
                                }
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Rejeter
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* =================================================
              CYCLE DE VIE
          ================================================= */}

          <Card>
            <CardHeader>
              <CardTitle>
                Cycle de vie
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Activation
                  </p>

                  <p className="font-medium">
                    {formatDate(
                      shop.activated_at,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Inactivation
                  </p>

                  <p className="font-medium">
                    {formatDate(
                      shop.inactive_at,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Début du test
                  </p>

                  <p className="font-medium">
                    {formatDate(
                      shop.test_started_at,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Fin du test
                  </p>

                  <p className="font-medium">
                    {formatDate(
                      shop.test_ends_at,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Suspension
                  </p>

                  <p className="font-medium">
                    {formatDate(
                      shop.suspended_at,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Clôture
                  </p>

                  <p className="font-medium">
                    {formatDate(
                      shop.closed_at,
                    )}
                  </p>
                </div>
              </div>

              {shop.suspension_reason && (
                <>
                  <Separator />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Dernière justification
                    </p>

                    <p className="mt-1 text-sm">
                      {
                        shop.suspension_reason
                      }
                    </p>
                  </div>
                </>
              )}

              {shop.notes && (
                <>
                  <Separator />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Notes internes
                    </p>

                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {shop.notes}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* =================================================
              COMMANDES
          ================================================= */}

          <Card>
            <CardHeader>
              <CardTitle>
                Dernières commandes
              </CardTitle>
            </CardHeader>

            <CardContent>
              {ordersLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : orders.length ===
                0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Aucune commande rattachée
                  à cette boutique.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="px-3 py-2 font-medium">
                          Commande
                        </th>

                        <th className="px-3 py-2 font-medium">
                          Statut
                        </th>

                        <th className="px-3 py-2 font-medium">
                          Étape
                        </th>

                        <th className="px-3 py-2 font-medium">
                          Montant
                        </th>

                        <th className="px-3 py-2 font-medium">
                          Date
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {orders.map(
                        (order) => (
                          <tr
                            key={
                              order.id
                            }
                            className="border-b last:border-0"
                          >
                            <td className="px-3 py-3 font-medium">
                              {
                                order.order_number
                              }
                            </td>

                            <td className="px-3 py-3">
                              {order.status ??
                                '—'}
                            </td>

                            <td className="px-3 py-3">
                              {order.current_stage ??
                                '—'}
                            </td>

                            <td className="px-3 py-3">
                              {formatMoney(
                                order.total_amount,
                                order.currency ??
                                  'EUR',
                              )}
                            </td>

                            <td className="px-3 py-3 text-muted-foreground">
                              {formatDate(
                                order.created_at,
                              )}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ===================================================
            COLONNE DROITE
        =================================================== */}

        <div className="space-y-6">
          {/* =================================================
              DÉCISION
          ================================================= */}

          <Card>
            <CardHeader>
              <CardTitle>
                Décision de cycle de vie
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {allowedTransitions.length ===
              0 ? (
                <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Cette boutique est dans
                  un état terminal. Aucune
                  transition n'est disponible.
                </div>
              ) : (
                allowedTransitions.map(
                  (status) => (
                    <Button
                      key={status}
                      variant={
                        status === 'closed'
                          ? 'destructive'
                          : 'outline'
                      }
                      className="w-full justify-start"
                      onClick={() =>
                        openStatusDialog(
                          status,
                        )
                      }
                    >
                      {status ===
                      'active' ? (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      ) : status ===
                        'closed' ? (
                        <XCircle className="mr-2 h-4 w-4" />
                      ) : (
                        <Clock3 className="mr-2 h-4 w-4" />
                      )}

                      Passer à «{' '}
                      {
                        SHOP_STATUS_LABELS[
                          status
                        ]
                      }
                      »
                    </Button>
                  ),
                )
              )}

              {shop.status ===
                'test' && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setReason('');
                    setExtensionDays(
                      '7',
                    );
                    setExtensionDialogOpen(
                      true,
                    );
                  }}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Prolonger la période
                  de test
                </Button>
              )}
            </CardContent>
          </Card>

          {/* =================================================
              HISTORIQUE
          ================================================= */}

          <Card>
            <CardHeader>
              <CardTitle>
                Historique du cycle de vie
              </CardTitle>
            </CardHeader>

            <CardContent>
              {eventsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : events.length ===
                0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Aucun événement
                  enregistré.
                </p>
              ) : (
                <div className="space-y-5">
                  {events.map(
                    (event) => (
                      <div
                        key={event.id}
                        className="relative pl-6"
                      >
                        <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />

                        <div className="text-sm font-medium">
                          {eventLabel(
                            event,
                          )}
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          {formatDate(
                            event.performed_at,
                          )}
                        </div>

                        {event.reason && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {event.reason}
                          </p>
                        )}
                      </div>
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* =====================================================
          STATUS DIALOG
      ===================================================== */}

      <Dialog
        open={statusDialogOpen}
        onOpenChange={
          setStatusDialogOpen
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Changer le statut
            </DialogTitle>

            <DialogDescription>
              {shop.name} →{' '}
              {targetStatus
                ? SHOP_STATUS_LABELS[
                    targetStatus as keyof typeof SHOP_STATUS_LABELS
                  ]
                : '—'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {targetStatus ===
              'test' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Durée de test
                </label>

                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={testDays}
                  onChange={(event) =>
                    setTestDays(
                      event.target.value,
                    )
                  }
                />
              </div>
            )}

            {[
              'inactive',
              'suspended',
              'closed',
            ].includes(
              targetStatus,
            ) && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Justification
                </label>

                <Textarea
                  value={reason}
                  onChange={(event) =>
                    setReason(
                      event.target.value,
                    )
                  }
                  placeholder="Indiquez la raison de cette décision."
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setStatusDialogOpen(
                  false,
                )
              }
            >
              Annuler
            </Button>

            <Button
              onClick={
                submitStatusChange
              }
              disabled={
                changeStatus.isPending
              }
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =====================================================
          EXTENSION TEST
      ===================================================== */}

      <Dialog
        open={extensionDialogOpen}
        onOpenChange={
          setExtensionDialogOpen
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Prolonger la période de
              test
            </DialogTitle>

            <DialogDescription>
              Une prolongation sera
              enregistrée dans
              l'historique de la boutique.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Nombre de jours
              </label>

              <Input
                type="number"
                min={1}
                max={90}
                value={extensionDays}
                onChange={(event) =>
                  setExtensionDays(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Motif
              </label>

              <Textarea
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value,
                  )
                }
                placeholder="Motif de la prolongation."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setExtensionDialogOpen(
                  false,
                )
              }
            >
              Annuler
            </Button>

            <Button
              onClick={
                submitExtension
              }
              disabled={
                extendTest.isPending
              }
            >
              Prolonger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =====================================================
          DOCUMENT DECISION
      ===================================================== */}

      <Dialog
        open={documentDialogOpen}
        onOpenChange={
          setDocumentDialogOpen
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {documentDecision ===
              'approved'
                ? 'Valider le document'
                : 'Rejeter le document'}
            </DialogTitle>

            <DialogDescription>
              {selectedDocument?.title ??
                'Document'}
            </DialogDescription>
          </DialogHeader>

          {documentDecision ===
            'rejected' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Motif du rejet
              </label>

              <Textarea
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value,
                  )
                }
                placeholder="Expliquez pourquoi le document ne peut pas être validé."
              />
            </div>
          )}

          {documentDecision ===
            'approved' && (
            <p className="text-sm text-muted-foreground">
              Le document sera marqué
              comme validé et la date de
              validation sera enregistrée.
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDocumentDialogOpen(
                  false,
                )
              }
            >
              Annuler
            </Button>

            <Button
              variant={
                documentDecision ===
                'rejected'
                  ? 'destructive'
                  : 'default'
              }
              onClick={
                submitDocumentDecision
              }
              disabled={
                reviewDocumentPending
              }
            >
              {documentDecision ===
              'approved'
                ? 'Valider le document'
                : 'Rejeter le document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopDetail;
