import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ShieldAlert, Search, CheckCircle2, Clock3 } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { useSecurityAlerts } from "@/hooks/useTechData";

type SecurityAlertStatus =
  | "open"
  | "investigating"
  | "resolved"
  | "dismissed";

type SecurityAlertSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low";

interface SecurityAlert {
  id: string;
  created_at: string;
  alert_type: string;
  title: string;
  severity: SecurityAlertSeverity;
  status: SecurityAlertStatus;
  ip_address?: string | null;
}

const severityLabel: Record<SecurityAlertSeverity, string> = {
  critical: "Critique",
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
};

const statusLabel: Record<SecurityAlertStatus, string> = {
  open: "Ouverte",
  investigating: "En cours",
  resolved: "Résolue",
  dismissed: "Ignorée",
};

function getSeverityVariant(
  severity: SecurityAlertSeverity
): "destructive" | "secondary" | "outline" {
  if (severity === "critical" || severity === "high") {
    return "destructive";
  }

  if (severity === "medium") {
    return "secondary";
  }

  return "outline";
}

function getStatusVariant(
  status: SecurityAlertStatus
): "default" | "secondary" | "outline" {
  if (status === "resolved") {
    return "default";
  }

  if (status === "investigating") {
    return "secondary";
  }

  return "outline";
}

export default function SecurityOperations() {
  const { data = [], isLoading, update } = useSecurityAlerts();

  const [statusFilter, setStatusFilter] =
    useState<SecurityAlertStatus | "all">("open");

  const [severityFilter, setSeverityFilter] =
    useState<SecurityAlertSeverity | "all">("all");

  const [search, setSearch] = useState("");

  const alerts = data as SecurityAlert[];

  const filteredAlerts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return alerts.filter((alert) => {
      const matchesStatus =
        statusFilter === "all" || alert.status === statusFilter;

      const matchesSeverity =
        severityFilter === "all" ||
        alert.severity === severityFilter;

      const matchesSearch =
        normalizedSearch.length === 0 ||
        alert.title.toLowerCase().includes(normalizedSearch) ||
        alert.alert_type.toLowerCase().includes(normalizedSearch) ||
        Boolean(
          alert.ip_address?.toLowerCase().includes(normalizedSearch)
        );

      return matchesStatus && matchesSeverity && matchesSearch;
    });
  }, [
    alerts,
    search,
    severityFilter,
    statusFilter,
  ]);

  const counts = useMemo(() => {
    return {
      critical: alerts.filter(
        (alert) =>
          alert.severity === "critical" &&
          alert.status === "open"
      ).length,

      high: alerts.filter(
        (alert) =>
          alert.severity === "high" &&
          alert.status === "open"
      ).length,

      open: alerts.filter(
        (alert) => alert.status === "open"
      ).length,

      investigating: alerts.filter(
        (alert) => alert.status === "investigating"
      ).length,

      resolved: alerts.filter(
        (alert) => alert.status === "resolved"
      ).length,
    };
  }, [alerts]);

  const updateStatus = async (
    id: string,
    status: SecurityAlertStatus
  ) => {
    try {
      await update.mutateAsync({
        id,
        status,
        ...(status === "resolved"
          ? {
              resolved_at: new Date().toISOString(),
            }
          : {}),
      });

      toast.success(
        status === "resolved"
          ? "Alerte résolue"
          : "Alerte mise à jour"
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de mettre à jour l’alerte.";

      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* =========================================================
          HEADER
          ========================================================= */}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-card">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Security & IT
            </h1>

            <p className="text-muted-foreground">
              Supervision des alertes, incidents et anomalies de
              sécurité.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================
          KPI
          ========================================================= */}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Critiques
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {counts.critical}
                </p>
              </div>

              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Haute priorité
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {counts.high}
                </p>
              </div>

              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Ouvertes
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {counts.open}
                </p>
              </div>

              <Clock3 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  En investigation
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {counts.investigating}
                </p>
              </div>

              <Search className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Résolues
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {counts.resolved}
                </p>
              </div>

              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* =========================================================
          ALERTES
          ========================================================= */}

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>
              Alertes de sécurité
            </CardTitle>

            <p className="text-sm text-muted-foreground">
              Événements remontés par les mécanismes de
              supervision Security & IT.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Rechercher une alerte..."
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(
                  value as SecurityAlertStatus | "all"
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
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
              onValueChange={(value) =>
                setSeverityFilter(
                  value as SecurityAlertSeverity | "all"
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sévérité" />
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
            <div className="py-10 text-center text-sm text-muted-foreground">
              Chargement des alertes...
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

              <p className="font-medium">
                Aucune alerte
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Aucun événement ne correspond aux filtres
                actuels.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Sévérité</TableHead>
                    <TableHead>Origine</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(
                          new Date(alert.created_at),
                          "dd/MM/yyyy HH:mm"
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
                          variant={getSeverityVariant(
                            alert.severity
                          )}
                        >
                          {severityLabel[alert.severity]}
                        </Badge>
                      </TableCell>

                      <TableCell className="font-mono text-xs">
                        {alert.ip_address || "—"}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={getStatusVariant(
                            alert.status
                          )}
                        >
                          {statusLabel[alert.status]}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {alert.status === "open" && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateStatus(
                                  alert.id,
                                  "investigating"
                                )
                              }
                            >
                              Investiguer
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                updateStatus(
                                  alert.id,
                                  "resolved"
                                )
                              }
                            >
                              Résoudre
                            </Button>
                          </div>
                        )}

                        {alert.status === "investigating" && (
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                updateStatus(
                                  alert.id,
                                  "resolved"
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}