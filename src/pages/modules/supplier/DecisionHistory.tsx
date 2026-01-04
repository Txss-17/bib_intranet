import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  History,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Archive,
  RefreshCw,
  DollarSign,
  Package,
  User,
  ChevronRight,
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

// Mock data for decisions
const mockDecisions = [
  {
    id: '1',
    productName: 'Savon Bio Lavande 100g',
    productSku: 'SAV-BIO-001',
    supplierName: 'BioCosmetics SAS',
    decisionType: 'validation',
    previousStatus: 'pending',
    newStatus: 'validated',
    decisionBy: 'Marie Dubois',
    decisionAt: '2026-01-03T14:30:00Z',
    reason: 'Produit conforme aux normes qualité. Packaging validé RSE. Documentation complète.',
  },
  {
    id: '2',
    productName: 'Crème Anti-Âge Premium',
    productSku: 'CRM-AGE-002',
    supplierName: 'NaturaCare',
    decisionType: 'rejection',
    previousStatus: 'pending',
    newStatus: 'rejected',
    decisionBy: 'Pierre Laurent',
    decisionAt: '2026-01-02T10:15:00Z',
    reason: 'Allégations marketing non conformes. Composition à revoir (ingrédient X non autorisé UE).',
  },
  {
    id: '3',
    productName: 'Huile Essentielle Eucalyptus 10ml',
    productSku: 'HUI-EUC-001',
    supplierName: 'AromaPlantes',
    decisionType: 'price_change',
    previousStatus: 'validated',
    newStatus: 'validated',
    decisionBy: 'Marie Dubois',
    decisionAt: '2025-12-28T16:00:00Z',
    reason: 'Ajustement prix suite à renégociation contrat annuel. Nouveau prix: 6.80€ (ancien: 7.20€)',
    details: { oldPrice: 7.20, newPrice: 6.80 },
  },
  {
    id: '4',
    productName: 'Shampoing Solide Avocat',
    productSku: 'SHP-SOL-003',
    supplierName: 'GreenBeauty',
    decisionType: 'archive',
    previousStatus: 'validated',
    newStatus: 'archived',
    decisionBy: 'Pierre Laurent',
    decisionAt: '2025-12-20T09:30:00Z',
    reason: 'Arrêt de production par le fournisseur. Stock épuisé.',
  },
  {
    id: '5',
    productName: 'Gel Aloe Vera Bio 100ml',
    productSku: 'GEL-ALO-004',
    supplierName: 'BioCosmetics SAS',
    decisionType: 'reactivation',
    previousStatus: 'archived',
    newStatus: 'validated',
    decisionBy: 'Marie Dubois',
    decisionAt: '2025-12-15T11:45:00Z',
    reason: 'Reprise de la production. Nouvelle formule améliorée validée.',
  },
  {
    id: '6',
    productName: 'Dentifrice Menthe Bio 75ml',
    productSku: 'DEN-MEN-005',
    supplierName: 'NaturaCare',
    decisionType: 'moq_change',
    previousStatus: 'validated',
    newStatus: 'validated',
    decisionBy: 'Pierre Laurent',
    decisionAt: '2025-12-10T14:20:00Z',
    reason: 'Augmentation MOQ suite à changement process fournisseur. Nouveau MOQ: 500 (ancien: 300)',
    details: { oldMoq: 300, newMoq: 500 },
  },
];

const decisionTypeConfig = {
  validation: {
    label: 'Validation',
    icon: CheckCircle,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  rejection: {
    label: 'Refus',
    icon: XCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  archive: {
    label: 'Archivage',
    icon: Archive,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  reactivation: {
    label: 'Réactivation',
    icon: RefreshCw,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  price_change: {
    label: 'Changement prix',
    icon: DollarSign,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  moq_change: {
    label: 'Changement MOQ',
    icon: Package,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
};

export default function DecisionHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredDecisions = mockDecisions.filter((decision) => {
    const matchesSearch = decision.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      decision.productSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      decision.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      decision.decisionBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || decision.decisionType === typeFilter;
    return matchesSearch && matchesType;
  });

  // Group by date
  const groupedDecisions = filteredDecisions.reduce((groups, decision) => {
    const date = format(new Date(decision.decisionAt), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(decision);
    return groups;
  }, {} as Record<string, typeof mockDecisions>);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Historique des décisions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Traçabilité complète des validations et modifications produits
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {Object.entries(decisionTypeConfig).map(([key, config]) => {
          const count = mockDecisions.filter(d => d.decisionType === key).length;
          const Icon = config.icon;
          return (
            <div key={key} className="enterprise-card p-3">
              <div className="flex items-center gap-2">
                <div className={cn('p-1.5 rounded', config.bgColor)}>
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{count}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{config.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par produit, SKU, fournisseur ou décideur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Type de décision" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les décisions</SelectItem>
            {Object.entries(decisionTypeConfig).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedDecisions).map(([date, decisions]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-3">
              {decisions.map((decision) => {
                const config = decisionTypeConfig[decision.decisionType as keyof typeof decisionTypeConfig];
                const Icon = config.icon;

                return (
                  <div key={decision.id} className="enterprise-card p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', config.bgColor)}>
                        <Icon className={cn('h-5 w-5', config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={cn('text-[10px]', config.bgColor, config.color)}>
                            {config.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(decision.decisionAt), 'HH:mm', { locale: fr })}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground mt-1">
                          {decision.productName}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{decision.productSku}</span>
                          <span>·</span>
                          <span>{decision.supplierName}</span>
                        </div>
                        <div className="mt-3 p-3 rounded-lg bg-secondary/30">
                          <p className="text-sm text-foreground">{decision.reason}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>Décision par {decision.decisionBy}</span>
                          {decision.previousStatus !== decision.newStatus && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Badge variant="outline" className="text-[10px] h-4">{decision.previousStatus}</Badge>
                                <ChevronRight className="h-3 w-3" />
                                <Badge variant="outline" className="text-[10px] h-4">{decision.newStatus}</Badge>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredDecisions.length === 0 && (
          <div className="enterprise-card p-12 text-center">
            <History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Aucune décision trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
}
