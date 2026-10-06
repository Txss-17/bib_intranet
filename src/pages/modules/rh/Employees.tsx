import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
  Search,
  Plus,
  Mail,
  Edit,
  Loader2,
  ShieldCheck,
  UserCog,
  SlidersHorizontal,
  Briefcase,
  Users,
  UserCheck,
  UserX,
  Clock3,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';

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

import { ExportButtons } from '@/components/ExportButtons';

import {
  Employee,
  CollaboratorType,
  HrStatus,
  useEmployees,
  useUpdateEmployee,
} from '@/hooks/useEmployees';


const collaboratorTypeLabels: Record<
  CollaboratorType,
  string
> = {
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


const statusVariant = (
  status: HrStatus,
) => {
  switch (status) {
    case 'active':
      return 'default' as const;

    case 'suspended':
    case 'leaving':
      return 'destructive' as const;

    case 'archived':
      return 'secondary' as const;

    default:
      return 'outline' as const;
  }
};


const typeBadgeClass = (
  type: CollaboratorType,
) => {
  switch (type) {
    case 'internal':
      return 'border-primary/30 text-primary';

    case 'external':
      return 'border-blue-500/30 text-blue-600';

    case 'provider':
      return 'border-orange-500/30 text-orange-600';

    case 'consultant':
      return 'border-purple-500/30 text-purple-600';

    case 'apprentice':
      return 'border-green-500/30 text-green-600';

    case 'intern':
      return 'border-yellow-500/30 text-yellow-600';

    default:
      return '';
  }
};


const getInitials = (
  employee: Employee,
) => {
  return `${employee.first_name?.[0] ?? ''}${employee.last_name?.[0] ?? ''}`
    .toUpperCase();
};


const getFullName = (
  employee: Employee,
) => {
  return `${employee.first_name ?? ''} ${employee.last_name ?? ''}`.trim();
};


export default function Employees() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');

  const [typeFilter, setTypeFilter] =
    useState<CollaboratorType | 'all'>('all');

  const [statusFilter, setStatusFilter] =
    useState<HrStatus | 'all'>('all');

  const [poleFilter, setPoleFilter] =
    useState<string>('all');

  const [positionFilter, setPositionFilter] =
    useState<string>('all');

  const [editingEmployee, setEditingEmployee] =
    useState<Employee | null>(null);

  const filters = {
    search: searchTerm || undefined,
    collaboratorType: typeFilter,
    hrStatus: statusFilter,
    pole: poleFilter,
    position: positionFilter,
  };

  const {
    data: employees = [],
    isLoading,
    isError,
    error,
  } = useEmployees(filters);

  const updateEmployee = useUpdateEmployee();


  const poles = useMemo(() => {
    const values = new Set<string>();

    employees.forEach((employee) => {
      if (Array.isArray(employee.poles)) {
        employee.poles.forEach((pole) => {
          if (pole) {
            values.add(pole);
          }
        });
      }
    });

    return Array.from(values).sort();
  }, [employees]);


  const positions = useMemo(() => {
    const values = new Set<string>();

    employees.forEach((employee) => {
      if (employee.position) {
        values.add(employee.position);
      }
    });

    return Array.from(values).sort();
  }, [employees]);


  const total = employees.length;

  const activeCount = employees.filter(
    (employee) => employee.hr_status === 'active',
  ).length;

  const internalCount = employees.filter(
    (employee) => employee.collaborator_type === 'internal',
  ).length;

  const externalCount = employees.filter(
    (employee) =>
      employee.collaborator_type !== 'internal',
  ).length;


  const handleContact = (
    employee: Employee,
  ) => {
    if (!employee.email) {
      toast.error(
        'Aucune adresse email professionnelle disponible.',
      );

      return;
    }

    navigate('/modules/gateway/compose', {
      state: {
        to: employee.email,
        recipientName: getFullName(employee),
        subject: `Contact RH — ${getFullName(employee)}`,
        message: `Bonjour ${employee.first_name},

Je vous contacte au nom du pôle RH de B.I.B.

Bien cordialement,
`,
      },
    });
  };


  const handleEdit = (
    employee: Employee,
  ) => {
    setEditingEmployee(employee);
  };


  const handleSave = async () => {
    if (!editingEmployee) {
      return;
    }

    try {
      await updateEmployee.mutateAsync({
        id: editingEmployee.id,
        collaborator_type:
          editingEmployee.collaborator_type,
        hr_status:
          editingEmployee.hr_status,
      });

      toast.success(
        'Informations RH mises à jour.',
      );

      setEditingEmployee(null);
    } catch (err: any) {
      toast.error(
        err?.message ||
          'Impossible de mettre à jour le collaborateur.',
      );
    }
  };


  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }


  if (isError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-medium text-destructive">
              Impossible de charger le référentiel RH.
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              {(error as any)?.message ||
                'Une erreur est survenue lors de la lecture des collaborateurs.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-6">
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
            Référentiel RH des personnes travaillant avec B.I.B.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ExportButtons
            filename="collaborateurs"
            title="Référentiel des collaborateurs"
            columns={[
              {
                header: 'Nom',
                accessor: 'name',
              },
              {
                header: 'Email',
                accessor: 'email',
              },
              {
                header: 'Type',
                accessor: 'collaborator_type',
              },
              {
                header: 'Pôle',
                accessor: 'pole',
              },
              {
                header: 'Poste',
                accessor: 'position',
              },
              {
                header: 'Statut',
                accessor: 'hr_status',
              },
            ]}
            data={employees.map((employee) => ({
              name: getFullName(employee),
              email: employee.email,
              collaborator_type:
                collaboratorTypeLabels[
                  employee.collaborator_type
                ],
              pole: Array.isArray(employee.poles)
                ? employee.poles.join(', ')
                : '',
              position:
                employee.position || '',
              hr_status:
                statusLabels[
                  employee.hr_status
                ],
            }))}
          />

          <Button asChild>
            <Link to="/pole/rh/onboarding">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau collaborateur
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Total
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {total}
                </p>
              </div>

              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Internes
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {internalCount}
                </p>
              </div>

              <UserCheck className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Externes
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {externalCount}
                </p>
              </div>

              <UserX className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Actifs
                </p>

                <p className="mt-1 text-2xl font-semibold text-success">
                  {activeCount}
                </p>
              </div>

              <Clock3 className="h-5 w-5 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>


      {/* ======================================================
          ACCÈS
          ====================================================== */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Accès & permissions
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">
                Les accès ne sont pas définis dans cette fiche.
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                RH gère l'identité et le rattachement du
                collaborateur. Les rôles, permissions et
                périmètres sont administrés dans leur module
                dédié.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() =>
                navigate('/admin/roles-permissions')
              }
            >
              <UserCog className="mr-2 h-4 w-4" />
              Rôles & permissions
            </Button>
          </div>
        </CardContent>
      </Card>


      {/* ======================================================
          FILTRES
          ====================================================== */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Filtres du référentiel
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              placeholder="Rechercher un nom, email, poste ou pôle..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
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

                <SelectItem value="internal">
                  Internes
                </SelectItem>

                <SelectItem value="external">
                  Externes
                </SelectItem>

                <SelectItem value="provider">
                  Prestataires
                </SelectItem>

                <SelectItem value="consultant">
                  Consultants
                </SelectItem>

                <SelectItem value="apprentice">
                  Alternants
                </SelectItem>

                <SelectItem value="intern">
                  Stagiaires
                </SelectItem>

                <SelectItem value="other">
                  Autres
                </SelectItem>
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

                <SelectItem value="active">
                  Actifs
                </SelectItem>

                <SelectItem value="onboarding">
                  En onboarding
                </SelectItem>

                <SelectItem value="leave">
                  En congé
                </SelectItem>

                <SelectItem value="suspended">
                  Suspendus
                </SelectItem>

                <SelectItem value="leaving">
                  Sortants
                </SelectItem>

                <SelectItem value="archived">
                  Archivés
                </SelectItem>
              </SelectContent>
            </Select>


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

                {poles.map((pole) => (
                  <SelectItem
                    key={pole}
                    value={pole}
                  >
                    {pole}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>


            <Select
              value={positionFilter}
              onValueChange={setPositionFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Fonction" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Toutes les fonctions
                </SelectItem>

                {positions.map((position) => (
                  <SelectItem
                    key={position}
                    value={position}
                  >
                    {position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-sm text-muted-foreground">
              {employees.length} collaborateur
              {employees.length > 1 ? 's' : ''} correspondant
              {employees.length > 1 ? 's' : ''} aux filtres.
            </p>

            {(searchTerm ||
              typeFilter !== 'all' ||
              statusFilter !== 'all' ||
              poleFilter !== 'all' ||
              positionFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setPoleFilter('all');
                  setPositionFilter('all');
                }}
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>


      {/* ======================================================
          TABLE
          ====================================================== */}

      <Card>
        <CardHeader>
          <CardTitle>
            Référentiel collaborateurs
          </CardTitle>
        </CardHeader>

        <CardContent>
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
                    Pôle
                  </TableHead>

                  <TableHead>
                    Fonction
                  </TableHead>

                  <TableHead>
                    Statut
                  </TableHead>

                  <TableHead>
                    Accès
                  </TableHead>

                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>
                            {getInitials(employee)}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <p className="font-medium">
                            {getFullName(employee)}
                          </p>

                          <p className="text-sm text-muted-foreground">
                            {employee.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>


                    <TableCell>
                      <Badge
                        variant="outline"
                        className={typeBadgeClass(
                          employee.collaborator_type,
                        )}
                      >
                        {
                          collaboratorTypeLabels[
                            employee.collaborator_type
                          ]
                        }
                      </Badge>
                    </TableCell>


                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(employee.poles) &&
                        employee.poles.length > 0 ? (
                          employee.poles.map((pole) => (
                            <Badge
                              key={pole}
                              variant="secondary"
                              className="text-xs"
                            >
                              {pole}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Non affecté
                          </span>
                        )}
                      </div>
                    </TableCell>


                    <TableCell>
                      {employee.position || '—'}
                    </TableCell>


                    <TableCell>
                      <Badge
                        variant={statusVariant(
                          employee.hr_status,
                        )}
                      >
                        {
                          statusLabels[
                            employee.hr_status
                          ]
                        }
                      </Badge>
                    </TableCell>


                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        Gérés séparément
                      </span>
                    </TableCell>


                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleEdit(employee)
                          }
                          title="Modifier le statut RH"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleContact(employee)
                          }
                          title="Contacter"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/pole/rh/files?employee=${employee.id}`,
                            )
                          }
                          title="Dossier RH"
                        >
                          <Briefcase className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}


                {employees.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-muted-foreground" />

                        <p className="font-medium">
                          Aucun collaborateur trouvé
                        </p>

                        <p className="text-sm text-muted-foreground">
                          Modifiez les filtres ou créez un
                          nouveau collaborateur via Onboarding.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>


      {/* ======================================================
          ÉDITION RH
          ====================================================== */}

      <Dialog
        open={Boolean(editingEmployee)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingEmployee(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Modifier le rattachement RH
            </DialogTitle>

            <DialogDescription>
              Cette modification agit sur le référentiel RH
              du collaborateur.
            </DialogDescription>
          </DialogHeader>

          {editingEmployee && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="font-medium">
                  {getFullName(editingEmployee)}
                </p>

                <p className="text-sm text-muted-foreground">
                  {editingEmployee.email}
                </p>
              </div>


              <div className="space-y-2">
                <Label>
                  Type de collaborateur
                </Label>

                <Select
                  value={
                    editingEmployee.collaborator_type
                  }
                  onValueChange={(value) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      collaborator_type:
                        value as CollaboratorType,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="internal">
                      Interne
                    </SelectItem>

                    <SelectItem value="external">
                      Externe
                    </SelectItem>

                    <SelectItem value="provider">
                      Prestataire
                    </SelectItem>

                    <SelectItem value="consultant">
                      Consultant
                    </SelectItem>

                    <SelectItem value="apprentice">
                      Alternant
                    </SelectItem>

                    <SelectItem value="intern">
                      Stagiaire
                    </SelectItem>

                    <SelectItem value="other">
                      Autre
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>


              <div className="space-y-2">
                <Label>
                  Statut RH
                </Label>

                <Select
                  value={
                    editingEmployee.hr_status
                  }
                  onValueChange={(value) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      hr_status:
                        value as HrStatus,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="active">
                      Actif
                    </SelectItem>

                    <SelectItem value="onboarding">
                      En onboarding
                    </SelectItem>

                    <SelectItem value="leave">
                      En congé
                    </SelectItem>

                    <SelectItem value="suspended">
                      Suspendu
                    </SelectItem>

                    <SelectItem value="leaving">
                      Sortant
                    </SelectItem>

                    <SelectItem value="archived">
                      Archivé
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setEditingEmployee(null)
              }
            >
              Annuler
            </Button>

            <Button
              onClick={handleSave}
              disabled={updateEmployee.isPending}
            >
              {updateEmployee.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
