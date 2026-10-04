import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  Store,
  ExternalLink,
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
  useMarketplaceShop,
  useShopDocuments,
} from '@/hooks/useMarketplace';

import { SHOP_STATUS_LABELS } from '@/hooks/useShops';

export default function MarketplaceStoreDetail() {
  const { id } = useParams();

  const { data: shop, isLoading } =
    useMarketplaceShop(id);

  const { data: documents = [] } =
    useShopDocuments(id);

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Chargement de la boutique…
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Boutique introuvable.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Button
        asChild
        variant="ghost"
        className="-ml-3"
      >
        <Link to="/pole/marketplace/stores">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux boutiques
        </Link>
      </Button>

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <Store className="mt-1 h-6 w-6 text-muted-foreground" />

          <div>
            <h1 className="text-2xl font-semibold">
              {shop.name}
            </h1>

            <p className="text-sm text-muted-foreground">
              {shop.shop_code}
            </p>
          </div>
        </div>

        <Badge
          variant={
            shop.status === 'active'
              ? 'default'
              : 'outline'
          }
        >
          {SHOP_STATUS_LABELS[shop.status]}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Identité de la boutique
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">
                Activité :
              </span>{' '}
              {shop.activity_type || '—'}
            </div>

            <div>
              <span className="text-muted-foreground">
                Description :
              </span>{' '}
              {shop.activity_description || '—'}
            </div>

            <div>
              <span className="text-muted-foreground">
                Catégorie :
              </span>{' '}
              {shop.category || '—'}
            </div>

            <div>
              <span className="text-muted-foreground">
                Pays :
              </span>{' '}
              {shop.country || '—'}
            </div>

            {shop.website_url && (
              <Button
                asChild
                variant="outline"
                size="sm"
              >
                <a
                  href={shop.website_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Site de la boutique
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Commercial
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">
                Abonnement :
              </span>{' '}
              {shop.subscription_plan || '—'}
            </div>

            <div>
              <span className="text-muted-foreground">
                Commission :
              </span>{' '}
              {shop.commission_rate ?? 0}%
            </div>

            <div>
              <span className="text-muted-foreground">
                Créée le :
              </span>{' '}
              {new Date(
                shop.created_at,
              ).toLocaleDateString('fr-FR')}
            </div>

            <div>
              <span className="text-muted-foreground">
                Activée le :
              </span>{' '}
              {shop.activated_at
                ? new Date(
                    shop.activated_at,
                  ).toLocaleDateString(
                    'fr-FR',
                  )
                : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Documents d’activité
          </CardTitle>
        </CardHeader>

        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun document enregistré.
            </p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {doc.title}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {doc.document_type}
                    </p>
                  </div>

                  <Badge variant="outline">
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
