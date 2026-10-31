import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePoleCollaborators, collaboratorName } from '@/hooks/usePoleCollaborators';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Pole = 'marketplace' | 'ops' | 'rh';
type Kind = 'customer' | 'logistics_partner' | 'employee';
type EntityOption = { id: string; label: string };
type Portfolio = { id: string; name: string; owner_id: string | null; status: string };
type Assignment = { portfolio_id: string; entity_kind: string; entity_id: string; ended_at: string | null };

const pageForPole: Record<Pole, string> = {
  marketplace: 'marketplace.customers', ops: 'ops.partners', rh: 'rh.portfolio',
};
const kindForPole: Record<Pole, Kind> = {
  marketplace: 'customer', ops: 'logistics_partner', rh: 'employee',
};

export default function CasePortfolioManager({
  pole, entities, title,
}: { pole: Pole; entities: EntityOption[]; title: string }) {
  const { can } = usePermissions();
  const page = pageForPole[pole];
  const canRead = can(page, 'read');
  const canManage = can(page, 'update');
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [entityId, setEntityId] = useState('');
  const [portfolioId, setPortfolioId] = useState('');
  const [reason, setReason] = useState('');
  const [transferPortfolioId, setTransferPortfolioId] = useState('');
  const [transferOwnerId, setTransferOwnerId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const { data: portfolios = [], isError: portfoliosError } = useQuery({
    queryKey: ['case-portfolios', pole],
    enabled: canRead,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('bib_case_portfolios').select('id,name,owner_id,status')
        .eq('pole', pole).order('name');
      if (error) throw error;
      return (data ?? []) as Portfolio[];
    },
  });
  const { data: assignments = [], isError: assignmentsError } = useQuery({
    queryKey: ['case-portfolio-members', pole],
    enabled: canRead,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('bib_case_portfolio_members')
        .select('portfolio_id,entity_kind,entity_id,ended_at')
        .eq('entity_kind',kindForPole[pole]).is('ended_at',null);
      if (error) throw error;
      return (data ?? []) as Assignment[];
    },
  });
  const { data: colleagues = [], isError: colleaguesError } = usePoleCollaborators(
    pole, page, 'update', canManage,
  );
  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('bib_create_case_portfolio' as never, {
        p_pole: pole, p_name: name.trim(), p_owner_id: ownerId || null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      setName(''); setOwnerId('');
      void qc.invalidateQueries({queryKey: ['case-portfolios',pole]});
      toast.success('Portefeuille créé.');
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const assign = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('bib_assign_case_entity' as never, {
        p_portfolio_id: portfolioId, p_kind: kindForPole[pole], p_entity_id: entityId,
        p_reason: reason.trim() || null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      setEntityId(''); setReason('');
      void qc.invalidateQueries({queryKey: ['case-portfolio-members',pole]});
      toast.success('Affectation enregistrée avec historique.');
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const transfer = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('bib_change_case_portfolio_owner' as never, {
        p_portfolio_id: transferPortfolioId,
        p_new_owner: transferOwnerId || null,
        p_reason: transferReason.trim() || null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      setTransferPortfolioId(''); setTransferOwnerId(''); setTransferReason('');
      void qc.invalidateQueries({ queryKey: ['case-portfolios',pole] });
      toast.success('Responsable modifié. Historique conservé.');
    },
    onError: (error: Error) => toast.error(error.message),
  });
  if (!canRead) return null;
  const active = portfolios.filter(p => p.status === 'active');
  const current = new Map(assignments.map(a => [a.entity_id, a.portfolio_id]));
  const names = new Map(portfolios.map(p => [p.id,p.name]));
  return (
    <Card>
      <CardHeader><CardTitle>{title} — portefeuilles & affectations</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        {(portfoliosError || assignmentsError) && (
          <p className="text-sm text-destructive">
            Les tables de portefeuilles sont indisponibles. Vérifier la migration 0070 et les permissions serveur.
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {active.length} portefeuille(s) actif(s) · {assignments.length} rattachement(s).
        </p>
        {canManage && (
          <div className="grid gap-5 lg:grid-cols-2">
            <form className="space-y-3" onSubmit={e => {e.preventDefault(); create.mutate();}}>
              <h3 className="font-medium">Créer un portefeuille</h3>
              <Input value={name} maxLength={120} required aria-label="Nom du portefeuille"
                placeholder="Nom du portefeuille" onChange={e => setName(e.target.value)}/>
              <select value={ownerId} aria-label="Responsable du portefeuille"
                onChange={e => setOwnerId(e.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">Sans responsable — direction</option>
                {colleagues.map(p => <option key={p.id} value={p.id}>
                  {collaboratorName(p)}
                </option>)}
              </select>
              {colleaguesError && <p className="text-sm text-destructive">Collaborateurs indisponibles.</p>}
              <Button type="submit" disabled={create.isPending || !name.trim() || colleaguesError}>Créer</Button>
            </form>
            <form className="space-y-3" onSubmit={e => {e.preventDefault(); assign.mutate();}}>
              <h3 className="font-medium">Rattacher ou réaffecter un dossier</h3>
              <select required value={entityId} aria-label="Entité à rattacher"
                onChange={e => setEntityId(e.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">Choisir une entité</option>
                {entities.map(item => <option key={item.id} value={item.id}>
                  {item.label} {current.has(item.id) ? `— ${names.get(current.get(item.id)!) ?? 'Affecté'}` : '— Non affecté'}
                </option>)}
              </select>
              <select required value={portfolioId} aria-label="Portefeuille cible"
                onChange={e => setPortfolioId(e.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">Choisir un portefeuille</option>
                {active.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Input value={reason} placeholder="Motif du transfert" aria-label="Motif du transfert"
                onChange={e => setReason(e.target.value)}/>
              <Button type="submit" disabled={assign.isPending || !entityId || !portfolioId}>
                Enregistrer l'affectation
              </Button>
            </form>
          </div>
        )}
        {canManage && active.length > 0 && (
          <form className="grid gap-3 rounded-md border p-3 md:grid-cols-3"
            onSubmit={e => {e.preventDefault(); transfer.mutate();}}>
            <div className="md:col-span-3 font-medium">Transférer la responsabilité d'un portefeuille</div>
            <select required value={transferPortfolioId} aria-label="Portefeuille à transférer"
              onChange={e => setTransferPortfolioId(e.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">Choisir un portefeuille</option>
              {active.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={transferOwnerId} aria-label="Nouveau responsable"
              onChange={e => setTransferOwnerId(e.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">Sans responsable — direction</option>
              {colleagues.map(p => <option key={p.id} value={p.id}>
                {collaboratorName(p)}
              </option>)}
            </select>
            <Input aria-label="Motif du changement de responsable" placeholder="Motif du transfert"
              value={transferReason} onChange={e => setTransferReason(e.target.value)}/>
            <div className="md:col-span-3"><Button type="submit" disabled={!transferPortfolioId || transfer.isPending}>
              {transfer.isPending ? 'Transfert…' : 'Changer le responsable'}
            </Button></div>
          </form>
        )}
        <div className="space-y-1 text-sm">
          {entities.length === 0 ? <p className="text-muted-foreground">Aucune entité disponible.</p> :
           entities.slice(0,100).map(item =>
             <div key={item.id} className="flex justify-between gap-3 border-b py-2">
               <span className="truncate">{item.label}</span>
               <span className="text-muted-foreground">{names.get(current.get(item.id) || '') || 'Non affecté'}</span>
             </div>)}
          {entities.length > 100 && <p className="text-muted-foreground">Affichage limité aux 100 premières entités. Utilisez la sélection pour les autres.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
