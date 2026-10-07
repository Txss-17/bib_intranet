import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Users,
  UserCog,
  Briefcase,
  Search,
  Loader2,
  Save,
  Lock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { toast } from '@/hooks/use-toast';
import { useEmployees } from '@/hooks/useEmployees';
import { supabase } from '@/integrations/supabase/client';


type AccessRole = {
  id: string;
  role_key: string;
  label: string;
  department: string | null;
  business_pole: string | null;
  description: string | null;
  owner_type: string;
  status: string;
};

type AccessScope = {
  id: string;
  scope_key: string;
  label: string;
  scope_type: string;
  description: string | null;
};

type AccessAssignment = {
  id: string;
  employee_id: string;
  role_id: string;
  scope_id: string | null;
  scope_value: string | null;
  status: string;
  starts_at: string;
  ends_at: string | null;
  role?: AccessRole | null;
  scope?: AccessScope | null;
};

type PortfolioType = {
  id: string;
  portfolio_type_key: string;
  label: string;
  business_pole: string;
  status: string;
};

type BusinessPortfolio = {
  id: string;
  portfolio_type_id: string;
  source_id: string;
  label_snapshot: string | null;
  status: string;
  portfolio_type?: PortfolioType | null;
};

type PortfolioAssignment = {
  id: string;
  employee_id: string;
  portfolio_id: string;
  assignment_status: string;
  starts_at: string;
  ends_at: string | null;
  reason: string | null;
  portfolio?: BusinessPortfolio | null;
};


const STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  pending: 'En attente',
  suspended: 'Suspendu',
  revoked: 'Révoqué',
  expired: 'Expiré',
};


const STATUS_VARIANT = (
  status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'active':
      return 'default';

    case 'pending':
      return 'secondary';

    case 'revoked':
    case 'expired':
      return 'destructive';

    default:
      return 'outline';
  }
};


const getEmployeeName = (employee: any) =>
  `${employee.first_name ?? ''} ${employee.last_name ?? ''}`.trim() ||
  employee.email;


