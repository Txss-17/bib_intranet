import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ShieldCheck,
  Save,
  RotateCcw,
  Eye,
  History,
  Lock,
  Search,
  Users,
  UserCog,
  KeyRound,
  SlidersHorizontal,
  UserRoundCheck,
  Activity,
  Building2,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useViewAs } from '@/hooks/useViewAs';
import { useEmployees } from '@/hooks/useEmployees';
import { jobRoles, jobDepartments } from '@/data/jobRoles';
import { logSensitiveAccess } from '@/lib/sensitiveAudit';
import { ProtectedPage } from '@/components/PermissionGate';
import { SensitiveRulesMatrix } from '@/components/admin/SensitiveRulesMatrix';

import {
  ActionSet,
  MatrixOverrides,
  PERMISSION_ACTIONS,
  PermissionAction,
  RESTRICTED_PAGES,
  appendMatrixHistory,
  getDataScope,
  loadMatrixHistory,
  pageRegistry,
  resolvePagePermissions,
  isTestRbacEnforced,
  loadTestMatrixOverrides,
  saveTestMatrixOverrides,
  setTestRbacEnforced,
} from '@/data/permissionMatrix';

type AccessTab =
  | 'accounts'
  | 'roles'
  | 'permissions'
  | 'scopes'
  | 'assignments'
  | 'history';

const AccessSectionCard = ({
  icon: Icon,
  title,
  description,
  count,
  children,
}: {
  icon: typeof Users;
  title: string;
  description: string;
  count?: string;
  children: React.ReactNode;
}) => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-border bg-muted/40 p-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>

          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {count ? (
          <Badge variant="secondary">{count}</Badge>
        ) : null}
      </div>
    </CardHeader>

    <CardContent>{children}</CardContent>
  </Card>
);

type AccessScopeRow = {
  id: string;
  scope_key: string;
  label: string;
  scope_type: string | null;
  description: string | null;
  created_at: string;
};

type AccessRoleRow = {
  id: string;
  role_key: string;
  label: string;
  business_pole: string | null;
  status: string;
};

type AccessRoleScopeRow = {
  id: string;
  role_id: string;
  scope_id: string;
  scope_value: string | null;
  created_at: string;
};

