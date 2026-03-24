import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Building2, Search, Plus, MoreVertical, Eye, Edit, Mail, Phone, MapPin,
  Shield, AlertTriangle, CheckCircle, Clock, XCircle, ClipboardCheck, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ExportButtons } from '@/components/ExportButtons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useSupplierAudits } from '@/hooks/useAudits';

const mockSuppliers = [
  { id: '1', name: 'BioCosmetics SAS', contactName: 'Jean-Pierre Martin', email: 'contact@biocosmetics.fr', phone: '+33 1 42 56 78 90', address: '15 Rue des Lilas, 75011 Paris', country: 'France', status: 'validated', riskScore: 15, productsCount: 12, validatedAt: '2025-06-15T10:00:00Z', certifications: ['ISO 9001', 'Ecocert'] },
  { id: '2', name: 'NaturaCare', contactName: 'Sophie Durand', email: 'pro@naturacare.com', phone: '+33 4 91 23 45 67', address: '28 Avenue de la Mer, 13008 Marseille', country: 'France', status: 'validated', riskScore: 8, productsCount: 8, validatedAt: '2025-08-20T14:30:00Z', certifications: ['Bio AB', 'Cosmos Organic'] },
  { id: '3', name: 'GreenBeauty', contactName: 'Thomas Bernard', email: 'hello@greenbeauty.de', phone: '+49 30 1234 5678', address: 'Friedrichstraße 123, 10117 Berlin', country: 'Allemagne', status: 'pending', riskScore: 35, productsCount: 3, validatedAt: null, certifications: ['BDIH'] },
  { id: '4', name: 'AromaPlantes', contactName: 'Claire Lefevre', email: 'info@aromaplantes.fr', phone: '+33 5 56 78 90 12', address: '5 Chemin des Vignes, 33000 Bordeaux', country: 'France', status: 'validated', riskScore: 5, productsCount: 25, validatedAt: '2025-03-10T09:00:00Z', certifications: ['ISO 22716', 'Ecocert', 'AB'] },
  { id: '5', name: 'OrganicWorld Ltd', contactName: 'James Wilson', email: 'sales@organicworld.co.uk', phone: '+44 20 7946 0958', address: '42 Oxford Street, London W1D 1BS', country: 'Royaume-Uni', status: 'suspended', riskScore: 72, productsCount: 0, validatedAt: '2024-11-05T11:00:00Z', certifications: ['Soil Association'] },
];

