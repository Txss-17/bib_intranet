import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Package,
  CheckCircle,
  Search,
  Filter,
  MoreVertical,
  Archive,
  Edit,
  Eye,
  TrendingUp,
  TrendingDown,
  Send,
  SendHorizonal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

type TechStatus = 'not_sent' | 'sent' | 'confirmed';

interface ValidatedProduct {
  id: string;
  name: string;
  sku: string;
  supplier: string;
  category: string;
  moq: number;
  unitPrice: number;
  validatedAt: string;
  validatedBy: string;
  salesTrend: string;
  stock: number;
  techStatus: TechStatus;
}

const initialProducts: ValidatedProduct[] = [
  { id: '1', name: 'Huile Essentielle Eucalyptus 10ml', sku: 'HUI-EUC-001', supplier: 'AromaPlantes', category: 'Aromathérapie', moq: 100, unitPrice: 6.80, validatedAt: '2026-01-02T10:30:00Z', validatedBy: 'Marie Dubois', salesTrend: 'up', stock: 450, techStatus: 'sent' },
  { id: '2', name: 'Baume Lèvres Karité', sku: 'BAU-KAR-002', supplier: 'NaturaCare', category: 'Soins', moq: 500, unitPrice: 3.20, validatedAt: '2025-12-28T14:15:00Z', validatedBy: 'Pierre Laurent', salesTrend: 'up', stock: 1200, techStatus: 'confirmed' },
  { id: '3', name: 'Savon Noir Traditionnel 250ml', sku: 'SAV-NOI-003', supplier: 'BioCosmetics SAS', category: 'Hygiène', moq: 200, unitPrice: 7.50, validatedAt: '2025-12-20T09:00:00Z', validatedBy: 'Marie Dubois', salesTrend: 'down', stock: 89, techStatus: 'not_sent' },
  { id: '4', name: 'Gel Aloe Vera Pur 100ml', sku: 'GEL-ALO-004', supplier: 'GreenBeauty', category: 'Soins', moq: 300, unitPrice: 5.90, validatedAt: '2025-12-15T16:45:00Z', validatedBy: 'Pierre Laurent', salesTrend: 'stable', stock: 320, techStatus: 'not_sent' },
  { id: '5', name: 'Dentifrice Menthe Bio 75ml', sku: 'DEN-MEN-005', supplier: 'BioCosmetics SAS', category: 'Hygiène', moq: 400, unitPrice: 4.10, validatedAt: '2025-12-10T11:20:00Z', validatedBy: 'Marie Dubois', salesTrend: 'up', stock: 650, techStatus: 'not_sent' },
];

