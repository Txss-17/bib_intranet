import { useMemo, useState } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Search,
  Users,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { poles } from '@/data/poles';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';

import { useEmployees, type Employee } from '@/hooks/useEmployees';

const POSITION_LABELS: Record<string, string> = {
  supplier_manager: 'Responsable Fournisseurs & Produits',
  customer_success_manager:
    'Responsable Marketplace & Customer Success',
  ops_logistics_manager:
    'Responsable Opérations & Logistique',
  finance_manager: 'Responsable Finance',
  audit_compliance_lead:
    'Responsable Qualité, Audit & Conformité',
  rse_impact_manager:
    'Responsable RSE & Impact',
  product_engineering_manager:
    'Responsable Product & Engineering',
  marketing_communication_manager:
    'Responsable Marketing & Communication',
  rh_manager: 'Responsable RH',
  data_bi_manager: 'Responsable Data & BI',
  security_it_manager:
    'Responsable Security & IT',
  ceo: 'Direction',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  onboarding: 'Onboarding',
  leave: 'En congé',
  suspended: 'Suspendu',
  leaving: 'Sortant',
  archived: 'Archivé',
};

function fullName(employee: Employee) {
  return `${employee.first_name ?? ''} ${employee.last_name ?? ''}`.trim();
}

function initials(employee: Employee) {
  return `${employee.first_name?.[0] ?? ''}${employee.last_name?.[0] ?? ''}`
    .toUpperCase();
}

function positionLabel(position: string | null) {
  return position
    ? POSITION_LABELS[position] ?? position
    : 'Fonction non définie';
}

function poleLabel(poleId: string) {
  return poles.find((pole) => pole.id === poleId)?.name ?? poleId;
}

function getPoleDescription(poleId: string) {
  return poles.find((pole) => pole.id === poleId)?.description ?? '';
}

function getPoleShortName(poleId: string) {
  return poles.find((pole) => pole.id === poleId)?.shortName ?? poleId;
}

function isManager(employee: Employee) {
  return Boolean(employee.position?.endsWith('_manager')) ||
    employee.position === 'ceo' ||
    employee.position === 'audit_compliance_lead';
}

export default function Organization() {
  const [search, setSearch] = useState('');
  const [selectedPole, setSelectedPole] = useState('all');
  const [expandedPoles, setExpandedPoles] = useState<string[]>([]);

  const {
    data: employees = [],
    isLoading,
  } = useEmployees({
    search: search || undefined,
    hrStatus: 'active',
  });

  const organization = useMemo(() => {
    const result = poles.map((pole) => {
      const members = employees.filter((employee) =>
        Array.isArray(employee.poles) &&
        employee.poles.includes(pole.id),
      );

      const managers = members.filter(isManager);

      return {
        ...pole,
        members,
        managers,
      };
    });

    if (selectedPole === 'all') {
      return result;
    }

    return result.filter(
      (pole) => pole.id === selectedPole,
    );
  }, [employees, selectedPole]);

  const totalActive = employees.length;

  const multiPoleCount = employees.filter(
    (employee) =>
      Array.isArray(employee.poles) &&
      employee.poles.length > 1,
  ).length;

  const togglePole = (poleId: string) => {
    setExpandedPoles((current) =>
      current.includes(poleId)
        ? current.filter((id) => id !== poleId)
        : [...current, poleId],
    );
  };

  const expandAll = () => {
    setExpandedPoles(
      organization
        .filter((pole) => pole.members.length > 0)
        .map((pole) => pole.id),
    );
  };

  const collapseAll = () => {
    setExpandedPoles([]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            Organisation RH
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Référentiel organisationnel des collaborateurs actifs,
            de leurs pôles et de leurs fonctions. Les portefeuilles
            métier restent administrés par leurs pôles respectifs.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={expandAll}
          >
            Tout développer
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={collapseAll}
          >
            Tout réduire
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Collaborateurs actifs
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {totalActive}
                </p>
              </div>

              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Pôles
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {poles.length}
                </p>
              </div>

              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Multi-affectations
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {multiPoleCount}
                </p>
              </div>

              <Users className="h-5 w-5 text-muted-foreground" />
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Collaborateurs rattachés à plusieurs pôles
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-[1fr_260px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                className="pl-9"
                placeholder="Rechercher un collaborateur, une fonction..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <Select
              value={selectedPole}
              onValueChange={setSelectedPole}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les pôles" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Tous les pôles
                </SelectItem>

                {poles.map((pole) => (
                  <SelectItem
                    key={pole.id}
                    value={pole.id}
                  >
                    {pole.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin" />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {organization.map((pole) => {
            const expanded = expandedPoles.includes(pole.id);

            return (
              <Card key={pole.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-0.5 h-8 w-8 shrink-0"
                        onClick={() =>
                          togglePole(pole.id)
                        }
                      >
                        {expanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base">
                            {pole.name}
                          </CardTitle>

                          <Badge variant="outline">
                            {getPoleShortName(pole.id)}
                          </Badge>

                          <Badge variant="secondary">
                            {pole.members.length}{' '}
                            {pole.members.length > 1
                              ? 'collaborateurs'
                              : 'collaborateur'}
                          </Badge>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {getPoleDescription(pole.id)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {expanded && (
                  <CardContent className="pt-0">
                    {pole.members.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          Aucun collaborateur actif rattaché
                          à ce pôle.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pole.members.map((employee) => (
                          <div
                            key={employee.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback>
                                  {initials(employee)}
                                </AvatarFallback>
                              </Avatar>

                              <div className="min-w-0">
                                <p className="truncate font-medium">
                                  {fullName(employee)}
                                </p>

                                <p className="truncate text-xs text-muted-foreground">
                                  {positionLabel(
                                    employee.position,
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {isManager(employee) && (
                                <Badge>
                                  Référent / responsable
                                </Badge>
                              )}

                              {employee.collaborator_type && (
                                <Badge variant="outline">
                                  {employee.collaborator_type ===
                                  'internal'
                                    ? 'Interne'
                                    : employee.collaborator_type ===
                                      'external'
                                    ? 'Externe'
                                    : employee.collaborator_type ===
                                      'provider'
                                    ? 'Prestataire'
                                    : employee.collaborator_type ===
                                      'consultant'
                                    ? 'Consultant'
                                    : employee.collaborator_type ===
                                      'apprentice'
                                    ? 'Alternant'
                                    : employee.collaborator_type ===
                                      'intern'
                                    ? 'Stagiaire'
                                    : 'Autre'}
                                </Badge>
                              )}

                              <Badge variant="secondary">
                                {STATUS_LABELS[
                                  employee.hr_status ?? 'active'
                                ] ?? 'Actif'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
