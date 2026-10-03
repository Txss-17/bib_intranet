import { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock,
  MoreVertical,
  Eye,
  FileText,
  TrendingUp,
  Euro,
  Loader2,
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ExportButtons } from '@/components/ExportButtons';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type IntegrationStatus = 'pending' | 'integrated' | 'rejected' | 'info_requested';

interface ReceivedProduct {
  id: string;
  name: string;
  sku: string;
  supplier_name: string;
  supplier_id: string;
  category: string;
  unit_price: number;
  selling_price: number;
  margin: number;
  moq: number;
  description: string;
  ingredients: string;
  dimensions: string;
  weight: string;
  certifications: string[];
  image_url: string;
  gallery: string[];
  product_sheet_url: string;
  barcode: string;
  origin: string;
  shelf_life: string;
  transmitted_at: string;
  transmitted_by: string;
  tech_integration_status: IntegrationStatus;
}

const statusConfig: Record<IntegrationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  pending: { label: 'En attente', variant: 'secondary' },
  integrated: { label: 'Intégré', variant: 'outline', className: 'text-success border-success' },
  rejected: { label: 'Rejeté', variant: 'destructive' },
  info_requested: { label: 'Info demandée', variant: 'outline', className: 'text-warning border-warning' },
};

export default function ReceivedProducts() {
  const [products, setProducts] = useState<ReceivedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<ReceivedProduct | null>(null);
  const { toast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    // Fetch products that have been transmitted to tech (tech_integration_status != 'not_sent')
    const { data: productsData, error } = await supabase
      .from('products')
      .select('*, suppliers(name)')
      .not('transmitted_at', 'is', null)
      .order('transmitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les produits.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const mapped: ReceivedProduct[] = (productsData || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku || '',
      supplier_name: p.suppliers?.name || 'Inconnu',
      supplier_id: p.supplier_id,
      category: p.category || 'Non classé',
      unit_price: Number(p.unit_price) || 0,
      selling_price: Number(p.selling_price) || 0,
      margin: Number(p.margin) || 0,
      moq: p.moq || 1,
      description: p.description || '',
      ingredients: p.ingredients || '',
      dimensions: p.dimensions || '',
      weight: p.weight || '',
      certifications: [],
      image_url: p.image_url || '/placeholder.svg',
      gallery: p.gallery || [],
      product_sheet_url: p.product_sheet_url || '',
      barcode: p.barcode || '',
      origin: p.origin || '',
      shelf_life: p.shelf_life || '',
      transmitted_at: p.transmitted_at || '',
      transmitted_by: p.transmitted_by || '',
      tech_integration_status: (p.tech_integration_status as IntegrationStatus) || 'pending',
    }));

    setProducts(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();

    // Realtime subscription
    const channel = supabase
      .channel('products-tech-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const categories = [...new Set(products.map(p => p.category))];

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplier_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.tech_integration_status === statusFilter;
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCat;
  });

  const updateStatus = async (id: string, newStatus: IntegrationStatus, actionLabel: string) => {
    const { error } = await supabase
      .from('products')
      .update({ tech_integration_status: newStatus } as any)
      .eq('id', id);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }

    setProducts(prev => prev.map(p => p.id === id ? { ...p, tech_integration_status: newStatus } : p));
    const product = products.find(p => p.id === id);
    toast({ title: actionLabel, description: `${product?.name} — statut mis à jour.` });
    if (selectedProduct?.id === id) {
      setSelectedProduct(prev => prev ? { ...prev, tech_integration_status: newStatus } : null);
    }
  };

  const pendingCount = products.filter(p => p.tech_integration_status === 'pending').length;
  const integratedCount = products.filter(p => p.tech_integration_status === 'integrated').length;
  const rejectedCount = products.filter(p => p.tech_integration_status === 'rejected').length;
  const avgMargin = products.length > 0 ? (products.reduce((sum, p) => sum + p.margin, 0) / products.length).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Produits reçus du Supplier</h1>
        <p className="text-sm text-muted-foreground mt-1">Produits validés transmis pour intégration au catalogue Tech</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Marge moy.</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-4 w-4 text-success" />
            <p className="text-2xl font-semibold text-success">{avgMargin}%</p>
          </div>
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
        <ExportButtons filename="produits-recus-tech" title="Produits reçus Tech" poleName="Tech" columns={[
          { header: 'Nom', accessor: 'name' }, { header: 'SKU', accessor: 'sku' },
          { header: 'Fournisseur', accessor: 'supplier_name' }, { header: 'Catégorie', accessor: 'category' },
          { header: 'Prix achat', accessor: 'unit_price' }, { header: 'Prix vente', accessor: 'selling_price' },
          { header: 'Marge %', accessor: 'margin' }, { header: 'MOQ', accessor: 'moq' },
          { header: 'Statut', accessor: 'tech_integration_status' },
        ]} data={filtered} />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && !loading && (
        <div className="enterprise-card p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">Aucun produit reçu</h3>
          <p className="text-sm text-muted-foreground mt-1">Les produits validés par le pôle Fournisseur apparaîtront ici une fois transmis.</p>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="enterprise-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produit</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Fournisseur</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prix achat</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Prix vente</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Marge</th>
                <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => {
                const cfg = statusConfig[product.tech_integration_status];
                return (
                  <tr key={product.id} className="border-b border-border/50 hover:bg-secondary/20 cursor-pointer" onClick={() => setSelectedProduct(product)}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary overflow-hidden">
                          <img src={product.image_url} alt={product.name} className="h-10 w-10 object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <p className="text-sm text-foreground">{product.supplier_name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-sm font-medium text-foreground">{product.unit_price.toFixed(2)} €</p>
                      <p className="text-xs text-muted-foreground">MOQ: {product.moq}</p>
                    </td>
                    <td className="p-4 text-right hidden lg:table-cell">
                      <p className="text-sm font-medium text-foreground">{product.selling_price > 0 ? `${product.selling_price.toFixed(2)} €` : '—'}</p>
                    </td>
                    <td className="p-4 text-right hidden lg:table-cell">
                      {product.margin > 0 ? (
                        <p className={`text-sm font-semibold ${product.margin >= 50 ? 'text-success' : 'text-warning'}`}>
                          {product.margin.toFixed(1)}%
                        </p>
                      ) : <p className="text-sm text-muted-foreground">—</p>}
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={cfg.variant} className={`text-[10px] ${cfg.className || ''}`}>{cfg.label}</Badge>
                    </td>
                    <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedProduct(product)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {product.tech_integration_status === 'pending' && (
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
                            {product.tech_integration_status === 'info_requested' && (
                              <DropdownMenuItem onClick={() => updateStatus(product.id, 'integrated', 'Produit intégré')}>
                                <CheckCircle className="h-4 w-4 mr-2" />Intégrer au catalogue
                              </DropdownMenuItem>
                            )}
                            {(product.tech_integration_status === 'integrated' || product.tech_integration_status === 'rejected') && (
                              <DropdownMenuItem disabled>
                                <Clock className="h-4 w-4 mr-2" />Traitement terminé
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-lg">{selectedProduct.name}</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">{selectedProduct.sku} • {selectedProduct.supplier_name}</p>
                  </div>
                  <Badge variant={statusConfig[selectedProduct.tech_integration_status].variant} className={statusConfig[selectedProduct.tech_integration_status].className || ''}>
                    {statusConfig[selectedProduct.tech_integration_status].label}
                  </Badge>
                </div>
              </DialogHeader>

              <Tabs defaultValue="details" className="mt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Détails</TabsTrigger>
                  <TabsTrigger value="pricing">Prix & Marge</TabsTrigger>
                  <TabsTrigger value="media">Images</TabsTrigger>
                  <TabsTrigger value="docs">Fiche produit</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedProduct.description || 'Aucune description disponible.'}</p>
                  </div>
                  <Separator />
                  {selectedProduct.ingredients && (
                    <>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">Composition / Ingrédients</h4>
                        <p className="text-sm text-muted-foreground">{selectedProduct.ingredients}</p>
                      </div>
                      <Separator />
                    </>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Catégorie</p>
                      <p className="text-sm font-medium text-foreground mt-1">{selectedProduct.category}</p>
                    </div>
                    {selectedProduct.origin && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Origine</p>
                        <p className="text-sm font-medium text-foreground mt-1">{selectedProduct.origin}</p>
                      </div>
                    )}
                    {selectedProduct.shelf_life && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Durée de vie</p>
                        <p className="text-sm font-medium text-foreground mt-1">{selectedProduct.shelf_life}</p>
                      </div>
                    )}
                    {selectedProduct.dimensions && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Dimensions</p>
                        <p className="text-sm font-medium text-foreground mt-1">{selectedProduct.dimensions}</p>
                      </div>
                    )}
                    {selectedProduct.weight && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Poids</p>
                        <p className="text-sm font-medium text-foreground mt-1">{selectedProduct.weight}</p>
                      </div>
                    )}
                    {selectedProduct.barcode && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Code-barres</p>
                        <p className="text-sm font-medium text-foreground mt-1 font-mono">{selectedProduct.barcode}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="enterprise-card p-4 text-center">
                      <Euro className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Prix d'achat</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{selectedProduct.unit_price.toFixed(2)} €</p>
                    </div>
                    <div className="enterprise-card p-4 text-center">
                      <Euro className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Prix de vente</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{selectedProduct.selling_price > 0 ? `${selectedProduct.selling_price.toFixed(2)} €` : '—'}</p>
                    </div>
                    <div className="enterprise-card p-4 text-center">
                      <TrendingUp className="h-5 w-5 text-success mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Marge brute</p>
                      <p className={`text-2xl font-bold mt-1 ${selectedProduct.margin >= 50 ? 'text-success' : selectedProduct.margin > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                        {selectedProduct.margin > 0 ? `${selectedProduct.margin.toFixed(1)}%` : '—'}
                      </p>
                    </div>
                    <div className="enterprise-card p-4 text-center">
                      <Package className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">MOQ</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{selectedProduct.moq}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="enterprise-card p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Résumé financier</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Montant minimum de commande</span>
                        <span className="font-medium text-foreground">{(selectedProduct.unit_price * selectedProduct.moq).toFixed(2)} €</span>
                      </div>
                      {selectedProduct.selling_price > 0 && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">CA potentiel (au MOQ)</span>
                            <span className="font-medium text-foreground">{(selectedProduct.selling_price * selectedProduct.moq).toFixed(2)} €</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Marge brute estimée (au MOQ)</span>
                            <span className="font-semibold text-success">
                              {((selectedProduct.selling_price - selectedProduct.unit_price) * selectedProduct.moq).toFixed(2)} €
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-4 mt-4">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Image principale</h4>
                    <div className="rounded-lg border border-border overflow-hidden bg-secondary/20 w-48 h-48 flex items-center justify-center">
                      <img src={selectedProduct.image_url} alt={selectedProduct.name} className="max-h-full max-w-full object-contain" />
                    </div>
                  </div>
                  {selectedProduct.gallery.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-3">Galerie ({selectedProduct.gallery.length} images)</h4>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                          {selectedProduct.gallery.map((img, i) => (
                            <div key={i} className="rounded-lg border border-border overflow-hidden bg-secondary/20 aspect-square flex items-center justify-center">
                              <img src={img} alt={`${selectedProduct.name} - ${i + 1}`} className="max-h-full max-w-full object-contain" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="docs" className="space-y-4 mt-4">
                  {selectedProduct.product_sheet_url ? (
                    <div className="enterprise-card p-4 flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                        <FileText className="h-6 w-6 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Fiche technique</p>
                        <p className="text-xs text-muted-foreground">Document PDF</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => window.open(selectedProduct.product_sheet_url, '_blank')}>
                        Télécharger
                      </Button>
                    </div>
                  ) : (
                    <div className="enterprise-card p-8 text-center">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Aucune fiche technique disponible</p>
                    </div>
                  )}
                  <div className="enterprise-card p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Informations de transmission</p>
                    <div className="space-y-2 text-sm">
                      {selectedProduct.transmitted_at && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date de transmission</span>
                          <span className="font-medium text-foreground">{new Date(selectedProduct.transmitted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fournisseur</span>
                        <span className="font-medium text-foreground">{selectedProduct.supplier_name}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action buttons */}
              {selectedProduct.tech_integration_status === 'pending' && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Button className="flex-1" onClick={() => updateStatus(selectedProduct.id, 'integrated', 'Produit intégré')}>
                    <CheckCircle className="h-4 w-4 mr-2" />Intégrer au catalogue
                  </Button>
                  <Button variant="outline" onClick={() => updateStatus(selectedProduct.id, 'info_requested', 'Info demandée')}>
                    <MessageSquare className="h-4 w-4 mr-2" />Demander info
                  </Button>
                  <Button variant="destructive" onClick={() => updateStatus(selectedProduct.id, 'rejected', 'Produit rejeté')}>
                    <XCircle className="h-4 w-4 mr-2" />Rejeter
                  </Button>
                </div>
              )}
              {selectedProduct.tech_integration_status === 'info_requested' && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Button className="flex-1" onClick={() => updateStatus(selectedProduct.id, 'integrated', 'Produit intégré')}>
                    <CheckCircle className="h-4 w-4 mr-2" />Intégrer au catalogue
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
