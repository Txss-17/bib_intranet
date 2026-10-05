import { useState } from 'react';
import { format, formatDistanceStrict } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Link2,
  RefreshCw,
  Store,
  Users,
  Wallet,
  Heart,
  ShoppingBag,
  Ticket,
  Truck,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  Separator,
} from '@/components/ui/separator';

import {
  usePlatformActions,
  usePlatformStatus,
  usePlatformSyncRuns,
  type PlatformSyncRun,
} from '@/hooks/usePlatformSync';

const STATUS: Record<
  string,
  {
    label: string;
    variant:
      | 'default'
      | 'secondary'
      | 'destructive'
      | 'outline';
  }
> = {
  running: {
    label: 'En cours',
    variant: 'outline',
  },

  success: {
    label: 'Succès',
    variant: 'default',
  },

  partial: {
    label: 'Partiel',
    variant: 'secondary',
  },

  error: {
    label: 'Erreur',
    variant: 'destructive',
  },
};

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />

        <span className="text-xs">
          {label}
        </span>
      </div>

      <p className="mt-1 text-xl font-semibold">
        {value}
      </p>
    </div>
  );
}

function RunDetail({
  run,
}: {
  run: PlatformSyncRun;
}) {
  const received =
    run.details?.pull?.received;

  const favorites =
    run.details?.favorites;

  const summary =
    run.details?.summary;

  const duration =
    summary?.duration_ms != null
      ? `${(summary.duration_ms / 1000).toFixed(2)} s`
      : run.finished_at
        ? formatDistanceStrict(
            new Date(run.started_at),
            new Date(run.finished_at),
            {
              locale: fr,
            },
          )
        : '—';

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          icon={Users}
          label="Marchands"
          value={received?.merchants ?? 0}
        />

        <Metric
          icon={Store}
          label="Boutiques"
          value={received?.boutiques ?? 0}
        />

        <Metric
          icon={ShoppingBag}
          label="Commandes"
          value={received?.orders ?? 0}
        />

        <Metric
          icon={Ticket}
          label="Tickets"
          value={received?.tickets ?? 0}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-medium">
              Flux complémentaires
            </h3>

            <p className="text-xs text-muted-foreground">
              Données reçues depuis B.I.B Platform
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric
            icon={Truck}
            label="Candidatures fournisseurs"
            value={
              received?.supplier_applications ?? 0
            }
          />

          <Metric
            icon={Wallet}
            label="Flux financiers"
            value={
              received?.financials ?? 0
            }
          />

          <Metric
            icon={Heart}
            label="Favoris clients"
            value={
              received?.customer_favorites?.total ??
              favorites?.received ??
              0
            }
          />
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-medium">
          Favoris clients
        </h3>

        <p className="mt-1 text-xs text-muted-foreground">
          Source de vérité : B.I.B Platform
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Metric
            icon={Heart}
            label="Total"
            value={
              favorites?.received ??
              received?.customer_favorites?.total ??
              0
            }
          />

          <Metric
            icon={ShoppingBag}
            label="Produits"
            value={
              favorites?.products ??
              received?.customer_favorites?.products ??
              0
            }
          />

          <Metric
            icon={Store}
            label="Boutiques"
            value={
              favorites?.boutiques ??
              received?.customer_favorites?.boutiques ??
              0
            }
          />
        </div>

        <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Mode de synchronisation
            </span>

            <Badge variant="outline">
              Snapshot complet
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span>
              Remplacement du snapshot local
            </span>

            <Badge
              variant={
                favorites?.snapshot_replaced
                  ? 'default'
                  : 'outline'
              }
            >
              {favorites?.snapshot_replaced
                ? 'Effectué'
                : 'Non confirmé'}
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-medium">
          Résultat de l'exécution
        </h3>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">
              Éléments synchronisés
            </p>

            <p className="mt-1 text-xl font-semibold">
              {summary?.items_count ??
                run.items_count}
            </p>
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">
              Anomalies
            </p>

            <p className="mt-1 text-xl font-semibold">
              {summary?.errors_count ??
                run.errors?.length ??
                0}
            </p>
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">
              Durée
            </p>

            <p className="mt-1 text-xl font-semibold">
              {duration}
            </p>
          </div>
        </div>
      </div>

      {run.errors?.length > 0 && (
        <>
          <Separator />

          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />

              <h3 className="font-medium text-destructive">
                Anomalies détectées
              </h3>
            </div>

            <div className="mt-3 space-y-2">
              {run.errors.map(
                (error, index) => (
                  <div
                    key={`${run.id}-error-${index}`}
                    className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
                  >
                    {error}
                  </div>
                ),
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function RunRow({
  run,
  onOpen,
}: {
  run: PlatformSyncRun;
  onOpen: () => void;
}) {
  const meta =
    STATUS[run.status] ??
    STATUS.error;

  const favoriteCount =
    run.details?.favorites?.received ??
    run.details?.pull?.received?.customer_favorites
      ?.total ??
    0;

  return (
    <li className="border-t py-3 first:border-t-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={meta.variant}>
              {meta.label}
            </Badge>

            <span className="font-medium">
              {run.direction === 'pull'
                ? 'Lecture'
                : 'Envoi'}
            </span>

            <span className="text-muted-foreground">
              · {run.action}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>
              {run.items_count} élément(s)
            </span>

            {favoriteCount > 0 && (
              <span>
                {favoriteCount} favori(s)
              </span>
            )}

            <span>
              {format(
                new Date(run.started_at),
                'dd MMM yyyy · HH:mm',
                {
                  locale: fr,
                },
              )}
            </span>
          </div>

          {run.errors?.length > 0 && (
            <p className="mt-1 truncate text-xs text-destructive">
              {run.errors[0]}
            </p>
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onOpen}
        >
          Voir le détail
        </Button>
      </div>
    </li>
  );
}

export function PlatformBridgeCard() {
  const {
    data: status,
    isLoading: statusLoading,
  } = usePlatformStatus();

  const {
    data: runs = [],
    isLoading: runsLoading,
  } = usePlatformSyncRuns();

  const {
    pull,
  } = usePlatformActions();

  const [
    selectedRun,
    setSelectedRun,
  ] =
    useState<PlatformSyncRun | null>(
      null,
    );

  const latestRun =
    runs[0] ?? null;

  const latestReceived =
    latestRun?.details?.pull?.received;

  const latestFavorites =
    latestRun?.details?.favorites;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />

              B.I.B Platform

              <Badge
                variant={
                  status?.configured
                    ? 'default'
                    : 'outline'
                }
              >
                {statusLoading
                  ? 'Vérification…'
                  : status?.configured
                    ? 'Connectée'
                    : 'À configurer'}
              </Badge>
            </CardTitle>

            <CardDescription className="mt-1">
              Liaison opérationnelle entre B.I.B Platform
              et BIB Intranet.
            </CardDescription>
          </div>

          <Button
            size="sm"
            onClick={() =>
              pull.mutate()
            }
            disabled={
              pull.isPending ||
              !status?.configured
            }
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                pull.isPending
                  ? 'animate-spin'
                  : ''
              }`}
            />

            {pull.isPending
              ? 'Synchronisation…'
              : 'Synchroniser maintenant'}
          </Button>
        </CardHeader>

        <CardContent className="space-y-5">
          {latestRun ? (
            <>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        Dernière synchronisation
                      </span>

                      <Badge
                        variant={
                          STATUS[
                            latestRun.status
                          ]?.variant ??
                          'outline'
                        }
                      >
                        {
                          STATUS[
                            latestRun.status
                          ]?.label ??
                          latestRun.status
                        }
                      </Badge>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {format(
                        new Date(
                          latestRun.started_at,
                        ),
                        'dd MMMM yyyy · HH:mm',
                        {
                          locale: fr,
                        },
                      )}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setSelectedRun(
                        latestRun,
                      )
                    }
                  >
                    Voir le rapport
                  </Button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Metric
                    icon={Users}
                    label="Marchands"
                    value={
                      latestReceived
                        ?.merchants ?? 0
                    }
                  />

                  <Metric
                    icon={Store}
                    label="Boutiques"
                    value={
                      latestReceived
                        ?.boutiques ?? 0
                    }
                  />

                  <Metric
                    icon={Heart}
                    label="Favoris"
                    value={
                      latestFavorites
                        ?.received ??
                      latestReceived
                        ?.customer_favorites
                        ?.total ??
                      0
                    }
                  />

                  <Metric
                    icon={CheckCircle2}
                    label="Total synchronisé"
                    value={
                      latestRun.items_count
                    }
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />

                    {latestRun.details
                      ?.summary
                      ?.duration_ms != null
                      ? `${(
                          latestRun.details.summary
                            .duration_ms / 1000
                        ).toFixed(2)} s`
                      : 'Durée non disponible'}
                  </span>

                  <span>
                    {latestRun.errors?.length ?? 0}{' '}
                    anomalie(s)
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <p className="font-medium">
                Aucune synchronisation enregistrée
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Lance une première synchronisation pour
                alimenter le journal d'intégration.
              </p>
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="font-medium">
                  Historique des échanges
                </h3>

                <p className="text-xs text-muted-foreground">
                  Les rapports sont conservés dans
                  platform_sync_runs.
                </p>
              </div>
            </div>

            {runsLoading ? (
              <p className="py-4 text-sm text-muted-foreground">
                Chargement de l'historique…
              </p>
            ) : runs.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                Aucun échange enregistré.
              </p>
            ) : (
              <ul className="rounded-lg border px-3">
                {runs.map((run) => (
                  <RunRow
                    key={run.id}
                    run={run}
                    onOpen={() =>
                      setSelectedRun(run)
                    }
                  />
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedRun}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRun(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Rapport de synchronisation B.I.B Platform
            </DialogTitle>

            <DialogDescription>
              {selectedRun
                ? `${selectedRun.direction === 'pull' ? 'Lecture depuis' : 'Envoi vers'} B.I.B Platform · ${format(
                    new Date(
                      selectedRun.started_at,
                    ),
                    'dd MMMM yyyy · HH:mm',
                    {
                      locale: fr,
                    },
                  )}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedRun && (
            <RunDetail
              run={selectedRun}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}