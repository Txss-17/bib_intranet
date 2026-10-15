import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useViewAs } from '@/hooks/useViewAs';
import { jobRoles, JobRole } from '@/data/jobRoles';
import { Seniority } from '@/data/permissionRules';
import {
  ActionSet,
  DataScope,
  MATRIX_EVENT,
  PermissionAction,
  getDataScope,
  getPageByPath,
  isTestRbacEnforced,
  loadTestMatrixOverrides,
  pageRegistry,
  resolvePagePermissions,
  NO_ACCESS,
  startPermissionSync,
} from '@/data/permissionMatrix';

/** Rôle métier effectif : rôle simulé (« Visualiser comme ») sinon déduit du profil. */
const inferRole = (position?: string | null, poles?: string[] | null): JobRole | undefined => {
  if (!position) return undefined;
  const candidates = jobRoles.filter((r) => r.position === position);
  if (!candidates.length) return undefined;
  if (poles?.length) {
    const best = candidates.find((r) => poles.every((p) => r.poles.includes(p)));
    if (best) return best;
  }
  return candidates[0];
};

export interface UsePermissionsReturn {
  role: JobRole | undefined;
  poles: string[];
  seniority: Seniority;
  enforced: boolean;
  isSuperAdmin: boolean;
  isSimulating: boolean;
  scope: DataScope;
  /** Toutes les actions autorisées sur une page */
  permissions: (pageId: string) => ActionSet;
  /** Une action précise est-elle autorisée ? */
  can: (pageId: string, action: PermissionAction) => boolean;
  canViewPage: (pageId: string) => boolean;
  canViewPath: (path: string) => boolean;
  canViewPole: (poleId: string) => boolean;
  visiblePoles: string[];
}

export const usePermissions = (): UsePermissionsReturn => {
  const { profile } = useAuth();
  const { isAdmin } = useUserRole();
  const { role: simulatedRole } = useViewAs();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (profile) startPermissionSync(profile.test_account === true);
  }, [profile]);

  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener(MATRIX_EVENT, handler);
    window.addEventListener('storage', handler);
    window.addEventListener('view-as-changed', handler);
    return () => {
      window.removeEventListener(MATRIX_EVENT, handler);
      window.removeEventListener('storage', handler);
      window.removeEventListener('view-as-changed', handler);
    };
  }, []);

  const role = simulatedRole ?? inferRole(profile?.position, profile?.poles);

  // Permissions enregistrées en base pour ce rôle (Rôles & Permissions).
  const { data: dbPermissions } = useQuery({
    queryKey: ['access-permissions', role?.id, tick],
    enabled: !!role?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('access_permissions')
        .select('allowed, access_roles!inner(role_key), access_interfaces!inner(interface_key), access_actions!inner(action_key)')
        .eq('access_roles.role_key', role!.id)
        .limit(5000);
      if (error) return {};
      const map: Record<string, Partial<ActionSet>> = {};
      (data || []).forEach((r: any) => {
        const page = r.access_interfaces?.interface_key;
        const action = r.access_actions?.action_key as PermissionAction;
        if (!page || !action) return;
        (map[page] ??= {})[action] = !!r.allowed;
      });
      return map;
    },
  });

  useEffect(() => {
    const ch = (supabase as any)
      .channel(`access-permissions-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'access_permissions' }, () => setTick((t) => t + 1))
      .subscribe();
    return () => { (supabase as any).removeChannel(ch); };
  }, []);

  const poles = simulatedRole ? simulatedRole.poles : (profile?.poles ?? role?.poles ?? []);
  const seniority = (simulatedRole?.seniority ?? (profile?.seniority as Seniority) ?? role?.seniority ?? 'junior');
  const isTestAccount = profile?.test_account === true;

  // Le mode construction ne peut pas désactiver le RBAC des comptes réels.
  const enforced = isTestAccount
    ? isTestRbacEnforced()
    : true;

  // En simulation, l'admin doit voir exactement ce que voit le rôle simulé.
  const isSuperAdmin = isAdmin && !simulatedRole;

  const ctx = useMemo(() => ({
    role,
    poles,
    seniority,
    isSuperAdmin,
    enforced,
    dbPermissions: dbPermissions ?? {},

    // Les surcharges de test ne sont appliquées qu'aux comptes de test.
    overrides:
      profile?.test_account === true
        ? loadTestMatrixOverrides()
        : {},

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    role?.id,
    poles.join(','),
    seniority,
    isSuperAdmin,
    tick,
    enforced,
    profile?.test_account,
    dbPermissions,
  ]);

  const permissions = useCallback(
    (pageId: string): ActionSet => (pageId ? resolvePagePermissions(pageId, ctx) : { ...NO_ACCESS }),
    [ctx],
  );

  const can = useCallback(
    (pageId: string, action: PermissionAction) => permissions(pageId)[action],
    [permissions],
  );

  const canViewPage = useCallback((pageId: string) => permissions(pageId).read, [permissions]);

  const canViewPath = useCallback((path: string) => {
  const page = getPageByPath(path);

  if (!page) return false;

  return permissions(page.id).read;
}, [permissions]);

  const visiblePoles = useMemo(() => {
    const scopes = Array.from(new Set(pageRegistry.filter((p) => !p.transversal).map((p) => p.scope)));
    if (!enforced || isSuperAdmin) return scopes;
    return scopes.filter((s) => pageRegistry.some((p) => p.scope === s && permissions(p.id).read));
  }, [enforced, isSuperAdmin, permissions]);

  const canViewPole = useCallback((poleId: string) => visiblePoles.includes(poleId), [visiblePoles]);

  return {
    role, poles, seniority, enforced, isSuperAdmin,
    isSimulating: !!simulatedRole,
    scope: getDataScope(role),
    permissions, can, canViewPage, canViewPath, canViewPole, visiblePoles,
  };
};
