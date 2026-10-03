import { useMemo } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  Package,
  Truck,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  useOrdersWithLifecycle,
  useAdvanceOrderStage,
} from '@/hooks/useOpsControl';

// ============================================================
// PIPELINE
// ============================================================

const STAGES = [
  'created',
  'confirmed',
  'transmitted',
  'accepted',
  'prepared',
  'shipped',
  'delivered',
] as const;

type PipelineStage = (typeof STAGES)[number];

const STAGE_FR: Record<string, string> = {
  created: 'Créée',
  confirmed: 'Confirmée',
  transmitted: 'Transmise',
  accepted: 'Acceptée',
  prepared: 'Préparée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  returned: 'Retournée',
};

const STAGE_DESCRIPTIONS: Record<string, string> = {
  created: 'Commande reçue',
  confirmed: 'Commande confirmée',
  transmitted: 'Transmise aux opérations',
  accepted: 'Prise en charge',
  prepared: 'Commande préparée',
  shipped: 'Expédiée',
  delivered: 'Livrée au client',
};

// ============================================================
// HELPERS
// ============================================================

const getStageLabel = (stage?: string | null) => {
  if (!stage) return 'Créée';

  return (
    STAGE_FR[stage] ??
    stage.replace(/_/g, ' ')
  );
};

const getNextStage = (
  currentStage?: string | null
): PipelineStage | null => {
  const current = currentStage || 'created';

  const index = STAGES.indexOf(
    current as PipelineStage
  );

  if (index === -1 || index >= STAGES.length - 1) {
    return null;
  }

  return STAGES[index + 1];
};

const getStageIndex = (
  currentStage?: string | null
) => {
  const current = currentStage || 'created';

  const index = STAGES.indexOf(
    current as PipelineStage
  );

  return index === -1 ? 0 : index;
};

const formatAmount = (
  amount?: number,
  currency?: string | null
) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(Number(amount ?? 0));
};

// ============================================================
// PAGE
// ============================================================

