import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { Search, FileText, Lightbulb, Plus, Eye, CheckCircle, Clock } from 'lucide-react';

const reports = [
  { id: 'RPT-001', title: 'Rapport Produits Dormants Q1', type: 'analysis', date: '12/03/2025', author: 'Sarah M.', status: 'published', recommendations: 5 },
  { id: 'RPT-002', title: 'Analyse Risque Fournisseur B', type: 'risk', date: '10/03/2025', author: 'Marc L.', status: 'draft', recommendations: 3 },
  { id: 'RPT-003', title: 'Performance Boutiques Europe', type: 'performance', date: '08/03/2025', author: 'Julie D.', status: 'published', recommendations: 7 },
  { id: 'RPT-004', title: 'Frictions UX Module Commandes', type: 'friction', date: '05/03/2025', author: 'Pierre K.', status: 'review', recommendations: 4 },
  { id: 'RPT-005', title: 'Concentration Produit Top 5', type: 'analysis', date: '01/03/2025', author: 'Sarah M.', status: 'published', recommendations: 2 },
  { id: 'RPT-006', title: 'Audit Qualité Fournisseur F', type: 'risk', date: '28/02/2025', author: 'Marc L.', status: 'published', recommendations: 6 },
];

const recommendationsData = [
  { id: 'REC-001', report: 'RPT-001', detail: "Retrait 'Infuseur Thé Zen' du catalogue — 0 commande en 45j", priority: 'high', status: 'pending', category: 'Produits' },
  { id: 'REC-002', report: 'RPT-001', detail: "Promotion flash sur 8 produits dormants catégorie Éco", priority: 'medium', status: 'approved', category: 'Marketing' },
  { id: 'REC-003', report: 'RPT-002', detail: "Audit qualité approfondi Fournisseur B — taux rejet 43%", priority: 'critical', status: 'in_progress', category: 'Fournisseurs' },
  { id: 'REC-004', report: 'RPT-003', detail: "Email prévention churn boutiques inactives >15j", priority: 'high', status: 'approved', category: 'Boutiques' },
  { id: 'REC-005', report: 'RPT-004', detail: "Refonte flux validation commande: 5 → 3 étapes", priority: 'medium', status: 'pending', category: 'Système' },
  { id: 'REC-006', report: 'RPT-002', detail: "Diversification sourcing carton recyclé — réduire dépendance 42%", priority: 'critical', status: 'pending', category: 'Fournisseurs' },
];

