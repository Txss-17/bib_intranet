import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { moduleById } from '@/lib/intranet';
import { permissionQueryState, readIntranetPermissions, type AccessState } from '@/lib/permissionReadiness';
import { useWorkTaskPermissions } from '@/hooks/useWorkTasks';
import { useUserRole } from '@/hooks/useUserRole';
import { useViewAs } from '@/hooks/useViewAs';
import { jobRoles, JobRole } from '@/data/jobRoles';
import { Seniority } from '@/data/permissionRules';
import { effectiveHrPublicationPermissions, type HrPublicationPermissions } from '@/lib/hrPublications';
import { effectiveHrOnboardingPermissions, normalizeHrOnboardingPermissions, type HrOnboardingPermissions } from '@/lib/hrEmployeeMutations';
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
  accessState: (pageId: string) => AccessState;
  retryAccess: (pageId: string) => void;
}

export const usePermissions = (): UsePermissionsReturn => {
  const { profile, user } = useAuth();
  const { isAdmin } = useUserRole();
  const taskRights = useWorkTaskPermissions();
  const { role: simulatedRole } = useViewAs();
  const [tick, setTick] = useState(0);
  const serverRights = useQuery({
    queryKey: ['intranet-permissions', user?.id, tick],
    enabled: !!user?.id && profile?.id === user.id,
    staleTime: 30000, refetchInterval: 60000,
    retry: 1,
    queryFn: ({ signal }) => readIntranetPermissions(signal),
  });


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

  // Navigation and page actions must agree with the server's assigned-role checks.
  const hrRights = useQuery({
    queryKey: ['hr-publication-permissions', profile?.id],
    enabled: !!profile?.id,
    staleTime: 15_000,
    refetchInterval: 30_000,
    queryFn: async (): Promise<HrPublicationPermissions> => {
      const { data, error } = await supabase.rpc('get_hr_publication_permissions' as never);
      if (error) throw error;
      if (!data || typeof data !== 'object' || Array.isArray(data))
        throw new Error('Droits des publications RH indisponibles.');
      return effectiveHrPublicationPermissions(data as unknown as HrPublicationPermissions);
    },
  });


  // The same raw RPC result is shared with the onboarding page, including apply.
  const onboardingRights = useQuery({
    queryKey: ['hr-onboarding-permissions', profile?.id],
    enabled: !!profile?.id && profile.id === user?.id,
    staleTime: 15_000,
    refetchInterval: 30_000,
    queryFn: async (): Promise<HrOnboardingPermissions> => {
      const { data, error } = await supabase.rpc('get_hr_onboarding_permissions' as never);
      if (error) throw error;
      if (!data || typeof data !== 'object' || Array.isArray(data))
        throw new Error('Droits de l’onboarding RH indisponibles.');
      return normalizeHrOnboardingPermissions(data);
    },
  });

  // Permissions enregistrées en base pour ce rôle (Rôles & Permissions).
  const { data: dbPermissions } = useQuery({
    queryKey: ['access-permissions', role?.id, tick],
    enabled: !!role?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_permissions')
        .select('allowed, access_roles!inner(role_key), access_interfaces!inner(interface_key), access_actions!inner(action_key)')
        .eq('access_roles.role_key', role!.id)
        .limit(5000);
      if (error) return {};
      const map: Record<string, Partial<ActionSet>> = {};
      (data || []).forEach((r) => {
        const page = r.access_interfaces?.interface_key;
        const action = r.access_actions?.action_key as PermissionAction;
        if (!page || !action) return;
        (map[page] ??= {})[action] = !!r.allowed;
      });
      return map;
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`access-permissions-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'access_permissions' }, () => setTick((t) => t + 1))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
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
    (pageId: string): ActionSet => {
      if (!pageId) return { ...NO_ACCESS };
      pageId = moduleById(pageId)?.id || pageId;
      if (pageId === 'work.tasks') {
        if (!profile?.id || profile.id !== user?.id) return { ...NO_ACCESS };
        const preview = simulatedRole ? resolvePagePermissions(pageId, ctx) : undefined;
        return {
          ...NO_ACCESS,
          read: taskRights.data?.read === true && (!preview || preview.read),
          create: taskRights.data?.create === true && (!preview || preview.create),
          update: taskRights.data?.update === true && (!preview || preview.update),
          delete: taskRights.data?.delete === true && (!preview || preview.delete),
        };
      }
      if (pageId === 'rh.onboarding') {
        if (!profile?.id || profile.id !== user?.id) return { ...NO_ACCESS };
        const preview = simulatedRole ? resolvePagePermissions(pageId, ctx) : undefined;
        return { ...NO_ACCESS, ...effectiveHrOnboardingPermissions(onboardingRights.data, preview) };
      }
      if (pageId === 'rh.publications') {
        const preview = simulatedRole ? resolvePagePermissions(pageId, ctx) : undefined;
        return { ...NO_ACCESS, ...effectiveHrPublicationPermissions(hrRights.data, preview) };
      }
      const actual = !serverRights.isError ? serverRights.data?.[pageId] : undefined;
      if (!actual || !profile?.id || profile.id !== user?.id) return { ...NO_ACCESS };
      const preview = simulatedRole ? resolvePagePermissions(pageId, ctx) : undefined;
      return Object.fromEntries(Object.keys(NO_ACCESS).map(action => [action, actual[action as PermissionAction] === true && (!preview || preview[action as PermissionAction])])) as ActionSet;
    },
    [ctx, serverRights.data, serverRights.isError, taskRights.data, hrRights.data, onboardingRights.data, simulatedRole, profile?.id, user?.id],
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
    // Never advertise an unrestricted pole simply because the browser sees
    // a technical admin role: page access is derived from live server rights.
    return scopes.filter((s) => pageRegistry.some((p) => p.scope === s && permissions(p.id).read));
  }, [permissions]);

  const canViewPole = useCallback((poleId: string) => visiblePoles.includes(poleId), [visiblePoles]);

  const accessState = (pageId: string): AccessState => {
    pageId = moduleById(pageId)?.id || pageId;
    return permissionQueryState(pageId === 'work.tasks' ? taskRights
      : pageId === 'rh.onboarding' ? onboardingRights : pageId === 'rh.publications' ? hrRights : serverRights);
  };
  const retryAccess = (pageId: string) => {
    pageId = moduleById(pageId)?.id || pageId;
    void (pageId === 'work.tasks' ? taskRights : pageId === 'rh.onboarding' ? onboardingRights
      : pageId === 'rh.publications' ? hrRights : serverRights).refetch();
  };

  return {
    role, poles, seniority, enforced, isSuperAdmin,
    isSimulating: !!simulatedRole,
    scope: getDataScope(role),
    permissions, can, canViewPage, canViewPath, canViewPole, visiblePoles, accessState, retryAccess,
  };
};

