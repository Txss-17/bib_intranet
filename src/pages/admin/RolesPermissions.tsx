import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Check,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from '@/hooks/use-toast';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { poles as availablePoles } from '@/data/poles';
import { syncAccessCatalog } from '@/lib/accessCatalogSync';

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

type PermissionCell = {
  roleId: string;
  interfaceId: string;
  actionId: string;
  allowed: boolean;
};

const PAGE_SIZE = 1000;

const RolesPermissions = () => {
  const { profile } = useAuth();
  const { isSuperAdmin } = usePermissions();

  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [interfaces, setInterfaces] = useState<AccessInterface[]>([]);
  const [actions, setActions] = useState<AccessAction[]>([]);
  const [permissions, setPermissions] = useState<AccessPermission[]>([]);

  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [poleFilter, setPoleFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingCatalog, setSyncingCatalog] = useState(false);

  const [draft, setDraft] = useState<
    Record<string, boolean>
  >({});

  const loadCatalog = useCallback(async () => {
    setLoading(true);

    try {
      const [
        rolesResult,
        interfacesResult,
        actionsResult,
        permissionsResult,
      ] = await Promise.all([
        supabase
          .from('access_roles')
          .select(`
            id,
            role_key,
            label,
            department,
            business_pole,
            description,
            owner_type,
            status,
            seniority,
            is_external,
            read_only,
            poles,
            landing_path
          `)
          .order('label'),

        supabase
          .from('access_interfaces')
          .select(`
            id,
            interface_key,
            label,
            module,
            pole,
            path,
            status
          `)
          .order('module')
          .order('label'),

        supabase
          .from('access_actions')
          .select(`
            id,
            action_key,
            label,
            description
          `)
          .order('label'),

        supabase
          .from('access_permissions')
          .select(`
            id,
            role_id,
            interface_id,
            action_id,
            allowed
          `),
      ]);

      const error =
        rolesResult.error ||
        interfacesResult.error ||
        actionsResult.error ||
        permissionsResult.error;

      if (error) {
        throw error;
      }

      const nextRoles = (rolesResult.data ?? []) as AccessRole[];
      const nextInterfaces =
        (interfacesResult.data ?? []) as AccessInterface[];
      const nextActions =
        (actionsResult.data ?? []) as AccessAction[];
      const nextPermissions =
        (permissionsResult.data ?? []) as AccessPermission[];

      setRoles(nextRoles);
      setInterfaces(nextInterfaces);
      setActions(nextActions);
      setPermissions(nextPermissions);

      if (
        !selectedRoleId ||
        !nextRoles.some((role) => role.id === selectedRoleId)
      ) {
        setSelectedRoleId(nextRoles[0]?.id ?? '');
      }

      const nextDraft: Record<string, boolean> = {};

      nextPermissions.forEach((permission) => {
        nextDraft[
          `${permission.role_id}:${permission.interface_id}:${permission.action_id}`
        ] = permission.allowed;
      });

      setDraft(nextDraft);
    } catch (error) {
      console.error('RBAC catalog loading error', error);

      toast({
        title: 'Chargement impossible',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de charger le catalogue des permissions.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedRoleId]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const selectedRole = useMemo(
    () =>
      roles.find((role) => role.id === selectedRoleId) ??
      null,
    [roles, selectedRoleId],
  );

  const modules = useMemo(() => {
    return Array.from(
      new Set(
        interfaces
          .map((item) => item.module)
          .filter(Boolean) as string[],
      ),
    ).sort();
  }, [interfaces]);

  const poleOptions = useMemo(() => {
    const catalogPoles = new Set(
      interfaces
        .map((item) => item.pole)
        .filter((pole): pole is string => Boolean(pole)),
    );
    const knownPoles = availablePoles.map(
      (pole) => ({
        id: pole.id,
        label: pole.name,
      }),
    );
    const knownPoleIds = new Set<string>(
      knownPoles.map((pole) => pole.id),
    );
    const otherPoles = Array.from(catalogPoles)
      .filter((pole) => !knownPoleIds.has(pole))
      .sort()
      .map((pole) => ({
        id: pole,
        label: pole === 'transversal' ? 'Transversal' : pole,
      }));

    return [...knownPoles, ...otherPoles];
  }, [interfaces]);

  const visibleInterfaces = useMemo(() => {
    const query = search.trim().toLowerCase();

    return interfaces.filter((item) => {
      if (item.status !== 'active') {
        return false;
      }

      if (
        moduleFilter !== 'all' &&
        item.module !== moduleFilter
      ) {
        return false;
      }

      if (
        poleFilter !== 'all' &&
        item.pole !== poleFilter
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        item.label,
        item.interface_key,
        item.module,
        item.pole,
        item.path,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query),
        );
    });
  }, [interfaces, moduleFilter, poleFilter, search]);

  const rolePermissions = useMemo(() => {
    const result = new Map<string, boolean>();

    permissions
      .filter(
        (permission) =>
          permission.role_id === selectedRoleId,
      )
      .forEach((permission) => {
        result.set(
          `${permission.interface_id}:${permission.action_id}`,
          permission.allowed,
        );
      });

    return result;
  }, [permissions, selectedRoleId]);

  const isAllowed = (
    interfaceId: string,
    actionId: string,
  ) => {
    const key = `${selectedRoleId}:${interfaceId}:${actionId}`;

    if (key in draft) {
      return draft[key];
    }

    return (
      rolePermissions.get(
        `${interfaceId}:${actionId}`,
      ) ?? false
    );
  };

  const togglePermission = (
    interfaceId: string,
    actionId: string,
    value: boolean,
  ) => {
    const key = `${selectedRoleId}:${interfaceId}:${actionId}`;

    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const savePermissions = async () => {
    if (!selectedRoleId) {
      return;
    }

    setSaving(true);

    try {
      const existing = permissions.filter(
        (permission) =>
          permission.role_id === selectedRoleId,
      );

      const existingByKey = new Map(
        existing.map((permission) => [
          `${permission.interface_id}:${permission.action_id}`,
          permission,
        ]),
      );

      const rows = [];

      for (const interfaceItem of interfaces) {
        for (const action of actions) {
          const key =
            `${interfaceItem.id}:${action.id}`;

          const value =
            draft[
              `${selectedRoleId}:${key}`
            ] ??
            existingByKey.get(key)?.allowed ??
            false;

          rows.push({
            role_id: selectedRoleId,
            interface_id: interfaceItem.id,
            action_id: action.id,
            allowed: value,
          });
        }
      }

      const { error } = await supabase
        .from('access_permissions')
        .upsert(rows, {
          onConflict:
            'role_id,interface_id,action_id',
        });

      if (error) {
        throw error;
      }

      await supabase
        .from('access_change_history')
        .insert({
          actor_id: profile?.id ?? null,
          role_id: selectedRoleId,
          change_type: 'permission_matrix_update',
          previous_value: existing,
          new_value: rows,
          reason:
            'Modification depuis Admin > Rôles & Permissions',
        });

      toast({
        title: 'Permissions enregistrées',
        description:
          `La matrice du rôle « ${selectedRole?.label ?? selectedRoleId} » a été enregistrée.`,
      });

      await loadCatalog();
    } catch (error) {
      console.error('RBAC permission save error', error);

      toast({
        title: 'Enregistrement impossible',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible d’enregistrer la matrice.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const synchronizeCatalog = async () => {
    setSyncingCatalog(true);

    try {
      await syncAccessCatalog();
      await loadCatalog();

      toast({
        title: 'Catalogue synchronisé',
        description:
          'Les pôles, interfaces, rôles et actions sont à jour.',
      });
    } catch (error) {
      console.error('RBAC catalog synchronization error', error);

      toast({
        title: 'Synchronisation impossible',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de synchroniser le catalogue des permissions.',
        variant: 'destructive',
      });
    } finally {
      setSyncingCatalog(false);
    }
  };

  const resetDraft = () => {
    const nextDraft: Record<string, boolean> = {};

    permissions
      .filter(
        (permission) =>
          permission.role_id === selectedRoleId,
      )
      .forEach((permission) => {
        nextDraft[
          `${permission.role_id}:${permission.interface_id}:${permission.action_id}`
        ] = permission.allowed;
      });

    setDraft(nextDraft);
  };

  const enabledCount = useMemo(() => {
    let count = 0;

    visibleInterfaces.forEach((interfaceItem) => {
      actions.forEach((action) => {
        if (
          isAllowed(
            interfaceItem.id,
            action.id,
          )
        ) {
          count += 1;
        }
      });
    });

    return count;
  }, [
    visibleInterfaces,
    actions,
    draft,
    selectedRoleId,
    rolePermissions,
  ]);

  if (!isSuperAdmin) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground" />

            <div>
              <h1 className="text-xl font-semibold">
                Accès restreint
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                La configuration des permissions est réservée
                aux administrateurs autorisés.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <ShieldCheck className="h-6 w-6" />
            Rôles & Permissions
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Gestion du RBAC réel BIB : rôle → interface → action.
            Les permissions sont enregistrées dans Supabase et
            utilisées par le contrôle d’accès.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void synchronizeCatalog()}
            disabled={loading || saving || syncingCatalog}
          >
            {syncingCatalog ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Activity className="mr-2 h-4 w-4" />
            )}
            Synchroniser le catalogue
          </Button>

          <Button
            variant="outline"
            onClick={() => void loadCatalog()}
            disabled={loading || saving}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>

          <Button
            onClick={() => void savePermissions()}
            disabled={
              loading ||
              saving ||
              !selectedRoleId
            }
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">
              Rôle
            </p>

            <Select
              value={selectedRoleId}
              onValueChange={setSelectedRoleId}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>

              <SelectContent>
                {roles
                  .filter(
                    (role) =>
                      role.status === 'active',
                  )
                  .map((role) => (
                    <SelectItem
                      key={role.id}
                      value={role.id}
                    >
                      {role.label} · {role.role_key}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Recherche
            </p>

            <div className="relative mt-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                className="pl-9"
                placeholder="Interface, module, chemin..."
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Module
            </p>

            <Select
              value={moduleFilter}
              onValueChange={setModuleFilter}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Tous les modules
                </SelectItem>

                {modules.map((module) => (
                  <SelectItem
                    key={module}
                    value={module}
                  >
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Pôle
            </p>

            <Select
              value={poleFilter}
              onValueChange={setPoleFilter}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Tous les pôles
                </SelectItem>

                {poleOptions.map((pole) => (
                  <SelectItem
                    key={pole.id}
                    value={pole.id}
                  >
                    {pole.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedRole && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {selectedRole.label}
                </CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedRole.description ||
                    'Aucune description.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {selectedRole.role_key}
                </Badge>

                {selectedRole.business_pole && (
                  <Badge variant="outline">
                    {selectedRole.business_pole}
                  </Badge>
                )}

                {selectedRole.read_only && (
                  <Badge variant="outline">
                    Lecture seule
                  </Badge>
                )}

                {selectedRole.is_external && (
                  <Badge variant="outline">
                    Externe
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">
                  Interfaces affichées
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {visibleInterfaces.length}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">
                  Actions disponibles
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {actions.length}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">
                  Permissions actives
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {enabledCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="matrix">
        <TabsList>
          <TabsTrigger value="matrix">
            <KeyRound className="mr-2 h-4 w-4" />
            Matrice
          </TabsTrigger>

          <TabsTrigger value="roles">
            <Users className="mr-2 h-4 w-4" />
            Rôles
          </TabsTrigger>

          <TabsTrigger value="actions">
            <Activity className="mr-2 h-4 w-4" />
            Actions
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="matrix"
          className="mt-4"
        >
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>
                    Matrice des permissions
                  </CardTitle>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Chaque cellule correspond à une combinaison
                    rôle / interface / action.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetDraft}
                  disabled={saving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Annuler les changements
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : visibleInterfaces.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    {interfaces.length === 0
                      ? 'Le catalogue des interfaces est vide.'
                      : 'Aucune interface ne correspond aux filtres.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[280px]">
                          Interface
                        </TableHead>

                        {actions.map((action) => (
                          <TableHead
                            key={action.id}
                            className="min-w-[120px] text-center"
                          >
                            {action.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {visibleInterfaces.map(
                        (interfaceItem) => (
                          <TableRow
                            key={interfaceItem.id}
                          >
                            <TableCell>
                              <div className="font-medium">
                                {interfaceItem.label}
                              </div>

                              <div className="mt-0.5 text-xs text-muted-foreground">
                                {interfaceItem.interface_key}
                              </div>

                              {interfaceItem.path && (
                                <div className="mt-0.5 text-xs text-muted-foreground">
                                  {interfaceItem.path}
                                </div>
                              )}

                              <div className="mt-1 flex gap-1">
                                {interfaceItem.module && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                  >
                                    {interfaceItem.module}
                                  </Badge>
                                )}

                                {interfaceItem.pole && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                  >
                                    {interfaceItem.pole}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>

                            {actions.map((action) => {
                              const allowed =
                                isAllowed(
                                  interfaceItem.id,
                                  action.id,
                                );

                              return (
                                <TableCell
                                  key={action.id}
                                  className="text-center"
                                >
                                  <div className="flex justify-center">
                                    <Switch
                                      checked={allowed}
                                      onCheckedChange={(
                                        value,
                                      ) =>
                                        togglePermission(
                                          interfaceItem.id,
                                          action.id,
                                          value,
                                        )
                                      }
                                      disabled={saving}
                                      aria-label={`${interfaceItem.label} — ${action.label}`}
                                    />
                                  </div>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="roles"
          className="mt-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>Catalogue des rôles</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Pôle</TableHead>
                      <TableHead>Département</TableHead>
                      <TableHead>Séniorité</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div className="font-medium">
                            {role.label}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {role.role_key}
                          </div>
                        </TableCell>

                        <TableCell>
                          {role.business_pole || '—'}
                        </TableCell>

                        <TableCell>
                          {role.department || '—'}
                        </TableCell>

                        <TableCell>
                          {role.seniority || '—'}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              role.status === 'active'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {role.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="actions"
          className="mt-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>Catalogue des actions</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {actions.map((action) => (
                  <div
                    key={action.id}
                    className="rounded-lg border p-4"
                  >
                    <div className="font-medium">
                      {action.label}
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      {action.action_key}
                    </div>

                    {action.description && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RolesPermissions;