const RolesPermissionsInner = () => {
  const { profile } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const { roleId: simulatedId, setRole } = useViewAs();

  const { data: employees = [], isLoading: employeesLoading } =
    useEmployees();

  const [activeTab, setActiveTab] = useState<AccessTab>('accounts');
  const [roleId, setRoleId] = useState<string>('comptable');
  const [search, setSearch] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState<string>('all');

  const [draft, setDraft] =
    useState<MatrixOverrides>(loadTestMatrixOverrides());

  const [enforced, setEnforced] =
    useState(isTestRbacEnforced());

  const [history, setHistory] =
    useState(loadMatrixHistory());

  const role = jobRoles.find((r) => r.id === roleId);

  const scopes = useMemo(
    () =>
      Array.from(
        new Set(pageRegistry.map((page) => page.scope)),
      ).sort(),
    [],
  );

  const pages = useMemo(
    () =>
      pageRegistry.filter((page) => {
        if (
          scopeFilter !== 'all' &&
          page.scope !== scopeFilter
        ) {
          return false;
        }

        if (!search.trim()) {
          return true;
        }

        const q = search.toLowerCase();

        return (
          page.label.toLowerCase().includes(q) ||
          page.id.toLowerCase().includes(q)
        );
      }),
    [scopeFilter, search],
  );

  const filteredEmployees = useMemo(() => {
    if (!accountSearch.trim()) {
      return employees;
    }

    const q = accountSearch.toLowerCase();

    return employees.filter((employee) =>
      [
        `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim(),
        employee.email,
        employee.poles?.join(", "),
        employee.position,
        employee.hr_status,
      ]
        .filter(Boolean)
        .some((value) =>
          value.toLowerCase().includes(q),
        ),
    );
  }, [employees, accountSearch]);

  const activeEmployees = useMemo(
    () =>
      employees.filter(
        (employee) =>
          employee.hr_status?.toLowerCase() === 'active' ||
          employee.hr_status?.toLowerCase() === 'actif',
      ),
    [employees],
  );

  const inactiveEmployees = useMemo(
    () =>
      employees.filter(
        (employee) =>
          employee.hr_status?.toLowerCase() !== 'active' &&
          employee.hr_status?.toLowerCase() !== 'actif',
      ),
    [employees],
  );

  const effective = (pageId: string): ActionSet =>
    resolvePagePermissions(pageId, {
      role,
      poles: role?.poles ?? [],
      seniority: role?.seniority ?? 'junior',
      overrides: draft,
    });

  const toggle = (
    pageId: string,
    action: PermissionAction,
    value: boolean,
  ) => {
    setDraft((previous) => ({
      ...previous,
      [roleId]: {
        ...(previous[roleId] || {}),
        [pageId]: {
          ...(previous[roleId]?.[pageId] || {}),
          [action]: value,
        },
      },
    }));
  };

  const handleSave = async () => {
    const before = loadTestMatrixOverrides();

    const entries =
      [] as Parameters<typeof appendMatrixHistory>[0];

    Object.entries(draft[roleId] || {}).forEach(
      ([pageId, actions]) => {
        Object.entries(actions).forEach(
          ([action, value]) => {
            if (
              before[roleId]?.[pageId]?.[
                action as PermissionAction
              ] !== value
            ) {
              entries.push({
                at: new Date().toISOString(),
                actor: profile?.email || 'inconnu',
                roleId,
                pageId,
                action: action as PermissionAction,
                value: !!value,
              });
            }
          },
        );
      },
    );

    saveTestMatrixOverrides(draft);

    if (entries.length) {
      appendMatrixHistory(entries);
    }

    setHistory(loadMatrixHistory());

    await logSensitiveAccess({
      section: 'admin.roles_permissions',
      action: 'update_permission_matrix',
      allowed: true,
      details: {
        role: roleId,
        changes: entries.length,
      },
    });

    toast({
      title: 'Permissions enregistrées',
      description: `${entries.length} modification(s) appliquée(s) au rôle ${role?.label}.`,
    });
  };

  const handleReset = () => {
    const next = { ...draft };

    delete next[roleId];

    setDraft(next);
    saveTestMatrixOverrides(next);

    toast({
      title: 'Rôle réinitialisé',
      description: `${role?.label} revient aux droits par défaut.`,
    });
  };

  const [accessScopes, setAccessScopes] = useState<AccessScopeRow[]>([]);
  const [accessRoles, setAccessRoles] = useState<AccessRoleRow[]>([]);
  const [roleScopeRows, setRoleScopeRows] = useState<AccessRoleScopeRow[]>([]);
  const [scopesLoading, setScopesLoading] = useState(true);
  const [scopeSaving, setScopeSaving] = useState(false);

  const [editingScopeId, setEditingScopeId] = useState<string | null>(null);
  const [scopeKeyInput, setScopeKeyInput] = useState('');
  const [scopeLabelInput, setScopeLabelInput] = useState('');
  const [scopeTypeInput, setScopeTypeInput] = useState('pole');
  const [scopeDescriptionInput, setScopeDescriptionInput] = useState('');

  const [selectedScopeId, setSelectedScopeId] = useState('');
  const [selectedScopeRoleId, setSelectedScopeRoleId] = useState('');
  const [scopeValueInput, setScopeValueInput] = useState('');
  const loadAccessCatalog = useCallback(async () => {
    setScopesLoading(true);

    try {
      const [scopeResult, roleResult, relationResult] = await Promise.all([
        supabase
          .from('access_scopes')
          .select('*')
          .order('label'),

        supabase
          .from('access_roles')
          .select('*')
          .order('label'),

        supabase
          .from('access_role_scopes')
          .select('*')
          .order('created_at'),
      ]);

      const firstError =
        scopeResult.error ||
        roleResult.error ||
        relationResult.error;

      if (firstError) {
        throw firstError;
      }

      setAccessScopes((scopeResult.data ?? []) as AccessScopeRow[]);
      setAccessRoles((roleResult.data ?? []) as AccessRoleRow[]);
      setRoleScopeRows((relationResult.data ?? []) as AccessRoleScopeRow[]);
    } catch (error) {
      console.error('Erreur de chargement du catalogue RBAC', error);

      toast({
        title: 'Chargement impossible',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de charger les périmètres depuis Supabase.',
        variant: 'destructive',
      });
    } finally {
      setScopesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccessCatalog();
  }, [loadAccessCatalog]);

  const resetScopeForm = () => {
  setEditingScopeId(null);
  setScopeKeyInput('');
  setScopeLabelInput('');
  setScopeTypeInput('pole');
  setScopeDescriptionInput('');
};
const editScope = (scope: AccessScopeRow) => {
  setEditingScopeId(scope.id);
  setScopeKeyInput(scope.scope_key);
  setScopeLabelInput(scope.label);
  setScopeTypeInput(scope.scope_type || 'pole');
  setScopeDescriptionInput(scope.description || '');
  setActiveTab('scopes');
};

const saveAccessScope = async () => {
  const scopeKey = scopeKeyInput
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const label = scopeLabelInput.trim();

  if (!scopeKey || !label) {
    toast({
      title: 'Champs obligatoires',
      description: 'Renseigne la clé et le libellé du périmètre.',
      variant: 'destructive',
    });
    return;
  }

  setScopeSaving(true);

  try {
    const payload = {
      scope_key: scopeKey,
      label,
      scope_type: scopeTypeInput || null,
      description: scopeDescriptionInput.trim() || null,
    };

    const result = editingScopeId
      ? await supabase
          .from('access_scopes')
          .update(payload)
          .eq('id', editingScopeId)
      : await supabase
          .from('access_scopes')
          .insert(payload);

    if (result.error) {
      throw result.error;
    }

    toast({
      title: editingScopeId
        ? 'Périmètre modifié'
        : 'Périmètre créé',
      description: `${label} a été enregistré dans Supabase.`,
    });

    resetScopeForm();
    await loadAccessCatalog();
  } catch (error) {
    console.error('Erreur de sauvegarde du périmètre', error);

    toast({
      title: 'Enregistrement impossible',
      description:
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue lors de la sauvegarde.',
      variant: 'destructive',
    });
  } finally {
    setScopeSaving(false);
  }
};

  const removeScopeAssignment = async (assignmentId: string) => {
    setScopeSaving(true);

    try {
      const { error } = await supabase
        .from('access_role_scopes')
        .delete()
        .eq('id', assignmentId);

      if (error) {
        throw error;
      }

      toast({
        title: 'Association supprimée',
        description: 'Le lien entre le rôle et le périmètre a été supprimé.',
      });

      await loadAccessCatalog();
    } catch (error) {
      console.error('Erreur de suppression de l’association', error);

      toast({
        title: 'Suppression impossible',
        description:
          error instanceof Error
            ? error.message
            : 'Une erreur est survenue lors de la suppression.',
        variant: 'destructive',
      });
    } finally {
      setScopeSaving(false);
    }
  };

  const assignScopeToRole = async () => {
    if (!selectedScopeId || !selectedScopeRoleId) {
      toast({
        title: 'Sélection incomplète',
        description: 'Choisis un périmètre et un rôle.',
        variant: 'destructive',
      });
      return;
    }

    const scopeValue = scopeValueInput.trim() || null;
    setScopeSaving(true);

    try {
      const { error } = await supabase
        .from('access_role_scopes')
        .insert({
          role_id: selectedScopeRoleId,
          scope_id: selectedScopeId,
          scope_value: scopeValue,
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Association enregistrée',
        description: 'Le périmètre a bien été associé au rôle.',
      });

      setSelectedScopeId('');
      setSelectedScopeRoleId('');
      setScopeValueInput('');
      await loadAccessCatalog();
    } catch (error) {
      console.error('Erreur d’association du périmètre', error);

      toast({
        title: 'Association impossible',
        description:
          error instanceof Error
            ? error.message
            : 'Une erreur est survenue lors de l’association.',
        variant: 'destructive',
      });
    } finally {
      setScopeSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <ShieldCheck className="h-5 w-5" />
            Accès & permissions
          </h1>

          <p className="mt-0.5 max-w-3xl text-sm text-muted-foreground">
            Administration des comptes, rôles métier, permissions,
            périmètres et affectations. Les droits effectifs doivent
            être déterminés par la combinaison compte → rôle →
            permissions → interfaces → actions → périmètres.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
            <Lock className="h-4 w-4 text-muted-foreground" />

            <span className="text-xs text-muted-foreground">
              Moindre privilège
            </span>

            <Switch
              checked={enforced}
              onCheckedChange={(value) => {
                setEnforced(value);
                setTestRbacEnforced(value);

                toast({
                  title: value
                    ? 'RBAC appliqué'
                    : 'Mode construction',
                  description: value
                    ? 'Les restrictions de permissions sont activées.'
                    : 'Le mode construction ouvre temporairement les accès.',
                });
              }}
            />
          </div>
        </div>
      </div>

      {/* ARCHITECTURE */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-7">
            {[
              ['Compte', Users],
              ['Rôle', UserCog],
              ['Permissions', KeyRound],
              ['Interfaces', Building2],
              ['Actions', Activity],
              ['Périmètres', SlidersHorizontal],
              ['KPI', Eye],
            ].map(([label, Icon], index) => {
              const IconComponent =
                Icon as typeof Users;

              return (
                <div
                  key={label as string}
                  className="relative flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-3"
                >
                  <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground" />

                  <span className="text-xs font-medium">
                    {label as string}
                  </span>

                  {index < 6 ? (
                    <ArrowRight className="absolute -right-3 z-10 hidden h-4 w-4 bg-background text-muted-foreground md:block" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* MAIN TABS */}
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as AccessTab)
        }
      >
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="accounts">
            <Users className="mr-2 h-4 w-4" />
            Comptes
          </TabsTrigger>

          <TabsTrigger value="roles">
            <UserCog className="mr-2 h-4 w-4" />
            Rôles
          </TabsTrigger>

          <TabsTrigger value="permissions">
            <KeyRound className="mr-2 h-4 w-4" />
            Permissions
          </TabsTrigger>

          <TabsTrigger value="scopes">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Périmètres
          </TabsTrigger>

          <TabsTrigger value="assignments">
            <UserRoundCheck className="mr-2 h-4 w-4" />
            Affectations
          </TabsTrigger>

          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            Journal
          </TabsTrigger>

          <TabsTrigger value="sensitive">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Données sensibles
          </TabsTrigger>
        </TabsList>

        {/* ============================================================
            COMPTES
        ============================================================ */}
        <TabsContent value="scopes" className="mt-4 space-y-4">
          <AccessSectionCard
            icon={SlidersHorizontal}
            title="Catalogue des périmètres"
            description="Crée et modifie les périmètres enregistrés dans Supabase. Leur association à un rôle configure le catalogue RBAC, mais ne remplace pas les règles RLS appliquées aux données."
            count={`${accessScopes.length} périmètre(s)`}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4 rounded-lg border border-border p-4">
                <div>
                  <h3 className="text-sm font-semibold">
                    {editingScopeId ? 'Modifier un périmètre' : 'Créer un périmètre'}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    La clé sert d’identifiant technique stable.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Clé du périmètre</label>
                  <Input
                    value={scopeKeyInput}
                    onChange={(event) => setScopeKeyInput(event.target.value)}
                    placeholder="ex. pole_rh"
                    disabled={!!editingScopeId}
                  />
                  {editingScopeId ? (
                    <p className="text-xs text-muted-foreground">
                      La clé technique ne peut pas être modifiée ici.
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Libellé</label>
                  <Input
                    value={scopeLabelInput}
                    onChange={(event) => setScopeLabelInput(event.target.value)}
                    placeholder="ex. Pôle RH"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Type de périmètre</label>
                  <Select
                    value={scopeTypeInput}
                    onValueChange={setScopeTypeInput}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="organisation">Organisation</SelectItem>
                      <SelectItem value="pole">Pôle</SelectItem>
                      <SelectItem value="portfolio">Portefeuille</SelectItem>
                      <SelectItem value="region">Région</SelectItem>
                      <SelectItem value="record">Enregistrements</SelectItem>
                      <SelectItem value="custom">Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Description</label>
                  <Input
                    value={scopeDescriptionInput}
                    onChange={(event) => setScopeDescriptionInput(event.target.value)}
                    placeholder="Finalité et limites de ce périmètre"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={saveAccessScope} disabled={scopeSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {scopeSaving
                      ? 'Enregistrement…'
                      : editingScopeId
                        ? 'Enregistrer les modifications'
                        : 'Créer le périmètre'}
                  </Button>

                  {editingScopeId ? (
                    <Button
                      variant="outline"
                      onClick={resetScopeForm}
                      disabled={scopeSaving}
                    >
                      Annuler
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4 rounded-lg border border-border p-4">
                <div>
                  <h3 className="text-sm font-semibold">Associer un périmètre à un rôle</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    La valeur est facultative. Utilise-la lorsqu’un périmètre doit être
                    limité à une valeur précise, par exemple un portefeuille identifié.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Périmètre</label>
                  <Select
                    value={selectedScopeId}
                    onValueChange={setSelectedScopeId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un périmètre" />
                    </SelectTrigger>
                    <SelectContent>
                      {accessScopes.map((scope) => (
                        <SelectItem key={scope.id} value={scope.id}>
                          {scope.label} ({scope.scope_key})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Rôle</label>
                  <Select
                    value={selectedScopeRoleId}
                    onValueChange={setSelectedScopeRoleId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un rôle" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {accessRoles
                        .filter((item) => item.status === 'active')
                        .map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.label} — {item.business_pole || 'Pôle non défini'}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    Valeur du périmètre (facultatif)
                  </label>
                  <Input
                    value={scopeValueInput}
                    onChange={(event) => setScopeValueInput(event.target.value)}
                    placeholder="ex. rh, portefeuille_123 ou FR"
                  />
                </div>

                <Button
                  onClick={assignScopeToRole}
                  disabled={
                    scopeSaving ||
                    !selectedScopeId ||
                    !selectedScopeRoleId
                  }
                >
                  Associer au rôle
                </Button>
              </div>
            </div>
          </AccessSectionCard>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Périmètres enregistrés</CardTitle>
            </CardHeader>

            <CardContent className="overflow-x-auto">
              {scopesLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Chargement du catalogue Supabase…
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clé</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Rôles associés</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {accessScopes.map((scope) => {
                      const associations = roleScopeRows.filter(
                        (item) => item.scope_id === scope.id,
                      );

                      return (
                        <TableRow key={scope.id}>
                          <TableCell className="font-mono text-xs">
                            {scope.scope_key}
                          </TableCell>

                          <TableCell className="text-sm font-medium">
                            {scope.label}
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline">
                              {scope.scope_type || 'Non défini'}
                            </Badge>
                          </TableCell>

                          <TableCell className="max-w-56 text-xs text-muted-foreground">
                            {scope.description || '—'}
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {associations.length ? (
                                associations.map((association) => {
                                  const role = accessRoles.find(
                                    (item) => item.id === association.role_id,
                                  );

                                  return (
                                    <Badge
                                      key={association.id}
                                      variant="secondary"
                                    >
                                      {role?.label || 'Rôle inconnu'}
                                      {association.scope_value
                                        ? ` : ${association.scope_value}`
                                        : ''}
                                    </Badge>
                                  );
                                })
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Aucun rôle associé
                                </span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => editScope(scope)}
                                disabled={scopeSaving}
                              >
                                Modifier
                              </Button>

                              {associations.map((association) => (
                                <Button
                                  key={association.id}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeScopeAssignment(association.id)
                                  }
                                  disabled={scopeSaving}
                                  title="Retirer cette association"
                                >
                                  Retirer le rôle
                                </Button>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {!accessScopes.length ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-8 text-center text-sm text-muted-foreground"
                        >
                          Aucun périmètre trouvé dans Supabase.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================
            ROLES
        ============================================================ */}
        <TabsContent value="roles" className="mt-4 space-y-4">
          <AccessSectionCard
            icon={UserCog}
            title="Catalogue des rôles métier"
            description="Un rôle décrit ce qu'un collaborateur peut faire. Son contenu métier appartient au responsable du pôle concerné ; Direction le définit temporairement lorsqu'aucun responsable n'est nommé."
            count={`${jobRoles.length} rôles`}
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Pôle / département</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Pôles accessibles</TableHead>
                    <TableHead>Propriétaire métier</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">
                      Test
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {jobRoles.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium text-sm">
                          {item.label}
                        </div>

                        <div className="font-mono text-[11px] text-muted-foreground">
                          {item.id}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs capitalize">
                        {item.department}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          {item.seniority}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs">
                        {item.poles.length > 6
                          ? `${item.poles.length} pôles`
                          : item.poles.join(', ')}
                      </TableCell>

                      <TableCell>
                        {item.department === 'direction' ? (
                          <Badge variant="secondary">
                            Direction
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Responsable du pôle
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          Défini
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRoleId(item.id);
                            setActiveTab('permissions');
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </AccessSectionCard>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Gouvernance des rôles
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm font-medium">
                    Responsable du pôle
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Définit le contenu métier des rôles de son
                    pôle.
                  </p>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm font-medium">
                    Direction
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Définit temporairement les rôles lorsqu'un
                    pôle ne possède pas encore de responsable.
                  </p>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm font-medium">
                    RH
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Administre les comptes et affecte les rôles
                    sans décider du contenu métier du rôle.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================
            PERMISSIONS
        ============================================================ */}
        <TabsContent value="permissions" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    Permissions du rôle
                  </CardTitle>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Interface → action. Cette matrice constitue
                    actuellement la couche de configuration
                    existante.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Réinitialiser
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleSave}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  value={roleId}
                  onValueChange={setRoleId}
                >
                  <SelectTrigger className="w-72">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent className="max-h-80">
                    {jobDepartments.map((department) => (
                      <div key={department.id}>
                        <div className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
                          {department.label}
                        </div>

                        {jobRoles
                          .filter(
                            (item) =>
                              item.department ===
                              department.id,
                          )
                          .map((item) => (
                            <SelectItem
                              key={item.id}
                              value={item.id}
                            >
                              {item.label}
                            </SelectItem>
                          ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>

                {role ? (
                  <>
                    <Badge variant="outline">
                      {role.seniority}
                    </Badge>

                    {role.poles.map((pole) => (
                      <Badge
                        key={pole}
                        variant="secondary"
                        className="capitalize"
                      >
                        {pole}
                      </Badge>
                    ))}
                  </>
                ) : null}

                <Button
                  variant={
                    simulatedId === roleId
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  className="ml-auto"
                  onClick={() => {
                    setRole(
                      simulatedId === roleId
                        ? null
                        : roleId,
                    );

                    toast({
                      title:
                        simulatedId === roleId
                          ? 'Simulation arrêtée'
                          : `Visualiser comme ${role?.label}`,
                    });
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />

                  {simulatedId === roleId
                    ? 'Arrêter la simulation'
                    : 'Tester ce rôle'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
              <CardTitle className="text-base">
                Permissions par interface
              </CardTitle>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />

                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Rechercher une interface…"
                    className="w-56 pl-8"
                  />
                </div>

                <Select
                  value={scopeFilter}
                  onValueChange={setScopeFilter}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent className="max-h-72">
                    <SelectItem value="all">
                      Tous les pôles
                    </SelectItem>

                    {scopes.map((scope) => (
                      <SelectItem
                        key={scope}
                        value={scope}
                        className="capitalize"
                      >
                        {scope}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[240px]">
                      Interface
                    </TableHead>

                    {PERMISSION_ACTIONS.map((action) => (
                      <TableHead
                        key={action.key}
                        className="text-center text-xs"
                      >
                        {action.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {pages.map((page) => {
                    const permissions = effective(
                      page.id,
                    );

                    return (
                      <TableRow key={page.id}>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {page.label}
                          </div>

                          <div className="font-mono text-xs text-muted-foreground">
                            {page.id}
                          </div>
                        </TableCell>

                        {PERMISSION_ACTIONS.map(
                          (action) => (
                            <TableCell
                              key={action.key}
                              className="text-center"
                            >
                              <Checkbox
                                checked={
                                  permissions[action.key]
                                }
                                onCheckedChange={(value) =>
                                  toggle(
                                    page.id,
                                    action.key,
                                    !!value,
                                  )
                                }
                              />
                            </TableCell>
                          ),
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {!pages.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Aucune interface trouvée.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================
            PERIMETRES
        ============================================================ */}
        <TabsContent value="scopes" className="mt-4 space-y-4">
          <AccessSectionCard
            icon={SlidersHorizontal}
            title="Périmètres d'accès"
            description="Le périmètre détermine sur quelles données un rôle peut agir. Il est distinct du rôle et des permissions."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm font-medium">
                  Organisation
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  BIB, entité ou environnement auquel le
                  collaborateur est rattaché.
                </p>
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="text-sm font-medium">
                  Pôle / portefeuille
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Données relevant d'un pôle ou du portefeuille
                  attribué au collaborateur.
                </p>
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="text-sm font-medium">
                  Enregistrements
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Données propres au collaborateur, à son
                  portefeuille ou à son périmètre autorisé.
                </p>
              </div>
            </div>
          </AccessSectionCard>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Périmètre actuellement calculé par rôle
              </CardTitle>
            </CardHeader>

            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Pôles</TableHead>
                    <TableHead>Régions</TableHead>
                    <TableHead>Enregistrements propres</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {jobRoles.map((item) => {
                    const scope = getDataScope(item);

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm font-medium">
                          {item.label}
                        </TableCell>

                        <TableCell className="text-xs">
                          {item.poles.length > 5
                            ? `${item.poles.length} pôles`
                            : item.poles.join(', ')}
                        </TableCell>

                        <TableCell className="text-xs">
                          {scope.regions?.length
                            ? scope.regions.join(', ')
                            : 'Toutes régions'}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              scope.ownRecordsOnly
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {scope.ownRecordsOnly
                              ? 'Oui'
                              : 'Non'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================
            AFFECTATIONS
        ============================================================ */}
        <TabsContent value="assignments" className="mt-4 space-y-4">
          <AccessSectionCard
            icon={UserRoundCheck}
            title="Affectations compte → rôle → périmètre"
            description="Cette vue prépare l'affectation effective des droits. La persistance backend sera ajoutée avec le futur modèle RBAC."
          >
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                <div>
                  <p className="text-sm font-medium">
                    Affectations backend non encore persistées
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Le référentiel actuel contient les
                    collaborateurs et le catalogue des rôles,
                    mais ne possède pas encore la relation
                    persistante compte → rôle → périmètre.
                    Nous ne créons donc pas ici de fausse
                    affectation locale.
                  </p>
                </div>
              </div>
            </div>
          </AccessSectionCard>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Collaborateurs sans affectation RBAC
              </CardTitle>
            </CardHeader>

            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Collaborateur</TableHead>
                    <TableHead>Pôle RH</TableHead>
                    <TableHead>Poste</TableHead>
                    <TableHead>Rôle RBAC</TableHead>
                    <TableHead>Périmètre</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="font-medium text-sm">
                          {`${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim()}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {employee.email}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs capitalize">
                        {employee.poles?.join(", ") || 'Non défini'}
                      </TableCell>

                      <TableCell className="text-xs">
                        {employee.position || 'Non défini'}
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary">
                          Non affecté
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        Non configuré
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {!employees.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Aucun collaborateur disponible.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================
            RESTRICTED / HISTORY
        ============================================================ */}
        <TabsContent value="history" className="mt-4 space-y-4">
          <AccessSectionCard
            icon={History}
            title="Journal des changements"
            description="Historique des modifications de la matrice de permissions actuellement disponible."
          >
            {history.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucune modification enregistrée.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Auteur</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Interface</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Valeur</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {history.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs">
                          {new Date(
                            item.at,
                          ).toLocaleString('fr-FR')}
                        </TableCell>

                        <TableCell className="text-xs">
                          {item.actor}
                        </TableCell>

                        <TableCell className="text-xs">
                          {jobRoles.find(
                            (candidate) =>
                              candidate.id === item.roleId,
                          )?.label ?? item.roleId}
                        </TableCell>

                        <TableCell className="font-mono text-xs">
                          {item.pageId}
                        </TableCell>

                        <TableCell className="text-xs">
                          {
                            PERMISSION_ACTIONS.find(
                              (action) =>
                                action.key === item.action,
                            )?.label
                          }
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              item.value
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {item.value
                              ? 'Accordé'
                              : 'Retiré'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </AccessSectionCard>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Pages restreintes
              </CardTitle>
            </CardHeader>

            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Interface</TableHead>
                    <TableHead>Profils autorisés</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {Object.entries(RESTRICTED_PAGES).map(
                    ([pageId, owners]) => (
                      <TableRow key={pageId}>
                        <TableCell>
                          <span className="font-medium text-sm">
                            {pageRegistry.find(
                              (page) =>
                                page.id === pageId,
                            )?.label ?? pageId}
                          </span>

                          <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                            {pageId}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {owners.map((owner) => (
                              <Badge
                                key={owner}
                                variant="outline"
                              >
                                {jobRoles.find(
                                  (item) =>
                                    item.id === owner,
                                )?.label ?? owner}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================
            SENSITIVE
        ============================================================ */}
        <TabsContent value="sensitive" className="mt-4">
          <SensitiveRulesMatrix />
        </TabsContent>
      </Tabs>

      {!isSuperAdmin ? (
        <p className="text-xs text-muted-foreground">
          Vous consultez ce centre avec des droits limités. Les
          modifications de matrice restent actuellement liées au
          système de configuration existant. La gestion
          persistante des affectations sera ajoutée avec le
          backend RBAC.
        </p>
      ) : null}
    </div>
  );
};

export default function RolesPermissions() {
  return (
    <ProtectedPage pageId="admin.roles">
      <RolesPermissionsInner />
    </ProtectedPage>
  );
}