import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useProductCatalog } from '@/hooks/useOpsControl';
import { useAuth } from '@/hooks/useAuth';
import {
  Search,
  Lock,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Database,
} from 'lucide-react';

type StatusFilter = 'all' | 'active' | 'inactive';

export default function ProductCatalog() {
  const {
    data: items = [],
    isLoading,
    isError,
  } = useProductCatalog();

  const { profile } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('all');

  /*
   * Le SKU interne reste réservé aux profils OPS autorisés
   * et à la direction.
   */
  const canSeeInternalSku =
    profile?.position === 'ops_logistics_manager' ||
    profile?.position === 'ceo' ||
    profile?.poles?.includes('direction');

  const stats = useMemo(() => {
    const active = items.filter(
      (item) => item.is_active,
    ).length;

    const inactive = items.filter(
      (item) => !item.is_active,
    ).length;

    const withBarcode = items.filter(
      (item) => Boolean(item.barcode),
    ).length;

    const withInternalSku = items.filter(
      (item) => Boolean(item.internal_sku),
    ).length;

    const categories = new Set(
      items
        .map((item) => item.category)
        .filter(Boolean),
    ).size;

    const withReorderThreshold = items.filter(
      (item) => Number(item.reorder_threshold ?? 0) > 0,
    ).length;

    return {
      total: items.length,
      active,
      inactive,
      withBarcode,
      withInternalSku,
      categories,
      withReorderThreshold,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item.shop_sku,
          item.internal_sku,
          item.name,
          item.category,
          item.barcode,
          item.packaging_type,
          item.dimensions,
        ].some((value) =>
          (value ?? '').toLowerCase().includes(query),
        );

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.is_active) ||
        (statusFilter === 'inactive' && !item.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement du référentiel produits…
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4 p-6">
        <Card className="border-destructive/30">
          <CardContent className="flex items-center gap-3 py-8">
            <AlertTriangle className="h-5 w-5 text-destructive" />

            <div>
              <p className="font-medium">
                Impossible de charger le référentiel
              </p>

              <p className="text-sm text-muted-foreground">
                Vérifie la connexion à Supabase et les droits
                d'accès à la table product_catalog.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Database className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Référentiel produits
            </h1>

            <p className="mt-1 text-muted-foreground">
              Source de vérité OPS — données préparées et
              transmises aux partenaires.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Références
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {stats.total}
                </p>
              </div>

              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Références actives
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {stats.active}
                </p>
              </div>

              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Catégories
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {stats.categories}
                </p>
              </div>

              <Database className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Avec code-barres
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {stats.withBarcode}
                </p>
              </div>

              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Qualité du référentiel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Complétude opérationnelle
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Références actives</span>
                <span className="font-medium">
                  {stats.total === 0
                    ? 0
                    : Math.round(
                        (stats.active / stats.total) * 100,
                      )}
                  %
                </span>
              </div>

              <Progress
                value={
                  stats.total === 0
                    ? 0
                    : (stats.active / stats.total) * 100
                }
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Avec code-barres</span>
                <span className="font-medium">
                  {stats.total === 0
                    ? 0
                    : Math.round(
                        (stats.withBarcode / stats.total) *
                          100,
                      )}
                  %
                </span>
              </div>

              <Progress
                value={
                  stats.total === 0
                    ? 0
                    : (stats.withBarcode / stats.total) *
                      100
                }
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Seuil de réappro configuré</span>
                <span className="font-medium">
                  {stats.total === 0
                    ? 0
                    : Math.round(
                        (stats.withReorderThreshold /
                          stats.total) *
                          100,
                      )}
                  %
                </span>
              </div>

              <Progress
                value={
                  stats.total === 0
                    ? 0
                    : (stats.withReorderThreshold /
                        stats.total) *
                      100
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Catalogue */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle>
                Catalogue ({filtered.length}
                {filtered.length !== items.length
                  ? ` / ${items.length}`
                  : ''}
                )
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Références actuellement enregistrées dans le
                référentiel OPS.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  placeholder="SKU, nom, catégorie, code-barres…"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  className="pl-9"
                />
              </div>

              <div className="flex gap-2">
                {[
                  ['all', 'Toutes'],
                  ['active', 'Actives'],
                  ['inactive', 'Inactives'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setStatusFilter(
                        value as StatusFilter,
                      )
                    }
                    className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                      statusFilter === value
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
              <Package className="mb-3 h-8 w-8 text-muted-foreground" />

              <p className="font-medium">
                {items.length === 0
                  ? 'Aucune référence dans le catalogue'
                  : 'Aucun résultat'}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {items.length === 0
                  ? 'Le référentiel product_catalog ne contient actuellement aucune référence.'
                  : 'Modifie la recherche ou le filtre de statut.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU boutique</TableHead>

                    <TableHead>
                      SKU interne
                      {!canSeeInternalSku && (
                        <Lock className="ml-1 inline h-3 w-3" />
                      )}
                    </TableHead>

                    <TableHead>Code-barres</TableHead>

                    <TableHead>Nom</TableHead>

                    <TableHead>Catégorie</TableHead>

                    <TableHead className="text-right">
                      Poids brut
                    </TableHead>

                    <TableHead className="text-right">
                      Poids net
                    </TableHead>

                    <TableHead>
                      Packaging
                    </TableHead>

                    <TableHead className="text-right">
                      MOQ
                    </TableHead>

                    <TableHead className="text-right">
                      Seuil réappro
                    </TableHead>

                    <TableHead>
                      État
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs font-medium">
                        {item.shop_sku}
                      </TableCell>

                      <TableCell className="font-mono text-xs">
                        {canSeeInternalSku ? (
                          item.internal_sku ?? '—'
                        ) : (
                          <span className="text-muted-foreground">
                            ••••••
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {item.barcode ?? '—'}
                      </TableCell>

                      <TableCell className="min-w-[180px]">
                        <div>
                          <p className="font-medium">
                            {item.name}
                          </p>

                          {item.dimensions && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.dimensions}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {item.category ? (
                          <Badge variant="outline">
                            {item.category}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {item.weight_gross_g !== null
                          ? `${item.weight_gross_g} g`
                          : '—'}
                      </TableCell>

                      <TableCell className="text-right">
                        {item.weight_net_g !== null
                          ? `${item.weight_net_g} g`
                          : '—'}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {item.packaging_type ?? '—'}
                      </TableCell>

                      <TableCell className="text-right">
                        {Number(item.moq ?? 0).toLocaleString(
                          'fr-FR',
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {Number(
                          item.reorder_threshold ?? 0,
                        ).toLocaleString('fr-FR')}
                      </TableCell>

                      <TableCell>
                        {item.is_active ? (
                          <Badge
                            variant="secondary"
                            className="gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Actif
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="gap-1"
                          >
                            <XCircle className="h-3 w-3" />
                            Inactif
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information de sécurité */}
      {!canSeeInternalSku && (
        <Card className="border-muted">
          <CardContent className="flex items-start gap-3 py-4">
            <Lock className="mt-0.5 h-4 w-4 text-muted-foreground" />

            <div>
              <p className="text-sm font-medium">
                Données internes protégées
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Le SKU interne est masqué pour ce profil.
                Les données nécessaires à l'exploitation
                opérationnelle restent accessibles.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}