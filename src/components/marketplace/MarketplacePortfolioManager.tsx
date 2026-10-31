import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { useMarketplaceMerchants, useMarketplacePortfolios } from '@/hooks/useMarketplace';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Colleague = { id: string; first_name: string | null; last_name: string | null; email: string | null };

export default function MarketplacePortfolioManager() {
  const { can } = usePermissions();
  const canManage = can('marketplace.merchants', 'update') || can('marketplace.portfolio', 'update');
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [portfolioId, setPortfolioId] = useState('');
  const [reason, setReason] = useState('');
  const { data: merchants = [] } = useMarketplaceMerchants();
  const { data: portfolios = [] } = useMarketplacePortfolios();
  const { data: colleagues = [], isError: colleaguesError } = useQuery({
    queryKey: ['marketplace', 'portfolio-colleagues'],
    enabled: canManage,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles')
        .select('id,first_name,last_name,email')
        .eq('test_account', false).order('last_name');
      if (error) throw error;
      return (data ?? []) as Colleague[];
    },
  });

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
      toast.success('Marchand affecté. Historique conservé.');
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
                {[person.first_name, person.last_name].filter(Boolean).join(' ') || person.email || person.id}
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
            {merchants.map((merchant) => (
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
      </CardContent>
    </Card>
  );
}
