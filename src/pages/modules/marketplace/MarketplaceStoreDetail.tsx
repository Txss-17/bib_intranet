import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  Store,
  ExternalLink,
  Mail,
  UserRound,
  FileText,
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
  useMarketplaceMerchant,
  useShopDocuments,
} from '@/hooks/useMarketplace';

import { SHOP_STATUS_LABELS } from '@/hooks/useShops';

export default function MarketplaceStoreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: shop,
    isLoading: isLoadingShop,
  } = useMarketplaceShop(id);

  const {
    data: merchant,
    isLoading: isLoadingMerchant,
  } = useMarketplaceMerchant(
    shop?.merchant_id ?? undefined,
  );

  const { data: documents = [] } =
    useShopDocuments(id);

  if (isLoadingShop || isLoadingMerchant) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Chargement de la boutique…
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="space-y-4 p-6">
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

        <p className="text-sm text-muted-foreground">
          Boutique introuvable.
        </p>
      </div>
    );
  }

  const merchantName =
    merchant?.contact_name ||
    merchant?.company_name ||
    null;

  const merchantEmail =
    merchant?.contact_email || null;

  const handleContactMerchant = () => {
    if (!merchantEmail) {
      return;
    }

    navigate('/modules/gateway/compose', {
      state: {
        to: merchantEmail,
        recipientName:
          merchant?.contact_name ||
          merchant?.company_name ||
          merchantEmail,
        subject: `Contact boutique — ${shop.name}`,
        message: `Bonjour ${
          merchant?.contact_name || ''
        },

Je vous contacte au nom du pôle Marketplace de B.I.B concernant votre boutique « ${
          shop.name
        } » présente sur la Marketplace.

Bien cordialement,

Pôle Marketplace
B.I.B`,
      },
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Retour */}
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

      {/* En-tête */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <Store className="mt-1 h-6 w-6 shrink-0 text-muted-foreground" />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">
                {shop.name}
              </h1>

              <Badge
                variant={
                  shop.status === 'active'
                    ? 'default'
                    : 'outline'
                }
              >
                {SHOP_STATUS_LABELS[shop.status] ||
                  shop.status}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              {shop.shop_code}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Boutique rattachée au marchand{' '}
              {merchant?.company_name ||
                'non identifié'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {merchantEmail && (
            <Button
              type="button"
              onClick={handleContactMerchant}
            >
              <Mail className="mr-2 h-4 w-4" />
              Contacter le marchand
            </Button>
          )}

          {merchant && (
            <Button
              asChild
              variant="outline"
            >
              <Link
                to={`/pole/marketplace/merchants/${merchant.id}`}
              >
                <UserRound className="mr-2 h-4 w-4" />
                Voir le marchand
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Identité + marchand */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Identité de la boutique
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">
                Nom de la boutique
              </p>

              <p className="font-medium">
                {shop.name}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Code boutique
              </p>

              <p className="font-medium">
                {shop.shop_code}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Type d’activité
              </p>

              <p className="font-medium">
                {shop.activity_type || 'Non renseigné'}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Description de l’activité
              </p>

              <p>
                {shop.activity_description ||
                  'Non renseignée'}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Catégorie
              </p>

              <p className="font-medium">
                {shop.category || 'Non renseignée'}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Pays
              </p>

              <p className="font-medium">
                {shop.country || 'Non renseigné'}
              </p>
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
              Marchand rattaché
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            {merchant ? (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Entreprise
                  </p>

                  <p className="font-medium">
                    {merchant.company_name ||
                      'Non renseignée'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Contact
                  </p>

                  <p className="font-medium">
                    {merchant.contact_name ||
                      'Non renseigné'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    E-mail
                  </p>

                  <p className="break-all font-medium">
                    {merchant.contact_email ||
                      'Non renseigné'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Téléphone
                  </p>

                  <p className="font-medium">
                    {merchant.contact_phone ||
                      'Non renseigné'}
                  </p>
                </div>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                >
                  <Link
                    to={`/pole/marketplace/merchants/${merchant.id}`}
                  >
                    Consulter la fiche marchand
                  </Link>
                </Button>
              </>
            ) : (
              <div className="rounded-lg border border-dashed p-4">
                <p className="text-sm font-medium">
                  Marchand non retrouvé
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Cette boutique ne possède pas actuellement
                  de marchand rattaché accessible depuis
                  l’Intranet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Situation commerciale */}
      <Card>
        <CardHeader>
          <CardTitle>
            Situation commerciale
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">
              Abonnement boutique
            </p>

            <p className="font-medium">
              {shop.subscription_plan ||
                'Non renseigné'}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Commission
            </p>

            <p className="font-medium">
              {shop.commission_rate ?? 0} %
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Création
            </p>

            <p className="font-medium">
              {new Date(
                shop.created_at,
              ).toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Activation
            </p>

            <p className="font-medium">
              {shop.activated_at
                ? new Date(
                    shop.activated_at,
                  ).toLocaleDateString('fr-FR')
                : '—'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Documents d'activité */}
      <Card>
        <CardHeader>
          <CardTitle>
            Documents d’activité
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Documents liés à l’activité de cette boutique.
            Les documents professionnels suivent le circuit
            documentaire BIB / Google Workspace.
          </p>
        </CardHeader>

        <CardContent>
          {documents.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <FileText className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />

              <p className="text-sm font-medium">
                Aucun document enregistré
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Aucun document d’activité n’est actuellement
                rattaché à cette boutique.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((document: any) => (
                <div
                  key={document.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

                    <div className="min-w-0">
                      <p className="font-medium">
                        {document.document_name ||
                          document.title ||
                          'Document sans nom'}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {document.document_type ||
                          'Type non renseigné'}
                      </p>

                      {document.confidentiality_level && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Confidentialité :{' '}
                          {document.confidentiality_level}
                        </p>
                      )}
                    </div>
                  </div>

                  <Badge variant="outline">
                    {document.status ||
                      'Non renseigné'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Responsabilités */}
      <Card>
        <CardHeader>
          <CardTitle>
            Périmètre Marketplace
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Le pôle Marketplace assure le suivi de la
            boutique, de son activité commerciale et de la
            relation avec le marchand.
          </p>

          <p>
            La boutique est créée et gérée depuis BIB
            Platform. L’Intranet ne constitue pas un point
            de création de boutique.
          </p>

          <p>
            Les documents demandés ici concernent
            notamment les éléments complémentaires liés à
            l’activité de la boutique.
          </p>

          <p>
            La conformité des produits n’est pas présentée
            comme une validation effectuée par le pôle
            Marketplace.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
