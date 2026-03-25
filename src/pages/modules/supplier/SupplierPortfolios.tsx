import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { toast } from 'sonner';
import { FolderOpen, Users, Star, AlertTriangle, Search, UserPlus, ArrowRightLeft, BarChart3, TrendingUp } from 'lucide-react';

interface Portfolio {
  id: string;
  category: string;
  responsible: string;
  backup: string;
  supplierCount: number;
  avgScore: number;
  activeAlerts: number;
  upcomingAudits: number;
  revenue: string;
}

interface PortfolioSupplier {
  id: string;
  name: string;
  country: string;
  category: string;
  score: number;
  status: string;
  assignedTo: string;
  lastAudit: string;
  revenue: string;
}

interface EmployeeLoad {
  name: string;
  role: string;
  supplierCount: number;
  maxCapacity: number;
  avgScore: number;
  alerts: number;
  specialization: string[];
  performance: number;
}

const portfolios: Portfolio[] = [
  { id: 'p1', category: 'Mode Femme', responsible: 'Sophie Martin', backup: 'Léa Dubois', supplierCount: 8, avgScore: 87, activeAlerts: 1, upcomingAudits: 2, revenue: '456K €' },
  { id: 'p2', category: 'Mode Homme', responsible: 'Marc Leroy', backup: 'Sophie Martin', supplierCount: 6, avgScore: 91, activeAlerts: 0, upcomingAudits: 1, revenue: '312K €' },
  { id: 'p3', category: 'Accessoires', responsible: 'Léa Dubois', backup: 'Thomas Petit', supplierCount: 7, avgScore: 84, activeAlerts: 2, upcomingAudits: 1, revenue: '198K €' },
  { id: 'p4', category: 'Maison & Déco', responsible: 'Thomas Petit', backup: 'Marc Leroy', supplierCount: 5, avgScore: 79, activeAlerts: 1, upcomingAudits: 3, revenue: '145K €' },
  { id: 'p5', category: 'Hygiène & Bien-être', responsible: 'Claire Bernard', backup: 'Léa Dubois', supplierCount: 5, avgScore: 92, activeAlerts: 0, upcomingAudits: 0, revenue: '234K €' },
];

const portfolioSuppliers: PortfolioSupplier[] = [
  { id: 's1', name: 'BioCosmetics SAS', country: '🇫🇷', category: 'Hygiène & Bien-être', score: 94, status: 'validated', assignedTo: 'Claire Bernard', lastAudit: '2026-02-15', revenue: '245K €' },
  { id: 's2', name: 'NaturaCare', country: '🇩🇪', category: 'Hygiène & Bien-être', score: 88, status: 'validated', assignedTo: 'Claire Bernard', lastAudit: '2026-01-20', revenue: '198K €' },
  { id: 's3', name: 'TextilVert', country: '🇫🇷', category: 'Mode Femme', score: 91, status: 'validated', assignedTo: 'Sophie Martin', lastAudit: '2026-03-01', revenue: '167K €' },
  { id: 's4', name: 'EcoFashion Italia', country: '🇮🇹', category: 'Mode Femme', score: 85, status: 'validated', assignedTo: 'Sophie Martin', lastAudit: '2026-02-10', revenue: '134K €' },
  { id: 's5', name: 'GreenBeauty', country: '🇮🇹', category: 'Accessoires', score: 82, status: 'watch', assignedTo: 'Léa Dubois', lastAudit: '2026-01-05', revenue: '156K €' },
  { id: 's6', name: 'EcoPack Solutions', country: '🇪🇸', category: 'Accessoires', score: 73, status: 'watch', assignedTo: 'Léa Dubois', lastAudit: '2025-12-20', revenue: '134K €' },
  { id: 's7', name: 'HomeDeco Bio', country: '🇫🇷', category: 'Maison & Déco', score: 78, status: 'validated', assignedTo: 'Thomas Petit', lastAudit: '2026-02-28', revenue: '89K €' },
  { id: 's8', name: 'MenStyle Organic', country: '🇩🇪', category: 'Mode Homme', score: 93, status: 'validated', assignedTo: 'Marc Leroy', lastAudit: '2026-03-10', revenue: '112K €' },
  { id: 's9', name: 'Nordic Wear', country: '🇸🇪', category: 'Mode Homme', score: 89, status: 'validated', assignedTo: 'Marc Leroy', lastAudit: '2026-02-22', revenue: '98K €' },
  { id: 's10', name: 'ArtisanCraft', country: '🇵🇹', category: 'Maison & Déco', score: 76, status: 'watch', assignedTo: 'Thomas Petit', lastAudit: '2025-11-15', revenue: '67K €' },
];

