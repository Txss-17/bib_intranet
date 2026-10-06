import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  Globe2,
  Loader2,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

type Employee = {
  id: string;
  name: string;
  email: string;
  pole: string | null;
  position: string | null;
  status: string | null;
};

type AccessAssignment = {
  id: string;
  employee_id: string;
  role_id: string;
  scope_id: string | null;
  scope_value: string | null;
  status: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

type AccessRole = {
  id: string;
  role_key: string;
  label: string;
  department: string | null;
  business_pole: string | null;
  status: string | null;
};

type AccessScope = {
  id: string;
  scope_key: string;
  label: string;
  scope_type: string;
  description: string | null;
};

export default function RHPortfolio() {
  const { data, isLoading } = useQuery({
    queryKey: ['rh-access-portfolio'],

    queryFn: async () => {
      const [
        employeesResult,
        assignmentsResult,
        rolesResult,
        scopesResult,
      ] = await Promise.all([
        supabase
          .from('employees')
          .select(
            'id, name, email, pole, position, status',
          )
          .order('name'),

        supabase
          .from('access_assignments' as any)
          .select(
            `
              id,
              employee_id,
              role_id,
              scope_id,
              scope_value,
              status,
              starts_at,
              ends_at
            `,
          ),

        supabase
          .from('access_roles' as any)
          .select(
            `
              id,
              role_key,
              label,
              department,
              business_pole,
              status
            `,
          ),

        supabase
          .from('access_scopes' as any)
          .select(
            `
              id,
              scope_key,
              label,
              scope_type,
              description
            `,
          ),
      ]);

      if (employeesResult.error) {
        throw employeesResult.error;
      }

      if (assignmentsResult.error) {
        throw assignmentsResult.error;
      }

      if (rolesResult.error) {
        throw rolesResult.error;
      }

      if (scopesResult.error) {
        throw scopesResult.error;
      }

      return {
        employees: (employeesResult.data ?? []) as Employee[],
        assignments:
          (assignmentsResult.data ?? []) as AccessAssignment[],
        roles: (rolesResult.data ?? []) as AccessRole[],
        scopes: (scopesResult.data ?? []) as AccessScope[],
      };
    },
  });

  const employees = data?.employees ?? [];
  const assignments = data?.assignments ?? [];
  const roles = data?.roles ?? [];
  const scopes = data?.scopes ?? [];

  const roleById = useMemo(
    () =>
      new Map(
        roles.map((role) => [
          role.id,
          role,
        ]),
      ),
    [roles],
  );

  const scopeById = useMemo(
    () =>
      new Map(
        scopes.map((scope) => [
          scope.id,
          scope,
        ]),
      ),
    [scopes],
  );

  const employeeById = useMemo(
    () =>
      new Map(
        employees.map((employee) => [
          employee.id,
          employee,
        ]),
      ),
    [employees],
  );

  const activeAssignments = assignments.filter(
    (assignment) =>
      assignment.status === 'active',
  );

  const coveredEmployees = new Set(
    activeAssignments.map(
      (assignment) =>
        assignment.employee_id,
    ),
  );

  const rhEmployees = employees.filter(
    (employee) =>
      employee.pole?.toLowerCase() === 'rh',
  );

  const portfolioRows = activeAssignments
    .map((assignment) => ({
      assignment,
      employee: employeeById.get(
        assignment.employee_id,
      ),
      role: roleById.get(
        assignment.role_id,
      ),
      scope: assignment.scope_id
        ? scopeById.get(
            assignment.scope_id,
          )
        : undefined,
    }))
    .filter(
      (row) =>
        row.employee,
    );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ============================================================
          HEADER
          ============================================================ */}

      <div>
        <div className="flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-primary" />

          <h1 className="text-3xl font-bold">
            Portefeuille RH
          </h1>
        </div>

        <p className="mt-2 text-muted-foreground">
          Gestion des périmètres d’accès attribués
          aux collaborateurs.
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          Le portefeuille limite les ressources
          accessibles. Il n’accorde pas, à lui seul,
          les permissions.
        </p>
      </div>

      {/* ============================================================
          KPIs
          ============================================================ */}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <Users className="h-5 w-5 text-primary" />

            <p className="mt-2 text-2xl font-bold">
              {rhEmployees.length}
            </p>

            <p className="text-xs text-muted-foreground">
              Collaborateurs RH
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <UserCog className="h-5 w-5 text-primary" />

            <p className="mt-2 text-2xl font-bold">
              {coveredEmployees.size}
            </p>

            <p className="text-xs text-muted-foreground">
              Collaborateurs avec affectation active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <ShieldCheck className="h-5 w-5 text-primary" />

            <p className="mt-2 text-2xl font-bold">
              {
                new Set(
                  activeAssignments.map(
                    (assignment) =>
                      assignment.role_id,
                  ),
                ).size
              }
            </p>

            <p className="text-xs text-muted-foreground">
              Rôles actifs utilisés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Globe2 className="h-5 w-5 text-primary" />

            <p className="mt-2 text-2xl font-bold">
              {
                new Set(
                  activeAssignments
                    .map(
                      (assignment) =>
                        assignment.scope_id,
                    )
                    .filter(Boolean),
                ).size
              }
            </p>

            <p className="text-xs text-muted-foreground">
              Périmètres actifs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================
          AFFECTATIONS
          ============================================================ */}

      <Card>
        <CardHeader>
          <CardTitle>
            Affectations de portefeuille
          </CardTitle>

          <CardDescription>
            Vue administrative des couples rôle +
            périmètre attribués aux collaborateurs.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {portfolioRows.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Briefcase className="mx-auto h-8 w-8 text-muted-foreground" />

              <p className="mt-3 font-medium">
                Aucune affectation active
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Les affectations apparaîtront ici
                lorsque les rôles et périmètres seront
                enregistrés dans le système RBAC.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {portfolioRows.map(
                ({
                  assignment,
                  employee,
                  role,
                  scope,
                }) => (
                  <div
                    key={assignment.id}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium">
                          {employee?.name}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          {employee?.email}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {role?.label ??
                            assignment.role_id}
                        </Badge>

                        <Badge variant="outline">
                          {scope?.label ??
                            assignment.scope_value ??
                            'Global'}
                        </Badge>

                        <Badge>
                          {assignment.status ??
                            'active'}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                      <span>
                        Pôle :{' '}
                        {employee?.pole || '—'}
                      </span>

                      <span>
                        Type :{' '}
                        {scope?.scope_type || '—'}
                      </span>

                      <span>
                        Rôle :{' '}
                        {role?.role_key ??
                          assignment.role_id}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================
          MODÈLE TRANSVERSAL
          ============================================================ */}

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>
            Modèle transversal
          </CardTitle>

          <CardDescription>
            Le même principe de portefeuille sera
            utilisé dans les différents pôles.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">
              RH
            </span>{' '}
            — périmètres d’accès des collaborateurs.
          </div>

          <div>
            <span className="font-medium text-foreground">
              Fournisseurs
            </span>{' '}
            — portefeuilles de fournisseurs attribués
            aux collaborateurs.
          </div>

          <div>
            <span className="font-medium text-foreground">
              Marketplace
            </span>{' '}
            — portefeuilles de marchands et boutiques.
          </div>

          <div>
            <span className="font-medium text-foreground">
              Autres pôles
            </span>{' '}
            — même moteur lorsque le métier nécessite
            une affectation à un ensemble de ressources.
          </div>

          <div className="rounded-lg bg-muted/40 p-3">
            <strong className="text-foreground">
              Règle :
            </strong>{' '}
            le rôle définit ce que le collaborateur
            peut faire ; le portefeuille définit sur
            quelles ressources il peut le faire.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
