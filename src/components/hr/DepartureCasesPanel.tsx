import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Employee } from '@/hooks/useEmployees';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DepartureCase {
  id: string;
  employee_id: string;
  employee_name: string;
  planned_at: string;
  status: 'pending_direction' | 'approved' | 'rejected' | 'cancelled';
  requested_by: string;
  decided_at: string | null;
  tasks_pending: number;
}

const statusText: Record<DepartureCase['status'], string> = {
  pending_direction: 'En attente de la Direction',
  approved: 'Approuvé — exécution technique requise',
  rejected: 'Refusé',
  cancelled: 'Annulé',
};

const technicalChecklist = [
  'Passation des dossiers, tâches et portefeuilles',
  'Restitution des équipements',
  'Révocation effective des rôles et habilitations',
  'Blocage des nouvelles connexions Supabase Auth',
  'Révocation des sessions et vérification des JWT encore valides',
  'Retrait des partages documentaires',
  'Révocation des services et intégrations externes',
  'Inventaire des archives RH et règles de conservation applicables, sans suppression automatique',
  'Révocation des partages nominatifs et gel des nouveaux dépôts dans le coffre personnel',
];

type ReviewDecision = 'approved' | 'rejected';

interface DocumentaryPreflight {
  case_id: string;
  status: string;
  effective_date_reached: boolean;
  ordinary_rh_documents: number;
  private_vault_documents: number;
  private_vault_quarantined: number;
  private_vault_unreleased_or_failed: number;
  private_vault_under_retention: number;
  active_leadership_document_shares: number;
  active_leadership_identity_attestations: number;
  unapproved_retention_categories: number;
  documents_deleted: false;
  sessions_revoked: false;
  safe_to_close: false;
  warning: string;
}

interface SecurityPreflight {
  case_id: string;
  approved: boolean;
  effective_date_reached: boolean;
  auth_account_exists: boolean;
  auth_banned_for_new_signins: boolean;
  possible_session_records: number;
  active_role_assignments: number;
  active_portfolio_memberships: number;
  active_owned_portfolios: number;
  technical_tasks_pending: number;
  session_token_revocation_verified: false;
  document_acl_independently_verified: false;
  external_services_independently_verified: false;
  ready_for_closure: false;
}

/** RH planning and Direction decision only.
 * Technical controls are never marked complete by this component. */