function AuditConformitySection({ supplierName }: { supplierName: string }) {
  const { data: audits = [], isLoading } = useSupplierAudits();

  const supplierAudits = audits.filter(a =>
    a.supplier.toLowerCase().includes(supplierName.toLowerCase().split(' ')[0])
  );

  const completedAudits = supplierAudits.filter(a => a.status === 'completed');
  const latestAudit = completedAudits.length > 0 ? completedAudits[0] : null;
  const avgScore = completedAudits.length
    ? Math.round(completedAudits.reduce((s, a) => s + (a.score || 0), 0) / completedAudits.length)
    : null;

  const getAuditStatusBadge = (score: number | null) => {
    if (score === null) return <Badge variant="secondary">Non audité</Badge>;
    if (score >= 70) return <Badge className="bg-green-500/10 text-green-500">Conforme</Badge>;
    if (score >= 50) return <Badge className="bg-yellow-500/10 text-yellow-500">À surveiller</Badge>;
    return <Badge variant="destructive">Non conforme</Badge>;
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement des audits...</p>;

  return (
    <div className="space-y-4">
      {/* Audit KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Statut audit</p>
          <div className="mt-1">{getAuditStatusBadge(avgScore)}</div>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Score qualité</p>
          <p className={cn('text-lg font-bold mt-1', avgScore !== null && avgScore >= 70 ? 'text-green-500' : avgScore !== null && avgScore >= 50 ? 'text-yellow-500' : 'text-destructive')}>
            {avgScore !== null ? `${avgScore}%` : '—'}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Dernier audit</p>
          <p className="text-sm font-medium mt-1">
            {latestAudit ? format(new Date(latestAudit.date), 'd MMM yyyy', { locale: fr }) : '—'}
          </p>
        </div>
      </div>

      {/* Audit History */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Historique des audits</p>
        {supplierAudits.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucun audit enregistré pour ce fournisseur.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {supplierAudits.map((audit) => (
              <div key={audit.id} className="flex items-center justify-between p-2 rounded-md border border-border/50 text-sm">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <span className="font-medium">{audit.category}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {format(new Date(audit.date), 'd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {audit.score !== null ? (
                    <span className={cn('font-bold text-xs', audit.score >= 70 ? 'text-green-500' : audit.score >= 50 ? 'text-yellow-500' : 'text-destructive')}>
                      {audit.score}%
                    </span>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] h-5">{audit.status === 'in_progress' ? 'En cours' : 'Planifié'}</Badge>
                  )}
                  {audit.findings !== null && audit.findings > 0 && (
                    <Badge variant="outline" className="text-[10px] h-5 text-yellow-500">{audit.findings} NC</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SupplierFiles() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState<typeof mockSuppliers[0] | null>(null);

  const filteredSuppliers = mockSuppliers.filter((supplier) => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validated':
        return <Badge variant="outline" className="text-success border-success"><CheckCircle className="h-3 w-3 mr-1" />Validé</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-warning border-warning"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="text-destructive border-destructive"><XCircle className="h-3 w-3 mr-1" />Suspendu</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRiskBadge = (score: number) => {
    if (score >= 60) return <Badge variant="destructive">Risque élevé ({score})</Badge>;
    if (score >= 30) return <Badge variant="secondary" className="bg-warning/20 text-warning">Risque moyen ({score})</Badge>;
    return <Badge variant="outline" className="text-success border-success">Risque faible ({score})</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Fiches fournisseurs</h1>
          <p className="text-sm text-muted-foreground mt-1">{filteredSuppliers.length} fournisseur(s)</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Nouveau fournisseur</Button>
        <ExportButtons
          filename="fournisseurs" title="Liste des fournisseurs"
          columns={[
            { header: 'Nom', accessor: 'name' }, { header: 'Contact', accessor: 'contactName' },
            { header: 'Email', accessor: 'email' }, { header: 'Téléphone', accessor: 'phone' },
            { header: 'Pays', accessor: 'country' }, { header: 'Statut', accessor: 'status' },
            { header: 'Score risque', accessor: 'riskScore' }, { header: 'Produits', accessor: 'productsCount' },
          ]}
          data={filteredSuppliers}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="enterprise-card p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p><p className="text-2xl font-semibold text-foreground mt-1">{mockSuppliers.length}</p></div>
        <div className="enterprise-card p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">Validés</p><p className="text-2xl font-semibold text-success mt-1">{mockSuppliers.filter(s => s.status === 'validated').length}</p></div>
        <div className="enterprise-card p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">En attente</p><p className="text-2xl font-semibold text-warning mt-1">{mockSuppliers.filter(s => s.status === 'pending').length}</p></div>
        <div className="enterprise-card p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">À risque</p><p className="text-2xl font-semibold text-destructive mt-1">{mockSuppliers.filter(s => s.riskScore >= 60).length}</p></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher par nom, contact ou pays..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="validated">Validés</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="suspended">Suspendus</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSuppliers.map((supplier) => (
          <div key={supplier.id} className="enterprise-card p-4 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setSelectedSupplier(supplier)}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary"><Building2 className="h-5 w-5 text-muted-foreground" /></div>
                <div><p className="text-sm font-medium text-foreground">{supplier.name}</p><p className="text-xs text-muted-foreground">{supplier.country}</p></div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />Voir fiche</DropdownMenuItem>
                  <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Modifier</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem><Mail className="h-4 w-4 mr-2" />Contacter</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail className="h-3 w-3" /><span>{supplier.email}</span></div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Phone className="h-3 w-3" /><span>{supplier.phone}</span></div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-2">{getStatusBadge(supplier.status)}{getRiskBadge(supplier.riskScore)}</div>
              <div className="text-xs text-muted-foreground">{supplier.productsCount} produit(s)</div>
            </div>
          </div>
        ))}
      </div>

      {/* Supplier Detail Dialog with Tabs */}
      <Dialog open={!!selectedSupplier} onOpenChange={() => setSelectedSupplier(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3"><Building2 className="h-5 w-5" />{selectedSupplier?.name}</DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedSupplier.status)}
                {getRiskBadge(selectedSupplier.riskScore)}
              </div>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="info" className="flex-1">Informations</TabsTrigger>
                  <TabsTrigger value="audit" className="flex-1">Audit & Conformité</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-6 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contact</p><p className="text-sm font-medium">{selectedSupplier.contactName}</p></div>
                      <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Email</p><p className="text-sm">{selectedSupplier.email}</p></div>
                      <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Téléphone</p><p className="text-sm">{selectedSupplier.phone}</p></div>
                    </div>
                    <div className="space-y-4">
                      <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Adresse</p><p className="text-sm">{selectedSupplier.address}</p></div>
                      <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pays</p><p className="text-sm">{selectedSupplier.country}</p></div>
                      {selectedSupplier.validatedAt && (
                        <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Validé le</p><p className="text-sm">{format(new Date(selectedSupplier.validatedAt), 'd MMMM yyyy', { locale: fr })}</p></div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Certifications</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSupplier.certifications.map((cert) => (
                        <Badge key={cert} variant="secondary"><Shield className="h-3 w-3 mr-1" />{cert}</Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="audit" className="mt-4">
                  <AuditConformitySection supplierName={selectedSupplier.name} />
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setSelectedSupplier(null)}>Fermer</Button>
                <Button>Voir tous les produits</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
