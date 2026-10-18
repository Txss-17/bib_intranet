
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { toast } from '@/hooks/use-toast';
import { poles as availablePoles } from '@/data/poles';
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
  const { profile } = useAuth();
  const { isSuperAdmin } = usePermissions();

  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [interfaces, setInterfaces] = useState<AccessInterface[]>([]);
  const [actions, setActions] = useState<AccessAction[]>([]);
  const [permissions, setPermissions] = useState<AccessPermission[]>([]);
  const [scopes, setScopes] = useState<ScopeRow[]>([]);
  const [roleScopes, setRoleScopes] = useState<RoleScopeRow[]>([]);

  const [selectedRoleId, setSelectedRoleId] = useState('');
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

  const loadCatalog = useCallback(async () => {
    setLoading(true);

    try {
      const [
        rolesResult,
        interfacesResult,
        actionsResult,
        permissionsResult,
        roleScopesResult,
        scopesResult,
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

        // La table dépasse la limite de 1000 lignes par requête : on pagine.
        (async () => {
          const all: AccessPermission[] = [];
          const PAGE_SIZE = 1000;
          for (let from = 0; ; from += PAGE_SIZE) {
            const { data, error } = await supabase
              .from('access_permissions')
              .select('id, role_id, interface_id, action_id, allowed')
              .range(from, from + PAGE_SIZE - 1);
            if (error) return { data: null, error };
            all.push(...((data ?? []) as AccessPermission[]));
            if (!data || data.length < PAGE_SIZE) break;
          }
          return { data: all, error: null };
        })(),

        supabase
          .from('access_role_scopes')
          .select('role_id, scope_id, scope_value'),

        supabase
          .from('access_scopes')
          .select('id, scope_key, label, scope_type')
          .order('label'),
      ]);

      const error =
        rolesResult.error ||
        interfacesResult.error ||
        actionsResult.error ||
        permissionsResult.error ||
        roleScopesResult.error ||
        scopesResult.error;

      if (error) throw error;

      const nextRoles = (rolesResult.data ?? []) as AccessRole[];
      const nextInterfaces = (interfacesResult.data ?? []) as AccessInterface[];
      const nextActions = (actionsResult.data ?? []) as AccessAction[];
      const nextPermissions = (permissionsResult.data ?? []) as AccessPermission[];

      setRoles(nextRoles);
      setInterfaces(nextInterfaces);
      setActions(
        [...nextActions].sort((a, b) => {
          const ai = ACTION_ORDER.indexOf(a.action_key);
          const bi = ACTION_ORDER.indexOf(b.action_key);
          return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
        }),
      );
      setPermissions(nextPermissions);
      setRoleScopes((roleScopesResult.data ?? []) as RoleScopeRow[]);
      setScopes((scopesResult.data ?? []) as ScopeRow[]);

      setSelectedRoleId((current) =>
        current && nextRoles.some((role) => role.id === current)
          ? current
          : nextRoles[0]?.id ?? '',
      );

      const nextDraft: Record<string, boolean> = {};

      nextPermissions.forEach((permission) => {
        nextDraft[
          permissionKey(
            permission.role_id,
            permission.interface_id,
            permission.action_id,
          )
        ] = permission.allowed;
      });

      setDraft(nextDraft);
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
    [draft, permissions, selectedRoleId],
  );

  const togglePermission = (
    interfaceId: string,
    actionId: string,
    allowed: boolean,
  ) => {
    const key = permissionKey(selectedRoleId, interfaceId, actionId);

    setDraft((current) => ({ ...current, [key]: allowed }));
  };

  const toggleInterfaceActions = (
    interfaceId: string,
    allowed: boolean,
  ) => {
    if (!selectedRoleId) return;

    setDraft((current) => {
      const next = { ...current };

      actions.forEach((action) => {
        next[permissionKey(selectedRoleId, interfaceId, action.id)] = allowed;
      });

      return next;
    });
  };

  const toggleAllVisible = (allowed: boolean) => {
    if (!selectedRoleId) return;

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

      // Toutes les interfaces et toutes les actions sont sauvegardées,
      // y compris celles qui ne sont pas visibles à cause des filtres.
      const rows = interfaces.flatMap((interfaceItem) =>
        actions.map((action) => {
          const pairKey = `${interfaceItem.id}:${action.id}`;
          const draftKey = permissionKey(
            selectedRoleId,
            interfaceItem.id,
            action.id,
          );

          return {
            role_id: selectedRoleId,
            interface_id: interfaceItem.id,
            action_id: action.id,
            allowed:
              draft[draftKey] ??
              existingByKey.get(pairKey) ??
              false,
          };
        }),
      );

      if (rows.length > 0) {
        const { error } = await supabase
          .from('access_permissions')
          .upsert(rows, {
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
          previous_value: existing,
          new_value: rows,
          reason: 'Modification depuis Rôles & Permissions',
        });

      if (historyResult.error) {
        console.warn(
          'RBAC history write failed:',
          historyResult.error.message,
        );
      }

      toast({
        title: 'Permissions enregistrées',
        description: `${rows.length} combinaisons interface/action traitées pour « ${selectedRole?.label ?? selectedRoleId} ».`,
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
    if (!selectedRoleId) return 0;

    return interfaces.reduce(
      (total, interfaceItem) =>
        total +
        actions.filter((action) =>
          isAllowed(interfaceItem.id, action.id),
        ).length,
      0,
    );
  }, [interfaces, actions, isAllowed, selectedRoleId]);

  if (!isSuperAdmin) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Card>
          <CardContent className="flex items-start gap-3 p-6">
            <ShieldCheck className="mt-1 h-6 w-6 text-muted-foreground" />
            <div>
              <h1 className="text-lg font-semibold">Rôles & Permissions</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Cette page est réservée aux administrateurs globaux. Le rôle
                métier CEO ne remplace pas automatiquement le rôle technique
                admin.
              </p>
            </div>
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

      <Tabs defaultValue="permissions">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="permissions">Matrice des permissions</TabsTrigger>
          <TabsTrigger value="roles">Catalogue des rôles</TabsTrigger>
          <TabsTrigger value="create">Créer un rôle</TabsTrigger>
          <TabsTrigger value="actions">Catalogue des actions</TabsTrigger>
        </TabsList>

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
                    disabled={!selectedRoleId || saving || visibleInterfaces.length === 0}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Autoriser les interfaces affichées
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => toggleAllVisible(false)}
                    disabled={!selectedRoleId || saving || visibleInterfaces.length === 0}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Retirer les droits affichés
                  </Button>
                </div>

                <Button
                  onClick={() => void savePermissions()}
                  disabled={!selectedRoleId || saving || loading}
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
                                  disabled={!selectedRoleId || saving}
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
                                disabled={!selectedRoleId || saving}
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
                          <td className="p-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRoleId(role.id)}
                            >
                              Configurer les droits
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {roles.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
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
