import { useLocation, useParams } from 'react-router-dom';
import { getPoleById } from '@/data/poles';
import { getModuleNavigation } from '@/data/moduleNavigations';
import { PoleId } from '@/types';
import {
  BarChart3,
  ClipboardCheck,
  Code,
  Cog,
  Construction,
  Crown,
  FileText,
  Headphones,
  Leaf,
  Megaphone,
  Package,
  Scale,
  ShieldCheck,
  Store,
  Users,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  BarChart3,
  ClipboardCheck,
  Code,
  Cog,
  Crown,
  Headphones,
  Leaf,
  Megaphone,
  Package,
  Scale,
  ShieldCheck,
  Store,
  Users,
  Wallet,
};

function resolveRouteContext(
  pathname: string,
  poleId?: string,
  subSection?: string,
) {
  /*
   * Certaines routes sont déclarées directement dans App.tsx :
   * /pole/marketplace/recycling
   *
   * alors que SubSectionPage était initialement prévu pour :
   * /pole/:poleId/:subSection
   *
   * On supporte donc les deux formats.
   */

  if (poleId && subSection) {
    return {
      poleId,
      subSection,
    };
  }

  const parts = pathname.split('/').filter(Boolean);

  if (parts[0] === 'pole' && parts[1] && parts[2]) {
    return {
      poleId: parts[1],
      subSection: parts.slice(2).join('/'),
    };
  }

  return {
    poleId: poleId ?? '',
    subSection: subSection ?? '',
  };
}

export default function SubSectionPage() {
  const location = useLocation();

  const params = useParams<{
    poleId: string;
    subSection: string;
  }>();

  const { poleId, subSection } = resolveRouteContext(
    location.pathname,
    params.poleId,
    params.subSection,
  );

  const pole = getPoleById(poleId);

  const navItems = pole
    ? getModuleNavigation(pole.id as PoleId)
    : [];

  const currentSection = navItems.find(
    (item) =>
      item.id === subSection ||
      item.path === location.pathname,
  );

  /*
   * Route inconnue ou module non enregistré.
   */
  if (!pole || !currentSection) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border bg-card p-8 text-center">
        <FileText className="mb-4 h-10 w-10 text-muted-foreground/50" />

        <p className="font-medium text-foreground">
          Section introuvable
        </p>

        <p className="mt-1 max-w-lg text-sm text-muted-foreground">
          La route{' '}
          <code className="rounded bg-muted px-1.5 py-0.5">
            {location.pathname}
          </code>{' '}
          n&apos;est pas encore reliée à un module de l&apos;intranet.
        </p>
      </div>
    );
  }

  const Icon = iconMap[pole.icon] || FileText;

  const sectionLabel =
    currentSection.labelFr ?? currentSection.label;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header du module */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <Icon className="h-5 w-5 text-foreground" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">
                {sectionLabel}
              </h1>

              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  pole.color,
                )}
              />
            </div>

            <p className="mt-0.5 text-sm text-muted-foreground">
              {pole.shortName} · {pole.name}
            </p>
          </div>
        </div>
      </div>

      {/* État du module */}
      <div className="enterprise-card p-12 text-center">
        <Construction className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />

        <h3 className="mb-2 text-lg font-medium text-foreground">
          Module en cours de développement
        </h3>

        <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">
          La route est correctement reliée au module{' '}
          <span className="font-medium text-foreground">
            « {sectionLabel} »
          </span>
          . Les fonctionnalités métier détaillées seront
          implémentées progressivement dans ce module sans
          modifier la structure de navigation de l&apos;intranet.
        </p>
      </div>

      {/* KPI temporaires */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="enterprise-card p-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Éléments en attente
          </h4>

          <p className="text-2xl font-semibold text-foreground">
            —
          </p>
        </div>

        <div className="enterprise-card p-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Actions requises
          </h4>

          <p className="text-2xl font-semibold text-foreground">
            —
          </p>
        </div>

        <div className="enterprise-card p-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Dernière mise à jour
          </h4>

          <p className="text-2xl font-semibold text-foreground">
            —
          </p>
        </div>
      </div>
    </div>
  );
}