import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export type VaultCategory = 'identity' | 'medical' | 'payroll' | 'disciplinary';
type VaultStatus = { upload_enabled: boolean; read_enabled: boolean; max_size_bytes: number };
type VaultFile = { reference: string; category: string; state: string; created_at: string; retention_until: string };
type VaultUploadResult = { reference: string; state: string };
const labels: Record<VaultCategory, string> = {
  identity: 'Justificatif d’identité',
  medical: 'Pièce médicale protégée',
  payroll: 'Pièce de paie',
  disciplinary: 'Pièce disciplinaire',
};

/** No Google Drive, browser-side Storage access, public links or read buttons.
 * Private vault stays locked until security & retention approval. */
export default function RhPrivateVault({ subjectId, category }: {
  subjectId: string;
  category: VaultCategory;
}) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const [pending, setPending] = useState(false);
  const ownRecord = !!user && user.id === subjectId && profile?.test_account !== true;

  const policy = useQuery({
    queryKey: ['rh-private-vault-status'],
    enabled: ownRecord,
    queryFn: async (): Promise<VaultStatus> => {
      const { data, error } = await (supabase as any).rpc('rh_private_vault_status');
      if (error) throw error;
      const setting = (data as VaultStatus[] | null)?.[0];
      if (!setting) throw new Error('Politique du coffre indisponible.');
      return setting;
    },
  });
  const inventory = useQuery({
    queryKey: ['rh-private-vault-my-documents', subjectId],
    enabled: ownRecord,
    queryFn: async (): Promise<VaultFile[]> => {
      const { data, error } = await (supabase as any).rpc('rh_my_private_vault_documents');
      if (error) throw error;
      return (data ?? []) as VaultFile[];
    },
  });

  if (!ownRecord) return null;
  const uploadEnabled = policy.data?.upload_enabled === true;

  const upload = async () => {
    if (!file || !uploadEnabled || pending) return;
    if (file.size < 1 || file.size > Math.min(policy.data?.max_size_bytes || 0, 5242880) ||
      !['application/pdf', 'image/png', 'image/jpeg'].includes(file.type)) {
      toast.error('Fichier PDF, PNG ou JPEG, 5 Mo maximum.');
      return;
    }
    setPending(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('category', category);
      body.append('request_key', requestKey);
      const { data, error } = await supabase.functions.invoke('rh-private-vault', { body });
      if (error) throw error;
      const result = data as VaultUploadResult;
      if (!result || result.state !== 'quarantined' || !result.reference)
        throw new Error('Mise en quarantaine non confirmée par le serveur.');
      toast.success(`Référence ${result.reference} attribuée. Document en quarantaine, sans consultation possible.`);
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
      setRequestKey(crypto.randomUUID());
      void queryClient.invalidateQueries({ queryKey: ['rh-private-vault-my-documents', subjectId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Dépôt sécurisé non confirmé.');
    } finally { setPending(false); }
  };

  return <section className="space-y-3 rounded border p-3" aria-label="Coffre documentaire RH privé">
    <h4 className="font-semibold text-sm">Coffre documentaire RH privé — {labels[category]}</h4>
    <p className="text-xs text-muted-foreground">
      Priorité au contrôle sans copie lorsqu’il suffit. Si la conservation est réellement nécessaire,
      le fichier sera transmis directement à BIB et placé en quarantaine, sans passage par Google Drive.
      Aucun fichier ne peut être consulté avant validation anti-malware et sécurité.
    </p>
    {(policy.isLoading || inventory.isLoading) &&
      <p role="status" className="text-xs">Vérification des autorisations…</p>}
    {(policy.isError || inventory.isError) &&
      <p role="alert" className="text-xs text-destructive">Coffre indisponible. Aucun dépôt n’est autorisé.</p>}
    {!uploadEnabled && !policy.isLoading &&
      <p role="status" className="rounded border border-amber-500/40 p-2 text-sm text-amber-700">
        Dépôts désactivés : le circuit de confidentialité, les règles de conservation et
        l’analyse anti-malware doivent d’abord être approuvés. N’envoyez pas de copie d’identité par Drive.
      </p>}
    <div className="space-y-1">
      <Label htmlFor={'rh-vault-file-' + subjectId + category}>Fichier depuis mon appareil</Label>
      <input ref={fileInput} id={'rh-vault-file-' + subjectId + category} type="file"
        className="block w-full rounded border p-2 text-sm"
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        disabled={!uploadEnabled || pending}
        onChange={event => { setFile(event.currentTarget.files?.[0] ?? null); setRequestKey(crypto.randomUUID()); }} />
    </div>
    <Button type="button" size="sm"
      disabled={!uploadEnabled || !file || pending || policy.isError || inventory.isError}
      onClick={() => void upload()}>
      {pending ? 'Mise en quarantaine…' : 'Déposer dans mon coffre RH'}
    </Button>
    {(inventory.data?.length ?? 0) > 0 &&
      <div className="space-y-1 border-t pt-2">
        <p className="text-xs font-semibold">Mes pièces — références internes uniquement</p>
        {inventory.data?.filter(d => d.category === category).map(d =>
          <p className="text-xs" key={d.reference}>
            <span className="font-mono">{d.reference}</span> — {d.state}
          </p>)}
      </div>}
  </section>;
}
