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
  const { data: shops = [], isLoading } =
    useMarketplaceShops();

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
    ).sort();
  }, [shops]);

  const filteredShops = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return shops.filter((shop) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          shop.name,
          shop.shop_code,
          shop.category,
          shop.country,
          shop.activity_type,
        ]
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

  const activeCount = shops.filter(
    (shop) => shop.status === 'active',
  ).length;

  const reviewCount = shops.filter(
    (shop) => shop.status === 'review',
  ).length;

  const suspendedCount = shops.filter(
    (shop) => shop.status === 'suspended',
  ).length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Boutiques
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Vue Marketplace de l’ensemble des boutiques
          rattachées aux marchands BIB.
        </p>
      </div>

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
              {activeCount}
            </p>

            <p className="text-xs text-muted-foreground">
              Boutiques actives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">
              {reviewCount}
            </p>

            <p className="text-xs text-muted-foreground">
              En revue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">
              {suspendedCount}
            </p>

            <p className="text-xs text-muted-foreground">
              Suspendues
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>
              Référentiel boutiques Marketplace
            </CardTitle>

            <div className="flex flex-col gap-2 sm:flex-row">
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

              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
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

              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger className="w-[180px]">
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
                Modifie les critères de recherche ou de
                filtrage.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-3 py-3 font-medium">
                      Boutique
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
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/30">
                            <Store className="h-4 w-4 text-muted-foreground" />
                          </div>

                          <div>
                            <Link
                              to={
                                '/pole/marketplace/stores/' +
                                shop.id
                              }
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

                      <td className="px-3 py-4">
                        {shop.category || '—'}
                      </td>

                      <td className="px-3 py-4">
                        {shop.country || '—'}
                      </td>

                      <td className="px-3 py-4">
                        <Badge
                          variant={
                            shop.status === 'active'
                              ? 'default'
                              : 'outline'
                          }
                        >
                          {
                            SHOP_STATUS_LABELS[
                              shop.status
                            ]
                          }
                        </Badge>
                      </td>

                      <td className="px-3 py-4">
                        {shop.subscription_plan ||
                          '—'}
                      </td>

                      <td className="px-3 py-4 text-right">
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                        >
                          <Link
                            to={
                              '/pole/marketplace/stores/' +
                              shop.id
                            }
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
          )}

          {!isLoading &&
            filteredShops.length > 0 && (
              <div className="mt-4 text-xs text-muted-foreground">
                {filteredShops.length} boutique
                {filteredShops.length > 1
                  ? 's'
                  : ''}{' '}
                affichée
                {filteredShops.length > 1
                  ? 's'
                  : ''}
                {' sur '}
                {shops.length}.
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
