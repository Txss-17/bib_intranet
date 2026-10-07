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
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';


/* ============================================================
   TYPES
============================================================ */

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
  access_assignment_id: string | null;
  assignment_status: string;
  starts_at: string;
  ends_at: string | null;
  assigned_by: string | null;
  reason: string | null;
  portfolio?: BusinessPortfolio | null;
};


/* ============================================================
   HELPERS
============================================================ */

const getEmployeeName = (employee: any) =>
  `${employee.first_name ?? ''} ${employee.last_name ?? ''}`.trim() ||
  employee.email;

const canReceiveNewAccess = (employee: any) =>
  employee?.hr_status === 'active' ||
  employee?.hr_status === 'onboarding';

const employeeHasPole = (
  employee: any,
  pole: string,
) =>
  Array.isArray(employee?.poles) &&
  employee.poles.includes(pole);

const roleMatchesEmployee = (
  role: AccessRole,
  employee: any,
) => {
  /*
   * Un rôle sans business_pole est considéré comme transversal.
   */
  if (!role.business_pole) {
    return true;
  }

  return employeeHasPole(
    employee,
    role.business_pole,
  );
};

const portfolioMatchesEmployee = (
  portfolio: BusinessPortfolio,
  employee: any,
) => {
  const type = portfolio.portfolio_type;

  if (!type) {
    return false;
  }

  /*
   * FOURNISSEURS
   *
   * Un portefeuille fournisseur ne peut être affecté
   * qu'à un collaborateur :
   * - du pôle fournisseurs
   * - ayant le poste supplier_manager
   */
  if (
    type.portfolio_type_key === 'supplier'
  ) {
    return (
      employeeHasPole(employee, 'supplier') &&
      employee.position === 'supplier_manager'
    );
  }

  /*
   * MARKETPLACE
   *
   * Le portefeuille marchand appartient au pôle Marketplace.
   * Aucun poste "marketplace_manager" n'est supposé ici.
   */
  if (
    type.portfolio_type_key ===
    'marketplace_merchant'
  ) {
    return employeeHasPole(
      employee,
      'marketplace',
    );
  }

  /*
   * Par défaut, on exige que le pôle métier du portefeuille
   * soit présent dans les pôles du collaborateur.
   */
  return employeeHasPole(
    employee,
    type.business_pole,
  );
};


/* ============================================================
   COMPONENT
============================================================ */

