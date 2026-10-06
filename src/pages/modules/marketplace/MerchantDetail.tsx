import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Store,
  FileText,
  TrendingUp,
  BriefcaseBusiness,
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
      <div className="p-6 space-y-4">
        <Button asChild variant="ghost" className="-ml-3">
          <Link to="/pole/marketplace/merchants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux marchands
          </Link>
        </Button>

        <p className="text-sm text-muted-foreground">
          Marchand introuvable.
        </p>
      </div>
    );
  }

  const portfolio = Array.isArray(
    (assignment as any)?.merchant_portfolios,
  )
    ? (assignment as any).merchant_portfolios[0]
    : (assignment as any)?.merchant_portfolios;

  const displayCompanyName =
    merchant.company_name || 'Marchand sans raison sociale';

  const displayContactName =
    merchant.contact_name || 'Contact non renseigné';

  const contactEmail =
    merchant.contact_email || null;

  const contactPhone =
    merchant.contact_phone || null;

  const handleContact = () => {
    if (!contactEmail) {
      return;
    }

    navigate('/modules/gateway/compose', {
      state: {
        to: contactEmail,
        recipientName:
          merchant.contact_name || displayCompanyName,
        subject: `Contact Marketplace — ${displayCompanyName}`,
        message: `Bonjour ${
          merchant.contact_name || ''
        },

Je vous contacte au nom du pôle Marketplace de B.I.B concernant votre activité sur la Marketplace.

Bien cordialement,

Pôle Marketplace
B.I.B`,
      },
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Navigation */}
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

      {/* En-tête marchand */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">
              {displayCompanyName}
            </h1>

            <Badge variant="outline">
              Marchand
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">
            Gestion du marchand, de son portefeuille et de ses boutiques.
          </p>

          <div className="flex flex-col gap-1 text-sm">
            <span>
              <strong>Contact :</strong>{' '}
              {displayContactName}
            </span>

            {contactEmail && (
              <span>
                <strong>Email :</strong>{' '}
                {contactEmail}
              </span>
            )}

            {contactPhone && (
              <span>
                <strong>Téléphone :</strong>{' '}
                {contactPhone}
              </span>
            )}
          </div>
        </div>

        {contactEmail && (
          <Button
            type="button"
            onClick={handleContact}
          >
            <Mail className="mr-2 h-4 w-4" />
            Contacter le marchand
          </Button>
        )}
      </div>

      {/* Indicateurs principaux */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">
              {shops.length}
            </p>

            <p className="text-xs text-muted-foreground">
              Boutiques rattachées
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
              Abonnement marchand
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />

              <p className="text-sm font-medium">
                {portfolio?.name ||
                  'Non affecté'}
              </p>
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Portefeuille Marketplace
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Informations marchand + portefeuille */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>
              Informations marchand
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">
                Raison sociale
              </p>

              <p className="font-medium">
                {displayCompanyName}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Contact principal
              </p>

              <p className="font-medium">
                {displayContactName}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Email
              </p>

              <p className="font-medium break-all">
                {contactEmail || 'Non renseigné'}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Téléphone
              </p>

              <p className="font-medium">
                {contactPhone || 'Non renseigné'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Portefeuille Marketplace
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">
                Portefeuille affecté
              </p>

              <p className="font-medium">
                {portfolio?.name ||
                  'Aucun portefeuille affecté'}
              </p>
            </div>

            {portfolio?.role_scope && (
              <div>
                <p className="text-xs text-muted-foreground">
                  Périmètre
                </p>

                <p className="font-medium">
                  {portfolio.role_scope}
                </p>
              </div>
            )}

            {portfolio?.status && (
              <div>
                <p className="text-xs text-muted-foreground">
                  Statut du portefeuille
                </p>

                <Badge variant="outline">
                  {portfolio.status === 'active'
                    ? 'Actif'
                    : 'Inactif'}
                </Badge>
              </div>
            )}

            {portfolio?.notes && (
              <div>
                <p className="text-xs text-muted-foreground">
                  Notes
                </p>

                <p>
                  {portfolio.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Situation commerciale
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />

              <span>Risque :</span>

              <strong>
                {merchant.risk_level ||
                  'Non évalué'}
              </strong>
            </div>

            <div>
              <span>
                Statut abonnement :
              </span>

              <strong className="ml-1">
                {merchant.subscription_status ||
                  'Non renseigné'}
              </strong>
            </div>

            <div>
              <span>
                Paiement :
              </span>

              <strong className="ml-1">
                {merchant.payment_status ||
                  'Non renseigné'}
              </strong>
            </div>

            <div>
              <span>
                Dernière commande :
              </span>

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

      {/* Boutiques */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>
                Boutiques du marchand
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Les boutiques sont créées et administrées
                depuis BIB Platform. Le pôle Marketplace
                assure ici leur suivi dans l’Intranet.
              </p>
            </div>

            <Badge variant="outline">
              {shops.length}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {shops.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <Store className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />

              <p className="text-sm font-medium">
                Aucune boutique rattachée
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Aucune boutique active ou en cours de traitement
                n’est actuellement rattachée à ce marchand.
              </p>
            </div>
          ) : (
            shops.map((shop) => (
              <div
                key={shop.id}
                className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <Store className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

                  <div className="min-w-0">
                    <Link
                      className="font-medium hover:underline"
                      to={`/pole/marketplace/stores/${shop.id}`}
                    >
                      {shop.name}
                    </Link>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {shop.category ||
                        'Catégorie non renseignée'}
                      {' · '}
                      {shop.country ||
                        'Pays non renseigné'}
                    </p>

                    {shop.activity_type && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Activité : {shop.activity_type}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
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

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      to={`/pole/marketplace/stores/${shop.id}`}
                    >
                      Voir la boutique
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Communications */}
      <Card>
        <CardHeader>
          <CardTitle>
            Historique des communications
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Les communications externes sont traitées
            via Gateway & Messages.
          </p>
        </CardHeader>

        <CardContent>
          {communications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune communication Marketplace
              journalisée pour ce marchand.
            </p>
          ) : (
            <div className="space-y-3">
              {communications.map(
                (communication) => (
                  <div
                    key={communication.id}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <p className="font-medium">
                        {communication.subject}
                      </p>

                      <Badge variant="outline">
                        {communication.status}
                      </Badge>
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Situation :{' '}
                      {communication.situation}
                    </p>

                    {communication.sent_at && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Envoyé le{' '}
                        {new Date(
                          communication.sent_at,
                        ).toLocaleString('fr-FR')}
                      </p>
                    )}
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>
            Documents d’activité
          </CardTitle>
        </CardHeader>

        <CardContent className="flex items-start gap-3 text-sm">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

          <div className="space-y-1">
            <p className="font-medium">
              Documentation liée à l’activité du marchand
            </p>

            <p className="text-muted-foreground">
              Les demandes et documents complémentaires
              liés à l’activité des boutiques sont suivis
              par le pôle Marketplace.
            </p>

            <p className="text-muted-foreground">
              Les documents professionnels sont importés
              depuis Google Drive BIB et les exports suivent
              le circuit documentaire sécurisé de l’Intranet.
            </p>

            <p className="text-muted-foreground">
              La conformité des produits relève du dispositif
              BIB prévu à cet effet et n’est pas présentée
              ici comme une responsabilité de validation
              du pôle Marketplace.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
