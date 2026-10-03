import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Loader2,
  Upload,
} from 'lucide-react';
import { usePlatformActions } from '@/hooks/usePlatformSync';
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
import { supabase } from '@/integrations/supabase/client';

type TechStatus = 'not_sent' | 'sent' | 'pending' | 'integrated' | 'rejected' | 'info_requested';

interface ValidatedProduct {
  id: string;
  name: string;
  sku: string;
  supplier: string;
  supplier_id: string;
  category: string;
  moq: number;
  unitPrice: number;
  validatedAt: string;
  validatedBy: string;
  techStatus: TechStatus;
}

export default function ValidatedProducts() {
  const { pushProduct } = usePlatformActions();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<ValidatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('supplier') ?? '');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, suppliers(name)')
      .eq('status', 'validated')
      .order('validated_at', { ascending: false });

    if (error) {
      console.error('Error fetching validated products:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les produits.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const mapped: ValidatedProduct[] = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku || '',
      supplier: p.suppliers?.name || 'Inconnu',
      supplier_id: p.supplier_id,
      category: p.category || 'Non classé',
      moq: p.moq || 1,
      unitPrice: Number(p.unit_price) || 0,
      validatedAt: p.validated_at || p.created_at,
      validatedBy: p.validated_by || '',
      techStatus: (p.tech_integration_status as TechStatus) || 'not_sent',
    }));

    setProducts(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel('products-supplier-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

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
        default: return new Date(b.validatedAt).getTime() - new Date(a.validatedAt).getTime();
      }
    });

  const transmitToTech = async (ids: string[]) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('products')
      .update({
        tech_integration_status: 'pending',
        transmitted_at: now,
      } as any)
      .in('id', ids);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }

    // Create a notification for the tech pole
    await supabase.from('notifications').insert(
      ids.map(id => {
        const product = products.find(p => p.id === id);
        return {
          title: 'Nouveau produit à intégrer',
          message: `Le produit "${product?.name}" a été transmis par le pôle Fournisseur pour intégration au catalogue.`,
          type: 'info' as const,
          pole_id: 'tech' as const,
          action_url: '/pole/tech/received-products',
        };
      })
    );

    setProducts(prev => prev.map(p =>
      ids.includes(p.id) ? { ...p, techStatus: 'pending' as TechStatus } : p
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

  const getTechBadge = (status: TechStatus) => {
    switch (status) {
      case 'not_sent': return <Badge variant="outline" className="text-[10px]">Non transmis</Badge>;
      case 'pending': return <Badge variant="secondary" className="text-[10px]">En attente Tech</Badge>;
      case 'sent': return <Badge variant="secondary" className="text-[10px]">Transmis</Badge>;
      case 'integrated': return <Badge variant="outline" className="text-[10px] text-success border-success">Intégré</Badge>;
      case 'rejected': return <Badge variant="destructive" className="text-[10px]">Rejeté Tech</Badge>;
      case 'info_requested': return <Badge variant="outline" className="text-[10px] text-warning border-warning">Info demandée</Badge>;
    }
  };

  const sentCount = products.filter(p => ['sent', 'pending'].includes(p.techStatus)).length;
  const confirmedCount = products.filter(p => p.techStatus === 'integrated').length;
  const selectedNotSent = [...selected].filter(id => products.find(p => p.id === id)?.techStatus === 'not_sent');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total produits</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{products.length}</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Fournisseurs</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{new Set(products.map(p => p.supplier)).size}</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Transmis Tech</p>
          <p className="text-2xl font-semibold text-primary mt-1">{sentCount + confirmedCount}</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Intégrés catalogue</p>
          <p className="text-2xl font-semibold text-success mt-1">{confirmedCount}</p>
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
          </SelectContent>
        </Select>
        <ExportButtons filename="produits-valides" title="Produits validés" poleName="Fournisseur" columns={[
          { header: 'Nom', accessor: 'name' }, { header: 'SKU', accessor: 'sku' },
          { header: 'Fournisseur', accessor: 'supplier' }, { header: 'Catégorie', accessor: 'category' },
          { header: 'Prix', accessor: 'unitPrice' }, { header: 'MOQ', accessor: 'moq' },
          { header: 'Validé le', accessor: 'validatedAt' }, { header: 'Statut Tech', accessor: 'techStatus' },
        ]} data={filteredProducts} />
      </div>

      {/* Empty state */}
      {filteredProducts.length === 0 && !loading && (
        <div className="enterprise-card p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">Aucun produit validé</h3>
          <p className="text-sm text-muted-foreground mt-1">Les produits validés apparaîtront ici.</p>
        </div>
      )}

      {/* Table */}
      {filteredProducts.length > 0 && (
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
                        <DropdownMenuItem onClick={() => pushProduct.mutate(product.id)} disabled={pushProduct.isPending}>
                          <Upload className="h-4 w-4 mr-2" />Publier sur B.I.B Platform
                        </DropdownMenuItem>
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
      )}
    </div>
  );
}
