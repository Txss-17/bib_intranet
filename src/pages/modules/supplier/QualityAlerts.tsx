import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertTriangle, Search, Plus, AlertCircle, CheckCircle, Clock, Eye,
  MessageSquare, User, Building2, Package, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

function useQualityAlerts() {
  return useQuery({
    queryKey: ['quality_alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quality_alerts')
        .select('*, suppliers(name), products(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

const severityConfig: Record<string, { label: string; color: string; icon: any }> = {
  critical: { label: 'Critique', color: 'bg-destructive text-destructive-foreground', icon: AlertCircle },
  high: { label: 'Élevée', color: 'bg-orange-500 text-white', icon: AlertTriangle },
  medium: { label: 'Moyenne', color: 'bg-warning text-warning-foreground', icon: AlertTriangle },
  low: { label: 'Faible', color: 'bg-muted text-muted-foreground', icon: AlertCircle },
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: 'Ouvert', color: 'text-destructive border-destructive', icon: AlertCircle },
  investigating: { label: 'En cours', color: 'text-warning border-warning', icon: Clock },
  resolved: { label: 'Résolu', color: 'text-success border-success', icon: CheckCircle },
  closed: { label: 'Clôturé', color: 'text-muted-foreground border-muted-foreground', icon: CheckCircle },
};

export default function QualityAlerts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isNewAlertOpen, setIsNewAlertOpen] = useState(false);
  const { data: alerts = [], isLoading } = useQualityAlerts();

  const filteredAlerts = alerts.filter((alert) => {
    const supplierName = (alert.suppliers as any)?.name || '';
    const productName = (alert.products as any)?.name || '';
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const openAlerts = alerts.filter(a => a.status === 'open' || a.status === 'investigating');
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status !== 'closed');

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Alertes qualité</h1>
          <p className="text-sm text-muted-foreground mt-1">Suivi des incidents et non-conformités</p>
        </div>
        <Dialog open={isNewAlertOpen} onOpenChange={setIsNewAlertOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nouvelle alerte</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une alerte qualité</DialogTitle>
              <DialogDescription>Signalez un incident ou une non-conformité fournisseur/produit.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label htmlFor="title">Titre</Label><Input id="title" placeholder="Titre de l'alerte..." /></div>
              <div className="space-y-2">
                <Label htmlFor="severity">Sévérité</Label>
                <Select><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>{Object.entries(severityConfig).map(([key, { label }]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" placeholder="Décrivez le problème en détail..." rows={4} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewAlertOpen(false)}>Annuler</Button>
              <Button onClick={() => setIsNewAlertOpen(false)}>Créer l'alerte</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {criticalAlerts.length > 0 && (
        <div className="enterprise-card p-4 border-destructive/50 bg-destructive/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/20 animate-pulse"><AlertCircle className="h-5 w-5 text-destructive" /></div>
            <div><p className="text-sm font-medium text-foreground">{criticalAlerts.length} alerte(s) critique(s) en cours</p><p className="text-xs text-muted-foreground">Action immédiate requise</p></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="enterprise-card p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">Total alertes</p><p className="text-2xl font-semibold text-foreground mt-1">{alerts.length}</p></div>
        <div className="enterprise-card p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">En cours</p><p className="text-2xl font-semibold text-warning mt-1">{openAlerts.length}</p></div>
        <div className="enterprise-card p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">Critiques</p><p className="text-2xl font-semibold text-destructive mt-1">{criticalAlerts.length}</p></div>
        <div className="enterprise-card p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">Résolues</p><p className="text-2xl font-semibold text-success mt-1">{alerts.filter(a => a.status === 'resolved' || a.status === 'closed').length}</p></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher par titre, fournisseur ou produit..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Sévérité" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Toutes</SelectItem>{Object.entries(severityConfig).map(([key, { label }]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}</SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Tous statuts</SelectItem>{Object.entries(statusConfig).map(([key, { label }]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}</SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredAlerts.map((alert) => {
          const severity = severityConfig[alert.severity] || severityConfig.medium;
          const status = statusConfig[alert.status] || statusConfig.open;
          const StatusIcon = status.icon;
          const supplierName = (alert.suppliers as any)?.name || '';
          const productName = (alert.products as any)?.name || '';

          return (
            <div key={alert.id} className="enterprise-card p-4 hover:bg-secondary/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', severity.color)}><AlertTriangle className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <Badge className={cn('text-[10px]', severity.color)}>{severity.label}</Badge>
                    <Badge variant="outline" className={cn('text-[10px]', status.color)}><StatusIcon className="h-3 w-3 mr-1" />{status.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{alert.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    {supplierName && <div className="flex items-center gap-1"><Building2 className="h-3 w-3" /><span>{supplierName}</span></div>}
                    {productName && <div className="flex items-center gap-1"><Package className="h-3 w-3" /><span>{productName}</span></div>}
                    <div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span>{format(new Date(alert.created_at), 'd MMM yyyy HH:mm', { locale: fr })}</span></div>
                  </div>
                  {alert.resolution_notes && (
                    <div className="mt-3 p-3 rounded-lg bg-success/10 border border-success/20">
                      <p className="text-xs font-medium text-success mb-1">Résolution</p>
                      <p className="text-sm text-foreground">{alert.resolution_notes}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" size="sm"><Eye className="h-4 w-4 mr-1" />Voir</Button>
                  {(alert.status === 'open' || alert.status === 'investigating') && (
                    <Button variant="outline" size="sm"><MessageSquare className="h-4 w-4 mr-1" />Commenter</Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filteredAlerts.length === 0 && (
          <div className="enterprise-card p-12 text-center"><CheckCircle className="h-12 w-12 mx-auto text-success/30 mb-4" /><p className="text-muted-foreground">Aucune alerte qualité</p></div>
        )}
      </div>
    </div>
  );
}