export default function DepartureCasesPanel({ employees }: { employees: Employee[] }) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [employeeId, setEmployeeId] = useState('');
  const [plannedAt, setPlannedAt] = useState('');
  const [justification, setJustification] = useState('');
  const [reviewCaseId, setReviewCaseId] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [authBlockCaseId, setAuthBlockCaseId] = useState<string | null>(null);
  const [authBlockConfirmation, setAuthBlockConfirmation] = useState('');
  const [revokeSharesCaseId, setRevokeSharesCaseId] = useState<string | null>(null);
  const [shareRevokeConfirmation, setShareRevokeConfirmation] = useState('');

  const eligibleEmployees = useMemo(
    () => employees.filter((employee) =>
      employee.id !== user?.id &&
      employee.position !== 'ceo' &&
      employee.test_account === false &&
      ['active', 'onboarding', 'leave'].includes(employee.hr_status)),
    [employees, user?.id],
  );

  const cases = useQuery({
    queryKey: ['rh-departure-cases', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<DepartureCase[]> => {
      const { data, error } = await (supabase as any).rpc('rh_departure_list');
      if (error) throw error;
      return (data ?? []) as DepartureCase[];
    },
    retry: 1,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['rh-departure-cases'] });

  const prepare = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).rpc('rh_departure_prepare', {
        p_employee: employeeId,
        p_planned_at: plannedAt,
        p_justification: justification.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Demande transmise à la Direction. Aucun accès n’a été révoqué.');
      setEmployeeId('');
      setPlannedAt('');
      setJustification('');
      void refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const review = useMutation({
    mutationFn: async (decision: ReviewDecision) => {
      const { error } = await (supabase as any).rpc('rh_departure_direction_review', {
        p_case: reviewCaseId,
        p_decision: decision,
        p_note: decisionNote.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Décision Direction enregistrée et journalisée.');
      setReviewCaseId(null);
      setDecisionNote('');
      void refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const securityPreflight = useMutation({
    mutationFn: async (caseId: string): Promise<SecurityPreflight> => {
      const { data, error } = await (supabase as any).rpc('rh_departure_security_preflight', {
        p_case: caseId,
      });
      if (error) throw error;
      if (!data || data.case_id !== caseId || data.ready_for_closure !== false) {
        throw new Error('Résultat du précontrôle RH incohérent : clôture interdite.');
      }
      return data as SecurityPreflight;
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const suspendSignins = useMutation({
    mutationFn: async (caseId: string) => {
      const { data, error } = await supabase.functions.invoke('rh-offboarding-auth-block', {
        body: { caseId },
      });
      if (error || !data || data.signins_blocked_verified !== true ||
        data.sessions_revoked !== false || data.departure_closed !== false) {
        throw new Error('Le blocage Auth ne peut pas être confirmé. Vérifiez le précontrôle et les journaux.');
      }
      return data as {
        signins_blocked_verified: true;
        sessions_revoked: false;
        departure_closed: false;
      };
    },
    onSuccess: () => {
      toast.success('Nouvelles connexions bloquées et vérifiées. Les sessions et autres accès restent à révoquer.');
      setAuthBlockCaseId(null);
      setAuthBlockConfirmation('');
      void refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const documentaryPreflight = useMutation({
    mutationFn: async (caseId: string): Promise<DocumentaryPreflight> => {
      const { data, error } = await (supabase as any).rpc('rh_departure_documentary_preflight', {
        p_case: caseId,
      });
      if (error) throw error;
      if (!data || data.case_id !== caseId || data.safe_to_close !== false ||
        data.documents_deleted !== false || data.sessions_revoked !== false) {
        throw new Error('Inventaire documentaire incohérent. Aucun dossier ne peut être clôturé.');
      }
      return data as DocumentaryPreflight;
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const revokeBibShares = useMutation({
    mutationFn: async (caseId: string): Promise<number> => {
      const { data, error } = await (supabase as any).rpc('rh_departure_revoke_bib_review_shares', {
        p_case: caseId,
      });
      if (error) throw error;
      if (typeof data !== 'number' || data < 0)
        throw new Error('Aucune preuve de révocation reçue.');
      return data;
    },
    onSuccess: count => {
      toast.success(`${count} partage(s) nominatif(s) RH BIB révoqué(s). Les ACL Drive et services tiers restent à contrôler.`);
      setRevokeSharesCaseId(null);
      setShareRevokeConfirmation('');
      void refresh();
      if (documentaryPreflight.variables) documentaryPreflight.mutate(documentaryPreflight.variables);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const isDirection = profile?.position === 'ceo' && profile?.test_account === false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Départs et révocation des accès</CardTitle>
        <CardDescription>
          Demande RH puis validation indépendante de la Direction.
          L’approbation ne désactive pas le compte : sept contrôles techniques et une revue de conservation documentaire restent nécessaires. La clôture ne supprime aucune archive automatiquement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <section className="space-y-3 rounded-lg border p-4" aria-label="Préparer un départ">
          <h3 className="text-sm font-semibold">Préparer une demande de départ</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rh-departure-employee">Collaborateur de votre portefeuille</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger id="rh-departure-employee">
                  <SelectValue placeholder="Choisir un collaborateur éligible" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleEmployees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rh-departure-date">Date de départ envisagée</Label>
              <Input id="rh-departure-date" type="date" value={plannedAt}
                min={new Date().toISOString().slice(0, 10)}
                onChange={event => setPlannedAt(event.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rh-departure-reason">Justification professionnelle (20 à 1 000 caractères)</Label>
            <Textarea id="rh-departure-reason" value={justification} maxLength={1000}
              onChange={event => setJustification(event.target.value)}
              placeholder="Motif, échéance, passation attendue et approbations à organiser" />
          </div>
          <Button type="button" disabled={prepare.isPending || !employeeId || !plannedAt ||
            justification.trim().length < 20}
            onClick={() => prepare.mutate()}>
            {prepare.isPending ? 'Enregistrement…' : 'Soumettre à la Direction'}
          </Button>
        </section>

        <section className="space-y-3" aria-label="Suivi des départs">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Dossiers suivis</h3>
            <Button variant="outline" size="sm" disabled={cases.isFetching}
              onClick={() => void cases.refetch()}>Actualiser</Button>
          </div>
          {cases.isLoading && <p role="status" className="text-sm">Chargement des demandes…</p>}
          {cases.isError && <p role="alert" className="text-sm text-destructive">
            Le suivi est indisponible. Aucun départ n’est considéré comme validé.
          </p>}
          {!cases.isLoading && !cases.isError && !cases.data?.length &&
            <p className="text-sm text-muted-foreground">Aucun départ enregistré dans votre périmètre.</p>}
          {(cases.data ?? []).map(c => (
            <div key={c.id} className="space-y-2 rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{c.employee_name}</p>
                  <p className="text-xs text-muted-foreground">Départ proposé : {c.planned_at}</p>
                </div>
                <Badge variant={c.status === 'rejected' ? 'destructive' : 'outline'}>{statusText[c.status]}</Badge>
              </div>
              {c.status === 'approved' && <p className="text-xs text-amber-700">
                {c.tasks_pending} contrôles techniques restent ouverts. Aucune confirmation de révocation ni clôture automatique.
              </p>}
              {isDirection && c.status === 'approved' && (
                <div className="space-y-2 border-t pt-2">
                  <Button size="sm" type="button" variant="outline"
                    disabled={securityPreflight.isPending}
                    onClick={() => securityPreflight.mutate(c.id)}>
                    Examiner les accès — lecture seule
                  </Button>
                  <Button size="sm" type="button" variant="outline"
                    disabled={documentaryPreflight.isPending}
                    onClick={() => documentaryPreflight.mutate(c.id)}>
                    Inventaire des archives et droits documentaires
                  </Button>
                  {documentaryPreflight.data && documentaryPreflight.variables === c.id && (
                    <div role="status" className="space-y-1 rounded-md border border-amber-500/40 p-3 text-sm">
                      <p className="font-semibold">Inventaire uniquement — aucune suppression ni clôture</p>
                      <p>Pièces RH ordinaires : {documentaryPreflight.data.ordinary_rh_documents}</p>
                      <p>Coffre privé : {documentaryPreflight.data.private_vault_documents} pièce(s), dont {documentaryPreflight.data.private_vault_quarantined} en quarantaine</p>
                      <p>Pièces en attente de contrôle ou en échec : {documentaryPreflight.data.private_vault_unreleased_or_failed}</p>
                      <p>Pièces sous durée de conservation : {documentaryPreflight.data.private_vault_under_retention}</p>
                      <p>Partages nominatifs RH BIB non révoqués : {documentaryPreflight.data.active_leadership_document_shares}</p>
                      <p>Attestations d’identité actives impliquant le compte : {documentaryPreflight.data.active_leadership_identity_attestations}</p>
                      <p>Catégories sans politique de conservation validée : {documentaryPreflight.data.unapproved_retention_categories}</p>
                      <p className="font-medium text-amber-700">
                        La clôture reste interdite : sessions, habilitations, passations,
                        partages Drive et services tiers exigent des contrôles indépendants.
                        Aucune archive ne doit être supprimée automatiquement au départ.
                      </p>
                    </div>
                  )}
                  {revokeSharesCaseId === c.id ? (
                    <div className="space-y-2 rounded border border-destructive/40 p-3">
                      <p className="text-sm font-medium">Révocation des partages nominatifs RH BIB</p>
                      <p className="text-xs text-muted-foreground">
                        Uniquement après approbation et date d’effet. Cette action n’efface aucun
                        dossier et ne révoque ni les ACL Google Drive ni les sessions externes.
                        Saisissez REVOQUER pour confirmer.
                      </p>
                      <Label htmlFor={'rh-departure-revoke-shares-' + c.id}>Confirmation « REVOQUER »</Label>
                      <Input id={'rh-departure-revoke-shares-' + c.id} autoComplete="off"
                        value={shareRevokeConfirmation}
                        onChange={event => setShareRevokeConfirmation(event.target.value)}
                        placeholder="REVOQUER" />
                      <div className="flex gap-2">
                        <Button type="button" variant="destructive" size="sm"
                          disabled={shareRevokeConfirmation !== 'REVOQUER' ||
                            revokeBibShares.isPending || c.planned_at > new Date().toISOString().slice(0, 10)}
                          onClick={() => revokeBibShares.mutate(c.id)}>
                          Révoquer les partages BIB
                        </Button>
                        <Button type="button" variant="outline" size="sm"
                          onClick={() => { setRevokeSharesCaseId(null); setShareRevokeConfirmation(''); }}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" size="sm"
                      disabled={c.planned_at > new Date().toISOString().slice(0, 10)}
                      onClick={() => { setRevokeSharesCaseId(c.id); setShareRevokeConfirmation(''); }}>
                      Préparer la révocation des partages RH BIB
                    </Button>
                  )}
                  {authBlockCaseId === c.id ? (
                    <div className="space-y-2 rounded border border-destructive/40 p-3">
                      <p className="text-sm font-medium">Confirmation de suspension du compte</p>
                      <p className="text-xs text-muted-foreground">
                        Après approbation RH/Direction et date d'effet, le CEO peut bloquer
                        les nouvelles connexions du collaborateur. Les sessions déjà ouvertes
                        et les jetons JWT ne sont PAS immédiatement révoqués.
                        Saisissez BLOQUER pour confirmer cette opération.
                      </p>
                      <Label htmlFor={'rh-auth-ban-' + c.id}>Confirmation « BLOQUER »</Label>
                      <Input id={'rh-auth-ban-' + c.id} autoComplete="off"
                        value={authBlockConfirmation}
                        onChange={event => setAuthBlockConfirmation(event.target.value)}
                        placeholder="BLOQUER" />
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="destructive" size="sm"
                          disabled={authBlockConfirmation !== 'BLOQUER' || suspendSignins.isPending ||
                            c.planned_at > new Date().toISOString().slice(0, 10)}
                          onClick={() => suspendSignins.mutate(c.id)}>
                          {suspendSignins.isPending ? 'Vérification…' : 'Bloquer les nouvelles connexions'}
                        </Button>
                        <Button type="button" size="sm" variant="outline"
                          disabled={suspendSignins.isPending}
                          onClick={() => { setAuthBlockCaseId(null); setAuthBlockConfirmation(''); }}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" type="button" variant="destructive"
                      disabled={c.planned_at > new Date().toISOString().slice(0, 10)}
                      onClick={() => { setAuthBlockCaseId(c.id); setAuthBlockConfirmation(''); }}>
                      Préparer le blocage Auth
                    </Button>
                  )}
                  {securityPreflight.data && securityPreflight.variables === c.id && (
                    <div role="status" className="space-y-2 rounded-md border border-amber-500/40 p-3 text-sm">
                      <p className="font-medium">Précontrôle uniquement — aucun accès révoqué</p>
                      <p>Décision indépendante valide : {securityPreflight.data.approved ? 'Oui' : 'Non'}</p>
                      <p>Date d’effet atteinte : {securityPreflight.data.effective_date_reached ? 'Oui' : 'Non'}</p>
                      <p>Compte Auth présent : {securityPreflight.data.auth_account_exists ? 'Oui' : 'Non'}</p>
                      <p>Blocage des nouvelles connexions constaté : {securityPreflight.data.auth_banned_for_new_signins ? 'Oui' : 'Non'}</p>
                      <p>Enregistrements de sessions potentiellement actives : {securityPreflight.data.possible_session_records}</p>
                      <p>Rôles encore actifs : {securityPreflight.data.active_role_assignments}</p>
                      <p>Affectations actives à des portefeuilles : {securityPreflight.data.active_portfolio_memberships}</p>
                      <p>Portefeuilles encore détenus : {securityPreflight.data.active_owned_portfolios}</p>
                      <p>Contrôles techniques en attente : {securityPreflight.data.technical_tasks_pending}</p>
                      <p className="font-medium text-amber-700">
                        Les JWT existants, les ACL Drive et les accès tiers ne sont pas vérifiés.
                        Ce bilan ne peut jamais clôturer un départ.
                      </p>
                    </div>
                  )}
                </div>
              )}
              {isDirection && c.status === 'pending_direction' && c.requested_by !== user?.id &&
                c.employee_id !== user?.id && (
                  <div className="space-y-2 border-t pt-2">
                    {reviewCaseId === c.id ? (
                      <>
                        <Label htmlFor={'rh-departure-decision-' + c.id}>Motivation de la décision (20 caractères minimum)</Label>
                        <Textarea id={'rh-departure-decision-' + c.id}
                          value={decisionNote} maxLength={2000}
                          onChange={event => setDecisionNote(event.target.value)} />
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" disabled={review.isPending || decisionNote.trim().length < 20}
                            onClick={() => review.mutate('approved')}>Approuver le plan</Button>
                          <Button size="sm" variant="destructive"
                            disabled={review.isPending || decisionNote.trim().length < 20}
                            onClick={() => review.mutate('rejected')}>Refuser</Button>
                          <Button size="sm" variant="outline" disabled={review.isPending}
                            onClick={() => { setReviewCaseId(null); setDecisionNote(''); }}>Annuler</Button>
                        </div>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setReviewCaseId(c.id)}>
                        Examiner pour la Direction
                      </Button>
                    )}
                  </div>
                )}
            </div>
          ))}
        </section>

        <details className="rounded-lg border p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Contrôles nécessaires avant toute clôture — aucun n’est validé automatiquement
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {technicalChecklist.map(item => <li key={item}>{item}</li>)}
          </ul>
        </details>
      </CardContent>
    </Card>
  );
}