export default function OrderPipeline() {
  const {
    data: orders = [],
    isLoading,
    isError,
    error,
  } = useOrdersWithLifecycle();

  const advanceOrderStage = useAdvanceOrderStage();

  // ============================================================
  // KPI
  // ============================================================

  const counts = useMemo(() => {
    return STAGES.reduce<Record<string, number>>(
      (acc, stage) => {
        acc[stage] = orders.filter(
          (order) =>
            (order.current_stage || 'created') ===
            stage
        ).length;

        return acc;
      },
      {}
    );
  }, [orders]);

  const activeOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        !['delivered', 'cancelled', 'returned'].includes(
          order.current_stage ?? ''
        )
    ).length;
  }, [orders]);

  const deliveredOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.current_stage === 'delivered'
    ).length;
  }, [orders]);

  // ============================================================
  // ADVANCEMENT
  // ============================================================

  const handleAdvance = (
    orderId: string,
    currentStage?: string | null,
    partnerId?: string | null
  ) => {
    const nextStage = getNextStage(currentStage);

    if (!nextStage) return;

    advanceOrderStage.mutate({
      orderId,
      nextStage,
      ...(partnerId
        ? { partnerId }
        : {}),
    });
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>
            Chargement du cycle de commande...
          </span>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (isError) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">
            Cycle de commande
          </h1>

          <p className="text-muted-foreground">
            Pipeline opérationnel des commandes
          </p>
        </div>

        <Card className="border-destructive/50">
          <CardContent className="py-8">
            <p className="font-medium text-destructive">
              Impossible de charger le pipeline.
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : 'Une erreur Supabase est survenue.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6 p-6">

      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-bold">
          Cycle de commande
        </h1>

        <p className="text-muted-foreground">
          Pipeline complet : de la création à la
          livraison
        </p>
      </div>

      {/* KPI GLOBALS */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">
                Total commandes
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {orders.length}
              </p>
            </div>

            <Package className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">
                En cours
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {activeOrders}
              </p>
            </div>

            <Clock3 className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">
                Livrées
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {deliveredOrders}
              </p>
            </div>

            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">
                Expédiées
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {counts.shipped ?? 0}
              </p>
            </div>

            <Truck className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* PIPELINE */}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {STAGES.map((stage, index) => (
          <Card
            key={stage}
            className="relative overflow-hidden"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase text-muted-foreground">
                {STAGE_FR[stage]}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-2xl font-bold">
                {counts[stage] ?? 0}
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {STAGE_DESCRIPTIONS[stage]}
              </p>
            </CardContent>

            {index < STAGES.length - 1 && (
              <ChevronRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 rounded-full bg-background text-muted-foreground xl:block" />
            )}
          </Card>
        ))}
      </div>

      {/* COMMANDES */}

      <Card>
        <CardHeader>
          <CardTitle>
            Commandes ({orders.length})
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Suivi et avancement opérationnel des commandes
          </p>
        </CardHeader>

        <CardContent>
          {orders.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
              <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />

              <p className="font-medium">
                Aucune commande
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Les commandes synchronisées depuis la
                plateforme apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      N° commande
                    </TableHead>

                    <TableHead>
                      SKU boutique
                    </TableHead>

                    <TableHead>
                      Partenaire
                    </TableHead>

                    <TableHead>
                      Étape
                    </TableHead>

                    <TableHead>
                      Progression
                    </TableHead>

                    <TableHead className="text-right">
                      Montant
                    </TableHead>

                    <TableHead>
                      Créée
                    </TableHead>

                    <TableHead className="text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {orders.map((order) => {
                    const currentStage =
                      order.current_stage ||
                      'created';

                    const nextStage =
                      getNextStage(currentStage);

                    const stageIndex =
                      getStageIndex(currentStage);

                    const progress =
                      Math.round(
                        (stageIndex /
                          (STAGES.length - 1)) *
                          100
                      );

                    return (
                      <TableRow key={order.id}>

                        {/* COMMANDE */}

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-mono text-xs font-medium">
                              {order.order_number}
                            </span>

                            {order.platform_id && (
                              <span className="mt-1 text-[11px] text-muted-foreground">
                                Plateforme :{' '}
                                {order.platform_id.slice(
                                  0,
                                  12
                                )}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* SKU */}

                        <TableCell className="font-mono text-xs">
                          {order.shop_sku ?? '—'}
                        </TableCell>

                        {/* PARTENAIRE */}

                        <TableCell>
                          {order.logistics_partners
                            ?.name ?? '—'}
                        </TableCell>

                        {/* ÉTAPE */}

                        <TableCell>
                          <Badge variant="outline">
                            {getStageLabel(
                              currentStage
                            )}
                          </Badge>
                        </TableCell>

                        {/* PROGRESSION */}

                        <TableCell className="min-w-[180px]">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {progress} %
                              </span>

                              <span className="text-muted-foreground">
                                {stageIndex + 1}/
                                {STAGES.length}
                              </span>
                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{
                                  width: `${progress}%`,
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        {/* MONTANT */}

                        <TableCell className="text-right whitespace-nowrap">
                          {formatAmount(
                            order.total_amount,
                            order.currency
                          )}
                        </TableCell>

                        {/* DATE */}

                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(
                            order.created_at
                          ).toLocaleDateString(
                            'fr-FR'
                          )}
                        </TableCell>

                        {/* ACTION */}

                        <TableCell className="text-right">
                          {nextStage ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={
                                advanceOrderStage.isPending
                              }
                              onClick={() =>
                                handleAdvance(
                                  order.id,
                                  currentStage,
                                  order.partner_id
                                )
                              }
                            >
                              {advanceOrderStage.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <ChevronRight className="mr-2 h-4 w-4" />
                              )}

                              {STAGE_FR[nextStage]}
                            </Button>
                          ) : (
                            <Badge>
                              {currentStage ===
                              'delivered'
                                ? 'Terminée'
                                : '—'}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}