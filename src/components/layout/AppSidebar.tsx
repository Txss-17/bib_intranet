import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Crown,
  Wallet,
  Cog,
  Users,
  Package,
  ClipboardCheck,
  Scale,
  Leaf,
  Megaphone,
  ChevronDown,
  ChevronRight,
  Home,
  MessageSquare,
  FileText,
  Shield,
  Settings,
  BarChart3,
  Store,
  Headphones,
  ShieldCheck,
  ListTodo,
  Bell,
  Newspaper,
  Workflow,
  Gavel,
  FolderKanban,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { poles } from '@/data/poles';
import { usePermissions } from '@/hooks/usePermissions';
import { PoleId } from '@/types';

// ---------------------------------------------------------------------------
// ICÔNES DES PÔLES
// ---------------------------------------------------------------------------

const iconMap: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Crown,
  Wallet,
  Cog,
  Users,
  Package,
  ClipboardCheck,
  Scale,
  Leaf,
  Megaphone,
  BarChart3,
  Store,
  Headphones,
  ShieldCheck,
};

// ---------------------------------------------------------------------------
// MODULES TRANSVERSAUX
// ---------------------------------------------------------------------------
//
// Ces modules ne sont pas des pôles métier.
// Ils servent de couches communes à toute l'organisation BIB.
//
// L'ordre est volontaire :
// 1. Travail
// 2. Notifications
// 3. Gateway & Messages
// 4. Documents
// 5. Internal Feed
// 6. Éthique
// 7. Audit indépendant
// 8. Rôles & Permissions
// ---------------------------------------------------------------------------

const transversalModules = [
  {
    id: 'work',
    name: 'Travail',
    icon: ListTodo,
    path: '/work/tasks',
    permissionPath: '/work/tasks',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: Bell,
    path: '/notifications',
    permissionPath: '/notifications',
  },
  {
    id: 'gateway',
    name: 'Gateways & Messages',
    icon: MessageSquare,
    path: '/modules/gateway',
    permissionPath: '/modules/gateway',
  },
  {
    id: 'documents',
    name: 'Documents',
    icon: FileText,
    path: '/documents',
    permissionPath: '/documents',
  },
  {
    id: 'feed',
    name: 'Internal Feed',
    icon: Newspaper,
    path: '/feed',
    permissionPath: '/feed',
  },
  {
    id: 'ethics',
    name: 'Éthique & Signalement',
    icon: Gavel,
    path: '/modules/ethics',
    permissionPath: '/modules/ethics',
  },
  {
    id: 'independent-audit',
    name: 'Audit indépendant',
    icon: Shield,
    path: '/modules/independent-audit',
    permissionPath: '/modules/independent-audit',
  },
  {
    id: 'compliance-audit',
    name: 'Conformité & Audit',
    icon: ClipboardCheck,
    path: '/compliance-audit',
    permissionPath: '/compliance-audit',
  },
  {
    id: 'roles-permissions',
    name: 'Rôles & Permissions',
    icon: ShieldCheck,
    path: '/admin/roles-permissions',
    permissionPath: '/admin/roles-permissions',
  },
];

// ---------------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------------

interface AppSidebarProps {
  collapsed: boolean;
}

// ---------------------------------------------------------------------------
// COMPOSANT
// ---------------------------------------------------------------------------

