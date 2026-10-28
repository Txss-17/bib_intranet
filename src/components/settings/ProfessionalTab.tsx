import { useQuery } from '@tanstack/react-query';
import { Briefcase, Building2, Home, RefreshCw, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { poles as allPoles } from '@/data/poles';

interface ProfessionalDetails {
  position_key: string | null;
  position_label: string | null;
  contract_type: string | null;
  start_date: string | null;
  work_mode: string | null;
  subsidiary: string | null;
  manager_id: string | null;
  manager_name: string | null;
  manager_email: string | null;
  poles?: string[];
  seniority?: string | null;
}
const workModes: Record<string, string> = {
  office: 'Sur site', hybrid: 'Hybride', remote: 'Télétravail',
};
const seniorities: Record<string, string> = {
  junior: 'Junior', mid: 'Confirmé', senior: 'Senior', lead: 'Lead', executive: 'Direction',
};
function dateLabel(value: string | null) {
  if (!value) return 'Non renseignée';
  const date = new Date(value.length === 10 ? value + 'T12:00:00' : value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR');
}

export function ProfessionalTab() {
  const { user } = useAuth();
  const details = useQuery({
    queryKey: ['my-hr-professional-details', user?.id],
    enabled: !!user,
    refetchInterval: 30_000,
    queryFn: async (): Promise<ProfessionalDetails> => {
      const { data, error } = await supabase.rpc('my_hr_professional_details' as never);
      if (error || !data || typeof data !== 'object' || Array.isArray(data))
        throw new Error('Les informations professionnelles n’ont pas pu être chargées.');
      return data as unknown as ProfessionalDetails;
    },
  });

  if (details.isLoading) return <p role="status" className="enterprise-card p-6 text-sm text-muted-foreground">Chargement de vos informations RH…</p>;
  if (details.isError) return <div role="alert" className="enterprise-card space-y-3 p-6">
    <p className="text-sm text-destructive">Vos informations professionnelles sont momentanément indisponibles.</p>
    <Button size="sm" variant="outline" disabled={details.isFetching} onClick={() => void details.refetch()}>Réessayer</Button>
  </div>;
  if (!details.data) return <p className="enterprise-card p-6 text-sm text-muted-foreground">Connectez-vous pour consulter vos informations professionnelles.</p>;

  const current = details.data;
  return (
    <div className="space-y-6">
      <div className="enterprise-card p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-medium text-foreground"><Briefcase className="h-4 w-4" /> Poste & organisation</h3>
            <p className="mt-1 text-sm text-muted-foreground">Ces informations proviennent du dossier RH. Contactez les RH pour demander un changement.</p>
          </div>
          <Button size="sm" variant="outline" disabled={details.isFetching} onClick={() => void details.refetch()}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Actualiser
          </Button>
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-muted-foreground">Poste actuel</dt>
            <dd className="font-medium">{current.position_label ?? current.position_key ?? 'Non renseigné'}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-muted-foreground">Pôles affectés</dt>
            <dd className="flex flex-wrap gap-1">{current.poles?.length
              ? current.poles.map((pole) => <Badge key={pole} variant="outline">{allPoles.find((item) => item.id === pole)?.name ?? pole}</Badge>)
              : 'Non renseignés'}</dd>
          </div>
          <div className="space-y-1">
            <dt className="flex items-center gap-1 text-muted-foreground"><Building2 className="h-3.5 w-3.5" /> Filiale</dt>
            <dd className="font-medium">{current.subsidiary ?? 'Non renseignée'}</dd>
          </div>
          <div className="space-y-1">
            <dt className="flex items-center gap-1 text-muted-foreground"><Home className="h-3.5 w-3.5" /> Mode de travail</dt>
            <dd className="font-medium">{current.work_mode ? workModes[current.work_mode] ?? current.work_mode : 'Non renseigné'}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-muted-foreground">Type de contrat</dt>
            <dd className="font-medium">{current.contract_type ?? 'Non renseigné'}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-muted-foreground">Date de prise d’effet du dossier RH</dt>
            <dd className="font-medium">{dateLabel(current.start_date)}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-muted-foreground">Séniorité</dt>
            <dd className="font-medium">{current.seniority ? seniorities[current.seniority] ?? current.seniority : 'Non renseignée'}</dd>
          </div>
        </dl>
      </div>
      <div className="enterprise-card p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-foreground"><UserCog className="h-4 w-4" /> Référent RH</h3>
        {current.manager_id ? <div className="space-y-1 text-sm">
          <p className="font-medium">{current.manager_name ?? 'Référent renseigné'}</p>
          {current.manager_email && <p className="text-muted-foreground">{current.manager_email}</p>}
        </div> : <p className="text-sm text-muted-foreground">Aucun référent RH renseigné. Contactez les RH pour rattacher votre fiche.</p>}
      </div>
    </div>
  );
}
