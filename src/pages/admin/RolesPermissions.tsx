import { useMemo, useState } from 'react';
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
  isRbacEnforced,
  loadMatrixHistory,
  loadMatrixOverrides,
  pageRegistry,
  resolvePagePermissions,
  saveMatrixOverrides,
  setRbacEnforced,
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
    useState<MatrixOverrides>(loadMatrixOverrides());

  const [enforced, setEnforced] =
    useState(isRbacEnforced());

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
        employee.name,
        employee.email,
        employee.pole,
        employee.position,
        employee.status,
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
          employee.status?.toLowerCase() === 'active' ||
          employee.status?.toLowerCase() === 'actif',
      ),
    [employees],
  );

  const inactiveEmployees = useMemo(
    () =>
      employees.filter(
        (employee) =>
          employee.status?.toLowerCase() !== 'active' &&
          employee.status?.toLowerCase() !== 'actif',
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
    const before = loadMatrixOverrides();

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

    saveMatrixOverrides(draft);

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
    saveMatrixOverrides(next);

    toast({
      title: 'Rôle réinitialisé',
      description: `${role?.label} revient aux droits par défaut.`,
    });
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
                setRbacEnforced(value);

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
        <TabsContent value="accounts" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <AccessSectionCard
              icon={Users}
              title="Comptes collaborateurs"
              description="Comptes actuellement présents dans le référentiel RH."
              count={`${employees.length}`}
            >
              <p className="text-xs text-muted-foreground">
                La création, l'activation, la désactivation et
                l'évolution des comptes relèvent de RH.
              </p>
            </AccessSectionCard>

            <AccessSectionCard
              icon={UserRoundCheck}
              title="Comptes actifs"
              description="Collaborateurs actuellement actifs."
              count={`${activeEmployees.length}`}
            >
              <p className="text-xs text-muted-foreground">
                Un compte actif pourra recevoir une affectation
                de rôle et de périmètre.
              </p>
            </AccessSectionCard>

            <AccessSectionCard
              icon={AlertTriangle}
              title="Comptes à contrôler"
              description="Comptes non actifs ou dont le statut nécessite une vérification."
              count={`${inactiveEmployees.length}`}
            >
              <p className="text-xs text-muted-foreground">
                La révocation effective des accès sera reliée au
                cycle de vie du compte lors de la mise en place
                du backend RBAC.
              </p>
            </AccessSectionCard>
          </div>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">
                  Référentiel des comptes
                </CardTitle>

                <p className="mt-1 text-xs text-muted-foreground">
                  RH administre les comptes. Le rôle métier reste
                  une affectation distincte du poste RH.
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />

                <Input
                  value={accountSearch}
                  onChange={(event) =>
                    setAccountSearch(event.target.value)
                  }
                  placeholder="Rechercher un collaborateur…"
                  className="w-64 pl-8"
                />
              </div>
            </CardHeader>

            <CardContent className="overflow-x-auto">
              {employeesLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Chargement des comptes…
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Collaborateur</TableHead>
                      <TableHead>Pôle</TableHead>
                      <TableHead>Poste</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Rôle d'accès</TableHead>
                      <TableHead>Périmètre</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="font-medium text-sm">
                            {employee.name}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {employee.email}
                          </div>
                        </TableCell>

                        <TableCell className="text-xs capitalize">
                          {employee.pole || 'Non défini'}
                        </TableCell>

                        <TableCell className="text-xs">
                          {employee.position || 'Non défini'}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              employee.status?.toLowerCase() ===
                                'active' ||
                              employee.status?.toLowerCase() ===
                                'actif'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {employee.status || 'Non défini'}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline">
                            Non affecté
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            Non configuré
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}

                    {!filteredEmployees.length ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-8 text-center text-sm text-muted-foreground"
                        >
                          Aucun compte trouvé.
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
                          {employee.name}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {employee.email}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs capitalize">
                        {employee.pole || 'Non défini'}
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
