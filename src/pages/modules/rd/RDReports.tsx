import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { FileText, Lightbulb, Plus, CheckCircle, Clock, ArrowRight, Loader2, Ticket, ExternalLink, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  useRDReports, useCreateRDReport, useUpdateRDReportStatus,
  useRDRecommendations, useCreateRDRecommendation, useUpdateRecommendationStatus,
  useConvertRecommendationToTicket, useRDTickets,
} from '@/hooks/useRD';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { ExportButtons } from '@/components/ExportButtons';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import ProtectedScreen from '@/components/ProtectedScreen';

const prioColor = (p: string) =>
  p === 'critical' ? 'bg-destructive text-destructive-foreground'
  : p === 'high' ? 'bg-orange-500 text-white'
  : p === 'medium' ? 'bg-yellow-500 text-black'
  : 'bg-muted';


const RecommendationCard = ({ r }: { r: any }) => {
  const update = useUpdateRecommendationStatus();
  const convert = useConvertRecommendationToTicket();
  const [convertOpen, setConvertOpen] = useState(false);
  const [pole, setPole] = useState<'tech' | 'ops' | 'supplier' | 'rse'>('ops');

  const setStatus = async (status: string) => {
    try { await update.mutateAsync({ id: r.id, status }); toast.success(`Statut: ${status}`); }
    catch (e: any) { toast.error(e.message); }
  };

  const submitConvert = async () => {
    try {
      await convert.mutateAsync({ recommendation: r, targetPole: pole });
      toast.success(`Ticket créé pour le pôle ${pole}`);
      setConvertOpen(false);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="p-3 border rounded space-y-2">
      <div className="flex justify-between items-start gap-2">
        <p className="text-sm">{r.detail}</p>
        <div className="flex gap-1 shrink-0">
          <Badge className={prioColor(r.priority)}>{r.priority}</Badge>
          <Badge variant="outline">{r.status}</Badge>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        {r.category && <Badge variant="secondary">{r.category}</Badge>}
        {r.target_pole && <Badge>→ {r.target_pole}</Badge>}
        <div className="flex gap-2 ml-auto">
          {r.status === 'pending' && <Button size="sm" variant="outline" onClick={() => setStatus('approved')}>Approuver</Button>}
          {r.status !== 'rejected' && r.status !== 'in_progress' && <Button size="sm" variant="ghost" onClick={() => setStatus('rejected')}>Rejeter</Button>}
          {!r.ticket_id && (
            <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><ArrowRight className="h-4 w-4 mr-1" />Transformer en ticket</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Transmettre au pôle</DialogTitle></DialogHeader>
                <div className="space-y-2">
                  <Label>Pôle cible</Label>
                  <Select value={pole} onValueChange={v => setPole(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tech">Tech</SelectItem>
                      <SelectItem value="ops">Ops</SelectItem>
                      <SelectItem value="supplier">Supplier</SelectItem>
                      <SelectItem value="rse">RSE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter><Button onClick={submitConvert} disabled={convert.isPending}>Créer ticket</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
};

const TicketsTab = () => {
  const { data: tickets } = useRDTickets();
  const { canExportAudit } = useUserRole();
  const [statusFilter, setStatusFilter] = useState('all');
  const [prioFilter, setPrioFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all | 7 | 30 | 90

  const baseData = useMemo(() => {
    const list = (tickets ?? []).map((t: any) => ({
      ...t,
      assignee_label: t.assignee_name || 'Non assigné',
      created_iso: t.created_at,
    }));
    const now = Date.now();
    const days = dateFilter === 'all' ? null : parseInt(dateFilter, 10);
    return list.filter((t: any) => {
      if (statusFilter !== 'all' && t.ticket_status !== statusFilter) return false;
      if (prioFilter !== 'all' && t.priority !== prioFilter) return false;
      if (assigneeFilter !== 'all' && t.assignee_label !== assigneeFilter) return false;
      if (days != null) {
        const age = (now - new Date(t.created_iso).getTime()) / 86400000;
        if (age > days) return false;
      }
      return true;
    });
  }, [tickets, statusFilter, prioFilter, assigneeFilter, dateFilter]);

  const { searchQuery, setSearchQuery, sortColumn, sortDirection, toggleSort, processedData } =
    useTableInteractions<any>({
      data: baseData,
      searchFields: ['ticket_title', 'detail', 'assignee_label'],
      initialSort: { column: 'created_iso', direction: 'desc' },
    });

  const assignees = useMemo(() => {
    const set = new Set<string>();
    (tickets ?? []).forEach((t: any) => set.add(t.assignee_name || 'Non assigné'));
    return Array.from(set).sort();
  }, [tickets]);

  const resetFilters = () => {
    setStatusFilter('all'); setPrioFilter('all'); setAssigneeFilter('all'); setDateFilter('all'); setSearchQuery('');
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const exportData = processedData.map((t: any) => ({
    title: t.ticket_title || '—',
    pole: t.target_pole || '—',
    status: t.ticket_status,
    priority: t.priority,
    assignee: t.assignee_label,
    created: new Date(t.created_at).toLocaleDateString(),
    link: `${origin}/pole/rd/tickets/${t.ticket_id}`,
  }));

  const exportColumns = [
    { header: 'Ticket', accessor: 'title' },
    { header: 'Pôle', accessor: 'pole' },
    { header: 'Statut', accessor: 'status' },
    { header: 'Priorité', accessor: 'priority' },
    { header: 'Responsable', accessor: 'assignee' },
    { header: 'Créé', accessor: 'created' },
    { header: 'Lien', accessor: 'link' },
  ];

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-base">
            <Ticket className="h-4 w-4" /> Tickets issus des recommandations R&D
            <Badge variant="outline" className="ml-2">{processedData.length}/{tickets?.length ?? 0}</Badge>
          </CardTitle>
          {canExportAudit && (
            <ExportButtons
              filename={`rd-tickets-${new Date().toISOString().slice(0,10)}`}
              title="Tickets R&D"
              poleName="R&D"
              columns={exportColumns}
              data={exportData}
              size="sm"
            />
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div className="relative md:col-span-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Rechercher titre, détail, responsable..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="declared">Déclaré</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="resolved">Résolu</SelectItem>
              <SelectItem value="closed">Clos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={prioFilter} onValueChange={setPrioFilter}>
            <SelectTrigger><SelectValue placeholder="Priorité" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes priorités</SelectItem>
              <SelectItem value="critical">Critique</SelectItem>
              <SelectItem value="high">Haute</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="low">Basse</SelectItem>
            </SelectContent>
          </Select>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger><SelectValue placeholder="Responsable" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous responsables</SelectItem>
              {assignees.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger><SelectValue placeholder="Date" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes dates</SelectItem>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="90">90 derniers jours</SelectItem>
            </SelectContent>
          </Select>
          {(statusFilter !== 'all' || prioFilter !== 'all' || assigneeFilter !== 'all' || dateFilter !== 'all' || searchQuery) && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="md:col-span-5 justify-self-start">
              <X className="h-3 w-3 mr-1" />Réinitialiser
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {processedData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {(tickets?.length ?? 0) === 0 ? 'Aucun ticket créé pour le moment' : 'Aucun résultat pour ces filtres'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="ticket_title" currentSort={sortColumn as string} direction={sortDirection} onSort={toggleSort as any}>Ticket</SortableTableHead>
                <SortableTableHead column="target_pole" currentSort={sortColumn as string} direction={sortDirection} onSort={toggleSort as any}>Pôle</SortableTableHead>
                <SortableTableHead column="ticket_status" currentSort={sortColumn as string} direction={sortDirection} onSort={toggleSort as any}>Statut</SortableTableHead>
                <SortableTableHead column="priority" currentSort={sortColumn as string} direction={sortDirection} onSort={toggleSort as any}>Priorité</SortableTableHead>
                <SortableTableHead column="assignee_label" currentSort={sortColumn as string} direction={sortDirection} onSort={toggleSort as any}>Responsable</SortableTableHead>
                <SortableTableHead column="created_iso" currentSort={sortColumn as string} direction={sortDirection} onSort={toggleSort as any}>Créé</SortableTableHead>
                <th className="text-right pr-4">Action</th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.map((t: any) => (
                <TableRow key={t.ticket_id}>
                  <TableCell className="max-w-[280px]">
                    <p className="font-medium truncate">{t.ticket_title || '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.detail}</p>
                  </TableCell>
                  <TableCell><Badge variant="outline">{t.target_pole || '—'}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={t.ticket_status === 'resolved' ? 'default' : t.ticket_status === 'in_progress' ? 'secondary' : 'outline'}>
                      {t.ticket_status}
                    </Badge>
                  </TableCell>
                  <TableCell><Badge className={prioColor(t.priority)}>{t.priority}</Badge></TableCell>
                  <TableCell className="text-sm">{t.assignee_name || <span className="text-muted-foreground">Non assigné</span>}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/pole/rd/tickets/${t.ticket_id}`}>
                        Ouvrir <ExternalLink className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};


const Page = () => {
  const { data: reports, isLoading } = useRDReports();
  const { data: recos } = useRDRecommendations();
  const { data: tickets } = useRDTickets();
  const createReport = useCreateRDReport();
  const updateReport = useUpdateRDReportStatus();
  const createReco = useCreateRDRecommendation();

  const [reportOpen, setReportOpen] = useState(false);
  const [recoOpen, setRecoOpen] = useState(false);
  const [reportForm, setReportForm] = useState({ title: '', type: 'analysis', summary: '' });
  const [recoForm, setRecoForm] = useState({ report_id: '', detail: '', category: '', priority: 'medium' });

  const submitReport = async () => {
    try {
      await createReport.mutateAsync(reportForm);
      toast.success('Rapport créé');
      setReportOpen(false);
      setReportForm({ title: '', type: 'analysis', summary: '' });
    } catch (e: any) { toast.error(e.message); }
  };

  const submitReco = async () => {
    try {
      await createReco.mutateAsync(recoForm);
      toast.success('Recommandation créée');
      setRecoOpen(false);
      setRecoForm({ report_id: '', detail: '', category: '', priority: 'medium' });
    } catch (e: any) { toast.error(e.message); }
  };

  const stats = {
    total: reports?.length ?? 0,
    published: reports?.filter((r: any) => r.status === 'published').length ?? 0,
    recos: recos?.length ?? 0,
    pending: recos?.filter((r: any) => r.status === 'pending').length ?? 0,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><FileText className="h-8 w-8" /> Rapports & Recommandations R&D</h1>
          <p className="text-muted-foreground mt-1">Insights, frictions, et transformation en actions</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={recoOpen} onOpenChange={setRecoOpen}>
            <DialogTrigger asChild><Button variant="outline"><Lightbulb className="h-4 w-4 mr-2" />Nouvelle recommandation</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Créer une recommandation</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Rapport associé</Label>
                  <Select value={recoForm.report_id} onValueChange={v => setRecoForm({ ...recoForm, report_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir un rapport" /></SelectTrigger>
                    <SelectContent>{(reports ?? []).map((r: any) => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Détail</Label><Textarea rows={3} value={recoForm.detail} onChange={e => setRecoForm({ ...recoForm, detail: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Catégorie</Label><Input value={recoForm.category} onChange={e => setRecoForm({ ...recoForm, category: e.target.value })} placeholder="Produits, UX..." /></div>
                  <div><Label>Priorité</Label>
                    <Select value={recoForm.priority} onValueChange={v => setRecoForm({ ...recoForm, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Basse</SelectItem><SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Haute</SelectItem><SelectItem value="critical">Critique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter><Button onClick={submitReco} disabled={!recoForm.report_id || !recoForm.detail || createReco.isPending}>Créer</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={reportOpen} onOpenChange={setReportOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nouveau rapport</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Créer un rapport R&D</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Titre</Label><Input value={reportForm.title} onChange={e => setReportForm({ ...reportForm, title: e.target.value })} /></div>
                <div><Label>Type</Label>
                  <Select value={reportForm.type} onValueChange={v => setReportForm({ ...reportForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analysis">Analyse</SelectItem>
                      <SelectItem value="risk">Risque</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="friction">Friction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Résumé</Label><Textarea rows={4} value={reportForm.summary} onChange={e => setReportForm({ ...reportForm, summary: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={submitReport} disabled={!reportForm.title || createReport.isPending}>Créer</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-3xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground">Rapports</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-3xl font-bold text-emerald-500">{stats.published}</p><p className="text-sm text-muted-foreground">Publiés</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-3xl font-bold">{stats.recos}</p><p className="text-sm text-muted-foreground">Recommandations</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-3xl font-bold text-orange-500">{stats.pending}</p><p className="text-sm text-muted-foreground">En attente</p></CardContent></Card>
      </div>

      {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
        <Tabs defaultValue="reports">
          <TabsList>
            <TabsTrigger value="reports">Rapports ({stats.total})</TabsTrigger>
            <TabsTrigger value="recos">Recommandations ({stats.recos})</TabsTrigger>
            <TabsTrigger value="tickets">Tickets ({tickets?.length ?? 0})</TabsTrigger>
          </TabsList>
          <TabsContent value="reports" className="space-y-3 mt-4">
            {(reports ?? []).map((r: any) => (
              <Card key={r.id}>
                <CardContent className="p-4 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2"><span className="font-semibold">{r.title}</span><Badge variant="outline">{r.type}</Badge><Badge>{r.status}</Badge></div>
                    <p className="text-sm text-muted-foreground mt-1">{r.summary}</p>
                    <p className="text-xs text-muted-foreground mt-1">{r.author_name || 'Anonyme'} — {new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {r.status !== 'published' && <Button size="sm" onClick={async () => { try { await updateReport.mutateAsync({ id: r.id, status: 'published' }); toast.success('Publié'); } catch (e: any) { toast.error(e.message); } }}><CheckCircle className="h-4 w-4 mr-1" />Publier</Button>}
                    {r.status === 'draft' && <Button size="sm" variant="outline" onClick={async () => { try { await updateReport.mutateAsync({ id: r.id, status: 'review' }); toast.success('En revue'); } catch (e: any) { toast.error(e.message); } }}><Clock className="h-4 w-4 mr-1" />En revue</Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!reports || reports.length === 0) && <p className="text-sm text-muted-foreground text-center py-6">Aucun rapport</p>}
          </TabsContent>
          <TabsContent value="recos" className="space-y-3 mt-4">
            {(recos ?? []).map((r: any) => <RecommendationCard key={r.id} r={r} />)}
            {(!recos || recos.length === 0) && <p className="text-sm text-muted-foreground text-center py-6">Aucune recommandation</p>}
          </TabsContent>
          <TabsContent value="tickets" className="mt-4">
            <TicketsTab />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default function RDReports() {
  return <ProtectedScreen screenId="rd.reports"><Page /></ProtectedScreen>;
}
