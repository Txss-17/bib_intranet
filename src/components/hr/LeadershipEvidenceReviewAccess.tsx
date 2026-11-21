import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type Reviewer = { reviewer_id: string; display_name: string; position: string };
type EvidenceFile = { document_id: string; evidence_ref: string; file_name: string };
type Grant = {
  document_id: string;
  reviewer_id: string;
  reviewer_label: string;
  evidence_ref: string;
  expires_at: string;
  revoked_at: string | null;
};

/** Explicit, temporary document share; never grants general portfolio access. */
export default function LeadershipEvidenceReviewAccess({ subjectId }: { subjectId: string }) {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [fileId, setFileId] = useState('');
  const [reviewerId, setReviewerId] = useState('');

  const enabled = !!user && user.id === subjectId && profile?.test_account !== true;
  const reviewers = useQuery({
    queryKey: ['leadership-reviewers', subjectId],
    enabled,
    queryFn: async (): Promise<Reviewer[]> => {
      const { data, error } = await (supabase as any).rpc('rh_my_leadership_evidence_reviewers');
      if (error) throw error;
      return data ?? [];
    },
  });
  const files = useQuery({
    queryKey: ['leadership-evidence-files', subjectId],
    enabled,
    queryFn: async (): Promise<EvidenceFile[]> => {
      const { data, error } = await (supabase as any).rpc('rh_my_leadership_evidence_files');
      if (error) throw error;
      return data ?? [];
    },
  });
  const grants = useQuery({
    queryKey: ['leadership-review-grants', subjectId],
    enabled,
    queryFn: async (): Promise<Grant[]> => {
      const { data, error } = await (supabase as any).rpc('rh_my_leadership_evidence_review_grants');
      if (error) throw error;
      return data ?? [];
    },
  });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['leadership-review-grants', subjectId] });
    void qc.invalidateQueries({ queryKey: ['leadership-evidence-options'] });
  };
  const grant = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any).rpc('rh_grant_leadership_evidence_review', {
        p_document_id: fileId, p_reviewer_id: reviewerId,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      toast.success('Accès nominatif accordé pour 14 jours. La preuve doit encore être ouverte et contrôlée par le relecteur.');
      setFileId('');
      setReviewerId('');
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const revoke = useMutation({
    mutationFn: async (item: Grant) => {
      const { data, error } = await (supabase as any).rpc('rh_revoke_leadership_evidence_review', {
        p_document_id: item.document_id, p_reviewer_id: item.reviewer_id,
      });
      if (error) throw error;
      if (data !== true) throw new Error('Ce partage n’est plus actif ou ne vous appartient pas.');
    },
    onSuccess: () => {
      toast.success('Droit de consultation retiré.');
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!enabled) return null;
  const active = (grants.data ?? []).filter(g => !g.revoked_at && new Date(g.expires_at).getTime() > Date.now());

  return (
    <section className="space-y-3 rounded-md border p-3" aria-label="Autoriser la lecture d’une preuve RH">
      <h4 className="text-sm font-semibold">Partager une pièce avec un validateur habilité</h4>
      <p className="text-xs text-muted-foreground">
        Vous choisissez explicitement un document et un relecteur. L’autorisation est limitée
        à cette pièce et expire sous 14 jours ; elle peut être retirée immédiatement.
        Aucun visa ni contrôle de signature n’est automatique.
      </p>
      {(reviewers.isError || files.isError || grants.isError) && (
        <p role="alert" className="text-xs text-destructive">
          Impossible de récupérer les justificatifs ou les relecteurs habilités.
          <Button type="button" size="sm" variant="outline" onClick={() => {
            void reviewers.refetch(); void files.refetch(); void grants.refetch();
          }}>Réessayer</Button>
        </p>
      )}
      <div className="space-y-1">
        <Label htmlFor={'review-evidence-file-' + subjectId}>Document à partager</Label>
        <select id={'review-evidence-file-' + subjectId}
          value={fileId} disabled={grant.isPending}
          onChange={e => setFileId(e.target.value)}
          className="h-10 w-full rounded-md border bg-background px-2 text-sm">
          <option value="">Choisir une pièce réellement enregistrée</option>
          {(files.data ?? []).map(f => (
            <option key={f.document_id} value={f.document_id}>
              {f.file_name} — {f.evidence_ref}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor={'review-evidence-person-' + subjectId}>Relecteur nominatif</Label>
        <select id={'review-evidence-person-' + subjectId}
          value={reviewerId} disabled={grant.isPending}
          onChange={e => setReviewerId(e.target.value)}
          className="h-10 w-full rounded-md border bg-background px-2 text-sm">
          <option value="">Sélectionner le responsable habilité</option>
          {(reviewers.data ?? []).map(p => (
            <option key={p.reviewer_id} value={p.reviewer_id}>
              {p.display_name} — {p.position === 'ceo' ? 'CEO' : 'Responsable RH'}
            </option>
          ))}
        </select>
      </div>
      <Button type="button" variant="outline" size="sm"
        disabled={!fileId || !reviewerId || grant.isPending || reviewers.isError || files.isError}
        onClick={() => grant.mutate()}>
        {grant.isPending ? 'Attribution…' : 'Autoriser la consultation de cette pièce'}
      </Button>
      {!files.isLoading && files.data?.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Aucune pièce BIB enregistrée. Importez d’abord un justificatif personnel ci-dessus.
        </p>
      )}
      {active.length > 0 && (
        <div className="space-y-2 border-t pt-2">
          <p className="text-xs font-semibold">Partages actifs</p>
          {active.map(g => (
            <div key={g.document_id + g.reviewer_id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span>{g.evidence_ref} — {g.reviewer_label}, jusqu’au {new Date(g.expires_at).toLocaleDateString('fr-FR')}</span>
              <Button type="button" variant="outline" size="sm" disabled={revoke.isPending}
                onClick={() => revoke.mutate(g)}>Révoquer</Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
