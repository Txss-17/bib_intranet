import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Store,
  FileText,
  TrendingUp,
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
  useMarketplaceMerchant,
  useMerchantPortfolio,
  useMerchantShops,
  useMerchantCommunications,
} from '@/hooks/useMarketplace';

import { SHOP_STATUS_LABELS } from '@/hooks/useShops';

export default function MerchantDetail() {
  const { id } = useParams();

  const navigate = useNavigate();
  
  const { data: merchant, isLoading } =
    useMarketplaceMerchant(id);

  const { data: shops = [] } =
    useMerchantShops(id);

  const { data: assignment } =
    useMerchantPortfolio(id);

  const { data: communications = [] } =
    useMerchantCommunications(id);

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Chargement du marchand…
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Marchand introuvable.
      </div>
    );
  }

  const portfolio = Array.isArray(
    (assignment as any)?.merchant_portfolios,
  )
    ? (assignment as any).merchant_portfolios[0]
    : (assignment as any)?.merchant_portfolios;

  return (
    <div className="space-y-6 p-6">
      <Button
        asChild
        variant="ghost"
        className="-ml-3"
      >
        <Link to="/pole/marketplace/merchants">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux marchands
        </Link>
      </Button>

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {merchant.company_name}
          </h1>

          <p className="text-sm text-muted-foreground">
            {merchant.contact_name ||
              'Contact non renseigné'}{' '}
            · {merchant.contact_email}
          </p>
        </div>
          <Button
            type="button"
            onClick={() =>
              navigate('/modules/gateway/compose', {
                state: {
                  to: merchant.contact_email,
                  recipientName:
                    merchant.contact_name ||
                    merchant.company_name,
                  subject: `Contact Marketplace — ${merchant.company_name}`,
                  message: `Bonjour ${
                    merchant.contact_name ||
                    ''
                  },
          
          Je vous contacte au nom du pôle Marketplace de B.I.B concernant votre activité et votre boutique.
          
          Bien cordialement,
          `,
                },
              })
            }
          >
            <Mail className="mr-2 h-4 w-4" />
            Contacter le marchand
          </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">
              {shops.length}
            </p>

            <p className="text-xs text-muted-foreground">
              Boutiques
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">
              {Number(
                merchant.revenue ?? 0,
              ).toLocaleString('fr-FR')}{' '}
              €
            </p>

            <p className="text-xs text-muted-foreground">
              CA suivi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium">
              {merchant.subscription_plan ||
                'Non renseigné'}
            </p>

            <p className="text-xs text-muted-foreground">
              Abonnement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium">
              {portfolio?.name ||
                'Non affecté'}
            </p>

            <p className="text-xs text-muted-foreground">
              Portefeuille
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Boutiques du marchand
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {shops.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune boutique rattachée à ce marchand.
              </p>
            ) : (
              shops.map((shop) => (
                <div
                  key={shop.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Store className="h-5 w-5 shrink-0 text-muted-foreground" />

                    <div className="min-w-0">
                      <Link
                        className="font-medium hover:underline"
                        to={
                          '/pole/marketplace/stores/' +
                          shop.id
                        }
                      >
                        {shop.name}
                      </Link>

                      <p className="text-xs text-muted-foreground">
                        {shop.category ||
                          'Catégorie non renseignée'}{' '}
                        ·{' '}
                        {shop.country ||
                          'Pays non renseigné'}
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
                    {SHOP_STATUS_LABELS[
                      shop.status
                    ]}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Indicateurs
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Risque :
              <strong>
                {merchant.risk_level ||
                  'non évalué'}
              </strong>
            </div>

            <div>
              Statut abonnement :
              <strong className="ml-1">
                {merchant.subscription_status ||
                  'non renseigné'}
              </strong>
            </div>

            <div>
              Paiement :
              <strong className="ml-1">
                {merchant.payment_status ||
                  'non renseigné'}
              </strong>
            </div>

            <div>
              Dernière commande :
              <strong className="ml-1">
                {merchant.last_order_date
                  ? new Date(
                      merchant.last_order_date,
                    ).toLocaleDateString(
                      'fr-FR',
                    )
                  : '—'}
              </strong>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Historique des communications
          </CardTitle>
        </CardHeader>

        <CardContent>
          {communications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune communication journalisée.
            </p>
          ) : (
            <div className="space-y-3">
              {communications.map(
                (communication) => (
                  <div
                    key={communication.id}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">
                        {communication.subject}
                      </p>

                      <Badge variant="outline">
                        {communication.status}
                      </Badge>
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {communication.situation}
                    </p>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Documents & relation documentaire
          </CardTitle>
        </CardHeader>

        <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
          <FileText className="h-5 w-5" />

          Les documents liés au marchand seront
          consultables via l’index documentaire BIB
          et Google Workspace.
        </CardContent>
      </Card>
    </div>
  );
}
