import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  Check,
  Clock3,
  Loader2,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  useReplenishment,
  useApproveReplenishment,
  useProductCatalog,
  useOpsPartners,
} from '@/hooks/useOpsControl';

type Priority = 'low' | 'medium' | 'high' | 'critical';
type SuggestionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'executed';

const PRIORITY_LABELS: Record<Priority, string> = {
  critical: 'Critique',
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Faible',
};

const STATUS_LABELS: Record<SuggestionStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvée',
  rejected: 'Rejetée',
  executed: 'Exécutée',
};

export default function Replenishment() {
  const {
    data: suggestions = [],
    isLoading,
    isError,
  } = useReplenishment();

  const {
    data: catalog = [],
    isLoading: catalogLoading,
  } = useProductCatalog();

  const {
    data: partners = [],
    isLoading: partnersLoading,
  } = useOpsPartners();

  const action = useApproveReplenishment();

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<
    'all' | Priority
  >('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | SuggestionStatus
  >('pending');

  const productMap = useMemo(
    () =>
      new Map(
        catalog.map((product) => [
          product.id,
          product,
        ]),
      ),
    [catalog],
  );

  const partnerMap = useMemo(
    () =>
      new Map(
        (partners as Array<{
          id: string;
          name: string;
          region?: string | null;
        }>).map((partner) => [
          partner.id,
          partner,
        ]),
      ),
    [partners],
  );

  const pendingCount = suggestions.filter(
    (suggestion) => suggestion.status === 'pending',
  ).length;

  const approvedCount = suggestions.filter(
    (suggestion) => suggestion.status === 'approved',
  ).length;

  const criticalCount = suggestions.filter(
    (suggestion) =>
      suggestion.status === 'pending' &&
      suggestion.priority === 'critical',
  ).length;

  const totalSuggestedQuantity = suggestions
    .filter((suggestion) => suggestion.status === 'pending')
    .reduce(
      (total, suggestion) =>
        total + Number(suggestion.suggested_quantity ?? 0),
      0,
    );

  const filteredSuggestions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return suggestions.filter((suggestion) => {
      const product = productMap.get(suggestion.catalog_id);

      const sourcePartner = suggestion.source_partner_id
        ? partnerMap.get(suggestion.source_partner_id)
        : undefined;

      const targetPartner = suggestion.target_partner_id
        ? partnerMap.get(suggestion.target_partner_id)
        : undefined;

      const matchesSearch =
        !query ||
        product?.name?.toLowerCase().includes(query) ||
        product?.shop_sku?.toLowerCase().includes(query) ||
        sourcePartner?.name?.toLowerCase().includes(query) ||
        targetPartner?.name?.toLowerCase().includes(query) ||
        suggestion.reason?.toLowerCase().includes(query);

      const matchesPriority =
        priorityFilter === 'all' ||
        suggestion.priority === priorityFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        suggestion.status === statusFilter;

      return (
        matchesSearch &&
        matchesPriority &&
        matchesStatus
      );
    });
  }, [
    suggestions,
    productMap,
    partnerMap,
    search,
    priorityFilter,
    statusFilter,
  ]);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Critique
          </Badge>
        );

      case 'high':
        return (
          <Badge variant="destructive">
            Haute
          </Badge>
        );

      case 'medium':
        return (
          <Badge variant="default">
            Moyenne
          </Badge>
        );

      case 'low':
        return (
          <Badge variant="secondary">
            Faible
          </Badge>
        );

      default:
        return (
          <Badge variant="outline">
            {priority}
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock3 className="h-3 w-3" />
            En attente
          </Badge>
        );

      case 'approved':
        return (
          <Badge variant="secondary" className="gap-1">
            <Check className="h-3 w-3" />
            Approuvée
          </Badge>
        );

      case 'executed':
        return (
          <Badge variant="secondary">
            Exécutée
          </Badge>
        );

      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <X className="h-3 w-3" />
            Rejetée
          </Badge>
        );

      default:
        return (
          <Badge variant="outline">
            {STATUS_LABELS[
              status as SuggestionStatus
            ] ?? status}
          </Badge>
        );
    }
  };

  const handleAction = (
    id: string,
    status: 'approved' | 'rejected',
  ) => {
    action.mutate({
      id,
      status,
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              Réapprovisionnement
            </h1>

            <p className="text-muted-foreground">
              Gestion des suggestions de redistribution entre
              partenaires logistiques.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              En attente
            </p>

            <p className="mt-1 text-2xl font-bold">
              {pendingCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Critiques
            </p>

            <p className="mt-1 text-2xl font-bold">
              {criticalCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Quantité à redistribuer
            </p>

            <p className="mt-1 text-2xl font-bold">
              {totalSuggestedQuantity.toLocaleString('fr-FR')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Déjà approuvées
            </p>

            <p className="mt-1 text-2xl font-bold">
              {approvedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>
                Suggestions ({filteredSuggestions.length})
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Les décisions sont enregistrées dans Supabase.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Produit, SKU, partenaire…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              size="sm"
              variant={
                statusFilter === 'pending'
                  ? 'default'
                  : 'outline'
              }
              onClick={() => setStatusFilter('pending')}
            >
              En attente
            </Button>

            <Button
              size="sm"
              variant={
                statusFilter === 'approved'
                  ? 'default'
                  : 'outline'
              }
              onClick={() => setStatusFilter('approved')}
            >
              Approuvées
            </Button>

            <Button
              size="sm"
              variant={
                statusFilter === 'executed'
                  ? 'default'
                  : 'outline'
              }
              onClick={() => setStatusFilter('executed')}
            >
              Exécutées
            </Button>

            <Button
              size="sm"
              variant={
                statusFilter === 'rejected'
                  ? 'default'
                  : 'outline'
              }
              onClick={() => setStatusFilter('rejected')}
            >
              Rejetées
            </Button>

            <Button
              size="sm"
              variant={
                statusFilter === 'all'
                  ? 'default'
                  : 'outline'
              }
              onClick={() => setStatusFilter('all')}
            >
              Toutes
            </Button>

            <div className="mx-1 hidden h-8 w-px bg-border md:block" />

            {(
              [
                'critical',
                'high',
                'medium',
                'low',
              ] as Priority[]
            ).map((priority) => (
              <Button
                key={priority}
                size="sm"
                variant={
                  priorityFilter === priority
                    ? 'default'
                    : 'outline'
                }
                onClick={() =>
                  setPriorityFilter(priority)
                }
              >
                {PRIORITY_LABELS[priority]}
              </Button>
            ))}

            <Button
              size="sm"
              variant={
                priorityFilter === 'all'
                  ? 'default'
                  : 'outline'
              }
              onClick={() => setPriorityFilter('all')}
            >
              Toutes priorités
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ||
          catalogLoading ||
          partnersLoading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Chargement des suggestions…
              </div>
            </div>
          ) : isError ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
              <AlertTriangle className="mb-3 h-8 w-8 text-destructive" />

              <p className="font-medium">
                Impossible de charger les suggestions
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Vérifie les données de réapprovisionnement dans
                Supabase.
              </p>
            </div>
          ) : filteredSuggestions.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
              <Sparkles className="mb-3 h-8 w-8 text-muted-foreground" />

              <p className="font-medium">
                Aucune suggestion
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Aucune suggestion ne correspond aux filtres
                actuels.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Cible</TableHead>
                    <TableHead className="text-right">
                      Quantité
                    </TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredSuggestions.map((suggestion) => {
                    const product = productMap.get(
                      suggestion.catalog_id,
                    );

                    const sourcePartner =
                      suggestion.source_partner_id
                        ? partnerMap.get(
                            suggestion.source_partner_id,
                          )
                        : undefined;

                    const targetPartner =
                      suggestion.target_partner_id
                        ? partnerMap.get(
                            suggestion.target_partner_id,
                          )
                        : undefined;

                    return (
                      <TableRow key={suggestion.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {product?.name ?? 'Produit inconnu'}
                            </p>

                            {product?.shop_sku && (
                              <p className="text-xs text-muted-foreground">
                                {product.shop_sku}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {sourcePartner?.name ?? '—'}
                            </p>

                            {sourcePartner?.region && (
                              <p className="text-xs text-muted-foreground">
                                {sourcePartner.region}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {targetPartner?.name ?? '—'}
                            </p>

                            {targetPartner?.region && (
                              <p className="text-xs text-muted-foreground">
                                {targetPartner.region}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-semibold">
                          {Number(
                            suggestion.suggested_quantity ?? 0,
                          ).toLocaleString('fr-FR')}
                        </TableCell>

                        <TableCell className="max-w-[280px]">
                          <p
                            className="truncate text-sm text-muted-foreground"
                            title={suggestion.reason}
                          >
                            {suggestion.reason || '—'}
                          </p>
                        </TableCell>

                        <TableCell>
                          {getPriorityBadge(
                            suggestion.priority,
                          )}
                        </TableCell>

                        <TableCell>
                          {getStatusBadge(
                            suggestion.status,
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          {suggestion.status === 'pending' ? (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={action.isPending}
                                title="Approuver"
                                onClick={() =>
                                  handleAction(
                                    suggestion.id,
                                    'approved',
                                  )
                                }
                              >
                                {action.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4 text-success" />
                                )}
                              </Button>

                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={action.isPending}
                                title="Rejeter"
                                onClick={() =>
                                  handleAction(
                                    suggestion.id,
                                    'rejected',
                                  )
                                }
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
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