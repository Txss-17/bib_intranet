```tsx
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Mail,
  MapPin,
  Package,
  Phone,
  Store,
  User,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  application: 'bg-slate-100 text-slate-700 border-slate-200',
  review: 'bg-blue-50 text-blue-700 border-blue-200',
  test: 'bg-amber-50 text-amber-700 border-amber-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  suspended: 'bg-orange-50 text-orange-700 border-orange-200',
  closed: 'bg-red-50 text-red-700 border-red-200',
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatMoney = (
  value: number | null | undefined,
  currency = 'EUR',
) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(Number(value ?? 0));
};

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

  if (event.from_status && event.to_status) {
    return `${SHOP_STATUS_LABELS[event.from_status as keyof typeof SHOP_STATUS_LABELS] ?? event.from_status} → ${
      SHOP_STATUS_LABELS[event.to_status as keyof typeof SHOP_STATUS_LABELS] ??
      event.to_status
    }`;
  }

  return event.to_status;
};

const ShopDetail = () => {
  const { id } = useParams<{ id: string }>();
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

  const { changeStatus, extendTest } = useShopActions();

  const [statusDialogOpen, setStatusDialogOpen] =
    useState(false);
  const [extensionDialogOpen, setExtensionDialogOpen] =
    useState(false);

  const [targetStatus, setTargetStatus] =
    useState<string>('');
  const [reason, setReason] = useState('');
  const [testDays, setTestDays] = useState('30');
  const [extensionDays, setExtensionDays] =
    useState('7');

  const summary = useMemo(() => {
    const revenue = orders.reduce(
      (sum, order) =>
        sum + Number(order.total_amount ?? 0),
      0,
    );

    const inProgress = orders.filter(
      (order) =>
        ![
          'delivered',
          'cancelled',
          'refunded',
        ].includes(order.status ?? ''),
    ).length;

    return {
      orders: orders.length,
      revenue,
      inProgress,
    };
  }, [orders]);

  if (shopLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
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
            navigate('/pole/ops/shops')
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
                Cette boutique n'est pas accessible ou
                n'existe plus.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const daysLeft = testDaysLeft(shop);
  const allowedTransitions =
    SHOP_TRANSITIONS[shop.status] ?? [];

  const openStatusDialog = (status: string) => {
    setTargetStatus(status);
    setReason('');
    setTestDays('30');
    setStatusDialogOpen(true);
  };

  const submitStatusChange = async () => {
    if (!targetStatus) return;

    await changeStatus.mutateAsync({
      shop,
      to: targetStatus as typeof shop.status,
      reason,
      testDurationDays:
        targetStatus === 'test'
          ? Number(testDays)
          : undefined,
    });

    setStatusDialogOpen(false);
    setTargetStatus('');
    setReason('');
  };

  const submitExtension = async () => {
    await extendTest.mutateAsync({
      shop,
      days: Number(extensionDays),
      reason,
    });

    setExtensionDialogOpen(false);
    setReason('');
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
              navigate('/pole/ops/shops')
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
                  statusClasses[shop.status]
                }
              >
                {SHOP_STATUS_LABELS[shop.status]}
              </Badge>
            </div>

            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>{shop.shop_code}</span>
              {shop.slug && (
                <span>/{shop.slug}</span>
              )}
              <span>
                Créée le {formatDate(shop.created_at)}
              </span>
            </div>
          </div>
        </div>

        {shop.slug && (
          <Button variant="outline" asChild>
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
              {summary.inProgress} en cours
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
              {formatMoney(summary.revenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Commandes rattachées à cette boutique
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Commission
              </span>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {Number(
                shop.commission_rate ?? 0,
              ).toLocaleString('fr-FR')}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              Plan : {shop.subscription_plan ?? '—'}
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
                  ? `${Math.max(daysLeft, 0)} j`
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
            INFORMATIONS
        =================================================== */}

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations boutique</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="flex gap-3">
                <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Marchand
                  </p>
                  <p className="font-medium">
                    {shop.merchant_name ?? '—'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    E-mail
                  </p>
                  <p className="font-medium break-all">
                    {shop.merchant_email ?? '—'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Téléphone
                  </p>
                  <p className="font-medium">
                    {shop.merchant_phone ?? '—'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Pays
                  </p>
                  <p className="font-medium">
                    {shop.country ?? '—'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Catégorie
                </p>
                <p className="font-medium">
                  {shop.category ?? '—'}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Origine
                </p>
                <p className="font-medium">
                  {shop.app_origin}
                </p>
              </div>
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
                    Contrat
                  </p>
                  <p className="font-medium">
                    {shop.contract_status ?? '—'}
                  </p>
                  {shop.contract_signed_at && (
                    <p className="text-xs text-muted-foreground">
                      Signé le{' '}
                      {formatDate(
                        shop.contract_signed_at,
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Activation
                  </p>
                  <p className="font-medium">
                    {formatDate(shop.activated_at)}
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
              </div>

              {shop.suspension_reason && (
                <>
                  <Separator />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Dernière justification
                    </p>
                    <p className="mt-1 text-sm">
                      {shop.suspension_reason}
                    </p>
                  </div>
                </>
              )}

              {shop.notes && (
                <>
                  <Separator />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Notes
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
              ) : orders.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Aucune commande rattachée à cette boutique.
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
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b last:border-0"
                        >
                          <td className="px-3 py-3 font-medium">
                            {order.order_number}
                          </td>
                          <td className="px-3 py-3">
                            {order.status ?? '—'}
                          </td>
                          <td className="px-3 py-3">
                            {order.current_stage ?? '—'}
                          </td>
                          <td className="px-3 py-3">
                            {formatMoney(
                              order.total_amount,
                              order.currency ?? 'EUR',
                            )}
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {formatDate(
                              order.created_at,
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ===================================================
            ACTIONS + HISTORIQUE
        =================================================== */}

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Décision de cycle de vie
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {allowedTransitions.length === 0 ? (
                <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Cette boutique est dans un état terminal.
                  Aucune transition n'est disponible.
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
                      {status === 'active' ? (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      ) : status === 'closed' ? (
                        <XCircle className="mr-2 h-4 w-4" />
                      ) : (
                        <Clock3 className="mr-2 h-4 w-4" />
                      )}

                      Passer à «{' '}
                      {SHOP_STATUS_LABELS[status]}
                      »
                    </Button>
                  ),
                )
              )}

              {shop.status === 'test' && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setReason('');
                    setExtensionDays('7');
                    setExtensionDialogOpen(true);
                  }}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Prolonger la période de test
                </Button>
              )}
            </CardContent>
          </Card>

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
              ) : events.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Aucun événement enregistré.
                </p>
              ) : (
                <div className="space-y-5">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="relative pl-6"
                    >
                      <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />

                      <div className="text-sm font-medium">
                        {eventLabel(event)}
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
                  ))}
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
        onOpenChange={setStatusDialogOpen}
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
            {targetStatus === 'test' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Durée de test
                </label>

                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={testDays}
                  onChange={(e) =>
                    setTestDays(e.target.value)
                  }
```
