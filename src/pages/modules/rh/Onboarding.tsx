import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  History,
  UserPlus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

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

import { poles as allPoles } from '@/data/poles';
import { useAuth } from '@/hooks/useAuth';

import {
  COLLABORATOR_TYPE_LABELS,
  CollaboratorType,
  HR_STATUS,
  HR_STEPS,
  HrEmployeeRequest,
  useHrEmployeeRequests,
  useHrOnboardingActions,
  useHrRequestEvents,
} from '@/hooks/useHrOnboarding';

const POSITIONS = [
  'supplier_manager',
  'customer_success_manager',
  'ops_logistics_manager',
  'finance_manager',
  'audit_compliance_lead',
  'rse_impact_manager',
  'product_engineering_manager',
  'marketing_communication_manager',
  'rh_manager',
  'data_bi_manager',
  'security_it_manager',
  'ceo',
];

const ROLES = [
  'viewer',
  'operator',
  'analyst',
  'manager',
  'executive',
  'admin',
];

const SENIORITIES = [
  'junior',
  'mid',
  'senior',
  'lead',
  'executive',
];

const COLLABORATOR_TYPES: CollaboratorType[] = [
  'internal',
  'external',
  'provider',
  'consultant',
  'apprentice',
  'intern',
  'other',
];

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

const ROLE_LABELS: Record<string, string> = {
  viewer: 'Consultation',
  operator: 'Opérateur',
  analyst: 'Analyste',
  manager: 'Manager',
  executive: 'Direction',
  admin: 'Administrateur',
};

const SENIORITY_LABELS: Record<string, string> = {
  junior: 'Junior',
  mid: 'Confirmé',
  senior: 'Senior',
  lead: 'Lead',
  executive: 'Direction',
};

const poleLabel = (id: string) =>
  allPoles.find((pole) => pole.id === id)?.shortName ?? id;

const positionLabel = (position: string | null) =>
  position ? POSITION_LABELS[position] ?? position : '—';

const roleLabel = (role: string) =>
  ROLE_LABELS[role] ?? role;

const seniorityLabel = (seniority: string) =>
  SENIORITY_LABELS[seniority] ?? seniority;

const collaboratorTypeLabel = (
  type: CollaboratorType | null | undefined,
) =>
  type
    ? COLLABORATOR_TYPE_LABELS[type] ?? type
    : '—';