const employeeLoads: EmployeeLoad[] = [
  { name: 'Sophie Martin', role: 'Responsable Sourcing', supplierCount: 8, maxCapacity: 10, avgScore: 87, alerts: 1, specialization: ['Mode Femme', 'Mode Homme'], performance: 92 },
  { name: 'Marc Leroy', role: 'Chargé Qualité', supplierCount: 6, maxCapacity: 8, avgScore: 91, alerts: 0, specialization: ['Mode Homme', 'Maison & Déco'], performance: 88 },
  { name: 'Léa Dubois', role: 'Responsable Accessoires', supplierCount: 7, maxCapacity: 8, avgScore: 84, alerts: 2, specialization: ['Accessoires', 'Hygiène'], performance: 85 },
  { name: 'Thomas Petit', role: 'Chargé Fournisseurs', supplierCount: 5, maxCapacity: 8, avgScore: 79, alerts: 1, specialization: ['Maison & Déco'], performance: 80 },
  { name: 'Claire Bernard', role: 'Responsable Bio/Bien-être', supplierCount: 5, maxCapacity: 8, avgScore: 92, alerts: 0, specialization: ['Hygiène & Bien-être'], performance: 95 },
];

export default function SupplierPortfolios() {
  const [activeTab, setActiveTab] = useState('portfolios');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredSuppliers = selectedCategory === 'all' 
    ? portfolioSuppliers 
    : portfolioSuppliers.filter(s => s.category === selectedCategory);

  const suppliersTable = useTableInteractions({
    data: filteredSuppliers,
    searchFields: ['name', 'assignedTo', 'category'],
  });

  const handleReassign = (supplierName: string) => {
    toast.success('Réassignation initiée', { description: `${supplierName} — sélection du nouvel assigné en cours` });
  };

  const getLoadColor = (count: number, max: number) => {
    const pct = (count / max) * 100;
    if (pct >= 90) return 'text-destructive';
    if (pct >= 70) return 'text-yellow-500';
    return 'text-emerald-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-primary" />
            Portefeuilles Fournisseurs
          </h1>
          <p className="text-muted-foreground">Organisation par catégorie — uniquement fournisseurs validés</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-primary" />
              <Badge variant="outline" className="text-emerald-500"><TrendingUp className="h-3 w-3 mr-1" />+3</Badge>
            </div>
            <p className="text-2xl font-bold mt-2">{portfolios.reduce((s, p) => s + p.supplierCount, 0)}</p>
            <p className="text-xs text-muted-foreground">Fournisseurs assignés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <FolderOpen className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{portfolios.length}</p>
            <p className="text-xs text-muted-foreground">Portefeuilles actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{Math.round(portfolios.reduce((s, p) => s + p.avgScore, 0) / portfolios.length)}%</p>
            <p className="text-xs text-muted-foreground">Score qualité moyen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-2xl font-bold mt-2">{portfolios.reduce((s, p) => s + p.activeAlerts, 0)}</p>
            <p className="text-xs text-muted-foreground">Alertes actives</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="portfolios">Par catégorie</TabsTrigger>
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="manager">Vue Manager</TabsTrigger>
        </TabsList>

        {/* Tab 1: Portfolios by category */}
        <TabsContent value="portfolios" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {portfolios.map(p => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{p.category}</CardTitle>
                  <CardDescription>{p.supplierCount} fournisseurs • {p.revenue}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Responsable</span>
                    <span className="font-medium">{p.responsible}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Backup</span>
                    <span>{p.backup}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Score qualité</span>
                      <span className={p.avgScore >= 85 ? 'text-emerald-500 font-medium' : p.avgScore >= 70 ? 'text-yellow-500 font-medium' : 'text-destructive font-medium'}>
                        {p.avgScore}%
                      </span>
                    </div>
                    <Progress value={p.avgScore} className="h-2" />
                  </div>
                  <div className="flex gap-2">
                    {p.activeAlerts > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />{p.activeAlerts} alerte{p.activeAlerts > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {p.upcomingAudits > 0 && (
                      <Badge variant="outline" className="text-xs">{p.upcomingAudits} audit{p.upcomingAudits > 1 ? 's' : ''} planifié{p.upcomingAudits > 1 ? 's' : ''}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 2: All suppliers */}
        <TabsContent value="suppliers" className="mt-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un fournisseur..." value={suppliersTable.searchQuery} onChange={e => suppliersTable.setSearchQuery(e.target.value)} className="pl-8 h-9" />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Catégorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {portfolios.map(p => <SelectItem key={p.id} value={p.category}>{p.category}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="name" currentSort={suppliersTable.sortColumn as string} direction={suppliersTable.sortDirection} onSort={c => suppliersTable.toggleSort(c as any)}>Fournisseur</SortableTableHead>
                <TableHead>Catégorie</TableHead>
                <SortableTableHead column="score" currentSort={suppliersTable.sortColumn as string} direction={suppliersTable.sortDirection} onSort={c => suppliersTable.toggleSort(c as any)}>Score</SortableTableHead>
                <TableHead>Assigné à</TableHead>
                <TableHead>Dernier audit</TableHead>
                <SortableTableHead column="revenue" currentSort={suppliersTable.sortColumn as string} direction={suppliersTable.sortDirection} onSort={c => suppliersTable.toggleSort(c as any)} className="text-right">CA</SortableTableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliersTable.processedData.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.country} {s.name}</TableCell>
                  <TableCell><Badge variant="outline">{s.category}</Badge></TableCell>
                  <TableCell>
                    <span className={s.score >= 85 ? 'text-emerald-500 font-medium' : s.score >= 70 ? 'text-yellow-500 font-medium' : 'text-destructive font-medium'}>
                      {s.score}%
                    </span>
                  </TableCell>
                  <TableCell>{s.assignedTo}</TableCell>
                  <TableCell className="text-muted-foreground">{s.lastAudit}</TableCell>
                  <TableCell className="text-right font-medium">{s.revenue}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleReassign(s.name)}>
                      <ArrowRightLeft className="h-4 w-4 mr-1" />Réassigner
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {suppliersTable.processedData.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Aucun résultat</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Tab 3: Manager View */}
        <TabsContent value="manager" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Répartition de charge</CardTitle>
              <CardDescription>Visualisation de la charge par employé avec détection de surcharge</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeeLoads.map(emp => {
                  const loadPct = Math.round((emp.supplierCount / emp.maxCapacity) * 100);
                  const isOverloaded = loadPct >= 90;
                  return (
                    <div key={emp.name} className="p-4 rounded-lg border space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-sm text-muted-foreground">{emp.role}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {isOverloaded && <Badge variant="destructive">Surcharge</Badge>}
                          <Badge variant="outline">Perf: {emp.performance}%</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Fournisseurs</p>
                          <p className={`font-bold ${getLoadColor(emp.supplierCount, emp.maxCapacity)}`}>{emp.supplierCount}/{emp.maxCapacity}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Score moyen</p>
                          <p className="font-bold">{emp.avgScore}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Alertes</p>
                          <p className={`font-bold ${emp.alerts > 0 ? 'text-destructive' : 'text-emerald-500'}`}>{emp.alerts}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Spécialisation</p>
                          <div className="flex flex-wrap gap-1">
                            {emp.specialization.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Charge</span>
                          <span>{loadPct}%</span>
                        </div>
                        <Progress value={loadPct} className="h-2" />
                      </div>
                      {loadPct >= 70 && loadPct < 90 && (
                        <p className="text-xs text-yellow-500">⚠️ Charge élevée — envisager un rééquilibrage</p>
                      )}
                      {isOverloaded && (
                        <p className="text-xs text-destructive">🔴 Surcharge détectée — réassignation recommandée</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
