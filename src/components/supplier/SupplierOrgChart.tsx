import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Crown,
  FolderOpen,
  Loader2,
  BriefcaseBusiness,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const MAX_CAPACITY = 10;

interface SupplierOrgMember {
  id: string;
  name: string;
  role: string;
  categories: string[];
  supplierCount: number;
  capacity: number;
  loadPercentage: number;
}

interface SupplierOrgData {
  leader: {
    id: string;
    name: string;
    role: string;
  } | null;
  members: SupplierOrgMember[];
}

function useSupplierOrg() {
  return useQuery<SupplierOrgData>({
    queryKey: ['supplier_org_chart'],

    queryFn: async () => {
      const [
        profilesResult,
        assignmentsResult,
        portfoliosResult,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'id, first_name, last_name, position, poles',
          ),

        supabase
          .from('portfolio_assignments' as any)
          .select(
            'assigned_to_id, assigned_to_name, supplier_id, portfolio_id',
          ),

        supabase
          .from('supplier_portfolios' as any)
          .select(
            'id, category, responsible_id, responsible_name',
          ),
      ]);

      if (profilesResult.error) {
        throw profilesResult.error;
      }

      if (assignmentsResult.error) {
        throw assignmentsResult.error;
      }

      if (portfoliosResult.error) {
        throw portfoliosResult.error;
      }

      /*
       * Membres du pôle Fournisseurs.
       *
       * On ne considère plus automatiquement le CEO
       * comme membre opérationnel du pôle.
       */
      const supplierProfiles = (
        profilesResult.data ?? []
      ).filter((profile: any) => {
        const poles = Array.isArray(profile.poles)
          ? profile.poles
          : [];

        return (
          poles.includes('supplier') ||
          profile.position === 'supplier_manager'
        );
      });

      /*
       * Charge réelle :
       * nombre de fournisseurs effectivement
       * présents dans portfolio_assignments.
       */
      const assignmentCounts: Record<
        string,
        number
      > = {};

      (
        assignmentsResult.data ?? []
      ).forEach((assignment: any) => {
        if (!assignment.assigned_to_id) {
          return;
        }

        assignmentCounts[
          assignment.assigned_to_id
        ] =
          (assignmentCounts[
            assignment.assigned_to_id
          ] ?? 0) + 1;
      });

      /*
       * Spécialisations réelles :
       * les catégories des portefeuilles dont
       * le collaborateur est responsable.
       */
      const categoriesByPerson: Record<
        string,
        string[]
      > = {};

      (
        portfoliosResult.data ?? []
      ).forEach((portfolio: any) => {
        if (!portfolio.responsible_id) {
          return;
        }

        if (
          !categoriesByPerson[
            portfolio.responsible_id
          ]
        ) {
          categoriesByPerson[
            portfolio.responsible_id
          ] = [];
        }

        const category =
          portfolio.category?.trim();

        if (
          category &&
          !categoriesByPerson[
            portfolio.responsible_id
          ].includes(category)
        ) {
          categoriesByPerson[
            portfolio.responsible_id
          ].push(category);
        }
      });

      /*
       * Responsable du pôle.
       *
       * Priorité au supplier_manager.
       * Si plusieurs profils existent, on prend
       * le premier responsable opérationnel.
       */
      const leader =
        supplierProfiles.find(
          (profile: any) =>
            profile.position ===
            'supplier_manager',
        ) ??
        supplierProfiles[0] ??
        null;

      const members =
        supplierProfiles.filter(
          (profile: any) =>
            profile.id !== leader?.id,
        );

      return {
        leader: leader
          ? {
              id: leader.id,
              name:
                `${leader.first_name ?? ''} ${leader.last_name ?? ''}`.trim() ||
                'Collaborateur sans nom',
              role:
                leader.position ===
                'supplier_manager'
                  ? 'Responsable du pôle Fournisseurs'
                  : 'Collaborateur Fournisseurs',
            }
          : null,

        members: members.map(
          (member: any) => {
            const supplierCount =
              assignmentCounts[
                member.id
              ] ?? 0;

            const loadPercentage = Math.min(
              100,
              Math.round(
                (supplierCount /
                  MAX_CAPACITY) *
                  100,
              ),
            );

            return {
              id: member.id,

              name:
                `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim() ||
                'Collaborateur sans nom',

              role:
                member.position ||
                'supplier_manager',

              categories:
                categoriesByPerson[
                  member.id
                ] ?? [],

              supplierCount,

              capacity:
                MAX_CAPACITY,

              loadPercentage,
            };
          },
        ),
      };
    },
  });
}

function getLoadLabel(
  percentage: number,
) {
  if (percentage >= 100) {
    return {
      label: 'Capacité atteinte',
      className:
        'text-destructive',
    };
  }

  if (percentage >= 80) {
    return {
      label: 'Charge élevée',
      className:
        'text-yellow-600',
    };
  }

  if (percentage >= 50) {
    return {
      label: 'Charge normale',
      className:
        'text-muted-foreground',
    };
  }

  return {
    label: 'Disponible',
    className:
      'text-emerald-600',
  };
}

export function SupplierOrgChart() {
  const {
    data,
    isLoading,
  } = useSupplierOrg();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (
    !data?.leader &&
    (!data?.members ||
      data.members.length === 0)
  ) {
    return (
      <div className="py-8 text-center">
        <Users className="mx-auto h-8 w-8 text-muted-foreground" />

        <p className="mt-3 text-muted-foreground">
          Aucun membre assigné au pôle
          Fournisseurs
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data?.leader && (
        <>
          <div className="flex justify-center">
            <Card className="w-full max-w-md border-2 border-primary">
              <CardContent className="p-5 text-center">
                <Crown className="mx-auto mb-2 h-6 w-6 text-yellow-500" />

                <p className="text-lg font-bold">
                  {data.leader.name}
                </p>

                <p className="text-sm text-muted-foreground">
                  {data.leader.role}
                </p>
              </CardContent>
            </Card>
          </div>

          {data.members.length > 0 && (
            <div className="flex justify-center">
              <div className="h-8 w-px bg-border" />
            </div>
          )}
        </>
      )}

      {data?.members &&
        data.members.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.members.map(
              (member) => {
                const load =
                  getLoadLabel(
                    member.loadPercentage,
                  );

                return (
                  <Card
                    key={member.id}
                    className="overflow-hidden"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-4 w-4 text-primary" />

                        {member.name}
                      </CardTitle>

                      <p className="text-xs text-muted-foreground">
                        {member.role}
                      </p>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {member.categories
                        .length > 0 ? (
                        <div>
                          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <FolderOpen className="h-3.5 w-3.5" />
                            Spécialisations
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {member.categories.map(
                              (
                                category,
                              ) => (
                                <Badge
                                  key={
                                    category
                                  }
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {category}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <BriefcaseBusiness className="h-3.5 w-3.5" />

                          Aucune spécialisation
                          définie
                        </div>
                      )}

                      <div className="rounded-lg bg-muted/50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />

                            <span>
                              {member.supplierCount}{' '}
                              fournisseur
                              {member.supplierCount !==
                              1
                                ? 's'
                                : ''}
                            </span>
                          </div>

                          <span
                            className={`text-xs font-medium ${load.className}`}
                          >
                            {load.label}
                          </span>
                        </div>

                        <Progress
                          value={
                            member.loadPercentage
                          }
                          className="h-1.5"
                        />

                        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                          <span>
                            Charge
                          </span>

                          <span>
                            {member.loadPercentage}%
                            {' · '}
                            {member.supplierCount}/
                            {member.capacity}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              },
            )}
          </div>
        )}
    </div>
  );
}
