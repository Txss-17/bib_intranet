import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsHr } from '@/components/rh/HrRecordsPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

type TalentApplication = {
  platform_application_id: string;
  full_name: string; email: string; preferred_pole: string | null;
  assigned_pole: string | null; contribution_type: string | null;
  current_activity: string | null; skills: string | null; motivation: string | null;
  availability: string | null; location: string | null; portfolio_url: string | null;
  platform_status: string | null; consent_given_at: string; submitted_at: string;
  retention_until: string; future_opportunities_consent: boolean;
};
const columns = 'platform_application_id,full_name,email,preferred_pole,assigned_pole,contribution_type,current_activity,skills,motivation,availability,location,portfolio_url,platform_status,consent_given_at,submitted_at,retention_until,future_opportunities_consent';

export default function TalentPlatformInbox() {
  const { user } = useAuth();
  const { data: isHr = false, isLoading: rightsLoading, isError: rightsError } = useIsHr();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<TalentApplication | null>(null);
  const enabled = !!user && isHr && !rightsLoading && !rightsError;
  const inbox = useQuery({
    queryKey: ['hr-talent-applications', user?.id],
    enabled,
    queryFn: async () => {
      const rows: TalentApplication[] = [];
      for (let offset = 0; offset <= 10000; offset += 500) {
        const { data, error } = await supabase.from('hr_talent_applications' as never)
          .select(columns).order('submitted_at', { ascending: false }).range(offset, offset + 499);
        if (error) throw error;
        const page = (data ?? []) as unknown as TalentApplication[];
        rows.push(...page);
        if (page.length < 500) return rows;
      }
      throw new Error('La liste est trop volumineuse pour être affichée entièrement. Contactez l’administrateur.');
    },
    staleTime: 15_000,
  });
  const sync = useMutation({
    mutationFn: async () => {
      if (!enabled) throw new Error('Autorisation RH non confirmée.');
      const { data, error } = await supabase.functions.invoke('pull-talent-applications', { body: {} });
      if (error) throw error;
      if (!data?.ok || data?.source !== 'bib_talent') throw new Error(data?.error || 'Import non confirmé.');
      return data as { imported: number; purged: number };
    },
    onSuccess: async result => {
      await qc.invalidateQueries({ queryKey: ['hr-talent-applications'] });
      toast.success(`Import Carrières BIB terminé : ${result.imported} dossier(s) reçus, ${result.purged} copie(s) supprimée(s).`);
    },
    onError: error => toast.error('Import impossible', { description: error instanceof Error ? error.message : 'Vérifier le serveur et les secrets Talent.' }),
  });
  const filtered = (inbox.data ?? []).filter(row =>
    `${row.full_name} ${row.email} ${row.preferred_pole || ''} ${row.assigned_pole || ''}`
      .toLocaleLowerCase('fr-FR').includes(search.toLocaleLowerCase('fr-FR').trim()));

  return <Card>
    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
      <div>
        <CardTitle>Réception Carrières BIB — Platform</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">Candidatures conservées dans un registre RH privé. Source : formulaire de la page Carrières BIB Platform, et non Google Drive. L’identifiant technique d’import BIB Talent est conservé pour assurer la compatibilité avec les candidatures déjà enregistrées.</p>
      </div>
      <Button type="button" disabled={!enabled || sync.isPending || inbox.isFetching} onClick={() => sync.mutate()}>
        <RefreshCw className="mr-2 h-4 w-4" />{sync.isPending ? 'Import en cours…' : 'Importer les candidatures Carrières'}
      </Button>
    </CardHeader>
    <CardContent className="space-y-3">
      {rightsLoading && <p role="status">Vérification des droits RH…</p>}
      {rightsError && <p role="alert" className="text-destructive">Impossible de vérifier vos droits RH.</p>}
      {!rightsLoading && !rightsError && !isHr && <p role="alert">Accès réservé au service RH et aux responsables habilités.</p>}
      {enabled && <>
        <Input aria-label="Rechercher une candidature Carrières" placeholder="Nom, email, pôle…" value={search} onChange={e => setSearch(e.target.value)} />
        {inbox.isLoading && <p role="status">Chargement des candidatures…</p>}
        {inbox.isError && <p role="alert" className="text-destructive">Registre Talent indisponible. Vérifier la migration, les permissions et la connexion Supabase. <Button variant="outline" onClick={() => void inbox.refetch()}>Réessayer</Button></p>}
        {!inbox.isLoading && !inbox.isError && filtered.length === 0 && <p className="text-sm text-muted-foreground">Aucune candidature Carrières synchronisée correspondant à la recherche. L'absence de dossier ne signifie pas que la plateforme n'a reçu aucune demande.</p>}
        {!inbox.isLoading && !inbox.isError && filtered.length > 0 &&
          <div className="overflow-x-auto rounded border"><table className="w-full text-left text-sm">
            <thead className="border-b"><tr>{['Candidat', 'Pôle demandé', 'Pôle proposé', 'Date de dépôt', 'Statut Platform', 'Action'].map(x => <th key={x} className="p-3">{x}</th>)}</tr></thead>
            <tbody>{filtered.map(row => <tr className="border-b last:border-0" key={row.platform_application_id}>
              <td className="p-3"><span className="block font-medium">{row.full_name}</span><span className="text-xs text-muted-foreground">{row.email}</span></td>
              <td className="p-3">{row.preferred_pole || '—'}</td>
              <td className="p-3">{row.assigned_pole || '—'}</td>
              <td className="p-3">{new Date(row.submitted_at).toLocaleDateString('fr-FR')}</td>
              <td className="p-3"><Badge variant="outline">{row.platform_status || '—'}</Badge></td>
              <td className="p-3"><Button size="sm" variant="outline" onClick={() => setSelected(row)}>Examiner</Button></td>
            </tr>)}</tbody>
          </table></div>}
        <p className="text-xs text-muted-foreground">Un import conserve l'identifiant Platform et réconcilie les retraits ou purges après un export complet. La qualification et la décision restent manuelles dans le pipeline RH ; aucun compte ni contrat n’est créé automatiquement.</p>
      </>}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Candidature Carrières BIB</DialogTitle></DialogHeader>
          {selected && <div className="space-y-2 text-sm">
            <p><strong>Candidat :</strong> {selected.full_name}</p>
            <p><strong>Contact :</strong> {selected.email}</p>
            <p><strong>Pôle :</strong> {selected.preferred_pole || '—'} / {selected.assigned_pole || '—'}</p>
            <p><strong>Contribution :</strong> {selected.contribution_type || '—'}</p>
            <p><strong>Activité actuelle :</strong> {selected.current_activity || '—'}</p>
            <p><strong>Localisation :</strong> {selected.location || '—'}</p>
            <p><strong>Disponibilité :</strong> {selected.availability || '—'}</p>
            <p className="whitespace-pre-wrap"><strong>Compétences :</strong> {selected.skills || '—'}</p>
            <p className="whitespace-pre-wrap"><strong>Motivation :</strong> {selected.motivation || '—'}</p>
            <p><strong>Portfolio :</strong> {selected.portfolio_url || '—'}</p>
            <p><strong>Consentement :</strong> {new Date(selected.consent_given_at).toLocaleString('fr-FR')}</p>
            <p><strong>Fin de conservation :</strong> {new Date(selected.retention_until).toLocaleDateString('fr-FR')}</p>
            <p><strong>Vivier futur :</strong> {selected.future_opportunities_consent ? 'Consentement distinct donné' : 'Non'}</p>
          </div>}
        </DialogContent>
      </Dialog>
    </CardContent>
  </Card>;
}
