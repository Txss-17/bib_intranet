import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type Attestation = {
  reference: string;
  subject_id: string;
  verifier_id: string;
  verified_at: string;
  status: string;
};

const checks = [
  { key: 'original', text: 'J’ai contrôlé l’original de la pièce en présence de la personne.' },
  { key: 'match', text: 'J’ai comparé la photographie et l’identité déclarée à la personne présente.' },
  { key: 'validity', text: 'J’ai contrôlé visuellement la cohérence et la validité apparente du document.' },
  { key: 'noCopy', text: 'Je confirme qu’aucune copie, capture d’écran ou donnée d’identité supplémentaire ne sera conservée dans BIB ou Drive.' },
] as const;

type CheckKey = (typeof checks)[number]['key'];

/** A reviewer's signed-in, auditable statement; no ID upload or storage. */
export default function LeadershipIdentityAttestation({
  subjectId,
  subjectName,
}: {
  subjectId: string;
  subjectName: string;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [confirmed, setConfirmed] = useState<Record<CheckKey, boolean>>({
    original: false, match: false, validity: false, noCopy: false,
  });
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const [reason, setReason] = useState<'error' | 'superseded' | 'verification_challenged'>('error');

  const canCheck = !!user && user.id !== subjectId;
  const list = useQuery({
    queryKey: ['rh-my-identity-attestations'],
    enabled: canCheck,
    queryFn: async (): Promise<Attestation[]> => {
      const { data, error } = await (supabase as any).rpc('rh_my_identity_attestations');
      if (error) throw error;
      return (data ?? []) as Attestation[];
    },
  });

  const existing = (list.data ?? []).find(a => a.subject_id === subjectId && a.status === 'verified');
  const allChecked = checks.every(c => confirmed[c.key]);

  const submit = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any).rpc('rh_record_leadership_identity_attestation', {
        p_subject: subjectId,
        p_method: 'in_person_original',
        p_original_inspected: confirmed.original,
        p_subject_matched: confirmed.match,
        p_apparent_validity_checked: confirmed.validity,
        p_no_copy_retained: confirmed.noCopy,
        p_request_key: requestKey,
      });
      if (error) throw error;
      const attestation = (data as { reference: string }[] | null)?.[0];
      if (!attestation?.reference) throw new Error('Le serveur n’a pas confirmé la référence de contrôle.');
      return attestation.reference;
    },
    onSuccess: reference => {
      toast.success(`Contrôle enregistré sous ${reference}. La validation de l’étape reste indépendante.`);
      setConfirmed({ original: false, match: false, validity: false, noCopy: false });
      setRequestKey(crypto.randomUUID());
      void queryClient.invalidateQueries({ queryKey: ['rh-my-identity-attestations'] });
      void queryClient.invalidateQueries({ queryKey: ['leadership-evidence-options'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const revoke = useMutation({
    mutationFn: async () => {
      if (!existing) throw new Error('Aucune attestation active.');
      const { data, error } = await (supabase as any).rpc('rh_revoke_leadership_identity_attestation', {
        p_reference: existing.reference,
        p_reason: reason,
      });
      if (error) throw error;
      if (data !== true) throw new Error('La révocation n’a pas été confirmée.');
    },
    onSuccess: () => {
      toast.success('L’attestation a été révoquée. Elle ne peut plus servir de preuve RH.');
      void queryClient.invalidateQueries({ queryKey: ['rh-my-identity-attestations'] });
      void queryClient.invalidateQueries({ queryKey: ['leadership-evidence-options'] });
      void queryClient.invalidateQueries({ queryKey: ['leadership-onboarding'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!canCheck) return null;

  return (
    <section className="space-y-3 rounded-md border border-border p-3" aria-label="Vérification d’identité sans copie">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold">Attestation de vérification d’identité — sans copie</h4>
        <p className="text-xs text-muted-foreground">
          Titulaire : {subjectName}. Réservé à une vérification en présence et sur pièce originale.
          Cette attestation engage le responsable qui la crée et n’est ni une certification
          d’identité ni une signature électronique qualifiée.
        </p>
      </div>
      {list.isError && (
        <p role="alert" className="text-xs text-destructive">
          Impossible de vérifier les attestations existantes.
          <Button type="button" variant="outline" size="sm" onClick={() => void list.refetch()}>Réessayer</Button>
        </p>
      )}
      {existing ? (
        <div className="space-y-2 rounded border p-2 text-xs">
          <p>Attestation active : <span className="break-all font-mono">{existing.reference}</span></p>
          <p>Le contrôle doit encore être validé dans l’étape 1 par un responsable habilité distinct du titulaire.</p>
          <Label htmlFor={'idv-revoke-reason-' + subjectId}>Motif de révocation</Label>
          <select id={'idv-revoke-reason-' + subjectId}
            className="h-10 w-full rounded-md border bg-background px-2 text-sm"
            value={reason} onChange={e => setReason(e.target.value as typeof reason)}>
            <option value="error">Erreur dans la vérification</option>
            <option value="superseded">Contrôle remplacé</option>
            <option value="verification_challenged">Vérification contestée</option>
          </select>
          <Button type="button" variant="outline" size="sm" disabled={revoke.isPending}
            onClick={() => revoke.mutate()}>Révoquer cette attestation</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-amber-700">
            N’utilisez pas ce formulaire pour une vérification uniquement à distance.
            Un parcours d’identification à distance devra faire l’objet d’une validation de sécurité distincte.
          </p>
          {checks.map(check => (
            <label key={check.key} className="flex items-start gap-3 text-xs">
              <Checkbox
                checked={confirmed[check.key]}
                disabled={submit.isPending || list.isLoading || list.isError}
                onCheckedChange={checked => setConfirmed(current => ({ ...current, [check.key]: checked === true }))}
                aria-label={check.text}
              />
              <span>{check.text}</span>
            </label>
          ))}
          <Button type="button" size="sm" disabled={!allChecked || submit.isPending || list.isLoading || list.isError}
            onClick={() => submit.mutate()}>
            {submit.isPending ? 'Enregistrement…' : 'Signer mon attestation de contrôle dans BIB'}
          </Button>
          <p className="text-xs text-muted-foreground">
            Aucun numéro de pièce, scan ou photo n’est demandé. BIB génère la référence,
            horodate la déclaration et conserve l’identité du vérificateur dans son journal d’audit.
            Le visa de l’étape n’est jamais accordé automatiquement.
          </p>
        </div>
      )}
    </section>
  );
}
