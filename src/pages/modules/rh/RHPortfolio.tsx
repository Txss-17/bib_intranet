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

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  poles: string[] | null;
  position: string | null;
  seniority: string | null;
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

type BusinessPortfolio = {
  id: string;
  portfolio_type_id: string;
  source_id: string;
  label_snapshot: string | null;
  status: string | null;
};

type PortfolioType = {
  id: string;
  portfolio_type_key: string;
  label: string;
  business_pole: string;
  source_table: string;
  status: string | null;
};

type PortfolioAssignment = {
  id: string;
  employee_id: string;
  portfolio_id: string;
  access_assignment_id: string | null;
  assignment_status: string | null;
  starts_at: string | null;
  ends_at: string | null;
  reason: string | null;
};

type PortfolioRow = {
  assignment: PortfolioAssignment;
  profile: Profile | undefined;
  portfolio: BusinessPortfolio | undefined;
  portfolioType: PortfolioType | undefined;
};

function getProfileName(profile: Profile | undefined) {
  if (!profile) {
    return 'Collaborateur inconnu';
  }

  const fullName = [
    profile.first_name,
    profile.last_name,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || profile.email || 'Collaborateur';
}

function getProfilePole(profile: Profile | undefined) {
  if (!profile?.poles?.length) {
    return '—';
  }

  return profile.poles.join(', ');
}

export default function RHPortfolio() {
  const { data, isLoading } = useQuery({
    queryKey: ['rh-access-portfolio'],

    queryFn: async () => {
      const [
        profilesResult,
        assignmentsResult,
        rolesResult,
        scopesResult,
        portfolioTypesResult,
        portfoliosResult,
        portfolioAssignmentsResult,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            `
              id,
              first_name,
              last_name,
              email,
              poles,
              position,
              seniority
            `,
          )
          .order('last_name'),

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

        supabase
          .from('access_portfolio_types' as any)
          .select(
            `
              id,
              portfolio_type_key,
              label,
              business_pole,
              source_table,
              status
            `,
          ),

        supabase
          .from('access_business_portfolios' as any)
          .select(
            `
              id,
              portfolio_type_id,
              source_id,
              label_snapshot,
              status
            `,
          ),

        supabase
          .from('access_portfolio_assignments' as any)
          .select(
            `
              id,
              employee_id,
              portfolio_id,
              access_assignment_id,
              assignment_status,
              starts_at,
              ends_at,
              reason
            `,
          ),
      ]);

      if (profilesResult.error) {
        throw profilesResult.error;
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

      if (portfolioTypesResult.error) {
        throw portfolioTypesResult.error;
      }

      if (portfoliosResult.error) {
        throw portfoliosResult.error;
      }

      if (portfolioAssignmentsResult.error) {
        throw portfolioAssignmentsResult.error;
      }

      return {
        profiles: (profilesResult.data ?? []) as Profile[],

        assignments:
          (assignmentsResult.data ?? []) as AccessAssignment[],

        roles:
          (rolesResult.data ?? []) as AccessRole[],

        scopes:
          (scopesResult.data ?? []) as AccessScope[],

        portfolioTypes:
          (portfolioTypesResult.data ?? []) as PortfolioType[],

        portfolios:
          (portfoliosResult.data ?? []) as BusinessPortfolio[],

        portfolioAssignments:
          (portfolioAssignmentsResult.data ??
            []) as PortfolioAssignment[],
      };
    },
  });

  const profiles = data?.profiles ?? [];
  const assignments = data?.assignments ?? [];
  const roles = data?.roles ?? [];
  const scopes = data?.scopes ?? [];
  const portfolioTypes = data?.portfolioTypes ?? [];
  const portfolios = data?.portfolios ?? [];
  const portfolioAssignments =
    data?.portfolioAssignments ?? [];

  const profileById = useMemo(
    () =>
      new Map(
        profiles.map((profile) => [
          profile.id,
          profile,
        ]),
      ),
    [profiles],
  );

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

  const portfolioById = useMemo(
    () =>
      new Map(
        portfolios.map((portfolio) => [
          portfolio.id,
          portfolio,
        ]),
      ),
    [portfolios],
  );

  const portfolioTypeById = useMemo(
    () =>
      new Map(
        portfolioTypes.map((portfolioType) => [
          portfolioType.id,
          portfolioType,
        ]),
      ),
    [portfolioTypes],
  );

  const activeAssignments = assignments.filter(
    (assignment) =>
      assignment.status === 'active',
  );

  const activePortfolioAssignments =
    portfolioAssignments.filter(
      (assignment) =>
        assignment.assignment_status === 'active',
    );

  const coveredEmployees = new Set(
    activeAssignments.map(
      (assignment) =>
        assignment.employee_id,
    ),
  );

  const coveredPortfolioEmployees =
    new Set(
      activePortfolioAssignments.map(
        (assignment) =>
          assignment.employee_id,
      ),
    );

  const rhProfiles = profiles.filter((profile) =>
    profile.poles?.some(
      (pole) =>
        pole.toLowerCase() === 'rh',
    ),
  );

  const portfolioRows: PortfolioRow[] =
    activePortfolioAssignments
      .map((assignment) => {
        const portfolio =
          portfolioById.get(
            assignment.portfolio_id,
          );

        return {
          assignment,
          profile: profileById.get(
            assignment.employee_id,
          ),
          portfolio,
          portfolioType: portfolio
            ? portfolioTypeById.get(
                portfolio.portfolio_type_id,
              )
            : undefined,
        };
      })
      .filter(
        (row) =>
          Boolean(row.profile) &&
          Boolean(row.portfolio),
      );

  const activePortfolioCount =
    new Set(
      activePortfolioAssignments.map(
        (assignment) =>
          assignment.portfolio_id,
      ),
    ).size;

  const activePortfolioTypes =
    new Set(
      activePortfolioAssignments
        .map((assignment) => {
          const portfolio =
            portfolioById.get(
              assignment.portfolio_id,
            );

          return portfolio
            ? portfolio.portfolio_type_id
            : null;
        })
        .filter(Boolean),
    ).size;

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
          Administration des périmètres et des
          affectations de portefeuille des
          collaborateurs.
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          Le rôle définit ce qu’un collaborateur peut
          faire. Le portefeuille définit sur quelles
          ressources métier il peut le faire.
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
              {rhProfiles.length}
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
              Collaborateurs avec rôle actif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Briefcase className="h-5 w-5 text-primary" />

            <p className="mt-2 text-2xl font-bold">
              {activePortfolioCount}
            </p>

            <p className="text-xs text-muted-foreground">
              Portefeuilles actifs attribués
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Globe2 className="h-5 w-5 text-primary" />

            <p className="mt-2 text-2xl font-bold">
              {activePortfolioTypes}
            </p>

            <p className="text-xs text-muted-foreground">
              Types de portefeuille utilisés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================
          AFFECTATIONS RBAC
          ============================================================ */}

      <Card>
        <CardHeader>
          <CardTitle>
            Affectations RBAC
          </CardTitle>

          <CardDescription>
            Rôles et périmètres d’accès administrés
            pour les collaborateurs.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {activeAssignments.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />

              <p className="mt-3 font-medium">
                Aucune affectation RBAC active
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Les rôles et périmètres apparaîtront
                ici lorsqu’ils seront enregistrés.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeAssignments.map(
                (assignment) => {
                  const profile =
                    profileById.get(
                      assignment.employee_id,
                    );

                  const role =
                    roleById.get(
                      assignment.role_id,
                    );

                  const scope =
                    assignment.scope_id
                      ? scopeById.get(
                          assignment.scope_id,
                        )
                      : undefined;

                  return (
                    <div
                      key={assignment.id}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-medium">
                            {getProfileName(
                              profile,
                            )}
                          </p>

                          <p className="text-sm text-muted-foreground">
                            {profile?.email ??
                              '—'}
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
                          {getProfilePole(
                            profile,
                          )}
                        </span>

                        <span>
                          Fonction :{' '}
                          {profile?.position ||
                            '—'}
                        </span>

                        <span>
                          Rôle :{' '}
                          {role?.role_key ??
                            assignment.role_id}
                        </span>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================
          PORTEFEUILLES MÉTIER
          ============================================================ */}

      <Card>
        <CardHeader>
          <CardTitle>
            Portefeuilles métier
          </CardTitle>

          <CardDescription>
            Affectation des collaborateurs aux
            portefeuilles métier transversaux.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {portfolioRows.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Briefcase className="mx-auto h-8 w-8 text-muted-foreground" />

              <p className="mt-3 font-medium">
                Aucun portefeuille attribué
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Les affectations de portefeuille
                apparaîtront ici lorsqu’elles seront
                enregistrées.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {portfolioRows.map(
                ({
                  assignment,
                  profile,
                  portfolio,
                  portfolioType,
                }) => (
                  <div
                    key={assignment.id}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium">
                          {getProfileName(
                            profile,
                          )}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          {profile?.email ??
                            '—'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {portfolioType?.label ??
                            'Portefeuille'}
                        </Badge>

                        <Badge variant="outline">
                          {portfolio?.label_snapshot ??
                            'Sans nom'}
                        </Badge>

                        <Badge>
                          {assignment.assignment_status ??
                            'active'}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                      <span>
                        Pôle :{' '}
                        {portfolioType
                          ?.business_pole ||
                          '—'}
                      </span>

                      <span>
                        Type :{' '}
                        {portfolioType
                          ?.portfolio_type_key ||
                          '—'}
                      </span>

                      <span>
                        Fonction :{' '}
                        {profile?.position ||
                          '—'}
                      </span>
                    </div>

                    {assignment.reason && (
                      <div className="mt-3 rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Motif :
                        </span>{' '}
                        {assignment.reason}
                      </div>
                    )}
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
            Un même moteur technique, des portefeuilles
            métier propres à chaque pôle.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">
              RH
            </span>{' '}
            — administration des collaborateurs,
            rôles, périmètres et affectations.
          </div>

          <div>
            <span className="font-medium text-foreground">
              Fournisseurs
            </span>{' '}
            — portefeuilles regroupant les fournisseurs
            suivis par les collaborateurs.
          </div>

          <div>
            <span className="font-medium text-foreground">
              Marketplace
            </span>{' '}
            — portefeuilles regroupant les marchands
            et leurs boutiques.
          </div>

          <div>
            <span className="font-medium text-foreground">
              Autres pôles
            </span>{' '}
            — même moteur lorsque l’activité nécessite
            l’attribution d’un ensemble de ressources.
          </div>

          <div className="rounded-lg bg-muted/40 p-3">
            <strong className="text-foreground">
              Principe :
            </strong>{' '}
            le rôle définit les actions autorisées ;
            le portefeuille limite ces actions aux
            ressources attribuées.
          </div>

          <div className="rounded-lg border p-3">
            <strong className="text-foreground">
              Identité :
            </strong>{' '}
            les collaborateurs sont identifiés par{' '}
            <code>profiles.id</code>, aligné sur{' '}
            <code>auth.users.id</code>. L’ancien modèle{' '}
            <code>employees</code> n’est plus utilisé
            par cette interface.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
