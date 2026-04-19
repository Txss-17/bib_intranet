import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSyncEvents } from '@/hooks/useOpsControl';
import { ArrowDown, ArrowUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function SyncFlows() {
  const { data: events = [], isLoading } = useSyncEvents();

  const total = events.length;
  const errors = events.filter((e) => e.status === 'error').length;
  const successRate = total === 0 ? 100 : Math.round(((total - errors) / total) * 100);
  const avgDuration =
    total === 0
      ? 0
      : Math.round(events.reduce((a, e) => a + (e.duration_ms ?? 0), 0) / total);

  const statusIcon = (s: string) => {
    if (s === 'success') return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (s === 'error' || s === 'timeout') return <AlertCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-warning" />;
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Flux & synchronisation</h1>
        <p className="text-muted-foreground">Échanges aller/retour avec les partenaires logistiques</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taux de succès</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{successRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Erreurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{errors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latence moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDuration} ms</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des échanges</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sens</TableHead>
                  <TableHead>Partenaire</TableHead>
                  <TableHead>Événement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Durée</TableHead>
                  <TableHead>Quand</TableHead>
                  <TableHead>Erreur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      {e.direction === 'outbound' ? (
                        <ArrowUp className="h-4 w-4 text-primary" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-accent" />
                      )}
                    </TableCell>
                    <TableCell>{e.logistics_partners?.name ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{e.event_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {statusIcon(e.status)}
                        <span className="capitalize">{e.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{e.duration_ms ?? '—'} ms</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(e.created_at), { addSuffix: true, locale: fr })}
                    </TableCell>
                    <TableCell className="text-xs text-destructive max-w-xs truncate">
                      {e.error_message ?? ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
