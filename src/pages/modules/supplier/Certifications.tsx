import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Shield, Search, Plus, AlertTriangle, CheckCircle, Clock, XCircle,
  FileText, ExternalLink, Calendar, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

function useCertifications() {
  return useQuery({
    queryKey: ['certifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certifications')
        .select('*, suppliers(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

const certificationTypes: Record<string, { label: string; color: string }> = {
  iso: { label: 'ISO', color: 'bg-blue-500/20 text-blue-400' },
  organic: { label: 'Bio / Organic', color: 'bg-green-500/20 text-green-400' },
  fair_trade: { label: 'Commerce équitable', color: 'bg-amber-500/20 text-amber-400' },
  eco_label: { label: 'Éco-label', color: 'bg-emerald-500/20 text-emerald-400' },
  quality: { label: 'Qualité', color: 'bg-purple-500/20 text-purple-400' },
  safety: { label: 'Sécurité', color: 'bg-red-500/20 text-red-400' },
  other: { label: 'Autre', color: 'bg-gray-500/20 text-gray-400' },
};

export default function Certifications() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: certifications = [], isLoading } = useCertifications();

  const filteredCertifications = certifications.filter((cert) => {
    const supplierName = (cert.suppliers as any)?.name || '';
    const matchesSearch = cert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cert.issuer || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || cert.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || cert.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge variant="outline" className="text-success border-success"><CheckCircle className="h-3 w-3 mr-1" />Valide</Badge>;
      case 'pending_renewal':
        return <Badge variant="outline" className="text-warning border-warning"><Clock className="h-3 w-3 mr-1" />À renouveler</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-destructive border-destructive"><XCircle className="h-3 w-3 mr-1" />Expiré</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getExpiryInfo = (expiryDate: string | null) => {
    if (!expiryDate) return { text: 'Pas de date', color: 'text-muted-foreground', progress: 50 };
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return { text: `Expiré depuis ${Math.abs(days)} jours`, color: 'text-destructive', progress: 0 };
    if (days <= 30) return { text: `Expire dans ${days} jours`, color: 'text-destructive', progress: 10 };
    if (days <= 90) return { text: `Expire dans ${days} jours`, color: 'text-warning', progress: 30 };
    return { text: `Expire dans ${days} jours`, color: 'text-muted-foreground', progress: Math.min(100, days / 3.65) };
  };

  const expiringCount = certifications.filter(c => {
    if (!c.expiry_date) return false;
    const days = differenceInDays(new Date(c.expiry_date), new Date());
    return days >= 0 && days <= 90;
  }).length;

  const expiredCount = certifications.filter(c => c.status === 'expired').length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Certifications</h1>
          <p className="text-sm text-muted-foreground mt-1">Suivi des certifications fournisseurs et produits</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Ajouter certification</Button>
      </div>

      {(expiringCount > 0 || expiredCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expiredCount > 0 && (
            <div className="enterprise-card p-4 border-destructive/50 bg-destructive/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/20"><XCircle className="h-5 w-5 text-destructive" /></div>
                <div><p className="text-sm font-medium text-foreground">{expiredCount} certification(s) expirée(s)</p><p className="text-xs text-muted-foreground">Action immédiate requise</p></div>
              </div>
            </div>
          )}
          {expiringCount > 0 && (
            <div className="enterprise-card p-4 border-warning/50 bg-warning/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20"><AlertTriangle className="h-5 w-5 text-warning" /></div>
                <div><p className="text-sm font-medium text-foreground">{expiringCount} certification(s) à renouveler</p><p className="text-xs text-muted-foreground">Expiration dans les 90 prochains jours</p></div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="enterprise-card p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p><p className="text-2xl font-semibold text-foreground mt-1">{certifications.length}</p></div>
        <div className="enterprise-card p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">Valides</p><p className="text-2xl font-semibold text-success mt-1">{certifications.filter(c => c.status === 'valid').length}</p></div>
        <div className="enterprise-card p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">À renouveler</p><p className="text-2xl font-semibold text-warning mt-1">{certifications.filter(c => c.status === 'pending_renewal').length}</p></div>
        <div className="enterprise-card p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">Expirées</p><p className="text-2xl font-semibold text-destructive mt-1">{expiredCount}</p></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher par nom, fournisseur ou émetteur..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            {Object.entries(certificationTypes).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="valid">Valides</SelectItem>
            <SelectItem value="pending_renewal">À renouveler</SelectItem>
            <SelectItem value="expired">Expirées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredCertifications.map((cert) => {
          const typeInfo = certificationTypes[cert.type] || certificationTypes.other;
          const expiryInfo = getExpiryInfo(cert.expiry_date);
          const supplierName = (cert.suppliers as any)?.name || 'N/A';

          return (
            <div key={cert.id} className="enterprise-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary"><Shield className="h-5 w-5 text-muted-foreground" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">{cert.name}</p>
                      <Badge className={cn('text-[10px]', typeInfo.color)}>{typeInfo.label}</Badge>
                      {getStatusBadge(cert.status)}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{supplierName}</span>
                      {cert.issuer && <><span>·</span><span>Émis par {cert.issuer}</span></>}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      {cert.certificate_number && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground"><FileText className="h-3 w-3" /><span>{cert.certificate_number}</span></div>
                      )}
                      {cert.issue_date && cert.expiry_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(cert.issue_date), 'd MMM yyyy', { locale: fr })} → {format(new Date(cert.expiry_date), 'd MMM yyyy', { locale: fr })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className={cn('text-xs', expiryInfo.color)}>{expiryInfo.text}</p>
                  <div className="w-24"><Progress value={expiryInfo.progress} className="h-1" /></div>
                  <Button variant="ghost" size="sm"><ExternalLink className="h-3 w-3 mr-1" />Voir</Button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredCertifications.length === 0 && (
          <div className="enterprise-card p-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Aucune certification trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
}
