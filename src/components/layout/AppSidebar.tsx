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
  Home,
  MessageSquare,
  FileText,
  AlertTriangle,
  Shield,
  Recycle,
  Settings,
  Mail,
  BarChart3,
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
};

// All modules in strict alphabetical order
const allModules = [
  { id: 'audit', name: 'Audit', icon: ClipboardCheck, path: '/pole/audit', type: 'pole' },
  { id: 'compliance', name: 'Compliance & Legal', icon: Scale, path: '/pole/compliance', type: 'pole' },
  { id: 'dashboard', name: 'Dashboard', icon: Home, path: '/', type: 'module' },
  { id: 'direction', name: 'Direction', icon: Crown, path: '/pole/direction', type: 'pole' },
  { id: 'documents', name: 'Documents', icon: FileText, path: '/documents', type: 'module' },
  { id: 'ethics', name: 'Ethics & Whistleblowing', icon: Shield, path: '/modules/ethics', type: 'module' },
  { id: 'feed', name: 'Feed Interne', icon: MessageSquare, path: '/feed', type: 'module' },
  { id: 'finance', name: 'Finance', icon: Wallet, path: '/pole/finance', type: 'pole' },
  { id: 'gateway', name: 'Gateways & Messages', icon: Mail, path: '/modules/gateway', type: 'module' },
  { id: 'lifecycle', name: 'Lifecycle & Support', icon: RefreshCw, path: '/pole/lifecycle', type: 'pole' },
  { id: 'marketing', name: 'Marketing & Media', icon: Megaphone, path: '/pole/marketing', type: 'pole' },
  { id: 'ops', name: 'Opérations', icon: Cog, path: '/pole/ops', type: 'pole' },
  { id: 'packaging', name: 'Packaging Lifecycle', icon: Recycle, path: '/modules/packaging', type: 'module' },
  { id: 'reporting', name: 'Reporting', icon: BarChart3, path: '/modules/reporting', type: 'module' },
  { id: 'rh', name: 'Ressources Humaines', icon: Users, path: '/pole/rh', type: 'pole' },
  { id: 'risk', name: 'Risk & Incidents', icon: AlertTriangle, path: '/modules/incidents', type: 'module' },
  { id: 'rse', name: 'RSE', icon: Leaf, path: '/pole/rse', type: 'pole' },
  { id: 'supplier', name: 'Supplier & Product', icon: Package, path: '/pole/supplier', type: 'pole' },
  { id: 'tech', name: 'Tech', icon: Code, path: '/pole/tech', type: 'pole' },
].sort((a, b) => a.name.localeCompare(b.name, 'fr'));

interface AppSidebarProps {
  collapsed: boolean;
}

export function AppSidebar({ collapsed }: AppSidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getPoleColor = (id: string) => {
    const pole = poles.find(p => p.id === id);
    return pole?.color || 'bg-accent';
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-4 shrink-0">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <span className="text-lg font-bold text-accent-foreground">L</span>
          </div>
          {!collapsed && (
            <div>
              <span className="text-lg font-semibold text-sidebar-foreground">LINKSY</span>
              <span className="ml-1 text-xs text-sidebar-muted">GROUP</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation - Alphabetical Order */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-0.5">
          {allModules.map((module) => {
            const Icon = module.icon;
            const active = isActive(module.path);
            const isPole = module.type === 'pole';
            
            return (
              <Link
                key={module.id}
                to={module.path}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
                title={collapsed ? module.name : undefined}
              >
                <div className="flex h-5 w-5 items-center justify-center shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                {!collapsed && (
                  <>
                    <span className="truncate flex-1">{module.name}</span>
                    {isPole && (
                      <span className={cn('h-2 w-2 rounded-full shrink-0', getPoleColor(module.id))} />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Settings */}
      <div className="border-t border-sidebar-border p-3 shrink-0">
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
          {!collapsed && <span>Paramètres</span>}
        </Link>
      </div>
    </aside>
  );
}
