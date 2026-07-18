import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Search } from 'lucide-react';
import { usePublications } from '@/hooks/useDataQueries';

const TYPE_STYLE: Record<string, string> = {
  technical: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  news: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  hr: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  finance: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  legal: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  security: 'bg-destructive/10 text-destructive border-destructive/30',
  data: 'bg-primary/10 text-primary border-primary/30',
};

export default function WhatsNew() {
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');
  const { data: pubs = [], isLoading } = usePublications({ type });

  const filtered = useMemo(() => pubs.filter((p) => {
    if (p.status !== 'published') return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [pubs, search]);

  return (
    <div className="space-y-6 p-6">
      <header>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Transversal
        </div>
        <h1 className="text-2xl font-semibold">What's New</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Nouveautés, évolutions techniques, décisions clés — filtrables par pôle et type.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-9" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            <SelectItem value="technical">Technique</SelectItem>
            <SelectItem value="news">Actualité</SelectItem>
            <SelectItem value="hr">RH</SelectItem>
            <SelectItem value="finance">Finance</SelectItem>
            <SelectItem value="legal">Juridique</SelectItem>
            <SelectItem value="security">Sécurité</SelectItem>
            <SelectItem value="data">Data</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {!isLoading && filtered.length === 0 && (
          <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Aucune publication pour ces filtres.</CardContent></Card>
        )}
        {filtered.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-base">{p.title}</CardTitle>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={TYPE_STYLE[p.type]} variant="outline">{p.type}</Badge>
                  <span className="text-xs text-muted-foreground font-mono">v{p.version}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {p.summary && <p className="text-sm text-muted-foreground">{p.summary}</p>}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
                {p.author_pole && <Badge variant="outline">{p.author_pole}</Badge>}
                {p.publish_at && <span>{new Date(p.publish_at).toLocaleDateString('fr-FR')}</span>}
                <span>Visibilité : {p.visibility_scope}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
