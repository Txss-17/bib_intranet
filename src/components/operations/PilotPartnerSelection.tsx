import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase as typedSupabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

// Migration 0089 has not yet been included in generated Supabase types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = typedSupabase as any;

export type PilotKind = 'supplier' | 'logistics';
export type PilotCandidate = { id: string; label: string; eligible: boolean };
type PilotSelection = {
 id: string; partner_id: string; partner_kind: PilotKind; wave: number;
 state: 'nominated' | 'approved' | 'paused'; evidence_reference: string | null;
 approved_at: string | null;
};
const LIMITS: Record<PilotKind, readonly number[]> = {
 supplier: [2, 4, 8], logistics: [1, 2, 3],
};
const STATUS_LABEL: Record<PilotSelection['state'], string> = {
 nominated: 'À valider', approved: 'Sélection pilote validée', paused: 'Suspendu',
};

/**
 * Selection is an intranet governance record, not a write to partner
 * activation, inventory or payments. Partner recruitment has NO quota.
 */
export default function PilotPartnerSelection({
 kind, candidates,
}: { kind: PilotKind; candidates: PilotCandidate[] }) {
 const qc = useQueryClient();
 const [wave, setWave] = useState('1');
 const [candidateId, setCandidateId] = useState('');
 const [reference, setReference] = useState('');
 const [errorMessage, setErrorMessage] = useState('');
 const rowsQuery = useQuery({
  queryKey: ['pilot-partner-selections', kind],
  queryFn: async (): Promise<PilotSelection[]> => {
   const { data, error } = await db.from('bib_pilot_partner_selections')
    .select('id,partner_id,partner_kind,wave,state,evidence_reference,approved_at')
    .eq('partner_kind', kind).order('created_at', { ascending: false });
   if (error) throw error;
   return data ?? [];
  },
 });
 const mutation = useMutation({
  mutationFn: async ({ id, action, selectedWave }: {
   id: string; action: 'nominate' | 'approve' | 'pause'; selectedWave: number;
  }) => {
   const { error } = await db.rpc('bib_set_pilot_partner_selection', {
    p_kind: kind, p_partner_id: id, p_wave: selectedWave,
    p_action: action, p_reference: action === 'approve' ? reference.trim() : null,
   });
   if (error) throw error;
  },
  onSuccess: () => {
   setErrorMessage('');
   setReference('');
   void qc.invalidateQueries({ queryKey: ['pilot-partner-selections', kind] });
   toast.success('Sélection pilote enregistrée');
  },
  onError: (error: Error) => {
   setErrorMessage(error.message);
   toast.error('Enregistrement refusé', { description: error.message });
  },
 });
 const rows = rowsQuery.data ?? [];
 const eligible = useMemo(() => candidates.filter(c => c.eligible), [candidates]);
 const active = rows.filter(row => row.state === 'approved' && row.wave === Number(wave)).length;
 const limit = LIMITS[kind][Number(wave) - 1];
 const selected = rows.find(row => row.partner_id === candidateId);
 const candidateName = (id: string) => candidates.find(c => c.id === id)?.label ?? id;
 const act = (action: 'nominate' | 'approve' | 'pause', id = candidateId, selectedWave = Number(wave)) => {
  setErrorMessage('');
  mutation.mutate({ id, action, selectedWave });
 };
 return <Card>
  <CardHeader>
   <CardTitle className="text-base">Portefeuille ouvert · Activation pilote limitée</CardTitle>
   <p className="text-sm text-muted-foreground">
    Recrutement, qualification et partenariats sans plafond. Seule la sélection opérationnelle
    pour les vagues de recette est limitée ; une sélection validée ne déclenche jamais
    l'activation du partenaire, un paiement ou un mouvement de stock.
   </p>
  </CardHeader>
  <CardContent className="space-y-4">
   <div className="flex flex-wrap items-center gap-3">
    <Select value={wave} onValueChange={setWave}>
     <SelectTrigger className="w-40" aria-label="Vague pilote"><SelectValue /></SelectTrigger>
     <SelectContent>{[1,2,3].map(n => <SelectItem key={n} value={String(n)}>Vague {n}</SelectItem>)}</SelectContent>
    </Select>
    <Badge variant="outline">Sélections validées : {active} / {limit}</Badge>
    <Badge variant="secondary">Portefeuille : sans plafond</Badge>
   </div>
   {rowsQuery.isLoading && <p role="status">Chargement des sélections pilotes…</p>}
   {rowsQuery.isError && <p role="alert" className="text-sm text-destructive">
    Impossible de lire le registre des pilotes. Vérifier la migration 0089 et les habilitations.
   </p>}
   {!rowsQuery.isError && <>
    <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
     <Select value={candidateId} onValueChange={setCandidateId}>
      <SelectTrigger aria-label="Partenaire à sélectionner"><SelectValue placeholder="Choisir un partenaire qualifié" /></SelectTrigger>
      <SelectContent>{eligible.map(c => <SelectItem value={c.id} key={c.id}>{c.label}</SelectItem>)}</SelectContent>
     </Select>
     <Button type="button" variant="outline" disabled={!candidateId || mutation.isPending || selected?.state === 'approved'}
      onClick={() => act('nominate')}>Proposer pour la vague</Button>
    </div>
    <Input aria-label="Référence de validation" value={reference} onChange={e => setReference(e.target.value)}
     placeholder="Référence de décision et de preuves (8 caractères minimum)" maxLength={500}/>
    <p className="text-xs text-muted-foreground">
     Validation par une autre personne habilitée que celle qui a proposé le partenaire.
     La qualification et les contrats doivent être vérifiés ; la validation n'active pas de service réel.
    </p>
    {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
    <div className="space-y-2">
     {rows.filter(row => row.wave === Number(wave)).map(row =>
      <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
       <div className="min-w-0">
        <p className="font-medium">{candidateName(row.partner_id)}</p>
        <p className="text-xs text-muted-foreground">{STATUS_LABEL[row.state]}</p>
       </div>
       <div className="flex items-center gap-2">
        {row.state === 'nominated' &&
         <Button type="button" size="sm" disabled={mutation.isPending || reference.trim().length < 8}
          onClick={() => act('approve', row.partner_id, row.wave)}>Valider la sélection</Button>}
        {row.state !== 'paused' &&
         <Button type="button" size="sm" variant="outline" disabled={mutation.isPending}
          onClick={() => act('pause', row.partner_id, row.wave)}>Suspendre</Button>}
       </div>
      </div>
     )}
     {!rowsQuery.isLoading && rows.filter(row => row.wave === Number(wave)).length === 0 &&
      <p className="text-sm text-muted-foreground">Aucun partenaire sélectionné dans cette vague. Le recrutement reste ouvert.</p>}
    </div>
   </>}
  </CardContent>
 </Card>;
}
