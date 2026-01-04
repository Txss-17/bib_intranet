import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getModuleNavigation, transversalNavigations } from '@/data/moduleNavigations';
import { PoleId } from '@/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface ModuleNavigationProps {
  poleId?: PoleId;
  transversalModule?: 'ethics' | 'gateway' | 'packaging';
  sidebarCollapsed: boolean;
}

export function ModuleNavigation({ poleId, transversalModule, sidebarCollapsed }: ModuleNavigationProps) {
  const location = useLocation();
  
  // Get navigation items based on pole or transversal module
  const navItems = poleId 
    ? getModuleNavigation(poleId)
    : transversalModule 
      ? transversalNavigations[transversalModule] || []
      : [];

  if (navItems.length === 0) return null;

  const isActive = (path: string) => {
    if (path.endsWith(`/pole/${poleId}`) || path.endsWith(`/modules/${transversalModule}`)) {
      // For overview, check exact match or if there's no sub-section
      const basePath = poleId ? `/pole/${poleId}` : `/modules/${transversalModule}`;
      return location.pathname === basePath;
    }
    return location.pathname === path;
  };

  return (
    <nav
      className={cn(
        'fixed top-16 right-0 z-20 h-12 border-b border-border bg-background/95 backdrop-blur transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-64'
      )}
    >
      <ScrollArea className="h-full w-full">
        <div className="flex h-full items-center gap-1 px-4">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                'flex h-full items-center px-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap',
                isActive(item.path)
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              )}
            >
              {item.labelFr}
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </nav>
  );
}
