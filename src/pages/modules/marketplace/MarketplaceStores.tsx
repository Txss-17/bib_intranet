import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  Search,
  Store,
  ArrowRight,
  Filter,
} from 'lucide-react';

import {
  Card,
  CardContent,
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useMarketplaceShops } from '@/hooks/useMarketplace';
import { SHOP_STATUS_LABELS } from '@/hooks/useShops';

export default function MarketplaceStores() {
  const {
    data: shops = [],
    isLoading,
  } = useMarketplaceShops();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState('all');
  const [categoryFilter, setCategoryFilter] =
    useState('all');

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        shops
          .map((shop) => shop.category)
          .filter(
            (category): category is string =>
              Boolean(category),
          ),
      ),
    ).sort((a, b) =>
      a.localeCompare(b, 'fr-FR'),
    );
  }, [shops]);

  const filteredShops = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return shops.filter((shop) => {
      const searchableValues = [
        shop.name,
        shop.shop_code,
        shop.category,
        shop.country,
        shop.activity_type,
        shop.activity_description,
      ];

      const matchesSearch =
        !normalizedSearch ||
        searchableValues
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(normalizedSearch),
          );

      const matchesStatus =
        statusFilter === 'all' ||
        shop.status === statusFilter;

      const matchesCategory =
        categoryFilter === 'all' ||
        shop.category === categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory
      );
    });
  }, [
    shops,
    search,
    statusFilter,
    categoryFilter,
  ]);

  const statusCounts = useMemo(
    () => ({
      active: shops.filter(
        (shop) => shop.status === 'active',
      ).length,

      review: shops.filter(
        (shop) => shop.status === 'review',
      ).length,

      inactive: shops.filter(
        (shop) => shop.status === 'inactive',
      ).length,

      suspended: shops.filter(
        (shop) => shop.status === 'suspended',
      ).length,

      draft: shops.filter(
        (shop) => shop.status === 'draft',
      ).length,

      application: shops.filter(
        (shop) => shop.status === 'application',
      ).length,

      closed: shops.filter(
        (shop) => shop.status === 'closed',
      ).length,
    }),
    [shops],
  );

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-semibold">
          Boutiques
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Référentiel Marketplace de l’ensemble des
          boutiques rattachées aux marchands BIB.
        </p>
      </div>

      {/* Indicateurs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-muted-foreground" />

              <div>
                <p className="text-2xl font-semibold">
                  {shops.length}
                </p>

                <p className="text-xs text-muted-foreground">
                  Toutes les boutiques
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">
              {statusCounts.active}
            </p>

            <p className="text-xs text-muted-foreground">
              Actives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">
              {statusCounts.review}
            </p>

            <p className="text-xs text-muted-foreground">
              En revue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">
              {statusCounts.suspended}
            </p>

            <p className="text-xs text-muted-foreground">
              Suspendues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Référentiel */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>
                Référentiel boutiques Marketplace
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Suivi des boutiques existantes et de leur
                statut dans le cycle Marketplace.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {/* Recherche */}
              <div className="relative min-w-[280px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Rechercher une boutique..."
                  className="pl-9"
                />
              </div>

              {/* Statut */}
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[190px]">
                  <Filter className="mr-2 h-4 w-4" />

                  <SelectValue placeholder="Statut" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    Tous les statuts
                  </SelectItem>

                  <SelectItem value="draft">
                    Brouillon
                  </SelectItem>

                  <SelectItem value="application">
                    Candidature
                  </SelectItem>

                  <SelectItem value="review">
                    En revue
                  </SelectItem>

                  <SelectItem value="active">
                    Active
                  </SelectItem>

                  <SelectItem value="inactive">
                    Inactive
                  </SelectItem>

                  <SelectItem value="suspended">
                    Suspendue
                  </SelectItem>

                  <SelectItem value="closed">
                    Clôturée
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Catégorie */}
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger className="w-[190px]">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    Toutes les catégories
                  </SelectItem>

                  {categories.map((category) => (
                    <SelectItem
                      key={category}
                      value={category}
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chargement des boutiques…
            </p>
          ) : filteredShops.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <Store className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

              <p className="font-medium">
                Aucune boutique trouvée
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Modifiez les critères de recherche ou
                de filtrage.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="px-3 py-3 font-medium">
                        Boutique
                      </th>

                      <th className="px-3 py-3 font-medium">
                        Activité
                      </th>

                      <th className="px-3 py-3 font-medium">
                        Catégorie
                      </th>

                      <th className="px-3 py-3 font-medium">
                        Pays
                      </th>

                      <th className="px-3 py-3 font-medium">
                        Statut
                      </th>

                      <th className="px-3 py-3 font-medium">
                        Abonnement
                      </th>

                      <th className="px-3 py-3 text-right font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredShops.map((shop) => (
                      <tr
                        key={shop.id}
                        className="border-b last:border-0 hover:bg-muted/40"
                      >
                        {/* Boutique */}
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/30">
                              <Store className="h-4 w-4 text-muted-foreground" />
                            </div>

                            <div>
                              <Link
                                to={`/pole/marketplace/stores/${shop.id}`}
                                className="font-medium hover:underline"
                              >
                                {shop.name}
                              </Link>

                              <p className="text-xs text-muted-foreground">
                                {shop.shop_code}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Activité */}
                        <td className="px-3 py-4">
                          {shop.activity_type || '—'}
                        </td>

                        {/* Catégorie */}
                        <td className="px-3 py-4">
                          {shop.category || '—'}
                        </td>

                        {/* Pays */}
                        <td className="px-3 py-4">
                          {shop.country || '—'}
                        </td>

                        {/* Statut */}
                        <td className="px-3 py-4">
                          <Badge
                            variant={
                              shop.status === 'active'
                                ? 'default'
                                : 'outline'
                            }
                          >
                            {SHOP_STATUS_LABELS[
                              shop.status
                            ] || shop.status}
                          </Badge>
                        </td>

                        {/* Abonnement */}
                        <td className="px-3 py-4">
                          {shop.subscription_plan ||
                            '—'}
                        </td>

                        {/* Action */}
                        <td className="px-3 py-4 text-right">
                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                          >
                            <Link
                              to={`/pole/marketplace/stores/${shop.id}`}
                            >
                              Ouvrir
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  {filteredShops.length} boutique
                  {filteredShops.length > 1
                    ? 's'
                    : ''}{' '}
                  affichée
                  {filteredShops.length > 1
                    ? 's'
                    : ''}
                </span>

                <span>
                  {shops.length} au total
                </span>

                {statusCounts.inactive > 0 && (
                  <span>
                    {statusCounts.inactive} inactive
                    {statusCounts.inactive > 1
                      ? 's'
                      : ''}
                  </span>
                )}

                {statusCounts.draft > 0 && (
                  <span>
                    {statusCounts.draft} brouillon
                    {statusCounts.draft > 1
                      ? 's'
                      : ''}
                  </span>
                )}

                {statusCounts.application > 0 && (
                  <span>
                    {statusCounts.application}{' '}
                    candidature
                    {statusCounts.application > 1
                      ? 's'
                      : ''}
                  </span>
                )}

                {statusCounts.closed > 0 && (
                  <span>
                    {statusCounts.closed} clôturée
                    {statusCounts.closed > 1
                      ? 's'
                      : ''}
                  </span>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
