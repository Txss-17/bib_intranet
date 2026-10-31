
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  Check,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from '@/hooks/use-toast';
import { poles as availablePoles } from '@/data/poles';
import { MATRIX_EVENT } from '@/data/permissionMatrix';
import HierarchicalScopeEditor from '@/components/admin/HierarchicalScopeEditor';
import {
  syncAccessCatalog,
  type AccessRolePayload,
  type AccessRoleScopePayload,
} from '@/lib/accessCatalogSync';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

type AccessRole = {
  id: string;
  role_key: string;
  label: string;
  department: string | null;
  business_pole: string | null;
  description: string | null;
  owner_type: string;
  status: string;
  seniority: string | null;
  is_external: boolean;
  read_only: boolean;
  poles: string[];
  landing_path: string | null;
};

type AccessInterface = {
  id: string;
  interface_key: string;
  label: string;
  module: string | null;
  pole: string | null;
  path: string | null;
  status: string;
};

type AccessAction = {
  id: string;
  action_key: string;
  label: string;
  description: string | null;
};

type AccessPermission = {
  id: string;
  role_id: string;
  interface_id: string;
  action_id: string;
  allowed: boolean;
};

type ScopeRow = {
  id: string;
  scope_key: string;
  label: string;
  scope_type: string;
};

type RoleScopeRow = {
  role_id: string;
  scope_id: string;
  scope_value: string | null;
};

type ScopeKind =
  | 'global'
  | 'pole'
  | 'portfolio'
  | 'region'
  | 'own_records'
  | 'subsidiary';

const ACTION_ORDER = [
  'read',
  'create',
  'update',
  'delete',
  'publish',
  'validate',
  'administer',
];

const ACTION_LABELS: Record<string, string> = {
  read: 'Lire',
  create: 'Créer',
  update: 'Modifier',
  delete: 'Supprimer',
  publish: 'Publier',
  validate: 'Valider',
  administer: 'Administrer',
};

const INITIAL_ROLE_FORM = {
  role_key: '',
  label: '',
  department: '',
  description: '',
  owner_type: 'pole_responsible' as 'pole_responsible' | 'direction',
  seniority: 'mid' as 'junior' | 'mid' | 'senior' | 'lead' | 'executive',
  status: 'draft' as 'draft' | 'active',
  is_external: false,
  read_only: false,
  landing_path: '',
  scope_kind: 'pole' as ScopeKind,
  selected_poles: [] as string[],
  scope_value: '',
};

const permissionKey = (
  roleId: string,
  interfaceId: string,
  actionId: string,
) => `${roleId}:${interfaceId}:${actionId}`;

const normalizeRoleKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return fallback;
};