const kpis = [
  { label: 'Rapports Publiés', value: 24, icon: FileText, color: 'text-primary', bgColor: 'bg-primary/10' },
  { label: 'Recommandations', value: 47, icon: Lightbulb, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  { label: 'Approuvées', value: 31, icon: CheckCircle, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  { label: 'En attente', value: 16, icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
];

const reportStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  published: { label: 'Publié', variant: 'default' },
  draft: { label: 'Brouillon', variant: 'outline' },
  review: { label: 'En revue', variant: 'secondary' },
};

const recStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  approved: { label: 'Approuvée', variant: 'default' },
  pending: { label: 'En attente', variant: 'outline' },
  in_progress: { label: 'En cours', variant: 'secondary' },
  rejected: { label: 'Rejetée', variant: 'destructive' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critique', color: 'text-destructive' },
  high: { label: 'Élevée', color: 'text-orange-500' },
  medium: { label: 'Moyenne', color: 'text-yellow-500' },
  low: { label: 'Faible', color: 'text-muted-foreground' },
};

export default function RDReports() {
  const [rptSearch, setRptSearch] = useState('');
  const [rptSortCol, setRptSortCol] = useState<string | null>(null);
  const [rptSortDir, setRptSortDir] = useState<'asc' | 'desc' | null>(null);
  const [rptFilters, setRptFilters] = useState<Record<string, string>>({});
  const setRptFilter = (k: string, v: string) => setRptFilters(p => ({ ...p, [k]: v }));
  const toggleRptSort = (col: string) => {
    if (rptSortCol === col) {
      if (rptSortDir === 'asc') setRptSortDir('desc');
      else { setRptSortCol(null); setRptSortDir(null); }
    } else { setRptSortCol(col); setRptSortDir('asc'); }
  };

  const [recSearch, setRecSearch] = useState('');
  const [recFilters, setRecFilters] = useState<Record<string, string>>({});
  const setRecFilter = (k: string, v: string) => setRecFilters(p => ({ ...p, [k]: v }));

  const filteredReports = reports
    .filter(r => {
      if (rptSearch && !r.title.toLowerCase().includes(rptSearch.toLowerCase())) return false;
      if (rptFilters.type && rptFilters.type !== 'all' && r.type !== rptFilters.type) return false;
      if (rptFilters.status && rptFilters.status !== 'all' && r.status !== rptFilters.status) return false;
      return true;
    })
    .sort((a, b) => {
      if (!rptSortCol || !rptSortDir) return 0;
      const dir = rptSortDir === 'asc' ? 1 : -1;
      const av = a[rptSortCol as keyof typeof a];
      const bv = b[rptSortCol as keyof typeof b];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

  const filteredRecs = recommendationsData
    .filter(r => {
      if (recSearch && !r.detail.toLowerCase().includes(recSearch.toLowerCase())) return false;
      if (recFilters.priority && recFilters.priority !== 'all' && r.priority !== recFilters.priority) return false;
      if (recFilters.status && recFilters.status !== 'all' && r.status !== recFilters.status) return false;
      return true;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rapports & Recommandations</h1>
          <p className="text-muted-foreground">Historique des analyses R&D et suivi des recommandations</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Nouveau rapport</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg ${k.bgColor} flex items-center justify-center`}>
                  <k.icon className={`h-5 w-5 ${k.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Rapports R&D</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={rptSearch} onChange={e => setRptSearch(e.target.value)} className="pl-9 w-48" />
              </div>
              <Select value={rptFilters.type || 'all'} onValueChange={v => setRptFilter('type', v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="analysis">Analyse</SelectItem>
                  <SelectItem value="risk">Risque</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="friction">Friction</SelectItem>
                </SelectContent>
              </Select>
              <Select value={rptFilters.status || 'all'} onValueChange={v => setRptFilter('status', v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="review">En revue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="id" currentSort={rptSortCol} direction={rptSortDir} onSort={toggleRptSort}>ID</SortableTableHead>
                <SortableTableHead column="title" currentSort={rptSortCol} direction={rptSortDir} onSort={toggleRptSort}>Titre</SortableTableHead>
                <SortableTableHead column="date" currentSort={rptSortCol} direction={rptSortDir} onSort={toggleRptSort}>Date</SortableTableHead>
                <SortableTableHead column="author" currentSort={rptSortCol} direction={rptSortDir} onSort={toggleRptSort}>Auteur</SortableTableHead>
                <TableHead>Statut</TableHead>
                <SortableTableHead column="recommendations" currentSort={rptSortCol} direction={rptSortDir} onSort={toggleRptSort}>Recomm.</SortableTableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{r.date}</TableCell>
                  <TableCell>{r.author}</TableCell>
                  <TableCell><Badge variant={reportStatusConfig[r.status].variant}>{reportStatusConfig[r.status].label}</Badge></TableCell>
                  <TableCell className="font-medium">{r.recommendations}</TableCell>
                  <TableCell><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Recommandations Actives</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={recSearch} onChange={e => setRecSearch(e.target.value)} className="pl-9 w-48" />
              </div>
              <Select value={recFilters.priority || 'all'} onValueChange={v => setRecFilter('priority', v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Priorité" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                </SelectContent>
              </Select>
              <Select value={recFilters.status || 'all'} onValueChange={v => setRecFilter('status', v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="approved">Approuvée</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Rapport</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Détail</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecs.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.report}</TableCell>
                  <TableCell><Badge variant="outline">{r.category}</Badge></TableCell>
                  <TableCell className="max-w-xs truncate text-sm">{r.detail}</TableCell>
                  <TableCell><span className={`font-medium text-sm ${priorityConfig[r.priority].color}`}>{priorityConfig[r.priority].label}</span></TableCell>
                  <TableCell><Badge variant={recStatusConfig[r.status].variant}>{recStatusConfig[r.status].label}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
