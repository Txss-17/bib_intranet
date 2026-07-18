import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GitPullRequest, Search, ArrowRight } from 'lucide-react';
import { usePublicationRequests, useUpdateRequestStatus, PublicationRequestRow } from '@/hooks/useDataQueries';

const STATUS_FLOW: PublicationRequestRow['status'][] = [
  'draft', 'data_validated', 'tech_queued', 'in_dev', 'testing', 'deployed',
];

const STATUS_LABEL: Record<string, string> = {
  draft: 'Brouillon',
  data_validated: 'Validé Data',
  tech_queued: 'File Tech',
  in_dev: 'En dev',
  testing: 'Test',
  deployed: 'Déployé',
  archived: 'Archivé',
  rejected: 'Rejeté',
};

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  data_validated: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  tech_queued: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  in_dev: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  testing: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  deployed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  archived: 'bg-muted text-muted-foreground',
  rejected: 'bg-destructive/10 text-destructive border-destructive/30',
};

const PRIO_STYLE: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-muted text-muted-foreground',
};

export default function PublicationRequests() {
  const { data: requests = [], isLoading } = usePublicationRequests();
  const update = useUpdateRequestStatus();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = useMemo(() => requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (typeFilter !== 'all' && r.request_type !== typeFilter) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [requests, search, statusFilter, typeFilter]);

  const advance = (r: PublicationRequestRow) => {
    const idx = STATUS_FLOW.indexOf(r.status as any);
    const next = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : r.status;
    if (next !== r.status) update.mutate({ id: r.id, status: next });
  };

  return (
    <div className="space-y-6 p-6">
      <header>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <GitPullRequest className="h-3.5 w-3.5" /> Data & Analytics
        </div>
        <h1 className="text-2xl font-semibold">Demandes de publication</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Workflow Data → Tech : validation, mise en file, dev, test, déploiement.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {STATUS_FLOW.concat(['archived', 'rejected']).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            <SelectItem value="kpi">KPI</SelectItem>
            <SelectItem value="dashboard">Dashboard</SelectItem>
            <SelectItem value="feature">Feature</SelectItem>
            <SelectItem value="fix">Fix</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{filtered.length} demandes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Cible</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Chargement…</TableCell></TableRow>}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Aucune demande.</TableCell></TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.title}</div>
                    {r.description && <div className="text-xs text-muted-foreground line-clamp-1">{r.description}</div>}
                  </TableCell>
                  <TableCell><Badge variant="outline">{r.request_type}</Badge></TableCell>
                  <TableCell><Badge className={PRIO_STYLE[r.priority]}>{r.priority}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={STATUS_STYLE[r.status]}>{STATUS_LABEL[r.status]}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.target_deploy_date ? new Date(r.target_deploy_date).toLocaleDateString('fr-FR') : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {!['deployed', 'archived', 'rejected'].includes(r.status) && (
                      <Button variant="ghost" size="sm" onClick={() => advance(r)}>
                        Étape suivante <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