const RolesPermissions = () => {
  const { profile, refreshProfile } = useAuth();
  const { isSuperAdmin, isSimulating } = usePermissions();
  const technicalRole = useUserRole();

  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [interfaces, setInterfaces] = useState<AccessInterface[]>([]);
  const [actions, setActions] = useState<AccessAction[]>([]);
  const [permissions, setPermissions] = useState<AccessPermission[]>([]);
  const [permissionsRoleId, setPermissionsRoleId] = useState('');
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState('');
  const [permissionsReloadToken, setPermissionsReloadToken] = useState(0);
  const [scopes, setScopes] = useState<ScopeRow[]>([]);
  const [roleScopes, setRoleScopes] = useState<RoleScopeRow[]>([]);
  const [businessSubsidiaries, setBusinessSubsidiaries] = useState<string[]>([]);

  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [activeTab, setActiveTab] = useState('permissions');
  const [roleAssignmentCounts, setRoleAssignmentCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [poleFilter, setPoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAllActions, setShowAllActions] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingCatalog, setSyncingCatalog] = useState(false);
  const [creatingRole, setCreatingRole] = useState(false);

  const [draft, setDraft] = useState<Record<string, boolean>>({});
  const [roleForm, setRoleForm] = useState({ ...INITIAL_ROLE_FORM });
  const [scopeDraft, setScopeDraft] = useState<Array<{ scope_id: string; scope_value: string }>>([]);
  const [scopeReason, setScopeReason] = useState('');
  const [savingScopes, setSavingScopes] = useState(false);

  const loadCatalog = useCallback(async () => {
    setLoading(true);

    try {
      const [
        rolesResult,
        interfacesResult,
        actionsResult,
        roleScopesResult,
        scopesResult,
        assignmentsResult,
        subsidiariesResult,
      ] = await Promise.all([
        supabase
          .from('access_roles')
          .select(
            'id, role_key, label, department, business_pole, description, owner_type, status, seniority, is_external, read_only, poles, landing_path',
          )
          .order('label'),

        supabase
          .from('access_interfaces')
          .select('id, interface_key, label, module, pole, path, status')
          .order('module')
          .order('label'),

        supabase
          .from('access_actions')
          .select('id, action_key, label, description')
          .order('label'),

        supabase
          .from('access_role_scopes')
          .select('role_id, scope_id, scope_value'),

        supabase
          .from('access_scopes')
          .select('id, scope_key, label, scope_type')
          .order('label'),

        supabase.from('access_assignments').select('role_id, status').eq('status', 'active'),
        supabase.from('profiles').select('subsidiary').eq('test_account', false).not('subsidiary', 'is', null),
      ]);

      const error =
        rolesResult.error ||
        interfacesResult.error ||
        actionsResult.error ||
        roleScopesResult.error ||
        scopesResult.error ||
        assignmentsResult.error;

      if (error) throw error;

      const nextRoles = (rolesResult.data ?? []) as AccessRole[];
      const nextInterfaces = (interfacesResult.data ?? []) as AccessInterface[];
      const nextActions = (actionsResult.data ?? []) as AccessAction[];

      setRoles(nextRoles);
      setInterfaces(nextInterfaces);
      setActions(
        [...nextActions].sort((a, b) => {
          const ai = ACTION_ORDER.indexOf(a.action_key);
          const bi = ACTION_ORDER.indexOf(b.action_key);
          return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
        }),
      );
      setRoleScopes((roleScopesResult.data ?? []) as RoleScopeRow[]);
      setScopes((scopesResult.data ?? []) as ScopeRow[]);
      if (!subsidiariesResult.error) {
        setBusinessSubsidiaries(Array.from(new Set((subsidiariesResult.data ?? [])
          .map((item) => item.subsidiary?.trim())
          .filter((value): value is string => Boolean(value)))).sort());
      } else {
        setBusinessSubsidiaries([]);
      }
      const counts: Record<string, number> = {};
      for (const assignment of assignmentsResult.data ?? []) {
        counts[assignment.role_id] = (counts[assignment.role_id] ?? 0) + 1;
      }
      setRoleAssignmentCounts(counts);

      setSelectedRoleId((current) =>
        current && nextRoles.some((role) => role.id === current)
          ? current
          : nextRoles.find((role) => role.role_key === 'ceo' && role.status === 'active')?.id ?? nextRoles[0]?.id ?? '',
      );

      // Refresh only the currently selected role's matrix; never download the whole 23k+ row catalog.
      setPermissionsReloadToken((current) => current + 1);
    } catch (error) {
      console.error('RBAC catalog loading error:', error);

      toast({
        title: 'Chargement impossible',
        description: getErrorMessage(
          error,
          'Impossible de charger le catalogue des rôles et interfaces.',
        ),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  // Load only the selected role: with 100+ roles, downloading every permission
  // serially used to block the CEO selector behind tens of thousands of rows.
  useEffect(() => {
    let cancelled = false;
    setPermissions([]);
    setDraft({});
    setPermissionsRoleId('');
    setPermissionsError('');
    if (!selectedRoleId) {
      setPermissionsLoading(false);
      return;
    }
    setPermissionsLoading(true);
    const loadRolePermissions = async () => {
      try {
        const all: AccessPermission[] = [];
        const pageSize = 1000;
        for (let offset = 0; ; offset += pageSize) {
          const { data, error } = await supabase
            .from('access_permissions')
            .select('id, role_id, interface_id, action_id, allowed')
            .eq('role_id', selectedRoleId)
            .order('interface_id')
            .order('action_id')
            .range(offset, offset + pageSize - 1);
          if (error) throw error;
          if (cancelled) return;
          all.push(...((data ?? []) as AccessPermission[]));
          if (!data || data.length < pageSize) break;
        }
        if (cancelled) return;
        setPermissions(all);
        setDraft(Object.fromEntries(all.map((permission) => [
          permissionKey(permission.role_id, permission.interface_id, permission.action_id),
          permission.allowed,
        ])));
        setPermissionsRoleId(selectedRoleId);
      } catch (error) {
        if (!cancelled) {
          setPermissionsError(getErrorMessage(error, 'Impossible de charger les permissions de ce rôle.'));
          setPermissionsRoleId('');
        }
      } finally {
        if (!cancelled) setPermissionsLoading(false);
      }
    };
    void loadRolePermissions();
    return () => { cancelled = true; };
  }, [selectedRoleId, permissionsReloadToken]);

  const rolePermissionsReady = !permissionsLoading &&
    !permissionsError && !!selectedRoleId && permissionsRoleId === selectedRoleId;

  // Editing pre-existing scopes is separate from creating roles or changing the
  // permission matrix. Never infer a role's scopes from its display label.
  useEffect(() => {
    setScopeDraft(
      roleScopes
        .filter((entry) => entry.role_id === selectedRoleId)
        .map((entry) => ({
          scope_id: entry.scope_id,
          scope_value: entry.scope_value ?? '',
        })),
    );
    setScopeReason('');
  }, [roleScopes, selectedRoleId]);

  const toggleScopeValue = (scopeKey: ScopeKind, scopeValue: string | null, selected: boolean) => {
    const definition = scopes.find((item) => item.scope_key === scopeKey);
    if (!definition || !isSuperAdmin || savingScopes) return;
    setScopeDraft((current) => {
      const withoutGlobal = current.filter((item) => scopes.find((s) => s.id === item.scope_id)?.scope_key !== 'global');
      if (scopeKey === 'global') {
        return selected ? [{ scope_id: definition.id, scope_value: '' }] : [];
      }
      const next = withoutGlobal.filter((item) => !(item.scope_id === definition.id && item.scope_value === (scopeValue ?? '')));
      return selected ? [...next, { scope_id: definition.id, scope_value: scopeValue ?? '' }] : next;
    });
  };

  const scopeSelected = (scopeKey: ScopeKind, scopeValue: string | null) => {
    const definition = scopes.find((item) => item.scope_key === scopeKey);
    return !!definition && scopeDraft.some((item) => item.scope_id === definition.id && item.scope_value === (scopeValue ?? ''));
  };

  const addScope = () => {
    const scope = scopes.find((item) => item.scope_key === 'pole') ?? scopes.find((item) => item.scope_key === 'global');
    if (!scope) return;
    setScopeDraft((current) => current.some((item) => scopes.find((s) => s.id === item.scope_id)?.scope_key === 'global')
      ? [{ scope_id: scope.id, scope_value: '' }]
      : [...current, { scope_id: scope.id, scope_value: '' }]);
  };

  const saveExistingRoleScopes = async () => {
    if (!isSuperAdmin || !selectedRoleId || savingScopes) return;
    if (scopeReason.trim().length < 8) {
      toast({ title: 'Motif obligatoire', description: 'Précisez le motif de cette modification (8 caractères minimum).', variant: 'destructive' });
      return;
    }
    if (scopeDraft.length === 0) {
      toast({ title: 'Périmètre requis', description: 'Conservez au moins un périmètre par rôle.', variant: 'destructive' });
      return;
    }

    const expected = roleScopes
      .filter((entry) => entry.role_id === selectedRoleId)
      .map((entry) => ({ scope_id: entry.scope_id, scope_value: entry.scope_value }));
    const next = scopeDraft.map((entry) => ({
      scope_id: entry.scope_id,
      scope_value: entry.scope_value.trim() || null,
    }));
    const key = (entry: { scope_id: string; scope_value: string | null }) =>
      `${entry.scope_id}:${entry.scope_value ?? ''}`;
    if (new Set(next.map(key)).size !== next.length) {
      toast({ title: 'Doublon', description: 'Ce périmètre est attribué plusieurs fois au même rôle.', variant: 'destructive' });
      return;
    }
    const chosen = next.map((entry) => ({ ...entry, scope: scopes.find((scope) => scope.id === entry.scope_id) }));
    if (chosen.some((entry) =>
      !entry.scope ||
      (['global', 'own_records'].includes(entry.scope.scope_key) ? entry.scope_value !== null : !entry.scope_value)
    ) || (chosen.some((entry) => entry.scope?.scope_key === 'global') && chosen.length > 1)) {
      toast({ title: 'Périmètres invalides', description: 'Renseignez les valeurs nécessaires et ne combinez pas Global avec des restrictions.', variant: 'destructive' });
      return;
    }

    setSavingScopes(true);
    try {
      // The RPC enforces admin rights and updates the role scopes and audit
      // history atomically; no client-side delete/insert sequence.
      const { error } = await (supabase as any).rpc('replace_access_role_scopes', {
        p_role_id: selectedRoleId,
        p_expected: expected,
        p_next: next,
        p_reason: scopeReason.trim(),
      });
      if (error) throw error;
      await loadCatalog();
      window.dispatchEvent(new Event(MATRIX_EVENT));
      toast({ title: 'Périmètres enregistrés', description: 'Le rôle existant a été mis à jour sans modifier sa matrice de permissions.' });
    } catch (error) {
      toast({ title: 'Modification impossible', description: getErrorMessage(error, 'Recharger la page et vérifier la fonction de gestion des périmètres.'), variant: 'destructive' });
    } finally {
      setSavingScopes(false);
    }
  };

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  const modules = useMemo(
    () =>
      Array.from(
        new Set(
          interfaces
            .map((item) => item.module)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    [interfaces],
  );

  const poleOptions = useMemo(
    () =>
      Array.from(
        new Set(
          interfaces
            .map((item) => item.pole)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    [interfaces],
  );

  // Le catalogue complet est chargé. Les filtres ne retirent que les
  // éléments de l'affichage, jamais les lignes enregistrées en base.
  const visibleInterfaces = useMemo(() => {
    const query = search.trim().toLowerCase();

    return interfaces.filter((item) => {
      if (moduleFilter !== 'all' && item.module !== moduleFilter) return false;
      if (poleFilter !== 'all' && item.pole !== poleFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      if (!query) return true;

      return [
        item.label,
        item.interface_key,
        item.module,
        item.pole,
        item.path,
        item.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [interfaces, moduleFilter, poleFilter, statusFilter, search]);

  const activeActions = useMemo(
    () =>
      showAllActions
        ? actions
        : actions.filter((action) =>
            ['read', 'create', 'update', 'delete'].includes(action.action_key),
          ),
    [actions, showAllActions],
  );

  const roleScopeLabels = useCallback(
    (roleId: string) => {
      const assignments = roleScopes.filter((item) => item.role_id === roleId);

      if (!assignments.length) return 'Aucun périmètre configuré';

      return assignments
        .map((assignment) => {
          const scope = scopes.find((item) => item.id === assignment.scope_id);

          if (!scope) return assignment.scope_value ?? 'Périmètre';

          return assignment.scope_value
            ? `${scope.label} : ${assignment.scope_value}`
            : scope.label;
        })
        .join(', ');
    },
    [roleScopes, scopes],
  );

  const isAllowed = useCallback(
    (interfaceId: string, actionId: string) => {
      const key = permissionKey(selectedRoleId, interfaceId, actionId);

      if (!rolePermissionsReady) return false;
      if (Object.prototype.hasOwnProperty.call(draft, key)) {
        return draft[key];
      }

      return (
        permissions.find(
          (permission) =>
            permission.role_id === selectedRoleId &&
            permission.interface_id === interfaceId &&
            permission.action_id === actionId,
        )?.allowed ?? false
      );
    },
    [draft, permissions, selectedRoleId, rolePermissionsReady],
  );

  const togglePermission = (
    interfaceId: string,
    actionId: string,
    allowed: boolean,
  ) => {
    if (!rolePermissionsReady) return;
    const key = permissionKey(selectedRoleId, interfaceId, actionId);

    setDraft((current) => ({ ...current, [key]: allowed }));
  };

  const toggleInterfaceActions = (
    interfaceId: string,
    allowed: boolean,
  ) => {
    if (!rolePermissionsReady) return;

    setDraft((current) => {
      const next = { ...current };

      actions.forEach((action) => {
        next[permissionKey(selectedRoleId, interfaceId, action.id)] = allowed;
      });

      return next;
    });
  };

  const toggleAllVisible = (allowed: boolean) => {
    if (!rolePermissionsReady) return;

    setDraft((current) => {
      const next = { ...current };

      visibleInterfaces.forEach((item) => {
        actions.forEach((action) => {
          next[permissionKey(selectedRoleId, item.id, action.id)] = allowed;
        });
      });

      return next;
    });
  };

  const savePermissions = async () => {
    if (!rolePermissionsReady) {
      toast({ title: 'Matrice non disponible', description: 'Attendez le chargement sécurisé de ce rôle puis réessayez.', variant: 'destructive' });
      return;
    }
    if (!selectedRoleId) {
      toast({
        title: 'Aucun rôle sélectionné',
        description: 'Sélectionnez un rôle avant d’enregistrer les permissions.',
        variant: 'destructive',
      });
      return;
    }

    if (!isSuperAdmin) {
      toast({
        title: 'Accès administrateur requis',
        description: 'Seul un administrateur global peut modifier cette matrice.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const existing = permissions.filter(
        (permission) => permission.role_id === selectedRoleId,
      );

      const existingByKey = new Map(
        existing.map((permission) => [
          `${permission.interface_id}:${permission.action_id}`,
          permission.allowed,
        ]),
      );

      // Only write changed permissions: this avoids overwriting the entire
      // catalogue and limits the impact of concurrent admin sessions.
      const rows = interfaces.flatMap((interfaceItem) =>
        actions.flatMap((action) => {
          const pairKey = `${interfaceItem.id}:${action.id}`;
          const draftKey = permissionKey(selectedRoleId, interfaceItem.id, action.id);
          const previous = existingByKey.get(pairKey) ?? false;
          const allowed = draft[draftKey] ?? previous;
          if (allowed === previous) return [];
          return [{
            role_id: selectedRoleId,
            interface_id: interfaceItem.id,
            action_id: action.id,
            allowed,
          }];
        }),
      );

      if (!rows.length) {
        toast({ title: 'Aucune modification', description: 'Les permissions de ce rôle sont déjà enregistrées.' });
        return;
      }

      // Paginate writes to respect API payload limits; persistent server-side
      // transactionality should eventually be handled by a single audited RPC.
      const batchSize = 250;
      for (let from = 0; from < rows.length; from += batchSize) {
        const { error } = await supabase
          .from('access_permissions')
          .upsert(rows.slice(from, from + batchSize), {
            onConflict: 'role_id,interface_id,action_id',
          });
        if (error) throw error;
      }

      const historyResult = await supabase
        .from('access_change_history')
        .insert({
          actor_id: profile?.id ?? null,
          role_id: selectedRoleId,
          change_type: 'permission_matrix_update',
          previous_value: existing.filter((permission) => rows.some((row) => row.interface_id === permission.interface_id && row.action_id === permission.action_id)),
          new_value: rows,
          reason: 'Modification depuis Rôles & Permissions',
        });

      if (historyResult.error) {
        console.warn(
          'RBAC history write failed:',
          historyResult.error.message,
        );
      }

      window.dispatchEvent(new Event(MATRIX_EVENT));
      toast({
        title: 'Permissions enregistrées',
        description: `${rows.length} permission(s) modifiée(s) pour « ${selectedRole?.label ?? selectedRoleId} ».`,
      });

      await loadCatalog();
    } catch (error) {
      console.error('RBAC permission save error:', error);

      toast({
        title: 'Enregistrement impossible',
        description: getErrorMessage(
          error,
          'Impossible d’enregistrer les permissions.',
        ),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const synchronizeCatalog = async () => {
    if (!isSuperAdmin) {
      toast({
        title: 'Accès administrateur requis',
        description: 'Seul un administrateur global peut synchroniser le catalogue.',
        variant: 'destructive',
      });
      return;
    }

    setSyncingCatalog(true);

    try {
      const result = await syncAccessCatalog();

      await loadCatalog();

      toast({
        title: 'Synchronisation terminée',
        description:
          `Interfaces : ${result.synchronized?.interfaces ?? 0} ; ` +
          `rôles : ${result.synchronized?.roles ?? 0} ; ` +
          `périmètres : ${result.synchronized?.scopes ?? 0}.`,
      });
    } catch (error) {
      console.error('RBAC catalog synchronization error:', error);

      toast({
        title: 'Synchronisation impossible',
        description: getErrorMessage(
          error,
          'La fonction de synchronisation a échoué. Vérifiez son déploiement et ses journaux.',
        ),
        variant: 'destructive',
      });
    } finally {
      setSyncingCatalog(false);
    }
  };

  const togglePole = (poleId: string, checked: boolean) => {
    setRoleForm((current) => ({
      ...current,
      selected_poles: checked
        ? Array.from(new Set([...current.selected_poles, poleId]))
        : current.selected_poles.filter((item) => item !== poleId),
    }));
  };

  const createRole = async () => {
    if (!isSuperAdmin) {
      toast({
        title: 'Accès administrateur requis',
        description: 'Seul un administrateur global peut créer un rôle.',
        variant: 'destructive',
      });
      return;
    }

    const roleKey = normalizeRoleKey(roleForm.role_key || roleForm.label);
    const label = roleForm.label.trim();
    const department = roleForm.department.trim();

    if (!roleKey || !label || !department) {
      toast({
        title: 'Champs obligatoires',
        description: 'Renseignez le libellé, la clé technique et le département.',
        variant: 'destructive',
      });
      return;
    }

    if (roles.some((role) => role.role_key === roleKey)) {
      toast({
        title: 'Clé déjà utilisée',
        description: `Le rôle « ${roleKey} » existe déjà.`,
        variant: 'destructive',
      });
      return;
    }

    if (
      roleForm.scope_kind === 'pole' &&
      roleForm.selected_poles.length === 0
    ) {
      toast({
        title: 'Périmètre incomplet',
        description: 'Sélectionnez au moins un pôle.',
        variant: 'destructive',
      });
      return;
    }

    if (
      ['portfolio', 'region', 'subsidiary'].includes(roleForm.scope_kind) &&
      !roleForm.scope_value.trim()
    ) {
      toast({
        title: 'Périmètre incomplet',
        description: 'Saisissez la valeur du périmètre choisi.',
        variant: 'destructive',
      });
      return;
    }

    setCreatingRole(true);

    try {
      const scopesToCreate: AccessRoleScopePayload[] = [];

      if (roleForm.scope_kind === 'global') {
        scopesToCreate.push({
          role_key: roleKey,
          scope_key: 'global',
          scope_value: null,
        });
      }

      if (roleForm.scope_kind === 'pole') {
        roleForm.selected_poles.forEach((poleId) => {
          scopesToCreate.push({
            role_key: roleKey,
            scope_key: 'pole',
            scope_value: poleId,
          });
        });
      }

      if (roleForm.scope_kind === 'portfolio') {
        scopesToCreate.push({
          role_key: roleKey,
          scope_key: 'portfolio',
          scope_value: roleForm.scope_value.trim(),
        });
      }

      if (roleForm.scope_kind === 'region') {
        scopesToCreate.push({
          role_key: roleKey,
          scope_key: 'region',
          scope_value: roleForm.scope_value.trim().toUpperCase(),
        });
      }

      if (roleForm.scope_kind === 'own_records') {
        scopesToCreate.push({
          role_key: roleKey,
          scope_key: 'own_records',
          scope_value: null,
        });
      }

      if (roleForm.scope_kind === 'subsidiary') {
        scopesToCreate.push({
          role_key: roleKey,
          scope_key: 'subsidiary',
          scope_value: roleForm.scope_value.trim(),
        });
      }

      const newRole: AccessRolePayload = {
        role_key: roleKey,
        label,
        department,
        business_pole: roleForm.selected_poles[0] ?? null,
        owner_type: roleForm.owner_type,
        status: roleForm.status,
        description: roleForm.description.trim() || null,
        seniority: roleForm.seniority,
        is_external: roleForm.is_external,
        read_only: roleForm.read_only,
        poles: roleForm.selected_poles,
        landing_path: roleForm.landing_path.trim() || null,
      };

      await syncAccessCatalog({
        extraRoles: [newRole],
        extraRoleScopes: scopesToCreate,
      });

      const { data: createdRole, error: lookupError } = await supabase
        .from('access_roles')
        .select('id')
        .eq('role_key', roleKey)
        .maybeSingle();

      if (lookupError) throw lookupError;

      if (!createdRole?.id) {
        throw new Error(
          'La synchronisation a répondu, mais le rôle reste introuvable dans access_roles.',
        );
      }

      setRoleForm({ ...INITIAL_ROLE_FORM });

      await loadCatalog();
      setSelectedRoleId(createdRole.id);

      toast({
        title: 'Rôle créé',
        description: `« ${label} » est enregistré. Configurez maintenant ses permissions dans la matrice.`,
      });
    } catch (error) {
      console.error('RBAC role creation error:', error);

      toast({
        title: 'Création impossible',
        description: getErrorMessage(
          error,
          'Impossible de créer le rôle. Vérifiez la fonction de synchronisation.',
        ),
        variant: 'destructive',
      });
    } finally {
      setCreatingRole(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setModuleFilter('all');
    setPoleFilter('all');
    setStatusFilter('all');
  };

  const countAllowed = useMemo(() => {
    if (!rolePermissionsReady) return 0;

    return interfaces.reduce(
      (total, interfaceItem) =>
        total +
        actions.filter((action) =>
          isAllowed(interfaceItem.id, action.id),
        ).length,
      0,
    );
  }, [interfaces, actions, isAllowed, selectedRoleId, rolePermissionsReady]);

  if (!isSuperAdmin) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Card>
          <CardContent className="flex items-start gap-3 p-6">
            <ShieldCheck className="mt-1 h-6 w-6 text-muted-foreground" />
            <div>
              <h1 className="text-lg font-semibold">Rôles & Permissions</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Cette page exige une habilitation technique administrateur effective.
                La configuration du rôle métier CEO ne remplace pas automatiquement
                ce contrôle. {isSimulating ? 'Désactivez le mode « Visualiser comme » pour administrer les vrais rôles.' :
                  technicalRole.isLoading ? 'Vérification de votre habilitation en cours.' :
                  technicalRole.isError ? 'La vérification du rôle technique a échoué : aucun droit administratif n’est accordé par défaut.' :
                  'Si vous disposez du rôle technique admin, rechargez vos droits et vérifiez votre session.'}
              </p>
            </div>
            <Button variant="outline" className="mt-4" disabled={technicalRole.isLoading}
              onClick={() => void technicalRole.refetch()}>
              <RefreshCw className="mr-2 h-4 w-4"/>Revérifier mon rôle technique
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7" />
            <h1 className="text-2xl font-bold tracking-tight">
              Rôles & Permissions
            </h1>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Gérez les rôles, le catalogue complet des interfaces et les actions
            autorisées. Une permission enregistrée en base doit également être
            appliquée par le moteur de contrôle d’accès de l’application.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void (async () => {
              await refreshProfile();
              window.dispatchEvent(new Event(MATRIX_EVENT));
            })()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Recharger mes droits
          </Button>
          <Button
            variant="outline"
            onClick={() => void loadCatalog()}
            disabled={loading || syncingCatalog}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          <Button
            onClick={() => void synchronizeCatalog()}
            disabled={loading || syncingCatalog}
          >
            {syncingCatalog ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Activity className="mr-2 h-4 w-4" />
            )}
            Synchroniser le catalogue
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Rôles enregistrés</p>
            <p className="mt-1 text-2xl font-semibold">{roles.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Interfaces du catalogue
            </p>
            <p className="mt-1 text-2xl font-semibold">{interfaces.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Actions disponibles</p>
            <p className="mt-1 text-2xl font-semibold">{actions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Droits actifs du rôle sélectionné
            </p>
            <p className="mt-1 text-2xl font-semibold">{countAllowed}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="permissions">Matrice des permissions</TabsTrigger>
          <TabsTrigger value="roles">Catalogue des rôles</TabsTrigger>
          <TabsTrigger value="scopes">Périmètres hiérarchiques</TabsTrigger>
          <TabsTrigger value="flat-scopes">Périmètres simples (historiques)</TabsTrigger>
          <TabsTrigger value="scope-catalog">Catalogue des périmètres</TabsTrigger>
          <TabsTrigger value="create">Créer un rôle</TabsTrigger>
          <TabsTrigger value="actions">Catalogue des actions</TabsTrigger>
        </TabsList>

        <TabsContent value="scope-catalog" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Catalogue des types de périmètre</CardTitle>
              <p className="text-sm text-muted-foreground">
                Un type de périmètre est une règle de portée. Pour créer un périmètre concret,
                choisissez le type, sa valeur et le rôle destinataire dans « Configurer les périmètres ».
                RH ne peut attribuer que les périmètres autorisés pour le rôle.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/40">
                    <th className="p-3 text-left">Type</th><th className="p-3 text-left">Code</th><th className="p-3 text-left">Utilisation</th>
                  </tr></thead>
                  <tbody>
                    {scopes.filter((scope) => ['global', 'pole', 'portfolio', 'region', 'own_records', 'subsidiary'].includes(scope.scope_key)).map((scope) => <tr key={scope.id} className="border-b last:border-0">
                      <td className="p-3 font-medium">{scope.scope_key === 'subsidiary' ? 'Filiales BIB' : scope.scope_key === 'own_records' ? 'Dossiers dont je suis responsable' : scope.label}</td>
                      <td className="p-3 font-mono text-xs">{scope.scope_key}</td>
                      <td className="p-3">{scope.scope_key === 'pole' ? 'Choisir un des 14 pôles BIB' :
                        scope.scope_key === 'global' ? 'Tous les enregistrements autorisés par le rôle' :
                        scope.scope_key === 'own_records' ? 'Uniquement les dossiers du collaborateur' :
                        scope.scope_key === 'portfolio' ? 'Identifiant de portefeuille autorisé' :
                        scope.scope_key === 'region' ? 'Code région' :
                        scope.scope_key === 'subsidiary' ? 'Entité BIB réellement enregistrée, avec une valeur exacte' :
                        'Type historique non pris en charge par l’éditeur : revue technique nécessaire'}</td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Périmètres déjà attribués aux rôles ({roleScopes.length})</h3>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/40">
                      <th className="p-3 text-left">Rôle</th>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-left">Valeur</th>
                      <th className="p-3 text-left">Gestion</th>
                    </tr></thead>
                    <tbody>
                      {roleScopes.map((entry, index) => {
                        const role = roles.find((item) => item.id === entry.role_id);
                        const scope = scopes.find((item) => item.id === entry.scope_id);
                        return <tr key={`${entry.role_id}-${entry.scope_id}-${entry.scope_value ?? ''}-${index}`} className="border-b last:border-0">
                          <td className="p-3">{role?.label ?? 'Rôle inconnu'} <span className="font-mono text-xs text-muted-foreground">({role?.role_key ?? '—'})</span></td>
                          <td className="p-3">{scope?.label ?? 'Type inconnu'}</td>
                          <td className="p-3 font-mono text-xs">{entry.scope_value ?? 'Sans valeur'}</td>
                          <td className="p-3">
                            <Button type="button" variant="outline" size="sm" onClick={() => { setSelectedRoleId(entry.role_id); setActiveTab('scopes'); }}>
                              Modifier
                            </Button>
                          </td>
                        </tr>;
                      })}
                      {roleScopes.length === 0 && <tr><td colSpan={4} className="p-5 text-center text-muted-foreground">
                        Aucun périmètre de rôle enregistré. Choisissez un rôle pour créer sa première attribution.
                      </td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="space-y-2 rounded-lg border p-3">
                <h3 className="text-sm font-medium">Périmètres « Pôle » disponibles</h3>
                <p className="text-xs text-muted-foreground">Ces 14 valeurs peuvent être créées et attribuées à un rôle dans l'onglet Configurer les périmètres.</p>
                <div className="flex flex-wrap gap-2">
                  {availablePoles.map((pole) => <Badge variant="secondary" key={pole.id}>{pole.name} ({pole.id})</Badge>)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Les nouveaux types techniques nécessitent un contrôle serveur et une validation de sécurité ;
                les valeurs concrètes des six types reconnus se configurent ici pour chaque rôle.
              </p>
              <Button type="button" onClick={() => setActiveTab('scopes')}>
                <Plus className="mr-2 h-4 w-4" />Créer et attribuer un périmètre à un rôle
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="scopes" className="mt-4 space-y-4">
          <div className="rounded-md border p-3 text-sm text-muted-foreground">
            <strong>Périmètres interdépendants :</strong> filiale BIB → pôle(s) de cette filiale →
            région(s) et portefeuille(s) → propriété des enregistrements.
            Chaque niveau restreint le précédent ; « Tous » signifie tout dans le parent.
          </div>
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Rôle à préparer</span>
            <select value={selectedRoleId} disabled={loading}
              onChange={event => setSelectedRoleId(event.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3">
              <option value="">Choisir un rôle</option>
              {roles.filter(role => role.status === 'active').map(role =>
                <option key={role.id} value={role.id}>{role.label} ({role.role_key})</option>)}
            </select>
          </label>
          <HierarchicalScopeEditor roleId={selectedRoleId} />
        </TabsContent>
        <TabsContent value="flat-scopes" className="mt-4 space-y-4">
          <p role="note" className="rounded-lg border p-3 text-sm text-muted-foreground">
            Éditeur historique : chaque ligne est indépendante. Il ne représente pas une chaîne de restrictions
            filiale → pôle → région → portefeuille. Pour les politiques imbriquées, utilisez
            « Périmètres hiérarchiques ». Ne modifiez ici que les droits simples dont l'application serveur est vérifiée.
          </p>
          <Card>
            <CardHeader>
              <CardTitle>Modifier les périmètres d’un rôle existant</CardTitle>
              <p className="text-sm text-muted-foreground">
                Les périmètres limitent les données accessibles. Leur modification ne change
                ni les utilisateurs, ni les affectations, ni les autorisations par interface.
                Les contrôles d'accès effectifs restent appliqués par le serveur.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block space-y-2 text-sm font-medium">
                <span>Rôle existant</span>
                <select value={selectedRoleId} onChange={(event) => setSelectedRoleId(event.target.value)}
                  disabled={loading || savingScopes || saving}
                  className="h-10 w-full rounded-md border bg-background px-3">
                  <option value="">Choisir un rôle</option>
                  {roles.map((role) => <option key={role.id} value={role.id}>{role.label} ({role.role_key})</option>)}
                </select>
              </label>
              {selectedRole && (
                <div className="rounded-md border bg-muted/20 p-3 text-sm space-y-1">
                  <p><strong>Configuration enregistrée :</strong> {roleScopeLabels(selectedRole.id)}</p>
                  <p><strong>Affectations actives du rôle :</strong> {roleAssignmentCounts[selectedRole.id] ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Pour donner ce rôle à un compte, utilisez <Link to="/pole/rh/access" className="underline">RH → Accès & habilitations</Link>.</p>
                </div>
              )}
              {!isSuperAdmin && <p role="alert" className="rounded-md border p-3 text-sm text-destructive">
                L'édition des périmètres nécessite le rôle administrateur technique.
              </p>}
              <div className="space-y-4 rounded-lg border p-4">
                <div>
                  <h3 className="text-sm font-semibold">Composer les périmètres métier</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sélection multiple : plusieurs pôles ou entités BIB peuvent être associés au même rôle.
                    « Mes enregistrements » peut être ajouté aux restrictions métier.
                    Global représente une portée sans restriction supplémentaire et ne se combine pas avec les autres.
                  </p>
                </div>
                <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <input type="checkbox" disabled={!isSuperAdmin || savingScopes}
                    checked={scopeSelected('global', null)}
                    onChange={(event) => toggleScopeValue('global', null, event.target.checked)} />
                  <span><strong>Global</strong> — portée générale du rôle (uniquement avec ses droits d'interface)</span>
                </label>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Pôles BIB — sélection multiple</h4>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {availablePoles.map((pole) => <label key={pole.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                      <input type="checkbox" disabled={!isSuperAdmin || savingScopes}
                        checked={scopeSelected('pole', pole.id)}
                        onChange={(event) => toggleScopeValue('pole', pole.id, event.target.checked)} />
                      <span>{pole.name}</span>
                    </label>)}
                  </div>
                </div>
                <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <input type="checkbox" disabled={!isSuperAdmin || savingScopes}
                    checked={scopeSelected('own_records', null)}
                    onChange={(event) => toggleScopeValue('own_records', null, event.target.checked)} />
                  <span><strong>Mes enregistrements</strong> — appliquer une restriction aux dossiers du collaborateur</span>
                </label>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Entités et filiales BIB — sélection multiple</h4>
                  {businessSubsidiaries.length ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {businessSubsidiaries.map((value) => <label key={value} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                        <input type="checkbox" disabled={!isSuperAdmin || savingScopes}
                          checked={scopeSelected('subsidiary', value)}
                          onChange={(event) => toggleScopeValue('subsidiary', value, event.target.checked)} />
                        <span>{value}</span>
                      </label>)}
                    </div>
                  ) : <p className="text-xs text-muted-foreground">Aucune filiale BIB vérifiée accessible. Aucune entité fictive n'est créée.</p>}
                </div>
                <p className="text-xs text-muted-foreground">
                  Régions et portefeuilles peuvent être ajoutés dans l'éditeur avancé ci-dessous.
                  Les périmètres configurés restent soumis aux vérifications RLS des ressources concernées.
                </p>
              </div>
              <h3 className="text-sm font-medium">Périmètres sélectionnés — édition avancée</h3>
              {scopeDraft.map((entry, index) => {
                const selectedScope = scopes.find((item) => item.id === entry.scope_id);
                const needsValue = !['global', 'own_records'].includes(selectedScope?.scope_key ?? '');
                return (
                  <div className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_1fr_auto]" key={index}>
                    <label className="space-y-1 text-sm">
                      <span>Type de périmètre</span>
                      <select value={entry.scope_id} disabled={savingScopes}
                        className="h-10 w-full rounded-md border bg-background px-3"
                        onChange={(event) => setScopeDraft((current) => current.map((item, i) =>
                          i === index ? { scope_id: event.target.value, scope_value: '' } : item
                        ))}>
                        {scopes.filter(scope => ['global', 'pole', 'portfolio', 'region', 'own_records', 'subsidiary'].includes(scope.scope_key)).map((scope) => <option key={scope.id} value={scope.id}>{scope.scope_key === 'subsidiary' ? 'Filiales BIB' : scope.scope_key === 'own_records' ? 'Mes dossiers' : scope.label}</option>)}
                      </select>
                    </label>
                    <label className="space-y-1 text-sm">
                      <span>Valeur autorisée</span>
                      {selectedScope?.scope_key === 'pole' ? (
                        <select value={entry.scope_value} disabled={savingScopes}
                          className="h-10 w-full rounded-md border bg-background px-3"
                          onChange={(event) => setScopeDraft((current) => current.map((item, i) =>
                            i === index ? { ...item, scope_value: event.target.value } : item
                          ))}>
                          <option value="">Choisir un pôle</option>
                          {availablePoles.map((pole) => <option key={pole.id} value={pole.id}>{pole.name}</option>)}
                        </select>
                      ) : selectedScope?.scope_key === 'subsidiary' ? (
                        <select value={entry.scope_value} disabled={savingScopes || !isSuperAdmin || businessSubsidiaries.length === 0}
                          className="h-10 w-full rounded-md border bg-background px-3"
                          onChange={(event) => setScopeDraft((current) => current.map((item, i) =>
                            i === index ? { ...item, scope_value: event.target.value } : item
                          ))}>
                          <option value="">Choisir une entité BIB vérifiée</option>
                          {businessSubsidiaries.map((entity) => <option key={entity} value={entity}>{entity}</option>)}
                        </select>
                      ) : (
                        <Input value={entry.scope_value} disabled={savingScopes || !needsValue}
                          placeholder={needsValue ? 'Identifiant de portefeuille ou région' : 'Sans valeur'}
                          onChange={(event) => setScopeDraft((current) => current.map((item, i) =>
                            i === index ? { ...item, scope_value: event.target.value } : item
                          ))} />
                      )}
                    </label>
                    <Button type="button" variant="outline" className="self-end"
                      disabled={savingScopes || !isSuperAdmin} onClick={() => setScopeDraft((current) => current.filter((_, i) => i !== index))}>
                      Retirer
                    </Button>
                  </div>
                );
              })}
              <Button variant="outline" disabled={!isSuperAdmin || !selectedRoleId || savingScopes || scopes.length === 0}
                onClick={addScope}><Plus className="mr-2 h-4 w-4" />Ajouter un périmètre</Button>
              <label className="block space-y-2 text-sm font-medium">
                <span>Motif de modification (journalisé)</span>
                <Input value={scopeReason} disabled={savingScopes} maxLength={500}
                  placeholder="Ex. Modification de périmètre validée par la direction"
                  onChange={(event) => setScopeReason(event.target.value)} />
              </label>
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" disabled={savingScopes}
                  onClick={() => {
                    setScopeDraft(roleScopes.filter((entry) => entry.role_id === selectedRoleId)
                      .map((entry) => ({ scope_id: entry.scope_id, scope_value: entry.scope_value ?? '' })));
                    setScopeReason('');
                  }}>Annuler les modifications</Button>
                <Button disabled={!isSuperAdmin || !selectedRoleId || savingScopes || loading || scopeReason.trim().length < 8}
                  onClick={() => void saveExistingRoleScopes()}>
                  {savingScopes && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer les périmètres
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rôle à configurer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rôle</label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={selectedRoleId}
                    onChange={(event) => setSelectedRoleId(event.target.value)}
                    disabled={loading || saving}
                  >
                    <option value="">Sélectionner un rôle</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.label} ({role.role_key})
                      </option>
                    ))}
                  </select>
                  {roles.some((role) => role.role_key === 'ceo' && role.status === 'active') && (
                    <Button type="button" size="sm" variant="outline"
                      disabled={loading || saving}
                      onClick={() => setSelectedRoleId(roles.find((role) => role.role_key === 'ceo' && role.status === 'active')?.id ?? '')}>
                      Sélectionner le CEO
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Résumé du rôle</label>
                  <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-md border p-2">
                    {selectedRole ? (
                      <>
                        <Badge variant="outline">
                          {selectedRole.department || 'Sans département'}
                        </Badge>
                        <Badge
                          variant={
                            selectedRole.status === 'active'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {selectedRole.status}
                        </Badge>
                        {selectedRole.read_only && (
                          <Badge variant="outline">Lecture seule</Badge>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Aucun rôle sélectionné
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {permissionsError && <div role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">
                Le chargement des droits de ce rôle a échoué : {permissionsError}
                <Button variant="outline" size="sm" className="ml-2" onClick={() => setPermissionsReloadToken(t => t + 1)}>Réessayer</Button>
              </div>}
              {permissionsLoading && <p role="status" className="text-sm text-muted-foreground">
                Chargement des autorisations du rôle sélectionné…
              </p>}
              {selectedRole?.role_key === 'ceo' && (
                <div role="note" className="rounded-lg border p-3 text-sm">
                  <strong>CEO — administration de démarrage :</strong> le rôle peut être défini sur toutes
                  les interfaces et tous les pôles, avec un périmètre global. Ces droits restent soumis
                  à l’authentification réelle, aux règles RLS et aux approbations indépendantes :
                  une permission ne garantit pas que le module serveur est déployé.
                  {roleScopeLabels(selectedRole.id).includes('Global') ? ' Périmètre global enregistré.' : ' Vérifiez le périmètre global enregistré.'}
                </div>
              )}
              {selectedRole && (
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">Périmètres configurés</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {roleScopeLabels(selectedRole.id)}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => toggleAllVisible(true)}
                    disabled={!rolePermissionsReady || saving || visibleInterfaces.length === 0}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Autoriser les interfaces affichées
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => toggleAllVisible(false)}
                    disabled={!rolePermissionsReady || saving || visibleInterfaces.length === 0}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Retirer les droits affichés
                  </Button>
                </div>

                <Button
                  onClick={() => void savePermissions()}
                  disabled={!rolePermissionsReady || saving || loading}
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Enregistrer la matrice
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div>
                  <CardTitle>Catalogue complet des interfaces</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {visibleInterfaces.length} interface(s) affichée(s) sur{' '}
                    {interfaces.length}. Les filtres ne suppriment aucune donnée.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={showAllActions}
                    onCheckedChange={setShowAllActions}
                  />
                  Afficher toutes les actions
                </label>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Rechercher une interface, une route…"
                  />
                </div>

                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={moduleFilter}
                  onChange={(event) => setModuleFilter(event.target.value)}
                >
                  <option value="all">Tous les modules</option>
                  {modules.map((module) => (
                    <option key={module} value={module}>
                      {module}
                    </option>
                  ))}
                </select>

                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={poleFilter}
                  onChange={(event) => setPoleFilter(event.target.value)}
                >
                  <option value="all">Tous les pôles</option>
                  {poleOptions.map((pole) => (
                    <option key={pole} value={pole}>
                      {pole}
                    </option>
                  ))}
                </select>

                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actives</option>
                  <option value="inactive">Inactives</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Les droits non configurés sont considérés comme refusés.
                </p>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Réinitialiser les filtres
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : interfaces.length === 0 ? (
                <div className="flex items-start gap-3 rounded-lg border border-dashed p-5">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Catalogue vide</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Aucune interface n’a été chargée depuis access_interfaces.
                      Lancez la synchronisation et vérifiez la fonction serveur
                      si le catalogue reste vide.
                    </p>
                  </div>
                </div>
              ) : visibleInterfaces.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Aucune interface ne correspond aux filtres.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[1050px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="sticky left-0 z-10 min-w-[280px] bg-muted/90 p-3 text-left">
                          Interface
                        </th>
                        {activeActions.map((action) => (
                          <th
                            key={action.id}
                            className="min-w-[105px] p-3 text-center"
                          >
                            {ACTION_LABELS[action.action_key] ?? action.label}
                          </th>
                        ))}
                        <th className="min-w-[110px] p-3 text-center">
                          Toutes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleInterfaces.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b last:border-0"
                        >
                          <td className="sticky left-0 z-10 bg-background p-3">
                            <p className="font-medium">{item.label}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.interface_key}
                            </p>
                            {item.path && (
                              <p className="mt-1 break-all text-xs text-muted-foreground">
                                {item.path}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.module && (
                                <Badge variant="outline">{item.module}</Badge>
                              )}
                              {item.pole && (
                                <Badge variant="secondary">{item.pole}</Badge>
                              )}
                              <Badge
                                variant={
                                  item.status === 'active'
                                    ? 'secondary'
                                    : 'outline'
                                }
                              >
                                {item.status || 'sans statut'}
                              </Badge>
                            </div>
                          </td>

                          {activeActions.map((action) => (
                            <td
                              key={action.id}
                              className="p-3 text-center"
                            >
                              <div className="flex justify-center">
                                <Switch
                                  checked={isAllowed(item.id, action.id)}
                                  onCheckedChange={(value) =>
                                    togglePermission(item.id, action.id, value)
                                  }
                                  disabled={!rolePermissionsReady || saving}
                                  aria-label={`${item.label} — ${action.label}`}
                                />
                              </div>
                            </td>
                          ))}

                          <td className="p-3 text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={
                                  actions.length > 0 &&
                                  actions.every((action) =>
                                    isAllowed(item.id, action.id),
                                  )
                                }
                                onCheckedChange={(value) =>
                                  toggleInterfaceActions(item.id, value)
                                }
                                disabled={!rolePermissionsReady || saving}
                                aria-label={`Toutes les actions — ${item.label}`}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  {visibleInterfaces.length} interface(s) visible(s),{' '}
                  {actions.length} action(s) au catalogue.
                </p>
                <Button
                  onClick={() => void savePermissions()}
                  disabled={!selectedRoleId || saving || loading}
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Enregistrer toutes les permissions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Catalogue des rôles</CardTitle>
              <p className="text-xs text-muted-foreground">Le rôle ne donne aucun accès tant qu'il n'est pas effectivement attribué à un compte actif via RH.</p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="p-3 text-left">Rôle</th>
                        <th className="p-3 text-left">Département</th>
                        <th className="p-3 text-left">Périmètre</th>
                        <th className="p-3 text-left">Séniorité</th>
                        <th className="p-3 text-left">Statut</th>
                        <th className="p-3 text-left">Affectations actives</th>
                        <th className="p-3 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map((role) => (
                        <tr key={role.id} className="border-b last:border-0">
                          <td className="p-3">
                            <p className="font-medium">{role.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {role.role_key}
                            </p>
                            {role.is_external && (
                              <Badge variant="outline">Externe</Badge>
                            )}
                          </td>
                          <td className="p-3">{role.department || '—'}</td>
                          <td className="max-w-[280px] whitespace-normal p-3">
                            {roleScopeLabels(role.id)}
                          </td>
                          <td className="p-3">{role.seniority || '—'}</td>
                          <td className="p-3">
                            <Badge
                              variant={
                                role.status === 'active'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {role.status}
                            </Badge>
                          </td>
                          <td className="p-3"><span className={roleAssignmentCounts[role.id] ? '' : 'text-destructive'}>{roleAssignmentCounts[role.id] ?? 0}</span></td>
                          <td className="p-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setSelectedRoleId(role.id); setActiveTab('permissions'); }}
                            >
                              Configurer les droits
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedRoleId(role.id); setActiveTab('scopes'); }}>Périmètres</Button>
                          </td>
                        </tr>
                      ))}
                      {roles.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="p-8 text-center text-muted-foreground"
                          >
                            Aucun rôle dans le catalogue. Synchronisez le
                            catalogue avant de créer un rôle personnalisé.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Créer un rôle métier
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                La création du rôle ne lui accorde pas automatiquement de
                permissions. Configurez ensuite ses accès dans la matrice.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Libellé *</label>
                  <Input
                    value={roleForm.label}
                    placeholder="Ex. Gestionnaire de catalogue"
                    onChange={(event) => {
                      const label = event.target.value;
                      setRoleForm((current) => ({
                        ...current,
                        label,
                        role_key: current.role_key
                          ? current.role_key
                          : normalizeRoleKey(label),
                      }));
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Clé technique *</label>
                  <Input
                    value={roleForm.role_key}
                    placeholder="gestionnaire_catalogue"
                    onChange={(event) =>
                      setRoleForm((current) => ({
                        ...current,
                        role_key: normalizeRoleKey(event.target.value),
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Lettres minuscules, chiffres, tirets et tirets bas.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Département *</label>
                  <Input
                    value={roleForm.department}
                    placeholder="Ex. Fournisseurs & Produits"
                    onChange={(event) =>
                      setRoleForm((current) => ({
                        ...current,
                        department: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Propriétaire du rôle
                  </label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={roleForm.owner_type}
                    onChange={(event) =>
                      setRoleForm((current) => ({
                        ...current,
                        owner_type: event.target.value as
                          | 'pole_responsible'
                          | 'direction',
                      }))
                    }
                  >
                    <option value="pole_responsible">Responsable de pôle</option>
                    <option value="direction">Direction</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Séniorité</label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={roleForm.seniority}
                    onChange={(event) =>
                      setRoleForm((current) => ({
                        ...current,
                        seniority: event.target.value as typeof current.seniority,
                      }))
                    }
                  >
                    <option value="junior">Junior</option>
                    <option value="mid">Intermédiaire</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                    <option value="executive">Exécutif</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Statut initial</label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={roleForm.status}
                    onChange={(event) =>
                      setRoleForm((current) => ({
                        ...current,
                        status: event.target.value as 'draft' | 'active',
                      }))
                    }
                  >
                    <option value="draft">Brouillon</option>
                    <option value="active">Actif</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="min-h-24 w-full rounded-md border bg-background p-3 text-sm"
                    value={roleForm.description}
                    placeholder="Responsabilités et limites du rôle…"
                    onChange={(event) =>
                      setRoleForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <div>
                  <h3 className="font-medium">Périmètre d’accès *</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Le périmètre limite les données accessibles. Il ne remplace
                    pas les permissions accordées par interface.
                  </p>
                </div>

                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={roleForm.scope_kind}
                  onChange={(event) =>
                    setRoleForm((current) => ({
                      ...current,
                      scope_kind: event.target.value as ScopeKind,
                      scope_value: '',
                      selected_poles: [],
                    }))
                  }
                >
                  <option value="global">Global</option>
                  <option value="pole">Un ou plusieurs pôles</option>
                  <option value="portfolio">Portefeuille déterminé</option>
                  <option value="region">Région déterminée</option>
                  <option value="own_records">Mes enregistrements uniquement</option>
                  <option value="subsidiary">Filiale déterminée</option>
                </select>

                {roleForm.scope_kind === 'pole' && (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {availablePoles.map((pole) => (
                      <label
                        key={pole.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={roleForm.selected_poles.includes(pole.id)}
                          onChange={(event) =>
                            togglePole(pole.id, event.target.checked)
                          }
                        />
                        <span>{pole.name}</span>
                      </label>
                    ))}
                  </div>
                )}

                {['portfolio', 'region', 'subsidiary'].includes(
                  roleForm.scope_kind,
                ) && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {roleForm.scope_kind === 'portfolio'
                        ? 'Nom ou identifiant du portefeuille'
                        : roleForm.scope_kind === 'region'
                          ? 'Code de région'
                          : 'Nom ou identifiant de la filiale'}
                    </label>
                    <Input
                      value={roleForm.scope_value}
                      placeholder={
                        roleForm.scope_kind === 'region'
                          ? 'Ex. FR'
                          : 'Saisir une valeur de périmètre'
                      }
                      onChange={(event) =>
                        setRoleForm((current) => ({
                          ...current,
                          scope_value: event.target.value,
                        }))
                      }
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <span>
                    <span className="block text-sm font-medium">
                      Compte externe
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Marchand, fournisseur, prestataire ou autre tiers.
                    </span>
                  </span>
                  <Switch
                    checked={roleForm.is_external}
                    onCheckedChange={(value) =>
                      setRoleForm((current) => ({
                        ...current,
                        is_external: value,
                      }))
                    }
                  />
                </label>

                <label className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <span>
                    <span className="block text-sm font-medium">
                      Lecture seule
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Le rôle ne doit pas modifier les données.
                    </span>
                  </span>
                  <Switch
                    checked={roleForm.read_only}
                    onCheckedChange={(value) =>
                      setRoleForm((current) => ({
                        ...current,
                        read_only: value,
                      }))
                    }
                  />
                </label>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">
                    Chemin d’accueil (facultatif)
                  </label>
                  <Input
                    value={roleForm.landing_path}
                    placeholder="/pole/supplier/catalogue"
                    onChange={(event) =>
                      setRoleForm((current) => ({
                        ...current,
                        landing_path: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setRoleForm({ ...INITIAL_ROLE_FORM })}
                  disabled={creatingRole}
                >
                  <X className="mr-2 h-4 w-4" />
                  Réinitialiser
                </Button>

                <Button
                  onClick={() => void createRole()}
                  disabled={creatingRole || loading}
                >
                  {creatingRole ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Créer le rôle
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Catalogue des actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {actions.map((action) => (
                  <div key={action.id} className="rounded-lg border p-4">
                    <p className="font-medium">
                      {ACTION_LABELS[action.action_key] ?? action.label}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {action.action_key}
                    </p>
                    {action.description && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    )}
                  </div>
                ))}

                {actions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aucune action chargée. Synchronisez le catalogue.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RolesPermissions;
