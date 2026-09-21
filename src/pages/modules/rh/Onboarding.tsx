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

const POSITION_LABELS: Record<string, string> = {
  supplier_manager: 'Responsable Fournisseurs & Produits',
  customer_success_manager: 'Responsable Marketplace & Customer Success',
  ops_logistics_manager: 'Responsable Opérations & Logistique',
  finance_manager: 'Responsable Finance',
  audit_compliance_lead: 'Responsable Qualité, Audit & Conformité',
  rse_impact_manager: 'Responsable RSE & Impact',
  product_engineering_manager: 'Responsable Product & Engineering',
  marketing_communication_manager: 'Responsable Marketing & Communication',
  rh_manager: 'Responsable RH',
  data_bi_manager: 'Responsable Data & BI',
  security_it_manager: 'Responsable Security & IT',
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

function NewEmployeeDialog() {
  const [open, setOpen] = useState(false);
  const { create } = useHrOnboardingActions();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    personal_email: '',
    work_email: '',
    position: 'ops_logistics_manager',
    seniority: 'junior',
    requested_role: 'viewer',
    contract_type: 'CDI',
    start_date: '',
    notes: '',
  });

  const [poles, setPoles] = useState<string[]>([]);

  const submit = async () => {
    await create.mutateAsync({
      ...form,
      start_date: form.start_date || null,
      poles,
    } as Partial<HrEmployeeRequest>);

    setOpen(false);
    setPoles([]);
  };

  const valid =
    form.first_name.trim() &&
    form.last_name.trim() &&
    (form.work_email.trim() || form.personal_email.trim()) &&
    poles.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Nouveau collaborateur
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dossier collaborateur</DialogTitle>
          <DialogDescription>
            Créé par les RH, validé en interne, puis transmis au pôle
            habilité pour la création du compte et des accès.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
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

            <div>
              <Label>Poste</Label>
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
                    <SelectItem key={position} value={position}>
                      {positionLabel(position)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <SelectItem key={seniority} value={seniority}>
                      {seniorityLabel(seniority)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Rôle applicatif</Label>
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
                    <SelectItem key={role} value={role}>
                      {roleLabel(role)}
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
                    start_date: event.target.value,
                  })
                }
              />
            </div>
          </div>

          <div>
            <Label>Pôles d'affectation</Label>

            <div className="mt-2 grid grid-cols-2 gap-2">
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
                          ? [...previous, pole.id]
                          : previous.filter((id) => id !== pole.id),
                      )
                    }
                  />

                  {pole.shortName}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Notes RH</Label>

            <Textarea
              rows={2}
              value={form.notes}
              onChange={(event) =>
                setForm({
                  ...form,
                  notes: event.target.value,
                })
              }
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
            Soumettre
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
  const { setStatus, provisionAccount } = useHrOnboardingActions();
  const [reason, setReason] = useState('');

  const step = HR_STATUS[request.status].step;

  return (
    <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="flex flex-wrap items-center gap-2">
          {request.reference}

          <Badge variant={HR_STATUS[request.status].variant}>
            {HR_STATUS[request.status].label}
          </Badge>
        </SheetTitle>

        <SheetDescription>
          {request.first_name} {request.last_name} ·{' '}
          {positionLabel(request.position)}
        </SheetDescription>
      </SheetHeader>

      <div className="mt-4 space-y-4">
        <div>
          <Progress
            value={(step / (HR_STEPS.length - 1)) * 100}
          />

          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            {HR_STEPS.map((stepLabel) => (
              <span key={stepLabel}>{stepLabel}</span>
            ))}
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
              Contrat :
            </span>{' '}
            {request.contract_type ?? '—'}
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
            {(request.poles ?? []).map(poleLabel).join(', ') || '—'}
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
                onChange={(event) => setReason(event.target.value)}
              />

              <div className="mt-2 flex flex-wrap gap-2">
                {canValidate && request.status === 'submitted' && (
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
                      disabled={provisionAccount.isPending}
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
              <div key={event.id} className="text-xs">
                <span className="text-muted-foreground">
                  {format(
                    new Date(event.created_at),
                    'dd/MM HH:mm',
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
        (request) => request.status === 'submitted',
      ).length,
      toProvision: requests.filter(
        (request) => request.status === 'hr_validated',
      ).length,
      done: requests.filter(
        (request) => request.status === 'completed',
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
            Création du dossier, validation RH, création du compte,
            attribution du rôle et des accès, puis traçabilité complète.
          </p>
        </div>

        {canValidate && <NewEmployeeDialog />}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Dossiers', value: kpis.total },
          { label: 'À valider (RH)', value: kpis.toValidate },
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
          <CardTitle className="text-base">
            Dossiers en cours
          </CardTitle>

          <CardDescription>
            {HR_STEPS.join(' → ')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucun dossier collaborateur.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Réf.</TableHead>
                  <TableHead>Collaborateur</TableHead>
                  <TableHead>Pôles</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-xs">
                      {request.reference}
                    </TableCell>

                    <TableCell>
                      {request.first_name} {request.last_name}
                    </TableCell>

                    <TableCell className="text-xs">
                      {(request.poles ?? [])
                        .map(poleLabel)
                        .join(', ') || '—'}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          HR_STATUS[request.status].variant
                        }
                      >
                        {HR_STATUS[request.status].label}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {format(
                        new Date(request.created_at),
                        'dd MMM yyyy',
                        { locale: fr },
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelected(request)}
                      >
                        Ouvrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