const RHAccess = () => {
  const queryClient = useQueryClient();

  const {
    data: employees = [],
    isLoading: employeesLoading,
  } = useEmployees({
    hrStatus: 'active',
  });

  const [search, setSearch] = useState('');
  const [poleFilter, setPoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState<string | null>(null);

  const [roleDialogOpen, setRoleDialogOpen] =
    useState(false);

  const [portfolioDialogOpen, setPortfolioDialogOpen] =
    useState(false);

  const [selectedRoleId, setSelectedRoleId] =
    useState('');

  const [selectedScopeId, setSelectedScopeId] =
    useState('none');

  const [selectedPortfolioId, setSelectedPortfolioId] =
    useState('');

  const [saving, setSaving] = useState(false);


  /*
   * ============================================================
   * CATALOGUE DES RÔLES
   * ============================================================
   */

  const {
    data: roles = [],
    isLoading: rolesLoading,
  } = useQuery({
    queryKey: ['rh-access-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_roles' as any)
        .select(`
          id,
          role_key,
          label,
          department,
          business_pole,
          description,
          owner_type,
          status
        `)
        .order('label');

      if (error) {
        throw error;
      }

      return (data ?? []) as AccessRole[];
    },
  });


  /*
   * ============================================================
   * CATALOGUE DES SCOPES
   * ============================================================
   */

  const {
    data: scopes = [],
  } = useQuery({
    queryKey: ['rh-access-scopes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_scopes' as any)
        .select(`
          id,
          scope_key,
          label,
          scope_type,
          description
        `)
        .order('label');

      if (error) {
        throw error;
      }

      return (data ?? []) as AccessScope[];
    },
  });


  /*
   * ============================================================
   * AFFECTATIONS RBAC
   * ============================================================
   */

  const {
    data: assignments = [],
    isLoading: assignmentsLoading,
  } = useQuery({
    queryKey: ['rh-access-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_assignments' as any)
        .select(`
          id,
          employee_id,
          role_id,
          scope_id,
          scope_value,
          status,
          starts_at,
          ends_at,
          role:access_roles(
            id,
            role_key,
            label,
            department,
            business_pole,
            description,
            owner_type,
            status
          ),
          scope:access_scopes(
            id,
            scope_key,
            label,
            scope_type,
            description
          )
        `)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      return (data ?? []) as AccessAssignment[];
    },
  });


  /*
   * ============================================================
   * TYPES DE PORTEFEUILLES
   * ============================================================
   */

  const {
    data: portfolioTypes = [],
  } = useQuery({
    queryKey: ['rh-access-portfolio-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_portfolio_types' as any)
        .select(`
          id,
          portfolio_type_key,
          label,
          business_pole,
          status
        `)
        .eq('status', 'active')
        .order('label');

      if (error) {
        throw error;
      }

      return (data ?? []) as PortfolioType[];
    },
  });


  /*
   * ============================================================
   * PORTEFEUILLES MÉTIER
   * ============================================================
   */

  const {
    data: businessPortfolios = [],
    isLoading: portfoliosLoading,
  } = useQuery({
    queryKey: ['rh-access-business-portfolios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_business_portfolios' as any)
        .select(`
          id,
          portfolio_type_id,
          source_id,
          label_snapshot,
          status,
          portfolio_type:access_portfolio_types(
            id,
            portfolio_type_key,
            label,
            business_pole,
            status
          )
        `)
        .eq('status', 'active')
        .order('label_snapshot');

      if (error) {
        throw error;
      }

      return (data ?? []) as BusinessPortfolio[];
    },
  });


  /*
   * ============================================================
   * AFFECTATIONS DE PORTEFEUILLES
   * ============================================================
   */

  const {
    data: portfolioAssignments = [],
    isLoading: portfolioAssignmentsLoading,
  } = useQuery({
    queryKey: ['rh-access-portfolio-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_portfolio_assignments' as any)
        .select(`
          id,
          employee_id,
          portfolio_id,
          assignment_status,
          starts_at,
          ends_at,
          reason,
          portfolio:access_business_portfolios(
            id,
            portfolio_type_id,
            source_id,
            label_snapshot,
            status,
            portfolio_type:access_portfolio_types(
              id,
              portfolio_type_key,
              label,
              business_pole,
              status
            )
          )
        `)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      return (data ?? []) as PortfolioAssignment[];
    },
  });


  /*
   * ============================================================
   * FILTRES COLLABORATEURS
   * ============================================================
   */

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();

    return employees.filter((employee: any) => {
      if (
        poleFilter !== 'all' &&
        !(employee.poles ?? []).includes(poleFilter)
      ) {
        return false;
      }

      if (
        statusFilter !== 'all' &&
        employee.hr_status !== statusFilter
      ) {
        return false;
      }

      if (!q) {
        return true;
      }

      return [
        getEmployeeName(employee),
        employee.email,
        employee.position,
        ...(employee.poles ?? []),
      ]
        .filter(Boolean)
        .some((value: string) =>
          value.toLowerCase().includes(q),
        );
    });
  }, [
    employees,
    search,
    poleFilter,
    statusFilter,
  ]);


  /*
   * ============================================================
   * EMPLOYÉ SÉLECTIONNÉ
   * ============================================================
   */

  const selectedEmployee = useMemo(
    () =>
      employees.find(
        (employee: any) =>
          employee.id === selectedEmployeeId,
      ) ?? null,
    [employees, selectedEmployeeId],
  );


  const selectedEmployeeAssignments =
    useMemo(
      () =>
        assignments.filter(
          (assignment) =>
            assignment.employee_id ===
            selectedEmployeeId,
        ),
      [assignments, selectedEmployeeId],
    );


  const selectedEmployeePortfolioAssignments =
    useMemo(
      () =>
        portfolioAssignments.filter(
          (assignment) =>
            assignment.employee_id ===
            selectedEmployeeId,
        ),
      [
        portfolioAssignments,
        selectedEmployeeId,
      ],
    );


  /*
   * ============================================================
   * KPI
   * ============================================================
   */

  const activeRoleAssignments =
    assignments.filter(
      (assignment) =>
        assignment.status === 'active',
    ).length;

  const activePortfolioAssignments =
    portfolioAssignments.filter(
      (assignment) =>
        assignment.assignment_status ===
        'active',
    ).length;

  const collaboratorsWithoutRole =
    employees.filter(
      (employee: any) =>
        !assignments.some(
          (assignment) =>
            assignment.employee_id ===
              employee.id &&
            assignment.status ===
              'active',
        ),
    ).length;


  /*
   * ============================================================
   * OUVERTURE DU DIALOGUE RÔLE
   * ============================================================
   */

  const openRoleDialog = (
    employeeId: string,
  ) => {
    const current =
      assignments.find(
        (assignment) =>
          assignment.employee_id ===
            employeeId &&
          assignment.status ===
            'active',
      );

    setSelectedEmployeeId(employeeId);

    setSelectedRoleId(
      current?.role_id ?? '',
    );

    setSelectedScopeId(
      current?.scope_id ?? 'none',
    );

    setRoleDialogOpen(true);
  };


  /*
   * ============================================================
   * ENREGISTREMENT DU RÔLE
   * ============================================================
   */

  const handleSaveRole = async () => {
    if (
      !selectedEmployee ||
      !selectedRoleId
    ) {
      return;
    }

    setSaving(true);

    try {
      const existing =
        assignments.find(
          (assignment) =>
            assignment.employee_id ===
              selectedEmployee.id &&
            assignment.status ===
              'active',
        );

      const payload = {
        employee_id:
          selectedEmployee.id,

        role_id:
          selectedRoleId,

        scope_id:
          selectedScopeId === 'none'
            ? null
            : selectedScopeId,

        scope_value: null,

        status: 'active',

        starts_at:
          existing?.starts_at ??
          new Date().toISOString(),

        ends_at: null,
      };

      if (existing) {
        const { error } =
          await supabase
            .from(
              'access_assignments' as any,
            )
            .update(payload)
            .eq(
              'id',
              existing.id,
            );

        if (error) {
          throw error;
        }
      } else {
        const { error } =
          await supabase
            .from(
              'access_assignments' as any,
            )
            .insert({
              ...payload,
              assigned_by:
                selectedEmployee.id,
            });

        if (error) {
          throw error;
        }
      }

      await queryClient.invalidateQueries({
        queryKey: [
          'rh-access-assignments',
        ],
      });

      toast({
        title:
          'Accès mis à jour',
        description:
          `Le rôle de ${getEmployeeName(
            selectedEmployee,
          )} a été enregistré.`,
      });

      setRoleDialogOpen(false);
    } catch (error: any) {
      toast({
        title:
          'Impossible d’enregistrer',
        description:
          error?.message ??
          'Une erreur est survenue.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };


  /*
   * ============================================================
   * OUVERTURE PORTFOLIO
   * ============================================================
   */

  const openPortfolioDialog = (
    employeeId: string,
  ) => {
    setSelectedEmployeeId(employeeId);
    setSelectedPortfolioId('');
    setPortfolioDialogOpen(true);
  };


  /*
   * ============================================================
   * ENREGISTREMENT PORTFOLIO
   * ============================================================
   */

  const handleSavePortfolio =
    async () => {
      if (
        !selectedEmployee ||
        !selectedPortfolioId
      ) {
        return;
      }

      const alreadyAssigned =
        portfolioAssignments.some(
          (assignment) =>
            assignment.employee_id ===
              selectedEmployee.id &&
            assignment.portfolio_id ===
              selectedPortfolioId &&
            assignment.assignment_status ===
              'active',
        );

      if (alreadyAssigned) {
        toast({
          title:
            'Affectation déjà existante',
          description:
            'Ce collaborateur possède déjà un accès actif à ce portefeuille.',
          variant:
            'destructive',
        });

        return;
      }

      setSaving(true);

      try {
        const roleAssignment =
          assignments.find(
            (assignment) =>
              assignment.employee_id ===
                selectedEmployee.id &&
              assignment.status ===
                'active',
          );

        const { error } =
          await supabase
            .from(
              'access_portfolio_assignments' as any,
            )
            .insert({
              employee_id:
                selectedEmployee.id,

              portfolio_id:
                selectedPortfolioId,

              access_assignment_id:
                roleAssignment?.id ??
                null,

              assignment_status:
                'active',

              starts_at:
                new Date().toISOString(),

              assigned_by:
                selectedEmployee.id,

              reason:
                'Affectation RH',
            });

        if (error) {
          throw error;
        }

        await queryClient.invalidateQueries({
          queryKey: [
            'rh-access-portfolio-assignments',
          ],
        });

        toast({
          title:
            'Périmètre ajouté',
          description:
            `Le portefeuille a été affecté à ${getEmployeeName(
              selectedEmployee,
            )}.`,
        });

        setPortfolioDialogOpen(false);
      } catch (error: any) {
        toast({
          title:
            'Impossible d’enregistrer',
          description:
            error?.message ??
            'Une erreur est survenue.',
          variant:
            'destructive',
        });
      } finally {
        setSaving(false);
      }
    };


  /*
   * ============================================================
   * RÉVOCATION RÔLE
   * ============================================================
   */

  const revokeRole = async (
    assignment: AccessAssignment,
  ) => {
    try {
      const { error } =
        await supabase
          .from(
            'access_assignments' as any,
          )
          .update({
            status: 'revoked',
            ends_at:
              new Date().toISOString(),
          })
          .eq(
            'id',
            assignment.id,
          );

      if (error) {
        throw error;
      }

      await queryClient.invalidateQueries({
        queryKey: [
          'rh-access-assignments',
        ],
      });

      toast({
        title:
          'Accès révoqué',
        description:
          `Le rôle ${assignment.role?.label ?? ''} a été révoqué.`,
      });
    } catch (error: any) {
      toast({
        title:
          'Impossible de révoquer',
        description:
          error?.message ??
          'Une erreur est survenue.',
        variant: 'destructive',
      });
    }
  };


  /*
   * ============================================================
   * RÉVOCATION PORTEFEUILLE
   * ============================================================
   */

  const revokePortfolio =
    async (
      assignment: PortfolioAssignment,
    ) => {
      try {
        const { error } =
          await supabase
            .from(
              'access_portfolio_assignments' as any,
            )
            .update({
              assignment_status:
                'revoked',

              ends_at:
                new Date().toISOString(),
            })
            .eq(
              'id',
              assignment.id,
            );

        if (error) {
          throw error;
        }

        await queryClient.invalidateQueries({
          queryKey: [
            'rh-access-portfolio-assignments',
          ],
        });

        toast({
          title:
            'Périmètre révoqué',
          description:
            'L’accès au portefeuille a été révoqué.',
        });
      } catch (error: any) {
        toast({
          title:
            'Impossible de révoquer',
          description:
            error?.message ??
            'Une erreur est survenue.',
          variant:
            'destructive',
        });
      }
    };


  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <ShieldCheck className="h-6 w-6" />
            Accès & permissions
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Gestion RH des affectations d'accès des collaborateurs :
            rôle métier, périmètre et portefeuille autorisé.
            La matrice technique des permissions reste administrée
            par Security & IT.
          </p>
        </div>

        <Badge
          variant="outline"
          className="flex items-center gap-2"
        >
          <Lock className="h-3.5 w-3.5" />
          RH — gouvernance des affectations
        </Badge>
      </div>


      {/* ======================================================
          KPI
      ====================================================== */}

      <div className="grid gap-4 md:grid-cols-4">

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-muted-foreground" />

              <span className="text-2xl font-semibold">
                {employees.length}
              </span>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Collaborateurs actifs
            </p>
          </CardContent>
        </Card>


        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <UserCog className="h-5 w-5 text-muted-foreground" />

              <span className="text-2xl font-semibold">
                {activeRoleAssignments}
              </span>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Affectations de rôles actives
            </p>
          </CardContent>
        </Card>


        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Briefcase className="h-5 w-5 text-muted-foreground" />

              <span className="text-2xl font-semibold">
                {activePortfolioAssignments}
              </span>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Périmètres portefeuille actifs
            </p>
          </CardContent>
        </Card>


        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />

              <span className="text-2xl font-semibold">
                {collaboratorsWithoutRole}
              </span>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Collaborateurs sans rôle
            </p>
          </CardContent>
        </Card>

      </div>


      {/* ======================================================
          FILTRES
      ====================================================== */}

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-3">

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Rechercher un collaborateur…"
                className="pl-9"
              />
            </div>


            <Select
              value={poleFilter}
              onValueChange={setPoleFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pôle" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Tous les pôles
                </SelectItem>

                <SelectItem value="direction">
                  Direction
                </SelectItem>

                <SelectItem value="rh">
                  RH
                </SelectItem>

                <SelectItem value="supplier">
                  Fournisseurs
                </SelectItem>

                <SelectItem value="marketplace">
                  Marketplace
                </SelectItem>

                <SelectItem value="finance">
                  Finance
                </SelectItem>

                <SelectItem value="ops">
                  Opérations
                </SelectItem>

                <SelectItem value="security">
                  Security & IT
                </SelectItem>

                <SelectItem value="product">
                  Produit & Engineering
                </SelectItem>
              </SelectContent>
            </Select>


            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Tous les statuts
                </SelectItem>

                <SelectItem value="active">
                  Actifs
                </SelectItem>

                <SelectItem value="onboarding">
                  Onboarding
                </SelectItem>
              </SelectContent>
            </Select>

          </div>
        </CardContent>
      </Card>


      {/* ======================================================
          COLLABORATEURS
      ====================================================== */}

      <Card>
        <CardHeader>
          <CardTitle>
            Affectations des collaborateurs
          </CardTitle>

          <CardDescription>
            Sélectionnez un collaborateur pour gérer son rôle
            d'accès et ses périmètres métier.
          </CardDescription>
        </CardHeader>

        <CardContent className="overflow-x-auto">

          {employeesLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <Table>

              <TableHeader>
                <TableRow>
                  <TableHead>
                    Collaborateur
                  </TableHead>

                  <TableHead>
                    Pôle
                  </TableHead>

                  <TableHead>
                    Poste
                  </TableHead>

                  <TableHead>
                    Rôle d'accès
                  </TableHead>

                  <TableHead>
                    Portefeuilles
                  </TableHead>

                  <TableHead>
                    État
                  </TableHead>

                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>


              <TableBody>

                {filteredEmployees.map(
                  (employee: any) => {

                    const roleAssignment =
                      assignments.find(
                        (assignment) =>
                          assignment.employee_id ===
                            employee.id &&
                          assignment.status ===
                            'active',
                      );

                    const employeePortfolios =
                      portfolioAssignments.filter(
                        (assignment) =>
                          assignment.employee_id ===
                            employee.id &&
                          assignment.assignment_status ===
                            'active',
                      );

                    return (
                      <TableRow
                        key={employee.id}
                      >

                        <TableCell>
                          <div className="font-medium">
                            {getEmployeeName(
                              employee,
                            )}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {employee.email}
                          </div>
                        </TableCell>


                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(employee.poles ?? [])
                              .slice(0, 3)
                              .map(
                                (pole: string) => (
                                  <Badge
                                    key={pole}
                                    variant="outline"
                                  >
                                    {pole}
                                  </Badge>
                                ),
                              )}
                          </div>
                        </TableCell>


                        <TableCell className="text-sm">
                          {employee.position ??
                            'Non défini'}
                        </TableCell>


                        <TableCell>
                          {roleAssignment ? (
                            <div>
                              <Badge>
                                {roleAssignment.role
                                  ?.label ??
                                  'Rôle'}
                              </Badge>

                              {roleAssignment.scope ? (
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  {roleAssignment.scope.label}
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <Badge variant="outline">
                              Non affecté
                            </Badge>
                          )}
                        </TableCell>


                        <TableCell>
                          {employeePortfolios.length ? (
                            <div className="flex flex-wrap gap-1">
                              {employeePortfolios
                                .slice(0, 2)
                                .map(
                                  (assignment) => (
                                    <Badge
                                      key={
                                        assignment.id
                                      }
                                      variant="secondary"
                                    >
                                      {assignment
                                        .portfolio
                                        ?.label_snapshot ??
                                        'Portefeuille'}
                                    </Badge>
                                  ),
                                )}

                              {employeePortfolios.length >
                              2 ? (
                                <Badge variant="outline">
                                  +
                                  {employeePortfolios.length -
                                    2}
                                </Badge>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Aucun
                            </span>
                          )}
                        </TableCell>


                        <TableCell>
                          {roleAssignment ? (
                            <Badge
                              variant={STATUS_VARIANT(
                                roleAssignment.status,
                              )}
                            >
                              {STATUS_LABELS[
                                roleAssignment.status
                              ] ??
                                roleAssignment.status}
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              À configurer
                            </Badge>
                          )}
                        </TableCell>


                        <TableCell>
                          <div className="flex justify-end gap-2">

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openRoleDialog(
                                  employee.id,
                                )
                              }
                            >
                              <UserCog className="mr-1.5 h-4 w-4" />
                              Rôle
                            </Button>


                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openPortfolioDialog(
                                  employee.id,
                                )
                              }
                            >
                              <Briefcase className="mr-1.5 h-4 w-4" />
                              Périmètre
                            </Button>

                          </div>
                        </TableCell>

                      </TableRow>
                    );
                  },
                )}


                {!filteredEmployees.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      Aucun collaborateur correspondant
                      aux filtres.
                    </TableCell>
                  </TableRow>
                ) : null}

              </TableBody>

            </Table>
          )}

        </CardContent>
      </Card>


      {/* ======================================================
          DÉTAIL COLLABORATEUR
      ====================================================== */}

      {selectedEmployee ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />

              Accès de{' '}
              {getEmployeeName(
                selectedEmployee,
              )}
            </CardTitle>

            <CardDescription>
              Vue consolidée du rôle et des périmètres actuellement
              attribués.
            </CardDescription>
          </CardHeader>

          <CardContent>

            <div className="grid gap-4 md:grid-cols-2">

              <div className="rounded-lg border p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Rôles
                </p>

                <div className="mt-3 space-y-2">
                  {selectedEmployeeAssignments.length ? (
                    selectedEmployeeAssignments.map(
                      (assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between gap-3 rounded-md bg-muted/30 p-3"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {assignment.role
                                ?.label ??
                                'Rôle'}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {assignment.role
                                ?.role_key ??
                                ''}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge
                              variant={STATUS_VARIANT(
                                assignment.status,
                              )}
                            >
                              {STATUS_LABELS[
                                assignment.status
                              ] ??
                                assignment.status}
                            </Badge>

                            {assignment.status ===
                            'active' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  revokeRole(
                                    assignment,
                                  )
                                }
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ),
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Aucun rôle attribué.
                    </p>
                  )}
                </div>
              </div>


              <div className="rounded-lg border p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Portefeuilles
                </p>

                <div className="mt-3 space-y-2">
                  {selectedEmployeePortfolioAssignments.length ? (
                    selectedEmployeePortfolioAssignments.map(
                      (assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between gap-3 rounded-md bg-muted/30 p-3"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {assignment
                                .portfolio
                                ?.label_snapshot ??
                                'Portefeuille'}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {assignment
                                .portfolio
                                ?.portfolio_type
                                ?.label ??
                                ''}
                            </p>
                          </div>

                          {assignment.assignment_status ===
                          'active' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                revokePortfolio(
                                  assignment,
                                )
                              }
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      ),
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Aucun portefeuille attribué.
                    </p>
                  )}
                </div>
              </div>

            </div>

          </CardContent>
        </Card>
      ) : null}


      {/* ======================================================
          DIALOG RÔLE
      ====================================================== */}

      <Dialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Affecter un rôle d'accès
            </DialogTitle>

            <DialogDescription>
              {selectedEmployee
                ? `Configuration de ${getEmployeeName(
                    selectedEmployee,
                  )}.`
                : ''}
            </DialogDescription>
          </DialogHeader>


          <div className="space-y-5">

            <div className="space-y-2">
              <Label>
                Rôle métier d'accès
              </Label>

              <Select
                value={selectedRoleId}
                onValueChange={
                  setSelectedRoleId
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>

                <SelectContent>
                  {roles
                    .filter(
                      (role) =>
                        role.status ===
                        'active',
                    )
                    .map((role) => (
                      <SelectItem
                        key={role.id}
                        value={role.id}
                      >
                        {role.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>


            <div className="space-y-2">
              <Label>
                Périmètre RBAC
              </Label>

              <Select
                value={selectedScopeId}
                onValueChange={
                  setSelectedScopeId
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Périmètre" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="none">
                    Aucun périmètre spécifique
                  </SelectItem>

                  {scopes.map((scope) => (
                    <SelectItem
                      key={scope.id}
                      value={scope.id}
                    >
                      {scope.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="text-xs text-muted-foreground">
                Le périmètre RBAC décrit le niveau d'accès
                technique. Les portefeuilles métier sont gérés
                séparément ci-dessous.
              </p>
            </div>

          </div>


          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setRoleDialogOpen(false)
              }
              disabled={saving}
            >
              Annuler
            </Button>

            <Button
              onClick={handleSaveRole}
              disabled={
                saving ||
                !selectedRoleId
              }
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}

              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* ======================================================
          DIALOG PORTEFEUILLE
      ====================================================== */}

      <Dialog
        open={portfolioDialogOpen}
        onOpenChange={
          setPortfolioDialogOpen
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Affecter un périmètre métier
            </DialogTitle>

            <DialogDescription>
              {selectedEmployee
                ? `Ajouter un portefeuille autorisé à ${getEmployeeName(
                    selectedEmployee,
                  )}.`
                : ''}
            </DialogDescription>
          </DialogHeader>


          <div className="space-y-4">

            <div className="space-y-2">
              <Label>
                Portefeuille
              </Label>

              <Select
                value={
                  selectedPortfolioId
                }
                onValueChange={
                  setSelectedPortfolioId
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un portefeuille" />
                </SelectTrigger>

                <SelectContent>
                  {businessPortfolios.map(
                    (portfolio) => (
                      <SelectItem
                        key={portfolio.id}
                        value={portfolio.id}
                      >
                        {portfolio.label_snapshot ??
                          'Portefeuille'}{' '}
                        —{' '}
                        {portfolio
                          .portfolio_type
                          ?.label ??
                          ''}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>


            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium">
                Règle de séparation
              </p>

              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Cette affectation donne accès aux ressources
                du portefeuille. Elle ne transfère pas la
                propriété du portefeuille au collaborateur.
              </p>
            </div>

          </div>


          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setPortfolioDialogOpen(
                  false,
                )
              }
              disabled={saving}
            >
              Annuler
            </Button>

            <Button
              onClick={
                handleSavePortfolio
              }
              disabled={
                saving ||
                !selectedPortfolioId
              }
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}

              Affecter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* ======================================================
          ÉTAT TECHNIQUE
      ====================================================== */}

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">
            Gouvernance des permissions
          </CardTitle>

          <CardDescription>
            RH et Security & IT ont des responsabilités distinctes.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-3 md:grid-cols-3">

          <div className="rounded-lg border p-4">
            <Users className="h-5 w-5 text-muted-foreground" />

            <p className="mt-2 font-medium">
              RH
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Identité, statut, rôle attribué et périmètre
              métier du collaborateur.
            </p>
          </div>


          <div className="rounded-lg border p-4">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />

            <p className="mt-2 font-medium">
              Security & IT
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Catalogue RBAC, permissions, interfaces, actions
              et sécurité technique.
            </p>
          </div>


          <div className="rounded-lg border p-4">
            <Briefcase className="h-5 w-5 text-muted-foreground" />

            <p className="mt-2 font-medium">
              Pôles métier
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Données et portefeuilles métier. Le collaborateur
              reçoit un accès sans devenir propriétaire de ces données.
            </p>
          </div>

        </CardContent>
      </Card>

    </div>
  );
};


export default RHAccess;