export default function ValidatedProducts() {
  const [products, setProducts] = useState<ValidatedProduct[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const categories = [...new Set(products.map(p => p.category))];

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.supplier.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'price': return b.unitPrice - a.unitPrice;
        case 'stock': return b.stock - a.stock;
        default: return new Date(b.validatedAt).getTime() - new Date(a.validatedAt).getTime();
      }
    });

  const transmitToTech = (ids: string[]) => {
    setProducts(prev => prev.map(p =>
      ids.includes(p.id) && p.techStatus === 'not_sent'
        ? { ...p, techStatus: 'sent' as TechStatus }
        : p
    ));
    setSelected(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
    const count = ids.length;
    toast({
      title: 'Transmis au pôle Tech',
      description: `${count} produit${count > 1 ? 's' : ''} transmis pour intégration catalogue.`,
    });
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectableIds = filteredProducts.filter(p => p.techStatus === 'not_sent').map(p => p.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every(id => selected.has(id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        selectableIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelected(prev => new Set([...prev, ...selectableIds]));
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-success" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <div className="h-4 w-4 rounded-full bg-muted" />;
  };

  const getStockBadge = (stock: number) => {
    if (stock < 100) return <Badge variant="destructive" className="text-[10px]">Stock bas</Badge>;
    if (stock < 300) return <Badge variant="secondary" className="text-[10px]">Stock moyen</Badge>;
    return <Badge variant="outline" className="text-[10px] text-success border-success">En stock</Badge>;
  };

  const getTechBadge = (status: TechStatus) => {
    switch (status) {
      case 'not_sent': return <Badge variant="outline" className="text-[10px]">Non transmis</Badge>;
      case 'sent': return <Badge variant="secondary" className="text-[10px]">Transmis</Badge>;
      case 'confirmed': return <Badge variant="outline" className="text-[10px] text-success border-success">Confirmé</Badge>;
    }
  };

  const sentCount = products.filter(p => p.techStatus === 'sent').length;
  const confirmedCount = products.filter(p => p.techStatus === 'confirmed').length;
  const selectedNotSent = [...selected].filter(id => products.find(p => p.id === id)?.techStatus === 'not_sent');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Produits validés</h1>
          <p className="text-sm text-muted-foreground mt-1">{filteredProducts.length} produit(s) au catalogue</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedNotSent.length > 0 && (
            <Button size="sm" onClick={() => transmitToTech(selectedNotSent)}>
              <Send className="h-4 w-4 mr-1" />
              Transmettre ({selectedNotSent.length})
            </Button>
          )}
          <Badge variant="outline" className="text-success border-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            {products.length} actifs
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total produits</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{products.length}</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Fournisseurs</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{new Set(products.map(p => p.supplier)).size}</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Valeur catalogue</p>
          <p className="text-2xl font-semibold text-foreground mt-1">
            {products.reduce((acc, p) => acc + p.unitPrice * p.stock, 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
          </p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Stock bas</p>
          <p className="text-2xl font-semibold text-warning mt-1">{products.filter(p => p.stock < 100).length}</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Transmis Tech</p>
          <p className="text-2xl font-semibold text-primary mt-1">{sentCount + confirmedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher par nom, SKU ou fournisseur..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Catégorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Trier par" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Plus récent</SelectItem>
            <SelectItem value="name">Nom A-Z</SelectItem>
            <SelectItem value="price">Prix ↓</SelectItem>
            <SelectItem value="stock">Stock ↓</SelectItem>
          </SelectContent>
        </Select>
        <ExportButtons filename="produits-valides" title="Produits validés" columns={[
          { header: 'Nom', accessor: 'name' }, { header: 'SKU', accessor: 'sku' },
          { header: 'Fournisseur', accessor: 'supplier' }, { header: 'Catégorie', accessor: 'category' },
          { header: 'Prix', accessor: 'unitPrice' }, { header: 'Stock', accessor: 'stock' },
          { header: 'MOQ', accessor: 'moq' }, { header: 'Validé le', accessor: 'validatedAt' },
        ]} data={filteredProducts} />
      </div>

      {/* Table */}
      <div className="enterprise-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="p-4 w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produit</th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Fournisseur</th>
              <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prix</th>
              <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Stock</th>
              <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Tech</th>
              <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} className="border-b border-border/50 hover:bg-secondary/20">
                <td className="p-4">
                  <Checkbox
                    checked={selected.has(product.id)}
                    onCheckedChange={() => toggleSelect(product.id)}
                    disabled={product.techStatus !== 'not_sent'}
                  />
                </td>
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
                <td className="p-4 text-right hidden lg:table-cell">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm font-medium text-foreground">{product.stock}</span>
                    {getStockBadge(product.stock)}
                  </div>
                </td>
                <td className="p-4 hidden lg:table-cell">
                  <div className="flex justify-center">{getTechBadge(product.techStatus)}</div>
                </td>
                <td className="p-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />Voir détails</DropdownMenuItem>
                      <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Modifier</DropdownMenuItem>
                      {product.techStatus === 'not_sent' && (
                        <DropdownMenuItem onClick={() => transmitToTech([product.id])}>
                          <Send className="h-4 w-4 mr-2" />Transmettre au Tech
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive"><Archive className="h-4 w-4 mr-2" />Archiver</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
