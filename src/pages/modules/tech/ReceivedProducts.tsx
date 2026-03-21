import { useState } from 'react';
import {
  Package,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock,
  MoreVertical,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExportButtons } from '@/components/ExportButtons';
import { useToast } from '@/hooks/use-toast';

type IntegrationStatus = 'pending' | 'integrated' | 'rejected' | 'info_requested';

interface ReceivedProduct {
  id: string;
  name: string;
  sku: string;
  supplier: string;
  category: string;
  unitPrice: number;
  moq: number;
  transmittedAt: string;
  transmittedBy: string;
  status: IntegrationStatus;
}

const initialReceivedProducts: ReceivedProduct[] = [
  { id: '1', name: 'Huile Essentielle Eucalyptus 10ml', sku: 'HUI-EUC-001', supplier: 'AromaPlantes', category: 'Aromathérapie', unitPrice: 6.80, moq: 100, transmittedAt: '2026-03-15T10:30:00Z', transmittedBy: 'Marie Dubois', status: 'pending' },
  { id: '2', name: 'Baume Lèvres Karité', sku: 'BAU-KAR-002', supplier: 'NaturaCare', category: 'Soins', unitPrice: 3.20, moq: 500, transmittedAt: '2026-03-12T14:15:00Z', transmittedBy: 'Pierre Laurent', status: 'integrated' },
  { id: '3', name: 'Sérum Vitamine C 30ml', sku: 'SER-VIT-006', supplier: 'GreenBeauty', category: 'Soins', unitPrice: 12.50, moq: 150, transmittedAt: '2026-03-10T09:00:00Z', transmittedBy: 'Marie Dubois', status: 'pending' },
  { id: '4', name: 'Shampoing Ortie Bio 250ml', sku: 'SHA-ORT-007', supplier: 'BioCosmetics SAS', category: 'Hygiène', unitPrice: 8.90, moq: 200, transmittedAt: '2026-03-08T16:45:00Z', transmittedBy: 'Pierre Laurent', status: 'info_requested' },
  { id: '5', name: 'Crème Mains Amande 75ml', sku: 'CRE-AMA-008', supplier: 'NaturaCare', category: 'Soins', unitPrice: 5.40, moq: 300, transmittedAt: '2026-03-05T11:20:00Z', transmittedBy: 'Marie Dubois', status: 'rejected' },
  { id: '6', name: 'Dentifrice Menthe Bio 75ml', sku: 'DEN-MEN-005', supplier: 'BioCosmetics SAS', category: 'Hygiène', unitPrice: 4.10, moq: 400, transmittedAt: '2026-03-18T08:00:00Z', transmittedBy: 'Marie Dubois', status: 'pending' },
  { id: '7', name: 'Huile Argan Pure 50ml', sku: 'HUI-ARG-009', supplier: 'AromaPlantes', category: 'Aromathérapie', unitPrice: 14.20, moq: 80, transmittedAt: '2026-03-02T13:30:00Z', transmittedBy: 'Pierre Laurent', status: 'integrated' },
  { id: '8', name: 'Savon Marseille Lavande 100g', sku: 'SAV-MAR-010', supplier: 'BioCosmetics SAS', category: 'Hygiène', unitPrice: 3.80, moq: 500, transmittedAt: '2026-03-01T10:00:00Z', transmittedBy: 'Marie Dubois', status: 'pending' },
];

const statusConfig: Record<IntegrationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  pending: { label: 'En attente', variant: 'secondary' },
  integrated: { label: 'Intégré', variant: 'outline', className: 'text-success border-success' },
  rejected: { label: 'Rejeté', variant: 'destructive' },
  info_requested: { label: 'Info demandée', variant: 'outline', className: 'text-warning border-warning' },
};

export default function ReceivedProducts() {
  const [products, setProducts] = useState<ReceivedProduct[]>(initialReceivedProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const { toast } = useToast();

  const categories = [...new Set(products.map(p => p.category))];

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCat;
  });

  const updateStatus = (id: string, newStatus: IntegrationStatus, actionLabel: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    const product = products.find(p => p.id === id);
    toast({ title: actionLabel, description: `${product?.name} — statut mis à jour.` });
  };

  const pendingCount = products.filter(p => p.status === 'pending').length;
  const integratedCount = products.filter(p => p.status === 'integrated').length;
  const rejectedCount = products.filter(p => p.status === 'rejected').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Produits reçus du Supplier</h1>
        <p className="text-sm text-muted-foreground mt-1">Produits validés transmis pour intégration au catalogue Tech</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total reçus</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{products.length}</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">En attente</p>
          <p className="text-2xl font-semibold text-warning mt-1">{pendingCount}</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Intégrés</p>
          <p className="text-2xl font-semibold text-success mt-1">{integratedCount}</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Rejetés</p>
          <p className="text-2xl font-semibold text-destructive mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher par nom, SKU ou fournisseur..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="integrated">Intégré</SelectItem>
            <SelectItem value="rejected">Rejeté</SelectItem>
            <SelectItem value="info_requested">Info demandée</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Catégorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <ExportButtons filename="produits-recus-tech" title="Produits reçus Tech" columns={[
          { header: 'Nom', accessor: 'name' }, { header: 'SKU', accessor: 'sku' },
          { header: 'Fournisseur', accessor: 'supplier' }, { header: 'Catégorie', accessor: 'category' },
          { header: 'Prix', accessor: 'unitPrice' }, { header: 'MOQ', accessor: 'moq' },
          { header: 'Transmis par', accessor: 'transmittedBy' }, { header: 'Statut', accessor: 'status' },
        ]} data={filtered} />
      </div>

      {/* Table */}
      <div className="enterprise-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produit</th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Fournisseur</th>
              <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prix</th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Transmis par</th>
              <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
              <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(product => {
              const cfg = statusConfig[product.status];
              return (
                <tr key={product.id} className="border-b border-border/50 hover:bg-secondary/20">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <p className="text-sm text-foreground">{product.supplier}</p>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </td>
                  <td className="p-4 text-right">
                    <p className="text-sm font-medium text-foreground">{product.unitPrice.toFixed(2)} €</p>
                    <p className="text-xs text-muted-foreground">MOQ: {product.moq}</p>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <p className="text-sm text-foreground">{product.transmittedBy}</p>
                  </td>
                  <td className="p-4 text-center">
                    <Badge variant={cfg.variant} className={`text-[10px] ${cfg.className || ''}`}>{cfg.label}</Badge>
                  </td>
                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {product.status === 'pending' && (
                          <>
                            <DropdownMenuItem onClick={() => updateStatus(product.id, 'integrated', 'Produit intégré')}>
                              <CheckCircle className="h-4 w-4 mr-2" />Intégrer au catalogue
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(product.id, 'rejected', 'Produit rejeté')}>
                              <XCircle className="h-4 w-4 mr-2" />Rejeter
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(product.id, 'info_requested', 'Info demandée')}>
                              <MessageSquare className="h-4 w-4 mr-2" />Demander info
                            </DropdownMenuItem>
                          </>
                        )}
                        {product.status === 'info_requested' && (
                          <DropdownMenuItem onClick={() => updateStatus(product.id, 'integrated', 'Produit intégré')}>
                            <CheckCircle className="h-4 w-4 mr-2" />Intégrer au catalogue
                          </DropdownMenuItem>
                        )}
                        {(product.status === 'integrated' || product.status === 'rejected') && (
                          <DropdownMenuItem disabled>
                            <Clock className="h-4 w-4 mr-2" />Traitement terminé
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
