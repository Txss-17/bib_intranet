import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, Plus, LayoutDashboard, Copy, Archive, History, Send, ExternalLink } from 'lucide-react';
import { useDashboards, useDuplicateDashboard, useArchiveDashboard, usePublishDashboard } from '@/hooks/useBI';

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  validation: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  published: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  archived: 'bg-muted text-muted-foreground opacity-60',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Brouillon', validation: 'Validation', published: 'Publié', archived: 'Archivé',
};

export default function BIDashboardsList() {
  const { data: dashboards = [], isLoading } = useDashboards();
  const duplicate = useDuplicateDashboard();
  const archive = useArchiveDashboard();
  const publish = usePublishDashboard();
  const [search, setSearch] = useState('');

  const filtered = dashboards.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <LayoutDashboard className="h-3.5 w-3.5" /> BI
          </div>
          <h1 className="text-2xl font-semibold">Mes tableaux de bord</h1>
        </div>
        <Button asChild><Link to="/pole/data/bi/designer/new"><Plus className="h-4 w-4 mr-1" /> Nouveau</Link></Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Pôle</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière modif.</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Chargement…</TableCell></TableRow>}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun tableau de bord. <Link to="/pole/data/bi/designer/new" className="underline">Créer le premier</Link>.</TableCell></TableRow>
              )}
              {filtered.map(d => (
                <TableRow key={d.id}>
                  <TableCell><Link to={`/pole/data/bi/designer/${d.id}`} className="font-medium hover:underline">{d.name}</Link></TableCell>
                  <TableCell><Badge variant="outline">{d.pole_id ?? '—'}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{d.version}</TableCell>
                  <TableCell><Badge variant="outline" className={STATUS_STYLE[d.status]}>{STATUS_LABEL[d.status]}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(d.updated_at).toLocaleString('fr-FR')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><Link to={`/pole/data/bi/designer/${d.id}`}><ExternalLink className="h-3.5 w-3.5 mr-2" /> Ouvrir</Link></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicate.mutate(d.id)}><Copy className="h-3.5 w-3.5 mr-2" /> Dupliquer</DropdownMenuItem>
                        <DropdownMenuItem asChild><Link to={`/pole/data/bi/history/${d.id}`}><History className="h-3.5 w-3.5 mr-2" /> Historique</Link></DropdownMenuItem>
                        {d.status === 'draft' && <DropdownMenuItem onClick={() => publish.mutate({ id: d.id, action: 'submit' })}><Send className="h-3.5 w-3.5 mr-2" /> Envoyer en validation</DropdownMenuItem>}
                        {d.status === 'validation' && <DropdownMenuItem onClick={() => publish.mutate({ id: d.id, action: 'publish' })}><Send className="h-3.5 w-3.5 mr-2" /> Publier</DropdownMenuItem>}
                        {d.status !== 'archived' && <DropdownMenuItem onClick={() => archive.mutate(d.id)}><Archive className="h-3.5 w-3.5 mr-2" /> Archiver</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
