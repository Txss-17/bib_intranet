import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  getModuleNavigation,
  transversalNavigations,
} from '@/data/moduleNavigations';
import { PoleId } from '@/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { usePermissions } from '@/hooks/usePermissions';

export type TransversalModuleId =
  | 'work'
  | 'notifications'
  | 'gateway'
  | 'documents'
  | 'feed'
  | 'ethics'
  | 'independentAudit'
  | 'permissions';

interface ModuleNavigationProps {
  poleId?: PoleId;
  transversalModule?: TransversalModuleId;
  sidebarCollapsed: boolean;
}

export function ModuleNavigation({
  poleId,
  transversalModule,
  sidebarCollapsed,
}: ModuleNavigationProps) {
  const location = useLocation();
  const { canViewPage } = usePermissions();

  const scope = poleId ?? transversalModule;

  const allItems = poleId
    ? getModuleNavigation(poleId)
    : transversalModule
      ? transversalNavigations[transversalModule]?.items ?? []
      : [];

  const navItems = scope
    ? allItems.filter((item) =>
        canViewPage(`${scope}.${item.id}`),
      )
    : allItems;

  if (navItems.length === 0) {
    return null;
  }

  const basePath = poleId
    ? `/pole/${poleId}`
    : transversalModule === 'independentAudit'
      ? '/modules/independent-audit'
      : transversalModule
        ? `/modules/${transversalModule}`
        : '';

  const isActive = (path: string) => {
    if (location.pathname === path) {
      return true;
    }

    if (
      path !== basePath &&
      location.pathname.startsWith(`${path}/`)
    ) {
      return true;
    }

    return false;
  };

  return (
    <nav
      className={cn(
        'fixed top-16 z-30 h-12 border-b border-border bg-background/95 backdrop-blur',
        'transition-all duration-300',
        sidebarCollapsed
          ? 'left-16 right-0'
          : 'left-64 right-0',
      )}
    >
      <ScrollArea className="h-full w-full">
        <div className="flex h-12 items-center gap-1 px-4">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                'flex h-9 shrink-0 items-center rounded-md px-3 text-sm font-medium transition-colors',
                isActive(item.path)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
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
