import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  Loader2,
  ShieldCheck,
  UserCog,
  Users,
  Layers3,
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

type PortfolioAssignmentRow = {
  assignment: PortfolioAssignment;
  profile: Profile | undefined;
  portfolio: BusinessPortfolio | undefined;
  portfolioType: PortfolioType | undefined;
  role: AccessRole | undefined;
};

function getProfileName(
  profile: Profile | undefined,
) {
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

  return (
    fullName ||
    profile.email ||
    'Collaborateur'
  );
}

function isActiveStatus(
  status: string | null | undefined,
) {
  return status === 'active';
}

function getPoleLabel(
  profile: Profile | undefined,
) {
  if (!profile?.poles?.length) {
    return '—';
  }

  return profile.poles.join(', ');
}

export default function RHPortfolio() {
  const { data, isLoading } = useQuery({
    queryKey: ['rh-portfolio-administration'],

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

        (supabase as any)
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

        (supabase as any)
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

        (supabase as any)
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

        (supabase as any)
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

        (supabase as any)
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

        (supabase as any)
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
        profiles:
          (profilesResult.data ??
            []) as Profile[],

        assignments:
          (assignmentsResult.data ??
            []) as AccessAssignment[],

        roles:
          (rolesResult.data ??
            []) as AccessRole[],

        scopes:
          (scopesResult.data ??
            []) as AccessScope[],

        portfolioTypes:
          (portfolioTypesResult.data ??
            []) as PortfolioType[],

        portfolios:
          (portfoliosResult.data ??
            []) as BusinessPortfolio[],

        portfolioAssignments:
          (portfolioAssignmentsResult.data ??
            []) as PortfolioAssignment[],
      };
    },
  });

  const profiles = data?.profiles ?? [];
  const assignments =
    data?.assignments ?? [];
  const roles = data?.roles ?? [];
  const scopes = data?.scopes ?? [];
  const portfolioTypes =
    data?.portfolioTypes ?? [];
  const portfolios =
    data?.portfolios ?? [];
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
        portfolioTypes.map(
          (portfolioType) => [
            portfolioType.id,
            portfolioType,
          ],
        ),
      ),
    [portfolioTypes],
  );

  /*
   * RH ne possède pas ici un nouveau type de
   * portefeuille métier.
   *
   * Cette page administre :
   * - les collaborateurs ;
   * - leurs rôles ;
   * - leurs scopes ;
   * - les affectations de portefeuille qui
   *   découlent de ces droits.
   *
   * Les portefeuilles restent propriétaires
   * de leur pôle métier source.
   */

  const activeAssignments =
    assignments.filter((assignment) =>
      isActiveStatus(assignment.status),
    );

  const activePortfolioAssignments =
    portfolioAssignments.filter(
      (assignment) =>
        isActiveStatus(
          assignment.assignment_status,
        ),
    );

  const activeProfiles = profiles.filter(
    (profile) => {
      const hasActiveAssignment =
        activeAssignments.some(
          (assignment) =>
            assignment.employee_id ===
            profile.id,
        );

      return hasActiveAssignment;
    },
  );

  const rhProfiles = profiles.filter(
    (profile) =>
      profile.poles?.some(
        (pole) =>
          pole.toLowerCase() === 'rh',
      ),
  );

  /*
   * On ne compte comme portefeuille RH que
   * les affectations effectivement reliées à
   * un rôle RH.
   *
   * Une affectation Marketplace ou Fournisseur
   * n'est donc pas transformée artificiellement
   * en portefeuille RH.
   */
  const rhRoleIds = useMemo(
    () =>
      new Set(
        roles
          .filter(
            (role) =>
              role.business_pole
                ?.toLowerCase() === 'rh' ||
              role.department
                ?.toLowerCase() === 'rh',
          )
          .map((role) => role.id),
      ),
    [roles],
  );

  const rhAccessAssignmentIds =
    useMemo(
      () =>
        new Set(
          activeAssignments
            .filter((assignment) =>
              rhRoleIds.has(
                assignment.role_id,
              ),
            )
            .map(
              (assignment) =>
                assignment.id,
            ),
        ),
      [
        activeAssignments,
        rhRoleIds,
      ],
    );

  const rhPortfolioAssignments =
    activePortfolioAssignments.filter(
      (assignment) =>
        assignment.access_assignment_id &&
        rhAccessAssignmentIds.has(
          assignment.access_assignment_id,
        ),
    );

  const portfolioRows: PortfolioAssignmentRow[] =
    rhPortfolioAssignments
      .map((assignment) => {
        const portfolio =
          portfolioById.get(
            assignment.portfolio_id,
          );

        const profile =
          profileById.get(
            assignment.employee_id,
          );

        const portfolioType =
          portfolio
            ? portfolioTypeById.get(
                portfolio.portfolio_type_id,
              )
            : undefined;

        const accessAssignment =
          assignment.access_assignment_id
            ? assignments.find(
                (candidate) =>
                  candidate.id ===
                  assignment.access_assignment_id,
              )
            : undefined;

        const role =
          accessAssignment
            ? roleById.get(
                accessAssignment.role_id,
              )
            : undefined;

        return {
          assignment,
          profile,
          portfolio,
          portfolioType,
          role,
        };
      })
      .filter(
        (row) =>
          Boolean(row.profile) &&
          Boolean(row.portfolio),
      );

  const activeRolesCount =
    new Set(
      activeAssignments.map(
        (assignment) =>
          assignment.role_id,
      ),
    ).size;

  const activeScopesCount =
    new Set(
      activeAssignments
        .map(
          (assignment) =>
            assignment.scope_id,
        )
        .filter(Boolean),
    ).size;

  const assignedRhCollaborators =
    new Set(
      portfolioRows.map(
        (row) =>
          row.assignment.employee_id,
      ),
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
      {/* HEADER */}

      <div>
        <div className="flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-primary" />

          <div>
            <h1 className="text-3xl font-bold">
              Portefeuille RH
            </h1>

            <p className="mt-1 text-muted-foreground">
              Administration des collaborateurs,
              rôles, périmètres et affectations RH.
            </p>
          </div>
        </div>

        <p className="mt-2 max-w-4xl text-sm text-muted-foreground">
          Le pôle RH administre les personnes et
          leurs droits. Les portefeuilles métier
          restent rattachés à leur pôle propriétaire.
        </p>
      </div>

      {/* KPIs */}

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
              {activeProfiles.length}
            </p>

            <p className="text-xs text-muted-foreground">
              Collaborateurs avec accès actif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <ShieldCheck className="h-5 w-5 text-primary" />

            <p className="mt-2 text-2xl font-bold">
              {activeRolesCount}
            </p>

            <p className="text-xs text-muted-foreground">
              Rôles actifs utilisés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Layers3 className="h-5 w-5 text-primary" />

            <p className="mt-2 text-2xl font-bold">
              {activeScopesCount}
            </p>

            <p className="text-xs text-muted-foreground">
              Périmètres d'accès actifs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* COLLABORATEURS RH */}

      <Card>
        <CardHeader>
          <CardTitle>
            Collaborateurs du pôle RH
          </CardTitle>

          <CardDescription>
            Collaborateurs identifiés dans le
            périmètre RH et leurs responsabilités
            d'accès.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {rhProfiles.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground" />

              <p className="mt-3 font-medium">
                Aucun collaborateur RH identifié
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Les profils dont le pôle contient
                « RH » apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rhProfiles.map((profile) => {
                const profileAssignments =
                  activeAssignments.filter(
                    (assignment) =>
                      assignment.employee_id ===
                      profile.id,
                  );

                return (
                  <div
                    key={profile.id}
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
                          {profile.email ??
                            '—'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {profile.position ||
                            'Fonction non définie'}
                        </Badge>

                        <Badge variant="outline">
                          {profile.seniority ||
                            'Ancienneté non définie'}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                      <span>
                        Pôle :{' '}
                        {getPoleLabel(
                          profile,
                        )}
                      </span>

                      <span>
                        Rôles actifs :{' '}
                        {
                          profileAssignments.length
                        }
                      </span>

                      <span>
                        Portefeuilles RH attribués :{' '}
                        {
                          portfolioRows.filter(
                            (row) =>
                              row.assignment
                                .employee_id ===
                              profile.id,
                          ).length
                        }
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AFFECTATIONS RBAC */}

      <Card>
        <CardHeader>
          <CardTitle>
            Affectations RBAC
          </CardTitle>

          <CardDescription>
            Vue RH des rôles et périmètres
            d'autorisation actifs.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {activeAssignments.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />

              <p className="mt-3 font-medium">
                Aucune affectation active
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
                            {profile?.position ||
                              'Fonction non définie'}
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

                          {role?.business_pole && (
                            <Badge variant="outline">
                              {role.business_pole}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                        <span>
                          Clé du rôle :{' '}
                          {role?.role_key ??
                            '—'}
                        </span>

                        <span>
                          Type de scope :{' '}
                          {scope?.scope_type ??
                            '—'}
                        </span>

                        <span>
                          Valeur :{' '}
                          {assignment.scope_value ??
                            '—'}
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

      {/* AFFECTATIONS DE PORTEFEUILLES RH */}

      <Card>
        <CardHeader>
          <CardTitle>
            Affectations de portefeuilles
          </CardTitle>

          <CardDescription>
            Uniquement les portefeuilles reliés à une
            affectation RBAC relevant du périmètre RH.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {portfolioRows.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Briefcase className="mx-auto h-8 w-8 text-muted-foreground" />

              <p className="mt-3 font-medium">
                Aucun portefeuille RH attribué
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Cela ne signifie pas que les
                portefeuilles Marketplace ou Fournisseurs
                n'existent pas. Ils restent gérés dans
                leurs pôles propriétaires.
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
                  role,
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
                          {portfolio?.label_snapshot ??
                            'Portefeuille'}
                        </Badge>

                        <Badge variant="outline">
                          {portfolioType?.label ??
                            'Type non défini'}
                        </Badge>

                        <Badge>
                          {role?.label ??
                            'Rôle non défini'}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                      <span>
                        Pôle propriétaire :{' '}
                        {portfolioType?.business_pole ||
                          '—'}
                      </span>

                      <span>
                        Type :{' '}
                        {portfolioType
                          ?.portfolio_type_key ||
                          '—'}
                      </span>

                      <span>
                        Statut :{' '}
                        {assignment.assignment_status ||
                          'active'}
                      </span>
                    </div>

                    {assignment.reason && (
                      <div className="mt-3 rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
                        <strong className="text-foreground">
                          Motif :
                        </strong>{' '}
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

      {/* RÈGLE D'ARCHITECTURE */}

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>
            Règle d'architecture des portefeuilles
          </CardTitle>

          <CardDescription>
            Séparation entre propriété métier et
            administration RH.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <strong className="text-foreground">
              Marketplace :
            </strong>{' '}
            possède et administre ses portefeuilles
            marchands.
          </div>

          <div>
            <strong className="text-foreground">
              Fournisseurs :
            </strong>{' '}
            possède et administre ses portefeuilles
            fournisseurs.
          </div>

          <div>
            <strong className="text-foreground">
              RH :
            </strong>{' '}
            administre les collaborateurs, rôles,
            périmètres et affectations.
          </div>

          <div>
            <strong className="text-foreground">
              RBAC :
            </strong>{' '}
            constitue la couche transversale permettant
            de relier un collaborateur à un périmètre
            métier sans transférer la propriété de ce
            portefeuille au pôle RH.
          </div>

          <div className="rounded-lg bg-muted/40 p-3">
            <strong className="text-foreground">
              Principe :
            </strong>{' '}
            le rôle détermine ce que le collaborateur
            peut faire ; le scope et le portefeuille
            déterminent où il peut le faire.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
