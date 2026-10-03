import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSecurityAlerts } from '@/hooks/useTechData';
import { Shield } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function TechSecurity() {
  const { data = [], isLoading, update } = useSecurityAlerts();
  const [statusFilter, setStatusFilter] = useState('open');
  const [sevFilter, setSevFilter] = useState('all');

  const filtered = useMemo(() => data.filter((a: any) =>
    (statusFilter === 'all' || a.status === statusFilter) &&
    (sevFilter === 'all' || a.severity === sevFilter)
  ), [data, statusFilter, sevFilter]);

  const counts = useMemo(() => ({
    critical: data.filter((a: any) => a.severity === 'critical' && a.status === 'open').length,
    high: data.filter((a: any) => a.severity === 'high' && a.status === 'open').length,
    open: data.filter((a: any) => a.status === 'open').length,
    resolved: data.filter((a: any) => a.status === 'resolved').length,
  }), [data]);

  const setStatus = async (id: string, status: string) => {
    try {
      await update.mutateAsync({ id, status, ...(status === 'resolved' ? { resolved_at: new Date().toISOString() } : {}) });
      toast.success('Statut mis à jour');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Shield className="h-7 w-7" /> Sécurité</h1>
        <p className="text-muted-foreground">Alertes, incidents et anomalies détectées</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Critiques</p><p className="text-2xl font-bold text-destructive">{counts.critical}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Haute</p><p className="text-2xl font-bold text-warning">{counts.high}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Ouvertes</p><p className="text-2xl font-bold">{counts.open}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Résolues</p><p className="text-2xl font-bold text-success">{counts.resolved}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Alertes ({filtered.length})</CardTitle>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="open">Ouvertes</SelectItem>
                <SelectItem value="investigating">En cours</SelectItem>
                <SelectItem value="resolved">Résolues</SelectItem>
                <SelectItem value="dismissed">Ignorées</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sevFilter} onValueChange={setSevFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes sévérités</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune alerte.</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Titre</TableHead>
                <TableHead>Sévérité</TableHead><TableHead>IP</TableHead><TableHead>Statut</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs">{format(new Date(a.created_at), 'dd/MM HH:mm')}</TableCell>
                    <TableCell><Badge variant="outline">{a.alert_type}</Badge></TableCell>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell>
                      <Badge variant={a.severity === 'critical' || a.severity === 'high' ? 'destructive' : 'secondary'}>{a.severity}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{a.ip_address || '—'}</TableCell>
                    <TableCell><Badge variant={a.status === 'resolved' ? 'default' : 'secondary'}>{a.status}</Badge></TableCell>
                    <TableCell>
                      {a.status === 'open' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setStatus(a.id, 'investigating')}>Enquêter</Button>
                          <Button size="sm" variant="ghost" onClick={() => setStatus(a.id, 'resolved')}>Résoudre</Button>
                        </div>
                      )}
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
