import { useState } from 'react';
import { toast } from 'sonner';
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
  Search,
  Plus,
  Mail,
  Edit,
  Trash2,
  Loader2,
  UserPlus,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import {
  Link,
  useNavigate,
} from 'react-router-dom';
import { ExportButtons } from '@/components/ExportButtons';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from '@/hooks/useEmployees';

export default function Employees() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    pole: '',
    position: '',
    status: 'active',
    start_date: '',
  });

  const {
    data: employees = [],
    isLoading,
  } = useEmployees(searchTerm || undefined);

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const handleOpenForm = (employee?: any) => {
    if (employee) {
      setEditingEmployee(employee);

      setFormData({
        name: employee.name ?? '',
        email: employee.email ?? '',
        pole: employee.pole ?? '',
        position: employee.position ?? '',
        status: employee.status ?? 'active',
        start_date: employee.start_date ?? '',
      });
    } else {
      setEditingEmployee(null);

      setFormData({
        name: '',
        email: '',
        pole: '',
        position: '',
        status: 'active',
        start_date: '',
      });
    }

    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Le nom et l’email sont obligatoires.');
      return;
    }

    const data = {
      ...formData,
      start_date: formData.start_date || null,
      phone: null,
    };

    if (editingEmployee) {
      updateEmployee.mutate(
        {
          id: editingEmployee.id,
          ...data,
        },
        {
          onSuccess: () => {
            toast.success('Collaborateur modifié');
            setIsFormOpen(false);
          },
          onError: (error: any) => {
            toast.error(
              error?.message || 'Impossible de modifier le collaborateur.',
            );
          },
        },
      );

      return;
    }

    createEmployee.mutate(data as any, {
      onSuccess: () => {
        toast.success('Collaborateur ajouté');
        setIsFormOpen(false);
      },
      onError: (error: any) => {
        toast.error(
          error?.message || 'Impossible d’ajouter le collaborateur.',
        );
      },
    });
  };

  const handleDelete = (id: string) => {
    const confirmed = window.confirm(
      'Voulez-vous réellement supprimer ce collaborateur ?',
    );

    if (!confirmed) return;

    deleteEmployee.mutate(id, {
      onSuccess: () => {
        toast.success('Collaborateur supprimé');
      },
      onError: (error: any) => {
        toast.error(
          error?.message || 'Impossible de supprimer le collaborateur.',
        );
      },
    });
  };

  const handleContact = (employee: any) => {
    if (!employee.email) {
      toast.error('Aucune adresse email disponible.');
      return;
    }

    navigate('/modules/gateway/compose', {
      state: {
        to: employee.email,
        recipientName: employee.name,
        subject: `Contact RH — ${employee.name}`,
        message: `Bonjour ${employee.name},

Je vous contacte au nom du pôle RH de B.I.B.

Bien cordialement,
`,
      },
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Collaborateurs
          </h1>

          <p className="text-muted-foreground">
            Gestion des collaborateurs, de leurs comptes et de leurs affectations.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ExportButtons
            filename="collaborateurs"
            title="Liste des collaborateurs"
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
                header: 'Pôle',
                accessor: 'pole',
              },
              {
                header: 'Poste',
                accessor: 'position',
              },
              {
                header: 'Statut',
                accessor: 'status',
              },
              {
                header: "Date d'arrivée",
                accessor: 'start_date',
              },
            ]}
            data={employees}
          />

          <Button
            variant="outline"
            asChild
          >
            <Link to="/pole/rh/onboarding">
              <UserPlus className="mr-2 h-4 w-4" />
              Ajouter un dossier
            </Link>
          </Button>

          <Button onClick={() => handleOpenForm()}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un collaborateur
          </Button>
        </div>
      </div>

      {/* Accès & permissions */}
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
                Administration des comptes et des rôles
              </p>

              <p className="text-sm text-muted-foreground">
                Les rôles métier, leurs interfaces, leurs actions et leurs
                périmètres seront administrés dans l’espace dédié.
                RH pourra ensuite affecter ces rôles aux collaborateurs.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate('/admin/roles-permissions')}
            >
              <UserCog className="mr-2 h-4 w-4" />
              Accéder aux rôles & permissions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recherche */}
      <div className="flex items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Rechercher un collaborateur..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            className="pl-10"
          />
        </div>
      </div>

      {/* Liste */}
      <Card>
        <CardHeader>
          <CardTitle>
            Liste des collaborateurs ({employees.length})
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
                    Pôle
                  </TableHead>

                  <TableHead>
                    Poste
                  </TableHead>

                  <TableHead>
                    Rôle
                  </TableHead>

                  <TableHead>
                    Périmètre
                  </TableHead>

                  <TableHead>
                    Statut
                  </TableHead>

                  <TableHead>
                    Date d'arrivée
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
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {getInitials(employee.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <p className="font-medium">
                            {employee.name}
                          </p>

                          <p className="text-sm text-muted-foreground">
                            {employee.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Pôle */}
                    <TableCell>
                      <Badge variant="outline">
                        {employee.pole || 'Non affecté'}
                      </Badge>
                    </TableCell>

                    {/* Poste */}
                    <TableCell>
                      {employee.position || '—'}
                    </TableCell>

                    {/* Rôle */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          Non configuré
                        </Badge>
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Rôle géré dans Accès & permissions
                      </p>
                    </TableCell>

                    {/* Périmètre */}
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        Non configuré
                      </span>
                    </TableCell>

                    {/* Statut */}
                    <TableCell>
                      <Badge
                        variant={
                          employee.status === 'active'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {employee.status === 'active'
                          ? 'Actif'
                          : 'En congé'}
                      </Badge>
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      {employee.start_date
                        ? new Date(
                            employee.start_date,
                          ).toLocaleDateString('fr-FR')
                        : '—'}
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleOpenForm(employee)
                          }
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleContact(employee)
                          }
                          title="Contacter via Gateway"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() =>
                            handleDelete(employee.id)
                          }
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {employees.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Aucun collaborateur trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire collaborateur */}
      <Dialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEmployee
                ? 'Modifier le collaborateur'
                : 'Ajouter un collaborateur'}
            </DialogTitle>

            <DialogDescription>
              {editingEmployee
                ? 'Modifiez les informations administratives du collaborateur.'
                : 'Renseignez les informations administratives du collaborateur.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>
                Nom complet
              </Label>

              <Input
                value={formData.name}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    name: event.target.value,
                  })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>
                Email professionnel
              </Label>

              <Input
                type="email"
                value={formData.email}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    email: event.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>
                  Pôle
                </Label>

                <Select
                  value={formData.pole}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      pole: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Direction">
                      Direction
                    </SelectItem>

                    <SelectItem value="Finance">
                      Finance
                    </SelectItem>

                    <SelectItem value="Ops">
                      Ops
                    </SelectItem>

                    <SelectItem value="Supplier">
                      Supplier
                    </SelectItem>

                    <SelectItem value="Marketplace">
                      Marketplace
                    </SelectItem>

                    <SelectItem value="Support">
                      Support
                    </SelectItem>

                    <SelectItem value="Marketing">
                      Marketing
                    </SelectItem>

                    <SelectItem value="RH">
                      RH
                    </SelectItem>

                    <SelectItem value="Audit">
                      Audit
                    </SelectItem>

                    <SelectItem value="Compliance">
                      Compliance
                    </SelectItem>

                    <SelectItem value="RSE">
                      RSE
                    </SelectItem>

                    <SelectItem value="Product">
                      Product
                    </SelectItem>

                    <SelectItem value="Data">
                      Data
                    </SelectItem>

                    <SelectItem value="Security">
                      Security
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>
                  Fonction
                </Label>

                <Input
                  value={formData.position}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      position: event.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>
                  Statut
                </Label>

                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value,
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

                    <SelectItem value="leave">
                      En congé
                    </SelectItem>

                    <SelectItem value="inactive">
                      Inactif
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>
                  Date d'arrivée
                </Label>

                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      start_date: event.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Accès */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-muted-foreground" />

                <div>
                  <p className="font-medium">
                    Rôle et accès
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Le rôle métier et son périmètre ne sont pas encore
                    enregistrés sur ce formulaire. Ils seront gérés dans
                    le système central « Rôles & permissions » puis
                    affectés au compte par le pôle RH.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setIsFormOpen(false)
              }
            >
              Annuler
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={
                createEmployee.isPending ||
                updateEmployee.isPending
              }
            >
              {(createEmployee.isPending ||
                updateEmployee.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {editingEmployee
                ? 'Modifier'
                : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
