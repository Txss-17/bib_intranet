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
  Eye,
  Image,
  FileText,
  TrendingUp,
  Euro,
  X,
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

type IntegrationStatus = 'pending' | 'integrated' | 'rejected' | 'info_requested';

interface ReceivedProduct {
  id: string;
  name: string;
  sku: string;
  supplier: string;
  category: string;
  unitPrice: number;
  sellingPrice: number;
  margin: number;
  moq: number;
  description: string;
  ingredients: string;
  dimensions: string;
  weight: string;
  certifications: string[];
  imageUrl: string;
  gallery: string[];
  productSheet: string;
  barcode: string;
  origin: string;
  shelfLife: string;
  transmittedAt: string;
  transmittedBy: string;
  status: IntegrationStatus;
}

const initialReceivedProducts: ReceivedProduct[] = [
  {
    id: '1', name: 'Huile Essentielle Eucalyptus 10ml', sku: 'HUI-EUC-001', supplier: 'AromaPlantes', category: 'Aromathérapie',
    unitPrice: 6.80, sellingPrice: 12.90, margin: 47.3, moq: 100,
    description: 'Huile essentielle d\'eucalyptus bio 100% pure et naturelle. Distillée à la vapeur à partir de feuilles fraîches. Idéale pour les voies respiratoires.',
    ingredients: 'Eucalyptus globulus leaf oil (100%)', dimensions: '3 x 3 x 8 cm', weight: '45g',
    certifications: ['Bio AB', 'Ecocert', 'COSMOS'], imageUrl: '/placeholder.svg',
    gallery: ['/placeholder.svg', '/placeholder.svg', '/placeholder.svg'],
    productSheet: 'FT-HUI-EUC-001.pdf', barcode: '3760012345001', origin: 'Portugal', shelfLife: '36 mois',
    transmittedAt: '2026-03-15T10:30:00Z', transmittedBy: 'Marie Dubois', status: 'pending',
  },
  {
    id: '2', name: 'Baume Lèvres Karité', sku: 'BAU-KAR-002', supplier: 'NaturaCare', category: 'Soins',
    unitPrice: 3.20, sellingPrice: 6.90, margin: 53.6, moq: 500,
    description: 'Baume à lèvres nourrissant au beurre de karité bio. Protection et hydratation longue durée. Texture fondante.',
    ingredients: 'Butyrospermum parkii butter, Cera alba, Ricinus communis seed oil, Tocopherol',
    dimensions: '2 x 2 x 6 cm', weight: '15g', certifications: ['Bio AB', 'Vegan'],
    imageUrl: '/placeholder.svg', gallery: ['/placeholder.svg', '/placeholder.svg'],
    productSheet: 'FT-BAU-KAR-002.pdf', barcode: '3760012345002', origin: 'France', shelfLife: '24 mois',
    transmittedAt: '2026-03-12T14:15:00Z', transmittedBy: 'Pierre Laurent', status: 'integrated',
  },
  {
    id: '3', name: 'Sérum Vitamine C 30ml', sku: 'SER-VIT-006', supplier: 'GreenBeauty', category: 'Soins',
    unitPrice: 12.50, sellingPrice: 24.90, margin: 49.8, moq: 150,
    description: 'Sérum concentré en vitamine C stabilisée (15%). Éclat, anti-taches et anti-âge. Formule naturelle à 98%.',
    ingredients: 'Aqua, Ascorbic acid, Glycerin, Aloe vera, Hyaluronic acid, Tocopherol',
    dimensions: '3.5 x 3.5 x 10 cm', weight: '65g', certifications: ['COSMOS Natural', 'Cruelty Free'],
    imageUrl: '/placeholder.svg', gallery: ['/placeholder.svg'],
    productSheet: 'FT-SER-VIT-006.pdf', barcode: '3760012345006', origin: 'France', shelfLife: '12 mois',
    transmittedAt: '2026-03-10T09:00:00Z', transmittedBy: 'Marie Dubois', status: 'pending',
  },
  {
    id: '4', name: 'Shampoing Ortie Bio 250ml', sku: 'SHA-ORT-007', supplier: 'BioCosmetics SAS', category: 'Hygiène',
    unitPrice: 8.90, sellingPrice: 16.50, margin: 46.1, moq: 200,
    description: 'Shampoing fortifiant à l\'ortie bio. Stimule la pousse et renforce les cheveux fragiles. Sans sulfate.',
    ingredients: 'Aqua, Coco-glucoside, Urtica dioica extract, Panthenol, Citric acid',
    dimensions: '5 x 5 x 18 cm', weight: '280g', certifications: ['Bio AB', 'Ecocert'],
    imageUrl: '/placeholder.svg', gallery: ['/placeholder.svg', '/placeholder.svg'],
    productSheet: 'FT-SHA-ORT-007.pdf', barcode: '3760012345007', origin: 'France', shelfLife: '30 mois',
    transmittedAt: '2026-03-08T16:45:00Z', transmittedBy: 'Pierre Laurent', status: 'info_requested',
  },
  {
    id: '5', name: 'Crème Mains Amande 75ml', sku: 'CRE-AMA-008', supplier: 'NaturaCare', category: 'Soins',
    unitPrice: 5.40, sellingPrice: 10.90, margin: 50.5, moq: 300,
    description: 'Crème mains à l\'huile d\'amande douce bio. Nourrit et protège les mains sèches. Absorption rapide.',
    ingredients: 'Aqua, Prunus amygdalus dulcis oil, Glycerin, Cetearyl alcohol, Tocopherol',
    dimensions: '4 x 3 x 14 cm', weight: '95g', certifications: ['COSMOS Organic'],
    imageUrl: '/placeholder.svg', gallery: ['/placeholder.svg'],
    productSheet: 'FT-CRE-AMA-008.pdf', barcode: '3760012345008', origin: 'Italie', shelfLife: '24 mois',
    transmittedAt: '2026-03-05T11:20:00Z', transmittedBy: 'Marie Dubois', status: 'rejected',
  },
  {
    id: '6', name: 'Dentifrice Menthe Bio 75ml', sku: 'DEN-MEN-005', supplier: 'BioCosmetics SAS', category: 'Hygiène',
    unitPrice: 4.10, sellingPrice: 8.50, margin: 51.8, moq: 400,
    description: 'Dentifrice bio à la menthe poivrée. Sans fluor ajouté. Fraîcheur longue durée et protection naturelle.',
    ingredients: 'Calcium carbonate, Aqua, Glycerin, Mentha piperita oil, Xylitol',
    dimensions: '4 x 3 x 16 cm', weight: '105g', certifications: ['Bio AB', 'Vegan', 'Cruelty Free'],
    imageUrl: '/placeholder.svg', gallery: ['/placeholder.svg'],
    productSheet: 'FT-DEN-MEN-005.pdf', barcode: '3760012345005', origin: 'France', shelfLife: '24 mois',
    transmittedAt: '2026-03-18T08:00:00Z', transmittedBy: 'Marie Dubois', status: 'pending',
  },
  {
    id: '7', name: 'Huile Argan Pure 50ml', sku: 'HUI-ARG-009', supplier: 'AromaPlantes', category: 'Aromathérapie',
    unitPrice: 14.20, sellingPrice: 28.90, margin: 50.9, moq: 80,
    description: 'Huile d\'argan pure pressée à froid. Soin multi-usage visage, corps et cheveux. Riche en vitamine E.',
    ingredients: 'Argania spinosa kernel oil (100%)', dimensions: '3.5 x 3.5 x 10 cm', weight: '75g',
    certifications: ['Bio AB', 'Ecocert', 'Commerce Équitable'],
    imageUrl: '/placeholder.svg', gallery: ['/placeholder.svg', '/placeholder.svg'],
    productSheet: 'FT-HUI-ARG-009.pdf', barcode: '3760012345009', origin: 'Maroc', shelfLife: '18 mois',
    transmittedAt: '2026-03-02T13:30:00Z', transmittedBy: 'Pierre Laurent', status: 'integrated',
  },
  {
    id: '8', name: 'Savon Marseille Lavande 100g', sku: 'SAV-MAR-010', supplier: 'BioCosmetics SAS', category: 'Hygiène',
    unitPrice: 3.80, sellingPrice: 7.90, margin: 51.9, moq: 500,
    description: 'Authentique savon de Marseille à la lavande. Fabriqué selon la méthode traditionnelle. Surgras à 8%.',
    ingredients: 'Sodium olivate, Sodium cocoate, Aqua, Lavandula angustifolia oil',
    dimensions: '8 x 5 x 3 cm', weight: '110g', certifications: ['Savon de Marseille', 'Bio AB'],
    imageUrl: '/placeholder.svg', gallery: ['/placeholder.svg'],
    productSheet: 'FT-SAV-MAR-010.pdf', barcode: '3760012345010', origin: 'France', shelfLife: '36 mois',
    transmittedAt: '2026-03-01T10:00:00Z', transmittedBy: 'Marie Dubois', status: 'pending',
  },
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
  const [selectedProduct, setSelectedProduct] = useState<ReceivedProduct | null>(null);
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
    if (selectedProduct?.id === id) {
      setSelectedProduct(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const pendingCount = products.filter(p => p.status === 'pending').length;
  const integratedCount = products.filter(p => p.status === 'integrated').length;
  const rejectedCount = products.filter(p => p.status === 'rejected').length;
  const avgMargin = (products.reduce((sum, p) => sum + p.margin, 0) / products.length).toFixed(1);

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
        <ExportButtons filename="produits-recus-tech" title="Produits reçus Tech" columns={[
          { header: 'Nom', accessor: 'name' }, { header: 'SKU', accessor: 'sku' },
          { header: 'Fournisseur', accessor: 'supplier' }, { header: 'Catégorie', accessor: 'category' },
          { header: 'Prix achat', accessor: 'unitPrice' }, { header: 'Prix vente', accessor: 'sellingPrice' },
          { header: 'Marge %', accessor: 'margin' }, { header: 'MOQ', accessor: 'moq' },
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
              <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prix achat</th>
              <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Prix vente</th>
              <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Marge</th>
              <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
              <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(product => {
              const cfg = statusConfig[product.status];
              return (
                <tr key={product.id} className="border-b border-border/50 hover:bg-secondary/20 cursor-pointer" onClick={() => setSelectedProduct(product)}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary overflow-hidden">
                        <img src={product.imageUrl} alt={product.name} className="h-10 w-10 object-cover" />
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
                    <p className="text-sm font-medium text-foreground">{product.sellingPrice.toFixed(2)} €</p>
                  </td>
                  <td className="p-4 text-right hidden lg:table-cell">
                    <p className={`text-sm font-semibold ${product.margin >= 50 ? 'text-success' : 'text-warning'}`}>
                      {product.margin.toFixed(1)}%
                    </p>
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
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-lg">{selectedProduct.name}</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">{selectedProduct.sku} • {selectedProduct.supplier}</p>
                  </div>
                  <Badge variant={statusConfig[selectedProduct.status].variant} className={statusConfig[selectedProduct.status].className || ''}>
                    {statusConfig[selectedProduct.status].label}
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
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedProduct.description}</p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Composition / Ingrédients</h4>
                    <p className="text-sm text-muted-foreground">{selectedProduct.ingredients}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Catégorie</p>
                      <p className="text-sm font-medium text-foreground mt-1">{selectedProduct.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Origine</p>
                      <p className="text-sm font-medium text-foreground mt-1">{selectedProduct.origin}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Durée de vie</p>
                      <p className="text-sm font-medium text-foreground mt-1">{selectedProduct.shelfLife}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Dimensions</p>
                      <p className="text-sm font-medium text-foreground mt-1">{selectedProduct.dimensions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Poids</p>
                      <p className="text-sm font-medium text-foreground mt-1">{selectedProduct.weight}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Code-barres</p>
                      <p className="text-sm font-medium text-foreground mt-1 font-mono">{selectedProduct.barcode}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Certifications</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.certifications.map(cert => (
                        <Badge key={cert} variant="outline" className="text-xs">{cert}</Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="enterprise-card p-4 text-center">
                      <Euro className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Prix d'achat</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{selectedProduct.unitPrice.toFixed(2)} €</p>
                    </div>
                    <div className="enterprise-card p-4 text-center">
                      <Euro className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Prix de vente</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{selectedProduct.sellingPrice.toFixed(2)} €</p>
                    </div>
                    <div className="enterprise-card p-4 text-center">
                      <TrendingUp className="h-5 w-5 text-success mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Marge brute</p>
                      <p className={`text-2xl font-bold mt-1 ${selectedProduct.margin >= 50 ? 'text-success' : 'text-warning'}`}>
                        {selectedProduct.margin.toFixed(1)}%
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
                        <span className="font-medium text-foreground">{(selectedProduct.unitPrice * selectedProduct.moq).toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CA potentiel (au MOQ)</span>
                        <span className="font-medium text-foreground">{(selectedProduct.sellingPrice * selectedProduct.moq).toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Marge brute estimée (au MOQ)</span>
                        <span className="font-semibold text-success">
                          {((selectedProduct.sellingPrice - selectedProduct.unitPrice) * selectedProduct.moq).toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-4 mt-4">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Image principale</h4>
                    <div className="rounded-lg border border-border overflow-hidden bg-secondary/20 w-48 h-48 flex items-center justify-center">
                      <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="max-h-full max-w-full object-contain" />
                    </div>
                  </div>
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
                </TabsContent>

                <TabsContent value="docs" className="space-y-4 mt-4">
                  <div className="enterprise-card p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                      <FileText className="h-6 w-6 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{selectedProduct.productSheet}</p>
                      <p className="text-xs text-muted-foreground">Fiche technique produit</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast({ title: 'Téléchargement', description: `${selectedProduct.productSheet} en cours...` })}>
                      Télécharger
                    </Button>
                  </div>
                  <div className="enterprise-card p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Informations de transmission</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transmis par</span>
                        <span className="font-medium text-foreground">{selectedProduct.transmittedBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date de transmission</span>
                        <span className="font-medium text-foreground">{new Date(selectedProduct.transmittedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fournisseur</span>
                        <span className="font-medium text-foreground">{selectedProduct.supplier}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action buttons in dialog */}
              {selectedProduct.status === 'pending' && (
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
              {selectedProduct.status === 'info_requested' && (
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
