import { useEffect, useMemo, useRef, useState } from 'react';
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
  useHrOnboardingPermissions,
  useHrMutationTargets,
  useSubmitHrEmployeeMutation,
  useSetHrMutationStatus,
  useApplyHrEmployeeMutation,
  type HrMutationTarget,
} from '@/hooks/useHrEmployeeMutations';

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
  useCreateHrPosition,
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

function NewEmployeeDialog({ mutation = false }: { mutation?: boolean }) {
  const [open, setOpen] = useState(false);
  const [targetSearch, setTargetSearch] = useState('');
  const mutationTargets = useHrMutationTargets(targetSearch);
  const [selectedTarget, setSelectedTarget] = useState<HrMutationTarget | null>(null);
  const selectedTargetSource = useHrMutationTargets(selectedTarget?.email ?? '');
  const submitMutation = useSubmitHrEmployeeMutation();
  const allPositions = useHrPositionCatalog();
  const [targetId, setTargetId] = useState('');
  const [replacementIds, setReplacementIds] = useState<string[]>([]);
  const [mutationConfirmed, setMutationConfirmed] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const creationKey = useRef<string | null>(null);
  const targetRevision = useRef<string | null>(null);
  const targetIdentity = useRef<string | null>(null);
  const saving = useRef(false);
  const refreshedTarget = selectedTargetSource.data?.find((target) => target.id === targetId);
  const reviewedTarget = refreshedTarget ?? selectedTarget;
  const targetOptions = selectedTarget && !mutationTargets.data?.some((target) => target.id === selectedTarget.id)
    ? [selectedTarget, ...(mutationTargets.data ?? [])]
    : mutationTargets.data ?? [];

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
    work_mode: 'office',
    subsidiary: '',
  });

  const [attachedDocs, setAttachedDocs] = useState<
    { name: string; document_type: string; document_url: string | null }[]
  >([]);
  const [docDraft, setDocDraft] = useState({ name: '', document_type: 'charter', document_url: '' });

  const pending = create.isPending || submitMutation.isPending;

  const [poles, setPoles] = useState<string[]>(['ops']);

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
          (!role.business_pole || poles.includes(role.business_pole)) &&
          (!mutation || (!role.is_external && !role.role_key.startsWith('svc_') &&
            (role.poles ?? []).every((pole) => poles.includes(pole)))),
      ),
    [accessRoles, poles, mutation],
  );

  const selectedAccessRole = compatibleRoles.find((role) => role.role_key === form.requested_role);
  useEffect(() => {
    if (mutation && selectedAccessRole?.seniority && form.seniority !== selectedAccessRole.seniority)
      setForm((previous) => ({ ...previous, seniority: selectedAccessRole.seniority! }));
  }, [mutation, selectedAccessRole?.seniority, form.seniority]);

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
      work_mode: 'office',
      subsidiary: '',
    });
    setAttachedDocs([]);
    setDocDraft({ name: '', document_type: 'charter', document_url: '' });
    setTargetId('');
    setSelectedTarget(null);
    setReplacementIds([]);
    setMutationConfirmed(false);
    setSubmitError('');
    creationKey.current = null;
    targetRevision.current = null;
    targetIdentity.current = null;

    setPrimaryPole('');
    setPoles([]);
  };

  const fillMutationTarget = (target: HrMutationTarget) => {
    resetForm();
    setSelectedTarget(target);
    setTargetId(target.id);
    targetIdentity.current = target.id;
    creationKey.current = crypto.randomUUID();
    targetRevision.current = target.revision;
    const positionKey = target.position_key ?? target.position ?? '';
    const position = allPositions.data?.find((item) => item.position_key === positionKey);
    setForm({
      first_name: target.first_name ?? '', last_name: target.last_name ?? '',
      personal_email: '', work_email: target.email ?? '',
      collaborator_type: target.collaborator_type as CollaboratorType,
      position: positionKey, seniority: target.seniority ?? 'junior',
      requested_role: target.requested_role ?? '',
      contract_type: target.contract_type ?? '', start_date: target.start_date ?? '',
      notes: '', manager_id: target.manager_id ?? '',
      work_mode: target.work_mode ?? '', subsidiary: target.subsidiary ?? '',
    });
    setPrimaryPole(position?.pole_id ?? '');
    setPoles(target.poles ?? []);
    setAttachedDocs(target.attached_documents ?? []);
  };

  const selectMutationTarget = (id: string) => {
    const target = targetOptions.find((item) => item.id === id);
    if (target) fillMutationTarget(target);
  };
  const reloadMutationTarget = async () => {
    const id = targetId;
    try {
      const result = await selectedTargetSource.refetch();
      if (targetIdentity.current !== id) return;
      const target = result.data?.find((item) => item.id === id);
      if (result.error || !target) {
        setSubmitError('La fiche sélectionnée n’a pas pu être rechargée. Recherchez le collaborateur puis sélectionnez sa fiche actuelle.');
        return;
      }
      fillMutationTarget(target);
    } catch {
      if (targetIdentity.current === id)
        setSubmitError('La fiche n’a pas pu être rechargée. Votre saisie est conservée.');
    }
  };

  useEffect(() => {
    setMutationConfirmed(false);
  }, [form, poles, replacementIds, attachedDocs]);

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
    if (pending || saving.current) return;
    if (!valid) { setSubmitError('Vérifiez les champs obligatoires et les changements à confirmer.'); return; }
    saving.current = true;
    setSubmitError('');
    try {
      const classification = {
        position: form.position, poles, primary_pole: primaryPole,
        seniority: form.seniority, requested_role: form.requested_role,
        contract_type: form.contract_type.trim() || null,
        start_date: form.start_date || null, manager_id: form.manager_id || null,
        notes: form.notes.trim() || null, work_mode: form.work_mode || null,
        subsidiary: form.subsidiary.trim() || null, attached_documents: attachedDocs,
      };
      if (mutation) {
        if (!targetId || !creationKey.current || !targetRevision.current || !mutationConfirmed)
          throw new Error('Choisissez le collaborateur et confirmez les changements.');
        await submitMutation.mutateAsync({
          targetUserId: targetId, creationKey: creationKey.current,
          expectedTargetRevision: targetRevision.current,
          replaceAssignmentIds: replacementIds, payload: classification,
        });
      } else {
        await create.mutateAsync({
          ...classification,
          first_name: form.first_name.trim(), last_name: form.last_name.trim(),
          personal_email: form.personal_email.trim() || null,
          work_email: form.work_email.trim() || null,
          collaborator_type: form.collaborator_type,
        } as any);
      }
      setOpen(false);
      resetForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'La confirmation n’a pas pu être obtenue. Votre saisie est conservée.');
    } finally {
      saving.current = false;
    }
  };

  const valid =
    form.first_name.trim().length > 0 &&
    form.last_name.trim().length > 0 &&
    Boolean(
      form.work_email.trim() ||
      form.personal_email.trim()
    ) &&
    Boolean(primaryPole) &&
    Boolean(form.position) &&
    poles.length > 0 &&
    poles.includes(primaryPole) &&
    Boolean(form.requested_role) &&
    (form.position === 'ceo' || Boolean(form.manager_id)) &&
    (!mutation || (!mutationTargets.isFetching && !mutationTargets.isError && !mutationTargets.isLoading &&
      !allPositions.isLoading && Boolean(selectedTarget) && Boolean(targetRevision.current) &&
      !selectedTargetSource.isFetching && !selectedTargetSource.isError && Boolean(refreshedTarget) &&
      refreshedTarget?.revision === targetRevision.current && Boolean(selectedAccessRole) &&
      poles.every((pole) => allPoles.some((item) => item.id === pole)) && mutationConfirmed &&
      (!reviewedTarget?.assignments.length || replacementIds.length > 0)));

  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  const [newPositionLabel, setNewPositionLabel] = useState('');
  const [newPositionDescription, setNewPositionDescription] = useState('');

  const createPosition = useCreateHrPosition();

  const handleCreatePosition = async () => {
    const label = newPositionLabel.trim();

    if (!label || !primaryPole) {
      return;
    }

    try {
      const position = await createPosition.mutateAsync({
        label,
        pole_id: primaryPole,
        description: newPositionDescription.trim(),
      });

      setForm((previous) => ({
        ...previous,
        position: position.position_key,
        requested_role: '',
      }));

      setNewPositionLabel('');
      setNewPositionDescription('');
      setPositionDialogOpen(false);
    } catch {
      // L'erreur est déjà affichée par la mutation.
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (pending || saving.current) return;
        setOpen(nextOpen);
        if (nextOpen && mutation) void mutationTargets.refetch();

        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant={mutation ? 'outline' : 'default'}>
          <Plus className="mr-1.5 h-4 w-4" />
          {mutation ? 'Mutation d’un collaborateur' : 'Nouveau collaborateur'}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"
        onEscapeKeyDown={(event) => { if (pending || saving.current) event.preventDefault(); }}
        onPointerDownOutside={(event) => { if (pending || saving.current) event.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle>
            {mutation ? 'Préparer une mutation' : 'Créer un dossier collaborateur'}
          </DialogTitle>

          <DialogDescription>
            {mutation
              ? 'Le compte existant conserve son identité. Le dossier est soumis, validé puis appliqué sans invitation. Les accès actuels restent inchangés jusqu’à l’application.'
              : 'Les RH définissent l’identité, la classification, l’affectation, le référent et le besoin d’accès. Le compte applicatif n’est créé qu’après validation RH.'}
          </DialogDescription>
        </DialogHeader>

        <fieldset disabled={pending} className="space-y-6">
          {mutation && <section className="space-y-3 rounded-lg border p-4">
            <div className="space-y-2">
              <Label htmlFor="mutation-target-search">Rechercher un collaborateur</Label>
              <Input id="mutation-target-search" value={targetSearch}
                onChange={(event) => setTargetSearch(event.target.value)}
                placeholder="Nom, prénom ou email…" />
              <p className="text-xs text-muted-foreground">200 résultats maximum ; affinez la recherche. Votre sélection reste conservée.</p>
            </div>
            <Label htmlFor="mutation-target">Collaborateur concerné</Label>
            {mutationTargets.isLoading ? <p role="status" className="text-sm text-muted-foreground">Chargement des collaborateurs…</p>
              : mutationTargets.isError ? <div role="alert" className="space-y-2">
                <p className="text-sm text-destructive">Les collaborateurs n’ont pas pu être chargés.</p>
                <Button type="button" size="sm" variant="outline" onClick={() => void mutationTargets.refetch()}>Réessayer</Button>
              </div> : <Select value={targetId} disabled={mutationTargets.isFetching} onValueChange={selectMutationTarget}>
                <SelectTrigger id="mutation-target"><SelectValue placeholder="Choisir un compte existant…" /></SelectTrigger>
                <SelectContent>{targetOptions.map((target) => (
                  <SelectItem key={target.id} value={target.id}>{employeeName(target.first_name, target.last_name)} · {target.email}</SelectItem>
                ))}</SelectContent>
              </Select>}
            {!mutationTargets.isLoading && !mutationTargets.isError && !mutationTargets.data?.length &&
              <p className="text-sm text-muted-foreground">Aucun résultat pour cette recherche dans votre périmètre. {selectedTarget ? 'La fiche sélectionnée est conservée.' : 'Affinez votre recherche.'}</p>}
            {reviewedTarget && <div className="space-y-3">
              <p className="text-sm">Compte conservé : <strong>{reviewedTarget.email}</strong>.</p>
              {selectedTargetSource.isFetching && <p role="status" className="text-sm text-muted-foreground">Vérification de la fiche sélectionnée…</p>}
              {!selectedTargetSource.isFetching && (selectedTargetSource.isError || !refreshedTarget) && <div role="alert" className="space-y-2 rounded-md border p-3">
                <p className="text-sm text-destructive">La fiche sélectionnée n’a pas pu être vérifiée. Votre saisie est conservée.</p>
                <Button type="button" size="sm" variant="outline" onClick={() => void selectedTargetSource.refetch()}>Réessayer la vérification</Button>
              </div>}
              {refreshedTarget && refreshedTarget.revision !== targetRevision.current && <div role="alert" className="space-y-2 rounded-md border p-3">
                <p className="text-sm text-destructive">La fiche du collaborateur a changé depuis sa sélection. Votre saisie est conservée. Recharger remplacera les valeurs du formulaire par les informations courantes.</p>
                <Button type="button" size="sm" variant="outline" disabled={selectedTargetSource.isFetching}
                  onClick={() => void reloadMutationTarget()}>Recharger la fiche du collaborateur</Button>
              </div>}
              <p className="text-sm">Cochez les affectations métier à remplacer. Les autres seront conservées.</p>
              {reviewedTarget.assignments.length ? <div className="space-y-2">
                {reviewedTarget.assignments.map((assignment) => <label key={assignment.id} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                  <Checkbox checked={replacementIds.includes(assignment.id)} onCheckedChange={(checked) =>
                    setReplacementIds((ids) => checked === true ? [...ids, assignment.id] : ids.filter((id) => id !== assignment.id))} />
                  <span>{assignment.label || assignment.role_key}{assignment.scope_value ? ' · ' + assignment.scope_value : ''}
                    <span className="block break-all font-mono text-xs text-muted-foreground">Référence : {assignment.id}</span>
                  </span>
                </label>)}
              </div> : <p className="text-sm text-muted-foreground">Aucune affectation métier active. Le nouveau rôle sera créé après validation.</p>}
              <p className="text-sm text-muted-foreground">Privilèges techniques conservés : {reviewedTarget.technical_roles.length ? reviewedTarget.technical_roles.join(', ') : 'aucun'}.</p>
            </div>}
          </section>}
          {/* IDENTITÉ */}
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Identité
            </p>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label>Prénom</Label>
                <Input
                  readOnly={mutation}
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
                  readOnly={mutation}
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
                  readOnly={mutation}
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
                  readOnly={mutation}
                  value={form.work_email}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      work_email:
                        event.target.value,
                    }))
                  }
                  placeholder="prenom.nom@brand-in-a-box.space or prenom.nom@gmail.com"
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
                  disabled={mutation}
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
                  disabled={mutation && !!selectedAccessRole?.seniority}
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
                <Label>{mutation ? 'Date de prise d’effet' : 'Date d’entrée'}</Label>

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

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <div className="min-w-[220px] flex-1">
                    <Select
                      value={form.position}
                      onValueChange={(value) =>
                        setForm((previous) => ({
                          ...previous,
                          position: value,
                          requested_role: '',
                        }))
                      }
                      disabled={
                        !primaryPole ||
                        positionsLoading ||
                        positionsError
                      }
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
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!primaryPole}
                    onClick={() => setPositionDialogOpen(true)}
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Créer un poste / une fonction
                  </Button>
                </div>

                {positionsError && (
                  <p className="mt-1 text-xs text-destructive">
                    Impossible de charger le catalogue des postes.
                  </p>
                )}

                <Dialog
                  open={positionDialogOpen}
                  onOpenChange={setPositionDialogOpen}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        Créer un poste ou une fonction
                      </DialogTitle>

                      <DialogDescription>
                        Le nouveau poste sera rattaché au pôle{' '}
                        {allPoles.find((pole) => pole.id === primaryPole)?.shortName
                          ?? primaryPole}
                        . Il sera disponible dans le catalogue RH.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div>
                        <Label>Intitulé du poste</Label>
                        <Input
                          value={newPositionLabel}
                          onChange={(event) =>
                            setNewPositionLabel(event.target.value)
                          }
                          placeholder="Ex. Responsable Partenariats"
                        />
                      </div>

                      <div>
                        <Label>Description (facultatif)</Label>
                        <Textarea
                          value={newPositionDescription}
                          onChange={(event) =>
                            setNewPositionDescription(event.target.value)
                          }
                          placeholder="Missions et périmètre du poste"
                          rows={3}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPositionDialogOpen(false)}
                      >
                        Annuler
                      </Button>

                      <Button
                        type="button"
                        disabled={
                          !newPositionLabel.trim() ||
                          !primaryPole ||
                          createPosition.isPending
                        }
                        onClick={handleCreatePosition}
                      >
                        {createPosition.isPending ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-1.5 h-4 w-4" />
                        )}
                        Créer le poste
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <fieldset className="mt-4 rounded-lg border p-3">
              <legend className="px-1 text-sm font-medium">Pôles affectés</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {allPoles.map((pole) => <label key={pole.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={poles.includes(pole.id)} disabled={pole.id === primaryPole}
                    onCheckedChange={() => togglePole(pole.id)} />
                  {pole.name}
                </label>)}
              </div>
              {poles.filter((pole) => !allPoles.some((item) => item.id === pole)).map((pole) =>
                <div key={pole} className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span>Ancien pôle à vérifier : {pole}</span>
                  <Button type="button" size="sm" variant="outline" onClick={() => setPoles((ids) => ids.filter((id) => id !== pole))}>Retirer du dossier</Button>
                </div>)}
            </fieldset>
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
                    ...(mutation && compatibleRoles.find((role) => role.role_key === value)?.seniority
                      ? { seniority: compatibleRoles.find((role) => role.role_key === value)!.seniority! } : {}),
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
              Choisissez un rôle confirmé dans le catalogue des accès. Ses pôles doivent correspondre au dossier.
              {mutation && selectedAccessRole?.seniority && ' Le niveau de séniorité est repris du rôle sélectionné.'}
            </p>
          </section>

          <Separator />

          {/* PARAMÈTRES DU COMPTE */}
          <section className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Paramètres du compte</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Mode de travail</Label>
                <Select
                  value={form.work_mode}
                  onValueChange={(value) => setForm((p) => ({ ...p, work_mode: value }))}
                >
                  <SelectTrigger aria-label="Mode de travail"><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office">Sur site</SelectItem>
                    <SelectItem value="hybrid">Hybride</SelectItem>
                    <SelectItem value="remote">Télétravail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Filiale</Label>
                <Input
                  aria-label="Filiale"
                  value={form.subsidiary}
                  onChange={(e) => setForm((p) => ({ ...p, subsidiary: e.target.value }))}
                  placeholder="Ex. Brand-in-a-box France"
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* CHARTES & POLITIQUES */}
          <section className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Chartes et politiques à rattacher</h4>
            <p className="text-xs text-muted-foreground">
              {mutation
                ? 'Les documents retenus apparaîtront dans Paramètres → Ressources après l’application de la mutation.'
                : 'Ces documents apparaîtront dans Paramètres → Ressources du collaborateur dès la création du compte.'}
            </p>
            {attachedDocs.map((doc, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                <span>{doc.name} · {({ charter: 'Charte', charte: 'Charte', policy: 'Politique interne', contract: 'Contrat' } as Record<string, string>)[doc.document_type] ?? doc.document_type}</span>
                <Button variant="ghost" size="sm" onClick={() => setAttachedDocs((d) => d.filter((_, j) => j !== i))}>
                  Retirer
                </Button>
              </div>
            ))}
            <div className="grid gap-2 md:grid-cols-[1fr_160px_1fr_auto]">
              <Input aria-label="Nom du document" placeholder="Nom (ex. Charte informatique)" value={docDraft.name}
                onChange={(e) => setDocDraft((d) => ({ ...d, name: e.target.value }))} />
              <Select value={docDraft.document_type} onValueChange={(v) => setDocDraft((d) => ({ ...d, document_type: v }))}>
                <SelectTrigger aria-label="Type de document"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="charter">Charte</SelectItem>
                  <SelectItem value="policy">Politique interne</SelectItem>
                </SelectContent>
              </Select>
              <Input aria-label="Lien du document" placeholder="Lien (facultatif)" value={docDraft.document_url}
                onChange={(e) => setDocDraft((d) => ({ ...d, document_url: e.target.value }))} />
              <Button type="button" variant="outline" disabled={!docDraft.name.trim()}
                onClick={() => {
                  setAttachedDocs((d) => [...d, { name: docDraft.name.trim(), document_type: docDraft.document_type, document_url: docDraft.document_url.trim() || null }]);
                  setDocDraft({ name: '', document_type: 'charter', document_url: '' });
                }}>
                Rattacher
              </Button>
            </div>
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
          {mutation && <section className="space-y-3 rounded-lg border p-4">
            <p className="text-sm">Les documents d’onboarding retirés de ce dossier seront archivés à l’application. Les documents ajoutés manuellement seront conservés.</p>
            <p className="text-sm">La date renseignée est la date d’effet. Une mutation future devra être appliquée manuellement à partir de cette date.</p>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={mutationConfirmed} onCheckedChange={(checked) => setMutationConfirmed(checked === true)} />
              <span>J’ai vérifié le nouveau poste, les pôles, le rôle et les affectations cochées à remplacer.</span>
            </label>
          </section>}
        </fieldset>
        {submitError && <p role="alert" className="whitespace-pre-wrap text-sm text-destructive">{submitError}</p>}

        <DialogFooter>
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => { if (!saving.current) { setOpen(false); resetForm(); } }}
          >
            Annuler
          </Button>

          <Button
            onClick={() => void submit()}
            disabled={
              !valid ||
              pending ||
              referentsLoading ||
              rolesLoading
            }
          >
            {pending && (
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
  const mutationStatus = useSetHrMutationStatus();
  const applyMutation = useApplyHrEmployeeMutation();
  const { user } = useAuth();
  const isMutation = request.request_kind === 'mutation';
  const actionPending = setStatus.isPending || provisionAccount.isPending || mutationStatus.isPending || applyMutation.isPending;
  const mayValidate = canValidate && (!isMutation || request.target_user_id !== user?.id);
  const mayApply = canProvision && (!isMutation || request.target_user_id !== user?.id);
  const statusAction = (status: 'hr_validated' | 'rejected') => {
    if (actionPending) return;
    if (isMutation) mutationStatus.mutate({ request, status, note: reason.trim() || undefined });
    else setStatus.mutate({ request, status, ...(status === 'rejected' ? { reason: reason.trim() } : {}) });
  };
  const applyAction = () => {
    if (actionPending) return;
    if (isMutation) applyMutation.mutate(request);
    else provisionAccount.mutate(request);
  };
  const failedAction = isMutation
    ? mutationStatus.error ?? applyMutation.error
    : setStatus.error ?? provisionAccount.error;
  const snapshot = (request.mutation_snapshot ?? {}) as {
    assignments?: { id: string; role_key?: string; label?: string; scope_value?: string | null }[];
    technical_roles?: string[];
  };
  const replacedIds = request.mutation_replace_assignment_ids ?? [];
  const snapshotAssignments = Array.isArray(snapshot.assignments) ? snapshot.assignments : [];

  const statusConfig =
    HR_STATUS[request.status];

  const steps = isMutation ? ['Dossier soumis', 'Validation RH', 'Mutation appliquée'] : HR_STEPS;
  const step = isMutation ? (request.status === 'completed' ? 2 : request.status === 'hr_validated' ? 1 : 0) : statusConfig.step;

  const referentQuery = useHrReferents();

  const referent = referentQuery.data?.find(
    (item) =>
      item.id === request.manager_id,
  );

  return (
    <Sheet open onOpenChange={(nextOpen) => { if (!nextOpen && !actionPending) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            {request.reference}
            {isMutation && <Badge variant="outline">Mutation</Badge>}

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
            · {positionLabel(request.position_key ?? request.position)}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {/* PROGRESSION */}
          <div>
            <Progress
              value={
                (step /
                  (steps.length - 1)) *
                100
              }
            />

            <div className="mt-1 flex justify-between gap-1 text-[10px] text-muted-foreground">
              {steps.map(
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
                {isMutation ? 'Prise d’effet :' : 'Entrée :'}
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

          {isMutation && <section className="space-y-3 rounded-lg border p-3 text-sm">
            <h3 className="font-medium">{request.status === 'completed' ? 'Changements appliqués au compte existant' : 'Changements à appliquer au compte existant'}</h3>
            <p>{request.work_email ?? request.personal_email ?? 'Compte conservé'} · aucun nouvel envoi d’invitation.</p>
            <p>Nouveau rôle : <strong>{request.requested_role}</strong>.</p>
            <div className="space-y-2">
              {snapshotAssignments.map((assignment) => <p key={assignment.id} className="flex flex-wrap items-center gap-2">
                <Badge variant={replacedIds.includes(assignment.id) ? 'secondary' : 'outline'}>
                  {replacedIds.includes(assignment.id) ? (request.status === 'completed' ? 'Remplacée' : 'À remplacer') : 'Conservée'}
                </Badge>
                {assignment.label ?? assignment.role_key ?? assignment.id}
                {assignment.scope_value ? ' · ' + assignment.scope_value : ''}
                <span className="basis-full break-all font-mono text-xs text-muted-foreground">Référence : {assignment.id}</span>
              </p>)}
              {!snapshotAssignments.length && <p className="text-muted-foreground">Aucune affectation métier active dans le dossier d’origine.</p>}
            </div>
            <p className="text-muted-foreground">Privilèges techniques conservés : {snapshot.technical_roles?.length ? snapshot.technical_roles.join(', ') : 'aucun'}.</p>
            <p className="text-muted-foreground">Les documents d’onboarding retirés seront archivés. Les documents ajoutés manuellement seront conservés.</p>
            <p className="text-muted-foreground">Les accès changent uniquement lors de l’application. Une date d’effet future exige une application à partir de cette date.</p>
            {request.target_user_id === user?.id && <p role="alert" className="text-destructive">Un autre responsable RH doit traiter votre mutation.</p>}
          </section>}

          {/* ACTIONS */}
          {(mayValidate || mayApply) && request.status !== 'completed' &&
            (!isMutation || ['submitted', 'hr_validated'].includes(request.status)) && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</p>
              <Textarea rows={2} maxLength={2000} placeholder="Motif obligatoire pour un refus"
                value={reason} disabled={actionPending} onChange={(event) => setReason(event.target.value)} />
              <div className="flex flex-wrap gap-2">
                {mayValidate && request.status === 'submitted' && <Button size="sm" disabled={actionPending}
                  onClick={() => statusAction('hr_validated')}>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Valider RH
                </Button>}
                {mayApply && request.status === 'hr_validated' && <Button size="sm" disabled={actionPending}
                  onClick={applyAction}>
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  {isMutation ? 'Appliquer la mutation' : 'Créer compte & accès'}
                </Button>}
                {mayValidate && <Button size="sm" variant="destructive"
                  disabled={!reason.trim() || actionPending} onClick={() => statusAction('rejected')}>
                  <XCircle className="mr-1.5 h-3.5 w-3.5" /> Refuser
                </Button>}
              </div>
              {actionPending && <p role="status" className="text-sm text-muted-foreground">Confirmation en cours…</p>}
              {failedAction && <p role="alert" className="whitespace-pre-wrap text-sm text-destructive">
                {failedAction instanceof Error ? failedAction.message : 'L’action n’a pas pu être confirmée. Actualisez le dossier puis réessayez.'}
              </p>}
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
              {events.isLoading && <p role="status" className="text-sm text-muted-foreground">Chargement de l’historique…</p>}
              {events.isError && <div role="alert" className="space-y-2">
                <p className="text-sm text-destructive">L’historique n’a pas pu être chargé.</p>
                <Button size="sm" variant="outline" disabled={events.isFetching} onClick={() => void events.refetch()}>Réessayer</Button>
              </div>}
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

              {!events.isLoading && !events.isError && !events.data?.length && (
                <p className="text-sm text-muted-foreground">
                  Aucun événement.
                </p>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full"
            disabled={actionPending}
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
  const permissions = useHrOnboardingPermissions();
  const canValidate = permissions.data?.validate === true;
  const canProvision = permissions.data?.apply === true;
  const canCreate = permissions.data?.create === true;

  const {
    data: requests = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useHrEmployeeRequests();

  const [selected, setSelected] =
    useState<HrEmployeeRequest | null>(
      null,
    );

  // Le panneau suit la version actualisée du dossier après mutation.
  const selectedRequest = selected
    ? requests.find((request) => request.id === selected.id) ?? selected
    : null;

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

  if (permissions.isLoading) return <p role="status" className="enterprise-card p-6 text-sm text-muted-foreground">Vérification de vos droits RH…</p>;
  if (permissions.isError) return <div role="alert" className="enterprise-card space-y-3 p-6">
    <p className="text-sm text-destructive">Vos droits RH n’ont pas pu être vérifiés.</p>
    <Button size="sm" variant="outline" disabled={permissions.isFetching} onClick={() => void permissions.refetch()}>Réessayer</Button>
  </div>;
  if (!permissions.data?.read) return <p role="alert" className="enterprise-card p-6 text-sm">Vous n’avez pas accès à l’onboarding RH.</p>;

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

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={isFetching} onClick={() => void refetch()}>Actualiser les dossiers</Button>
          {canCreate && <>
            <NewEmployeeDialog />
            <NewEmployeeDialog mutation />
          </>}
        </div>
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
              À finaliser
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
            Dossiers RH
          </CardTitle>

          <CardDescription>
            La validation RH précède la création d’un compte ou l’application d’une mutation sur un compte existant.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : isError ? (
            <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/40 p-4 text-sm text-destructive">
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
                          <Button type="button" variant="link" className="h-auto p-0 text-left"
                            aria-label={'Ouvrir le dossier ' + request.reference}
                            onClick={(event) => { event.stopPropagation(); setSelected(request); }}>
                            {request.reference}
                          </Button>
                          {request.request_kind === 'mutation' && <Badge variant="outline" className="ml-2">Mutation</Badge>}
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
                            request.position_key ?? request.position,
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

      {selectedRequest && (
        <RequestSheet
          request={selectedRequest}
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
