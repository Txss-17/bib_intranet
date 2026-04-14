import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { toast } from 'sonner';
import { FolderOpen, Users, Star, AlertTriangle, Search, ArrowRightLeft, BarChart3, TrendingUp, Loader2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AssignmentSuggestion } from '@/components/supplier/AssignmentSuggestion';

function usePortfolios() {
  return useQuery({
    queryKey: ['supplier_portfolios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_portfolios' as any)
        .select('*')
        .order('category');
      if (error) throw error;
      return data as any[];
    },
  });
}

function usePortfolioSuppliers() {
  return useQuery({
    queryKey: ['portfolio_suppliers'],
    queryFn: async () => {
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('status', 'validated')
        .order('name');
      if (error) throw error;

      // Get assignments
      const { data: assignments } = await supabase
        .from('portfolio_assignments' as any)
        .select('*');

      // Get quality alerts count per supplier
      const { data: alerts } = await supabase
        .from('quality_alerts')
        .select('supplier_id, id')
        .eq('status', 'open');

      const alertsBySupplier: Record<string, number> = {};
      (alerts || []).forEach(a => {
        if (a.supplier_id) alertsBySupplier[a.supplier_id] = (alertsBySupplier[a.supplier_id] || 0) + 1;
      });

      const assignmentMap: Record<string, any> = {};
      (assignments || []).forEach((a: any) => {
        assignmentMap[a.supplier_id] = a;
      });

      return (suppliers || []).map(s => ({
        id: s.id,
        name: s.name,
        country: s.country || '🌍',
        category: (s as any).category || 'Général',
        score: s.quality_score || 0,
        status: s.status,
        assignedTo: assignmentMap[s.id]?.assigned_to_name || 'Non assigné',
        lastAudit: s.last_audit_date ? new Date(s.last_audit_date).toLocaleDateString('fr-FR') : '—',
        alerts: alertsBySupplier[s.id] || 0,
      }));
    },
  });
}

export default function SupplierPortfolios() {
  const [activeTab, setActiveTab] = useState('portfolios');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<{ name: string; category: string } | null>(null);

  const { data: portfolios = [], isLoading: portfoliosLoading } = usePortfolios();
  const { data: allSuppliers = [], isLoading: suppliersLoading } = usePortfolioSuppliers();

  const filteredSuppliers = selectedCategory === 'all'
    ? allSuppliers
    : allSuppliers.filter(s => s.category === selectedCategory);

  const suppliersTable = useTableInteractions({
    data: filteredSuppliers,
    searchFields: ['name', 'assignedTo', 'category'],
  });

  const categories = [...new Set(allSuppliers.map(s => s.category))];
  const totalSuppliers = allSuppliers.length;
  const avgScore = totalSuppliers > 0 ? Math.round(allSuppliers.reduce((s, p) => s + p.score, 0) / totalSuppliers) : 0;
  const totalAlerts = allSuppliers.reduce((s, p) => s + p.alerts, 0);

  const handleReassign = (supplierName: string, category: string) => {
    setSelectedSupplier({ name: supplierName, category });
    setAssignmentOpen(true);
  };

  const getLoadColor = (count: number, max: number) => {
    const pct = (count / max) * 100;
    if (pct >= 90) return 'text-destructive';
    if (pct >= 70) return 'text-yellow-500';
    return 'text-emerald-500';
  };

  const isLoading = portfoliosLoading || suppliersLoading;

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  // Group suppliers by assignee for manager view
  const suppliersByAssignee: Record<string, typeof allSuppliers> = {};
  allSuppliers.forEach(s => {
    const key = s.assignedTo || 'Non assigné';
    if (!suppliersByAssignee[key]) suppliersByAssignee[key] = [];
    suppliersByAssignee[key].push(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-primary" />
            Portefeuilles Fournisseurs
          </h1>
          <p className="text-muted-foreground">Organisation par catégorie — fournisseurs validés</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-primary" />
              <Badge variant="outline" className="text-emerald-500"><TrendingUp className="h-3 w-3 mr-1" />actifs</Badge>
            </div>
            <p className="text-2xl font-bold mt-2">{totalSuppliers}</p>
            <p className="text-xs text-muted-foreground">Fournisseurs validés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <FolderOpen className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{portfolios.length || categories.length}</p>
            <p className="text-xs text-muted-foreground">Portefeuilles / catégories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{avgScore}%</p>
            <p className="text-xs text-muted-foreground">Score qualité moyen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-2xl font-bold mt-2">{totalAlerts}</p>
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
          {categories.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Aucun fournisseur validé</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map(cat => {
                const catSuppliers = allSuppliers.filter(s => s.category === cat);
                const catAvg = catSuppliers.length > 0 ? Math.round(catSuppliers.reduce((s, p) => s + p.score, 0) / catSuppliers.length) : 0;
                const catAlerts = catSuppliers.reduce((s, p) => s + p.alerts, 0);
                return (
                  <Card key={cat} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{cat}</CardTitle>
                      <CardDescription>{catSuppliers.length} fournisseurs</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Score qualité</span>
                          <span className={catAvg >= 85 ? 'text-emerald-500 font-medium' : catAvg >= 70 ? 'text-yellow-500 font-medium' : 'text-destructive font-medium'}>
                            {catAvg}%
                          </span>
                        </div>
                        <Progress value={catAvg} className="h-2" />
                      </div>
                      <div className="flex gap-2">
                        {catAlerts > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />{catAlerts} alerte{catAlerts > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
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
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleReassign(s.name, s.category)}>
                      <ArrowRightLeft className="h-4 w-4 mr-1" />Réassigner
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {suppliersTable.processedData.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Aucun résultat</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Tab 3: Manager View */}
        <TabsContent value="manager" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Répartition de charge</CardTitle>
              <CardDescription>Charge par responsable — basée sur les assignations réelles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(suppliersByAssignee).map(([name, suppliers]) => {
                  const maxCapacity = 10;
                  const loadPct = Math.round((suppliers.length / maxCapacity) * 100);
                  const isOverloaded = loadPct >= 90;
                  const avgScoreEmp = suppliers.length > 0 ? Math.round(suppliers.reduce((s, p) => s + p.score, 0) / suppliers.length) : 0;
                  const alertCount = suppliers.reduce((s, p) => s + p.alerts, 0);

                  return (
                    <div key={name} className="p-4 rounded-lg border space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{name}</p>
                          <p className="text-sm text-muted-foreground">{suppliers.length} fournisseurs</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {isOverloaded && <Badge variant="destructive">Surcharge</Badge>}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Charge</p>
                          <p className={`font-bold ${getLoadColor(suppliers.length, maxCapacity)}`}>{suppliers.length}/{maxCapacity}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Score moyen</p>
                          <p className="font-bold">{avgScoreEmp}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Alertes</p>
                          <p className={`font-bold ${alertCount > 0 ? 'text-destructive' : 'text-emerald-500'}`}>{alertCount}</p>
                        </div>
                      </div>
                      <Progress value={loadPct} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedSupplier && (
        <AssignmentSuggestion
          open={assignmentOpen}
          onOpenChange={setAssignmentOpen}
          supplierName={selectedSupplier.name}
          supplierCategory={selectedSupplier.category}
        />
      )}
    </div>
  );
}
