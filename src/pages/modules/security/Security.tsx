import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useSecurityAlerts } from '@/hooks/useTechData';

interface SecurityAlert {
  id: string;
  created_at: string;
  alert_type: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  ip_address: string | null;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
}

export default function Security() {
  const { data = [], isLoading, update } = useSecurityAlerts();

  const [statusFilter, setStatusFilter] = useState<
    SecurityAlert['status'] | 'all'
  >('open');

  const [severityFilter, setSeverityFilter] = useState<
    SecurityAlert['severity'] | 'all'
  >('all');

  const alerts = data as SecurityAlert[];

  const filtered = useMemo(
    () =>
      alerts.filter(
        (alert) =>
          (statusFilter === 'all' ||
            alert.status === statusFilter) &&
          (severityFilter === 'all' ||
            alert.severity === severityFilter),
      ),
    [alerts, statusFilter, severityFilter],
  );

  const counts = useMemo(
    () => ({
      critical: alerts.filter(
        (alert) =>
          alert.severity === 'critical' &&
          alert.status === 'open',
      ).length,

      high: alerts.filter(
        (alert) =>
          alert.severity === 'high' &&
          alert.status === 'open',
      ).length,

      open: alerts.filter(
        (alert) => alert.status === 'open',
      ).length,

      resolved: alerts.filter(
        (alert) => alert.status === 'resolved',
      ).length,
    }),
    [alerts],
  );

  const setStatus = async (
    id: string,
    status: SecurityAlert['status'],
  ) => {
    try {
      await update.mutateAsync({
        id,
        status,
        ...(status === 'resolved'
          ? {
              resolved_at: new Date().toISOString(),
            }
          : {}),
      });

      toast.success('Statut mis à jour');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Impossible de mettre à jour le statut.';

      toast.error(message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Shield className="h-7 w-7" />
          Sécurité
        </h1>

        <p className="mt-1 text-muted-foreground">
          Alertes, incidents et anomalies détectées.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Critiques
            </p>

            <p className="text-2xl font-bold text-destructive">
              {counts.critical}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Haute
            </p>

            <p className="text-2xl font-bold text-warning">
              {counts.high}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Ouvertes
            </p>

            <p className="text-2xl font-bold">
              {counts.open}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Résolues
            </p>

            <p className="text-2xl font-bold text-success">
              {counts.resolved}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle>
            Alertes ({filtered.length})
          </CardTitle>

          <div className="flex flex-wrap gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(
                  value as SecurityAlert['status'] | 'all',
                )
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Tous statuts
                </SelectItem>
                <SelectItem value="open">
                  Ouvertes
                </SelectItem>
                <SelectItem value="investigating">
                  En cours
                </SelectItem>
                <SelectItem value="resolved">
                  Résolues
                </SelectItem>
                <SelectItem value="dismissed">
                  Ignorées
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={severityFilter}
              onValueChange={(value) =>
                setSeverityFilter(
                  value as SecurityAlert['severity'] | 'all',
                )
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Toutes sévérités
                </SelectItem>
                <SelectItem value="critical">
                  Critique
                </SelectItem>
                <SelectItem value="high">
                  Haute
                </SelectItem>
                <SelectItem value="medium">
                  Moyenne
                </SelectItem>
                <SelectItem value="low">
                  Basse
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Chargement…
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune alerte.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Sévérité</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="text-xs">
                      {format(
                        new Date(alert.created_at),
                        'dd/MM HH:mm',
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">
                        {alert.alert_type}
                      </Badge>
                    </TableCell>

                    <TableCell className="font-medium">
                      {alert.title}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          alert.severity === 'critical' ||
                          alert.severity === 'high'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {alert.severity}
                      </Badge>
                    </TableCell>

                    <TableCell className="font-mono text-xs">
                      {alert.ip_address ?? '—'}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          alert.status === 'resolved'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {alert.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {alert.status === 'open' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setStatus(
                                alert.id,
                                'investigating',
                              )
                            }
                          >
                            Enquêter
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setStatus(
                                alert.id,
                                'resolved',
                              )
                            }
                          >
                            Résoudre
                          </Button>
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