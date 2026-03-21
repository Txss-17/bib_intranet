import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { ModuleNavigation } from './ModuleNavigation';
import { PoleId } from '@/types';

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Determine if we're on a pole page or transversal module page
  const isPolePage = location.pathname.startsWith('/pole/');
  const isTransversalModule = location.pathname.startsWith('/modules/');
  
  // Extract poleId from pathname (works for static routes like /pole/ops)
  const poleIdMatch = location.pathname.match(/^\/pole\/([^/]+)/);
  const extractedPoleId = poleIdMatch?.[1] as PoleId | undefined;
  
  // Extract transversal module type
  const transversalModuleMatch = location.pathname.match(/^\/modules\/(ethics|gateway)/);
  const transversalModule = transversalModuleMatch?.[1] as 'ethics' | 'gateway' | undefined;

  // Show OX navigation on pole pages and transversal modules
  const showModuleNav = isPolePage || isTransversalModule;

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar collapsed={sidebarCollapsed} />
      <TopBar
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        activePoleId={isPolePage ? extractedPoleId : undefined}
      />
      {showModuleNav && (
        <ModuleNavigation
          poleId={isPolePage ? extractedPoleId : undefined}
          transversalModule={transversalModule}
          sidebarCollapsed={sidebarCollapsed}
        />
      )}
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'pl-16' : 'pl-64',
          showModuleNav ? 'pt-28' : 'pt-16'
        )}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
