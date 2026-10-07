import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Users,
  RefreshCw,
  Pencil,
  FolderOpen,
  UserRound,
  Mail,
  Building2,
  Briefcase,
  ShieldCheck,
  X,
} from 'lucide-react';

import { toast } from 'sonner';

import {
  type CollaboratorType,
  type Employee,
  type HrStatus,
  useEmployees,
  useUpdateEmployee,
} from '@/hooks/useEmployees';

import { poles } from '@/data/poles';

import { ExportButtons } from '@/components/ExportButtons';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Label } from '@/components/ui/label';

import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';


// ============================================================
// LABELS
// ============================================================

const collaboratorTypeLabels: Record<CollaboratorType, string> = {
  internal: 'Interne',
  external: 'Externe',
  provider: 'Prestataire',
  consultant: 'Consultant',
  apprentice: 'Alternant',
  intern: 'Stagiaire',
  other: 'Autre',
};

const statusLabels: Record<HrStatus, string> = {
  active: 'Actif',
  onboarding: 'En onboarding',
  leave: 'En congé',
  suspended: 'Suspendu',
  leaving: 'Sortant',
  archived: 'Archivé',
};

const statusVariant: Record<
  HrStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  active: 'default',
  onboarding: 'outline',
  leave: 'secondary',
  suspended: 'destructive',
  leaving: 'outline',
  archived: 'secondary',
};


// ============================================================
// HELPERS
// ============================================================

function fullName(employee: Employee) {
  return `${employee.first_name ?? ''} ${employee.last_name ?? ''}`.trim();
}

function initials(employee: Employee) {
  return `${employee.first_name?.[0] ?? ''}${employee.last_name?.[0] ?? ''}`
    .toUpperCase();
}

function poleName(id: string) {
  return poles.find((pole) => pole.id === id)?.name ?? id;
}

function formatDate(value: string | null) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleDateString('fr-FR');
}


// ============================================================
// PAGE
// ============================================================

