import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Package, Clock, CheckCircle, XCircle, Eye, Filter, Search, AlertTriangle, ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExportButtons } from '@/components/ExportButtons';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import FileUploadZone from '@/components/FileUploadZone';

const MARGIN_RATE = 0.20;
const ITEMS_PER_PAGE = 10;

interface Product {
  id: string;
  name: string;
  sku: string | null;
  supplier_id: string;
  supplier_name: string;
  category: string | null;
  unit_price: number | null;
  selling_price: number | null;
  margin: number | null;
  moq: number | null;
  description: string | null;
  origin: string | null;
  weight: string | null;
  dimensions: string | null;
  barcode: string | null;
  shelf_life: string | null;
  ingredients: string | null;
  image_url: string | null;
  gallery: string[];
  product_sheet_url: string | null;
  status: string;
  packaging_status: string | null;
  created_at: string;
}

export default function PendingProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [actionDialog, setActionDialog] = useState<'validate' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const { toast } = useToast();

  // New product form
  const [newProduct, setNewProduct] = useState({
    name: '', supplier_id: '', category: '', unit_price: '', description: '',
    origin: '', weight: '', dimensions: '', barcode: '', shelf_life: '',
    ingredients: '', moq: '1', sku: '',
  });
  const [newFiles, setNewFiles] = useState<{ name: string; url: string; type: string; size: number }[]>([]);

  const computedSellingPrice = newProduct.unit_price ? (parseFloat(newProduct.unit_price) * (1 + MARGIN_RATE)).toFixed(2) : '';
  const computedMargin = MARGIN_RATE * 100;

  const fetchProducts = async () => {
    const { data, error } = await (supabase as any)
      .from('products')
      .select('*, suppliers(name)')
      .in('status', ['pending', 'review'])
      .order('created_at', { ascending: false });

    if (error) { console.error(error); setLoading(false); return; }

    setProducts((data || []).map((p: any) => ({
      ...p,
      supplier_name: p.suppliers?.name || 'Inconnu',
      gallery: p.gallery || [],
    })));
    setLoading(false);
  };

  const fetchSuppliers = async () => {
    const { data } = await (supabase as any).from('suppliers').select('id, name').eq('status', 'active').order('name');
    setSuppliers(data || []);
  };

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();

    const channel = supabase
      .channel('pending-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchProducts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const unitPrice = parseFloat(newProduct.unit_price);
    if (isNaN(unitPrice) || unitPrice <= 0) {
      toast({ title: 'Erreur', description: 'Le prix unitaire doit être un nombre positif.', variant: 'destructive' });
      return;
    }
    const sellingPrice = unitPrice * (1 + MARGIN_RATE);
    const margin = MARGIN_RATE * 100;

    const imageFiles = newFiles.filter(f => f.type.startsWith('image/'));
    const docFiles = newFiles.filter(f => !f.type.startsWith('image/'));

    const { error } = await (supabase as any).from('products').insert({
      name: newProduct.name,
      supplier_id: newProduct.supplier_id,
      category: newProduct.category || null,
      unit_price: unitPrice,
      selling_price: sellingPrice,
      margin,
      moq: parseInt(newProduct.moq) || 1,
      description: newProduct.description || null,
      origin: newProduct.origin || null,
      weight: newProduct.weight || null,
      dimensions: newProduct.dimensions || null,
      barcode: newProduct.barcode || null,
      shelf_life: newProduct.shelf_life || null,
      ingredients: newProduct.ingredients || null,
      sku: newProduct.sku || null,
      image_url: imageFiles[0]?.url || null,
      gallery: imageFiles.slice(1).map(f => f.url),
      product_sheet_url: docFiles[0]?.url || null,
      status: 'pending',
    });

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Succès', description: 'Produit ajouté avec prix de vente calculé automatiquement.' });
      setAddOpen(false);
      setNewProduct({ name: '', supplier_id: '', category: '', unit_price: '', description: '', origin: '', weight: '', dimensions: '', barcode: '', shelf_life: '', ingredients: '', moq: '1', sku: '' });
      setNewFiles([]);
    }
  };

  const handleValidate = async () => {
    if (!selectedProduct) return;
    const { error } = await (supabase as any).from('products').update({ status: 'validated', validated_at: new Date().toISOString() }).eq('id', selectedProduct.id);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else toast({ title: 'Produit validé', description: selectedProduct.name });
    setActionDialog(null);
  };

  const handleReject = async () => {
    if (!selectedProduct) return;
    const { error } = await (supabase as any).from('products').update({ status: 'rejected', rejection_reason: rejectionReason }).eq('id', selectedProduct.id);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else toast({ title: 'Produit refusé', description: selectedProduct.name });
    setActionDialog(null);
    setRejectionReason('');
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.supplier_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchTab = activeTab === 'all' || p.status === activeTab;
    return matchSearch && matchCat && matchTab;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const pendingCount = products.filter(p => p.status === 'pending').length;
  const reviewCount = products.filter(p => p.status === 'review').length;
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Revue Produits Fournisseurs</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} produit(s) — Marge automatique : {MARGIN_RATE * 100}%</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons filename="produits-revue" title="Revue Produits" columns={[
            { header: 'Nom', accessor: 'name' }, { header: 'Fournisseur', accessor: 'supplier_name' },
            { header: 'Catégorie', accessor: 'category' }, { header: 'Prix achat', accessor: 'unit_price' },
            { header: 'Prix vente', accessor: 'selling_price' }, { header: 'Marge %', accessor: 'margin' },
          ]} data={filtered} />
          <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" />Nouveau produit</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }}>
        <TabsList>
          <TabsTrigger value="pending">En attente ({pendingCount})</TabsTrigger>
          <TabsTrigger value="review">En revue ({reviewCount})</TabsTrigger>
          <TabsTrigger value="all">Tous</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher nom, fournisseur..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Catégorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {categories.map(c => <SelectItem key={c!} value={c!}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix achat</TableHead>
                <TableHead>Prix vente (auto)</TableHead>
                <TableHead>Marge</TableHead>
                <TableHead>MOQ</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.supplier_name}</TableCell>
                  <TableCell>{p.category || '-'}</TableCell>
                  <TableCell>{p.unit_price != null ? `${Number(p.unit_price).toFixed(2)} €` : '-'}</TableCell>
                  <TableCell className="font-semibold text-primary">
                    {p.selling_price != null ? `${Number(p.selling_price).toFixed(2)} €` : p.unit_price != null ? `${(Number(p.unit_price) * (1 + MARGIN_RATE)).toFixed(2)} €` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{p.margin != null ? `${Number(p.margin).toFixed(0)}%` : `${MARGIN_RATE * 100}%`}</Badge>
                  </TableCell>
                  <TableCell>{p.moq || 1}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'pending' ? 'outline' : 'secondary'}>
                      {p.status === 'pending' ? 'En attente' : 'En revue'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(p)}><Eye className="h-3 w-3" /></Button>
                      <Button variant="outline" size="sm" className="text-emerald-600" onClick={() => { setSelectedProduct(p); setActionDialog('validate'); }}>
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => { setSelectedProduct(p); setActionDialog('reject'); }}>
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Aucun produit à afficher</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Add Product Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau produit fournisseur</DialogTitle>
            <DialogDescription>Le prix de vente est calculé automatiquement avec une marge de {MARGIN_RATE * 100}%</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom du produit *</Label>
                <Input value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Fournisseur *</Label>
                <Select value={newProduct.supplier_id} onValueChange={v => setNewProduct({ ...newProduct, supplier_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Prix d'achat (€) *</Label>
                <Input type="number" step="0.01" min="0" value={newProduct.unit_price} onChange={e => setNewProduct({ ...newProduct, unit_price: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Prix de vente (auto)</Label>
                <Input value={computedSellingPrice ? `${computedSellingPrice} €` : ''} disabled className="bg-muted font-semibold text-primary" />
              </div>
              <div className="space-y-2">
                <Label>Marge</Label>
                <Input value={`${computedMargin}%`} disabled className="bg-muted font-semibold" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Input value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>MOQ</Label>
                <Input type="number" min="1" value={newProduct.moq} onChange={e => setNewProduct({ ...newProduct, moq: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origine</Label>
                <Input value={newProduct.origin} onChange={e => setNewProduct({ ...newProduct, origin: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Code-barres</Label>
                <Input value={newProduct.barcode} onChange={e => setNewProduct({ ...newProduct, barcode: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Poids</Label>
                <Input value={newProduct.weight} onChange={e => setNewProduct({ ...newProduct, weight: e.target.value })} placeholder="ex: 100g" />
              </div>
              <div className="space-y-2">
                <Label>Dimensions</Label>
                <Input value={newProduct.dimensions} onChange={e => setNewProduct({ ...newProduct, dimensions: e.target.value })} placeholder="ex: 10x5x3 cm" />
              </div>
              <div className="space-y-2">
                <Label>Durée de vie</Label>
                <Input value={newProduct.shelf_life} onChange={e => setNewProduct({ ...newProduct, shelf_life: e.target.value })} placeholder="ex: 24 mois" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Ingrédients</Label>
              <Textarea value={newProduct.ingredients} onChange={e => setNewProduct({ ...newProduct, ingredients: e.target.value })} rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Images produit et fiche technique</Label>
              <FileUploadZone
                bucket="product-assets"
                folder="products"
                accept="image/*,application/pdf"
                files={newFiles}
                onFilesChange={setNewFiles}
                label="La 1ère image = photo principale. Les suivantes = galerie. PDF = fiche produit."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={!newProduct.name || !newProduct.supplier_id || !newProduct.unit_price}>Créer le produit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Validate Dialog */}
      <Dialog open={actionDialog === 'validate'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider le produit</DialogTitle>
            <DialogDescription>Confirmez la validation de "{selectedProduct?.name}" ?</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="py-4 grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground">Fournisseur</p><p className="font-medium text-foreground">{selectedProduct.supplier_name}</p></div>
              <div><p className="text-muted-foreground">Prix achat</p><p className="font-medium text-foreground">{Number(selectedProduct.unit_price).toFixed(2)} €</p></div>
              <div><p className="text-muted-foreground">Prix vente (auto)</p><p className="font-medium text-primary">{Number(selectedProduct.selling_price || Number(selectedProduct.unit_price) * (1 + MARGIN_RATE)).toFixed(2)} €</p></div>
              <div><p className="text-muted-foreground">Marge</p><p className="font-medium text-foreground">{selectedProduct.margin || MARGIN_RATE * 100}%</p></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Annuler</Button>
            <Button onClick={handleValidate} className="bg-primary hover:bg-primary/90">Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={actionDialog === 'reject'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser le produit</DialogTitle>
            <DialogDescription>Raison du refus pour "{selectedProduct?.name}"</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Raison du refus..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>Confirmer le refus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
