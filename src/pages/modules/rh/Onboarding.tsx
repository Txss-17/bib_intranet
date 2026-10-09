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
  AlertCircle,
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
  Sheet,
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
  HrAccessRole,
  HrEmployeeRequest,
  useHrAccessRoles,
  useHrEmployeeRequests,
  useHrOnboardingActions,
  useHrReferents,
  useHrRequestEvents,
  useHrPositionCatalog,
} from '@/hooks/useHrOnboarding';

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
  data_bi_manager:
    'Responsable Data & BI',
  security_it_manager:
    'Responsable Security & IT',
  ceo: 'Direction',
};

const SENIORITIES = [
  'junior',
  'mid',
  'senior',
  'lead',
  'executive',
];

const SENIORITY_LABELS: Record<string, string> = {
  junior: 'Junior',
  mid: 'Confirmé',
  senior: 'Senior',
  lead: 'Lead',
  executive: 'Direction',
};

const COLLABORATOR_TYPES: CollaboratorType[] = [
  'internal',
  'external',
  'provider',
  'consultant',
  'apprentice',
  'intern',
  'other',
];

const poleLabel = (id: string) =>
  allPoles.find((pole) => pole.id === id)?.shortName ?? id;

const positionLabel = (position: string | null) =>
  position && position in POSITION_LABELS
    ? POSITION_LABELS[position]
    : position ?? '—';

const seniorityLabel = (seniority: string) =>
  SENIORITY_LABELS[seniority] ?? seniority;

const collaboratorTypeLabel = (
  type: CollaboratorType | null | undefined,
) =>
  type
    ? COLLABORATOR_TYPE_LABELS[type] ?? type
    : '—';

const employeeName = (
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallback = '—',
) =>
  [firstName, lastName]
    .filter(Boolean)
    .join(' ')
    .trim() || fallback;

