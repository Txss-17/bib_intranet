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

type SecurityAlertSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | string;

type SecurityAlertStatus =
  | 'open'
  | 'investigating'
  | 'resolved'
  | 'dismissed'
  | string;

interface SecurityAlert {
  id: string;
  created_at: string;
  alert_type: string;
  title: string;
  severity: SecurityAlertSeverity;
  ip_address?: string | null;
  status: SecurityAlertStatus;
  resolved_at?: string | null;
}

const formatSeverity = (
  severity: SecurityAlertSeverity,
) => {
  switch (severity) {
    case 'critical':
      return 'Critique';
    case 'high':
      return 'Haute';
    case 'medium':
      return 'Moyenne';
    case 'low':
      return 'Basse';
    default:
      return severity;
  }
};

const formatStatus = (
  status: SecurityAlertStatus,
) => {
  switch (status) {
    case 'open':
      return 'Ouverte';
    case 'investigating':
      return 'En cours';
    case 'resolved':
      return 'Résolue';
    case 'dismissed':
      return 'Ignorée';
    default:
      return status;
  }
};

const severityVariant = (
  severity: SecurityAlertSeverity,
): 'destructive' | 'secondary' => {
  return severity === 'critical' ||
    severity === 'high'
    ? 'destructive'
    : 'secondary';
};

const statusVariant = (
  status: SecurityAlertStatus,
): 'default' | 'secondary' => {
  return status === 'resolved'
    ? 'default'
    : 'secondary';
};

const formatAlertDate = (
  value: string,
) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return format(
    date,
    'dd/MM HH:mm',
  );
};

export default function Security() {
  const {
    data = [],
    isLoading,
    update,
  } = useSecurityAlerts();

  const alerts =
    data as SecurityAlert[];

  const [statusFilter, setStatusFilter] =
    useState('open');

  const [severityFilter, setSeverityFilter] =
    useState('all');

  const filtered = useMemo(() => {
    return alerts.filter((alert) => {
      const statusMatches =
        statusFilter === 'all' ||
        alert.status === statusFilter;

      const severityMatches =
        severityFilter === 'all' ||
        alert.severity === severityFilter;

      return (
        statusMatches &&
        severityMatches
      );
    });
  }, [
    alerts,
    statusFilter,
    severityFilter,
  ]);

  const counts = useMemo(
    () => ({
      critical: alerts.filter(
        (alert) =>
          alert.severity ===
            'critical' &&
          alert.status === 'open',
      ).length,

      high: alerts.filter(
        (alert) =>
          alert.severity ===
            'high' &&
          alert.status === 'open',
      ).length,

      open: alerts.filter(
        (alert) =>
          alert.status === 'open',
      ).length,

      investigating: alerts.filter(
        (alert) =>
          alert.status ===
          'investigating',
      ).length,

      resolved: alerts.filter(
        (alert) =>
          alert.status ===
          'resolved',
      ).length,
    }),
    [alerts],
  );

  const setStatus = async (
    id: string,
    status: SecurityAlertStatus,
  ) => {
    try {
      await update.mutateAsync({
        id,
        status,
        ...(status ===
        'resolved'
          ? {
              resolved_at:
                new Date().toISOString(),
            }
          : {}),
      });

      toast.success(
        'Statut de l’alerte mis à jour',
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Impossible de mettre à jour l’alerte.';

      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Shield className="h-7 w-7" />
          Sécurité
        </h1>

        <p className="text-muted-foreground">
          Alertes, incidents et anomalies
          détectées sur les systèmes BIB.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
              En investigation
            </p>

            <p className="text-2xl font-bold">
              {counts.investigating}
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
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle>
            Alertes ({filtered.length})
          </CardTitle>

          <div className="flex flex-wrap gap-2">
            <Select
              value={statusFilter}
              onValueChange={
                setStatusFilter
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Tous les statuts
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
              onValueChange={
                setSeverityFilter
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Toutes les sévérités
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
            <p className="text-sm text-muted-foreground">
              Aucune alerte correspondant
              aux filtres sélectionnés.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Date
                  </TableHead>

                  <TableHead>
                    Type
                  </TableHead>

                  <TableHead>
                    Titre
                  </TableHead>

                  <TableHead>
                    Sévérité
                  </TableHead>

                  <TableHead>
                    IP
                  </TableHead>

                  <TableHead>
                    Statut
                  </TableHead>

                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map(
                  (alert) => (
                    <TableRow
                      key={alert.id}
                    >
                      <TableCell className="text-xs">
                        {formatAlertDate(
                          alert.created_at,
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
                          variant={severityVariant(
                            alert.severity,
                          )}
                        >
                          {formatSeverity(
                            alert.severity,
                          )}
                        </Badge>
                      </TableCell>

                      <TableCell className="font-mono text-xs">
                        {alert.ip_address ||
                          '—'}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={statusVariant(
                            alert.status,
                          )}
                        >
                          {formatStatus(
                            alert.status,
                          )}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        {alert.status ===
                        'open' ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={
                                update.isPending
                              }
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
                              disabled={
                                update.isPending
                              }
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
                        ) : alert.status ===
                          'investigating' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={
                              update.isPending
                            }
                            onClick={() =>
                              setStatus(
                                alert.id,
                                'resolved',
                              )
                            }
                          >
                            Résoudre
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}