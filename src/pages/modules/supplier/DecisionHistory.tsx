import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  History, Search, Filter, CheckCircle, XCircle, Archive, RefreshCw,
  DollarSign, Package, User, ChevronRight, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

function useDecisionHistory() {
  return useQuery({
    queryKey: ['product_decisions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_decisions')
        .select('*, products(name, sku, supplier_id, suppliers(name))')
        .order('decision_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

const decisionTypeConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  validation: { label: 'Validation', icon: CheckCircle, color: 'text-success', bgColor: 'bg-success/10' },
  rejection: { label: 'Refus', icon: XCircle, color: 'text-destructive', bgColor: 'bg-destructive/10' },
  archive: { label: 'Archivage', icon: Archive, color: 'text-muted-foreground', bgColor: 'bg-muted' },
  reactivation: { label: 'Réactivation', icon: RefreshCw, color: 'text-accent', bgColor: 'bg-accent/10' },
  price_change: { label: 'Changement prix', icon: DollarSign, color: 'text-warning', bgColor: 'bg-warning/10' },
  moq_change: { label: 'Changement MOQ', icon: Package, color: 'text-warning', bgColor: 'bg-warning/10' },
};

export default function DecisionHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const { data: decisions = [], isLoading } = useDecisionHistory();

  const filteredDecisions = decisions.filter((decision) => {
    const productName = (decision.products as any)?.name || '';
    const productSku = (decision.products as any)?.sku || '';
    const supplierName = (decision.products as any)?.suppliers?.name || '';
    const matchesSearch = productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      productSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || decision.decision_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const groupedDecisions = filteredDecisions.reduce((groups, decision) => {
    const date = format(new Date(decision.decision_at), 'yyyy-MM-dd');
    if (!groups[date]) groups[date] = [];
    groups[date].push(decision);
    return groups;
  }, {} as Record<string, typeof decisions>);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Historique des décisions</h1>
          <p className="text-sm text-muted-foreground mt-1">Traçabilité complète des validations et modifications produits</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {Object.entries(decisionTypeConfig).map(([key, config]) => {
          const count = decisions.filter(d => d.decision_type === key).length;
          const Icon = config.icon;
          return (
            <div key={key} className="enterprise-card p-3">
              <div className="flex items-center gap-2">
                <div className={cn('p-1.5 rounded', config.bgColor)}><Icon className={cn('h-4 w-4', config.color)} /></div>
                <div><p className="text-lg font-semibold text-foreground">{count}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">{config.label}</p></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher par produit, SKU ou fournisseur..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Type de décision" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les décisions</SelectItem>
            {Object.entries(decisionTypeConfig).map(([key, { label }]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedDecisions).map(([date, decs]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr })}</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-3">
              {decs.map((decision) => {
                const config = decisionTypeConfig[decision.decision_type] || decisionTypeConfig.validation;
                const Icon = config.icon;
                const productName = (decision.products as any)?.name || 'Produit inconnu';
                const productSku = (decision.products as any)?.sku || '';
                const supplierName = (decision.products as any)?.suppliers?.name || '';

                return (
                  <div key={decision.id} className="enterprise-card p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', config.bgColor)}><Icon className={cn('h-5 w-5', config.color)} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={cn('text-[10px]', config.bgColor, config.color)}>{config.label}</Badge>
                          <span className="text-xs text-muted-foreground">{format(new Date(decision.decision_at), 'HH:mm', { locale: fr })}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground mt-1">{productName}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {productSku && <span>{productSku}</span>}
                          {supplierName && <><span>·</span><span>{supplierName}</span></>}
                        </div>
                        <div className="mt-3 p-3 rounded-lg bg-secondary/30"><p className="text-sm text-foreground">{decision.reason}</p></div>
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>Décision enregistrée</span>
                          {decision.previous_status !== decision.new_status && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Badge variant="outline" className="text-[10px] h-4">{decision.previous_status}</Badge>
                                <ChevronRight className="h-3 w-3" />
                                <Badge variant="outline" className="text-[10px] h-4">{decision.new_status}</Badge>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {filteredDecisions.length === 0 && (
          <div className="enterprise-card p-12 text-center"><History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Aucune décision trouvée</p></div>
        )}
      </div>
    </div>
  );
}
