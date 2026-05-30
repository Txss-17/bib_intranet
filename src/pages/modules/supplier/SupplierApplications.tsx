import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedScreen } from '@/components/ProtectedScreen';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ExportButtons } from '@/components/ExportButtons';
import { useSupplierApplications, SupplierApplication } from '@/hooks/useSupplierApplications';
import { Inbox, Flame } from 'lucide-react';

const statusLabels: Record<string, string> = {
  new: 'Nouvelle', assigned: 'Assignée', in_review: 'En revue',
  approved: 'Approuvée', rejected: 'Refusée', on_hold: 'En attente',
};
const priorityLabels: Record<string, string> = { high: '🔥 Haute', standard: '🟡 Standard', low: '⚪ Faible' };

function statusColor(s: string) {
  return s === 'approved' ? 'bg-green-500/15 text-green-700 dark:text-green-400'
    : s === 'rejected' ? 'bg-red-500/15 text-red-700 dark:text-red-400'
    : s === 'in_review' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
    : s === 'assigned' ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400'
    : 'bg-muted text-muted-foreground';
}

export default function SupplierApplications() {
  const { data: apps = [], isLoading } = useSupplierApplications();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [priority, setPriority] = useState<string>('all');
  const [type, setType] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apps.filter(a => {
      if (status !== 'all' && a.status !== status) return false;
      if (priority !== 'all' && a.priority !== priority) return false;
      if (type !== 'all' && a.type !== type) return false;
      if (q && !`${a.company_name} ${a.contact_email} ${a.contact_name ?? ''} ${a.country ?? ''} ${a.category ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [apps, search, status, priority, type]);

  const exportRows = filtered.map(a => ({
    Société: a.company_name, Type: a.type, Pays: a.country ?? '', Catégorie: a.category ?? '',
    Score: a.score, Priorité: a.priority, Statut: a.status, Gestionnaire: a.assigned_to_name ?? '',
    Email: a.contact_email, Reçue: new Date(a.created_at).toLocaleString('fr-FR'),
  }));

  const counts = {
    new: apps.filter(a => a.status === 'new').length,
    toProcess: apps.filter(a => ['new','assigned','in_review'].includes(a.status)).length,
    high: apps.filter(a => a.priority === 'high' && a.status !== 'approved' && a.status !== 'rejected').length,
  };

  return (
    <MainLayout>
      <ProtectedScreen screenId="supplier.applications">
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2"><Inbox className="h-6 w-6" /> Candidatures fournisseurs</h1>
              <p className="text-sm text-muted-foreground">Réception et traitement des candidatures issues du formulaire b.i.b platform</p>
            </div>
            <ExportButtons data={exportRows} filename="candidatures-fournisseurs" title="Candidatures fournisseurs" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Nouvelles</div><div className="text-2xl font-semibold mt-1">{counts.new}</div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">À traiter</div><div className="text-2xl font-semibold mt-1">{counts.toProcess}</div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground flex items-center gap-1"><Flame className="h-3 w-3" /> Priorité haute</div><div className="text-2xl font-semibold mt-1">{counts.high}</div></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Filtres</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input placeholder="Recherche société, email…" value={search} onChange={e => setSearch(e.target.value)} />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue placeholder="Priorité" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes priorités</SelectItem>
                  {Object.entries(priorityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="supplier">Fournisseur</SelectItem>
                  <SelectItem value="manufacturer">Fabricant</SelectItem>
                  <SelectItem value="logistics">Logisticien</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Société</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Gestionnaire</TableHead>
                    <TableHead>Reçue</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Chargement…</TableCell></TableRow>}
                  {!isLoading && filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Aucune candidature</TableCell></TableRow>}
                  {filtered.map(a => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium">{a.company_name}</div>
                        <div className="text-xs text-muted-foreground">{a.contact_email}</div>
                      </TableCell>
                      <TableCell className="capitalize">{a.type}</TableCell>
                      <TableCell>{a.country ?? '—'}</TableCell>
                      <TableCell><Badge variant="outline">{a.score}</Badge></TableCell>
                      <TableCell>{priorityLabels[a.priority] ?? a.priority}</TableCell>
                      <TableCell><Badge className={statusColor(a.status)} variant="secondary">{statusLabels[a.status] ?? a.status}</Badge></TableCell>
                      <TableCell>{a.assigned_to_name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-xs">{new Date(a.created_at).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost"><Link to={`/pole/supplier/applications/${a.id}`}>Ouvrir</Link></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </ProtectedScreen>
    </MainLayout>
  );
}
