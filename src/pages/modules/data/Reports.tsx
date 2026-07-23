import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Search, Download, Eye, Filter, Calendar } from 'lucide-react';
import { useDashboards } from '@/hooks/useBI';
import { usePublications } from '@/hooks/useDataQueries';
import { Link } from 'react-router-dom';

export default function Reports() {
  const { data: dashboards = [] } = useDashboards();
  const { data: publications = [] } = usePublications();
  const [search, setSearch] = useState('');

  const reports = useMemo(() => {
    const fromDashboards = dashboards
      .filter((d: any) => d.status === 'published')
      .map((d: any) => ({
        id: `d-${d.id}`,
        title: d.name,
        source: 'BI',
        pole: d.pole_id ?? '—',
        updated_at: d.updated_at,
        href: `/pole/data/bi/designer/${d.id}`,
      }));
    const fromPubs = publications.map((p: any) => ({
      id: `p-${p.id}`,
      title: p.title,
      source: 'Publication',
      pole: p.pole_id ?? '—',
      updated_at: p.published_at ?? p.created_at,
      href: `/feed?tab=news`,
    }));
    return [...fromDashboards, ...fromPubs].sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }, [dashboards, publications]);

  const filtered = reports.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 p-6">
      <header>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <FileText className="h-3.5 w-3.5" /> Data & Analytics
        </div>
        <h1 className="text-2xl font-semibold">Rapports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Consolidation des tableaux de bord publiés et des publications validées.
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Rapports actifs</div><div className="text-2xl font-semibold mt-1">{reports.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Dashboards BI</div><div className="text-2xl font-semibold mt-1">{dashboards.filter((d: any) => d.status === 'published').length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Publications</div><div className="text-2xl font-semibold mt-1">{publications.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Ce mois</div><div className="text-2xl font-semibold mt-1">{reports.filter(r => new Date(r.updated_at).getMonth() === new Date().getMonth()).length}</div></CardContent></Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un rapport…" className="pl-9" />
        </div>
        <Button variant="outline" size="sm"><Filter className="h-3.5 w-3.5 mr-1" /> Filtres</Button>
        <Button variant="outline" size="sm"><Calendar className="h-3.5 w-3.5 mr-1" /> Période</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{filtered.length} rapport(s)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Pôle</TableHead>
                <TableHead>Mise à jour</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucun rapport disponible.</TableCell></TableRow>
              )}
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell><Badge variant="outline">{r.source}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.pole}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="ghost"><Link to={r.href}><Eye className="h-3.5 w-3.5 mr-1" /> Ouvrir</Link></Button>
                    <Button size="sm" variant="ghost"><Download className="h-3.5 w-3.5 mr-1" /> Export</Button>
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
