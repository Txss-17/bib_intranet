import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  FileCheck,
  Globe2,
  Mail,
  Store,
} from 'lucide-react';

import {
  useMarketplaceMerchant,
  useMarketplaceShop,
  useMerchantPortfolio,
  useShopDocuments,
} from '@/hooks/useMarketplace';

import {
  SHOP_STATUS_LABELS,
  useShopActions,
} from '@/hooks/useShops';

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
      {SHOP_STATUS_LABELS[
        status as keyof typeof SHOP_STATUS_LABELS
      ] ?? status}
    </span>
  );
}

export default function MarketplaceStoreDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: shop, isLoading } =
    useMarketplaceShop(id);

  const { data: documents = [] } =
    useShopDocuments(id);

  const { data: merchant } =
    useMarketplaceMerchant(
      shop?.merchant_id ?? undefined,
    );

  const { data: portfolioAssignment } =
    useMerchantPortfolio(
      shop?.merchant_id ?? undefined,
    );

  const { changeStatus } =
    useShopActions();

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Chargement de la boutique…
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="space-y-4 p-6">
        <Link
          to="/pole/marketplace/stores"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Boutiques
        </Link>

        <div className="rounded-xl border p-8 text-center">
          Boutique introuvable.
        </div>
      </div>
    );
  }

  const transitionMap: Record<string, string[]> = {
    draft: ['application', 'closed'],
    application: ['review', 'closed'],
    review: ['active', 'closed'],
    active: ['inactive', 'suspended', 'closed'],
    inactive: ['active', 'suspended', 'closed'],
    suspended: ['active', 'inactive', 'closed'],
    closed: [],
  };

  const availableTransitions =
    transitionMap[shop.status] ?? [];

  const handleStatus = async (
    nextStatus: string,
  ) => {
    const reasonRequired = [
      'inactive',
      'suspended',
      'closed',
    ].includes(nextStatus);

    let reason: string | undefined;

    if (reasonRequired) {
      reason =
        window.prompt(
          'Justification obligatoire :',
        )?.trim();

      if (!reason) return;
    }

    await changeStatus.mutateAsync({
      shop: shop as any,
      to: nextStatus as any,
      reason,
    });
  };

  return (
    <div className="space-y-6 p-6">
      <Link
        to="/pole/marketplace/stores"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Boutiques Marketplace
      </Link>

      <section className="rounded-2xl border bg-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border p-3">
                <Store className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold">
                  {shop.name}
                </h1>

                <div className="mt-1 text-sm text-muted-foreground">
                  {shop.shop_code}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <StatusBadge
                status={shop.status}
              />
            </div>
          </div>

          {shop.website_url && (
            <a
              href={shop.website_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-muted"
            >
              <ExternalLink className="h-4 w-4" />
              Site de la boutique
            </a>
          )}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">
          Marchand responsable
        </h2>

        {merchant ? (
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Link
                to={`/pole/marketplace/merchants/${merchant.id}`}
                className="font-medium hover:underline"
              >
                {merchant.company_name ||
                  'Marchand sans nom'}
              </Link>

              <div className="mt-1 text-sm text-muted-foreground">
                {merchant.contact_name ||
                  'Contact non renseigné'}
              </div>

              {merchant.contact_email && (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  {merchant.contact_email}
                </div>
              )}
            </div>

            {portfolioAssignment?.merchant_portfolios && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="text-xs text-muted-foreground">
                  Portefeuille
                </div>

                <div className="mt-1 font-medium">
                  {
                    portfolioAssignment
                      .merchant_portfolios
                      .name
                  }
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 text-sm text-amber-600">
            Aucun marchand rattaché.
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">
          Activité
        </h2>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">
              Catégorie
            </div>

            <div className="mt-1 text-sm">
              {shop.category ||
                'Non renseignée'}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">
              Type d’activité
            </div>

            <div className="mt-1 text-sm">
              {shop.activity_type ||
                'Non renseigné'}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">
              Pays
            </div>

            <div className="mt-1 flex items-center gap-2 text-sm">
              <Globe2 className="h-4 w-4" />
              {shop.country ||
                'Non renseigné'}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">
              Abonnement
            </div>

            <div className="mt-1 text-sm">
              {shop.subscription_plan ||
                'Non renseigné'}
            </div>
          </div>
        </div>

        {shop.activity_description && (
          <div className="mt-5 rounded-lg bg-muted p-4">
            <div className="text-xs text-muted-foreground">
              Description
            </div>

            <p className="mt-2 text-sm leading-6">
              {shop.activity_description}
            </p>
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">
              Cycle de vie Marketplace
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              La gestion du statut de la boutique appartient au
              Marketplace. Ops n’intervient pas dans ce cycle.
            </p>
          </div>

          <StatusBadge
            status={shop.status}
          />
        </div>

        {availableTransitions.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {availableTransitions.map(
              (nextStatus) => (
                <button
                  key={nextStatus}
                  type="button"
                  disabled={
                    changeStatus.isPending
                  }
                  onClick={() =>
                    handleStatus(nextStatus)
                  }
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                >
                  →{' '}
                  {SHOP_STATUS_LABELS[
                    nextStatus as keyof typeof SHOP_STATUS_LABELS
                  ] ?? nextStatus}
                </button>
              ),
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card">
        <div className="border-b p-5">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            <h2 className="font-semibold">
              Justificatifs d’activité
            </h2>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Documents examinés dans le cadre du suivi de la boutique.
          </p>
        </div>

        {documents.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Aucun justificatif enregistré.
          </div>
        ) : (
          <div className="divide-y">
            {documents.map((document: any) => (
              <div
                key={document.id}
                className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-medium">
                    {document.title}
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    {document.document_type}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full border px-2.5 py-1 text-xs">
                    {document.status}
                  </span>

                  {document.document_url && (
                    <a
                      href={document.document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm underline"
                    >
                      Ouvrir
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
