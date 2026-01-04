import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Search,
  AlertTriangle,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// Mock data for pending products
const mockPendingProducts = [
  {
    id: '1',
    name: 'Savon Bio Lavande 100g',
    sku: 'SAV-BIO-001',
    supplier: 'BioCosmetics SAS',
    category: 'Hygiène',
    moq: 500,
    unitPrice: 2.50,
    submittedAt: '2026-01-03T10:30:00Z',
    packagingStatus: 'pending',
    priority: 'high',
  },
  {
    id: '2',
    name: 'Crème Hydratante Naturelle 50ml',
    sku: 'CRM-NAT-002',
    supplier: 'NaturaCare',
    category: 'Soins',
    moq: 200,
    unitPrice: 8.90,
    submittedAt: '2026-01-02T14:15:00Z',
    packagingStatus: 'rse_validated',
    priority: 'medium',
  },
  {
    id: '3',
    name: 'Shampoing Solide Avocat',
    sku: 'SHP-SOL-003',
    supplier: 'GreenBeauty',
    category: 'Cheveux',
    moq: 300,
    unitPrice: 5.20,
    submittedAt: '2026-01-01T09:00:00Z',
    packagingStatus: 'pending',
    priority: 'low',
  },
  {
    id: '4',
    name: 'Déodorant Pierre Alun',
    sku: 'DEO-ALN-004',
    supplier: 'BioCosmetics SAS',
    category: 'Hygiène',
    moq: 400,
    unitPrice: 4.30,
    submittedAt: '2025-12-30T16:45:00Z',
    packagingStatus: 'rse_validated',
    priority: 'high',
  },
];

export default function PendingProducts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<typeof mockPendingProducts[0] | null>(null);
  const [actionDialog, setActionDialog] = useState<'validate' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const filteredProducts = mockPendingProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(mockPendingProducts.map(p => p.category))];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPackagingBadge = (status: string) => {
    switch (status) {
      case 'rse_validated':
        return <Badge variant="outline" className="text-success border-success">RSE ✓</Badge>;
      case 'rse_rejected':
        return <Badge variant="outline" className="text-destructive border-destructive">RSE ✗</Badge>;
      default:
        return <Badge variant="outline" className="text-warning border-warning">RSE en attente</Badge>;
    }
  };

  const handleValidate = () => {
    // In real app, call Supabase to update product status
    console.log('Validating product:', selectedProduct?.id);
    setActionDialog(null);
    setSelectedProduct(null);
  };

  const handleReject = () => {
    // In real app, call Supabase to update product status with reason
    console.log('Rejecting product:', selectedProduct?.id, 'Reason:', rejectionReason);
    setActionDialog(null);
    setSelectedProduct(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Produits en attente</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredProducts.length} produit(s) en attente de validation
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, SKU ou fournisseur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products List */}
      <div className="space-y-3">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="enterprise-card p-4 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                    <Badge className={cn('text-[10px] h-4 px-1.5', getPriorityColor(product.priority))}>
                      {product.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">{product.sku}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{product.supplier}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {product.unitPrice.toFixed(2)} €
                    </span>
                    <span className="text-xs text-muted-foreground">
                      MOQ: {product.moq}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPackagingBadge(product.packagingStatus)}
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{format(new Date(product.submittedAt), 'd MMM yyyy', { locale: fr })}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-success hover:text-success hover:bg-success/10"
                    onClick={() => {
                      setSelectedProduct(product);
                      setActionDialog('validate');
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Valider
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setSelectedProduct(product);
                      setActionDialog('reject');
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Refuser
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="enterprise-card p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Aucun produit en attente</p>
          </div>
        )}
      </div>

      {/* Validation Dialog */}
      <Dialog open={actionDialog === 'validate'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider le produit</DialogTitle>
            <DialogDescription>
              Confirmez-vous la validation de "{selectedProduct?.name}" ?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Fournisseur</p>
                <p className="font-medium">{selectedProduct?.supplier}</p>
              </div>
              <div>
                <p className="text-muted-foreground">SKU</p>
                <p className="font-medium">{selectedProduct?.sku}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Prix unitaire</p>
                <p className="font-medium">{selectedProduct?.unitPrice.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-muted-foreground">MOQ</p>
                <p className="font-medium">{selectedProduct?.moq} unités</p>
              </div>
            </div>
            {selectedProduct?.packagingStatus !== 'rse_validated' && (
              <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Validation RSE en attente</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Le packaging n'a pas encore été validé par le pôle RSE.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Annuler
            </Button>
            <Button onClick={handleValidate} className="bg-success hover:bg-success/90">
              Confirmer la validation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={actionDialog === 'reject'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser le produit</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison du refus pour "{selectedProduct?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Raison du refus (obligatoire)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
