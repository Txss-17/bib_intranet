import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { usePoleCollaborators, collaboratorName } from '@/hooks/usePoleCollaborators';
import { useMarketplaceMerchants, useMarketplacePortfolios, useMarketplaceShops } from '@/hooks/useMarketplace';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function MarketplacePortfolioManager() {
  const { can } = usePermissions();
  const canManage = can('marketplace.merchants', 'update') || can('marketplace.portfolio', 'update');
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [portfolioId, setPortfolioId] = useState('');
  const [reason, setReason] = useState('');
  const [transferPortfolioId, setTransferPortfolioId] = useState('');
  const [transferOwnerId, setTransferOwnerId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const { data: merchants = [] } = useMarketplaceMerchants();
  const { data: shops = [] } = useMarketplaceShops();
  const merchantIds = new Set(shops.map(shop => shop.merchant_id).filter(Boolean));
  const eligibleMerchants = merchants.filter(merchant => merchantIds.has(merchant.id));
  const { data: portfolios = [] } = useMarketplacePortfolios();
  const { data: colleagues = [], isError: colleaguesError } = usePoleCollaborators(
    'marketplace', 'marketplace.merchants', 'update', canManage,
  );

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('marketplace_create_portfolio' as never, {
        p_name: name.trim(), p_owner_id: ownerId || null, p_notes: null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      setName(''); setOwnerId('');
      void queryClient.invalidateQueries({ queryKey: ['marketplace', 'portfolios'] });
      toast.success('Portefeuille créé.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const assign = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('marketplace_assign_merchant' as never, {
        p_merchant_id: merchantId,
        p_portfolio_id: portfolioId,
        p_reason: reason.trim() || null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      setMerchantId(''); setReason('');
      void queryClient.invalidateQueries({ queryKey: ['marketplace', 'merchant-portfolio-assignments'] });
      void queryClient.invalidateQueries({ queryKey: ['marketplace', 'portfolio-assignment', merchantId] });
      toast.success('Marchand affecté. Historique conservé.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const transfer = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('marketplace_change_portfolio_owner' as never, {
        p_portfolio_id: transferPortfolioId,
        p_new_owner: transferOwnerId || null,
        p_reason: transferReason.trim() || null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      setTransferPortfolioId(''); setTransferOwnerId(''); setTransferReason('');
      void queryClient.invalidateQueries({ queryKey: ['marketplace','portfolios'] });
      toast.success('Responsable modifié. Historique conservé.');
    },
    onError: (error: Error) => toast.error(error.message),
  });
  if (!canManage) return null;
  return (
    <Card>
      <CardHeader><CardTitle>Gestion des portefeuilles et affectations</CardTitle></CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); create.mutate(); }}>
          <h3 className="font-medium">Créer un portefeuille</h3>
          <Input aria-label="Nom du portefeuille" placeholder="Nom du portefeuille" maxLength={120}
            value={name} onChange={(event) => setName(event.target.value)} required />
          <select className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            aria-label="Collaborateur responsable" value={ownerId}
            onChange={(event) => setOwnerId(event.target.value)}>
            <option value="">Non attribué — géré par la direction</option>
            {colleagues.map((person) => (
              <option key={person.id} value={person.id}>
                {collaboratorName(person)}
              </option>
            ))}
          </select>
          {colleaguesError && <p className="text-sm text-destructive">Impossible de charger les collaborateurs.</p>}
          <Button type="submit" disabled={!name.trim() || create.isPending || !!colleaguesError}>
            {create.isPending ? 'Création…' : 'Créer'}
          </Button>
        </form>
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); assign.mutate(); }}>
          <h3 className="font-medium">Rattacher ou réaffecter un marchand</h3>
          <select className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            aria-label="Marchand" value={merchantId} required onChange={(event) => setMerchantId(event.target.value)}>
            <option value="">Sélectionner un marchand</option>
            {eligibleMerchants.map((merchant) => (
              <option key={merchant.id} value={merchant.id}>
                {merchant.company_name || merchant.contact_email || merchant.id}
              </option>
            ))}
          </select>
          <select className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            aria-label="Portefeuille de destination" value={portfolioId} required
            onChange={(event) => setPortfolioId(event.target.value)}>
            <option value="">Sélectionner un portefeuille</option>
            {portfolios.filter((portfolio) => portfolio.status === 'active' && portfolio.role_scope === 'marketplace')
              .map((portfolio) => <option key={portfolio.id} value={portfolio.id}>{portfolio.name}</option>)}
          </select>
          <Input aria-label="Motif d'affectation" placeholder="Motif (recommandé pour l'audit)"
            value={reason} onChange={(event) => setReason(event.target.value)} />
          <Button type="submit" disabled={!merchantId || !portfolioId || assign.isPending}>
            {assign.isPending ? 'Affectation…' : 'Enregistrer l’affectation'}
          </Button>
          <p className="text-xs text-muted-foreground">
            Une réaffectation clôt l'affectation précédente sans effacer son historique.
          </p>
        </form>
        <form className="space-y-3 lg:col-span-2" onSubmit={event => {event.preventDefault(); transfer.mutate();}}>
          <h3 className="font-medium">Changer le responsable d'un portefeuille</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <select required value={transferPortfolioId} aria-label="Portefeuille à transférer"
              onChange={e => setTransferPortfolioId(e.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">Portefeuille</option>
              {portfolios.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={transferOwnerId} aria-label="Nouveau responsable"
              onChange={e => setTransferOwnerId(e.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">Non attribué — direction</option>
              {colleagues.map(p => <option key={p.id} value={p.id}>
                {collaboratorName(p)}
              </option>)}
            </select>
            <Input placeholder="Motif du transfert" aria-label="Motif du transfert"
              value={transferReason} onChange={e => setTransferReason(e.target.value)}/>
          </div>
          <Button type="submit" disabled={!transferPortfolioId || transfer.isPending}>
            {transfer.isPending ? 'Transfert…' : 'Transférer la responsabilité'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
