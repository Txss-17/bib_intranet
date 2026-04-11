import { useState, useEffect } from 'react';
import { Package, Search, Eye, ExternalLink, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CatalogProduct {
  id: string;
  name: string;
  sku: string;
  supplier: string;
  category: string;
  description: string;
  unitPrice: number;
  sellingPrice: number;
  margin: number;
  imageUrl: string | null;
  gallery: string[];
  ingredients: string | null;
  origin: string | null;
  weight: string | null;
  dimensions: string | null;
  barcode: string | null;
  shelfLife: string | null;
  productSheetUrl: string | null;
}

export default function ProductCatalog() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, suppliers(name)')
        .eq('tech_integration_status', 'integrated')
        .order('name');

      if (error) {
        console.error(error);
        toast({ title: 'Erreur', description: 'Impossible de charger le catalogue.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      setProducts((data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku || '',
        supplier: p.suppliers?.name || 'Inconnu',
        category: p.category || 'Non classé',
        description: p.description || '',
        unitPrice: Number(p.unit_price) || 0,
        sellingPrice: Number(p.selling_price) || 0,
        margin: Number(p.margin) || 0,
        imageUrl: p.image_url,
        gallery: p.gallery || [],
        ingredients: p.ingredients,
        origin: p.origin,
        weight: p.weight,
        dimensions: p.dimensions,
        barcode: p.barcode,
        shelfLife: p.shelf_life,
        productSheetUrl: p.product_sheet_url,
      })));
      setLoading(false);
    };

    fetchProducts();

    const channel = supabase
      .channel('marketing-catalog')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => { fetchProducts(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const categories = [...new Set(products.map(p => p.category))];
  const filtered = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.supplier.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
      return matchSearch && matchCat;
    });

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
        <h1 className="text-xl font-semibold text-foreground">Catalogue Produits</h1>
        <p className="text-sm text-muted-foreground mt-1">Produits intégrés disponibles pour les campagnes marketing</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Produits catalogue</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{products.length}</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Catégories</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{categories.length}</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Prix moyen</p>
          <p className="text-2xl font-semibold text-foreground mt-1">
            {products.length > 0 ? (products.reduce((s, p) => s + p.sellingPrice, 0) / products.length).toFixed(2) : '0'} €
          </p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Marge moyenne</p>
          <p className="text-2xl font-semibold text-success mt-1">
            {products.length > 0 ? (products.reduce((s, p) => s + p.margin, 0) / products.length).toFixed(1) : '0'}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Catégorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="enterprise-card p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">Aucun produit au catalogue</h3>
          <p className="text-sm text-muted-foreground mt-1">Les produits intégrés par le pôle Tech apparaîtront ici.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(product => (
            <div key={product.id} className="enterprise-card overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedProduct(product)}>
              <div className="aspect-video bg-secondary/30 relative overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
                <Badge variant="secondary" className="absolute top-2 right-2 text-[10px]">{product.category}</Badge>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-semibold text-foreground line-clamp-1">{product.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-lg font-bold text-foreground">{product.sellingPrice.toFixed(2)} €</p>
                    <p className="text-[10px] text-muted-foreground">Achat: {product.unitPrice.toFixed(2)} €</p>
                  </div>
                  <Badge variant="outline" className="text-success border-success text-xs">
                    {product.margin.toFixed(0)}% marge
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{product.supplier} • {product.origin}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProduct.name}</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="details">
                <TabsList className="w-full">
                  <TabsTrigger value="details" className="flex-1">Détails</TabsTrigger>
                  <TabsTrigger value="pricing" className="flex-1">Prix & Marge</TabsTrigger>
                  <TabsTrigger value="media" className="flex-1">Médias</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoRow label="SKU" value={selectedProduct.sku} />
                    <InfoRow label="Fournisseur" value={selectedProduct.supplier} />
                    <InfoRow label="Catégorie" value={selectedProduct.category} />
                    <InfoRow label="Origine" value={selectedProduct.origin} />
                    <InfoRow label="Poids" value={selectedProduct.weight} />
                    <InfoRow label="Dimensions" value={selectedProduct.dimensions} />
                    <InfoRow label="Code-barres" value={selectedProduct.barcode} />
                    <InfoRow label="Durée de vie" value={selectedProduct.shelfLife} />
                  </div>
                  {selectedProduct.ingredients && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Ingrédients</p>
                      <p className="text-sm text-foreground">{selectedProduct.ingredients}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4 mt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="enterprise-card p-4 text-center">
                      <p className="text-xs text-muted-foreground">Prix d'achat</p>
                      <p className="text-xl font-bold text-foreground mt-1">{selectedProduct.unitPrice.toFixed(2)} €</p>
                    </div>
                    <div className="enterprise-card p-4 text-center">
                      <p className="text-xs text-muted-foreground">Prix de vente</p>
                      <p className="text-xl font-bold text-primary mt-1">{selectedProduct.sellingPrice.toFixed(2)} €</p>
                    </div>
                    <div className="enterprise-card p-4 text-center">
                      <p className="text-xs text-muted-foreground">Marge brute</p>
                      <p className="text-xl font-bold text-success mt-1">{selectedProduct.margin.toFixed(1)}%</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-4 mt-4">
                  {selectedProduct.imageUrl ? (
                    <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full rounded-lg max-h-64 object-cover" />
                  ) : (
                    <div className="enterprise-card p-8 text-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Aucune image</p>
                    </div>
                  )}
                  {selectedProduct.gallery.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {selectedProduct.gallery.map((url, i) => (
                        <img key={i} src={url} alt={`Gallery ${i}`} className="rounded-lg aspect-square object-cover" />
                      ))}
                    </div>
                  )}
                  {selectedProduct.productSheetUrl && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={selectedProduct.productSheetUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />Fiche produit
                      </a>
                    </Button>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}