function NewEmployeeDialog() {
  const [open, setOpen] = useState(false);

  const { create } = useHrOnboardingActions();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    personal_email: '',
    work_email: '',
    collaborator_type: 'internal' as CollaboratorType,
    position: 'ops_logistics_manager',
    seniority: 'junior',
    requested_role: 'viewer',
    contract_type: 'CDI',
    start_date: '',
    notes: '',
  });

  const [poles, setPoles] = useState<string[]>([]);

  const resetForm = () => {
    setForm({
      first_name: '',
      last_name: '',
      personal_email: '',
      work_email: '',
      collaborator_type: 'internal',
      position: 'ops_logistics_manager',
      seniority: 'junior',
      requested_role: 'viewer',
      contract_type: 'CDI',
      start_date: '',
      notes: '',
    });

    setPoles([]);
  };

  const submit = async () => {
    await create.mutateAsync({
      ...form,
      start_date: form.start_date || null,
      poles,
    } as Partial<HrEmployeeRequest>);

    setOpen(false);
    resetForm();
  };

  const valid =
    form.first_name.trim() &&
    form.last_name.trim() &&
    (form.work_email.trim() ||
      form.personal_email.trim()) &&
    poles.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Nouveau collaborateur
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Créer un dossier collaborateur
          </DialogTitle>

          <DialogDescription>
            Les RH définissent l'identité, le type de
            collaborateur, l'affectation et les besoins
            d'accès. Le compte n'est créé qu'après validation
            RH.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Identité
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prénom</Label>

                <Input
                  value={form.first_name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      first_name: event.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>Nom</Label>

                <Input
                  value={form.last_name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      last_name: event.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>Email personnel</Label>

                <Input
                  type="email"
                  value={form.personal_email}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      personal_email: event.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>Email professionnel</Label>

                <Input
                  type="email"
                  value={form.work_email}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      work_email: event.target.value,
                    })
                  }
                  placeholder="prenom@brand-in-a-box.space"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Classification RH
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type de collaborateur</Label>

                <Select
                  value={form.collaborator_type}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      collaborator_type:
                        value as CollaboratorType,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {COLLABORATOR_TYPES.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                      >
                        {COLLABORATOR_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="mt-1 text-xs text-muted-foreground">
                  Cette classification reste attachée au
                  profil RH du collaborateur.
                </p>
              </div>

              <div>
                <Label>Type de contrat</Label>

                <Input
                  value={form.contract_type}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      contract_type:
                        event.target.value,
                    })
                  }
                  placeholder="CDI, CDD, prestation..."
                />
              </div>

              <div>
                <Label>Niveau</Label>

                <Select
                  value={form.seniority}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      seniority: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {SENIORITIES.map((seniority) => (
                      <SelectItem
                        key={seniority}
                        value={seniority}
                      >
                        {seniorityLabel(seniority)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date d'entrée</Label>

                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      start_date:
                        event.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Affectation
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Poste / fonction</Label>

                <Select
                  value={form.position}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      position: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {POSITIONS.map((position) => (
                      <SelectItem
                        key={position}
                        value={position}
                      >
                        {positionLabel(position)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Rôle applicatif demandé</Label>

                <Select
                  value={form.requested_role}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      requested_role: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem
                        key={role}
                        value={role}
                      >
                        {roleLabel(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <Label>Pôles d'affectation</Label>

              <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-border p-3">
                {allPoles.map((pole) => (
                  <label
                    key={pole.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={poles.includes(pole.id)}
                      onCheckedChange={(checked) =>
                        setPoles((previous) =>
                          checked
                            ? previous.includes(pole.id)
                              ? previous
                              : [...previous, pole.id]
                            : previous.filter(
                                (id) =>
                                  id !== pole.id,
                              ),
                        )
                      }
                    />

                    {pole.shortName}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <Label>Notes RH</Label>

            <Textarea
              rows={3}
              value={form.notes}
              onChange={(event) =>
                setForm({
                  ...form,
                  notes: event.target.value,
                })
              }
              placeholder="Informations utiles au traitement du dossier..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
          >
            Annuler
          </Button>

          <Button
            onClick={submit}
            disabled={!valid || create.isPending}
          >
            {create.isPending && (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            )}

            Soumettre le dossier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestSheet({
  request,
  canValidate,
  canProvision,
  onClose,
}: {
  request: HrEmployeeRequest;
  canValidate: boolean;
  canProvision: boolean;
  onClose: () => void;
}) {
  const events = useHrRequestEvents(request.id);

  const {
    setStatus,
    provisionAccount,
  } = useHrOnboardingActions();

  const [reason, setReason] = useState('');

  const statusConfig = HR_STATUS[request.status];

  const step = statusConfig.step;

  return (
    <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="flex flex-wrap items-center gap-2">
          {request.reference}

          <Badge variant={statusConfig.variant}>
            {statusConfig.label}
          </Badge>
        </SheetTitle>

        <SheetDescription>
          {request.first_name} {request.last_name} ·{' '}
          {collaboratorTypeLabel(
            request.collaborator_type,
          )}{' '}
          · {positionLabel(request.position)}
        </SheetDescription>
      </SheetHeader>

      <div className="mt-4 space-y-4">
        <div>
          <Progress
            value={
              (step / (HR_STEPS.length - 1)) * 100
            }
          />

          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            {HR_STEPS.map((stepLabel) => (
              <span key={stepLabel}>
                {stepLabel}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Classification RH
          </p>

          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <p>
              <span className="text-muted-foreground">
                Type :
              </span>{' '}
              <Badge variant="secondary">
                {collaboratorTypeLabel(
                  request.collaborator_type,
                )}
              </Badge>
            </p>

            <p>
              <span className="text-muted-foreground">
                Contrat :
              </span>{' '}
              {request.contract_type ?? '—'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <p>
            <span className="text-muted-foreground">
              Email pro :
            </span>{' '}
            {request.work_email ?? '—'}
          </p>

          <p>
            <span className="text-muted-foreground">
              Email perso :
            </span>{' '}
            {request.personal_email ?? '—'}
          </p>

          <p>
            <span className="text-muted-foreground">
              Poste :
            </span>{' '}
            {positionLabel(request.position)}
          </p>

          <p>
            <span className="text-muted-foreground">
              Rôle :
            </span>{' '}
            {roleLabel(request.requested_role)}
          </p>

          <p>
            <span className="text-muted-foreground">
              Niveau :
            </span>{' '}
            {seniorityLabel(request.seniority)}
          </p>

          <p>
            <span className="text-muted-foreground">
              Entrée :
            </span>{' '}
            {request.start_date ?? '—'}
          </p>

          <p className="col-span-2">
            <span className="text-muted-foreground">
              Pôles :
            </span>{' '}
            {(request.poles ?? [])
              .map(poleLabel)
              .join(', ') || '—'}
          </p>
        </div>

        {request.notes && (
          <p className="rounded-md border border-border p-3 text-xs text-muted-foreground">
            {request.notes}
          </p>
        )}

        {request.rejection_reason && (
          <p className="rounded-md border border-destructive/40 p-3 text-xs text-destructive">
            Refus : {request.rejection_reason}
          </p>
        )}

        {(canValidate || canProvision) &&
          request.status !== 'completed' && (
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </p>

              <Textarea
                className="mt-2"
                rows={2}
                placeholder="Motif (obligatoire pour un refus)"
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
              />

              <div className="mt-2 flex flex-wrap gap-2">
                {canValidate &&
                  request.status === 'submitted' && (
                    <Button
                      size="sm"
                      onClick={() =>
                        setStatus.mutate({
                          request,
                          status: 'hr_validated',
                        })
                      }
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Valider (RH)
                    </Button>
                  )}

                {canProvision &&
                  request.status === 'hr_validated' && (
                    <Button
                      size="sm"
                      disabled={
                        provisionAccount.isPending
                      }
                      onClick={() =>
                        provisionAccount.mutate(request)
                      }
                    >
                      {provisionAccount.isPending ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                      )}

                      Créer compte & accès
                    </Button>
                  )}

                {(canValidate || canProvision) && (
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={!reason.trim()}
                    onClick={() =>
                      setStatus.mutate({
                        request,
                        status: 'rejected',
                        reason,
                      })
                    }
                  >
                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                    Refuser
                  </Button>
                )}
              </div>
            </div>
          )}

        <Separator />

        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <History className="h-3.5 w-3.5" />
            Historique
          </p>

          <div className="mt-2 space-y-1.5">
            {(events.data ?? []).map((event) => (
              <div
                key={event.id}
                className="text-xs"
              >
                <span className="text-muted-foreground">
                  {format(
                    new Date(event.created_at),
                    'dd/MM HH:mm',
                    {
                      locale: fr,
                    },
                  )}{' '}
                  ·{' '}
                </span>

                <span className="font-medium">
                  {event.actor_name}
                </span>{' '}
                — {event.action}

                {event.note && (
                  <span className="text-muted-foreground">
                    {' '}
                    ({event.note})
                  </span>
                )}
              </div>
            ))}

            {!events.data?.length && (
              <p className="text-sm text-muted-foreground">
                Aucun événement.
              </p>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full"
          onClick={onClose}
        >
          Fermer
        </Button>
      </div>
    </SheetContent>
  );
}

export default function Onboarding() {
  const { profile } = useAuth();

  const userPoles = profile?.poles ?? [];

  const canValidate =
    userPoles.includes('rh') ||
    userPoles.includes('direction');

  const canProvision =
    userPoles.includes('direction') ||
    userPoles.includes('product') ||
    userPoles.includes('security');

  const {
    data: requests = [],
    isLoading,
  } = useHrEmployeeRequests();

  const [selected, setSelected] =
    useState<HrEmployeeRequest | null>(null);

  const kpis = useMemo(
    () => ({
      total: requests.length,

      toValidate: requests.filter(
        (request) =>
          request.status === 'submitted',
      ).length,

      toProvision: requests.filter(
        (request) =>
          request.status === 'hr_validated',
      ).length,

      done: requests.filter(
        (request) =>
          request.status === 'completed',
      ).length,
    }),
    [requests],
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            Onboarding RH — intégration collaborateur
          </h1>

          <p className="text-sm text-muted-foreground">
            Création du dossier, classification RH,
            validation, provisionnement du compte et
            traçabilité complète.
          </p>
        </div>

        {canValidate && <NewEmployeeDialog />}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Dossiers',
            value: kpis.total,
          },
          {
            label: 'À valider (RH)',
            value: kpis.toValidate,
          },
          {
            label: 'Comptes à créer',
            value: kpis.toProvision,
          },
          {
            label: 'Intégrations terminées',
            value: kpis.done,
          },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {kpi.label}
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {kpi.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Dossiers d'intégration
          </CardTitle>

          <CardDescription>
            Le dossier RH précède toujours la création
            du profil applicatif.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Référence
                    </TableHead>

                    <TableHead>
                      Collaborateur
                    </TableHead>

                    <TableHead>
                      Type
                    </TableHead>

                    <TableHead>
                      Poste
                    </TableHead>

                    <TableHead>
                      Pôles
                    </TableHead>

                    <TableHead>
                      Statut
                    </TableHead>

                    <TableHead>
                      Créé le
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {requests.map((request) => (
                    <TableRow
                      key={request.id}
                      className="cursor-pointer"
                      onClick={() =>
                        setSelected(request)
                      }
                    >
                      <TableCell className="font-medium">
                        {request.reference}
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {request.first_name}{' '}
                            {request.last_name}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {request.work_email ??
                              request.personal_email ??
                              '—'}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary">
                          {collaboratorTypeLabel(
                            request.collaborator_type,
                          )}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {positionLabel(
                          request.position,
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex max-w-[220px] flex-wrap gap-1">
                          {(request.poles ?? []).map(
                            (pole) => (
                              <Badge
                                key={pole}
                                variant="outline"
                                className="text-[10px]"
                              >
                                {poleLabel(pole)}
                              </Badge>
                            ),
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            HR_STATUS[
                              request.status
                            ].variant
                          }
                        >
                          {
                            HR_STATUS[
                              request.status
                            ].label
                          }
                        </Badge>
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(
                          new Date(
                            request.created_at,
                          ),
                          'dd/MM/yyyy',
                          {
                            locale: fr,
                          },
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                  {!requests.length && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        Aucun dossier
                        d'onboarding.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <RequestSheet
          request={selected}
          canValidate={canValidate}
          canProvision={canProvision}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
