import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ExternalLink,
  Mail,
  MessageSquare,
  Store,
  UserRound,
} from 'lucide-react';

import {
  useAssignMerchantPortfolio,
  useMarketplaceMerchant,
  useMarketplacePortfolios,
  useMerchantCommunications,
  useMerchantPortfolio,
  useMerchantShops,
} from '@/hooks/useMarketplace';

const statusLabel: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspendue',
  closed: 'Clôturée',
  review: 'En revue',
  application: 'Candidature',
  draft: 'Brouillon',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
      {statusLabel[status] ?? status}
    </span>
  );
}

export default function MerchantDetail() {
  const { id } = useParams<{ id: string }>();

  const [selectedPortfolio, setSelectedPortfolio] =
    useState('');

  const {
    data: merchant,
    isLoading: merchantLoading,
  } = useMarketplaceMerchant(id);

  const { data: shops = [] } =
    useMerchantShops(id);

  const { data: portfolioAssignment } =
    useMerchantPortfolio(id);

  const { data: portfolios = [] } =
    useMarketplacePortfolios();

  const { data: communications = [] } =
    useMerchantCommunications(id);

  const assignPortfolio =
    useAssignMerchantPortfolio();

  const portfolio =
    portfolioAssignment?.merchant_portfolios;

  const globalPerformance = useMemo(() => {
    const active = shops.filter(
      (shop) => shop.status === 'active',
    ).length;

    const suspended = shops.filter(
      (shop) => shop.status === 'suspended',
    ).length;

    const categories = new Set(
      shops
        .map((shop) => shop.category)
        .filter(Boolean),
    );

    return {
      total: shops.length,
      active,
      suspended,
      categories: categories.size,
    };
  }, [shops]);

  if (merchantLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Chargement du marchand…
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="space-y-4 p-6">
        <Link
          to="/pole/marketplace/merchants"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux marchands
        </Link>

        <div className="rounded-xl border p-8 text-center">
          Marchand introuvable.
        </div>
      </div>
    );
  }

  const handleAssign = async () => {
    if (!selectedPortfolio || !id) return;

    await assignPortfolio.mutateAsync({
      merchantId: id,
      portfolioId: selectedPortfolio,
      reason: 'Affectation depuis le portefeuille Marketplace',
    });

    setSelectedPortfolio('');
  };

  return (
    <div className="space-y-6 p-6">
      <Link
        to="/pole/marketplace/merchants"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Marchands & portefeuilles
      </Link>

      <section className="rounded-2xl border bg-card p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border p-3">
                <Building2 className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold">
                  {merchant.company_name ||
                    'Marchand sans nom'}
                </h1>

                <p className="text-sm text-muted-foreground">
                  {merchant.contact_name ||
                    'Contact non renseigné'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {merchant.subscription_status && (
                <span className="rounded-full bg-muted px-3 py-1 text-xs">
                  Abonnement : {merchant.subscription_status}
                </span>
              )}

              {merchant.risk_level && (
                <span className="rounded-full bg-muted px-3 py-1 text-xs">
                  Risque : {merchant.risk_level}
                </span>
              )}

              {merchant.payment_status && (
                <span className="rounded-full bg-muted px-3 py-1 text-xs">
                  Paiement : {merchant.payment_status}
                </span>
              )}
            </div>
          </div>

          {merchant.contact_email && (
            <a
              href={`mailto:${merchant.contact_email}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-muted"
            >
              <Mail className="h-4 w-4" />
              Contacter le marchand
            </a>
          )}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-sm text-muted-foreground">
            Boutiques
          </div>

          <div className="mt-2 text-2xl font-semibold">
            {globalPerformance.total}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="text-sm text-muted-foreground">
            Actives
          </div>

          <div className="mt-2 flex items-center gap-2 text-2xl font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            {globalPerformance.active}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="text-sm text-muted-foreground">
            Suspendues
          </div>

          <div className="mt-2 text-2xl font-semibold">
            {globalPerformance.suspended}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="text-sm text-muted-foreground">
            Catégories
          </div>

          <div className="mt-2 text-2xl font-semibold">
            {globalPerformance.categories}
          </div>
        </div>
      </div>

      <section className="rounded-xl border bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-semibold">
              Portefeuille responsable
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Toutes les boutiques de ce marchand restent rattachées
              au même portefeuille.
            </p>

            {portfolio ? (
              <div className="mt-3 rounded-lg bg-muted p-3">
                <div className="font-medium">
                  {portfolio.name}
                </div>

                <div className="mt-1 text-xs text-muted-foreground">
                  {portfolio.role_scope}
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-amber-600">
                Aucun portefeuille actuellement affecté.
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <select
              value={selectedPortfolio}
              onChange={(event) =>
                setSelectedPortfolio(event.target.value)
              }
              className="h-10 min-w-56 rounded-lg border bg-background px-3 text-sm"
            >
              <option value="">
                Changer de portefeuille…
              </option>

              {portfolios
                .filter(
                  (item) =>
                    item.status === 'active',
                )
                .map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ))}
            </select>

            <button
              type="button"
              disabled={
                !selectedPortfolio ||
                assignPortfolio.isPending
              }
              onClick={handleAssign}
              className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Affecter
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card">
        <div className="border-b p-5">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            <h2 className="font-semibold">
              Boutiques du marchand
            </h2>
          </div>
        </div>

        {shops.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Aucune boutique rattachée à ce marchand.
          </div>
        ) : (
          <div className="divide-y">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                to={`/pole/marketplace/stores/${shop.id}`}
                className="flex items-center justify-between gap-4 p-5 hover:bg-muted/40"
              >
                <div>
                  <div className="font-medium">
                    {shop.name}
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    {shop.category ||
                      'Catégorie non renseignée'}
                    {shop.country
                      ? ` · ${shop.country}`
                      : ''}
                  </div>
                </div>

                <StatusBadge
                  status={shop.status}
                />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card">
        <div className="border-b p-5">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h2 className="font-semibold">
              Historique des communications
            </h2>
          </div>
        </div>

        {communications.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Aucune communication enregistrée.
          </div>
        ) : (
          <div className="divide-y">
            {communications.map((communication) => (
              <div
                key={communication.id}
                className="p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">
                    {communication.subject}
                  </div>

                  <span className="rounded-full border px-2 py-1 text-xs">
                    {communication.status}
                  </span>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  {communication.situation}
                </p>

                <div className="mt-2 text-xs text-muted-foreground">
                  {communication.recipient}
                  {communication.sent_at
                    ? ` · ${new Date(
                        communication.sent_at,
                      ).toLocaleString('fr-FR')}`
                    : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">
          Informations relationnelles
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">
              Contact
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <UserRound className="h-4 w-4" />
              {merchant.contact_name ||
                'Non renseigné'}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">
              Email
            </div>
            <div className="mt-1 text-sm">
              {merchant.contact_email ||
                'Non renseigné'}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">
              Chiffre d’affaires
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <CircleDollarSign className="h-4 w-4" />
              {merchant.revenue != null
                ? `${Number(
                    merchant.revenue,
                  ).toLocaleString('fr-FR')} €`
                : 'Non renseigné'}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">
              Dernière commande
            </div>
            <div className="mt-1 text-sm">
              {merchant.last_order_date
                ? new Date(
                    merchant.last_order_date,
                  ).toLocaleDateString('fr-FR')
                : 'Non renseignée'}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
