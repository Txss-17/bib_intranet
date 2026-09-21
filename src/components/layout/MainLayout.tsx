import { useEffect, useState } from 'react';
import {
  Outlet,
  useLocation,
} from 'react-router-dom';

import { cn } from '@/lib/utils';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { ModuleNavigation } from './ModuleNavigation';

import { ViewAsBanner } from '@/components/admin/ViewAsBanner';
import { SandboxBanner } from '@/components/tech/SandboxBanner';

import { PoleId } from '@/types';

// ---------------------------------------------------------------------------
// MODULES TRANSVERSAUX AVEC NAVIGATION HORIZONTALE
// ---------------------------------------------------------------------------
//
// Ces modules correspondent exactement aux clés acceptées par
// ModuleNavigation.tsx.
// ---------------------------------------------------------------------------

type TransversalModule =
  | 'ethics'
  | 'gateway'
  | 'independent-audit';

const TRANSVERSAL_MODULES: TransversalModule[] = [
  'ethics',
  'gateway',
  'independent-audit',
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const getPoleIdFromPath = (
  pathname: string,
): PoleId | undefined => {
  const match =
    pathname.match(
      /^\/pole\/([^/]+)/,
    );

  return match?.[1] as
    | PoleId
    | undefined;
};

const getTransversalModuleFromPath = (
  pathname: string,
): TransversalModule | undefined => {
  const match =
    pathname.match(
      /^\/modules\/([^/]+)/,
    );

  const moduleId = match?.[1];

  if (
    !moduleId ||
    !TRANSVERSAL_MODULES.includes(
      moduleId as TransversalModule,
    )
  ) {
    return undefined;
  }

  return moduleId as TransversalModule;
};

// ---------------------------------------------------------------------------
// MAIN LAYOUT
// ---------------------------------------------------------------------------

export function MainLayout() {
  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false);

  const [
    darkMode,
    setDarkMode,
  ] = useState(true);

  const location =
    useLocation();

  // -------------------------------------------------------------------------
  // DARK MODE
  // -------------------------------------------------------------------------

  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      darkMode,
    );
  }, [darkMode]);

  // -------------------------------------------------------------------------
  // ROUTE CONTEXT
  // -------------------------------------------------------------------------

  const pathname =
    location.pathname;

  const isPolePage =
    pathname.startsWith('/pole/');

  const extractedPoleId =
    isPolePage
      ? getPoleIdFromPath(
          pathname,
        )
      : undefined;

  const transversalModule =
    getTransversalModuleFromPath(
      pathname,
    );

  const isTransversalModule =
    Boolean(
      transversalModule,
    );

  // -------------------------------------------------------------------------
  // NAVIGATION HORIZONTALE
  // -------------------------------------------------------------------------
  //
  // La navigation horizontale n'est affichée que lorsqu'une navigation
  // modulaire existe réellement.
  //
  // Cela évite d'avoir une barre vide sur :
  //   /work/*
  //   /notifications
  //   /documents
  //   /feed
  //   /admin/*
  // -------------------------------------------------------------------------

  const showModuleNav =
    Boolean(
      extractedPoleId ||
      transversalModule,
    );

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      {/* ----------------------------------------------------------------- */}
      {/* SIDEBAR                                                          */}
      {/* ----------------------------------------------------------------- */}

      <AppSidebar
        collapsed={
          sidebarCollapsed
        }
      />

      {/* ----------------------------------------------------------------- */}
      {/* TOP BAR                                                          */}
      {/* ----------------------------------------------------------------- */}

      <TopBar
        onToggleSidebar={() =>
          setSidebarCollapsed(
            (previous) =>
              !previous,
          )
        }
        sidebarCollapsed={
          sidebarCollapsed
        }
        darkMode={darkMode}
        onToggleDarkMode={() =>
          setDarkMode(
            (previous) =>
              !previous,
          )
        }
        activePoleId={
          isPolePage
            ? extractedPoleId
            : undefined
        }
      />

      {/* ----------------------------------------------------------------- */}
      {/* MODULE NAVIGATION                                                */}
      {/* ----------------------------------------------------------------- */}

      {showModuleNav && (
        <ModuleNavigation
          poleId={
            isPolePage
              ? extractedPoleId
              : undefined
          }
          transversalModule={
            isTransversalModule
              ? transversalModule
              : undefined
          }
          sidebarCollapsed={
            sidebarCollapsed
          }
        />
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MAIN CONTENT                                                      */}
      {/* ----------------------------------------------------------------- */}

      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          sidebarCollapsed
            ? 'pl-16'
            : 'pl-64',
          showModuleNav
            ? 'pt-28'
            : 'pt-16',
        )}
      >
        <SandboxBanner />

        <ViewAsBanner />

        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
