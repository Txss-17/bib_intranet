import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, History as HistoryIcon, Plus, Minus } from 'lucide-react';
import { useDashboard, useVersions } from '@/hooks/useBI';

export default function BIHistory() {
  const { id } = useParams();
  const { data: dashboard } = useDashboard(id);
  const { data: versions = [] } = useVersions(id);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link to="/pole/data/bi/dashboards"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <HistoryIcon className="h-3.5 w-3.5" /> BI · Historique
          </div>
          <h1 className="text-2xl font-semibold">Versions — {dashboard?.name ?? '…'}</h1>
        </div>
      </div>

      <div className="space-y-3">
        {versions.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Aucune version enregistrée pour ce tableau de bord.</CardContent></Card>
        )}
        {versions.map(v => (
          <Card key={v.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                <Badge>{v.version}</Badge>
                <span className="text-sm text-muted-foreground">{new Date(v.created_at).toLocaleString('fr-FR')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {v.note && <p className="text-sm">{v.note}</p>}
              <div className="flex gap-4 text-xs">
                {v.kpis_added.length > 0 && <span className="flex items-center gap-1 text-emerald-600"><Plus className="h-3 w-3" /> {v.kpis_added.length} KPI ajouté(s)</span>}
                {v.kpis_removed.length > 0 && <span className="flex items-center gap-1 text-destructive"><Minus className="h-3 w-3" /> {v.kpis_removed.length} KPI retiré(s)</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
