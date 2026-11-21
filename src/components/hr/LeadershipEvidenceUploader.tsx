import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import FileUploadZone from '@/components/FileUploadZone';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ImportedFile = { name: string; url: string; type: string; size: number };
type EvidenceType = 'identity' | 'administrative' | 'contract' | 'charter' | 'policy' | 'regulatory' | 'training';

const types: { value: EvidenceType; label: string }[] = [
  { value: 'identity', label: 'Justificatif d’identité administrative' },
  { value: 'administrative', label: 'Document administratif' },
  { value: 'contract', label: 'Contrat ou mandat signé' },
  { value: 'charter', label: 'Charte professionnelle' },
  { value: 'policy', label: 'Politique interne' },
  { value: 'regulatory', label: 'Justificatif réglementaire' },
  { value: 'training', label: 'Attestation de formation' },
];

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function managedReference(url: string): string | null {
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin !== window.location.origin || parsed.pathname !== '/documents'
        || parsed.searchParams.size !== 1 || !uuidPattern.test(parsed.searchParams.get('document') ?? '')) {
      return null;
    }
    return '/documents?document=' + encodeURIComponent(parsed.searchParams.get('document')!);
  } catch {
    return null;
  }
}

/** Existing leadership accounts submit their own material; submission never
 * validates the document or replaces an independent RH reviewer. */
export default function LeadershipEvidenceUploader({ subjectId }: { subjectId: string }) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<ImportedFile[]>([]);
  const [type, setType] = useState<EvidenceType>('charter');
  const [description, setDescription] = useState('');
  const [pending, setPending] = useState(false);

  if (!user || user.id !== subjectId || profile?.test_account === true) return null;

  const save = async () => {
    const file = selected[0];
    if (!file || !user) return;
    if (type === 'identity') {
      toast.error('Les copies d’identité ne doivent pas être importées dans Drive BIB. Privilégiez une attestation de contrôle ou le coffre RH privé.');
      return;
    }
    const url = managedReference(file.url);
    if (!url) {
      toast.error('Fichier BIB non contrôlé : importez le document avant de l’enregistrer.');
      return;
    }
    setPending(true);
    try {
      const { data: existing, error: existingError } = await (supabase as any)
        .from('rh_employee_documents')
        .select('document_reference')
        .eq('employee_id', user.id)
        .eq('document_url', url)
        .limit(1)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existing) {
        toast.info(`Cette pièce est déjà référencée : ${existing.document_reference ?? 'numéro à vérifier'}`);
        setSelected([]);
        void queryClient.invalidateQueries({ queryKey: ['leadership-evidence-options'] });
      void queryClient.invalidateQueries({ queryKey: ['leadership-evidence-files', subjectId] });
        return;
      }
      const { data, error } = await (supabase as any)
        .from('rh_employee_documents')
        .insert({
          employee_id: user.id,
          name: file.name.trim().slice(0, 200),
          document_type: type,
          source: 'drive',
          document_url: url,
          description: description.trim() || 'Justificatif proposé par le titulaire pour une revue RH indépendante.',
          created_by: user.id,
        })
        .select('document_reference')
        .single();
      if (error) throw error;
      if (!data?.document_reference) throw new Error('Référence documentaire non confirmée par BIB.');
      toast.success(`Pièce enregistrée sous ${data.document_reference}. En attente de vérification indépendante.`);
      setSelected([]);
      setDescription('');
      void queryClient.invalidateQueries({ queryKey: ['leadership-evidence-options'] });
      void queryClient.invalidateQueries({ queryKey: ['leadership-evidence-files', subjectId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Le dépôt documentaire n’a pas été confirmé.');
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="space-y-3 rounded-md border p-3" aria-label="Déposer une preuve pour mon onboarding">
      <h4 className="text-sm font-semibold">Mes justificatifs — dépôt documentaire</h4>
      <p className="text-xs text-muted-foreground">
        Sélectionnez une charte, une politique, un contrat ou une attestation dans le Drive BIB professionnel.
        BIB attribue automatiquement la référence. N'importez jamais de copie de pièce d’identité ou
        de document médical dans Drive. Un autre responsable doit vérifier le contenu et les signatures.
      </p>
      <div className="space-y-1">
        <Label htmlFor={'leadership-file-type-' + subjectId}>Nature du justificatif</Label>
        <select id={'leadership-file-type-' + subjectId} className="h-10 w-full rounded-md border bg-background px-2 text-sm"
          value={type} disabled={pending} onChange={(event) => { setType(event.target.value as EvidenceType); setSelected([]); }}>
          {types.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
      {type === 'identity' ? (
        <p role="status" className="rounded-md border border-amber-500/50 p-3 text-sm text-amber-700">
          Copie d’identité : import Drive désactivé. Contrôle visuel attesté sans copie conservée
          lorsque cela suffit ; sinon coffre documentaire RH privé (non encore activé).
        </p>
      ) : (
        <FileUploadZone bucket="managed-drive" folder="leadership-evidence"
          triggerMode="field" label="Cliquer pour choisir une pièce dans Drive BIB"
          multiple={false} files={selected} onFilesChange={setSelected} />
      )}
      <div className="space-y-1">
        <Label htmlFor={'leadership-file-note-' + subjectId}>Description (facultative)</Label>
        <Textarea id={'leadership-file-note-' + subjectId} value={description}
          maxLength={1000} disabled={pending}
          onChange={event => setDescription(event.target.value)}
          placeholder="Nature du document, version et date éventuelle" />
      </div>
      <Button type="button" size="sm" disabled={pending || selected.length !== 1 || type === 'identity'}
        onClick={() => void save()}>{pending ? 'Enregistrement…' : 'Référencer cette pièce dans mon dossier RH'}</Button>
    </section>
  );
}
