import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Building2,
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Mail,
  Phone,
  MapPin,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Mock data for suppliers
const mockSuppliers = [
  {
    id: '1',
    name: 'BioCosmetics SAS',
    contactName: 'Jean-Pierre Martin',
    email: 'contact@biocosmetics.fr',
    phone: '+33 1 42 56 78 90',
    address: '15 Rue des Lilas, 75011 Paris',
    country: 'France',
    status: 'validated',
    riskScore: 15,
    productsCount: 12,
    validatedAt: '2025-06-15T10:00:00Z',
    certifications: ['ISO 9001', 'Ecocert'],
  },
  {
    id: '2',
    name: 'NaturaCare',
    contactName: 'Sophie Durand',
    email: 'pro@naturacare.com',
    phone: '+33 4 91 23 45 67',
    address: '28 Avenue de la Mer, 13008 Marseille',
    country: 'France',
    status: 'validated',
    riskScore: 8,
    productsCount: 8,
    validatedAt: '2025-08-20T14:30:00Z',
    certifications: ['Bio AB', 'Cosmos Organic'],
  },
  {
    id: '3',
    name: 'GreenBeauty',
    contactName: 'Thomas Bernard',
    email: 'hello@greenbeauty.de',
    phone: '+49 30 1234 5678',
    address: 'Friedrichstraße 123, 10117 Berlin',
    country: 'Allemagne',
    status: 'pending',
    riskScore: 35,
    productsCount: 3,
    validatedAt: null,
    certifications: ['BDIH'],
  },
  {
    id: '4',
    name: 'AromaPlantes',
    contactName: 'Claire Lefevre',
    email: 'info@aromaplantes.fr',
    phone: '+33 5 56 78 90 12',
    address: '5 Chemin des Vignes, 33000 Bordeaux',
    country: 'France',
    status: 'validated',
    riskScore: 5,
    productsCount: 25,
    validatedAt: '2025-03-10T09:00:00Z',
    certifications: ['ISO 22716', 'Ecocert', 'AB'],
  },
  {
    id: '5',
    name: 'OrganicWorld Ltd',
    contactName: 'James Wilson',
    email: 'sales@organicworld.co.uk',
    phone: '+44 20 7946 0958',
    address: '42 Oxford Street, London W1D 1BS',
    country: 'Royaume-Uni',
    status: 'suspended',
    riskScore: 72,
    productsCount: 0,
    validatedAt: '2024-11-05T11:00:00Z',
    certifications: ['Soil Association'],
  },
];

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
        return (
          <Badge variant="outline" className="text-success border-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Validé
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="text-warning border-warning">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="outline" className="text-destructive border-destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Suspendu
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRiskBadge = (score: number) => {
    if (score >= 60) {
      return <Badge variant="destructive">Risque élevé ({score})</Badge>;
    }
    if (score >= 30) {
      return <Badge variant="secondary" className="bg-warning/20 text-warning">Risque moyen ({score})</Badge>;
    }
    return <Badge variant="outline" className="text-success border-success">Risque faible ({score})</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Fiches fournisseurs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredSuppliers.length} fournisseur(s)
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau fournisseur
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{mockSuppliers.length}</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Validés</p>
          <p className="text-2xl font-semibold text-success mt-1">
            {mockSuppliers.filter(s => s.status === 'validated').length}
          </p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">En attente</p>
          <p className="text-2xl font-semibold text-warning mt-1">
            {mockSuppliers.filter(s => s.status === 'pending').length}
          </p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">À risque</p>
          <p className="text-2xl font-semibold text-destructive mt-1">
            {mockSuppliers.filter(s => s.riskScore >= 60).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, contact ou pays..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="validated">Validés</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="suspended">Suspendus</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSuppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="enterprise-card p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
            onClick={() => setSelectedSupplier(supplier)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{supplier.name}</p>
                  <p className="text-xs text-muted-foreground">{supplier.country}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    Voir fiche
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Mail className="h-4 w-4 mr-2" />
                    Contacter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span>{supplier.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{supplier.phone}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                {getStatusBadge(supplier.status)}
                {getRiskBadge(supplier.riskScore)}
              </div>
              <div className="text-xs text-muted-foreground">
                {supplier.productsCount} produit(s)
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Supplier Detail Dialog */}
      <Dialog open={!!selectedSupplier} onOpenChange={() => setSelectedSupplier(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Building2 className="h-5 w-5" />
              {selectedSupplier?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedSupplier.status)}
                {getRiskBadge(selectedSupplier.riskScore)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contact</p>
                    <p className="text-sm font-medium">{selectedSupplier.contactName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Email</p>
                    <p className="text-sm">{selectedSupplier.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Téléphone</p>
                    <p className="text-sm">{selectedSupplier.phone}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Adresse</p>
                    <p className="text-sm">{selectedSupplier.address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pays</p>
                    <p className="text-sm">{selectedSupplier.country}</p>
                  </div>
                  {selectedSupplier.validatedAt && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Validé le</p>
                      <p className="text-sm">
                        {format(new Date(selectedSupplier.validatedAt), 'd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Certifications</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSupplier.certifications.map((cert) => (
                    <Badge key={cert} variant="secondary">
                      <Shield className="h-3 w-3 mr-1" />
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setSelectedSupplier(null)}>
                  Fermer
                </Button>
                <Button>
                  Voir tous les produits
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
