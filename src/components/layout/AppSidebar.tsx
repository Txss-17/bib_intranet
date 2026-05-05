import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Crown,
  Wallet,
  Cog,
  Code,
  Users,
  Package,
  ClipboardCheck,
  Scale,
  Leaf,
  Megaphone,
  ShieldAlert,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Home,
  MessageSquare,
  FileText,
  Shield,
  Recycle,
  Settings,
  FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { poles } from '@/data/poles';
import { PoleId } from '@/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Crown,
  Wallet,
  Cog,
  Code,
  Users,
  Package,
  ClipboardCheck,
  Scale,
  Leaf,
  Megaphone,
  ShieldAlert,
  RefreshCw,
  FlaskConical,
};

const transversalModules = [
  { id: 'gateway', name: 'Gateways & Messages', icon: MessageSquare, path: '/modules/gateway' },
  { id: 'feed', name: 'Internal Feed', icon: Home, path: '/feed' },
  { id: 'ethics', name: 'Ethics & Whistleblowing', icon: Shield, path: '/modules/ethics' },
  { id: 'documents', name: 'Documents', icon: FileText, path: '/documents' },
];

interface AppSidebarProps {
  collapsed: boolean;
}

export function AppSidebar({ collapsed }: AppSidebarProps) {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    poles: true,
    modules: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isActive = (path: string) => location.pathname === path;
  const isPoleActive = (poleId: PoleId) => location.pathname.startsWith(`/pole/${poleId}`);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 px-2 items-center justify-center rounded-lg bg-accent">
            <span className="text-sm font-bold text-accent-foreground tracking-tight">B.I.B</span>
          </div>
          {!collapsed && (
            <div>
              <span className="text-lg font-semibold text-sidebar-foreground">Brand in a Box</span>
              <span className="ml-1 text-xs text-sidebar-muted">INTRANET</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3 overflow-y-auto h-[calc(100vh-8rem)]">
        {/* Dashboard */}
        <Link
          to="/"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            isActive('/')
              ? 'bg-sidebar-accent text-sidebar-primary'
              : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
          )}
        >
          <Home className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </Link>

        {/* Poles Section */}
        <div className="mt-4">
          <button
            onClick={() => toggleSection('poles')}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-muted',
              collapsed && 'justify-center'
            )}
          >
            {!collapsed && (
              <>
                <span>Poles</span>
                {expandedSections.poles ? (
                  <ChevronDown className="ml-auto h-3 w-3" />
                ) : (
                  <ChevronRight className="ml-auto h-3 w-3" />
                )}
              </>
            )}
          </button>

          {(expandedSections.poles || collapsed) && (
            <div className="mt-1 space-y-0.5">
              {poles.map((pole) => {
                const Icon = iconMap[pole.icon] || Crown;
                return (
                  <Link
                    key={pole.id}
                    to={`/pole/${pole.id}`}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                      isPoleActive(pole.id)
                        ? 'bg-sidebar-accent text-sidebar-primary'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )}
                    title={collapsed ? pole.name : undefined}
                  >
                    <div className={cn('flex h-5 w-5 items-center justify-center')}>
                      <Icon className="h-4 w-4 shrink-0" />
                    </div>
                    {!collapsed && (
                      <span className="truncate">{pole.shortName}</span>
                    )}
                    {!collapsed && (
                      <span className={cn('ml-auto h-2 w-2 rounded-full', pole.color)} />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Transversal Modules */}
        <div className="mt-4">
          <button
            onClick={() => toggleSection('modules')}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-muted',
              collapsed && 'justify-center'
            )}
          >
            {!collapsed && (
              <>
                <span>Modules</span>
                {expandedSections.modules ? (
                  <ChevronDown className="ml-auto h-3 w-3" />
                ) : (
                  <ChevronRight className="ml-auto h-3 w-3" />
                )}
              </>
            )}
          </button>

          {(expandedSections.modules || collapsed) && (
            <div className="mt-1 space-y-0.5">
              {transversalModules.map((module) => {
                const Icon = module.icon;
                return (
                  <Link
                    key={module.id}
                    to={module.path}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                      isActive(module.path)
                        ? 'bg-sidebar-accent text-sidebar-primary'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )}
                    title={collapsed ? module.name : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{module.name}</span>}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Settings */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-3">
        <Link
          to="/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
            isActive('/settings')
              ? 'bg-sidebar-accent text-sidebar-primary'
              : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