const RHAccess = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    data: employees = [],
    isLoading: employeesLoading,
  } = useEmployees({});

  /* ==========================================================
     UI STATE
  ========================================================== */

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


  /* ==========================================================
     RÔLES
  ========================================================== */

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
        .eq('status', 'active')
        .order('label');

      if (error) {
        throw error;
      }

      return (data ?? []) as AccessRole[];
    },
  });


  /* ==========================================================
     SCOPES
  ========================================================== */

  const {
    data: scopes = [],
    isLoading: scopesLoading,
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


  /* ==========================================================
     AFFECTATIONS RBAC
  ========================================================== */

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


  /* ==========================================================
     PORTEFEUILLES MÉTIER
  ========================================================== */

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


  /* ==========================================================
     AFFECTATIONS PORTEFEUILLES
  ========================================================== */

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
          access_assignment_id,
          assignment_status,
          starts_at,
          ends_at,
          assigned_by,
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


  /* ==========================================================
     FILTRES COLLABORATEURS
  ========================================================== */

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();

    return employees.filter((employee: any) => {
      if (
        poleFilter !== 'all' &&
        !(employee.poles ?? []).includes(
          poleFilter,
        )
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
        employee.collaborator_type,
        employee.hr_status,
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


  /* ==========================================================
     COLLABORATEUR SÉLECTIONNÉ
  ========================================================== */

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


  /* ==========================================================
     KPI
  ========================================================== */

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
            assignment.status === 'active',
        ),
    ).length;


  /* ==========================================================
     RÔLES DISPONIBLES POUR LE COLLABORATEUR
  ========================================================== */

  const availableRoles = useMemo(() => {
    if (!selectedEmployee) {
      return [];
    }

    return roles.filter((role) =>
      roleMatchesEmployee(
        role,
        selectedEmployee,
      ),
    );
  }, [roles, selectedEmployee]);


  /* ==========================================================
     PORTEFEUILLES DISPONIBLES
  ========================================================== */

  const availablePortfolios = useMemo(() => {
    if (!selectedEmployee) {
      return [];
    }

    /*
     * Aucun nouveau portefeuille pour un collaborateur
     * en congé, suspendu, départ ou archivé.
     */
    if (
      !canReceiveNewAccess(
        selectedEmployee,
      )
    ) {
      return [];
    }

    return businessPortfolios.filter(
      (portfolio) =>
        portfolioMatchesEmployee(
          portfolio,
          selectedEmployee,
        ),
    );
  }, [
    businessPortfolios,
    selectedEmployee,
  ]);


  /* ==========================================================
     POLES DISPONIBLES
  ========================================================== */

  const poleOptions = useMemo(() => {
    const values = new Set<string>();

    employees.forEach((employee: any) => {
      (employee.poles ?? []).forEach(
        (pole: string) => values.add(pole),
      );
    });

    return Array.from(values).sort();
  }, [employees]);


  /* ==========================================================
     OUVERTURE DIALOGUE RÔLE
  ========================================================== */

  const openRoleDialog = (
    employeeId: string,
  ) => {
    const employee = employees.find(
      (item: any) =>
        item.id === employeeId,
    );

    if (!employee) {
      return;
    }

    const current =
      assignments.find(
        (assignment) =>
          assignment.employee_id ===
            employeeId &&
          assignment.status === 'active',
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


  /* ==========================================================
     ENREGISTREMENT RÔLE
  ========================================================== */

  const handleSaveRole = async () => {
    if (
      !selectedEmployee ||
      !selectedRoleId
    ) {
      return;
    }

    /*
     * La révocation reste possible pour les autres statuts,
     * mais une nouvelle affectation ou modification active
     * est réservée à active/onboarding.
     */
    if (
      !canReceiveNewAccess(
        selectedEmployee,
      )
    ) {
      toast({
        title:
          'Affectation impossible',
        description:
          'Un rôle ne peut être attribué qu’à un collaborateur actif ou en onboarding.',
        variant: 'destructive',
      });

      return;
    }

    const selectedRole =
      roles.find(
        (role) =>
          role.id === selectedRoleId,
      );

    if (
      !selectedRole ||
      !roleMatchesEmployee(
        selectedRole,
        selectedEmployee,
      )
    ) {
      toast({
        title:
          'Rôle non autorisé',
        description:
          'Ce rôle ne correspond pas au périmètre métier du collaborateur.',
        variant: 'destructive',
      });

      return;
    }

    if (!user?.id) {
      toast({
        title:
          'Session introuvable',
        description:
          'Impossible d’identifier le collaborateur RH qui effectue cette modification.',
        variant: 'destructive',
      });

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
              assigned_by: user.id,
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


  /* ==========================================================
     OUVERTURE PORTEFEUILLE
  ========================================================== */

  const openPortfolioDialog = (
    employeeId: string,
  ) => {
    const employee = employees.find(
      (item: any) =>
        item.id === employeeId,
    );

    if (!employee) {
      return;
    }

    setSelectedEmployeeId(
      employeeId,
    );

    setSelectedPortfolioId('');

    setPortfolioDialogOpen(true);
  };


  /* ==========================================================
     ENREGISTREMENT PORTEFEUILLE
  ========================================================== */

  const handleSavePortfolio = async () => {
    if (
      !selectedEmployee ||
      !selectedPortfolioId
    ) {
      return;
    }

    if (
      !canReceiveNewAccess(
        selectedEmployee,
      )
    ) {
      toast({
        title:
          'Affectation impossible',
        description:
          'Un portefeuille ne peut être attribué qu’à un collaborateur actif ou en onboarding.',
        variant: 'destructive',
      });

      return;
    }

    const selectedPortfolio =
      businessPortfolios.find(
        (portfolio) =>
          portfolio.id ===
          selectedPortfolioId,
      );

    if (
      !selectedPortfolio ||
      !portfolioMatchesEmployee(
        selectedPortfolio,
        selectedEmployee,
      )
    ) {
      toast({
        title:
          'Portefeuille non autorisé',
        description:
          'Ce portefeuille ne correspond pas au périmètre métier du collaborateur.',
        variant: 'destructive',
      });

      return;
    }

    if (!user?.id) {
      toast({
        title:
          'Session introuvable',
        description:
          'Impossible d’identifier le collaborateur RH qui effectue cette modification.',
        variant: 'destructive',
      });

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
        variant: 'destructive',
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

            assigned_by: user.id,

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

      setPortfolioDialogOpen(
        false,
      );
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


  /* ==========================================================
     RÉVOCATION RÔLE
  ========================================================== */

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
          `Le rôle ${
            assignment.role?.label ??
            ''
          } a été révoqué.`,
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


  /* ==========================================================
     RÉVOCATION PORTEFEUILLE
  ========================================================== */

  const revokePortfolio = async (
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
        variant: 'destructive',
      });
    }
  };


  /* ==========================================================
     RENDER
  ========================================================== */

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
            Gestion RH des affectations d’accès des
            collaborateurs : rôle métier, périmètre et
            portefeuille autorisé.
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
                {employees.filter(
                  (employee: any) =>
                    employee.hr_status ===
                    'active',
                ).length}
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
                  setSearch(
                    event.target.value,
                  )
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

                {poleOptions.map(
                  (pole) => (
                    <SelectItem
                      key={pole}
                      value={pole}
                    >
                      {pole}
                    </SelectItem>
                  ),
                )}
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

                <SelectItem value="leave">
                  En congé
                </SelectItem>

                <SelectItem value="suspended">
                  Suspendus
                </SelectItem>

                <SelectItem value="leaving">
                  Départ
                </SelectItem>

                <SelectItem value="archived">
                  Archivés
                </SelectItem>
              </SelectContent>
            </Select>

          </div>
        </CardContent>
      </Card>


      {/* ======================================================
          TABLE COLLABORATEURS
      ====================================================== */}

      <Card>
        <CardHeader>
          <CardTitle>
            Affectations des collaborateurs
          </CardTitle>

          <CardDescription>
            Sélectionnez un collaborateur pour gérer son rôle
            d’accès et ses périmètres métier.
          </CardDescription>
        </CardHeader>

        <CardContent className="overflow-x-auto">

          {employeesLoading ||
          assignmentsLoading ||
          portfolioAssignmentsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-3 h-8 w-8 text-muted-foreground" />

              <p className="font-medium">
                Aucun collaborateur trouvé
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Modifiez les critères de recherche ou de filtrage.
              </p>
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
                    Rôle d’accès
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

                    const canAssign =
                      canReceiveNewAccess(
                        employee,
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
                              .slice(0, 2)
                              .map(
                                (
                                  pole: string,
                                ) => (
                                  <Badge
                                    key={pole}
                                    variant="outline"
                                  >
                                    {pole}
                                  </Badge>
                                ),
                              )}

                            {(employee.poles ?? [])
                              .length > 2 && (
                              <Badge variant="secondary">
                                +
                                {employee.poles.length -
                                  2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>


                        <TableCell>
                          <span className="text-sm">
                            {employee.position ??
                              '—'}
                          </span>
                        </TableCell>


                        <TableCell>
                          {roleAssignment ? (
                            <div className="space-y-1">
                              <Badge>
                                {roleAssignment.role
                                  ?.label ??
                                  'Rôle'}
                              </Badge>

                              {roleAssignment.scope && (
                                <div className="text-xs text-muted-foreground">
                                  {
                                    roleAssignment.scope
                                      .label
                                  }
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Aucun rôle
                            </span>
                          )}
                        </TableCell>


                        <TableCell>
                          {employeePortfolios.length ===
                          0 ? (
                            <span className="text-sm text-muted-foreground">
                              Aucun
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {employeePortfolios
                                .slice(0, 2)
                                .map(
                                  (
                                    assignment,
                                  ) => (
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
                                2 && (
                                <Badge variant="outline">
                                  +
                                  {employeePortfolios.length -
                                    2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </TableCell>


                        <TableCell>
                          <Badge
                            variant={
                              employee.hr_status ===
                              'active'
                                ? 'default'
                                : employee.hr_status ===
                                    'onboarding'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {employee.hr_status ??
                              '—'}
                          </Badge>
                        </TableCell>


                        <TableCell>
                          <div className="flex justify-end gap-2">

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                openRoleDialog(
                                  employee.id,
                                )
                              }
                            >
                              <UserCog className="mr-2 h-4 w-4" />
                              Rôle
                            </Button>


                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                openPortfolioDialog(
                                  employee.id,
                                )
                              }
                            >
                              <Briefcase className="mr-2 h-4 w-4" />
                              Portefeuille
                            </Button>

                          </div>

                          {!canAssign && (
                            <p className="mt-1 text-right text-[11px] text-muted-foreground">
                              Affectations désactivées
                            </p>
                          )}
                        </TableCell>

                      </TableRow>
                    );
                  },
                )}

              </TableBody>
            </Table>
          )}

        </CardContent>
      </Card>


      {/* ======================================================
          DIALOGUE RÔLE
      ====================================================== */}

      <Dialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
      >
        <DialogContent className="sm:max-w-lg">

          <DialogHeader>
            <DialogTitle>
              Affecter un rôle d’accès
            </DialogTitle>

            <DialogDescription>
              {selectedEmployee
                ? `Gestion du rôle d’accès de ${getEmployeeName(
                    selectedEmployee,
                  )}.`
                : 'Sélection du rôle d’accès.'}
            </DialogDescription>
          </DialogHeader>


          {selectedEmployee &&
            !canReceiveNewAccess(
              selectedEmployee,
            ) && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
                <p className="font-medium">
                  Affectation désactivée
                </p>

                <p className="mt-1 text-muted-foreground">
                  Le collaborateur n’est ni actif ni en onboarding.
                  Une nouvelle affectation ne peut donc pas être créée.
                  Une affectation existante peut toutefois être révoquée.
                </p>
              </div>
            )}


          <div className="space-y-5 py-4">

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Rôle métier d’accès
              </label>

              <Select
                value={selectedRoleId}
                onValueChange={
                  setSelectedRoleId
                }
                disabled={
                  !selectedEmployee ||
                  !canReceiveNewAccess(
                    selectedEmployee,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>

                <SelectContent>
                  {rolesLoading ? (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement…
                    </div>
                  ) : availableRoles.length ===
                    0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Aucun rôle compatible avec ce collaborateur
                    </div>
                  ) : (
                    availableRoles.map(
                      (role) => (
                        <SelectItem
                          key={role.id}
                          value={role.id}
                        >
                          {role.label}
                        </SelectItem>
                      ),
                    )
                  )}
                </SelectContent>
              </Select>

              <p className="text-xs text-muted-foreground">
                Seuls les rôles compatibles avec les pôles du
                collaborateur sont proposés.
              </p>
            </div>


            <div className="space-y-2">
              <label className="text-sm font-medium">
                Périmètre du rôle
              </label>

              <Select
                value={selectedScopeId}
                onValueChange={
                  setSelectedScopeId
                }
                disabled={
                  !selectedEmployee ||
                  !canReceiveNewAccess(
                    selectedEmployee,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un périmètre" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="none">
                    Aucun périmètre spécifique
                  </SelectItem>

                  {scopes.map(
                    (scope) => (
                      <SelectItem
                        key={scope.id}
                        value={scope.id}
                      >
                        {scope.label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>

              <p className="text-xs text-muted-foreground">
                Le périmètre définit la portée fonctionnelle du rôle.
                Les portefeuilles métier sont gérés séparément.
              </p>
            </div>

          </div>


          <DialogFooter>

            {selectedEmployeeAssignments.some(
              (assignment) =>
                assignment.status ===
                'active',
            ) && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  const current =
                    selectedEmployeeAssignments.find(
                      (assignment) =>
                        assignment.status ===
                        'active',
                    );

                  if (current) {
                    void revokeRole(
                      current,
                    );

                    setRoleDialogOpen(
                      false,
                    );
                  }
                }}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Révoquer
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setRoleDialogOpen(false)
              }
            >
              Annuler
            </Button>

            <Button
              type="button"
              onClick={() =>
                void handleSaveRole()
              }
              disabled={
                saving ||
                !selectedRoleId ||
                !user?.id ||
                !selectedEmployee ||
                !canReceiveNewAccess(
                  selectedEmployee,
                )
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
          DIALOGUE PORTEFEUILLE
      ====================================================== */}

      <Dialog
        open={portfolioDialogOpen}
        onOpenChange={
          setPortfolioDialogOpen
        }
      >
        <DialogContent className="sm:max-w-lg">

          <DialogHeader>
            <DialogTitle>
              Affecter un portefeuille
            </DialogTitle>

            <DialogDescription>
              {selectedEmployee
                ? `Choisissez le portefeuille métier autorisé pour ${getEmployeeName(
                    selectedEmployee,
                  )}.`
                : 'Sélection du portefeuille.'}
            </DialogDescription>
          </DialogHeader>


          {selectedEmployee &&
            !canReceiveNewAccess(
              selectedEmployee,
            ) && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
                <p className="font-medium">
                  Affectation désactivée
                </p>

                <p className="mt-1 text-muted-foreground">
                  Un portefeuille ne peut être attribué qu’à un
                  collaborateur actif ou en onboarding.
                </p>
              </div>
            )}


          <div className="space-y-5 py-4">

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <Briefcase className="mt-0.5 h-5 w-5 text-muted-foreground" />

                <div>
                  <p className="font-medium">
                    Portefeuille métier
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Le portefeuille ne crée pas un nouveau rôle.
                    Il limite les ressources métier auxquelles le
                    collaborateur peut accéder.
                  </p>
                </div>
              </div>
            </div>


            <div className="space-y-2">
              <label className="text-sm font-medium">
                Portefeuille
              </label>

              <Select
                value={selectedPortfolioId}
                onValueChange={
                  setSelectedPortfolioId
                }
                disabled={
                  !selectedEmployee ||
                  !canReceiveNewAccess(
                    selectedEmployee,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un portefeuille" />
                </SelectTrigger>

                <SelectContent>
                  {portfoliosLoading ? (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement…
                    </div>
                  ) : availablePortfolios.length ===
                    0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Aucun portefeuille autorisé pour ce collaborateur.
                    </div>
                  ) : (
                    availablePortfolios.map(
                      (portfolio) => (
                        <SelectItem
                          key={portfolio.id}
                          value={portfolio.id}
                        >
                          {portfolio.label_snapshot ??
                            'Portefeuille'}
                          {' — '}
                          {portfolio
                            .portfolio_type
                            ?.label ??
                            'Métier'}
                        </SelectItem>
                      ),
                    )
                  )}
                </SelectContent>
              </Select>

              <p className="text-xs text-muted-foreground">
                Les portefeuilles sont filtrés selon le pôle,
                le poste et le type de portefeuille.
              </p>
            </div>


            {selectedEmployeePortfolioAssignments.length >
              0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Portefeuilles déjà affectés
                </p>

                <div className="space-y-2">
                  {selectedEmployeePortfolioAssignments.map(
                    (assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between rounded-md border p-3"
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
                              'Portefeuille métier'}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            void revokePortfolio(
                              assignment,
                            );
                          }}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Révoquer
                        </Button>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

          </div>


          <DialogFooter>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setPortfolioDialogOpen(
                  false,
                )
              }
            >
              Annuler
            </Button>

            <Button
              type="button"
              onClick={() =>
                void handleSavePortfolio()
              }
              disabled={
                saving ||
                !selectedPortfolioId ||
                !user?.id ||
                !selectedEmployee ||
                !canReceiveNewAccess(
                  selectedEmployee,
                )
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

    </div>
  );
};


export default RHAccess;