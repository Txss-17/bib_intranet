import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import { useKpiVersions } from '@/hooks/useDataQueries';

export default function KPIVersions() {
  const { data: versions = [], isLoading } = useKpiVersions();
  return (
    <div className="space-y-6 p-6">
      <header>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <History className="h-3.5 w-3.5" /> Data & Analytics
        </div>
        <h1 className="text-2xl font-semibold">Historique des versions</h1>
        <p className="text-sm text-muted-foreground mt-1">Traçabilité des évolutions du catalogue KPI.</p>
      </header>
      <Card>
        <CardHeader><CardTitle className="text-base">{versions.length} entrées</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {!isLoading && versions.length === 0 && <p className="text-sm text-muted-foreground">Aucune version enregistrée.</p>}
          {versions.map((v: any) => (
            <div key={v.id} className="flex items-center justify-between border-b pb-2">
              <div>
                <div className="font-medium text-sm">KPI {v.kpi_id?.slice(0, 8)}</div>
                <div className="text-xs text-muted-foreground">{v.change_summary ?? '—'}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">v{v.version}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