function NewEmployeeDialog() {
  const [open, setOpen] = useState(false);

  const { create } = useHrOnboardingActions();

  const {
    data: referents = [],
    isLoading: referentsLoading,
    isError: referentsError,
  } = useHrReferents();

  const [primaryPole, setPrimaryPole] = useState('ops');

  const {
    data: positionCatalog = [],
    isLoading: positionsLoading,
    isError: positionsError,
  } = useHrPositionCatalog(primaryPole);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    personal_email: '',
    work_email: '',
    collaborator_type: 'internal' as CollaboratorType,
    position: '',
    seniority: 'junior',
    requested_role: '',
    contract_type: 'CDI',
    start_date: '',
    notes: '',
    manager_id: '',
  });

  const [poles, setPoles] = useState<string[]>([
    '',
  ]);

  const requiredPole = primaryPole;

  const {
    data: accessRoles = [],
    isLoading: rolesLoading,
    isError: rolesError,
  } = useHrAccessRoles(poles);

  const compatibleRoles = useMemo(
    () =>
      accessRoles.filter(
        (role) =>
          !role.business_pole ||
          poles.includes(role.business_pole),
      ),
    [accessRoles, poles],
  );

  const resetForm = () => {
    setForm({
      first_name: '',
      last_name: '',
      personal_email: '',
      work_email: '',
      collaborator_type: 'internal',
      position: '',
      seniority: 'junior',
      requested_role: '',
      contract_type: 'CDI',
      start_date: '',
      notes: '',
      manager_id: '',
    });

    setPrimaryPole('Choisir un pôle');
    setPoles(['Choisir un pôle']);
  };

  const togglePole = (poleId: string) => {
    if (poleId === requiredPole) {
      return;
    }

    setPoles((previous) =>
      previous.includes(poleId)
        ? previous.filter((id) => id !== poleId)
        : [...previous, poleId],
    );

    setForm((previous) => ({
      ...previous,
      requested_role: '',
    }));
  };

  const submit = async () => {
    await create.mutateAsync({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      personal_email:
        form.personal_email.trim() || null,
      work_email:
        form.work_email.trim() || null,
      collaborator_type:
        form.collaborator_type,
      position: form.position,
      poles,
      seniority: form.seniority,
      requested_role: form.requested_role,
      contract_type:
        form.contract_type.trim() || null,
      start_date:
        form.start_date || null,
      manager_id:
        form.manager_id || null,
      notes:
        form.notes.trim() || null,
    });

    setOpen(false);
    resetForm();
  };

  const valid =
    form.first_name.trim().length > 0 &&
    form.last_name.trim().length > 0 &&
    Boolean(
      form.work_email.trim() ||
        form.personal_email.trim(),
    ) &&
    Boolean(form.position) &&
    poles.length > 0 &&
    poles.includes(requiredPole) &&
    Boolean(form.requested_role) &&
    Boolean(form.manager_id);

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

      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Créer un dossier collaborateur
          </DialogTitle>

          <DialogDescription>
            Les RH définissent l'identité, la classification,
            l'affectation, le référent et le besoin d'accès.
            Le compte applicatif n'est créé qu'après validation
            RH.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* IDENTITÉ */}
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Identité
            </p>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label>Prénom</Label>
                <Input
                  value={form.first_name}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      first_name:
                        event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label>Nom</Label>
                <Input
                  value={form.last_name}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      last_name:
                        event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label>Email personnel</Label>
                <Input
                  type="email"
                  value={form.personal_email}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      personal_email:
                        event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label>Email professionnel</Label>
                <Input
                  type="email"
                  value={form.work_email}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      work_email:
                        event.target.value,
                    }))
                  }
                  placeholder="prenom@brand-in-a-box.space"
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* CLASSIFICATION */}
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Classification RH
            </p>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label>
                  Type de collaborateur
                </Label>

                <Select
                  value={form.collaborator_type}
                  onValueChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      collaborator_type:
                        value as CollaboratorType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {COLLABORATOR_TYPES.map(
                      (type) => (
                        <SelectItem
                          key={type}
                          value={type}
                        >
                          {
                            COLLABORATOR_TYPE_LABELS[
                              type
                            ]
                          }
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Type de contrat</Label>

                <Select
                  value={form.contract_type}
                  onValueChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      contract_type: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un contrat" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="CDI">CDI</SelectItem>
                    <SelectItem value="CDD">CDD</SelectItem>
                    <SelectItem value="Alternance">Alternance</SelectItem>
                    <SelectItem value="Stage">Stage</SelectItem>
                    <SelectItem value="Prestation">Prestation</SelectItem>
                    <SelectItem value="Bénévolat">Bénévolat / volontariat</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Niveau</Label>

                <Select
                  value={form.seniority}
                  onValueChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      seniority: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un niveau" />
                  </SelectTrigger>

                  <SelectContent>
                    {SENIORITIES.map((seniority) => (
                      <SelectItem
                        key={seniority}
                        value={seniority}
                      >
                        {SENIORITY_LABELS[seniority]}
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
                    setForm((previous) => ({
                      ...previous,
                      start_date:
                        event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </section>

          <Separator />


          {/* AFFECTATION */}
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Affectation
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label>Pôle principal</Label>

                <Select
                  value={primaryPole}
                  onValueChange={(value) => {
                    setPrimaryPole(value);
                    setPoles([value]);
                    setForm((previous) => ({
                      ...previous,
                      position: '',
                      requested_role: '',
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un pôle" />
                  </SelectTrigger>

                  <SelectContent>
                    {allPoles.map((pole) => (
                      <SelectItem key={pole.id} value={pole.id}>
                        {pole.shortName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Poste / fonction</Label>

                <Select
                  value={form.position}
                  onValueChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      position: value,
                      requested_role: '',
                    }))
                  }
                  disabled={!primaryPole || positionsLoading || positionsError || positionCatalog.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        positionsLoading
                          ? 'Chargement des postes…'
                          : 'Choisir un poste'
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {positionCatalog.map((position) => (
                      <SelectItem
                        key={position.id}
                        value={position.position_key}
                      >
                        {position.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {positionsError && (
                  <p className="mt-1 text-xs text-destructive">
                    Impossible de charger le catalogue des postes.
                  </p>
                )}

                {!positionsLoading &&
                  !positionsError &&
                  positionCatalog.length === 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Aucun poste actif pour ce pôle. Le catalogue RH doit être complété.
                    </p>
                  )}
              </div>
            </div>
          </section>

          <Separator />

          {/* RÉFÉRENT RH */}
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Référent RH
            </p>

            {referentsError ? (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Impossible de charger les référents
                  RH.
                </span>
              </div>
            ) : (
              <Select
                value={form.manager_id}
                onValueChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    manager_id: value,
                  }))
                }
                disabled={referentsLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      referentsLoading
                        ? 'Chargement des référents...'
                        : 'Sélectionner un référent RH'
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {referents.map((referent) => (
                    <SelectItem
                      key={referent.id}
                      value={referent.id}
                    >
                      {employeeName(
                        referent.first_name,
                        referent.last_name,
                      )}{' '}
                      — {referent.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {!referentsLoading &&
              !referentsError &&
              referents.length === 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Aucun responsable RH actif ou en
                  onboarding n'est actuellement
                  disponible comme référent.
                </p>
              )}
          </section>

          <Separator />

          {/* ACCÈS */}
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Accès applicatif
            </p>

            {rolesError ? (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Impossible de charger le catalogue
                  des rôles d'accès.
                </span>
              </div>
            ) : (
              <Select
                value={form.requested_role}
                onValueChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    requested_role: value,
                  }))
                }
                disabled={
                  rolesLoading ||
                  compatibleRoles.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      rolesLoading
                        ? 'Chargement des accès...'
                        : 'Sélectionner un rôle d’accès'
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {compatibleRoles.map(
                    (role) => (
                      <SelectItem
                        key={role.id}
                        value={role.role_key}
                      >
                        <RoleOption
                          role={role}
                        />
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            )}

            {!rolesLoading &&
              !rolesError &&
              compatibleRoles.length === 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Aucun rôle actif compatible avec les
                  pôles sélectionnés.
                </p>
              )}

            <p className="mt-2 text-xs text-muted-foreground">
              Le rôle provient du catalogue RBAC
              <code className="mx-1">
                access_roles
              </code>
              et non de l'ancien système
              viewer/operator/manager.
            </p>
          </section>

          <Separator />

          {/* NOTES */}
          <section>
            <Label>Notes RH</Label>

            <Textarea
              rows={3}
              value={form.notes}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  notes: event.target.value,
                }))
              }
              placeholder="Informations utiles au traitement du dossier..."
            />
          </section>
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
            disabled={
              !valid ||
              create.isPending ||
              referentsLoading ||
              rolesLoading
            }
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

function RoleOption({
  role,
}: {
  role: HrAccessRole;
}) {
  return (
    <span>
      {role.label}

      {role.business_pole && (
        <span className="ml-2 text-xs text-muted-foreground">
          · {poleLabel(role.business_pole)}
        </span>
      )}
    </span>
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
  const events = useHrRequestEvents(
    request.id,
  );

  const {
    setStatus,
    provisionAccount,
  } = useHrOnboardingActions();

  const [reason, setReason] = useState('');

  const statusConfig =
    HR_STATUS[request.status];

  const step = statusConfig.step;

  const referentQuery = useHrReferents();

  const referent = referentQuery.data?.find(
    (item) =>
      item.id === request.manager_id,
  );

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            {request.reference}

            <Badge
              variant={statusConfig.variant}
            >
              {statusConfig.label}
            </Badge>
          </SheetTitle>

          <SheetDescription>
            {request.first_name}{' '}
            {request.last_name} ·{' '}
            {collaboratorTypeLabel(
              request.collaborator_type,
            )}{' '}
            · {positionLabel(request.position)}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {/* PROGRESSION */}
          <div>
            <Progress
              value={
                (step /
                  (HR_STEPS.length - 1)) *
                100
              }
            />

            <div className="mt-1 flex justify-between gap-1 text-[10px] text-muted-foreground">
              {HR_STEPS.map(
                (stepLabel) => (
                  <span
                    key={stepLabel}
                    className="text-center"
                  >
                    {stepLabel}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* IDENTITÉ */}
          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">
                Nom :
              </span>{' '}
              {request.first_name}{' '}
              {request.last_name}
            </p>

            <p>
              <span className="text-muted-foreground">
                Type :
              </span>{' '}
              {collaboratorTypeLabel(
                request.collaborator_type,
              )}
            </p>

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
              {positionLabel(
                request.position,
              )}
            </p>

            <p>
              <span className="text-muted-foreground">
                Niveau :
              </span>{' '}
              {seniorityLabel(
                request.seniority,
              )}
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
          </div>

          <Separator />

          {/* AFFECTATION */}
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Affectation
            </p>

            <div className="mt-2 flex flex-wrap gap-1">
              {(request.poles ?? []).map(
                (pole) => (
                  <Badge
                    key={pole}
                    variant="secondary"
                  >
                    {poleLabel(pole)}
                  </Badge>
                ),
              )}
            </div>
          </div>

          {/* RÉFÉRENT */}
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Référent RH
            </p>

            <p className="mt-2 text-sm">
              {referent
                ? employeeName(
                    referent.first_name,
                    referent.last_name,
                  )
                : request.manager_id
                  ? 'Référent non retrouvé'
                  : 'Aucun référent'}
            </p>

            {referent && (
              <p className="text-xs text-muted-foreground">
                {referent.email}
              </p>
            )}
          </div>

          {/* ACCÈS */}
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Accès demandé
            </p>

            <p className="mt-2 text-sm font-medium">
              {request.requested_role}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              L'accès effectif est provisionné après
              validation RH via le catalogue RBAC.
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

          {/* ACTIONS */}
          {(canValidate ||
            canProvision) &&
            request.status !==
              'completed' && (
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </p>

                <Textarea
                  className="mt-2"
                  rows={2}
                  placeholder="Motif obligatoire pour un refus"
                  value={reason}
                  onChange={(event) =>
                    setReason(
                      event.target.value,
                    )
                  }
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  {canValidate &&
                    request.status ===
                      'submitted' && (
                      <Button
                        size="sm"
                        disabled={
                          setStatus.isPending
                        }
                        onClick={() =>
                          setStatus.mutate({
                            request,
                            status:
                              'hr_validated',
                          })
                        }
                      >
                        {setStatus.isPending ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        )}

                        Valider RH
                      </Button>
                    )}

                  {canProvision &&
                    request.status ===
                      'hr_validated' && (
                      <Button
                        size="sm"
                        disabled={
                          provisionAccount.isPending
                        }
                        onClick={() =>
                          provisionAccount.mutate(
                            request,
                          )
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

                  {(canValidate ||
                    canProvision) && (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={
                        !reason.trim() ||
                        setStatus.isPending
                      }
                      onClick={() =>
                        setStatus.mutate({
                          request,
                          status:
                            'rejected',
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

          {/* HISTORIQUE */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <History className="h-3.5 w-3.5" />
              Historique
            </p>

            <div className="mt-2 space-y-2">
              {(events.data ?? []).map(
                (event) => (
                  <div
                    key={event.id}
                    className="text-xs"
                  >
                    <span className="text-muted-foreground">
                      {format(
                        new Date(
                          event.created_at,
                        ),
                        'dd/MM HH:mm',
                        {
                          locale: fr,
                        },
                      )}{' '}
                      ·{' '}
                    </span>

                    <span className="font-medium">
                      {event.actor_name ??
                        'Utilisateur'}
                    </span>

                    {' — '}

                    {event.action}

                    {event.note && (
                      <span className="text-muted-foreground">
                        {' '}
                        ({event.note})
                      </span>
                    )}
                  </div>
                ),
              )}

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
    </Sheet>
  );
}

export default function Onboarding() {
  const { profile } = useAuth();

  const userPoles = profile?.poles ?? [];

  const canValidate = userPoles.includes('rh');

  const canProvision = userPoles.includes('rh');

  const {
    data: requests = [],
    isLoading,
    isError,
  } = useHrEmployeeRequests();

  const [selected, setSelected] =
    useState<HrEmployeeRequest | null>(
      null,
    );

  const kpis = useMemo(
    () => ({
      total: requests.length,

      toValidate: requests.filter(
        (request) =>
          request.status === 'submitted',
      ).length,

      toProvision: requests.filter(
        (request) =>
          request.status ===
          'hr_validated',
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
            Onboarding RH
          </h1>

          <p className="text-sm text-muted-foreground">
            Dossier collaborateur, affectation,
            référent RH, validation et provisionnement
            des accès.
          </p>
        </div>

        {canValidate && (
          <NewEmployeeDialog />
        )}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Dossiers
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {kpis.total}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              À valider
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {kpis.toValidate}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Comptes à créer
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {kpis.toProvision}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Terminés
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {kpis.done}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>
            Dossiers d'intégration
          </CardTitle>

          <CardDescription>
            Le dossier RH précède toujours la création
            du profil applicatif et des accès.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : isError ? (
            <div className="flex items-center gap-2 rounded-md border border-destructive/40 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              Impossible de charger les dossiers
              d'onboarding.
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
                      Poste
                    </TableHead>

                    <TableHead>
                      Pôles
                    </TableHead>

                    <TableHead>
                      Référent RH
                    </TableHead>

                    <TableHead>
                      Accès
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
                  {requests.map(
                    (request) => (
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
                              {
                                request.first_name
                              }{' '}
                              {
                                request.last_name
                              }
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {request.work_email ??
                                request.personal_email ??
                                '—'}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          {positionLabel(
                            request.position,
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex max-w-[180px] flex-wrap gap-1">
                            {(
                              request.poles ??
                              []
                            ).map(
                              (pole) => (
                                <Badge
                                  key={pole}
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  {poleLabel(
                                    pole,
                                  )}
                                </Badge>
                              ),
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          {request.manager_id
                            ? 'Référent RH'
                            : '—'}
                        </TableCell>

                        <TableCell>
                          <span className="text-xs">
                            {
                              request.requested_role
                            }
                          </span>
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
                    ),
                  )}

                  {!requests.length && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
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
          onClose={() =>
            setSelected(null)
          }
        />
      )}
    </div>
  );
}