export default function Employees() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] =
    useState<CollaboratorType | 'all'>('all');
  const [statusFilter, setStatusFilter] =
    useState<HrStatus | 'all'>('all');
  const [poleFilter, setPoleFilter] =
    useState<string>('all');

  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);

  const [editDialogOpen, setEditDialogOpen] =
    useState(false);

  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    position: '',
    seniority: '',
    work_mode: '',
    subsidiary: '',
    collaborator_type: 'internal' as CollaboratorType,
    hr_status: 'active' as HrStatus,
  });

  const {
    data: employees = [],
    isLoading,
    isFetching,
    refetch,
  } = useEmployees({
    search: searchQuery || undefined,
    collaboratorType: typeFilter,
    hrStatus: statusFilter,
    pole: poleFilter,
  });

  const updateEmployee = useUpdateEmployee();

  // ==========================================================
  // POLES
  // ==========================================================

  const poleOptions = poles;

  // ==========================================================
  // KPI
  // ==========================================================

  const stats = useMemo(() => {
    return {
      total: employees.length,
      active: employees.filter(
        (employee) => employee.hr_status === 'active',
      ).length,
      onboarding: employees.filter(
        (employee) => employee.hr_status === 'onboarding',
      ).length,
      external: employees.filter(
        (employee) =>
          employee.collaborator_type !== 'internal',
      ).length,
    };
  }, [employees]);

  // ==========================================================
  // EDIT
  // ==========================================================

  const openEdit = (employee: Employee) => {
    setSelectedEmployee(employee);

    setEditForm({
      first_name: employee.first_name ?? '',
      last_name: employee.last_name ?? '',
      email: employee.email ?? '',
      position: employee.position ?? '',
      seniority: employee.seniority ?? '',
      work_mode: employee.work_mode ?? '',
      subsidiary: employee.subsidiary ?? '',
      collaborator_type:
        employee.collaborator_type ?? 'internal',
      hr_status:
        employee.hr_status ?? 'active',
    });

    setEditDialogOpen(true);
  };

  const saveEmployee = async () => {
    if (!selectedEmployee) {
      return;
    }

    if (
      !editForm.first_name.trim() ||
      !editForm.last_name.trim() ||
      !editForm.email.trim()
    ) {
      toast.error(
        'Le prénom, le nom et l’adresse e-mail sont obligatoires.',
      );

      return;
    }

    try {
      await updateEmployee.mutateAsync({
        id: selectedEmployee.id,
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        email: editForm.email.trim(),
        position: editForm.position.trim() || null,
        seniority: editForm.seniority.trim() || null,
        work_mode: editForm.work_mode.trim() || null,
        subsidiary: editForm.subsidiary.trim() || null,
        collaborator_type: editForm.collaborator_type,
        hr_status: editForm.hr_status,
      });

      toast.success('Collaborateur mis à jour.');

      setEditDialogOpen(false);
      setSelectedEmployee(null);
    } catch (error: any) {
      toast.error(
        error?.message ||
          'Impossible de mettre à jour le collaborateur.',
      );
    }
  };

  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    setPoleFilter('all');
  };

  const hasFilters =
    Boolean(searchQuery) ||
    typeFilter !== 'all' ||
    statusFilter !== 'all' ||
    poleFilter !== 'all';

  // ==========================================================
  // LOADING
  // ==========================================================

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />

            <h1 className="text-3xl font-bold">
              Collaborateurs
            </h1>
          </div>

          <p className="mt-1 text-muted-foreground">
            Référentiel RH officiel des collaborateurs BIB.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                isFetching ? 'animate-spin' : ''
              }`}
            />

            Actualiser
          </Button>

          <Button asChild>
            <Link to="/pole/rh/onboarding">
              <UserRound className="mr-2 h-4 w-4" />
              Ajouter un collaborateur
            </Link>
          </Button>
        </div>
      </div>


      {/* ======================================================
          KPI
          ====================================================== */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Collaborateurs
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {stats.total}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Actifs
            </p>

            <p className="mt-1 text-2xl font-semibold text-success">
              {stats.active}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Onboarding
            </p>

            <p className="mt-1 text-2xl font-semibold text-warning">
              {stats.onboarding}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Hors interne
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {stats.external}
            </p>
          </CardContent>
        </Card>

      </div>


      {/* ======================================================
          FILTERS
          ====================================================== */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche et filtres
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">

            <div className="relative lg:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                className="pl-10"
                placeholder="Nom, e-mail, poste..."
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
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

                {poleOptions.map((pole) => (
                  <SelectItem
                    key={pole.id}
                    value={pole.id}
                  >
                    {pole.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={typeFilter}
              onValueChange={(value) =>
                setTypeFilter(
                  value as CollaboratorType | 'all',
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Type de collaborateur" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Tous les types
                </SelectItem>

                {(
                  Object.entries(
                    collaboratorTypeLabels,
                  ) as [
                    CollaboratorType,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <SelectItem
                    key={value}
                    value={value}
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(
                  value as HrStatus | 'all',
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut RH" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Tous les statuts
                </SelectItem>

                {(
                  Object.entries(
                    statusLabels,
                  ) as [
                    HrStatus,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <SelectItem
                    key={value}
                    value={value}
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>

          {hasFilters && (
            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
              >
                <X className="mr-1.5 h-4 w-4" />
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </CardContent>
      </Card>


      {/* ======================================================
          TABLE
          ====================================================== */}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>
                Référentiel collaborateurs
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                {employees.length}{' '}
                {employees.length > 1
                  ? 'collaborateurs'
                  : 'collaborateur'}
                {' '}correspondant aux filtres.
              </p>
            </div>

            <ExportButtons
              filename="collaborateurs-rh"
              title="Collaborateurs RH"
              poleName="Ressources Humaines"
              columns={[
                {
                  header: 'Nom',
                  accessor: 'name',
                },
                {
                  header: 'E-mail',
                  accessor: 'email',
                },
                {
                  header: 'Type',
                  accessor: 'type',
                },
                {
                  header: 'Statut',
                  accessor: 'status',
                },
                {
                  header: 'Pôles',
                  accessor: 'poles',
                },
                {
                  header: 'Poste',
                  accessor: 'position',
                },
                {
                  header: 'Ancienneté',
                  accessor: 'seniority',
                },
                {
                  header: 'Mode de travail',
                  accessor: 'work_mode',
                },
              ]}
              data={employees.map((employee) => ({
                name: fullName(employee),
                email: employee.email,
                type:
                  collaboratorTypeLabels[
                    employee.collaborator_type
                  ],
                status:
                  statusLabels[
                    employee.hr_status
                  ],
                poles: Array.isArray(employee.poles)
                  ? employee.poles
                      .map(poleName)
                      .join(', ')
                  : '',
                position:
                  employee.position ?? '',
                seniority:
                  employee.seniority ?? '',
                work_mode:
                  employee.work_mode ?? '',
              }))}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">

          {employees.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />

              <p className="mt-4 font-medium">
                Aucun collaborateur trouvé
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Modifiez les critères de recherche ou de filtre.
              </p>

              {hasFilters && (
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={resetFilters}
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>

                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Collaborateur
                    </TableHead>

                    <TableHead>
                      Type
                    </TableHead>

                    <TableHead>
                      Pôle(s)
                    </TableHead>

                    <TableHead>
                      Poste
                    </TableHead>

                    <TableHead>
                      Statut
                    </TableHead>

                    <TableHead>
                      Dernière mise à jour
                    </TableHead>

                    <TableHead className="text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>

                      {/* Collaborateur */}
                      <TableCell>
                        <div className="flex items-center gap-3">

                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {initials(employee)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0">
                            <p className="font-medium">
                              {fullName(employee)}
                            </p>

                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />

                              <span className="truncate">
                                {employee.email}
                              </span>
                            </div>
                          </div>

                        </div>
                      </TableCell>


                      {/* Type */}
                      <TableCell>
                        <Badge variant="outline">
                          {
                            collaboratorTypeLabels[
                              employee.collaborator_type
                            ]
                          }
                        </Badge>
                      </TableCell>


                      {/* Pôles */}
                      <TableCell>
                        <div className="flex max-w-xs flex-wrap gap-1">
                          {Array.isArray(employee.poles) &&
                          employee.poles.length > 0 ? (
                            employee.poles.map((pole) => (
                              <Badge
                                key={pole}
                                variant="secondary"
                                className="text-xs"
                              >
                                {poleName(pole)}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Non renseigné
                            </span>
                          )}
                        </div>
                      </TableCell>


                      {/* Poste */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />

                          <span className="text-sm">
                            {employee.position ||
                              'Non renseigné'}
                          </span>
                        </div>
                      </TableCell>


                      {/* Statut */}
                      <TableCell>
                        <Badge
                          variant={
                            statusVariant[
                              employee.hr_status
                            ]
                          }
                        >
                          {
                            statusLabels[
                              employee.hr_status
                            ]
                          }
                        </Badge>
                      </TableCell>


                      {/* Updated */}
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(
                            employee.updated_at,
                          )}
                        </span>
                      </TableCell>


                      {/* Actions */}
                      <TableCell>
                        <div className="flex justify-end gap-1">

                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                          >
                            <Link
                              to={`/pole/rh/files?employee=${employee.id}`}
                            >
                              <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
                              Dossier
                            </Link>
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              openEdit(employee)
                            }
                          >
                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                            Modifier
                          </Button>

                        </div>
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>

              </Table>
            </div>
          )}

        </CardContent>
      </Card>


      {/* ======================================================
          EDIT DIALOG
          ====================================================== */}

      <Dialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      >
        <DialogContent className="max-w-2xl">

          <DialogHeader>
            <DialogTitle>
              Modifier le collaborateur
            </DialogTitle>

            <DialogDescription>
              Mise à jour du référentiel RH officiel.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            <div>
              <Label>Prénom</Label>

              <Input
                className="mt-1"
                value={editForm.first_name}
                onChange={(event) =>
                  setEditForm({
                    ...editForm,
                    first_name:
                      event.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Nom</Label>

              <Input
                className="mt-1"
                value={editForm.last_name}
                onChange={(event) =>
                  setEditForm({
                    ...editForm,
                    last_name:
                      event.target.value,
                  })
                }
              />
            </div>

            <div className="md:col-span-2">
              <Label>E-mail</Label>

              <Input
                className="mt-1"
                type="email"
                value={editForm.email}
                onChange={(event) =>
                  setEditForm({
                    ...editForm,
                    email:
                      event.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Poste</Label>

              <Input
                className="mt-1"
                placeholder="Poste actuel"
                value={editForm.position}
                onChange={(event) =>
                  setEditForm({
                    ...editForm,
                    position:
                      event.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Ancienneté</Label>

              <Input
                className="mt-1"
                placeholder="Ex. 2 ans"
                value={editForm.seniority}
                onChange={(event) =>
                  setEditForm({
                    ...editForm,
                    seniority:
                      event.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Mode de travail</Label>

              <Input
                className="mt-1"
                placeholder="Ex. Hybride"
                value={editForm.work_mode}
                onChange={(event) =>
                  setEditForm({
                    ...editForm,
                    work_mode:
                      event.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Filiale / entité</Label>

              <Input
                className="mt-1"
                placeholder="Ex. BIB"
                value={editForm.subsidiary}
                onChange={(event) =>
                  setEditForm({
                    ...editForm,
                    subsidiary:
                      event.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Type de collaborateur</Label>

              <Select
                value={
                  editForm.collaborator_type
                }
                onValueChange={(value) =>
                  setEditForm({
                    ...editForm,
                    collaborator_type:
                      value as CollaboratorType,
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {(
                    Object.entries(
                      collaboratorTypeLabels,
                    ) as [
                      CollaboratorType,
                      string,
                    ][]
                  ).map(
                    ([value, label]) => (
                      <SelectItem
                        key={value}
                        value={value}
                      >
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Statut RH</Label>

              <Select
                value={editForm.hr_status}
                onValueChange={(value) =>
                  setEditForm({
                    ...editForm,
                    hr_status:
                      value as HrStatus,
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {(
                    Object.entries(
                      statusLabels,
                    ) as [
                      HrStatus,
                      string,
                    ][]
                  ).map(
                    ([value, label]) => (
                      <SelectItem
                        key={value}
                        value={value}
                      >
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() =>
                setEditDialogOpen(false)
              }
            >
              Annuler
            </Button>

            <Button
              onClick={saveEmployee}
              disabled={
                updateEmployee.isPending
              }
            >
              {updateEmployee.isPending && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}

              Enregistrer
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>

    </div>
  );
}
