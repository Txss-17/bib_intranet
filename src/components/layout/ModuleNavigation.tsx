import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  getModuleNavigation,
  transversalNavigations,
} from '@/data/moduleNavigations';
import { PoleId } from '@/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { usePermissions } from '@/hooks/usePermissions';

interface ModuleNavigationProps {
  poleId?: PoleId;
  transversalModule?:
    | 'ethics'
    | 'gateway'
    | 'independent-audit';
  sidebarCollapsed: boolean;
}

export function ModuleNavigation({
  poleId,
  transversalModule,
  sidebarCollapsed,
}: ModuleNavigationProps) {
  const location = useLocation();
  const { canViewPage } = usePermissions();

  // -------------------------------------------------------------------------
  // CONTEXTE
  // -------------------------------------------------------------------------

  const scope = poleId ?? transversalModule;

  const allItems = poleId
    ? getModuleNavigation(poleId)
    : transversalModule
      ? transversalNavigations[
          transversalModule
        ] || []
      : [];

  // -------------------------------------------------------------------------
  // RBAC
  // -------------------------------------------------------------------------
  //
  // Chaque entrée est filtrée individuellement.
  // Une page non autorisée ne doit pas apparaître dans la navigation.
  // -------------------------------------------------------------------------

  const navItems = scope
    ? allItems.filter((item) =>
        canViewPage(
          `${scope}.${item.id}`,
        ),
      )
    : [];

  if (navItems.length === 0) {
    return null;
  }

  // -------------------------------------------------------------------------
  // ACTIVE STATE
  // -------------------------------------------------------------------------

  const isActive = (
    path: string,
  ) => {
    const poleBasePath = poleId
      ? `/pole/${poleId}`
      : undefined;

    const moduleBasePath =
      transversalModule
        ? `/modules/${transversalModule}`
        : undefined;

    // Page d'accueil du pôle / module
    if (
      poleBasePath &&
      path === poleBasePath
    ) {
      return location.pathname === path;
    }

    if (
      moduleBasePath &&
      path === moduleBasePath
    ) {
      return location.pathname === path;
    }

    // Pour les sous-pages, on permet aux routes enfants
    // de rester actives.
    return (
      location.pathname === path ||
      location.pathname.startsWith(
        `${path}/`,
      )
    );
  };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------

  return (
    <nav
      className={cn(
        'fixed top-16 right-0 z-20 h-12 border-b border-border bg-background/95 backdrop-blur transition-all duration-300',
        sidebarCollapsed
          ? 'left-16'
          : 'left-64',
      )}
    >
      <ScrollArea className="h-full w-full">
        <div className="flex h-full items-center gap-1 px-4">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                'flex h-full items-center whitespace-nowrap border-b-2 px-4 text-sm font-medium transition-colors',
                isActive(item.path)
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </nav>
  );
}
