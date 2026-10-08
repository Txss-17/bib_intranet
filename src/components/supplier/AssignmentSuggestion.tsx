// @ts-nocheck — contrôle désactivé sur cette page (lectures de portefeuilles)
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Zap,
  Users,
  BarChart3,
  CheckCircle2,
  Loader2,
  BriefcaseBusiness,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

interface Candidate {
  id: string;
  name: string;
  role: string;
  supplierCount: number;
  maxCapacity: number;
  specialization: string[];
  score: number;
  reason: string;
}

interface AssignmentSuggestionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  supplierName: string;
  portfolioId: string;
  supplierCategory: string;
  onAssign?: (employeeName: string) => void;
}

const MAX_CAPACITY = 10;

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function useCandidates(
  category: string,
  portfolioId: string,
) {
  return useQuery({
    queryKey: [
      'assignment_candidates',
      category,
      portfolioId,
    ],

    enabled:
      category.length > 0 &&
      portfolioId.length > 0,

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

      const portfoliosByPerson: Record<
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
          !portfoliosByPerson[
            portfolio.responsible_id
          ]
        ) {
          portfoliosByPerson[
            portfolio.responsible_id
          ] = [];
        }

        portfoliosByPerson[
          portfolio.responsible_id
        ].push(portfolio.category);
      });

      const normalizedCategory =
        normalize(category);

      const candidates: Candidate[] =
        supplierProfiles
          .map((profile: any) => {
            const name =
              `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim();

            const supplierCount =
              assignmentCounts[profile.id] ?? 0;

            const specializations =
              portfoliosByPerson[
                profile.id
              ] ?? [];

            const hasExactSpecialization =
              specializations.some(
                (specialization) => {
                  const normalizedSpecialization =
                    normalize(
                      specialization,
                    );

                  return (
                    normalizedSpecialization ===
                      normalizedCategory ||
                    normalizedCategory.includes(
                      normalizedSpecialization,
                    ) ||
                    normalizedSpecialization.includes(
                      normalizedCategory,
                    )
                  );
                },
              );

            const capacityScore =
              Math.max(
                0,
                Math.min(
                  40,
                  ((MAX_CAPACITY -
                    supplierCount) /
                    MAX_CAPACITY) *
                    40,
                ),
              );

            const specializationScore =
              hasExactSpecialization
                ? 60
                : 0;

            const score = Math.round(
              specializationScore +
                capacityScore,
            );

            let reason: string;

            if (
              hasExactSpecialization &&
              supplierCount <
                MAX_CAPACITY * 0.7
            ) {
              reason =
                'Spécialisation correspondante et capacité disponible';
            } else if (
              hasExactSpecialization
            ) {
              reason =
                'Spécialisation correspondante mais charge élevée';
            } else if (
              supplierCount <
              MAX_CAPACITY * 0.5
            ) {
              reason =
                'Capacité disponible, sans spécialisation correspondante';
            } else {
              reason =
                'Charge élevée et aucune spécialisation correspondante';
            }

            return {
              id: profile.id,
              name:
                name ||
                'Collaborateur sans nom',
              role:
                profile.position ||
                'supplier_manager',
              supplierCount,
              maxCapacity:
                MAX_CAPACITY,
              specialization:
                specializations,
              score,
              reason,
            };
          })
          .filter(
            (candidate) =>
              candidate.supplierCount <
              candidate.maxCapacity,
          )
          .sort(
            (a, b) =>
              b.score - a.score ||
              a.supplierCount -
                b.supplierCount,
          );

      return candidates;
    },
  });
}

export function AssignmentSuggestion({
  open,
  onOpenChange,
  supplierId,
  supplierName,
  portfolioId,
  supplierCategory,
  onAssign,
}: AssignmentSuggestionProps) {
  const [
    selectedEmployee,
    setSelectedEmployee,
  ] = useState<string | null>(null);

  const queryClient =
    useQueryClient();

  const {
    data: suggestions = [],
    isLoading,
  } = useCandidates(
    supplierCategory,
    portfolioId,
  );

  const recommended =
    suggestions[0];

  const assignMutation =
    useMutation({
      mutationFn: async (
        employeeId: string,
      ) => {
        const employee =
          suggestions.find(
            (candidate) =>
              candidate.id ===
              employeeId,
          );

        if (!employee) {
          throw new Error(
            'Collaborateur introuvable.',
          );
        }

        /*
         * Vérifie s'il existe déjà une
         * affectation active pour ce fournisseur.
         */
        const {
          data: existingAssignments,
          error: existingError,
        } = await (supabase as any)
          .from(
            'portfolio_assignments',
          )
          .select(
            'id, supplier_id, portfolio_id, assigned_to_id, assigned_to_name',
          )
          .eq(
            'supplier_id',
            supplierId,
          );

        if (existingError) {
          throw existingError;
        }

        const existing =
          existingAssignments?.find(
            (assignment: any) =>
              assignment.portfolio_id ===
              portfolioId,
          );

        if (existing) {
          const {
            error: updateError,
          } = await (supabase as any)
            .from(
              'portfolio_assignments',
            )
            .update({
              assigned_to_id:
                employee.id,
              assigned_to_name:
                employee.name,
              assigned_at:
                new Date().toISOString(),
            })
            .eq(
              'id',
              existing.id,
            );

          if (updateError) {
            throw updateError;
          }

          return employee;
        }

        const {
          error: insertError,
        } = await (supabase as any)
          .from(
            'portfolio_assignments',
          )
          .insert({
            supplier_id:
              supplierId,
            portfolio_id:
              portfolioId,
            assigned_to_id:
              employee.id,
            assigned_to_name:
              employee.name,
            assigned_at:
              new Date().toISOString(),
          });

        if (insertError) {
          throw insertError;
        }

        return employee;
      },

      onSuccess: (employee) => {
        queryClient.invalidateQueries({
          queryKey: [
            'supplier-portfolio-data',
          ],
        });

        queryClient.invalidateQueries({
          queryKey: [
            'assignment_candidates',
          ],
        });

        queryClient.invalidateQueries({
          queryKey: [
            'supplier_org_chart',
          ],
        });

        toast.success(
          'Fournisseur assigné',
          {
            description:
              `${supplierName} → ${employee.name}`,
          },
        );

        onAssign?.(
          employee.name,
        );

        setSelectedEmployee(null);
        onOpenChange(false);
      },

      onError: (error) => {
        toast.error(
          "Impossible d'enregistrer l'affectation",
          {
            description:
              error instanceof Error
                ? error.message
                : 'Une erreur est survenue.',
          },
        );
      },
    });

  const selectedId =
    selectedEmployee ??
    recommended?.id ??
    null;

  const handleAssign = () => {
    if (!selectedId) {
      return;
    }

    assignMutation.mutate(
      selectedId,
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (
          !assignMutation.isPending
        ) {
          onOpenChange(value);
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Assignation intelligente
          </DialogTitle>

          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              Fournisseur :{' '}
              <strong className="text-foreground">
                {supplierName}
              </strong>
            </p>

            <p className="flex items-center gap-1">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              Catégorie :{' '}
              <strong className="text-foreground">
                {supplierCategory}
              </strong>
            </p>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground" />

            <p className="mt-3 font-medium">
              Aucun candidat disponible
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Aucun collaborateur du pôle
              Fournisseurs ne dispose actuellement
              de capacité disponible.
            </p>
          </div>
        ) : (
          <div className="max-h-[400px] space-y-3 overflow-y-auto">
            {suggestions.map(
              (employee, index) => {
                const isRecommended =
                  index === 0;

                const isSelected =
                  selectedId ===
                  employee.id;

                const loadPct = Math.min(
                  100,
                  Math.round(
                    (employee.supplierCount /
                      employee.maxCapacity) *
                      100,
                  ),
                );

                return (
                  <button
                    key={employee.id}
                    type="button"
                    className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() =>
                      setSelectedEmployee(
                        employee.id,
                      )
                    }
                    disabled={
                      assignMutation.isPending
                    }
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {isRecommended && (
                          <Badge>
                            <Zap className="mr-1 h-3 w-3" />
                            Recommandé
                          </Badge>
                        )}

                        <span className="font-medium">
                          {employee.name}
                        </span>
                      </div>

                      <Badge
                        variant="outline"
                        className="text-base font-bold"
                      >
                        {employee.score}
                        pts
                      </Badge>
                    </div>

                    <div className="mb-2 grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {employee.supplierCount}/
                          {employee.maxCapacity}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3 text-muted-foreground" />
                        <span>
                          Charge : {loadPct}%
                        </span>
                      </div>
                    </div>

                    <Progress
                      value={loadPct}
                      className="mb-2 h-1.5"
                    />

                    <p className="text-xs text-muted-foreground">
                      {employee.reason}
                    </p>

                    {employee.specialization
                      .length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {employee.specialization.map(
                          (specialization) => (
                            <Badge
                              key={
                                specialization
                              }
                              variant="secondary"
                              className="text-xs"
                            >
                              {specialization}
                            </Badge>
                          ),
                        )}
                      </div>
                    )}
                  </button>
                );
              },
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() =>
              onOpenChange(false)
            }
            disabled={
              assignMutation.isPending
            }
          >
            Annuler
          </Button>

          <Button
            onClick={handleAssign}
            disabled={
              isLoading ||
              !selectedId ||
              assignMutation.isPending
            }
          >
            {assignMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}

            {assignMutation.isPending
              ? 'Enregistrement...'
              : "Valider l'assignation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
