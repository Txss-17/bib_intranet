import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, ArrowRight, RefreshCw, Server, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePermissions } from '@/hooks/usePermissions';
import { useSecurityAlerts } from '@/hooks/useSecurityData';
import { useSecurityFunctionObservations, isFunctionFailure, readableDate } from '@/hooks/useSecurityOperations';

export default function SecuritySupervision() {
  const { canViewPage } = usePermissions();
  const functions = useSecurityFunctionObservations();
  const alerts = useSecurityAlerts();
  const events = functions.data ?? [];
  const incidents = alerts.data ?? [];
  const failures = events.filter(isFunctionFailure);
  const openAlerts = incidents.filter(row => row.status === 'open' || row.status === 'investigating');
  const latest = events.slice(0, 50);

  if (!canViewPage('security.supervision')) return <p role="alert">Accès à la supervision non autorisé.</p>;

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold"><Activity className="h-6 w-6" />Supervision technique</h1>
        <p className="mt-2 text-sm text-muted-foreground">Observabilité des fonctions serveur et alertes enregistrées, sur un échantillon horodaté d'événements.</p>
        <p className="mt-1 text-xs text-muted-foreground">Sans sonde externe ni contrôle d'hébergement, la disponibilité réelle, les temps de réponse globaux et les sauvegardes restent non mesurés.</p>
      </div>
      <Button variant="outline" disabled={functions.isFetching || alerts.isFetching}
        onClick={() => { void functions.refetch(); void alerts.refetch(); }}><RefreshCw className="mr-2 h-4 w-4" />Actualiser</Button>
    </header>
    {(functions.isError || alerts.isError) && <div role="alert" className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive">Une source de supervision est indisponible. Les résultats de cette source ne sont pas confirmés.</div>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: 'Événements observés', value: functions.isError || functions.isLoading ? '—' : events.length, Icon: Server },
        { label: 'Erreurs observées', value: functions.isError || functions.isLoading ? '—' : failures.length, Icon: AlertTriangle },
        { label: 'Dernier événement', value: functions.isError || functions.isLoading ? '—' : events[0] ? readableDate(events[0].created_at) : 'Aucun', Icon: Activity },
        { label: 'Alertes non clôturées', value: alerts.isError || alerts.isLoading ? '—' : openAlerts.length, Icon: ShieldAlert },
      ].map(item => <Card key={item.label}><CardContent className="flex items-start gap-3 p-4"><item.Icon className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
        <div><p className="break-words text-lg font-semibold">{item.value}</p><p className="text-xs text-muted-foreground">{item.label}</p></div>
      </CardContent></Card>)}
    </div>
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card><CardHeader><CardTitle className="text-base">Derniers événements des fonctions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {functions.isLoading && <p role="status">Chargement des journaux…</p>}
          {functions.isError && <p role="alert" className="text-sm text-destructive">Journaux indisponibles. <Button variant="outline" size="sm" onClick={() => void functions.refetch()}>Réessayer</Button></p>}
          {!functions.isLoading && !functions.isError && <div className="overflow-x-auto">
            <Table><TableHeader><TableRow><TableHead>Fonction</TableHead><TableHead>État enregistré</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>{latest.map(item => <TableRow key={item.id}>
                <TableCell><p className="font-medium">{item.function_name}</p><p className="text-xs text-muted-foreground">{item.app_origin ?? 'Origine non renseignée'}</p></TableCell>
                <TableCell><Badge variant={isFunctionFailure(item) ? 'destructive' : 'outline'}>{item.status || String(item.http_status ?? 'Non renseigné')}</Badge></TableCell>
                <TableCell>{readableDate(item.created_at)}</TableCell>
              </TableRow>)}
                {!latest.length && <TableRow><TableCell colSpan={3} className="p-6 text-center text-muted-foreground">Aucun événement observé dans la fenêtre. Ce n’est pas un état « tout va bien ».</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>}
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle className="text-base">Alertes en cours</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {alerts.isLoading && <p role="status">Chargement des alertes…</p>}
          {alerts.isError && <p role="alert" className="text-sm text-destructive">Alertes indisponibles. <Button variant="outline" size="sm" onClick={() => void alerts.refetch()}>Réessayer</Button></p>}
          {!alerts.isLoading && !alerts.isError && <>
            {openAlerts.slice(0, 8).map(alert => <div key={alert.id} className="rounded border p-3 text-sm">
              <p className="font-medium">{alert.title || 'Alerte sans titre'}</p>
              <p className="mt-1 text-xs text-muted-foreground">Gravité : {alert.severity ?? 'Non renseignée'} · {readableDate(alert.created_at)}</p>
            </div>)}
            {!openAlerts.length && <p className="text-sm text-muted-foreground">Aucune alerte ouverte enregistrée dans la source consultée.</p>}
          </>}
          <Link to="/pole/security/security" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">Gérer les alertes<ArrowRight className="h-4 w-4" /></Link>
        </CardContent>
      </Card>
    </div>
    <div className="flex flex-wrap gap-4 text-sm">
      <Link to="/pole/security/logs" className="text-primary hover:underline">Journaux détaillés</Link>
      <Link to="/pole/security/environments" className="text-primary hover:underline">Historique des déploiements</Link>
      <Link to="/pole/security/infrastructure" className="text-primary hover:underline">Infrastructure & continuité</Link>
    </div>
    <p className="text-xs text-muted-foreground">Les indicateurs proviennent des 200 derniers événements et des alertes accessibles à ce compte. Aucun pourcentage global de disponibilité n'est calculé.</p>
  </div>;
}
