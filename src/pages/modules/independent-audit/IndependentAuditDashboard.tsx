import React from 'react';
import { Eye, AlertTriangle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuditIncidents } from '@/hooks/useNewModules';
import ProtectedScreen from '@/components/ProtectedScreen';

const sevColor = (s: string) =>
  s === 'critical' ? 'bg-destructive text-destructive-foreground'
  : s === 'high' ? 'bg-orange-500 text-white'
  : s === 'medium' ? 'bg-yellow-500 text-black'
  : 'bg-muted';

const Page = () => {
  const { data, isLoading } = useAuditIncidents();

  const open = (data ?? []).filter((i: any) => i.status === 'declared' || i.status === 'investigating');
  const resolved = (data ?? []).filter((i: any) => i.status === 'resolved');
  const critical = (data ?? []).filter((i: any) => i.severity === 'critical').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><Eye className="h-8 w-8" /> Audit indépendant</h1>
          <p className="text-muted-foreground mt-1">Visibilité transversale sur les incidents déclarés</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/modules/independent-audit/declare">Déclarer un incident</Link></Button>
          <Button asChild><Link to="/modules/independent-audit/resolution">Suivi résolution</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-3xl font-bold">{data?.length ?? 0}</p><p className="text-sm text-muted-foreground">Total incidents</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-3xl font-bold text-destructive">{critical}</p><p className="text-sm text-muted-foreground">Critiques</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-3xl font-bold text-orange-500">{open.length}</p><p className="text-sm text-muted-foreground">En cours</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-3xl font-bold text-emerald-500">{resolved.length}</p><p className="text-sm text-muted-foreground">Résolus</p></CardContent></Card>
      </div>

      {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
        <Card>
          <CardHeader><CardTitle>Derniers incidents déclarés</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(data ?? []).slice(0, 20).map((i: any) => (
              <div key={i.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <div className="flex items-center gap-2">
                    {i.status === 'resolved' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      : i.status === 'investigating' ? <Clock className="h-4 w-4 text-orange-500" />
                      : <AlertTriangle className="h-4 w-4 text-destructive" />}
                    <span className="font-semibold">{i.title}</span>
                    <Badge className={sevColor(i.severity)}>{i.severity}</Badge>
                    <Badge variant="outline">{i.status}</Badge>
                    {i.category && <Badge variant="secondary">{i.category}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{i.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(i.declared_at).toLocaleDateString()}</span>
              </div>
            ))}
            {(!data || data.length === 0) && <p className="text-sm text-muted-foreground text-center py-6">Aucun incident</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default function IndependentAuditDashboard() {
  return <ProtectedScreen screenId="audit.independent"><Page /></ProtectedScreen>;
}