export function AppSidebar({
  collapsed,
}: AppSidebarProps) {
  const location = useLocation();

  const {
    canViewPole,
    canViewPath,
  } = usePermissions();

  const [
    expandedSections,
    setExpandedSections,
  ] = useState<Record<string, boolean>>({
    poles: true,
    modules: true,
  });

  // -------------------------------------------------------------------------
  // SECTION TOGGLE
  // -------------------------------------------------------------------------

  const toggleSection = (
    section: string,
  ) => {
    setExpandedSections((previous) => ({
      ...previous,
      [section]: !previous[section],
    }));
  };

  // -------------------------------------------------------------------------
  // ACTIVE STATES
  // -------------------------------------------------------------------------

  const isActive = (
    path: string,
  ) => {
    return location.pathname === path;
  };

  const isPoleActive = (
    poleId: PoleId,
  ) => {
    return location.pathname.startsWith(
      `/pole/${poleId}`,
    );
  };

  const isModuleActive = (
    path: string,
  ) => {
    if (path === '/work/tasks') {
      return location.pathname.startsWith('/work/');
    }

    if (path === '/modules/gateway') {
      return location.pathname.startsWith(
        '/modules/gateway',
      );
    }

    if (path === '/modules/ethics') {
      return location.pathname.startsWith(
        '/modules/ethics',
      );
    }

    if (
      path ===
      '/modules/independent-audit'
    ) {
      return location.pathname.startsWith(
        '/modules/independent-audit',
      );
    }

    return location.pathname === path;
  };

  // -------------------------------------------------------------------------
  // POLES VISIBLES
  // -------------------------------------------------------------------------

  const visiblePoles = poles.filter(
    (pole) => canViewPole(pole.id),
  );

  // -------------------------------------------------------------------------
  // MODULES TRANSVERSAUX VISIBLES
  // -------------------------------------------------------------------------

  const visibleModules =
    transversalModules.filter(
      (module) =>
        canViewPath(
          module.permissionPath,
        ),
    );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed
          ? 'w-16'
          : 'w-64',
      )}
    >
      {/* ----------------------------------------------------------------- */}
      {/* LOGO                                                             */}
      {/* ----------------------------------------------------------------- */}

      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <Link
          to="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-9 items-center justify-center rounded-lg bg-accent px-2">
            <span className="text-sm font-bold tracking-tight text-accent-foreground">
              B.I.B
            </span>
          </div>

          {!collapsed && (
            <div>
              <span className="text-lg font-semibold text-sidebar-foreground">
                Brand in a Box
              </span>

              <span className="ml-1 text-xs text-sidebar-muted">
                INTRANET
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* NAVIGATION                                                       */}
      {/* ----------------------------------------------------------------- */}

      <nav className="flex h-[calc(100vh-8rem)] flex-col gap-1 overflow-y-auto p-3">
        {/* =============================================================== */}
        {/* DASHBOARD                                                       */}
        {/* =============================================================== */}

        <Link
          to="/"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            isActive('/')
              ? 'bg-sidebar-accent text-sidebar-primary'
              : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
          )}
        >
          <Home className="h-4 w-4 shrink-0" />

          {!collapsed && (
            <span>
              Dashboard
            </span>
          )}
        </Link>

        {/* =============================================================== */}
        {/* PÔLES                                                           */}
        {/* =============================================================== */}

        <div className="mt-4">
          <button
            type="button"
            onClick={() =>
              toggleSection('poles')
            }
            className={cn(
              'flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-muted',
              collapsed &&
                'justify-center',
            )}
          >
            {!collapsed && (
              <>
                <span>
                  Pôles
                </span>

                {expandedSections.poles ? (
                  <ChevronDown className="ml-auto h-3 w-3" />
                ) : (
                  <ChevronRight className="ml-auto h-3 w-3" />
                )}
              </>
            )}
          </button>

          {(expandedSections.poles ||
            collapsed) && (
            <div className="mt-1 space-y-0.5">
              {visiblePoles.map(
                (pole) => {
                  const Icon =
                    iconMap[
                      pole.icon
                    ] || Crown;

                  return (
                    <Link
                      key={pole.id}
                      to={`/pole/${pole.id}`}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        isPoleActive(
                          pole.id,
                        )
                          ? 'bg-sidebar-accent text-sidebar-primary'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
                      )}
                      title={
                        collapsed
                          ? pole.name
                          : undefined
                      }
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                        <Icon className="h-4 w-4" />
                      </div>

                      {!collapsed && (
                        <span className="truncate">
                          {pole.shortName}
                        </span>
                      )}

                      {!collapsed && (
                        <span
                          className={cn(
                            'ml-auto h-2 w-2 rounded-full',
                            pole.color,
                          )}
                        />
                      )}
                    </Link>
                  );
                },
              )}
            </div>
          )}
        </div>

        {/* =============================================================== */}
        {/* TRANSVERSAL                                                    */}
        {/* =============================================================== */}

        <div className="mt-4">
          <button
            type="button"
            onClick={() =>
              toggleSection('modules')
            }
            className={cn(
              'flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-muted',
              collapsed &&
                'justify-center',
            )}
          >
            {!collapsed && (
              <>
                <span>
                  Transversal
                </span>

                {expandedSections.modules ? (
                  <ChevronDown className="ml-auto h-3 w-3" />
                ) : (
                  <ChevronRight className="ml-auto h-3 w-3" />
                )}
              </>
            )}
          </button>

          {(expandedSections.modules ||
            collapsed) && (
            <div className="mt-1 space-y-0.5">
              {visibleModules.map(
                (module) => {
                  const Icon =
                    module.icon;

                  return (
                    <Link
                      key={module.id}
                      to={module.path}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        isModuleActive(
                          module.path,
                        )
                          ? 'bg-sidebar-accent text-sidebar-primary'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
                      )}
                      title={
                        collapsed
                          ? module.name
                          : undefined
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />

                      {!collapsed && (
                        <span className="truncate">
                          {module.name}
                        </span>
                      )}
                    </Link>
                  );
                },
              )}
            </div>
          )}
        </div>
      </nav>

      {/* ----------------------------------------------------------------- */}
      {/* SETTINGS                                                         */}
      {/* ----------------------------------------------------------------- */}

      <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-3">
        <Link
          to="/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
            isActive('/settings')
              ? 'bg-sidebar-accent text-sidebar-primary'
              : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />

          {!collapsed && (
            <span>
              Paramètres
            </span>
          )}
        </Link>
      </div>
    </aside>
  );
}
