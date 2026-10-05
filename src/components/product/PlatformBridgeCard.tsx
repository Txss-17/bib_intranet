import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Settings2,
  XCircle,
} from "lucide-react";

import {
  usePlatformActions,
  usePlatformStatus,
  usePlatformSyncRuns,
} from "@/hooks/usePlatformSync";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const formatDate = (value: string | null) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getDuration = (
  startedAt: string,
  finishedAt: string | null,
) => {
  if (!finishedAt) {
    return "En cours";
  }

  const start = new Date(startedAt).getTime();
  const end = new Date(finishedAt).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "—";
  }

  const durationMs = Math.max(0, end - start);
  const durationSeconds = Math.round(durationMs / 1000);

  if (durationSeconds < 60) {
    return `${durationSeconds} s`;
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return `${minutes} min ${seconds} s`;
};

const getErrorCount = (errors: unknown) => {
  if (Array.isArray(errors)) {
    return errors.length;
  }

  return errors ? 1 : 0;
};

const getErrorMessage = (error: unknown) => {
  if (!error) {
    return "Erreur inconnue.";
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object") {
    const value = error as Record<string, unknown>;

    if (typeof value.message === "string") {
      return value.message;
    }

    if (typeof value.error === "string") {
      return value.error;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return "Erreur inconnue.";
    }
  }

  return String(error);
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "success":
      return "Succès";

    case "partial":
      return "Partiel";

    case "error":
      return "Erreur";

    case "running":
      return "En cours";

    default:
      return status || "Inconnu";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "success":
      return (
        <CheckCircle2 className="h-4 w-4" />
      );

    case "partial":
      return (
        <AlertCircle className="h-4 w-4" />
      );

    case "error":
      return (
        <XCircle className="h-4 w-4" />
      );

    case "running":
      return (
        <RefreshCw className="h-4 w-4 animate-spin" />
      );

    default:
      return (
        <Clock3 className="h-4 w-4" />
      );
  }
};

const getStatusVariant = (
  status: string,
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "success":
      return "default";

    case "error":
      return "destructive";

    case "partial":
      return "secondary";

    default:
      return "outline";
  }
};

export function PlatformBridgeCard() {
  const { data: platformStatus, isLoading: isStatusLoading } =
    usePlatformStatus();

  const {
    data: runs = [],
    isLoading: isRunsLoading,
  } = usePlatformSyncRuns();

  const { pull } = usePlatformActions();

  const lastRun = runs[0];

  const configured = Boolean(platformStatus?.configured);

  const isSynchronizing = pull.isPending;

  const lastRunErrorCount = lastRun
    ? getErrorCount(lastRun.errors)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Liaison B.I.B Platform
            </CardTitle>

            <CardDescription>
              Synchronisation entre B.I.B Platform et B.I.B Intranet.
            </CardDescription>
          </div>

          <Badge
            variant={configured ? "default" : "outline"}
            className="w-fit"
          >
            {isStatusLoading
              ? "Vérification…"
              : configured
                ? "Connectée"
                : "À configurer"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">
              Synchronisation Platform → Intranet
            </p>

            <p className="text-sm text-muted-foreground">
              Lance une nouvelle synchronisation des données nécessaires à
              l'Intranet.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => pull.mutate()}
            disabled={!configured || isSynchronizing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                isSynchronizing ? "animate-spin" : ""
              }`}
            />

            {isSynchronizing
              ? "Synchronisation…"
              : "Synchroniser maintenant"}
          </Button>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold">
                Dernier résultat
              </h3>

              <p className="text-sm text-muted-foreground">
                État de la dernière synchronisation exécutée.
              </p>
            </div>

            {lastRun && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    Voir le rapport
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      Rapport de synchronisation
                    </DialogTitle>

                    <DialogDescription>
                      Résultat de l'exécution. Ce rapport présente
                      uniquement l'état de succès ou d'erreur de la
                      synchronisation.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border">
                        {getStatusIcon(lastRun.status)}
                      </div>

                      <div>
                        <p className="font-medium">
                          {getStatusLabel(lastRun.status)}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          {formatDate(lastRun.started_at)}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Éléments traités
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                          {lastRun.items_count ?? 0}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">
                          Erreurs
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                          {lastRunErrorCount}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">
                          Début
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {formatDate(lastRun.started_at)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">
                          Durée
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {getDuration(
                            lastRun.started_at,
                            lastRun.finished_at,
                          )}
                        </p>
                      </div>
                    </div>

                    {lastRunErrorCount > 0 && (
                      <>
                        <Separator />

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive" />

                            <p className="text-sm font-semibold">
                              Erreurs rencontrées
                            </p>
                          </div>

                          <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                            {Array.isArray(lastRun.errors) ? (
                              lastRun.errors.map(
                                (error, index) => (
                                  <div
                                    key={index}
                                    className="text-sm text-muted-foreground"
                                  >
                                    {getErrorMessage(error)}
                                  </div>
                                ),
                              )
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                {getErrorMessage(lastRun.errors)}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {isRunsLoading ? (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              Chargement du dernier résultat…
            </div>
          ) : !lastRun ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Aucune synchronisation n'a encore été exécutée.
            </div>
          ) : (
            <div className="rounded-lg border p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border">
                    {getStatusIcon(lastRun.status)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {getStatusLabel(lastRun.status)}
                      </p>

                      <Badge
                        variant={getStatusVariant(lastRun.status)}
                      >
                        {lastRun.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {formatDate(lastRun.started_at)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 text-sm">
                  <div>
                    <p className="text-muted-foreground">
                      Éléments
                    </p>

                    <p className="font-medium">
                      {lastRun.items_count ?? 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">
                      Erreurs
                    </p>

                    <p className="font-medium">
                      {lastRunErrorCount}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">
                      Durée
                    </p>

                    <p className="font-medium">
                      {getDuration(
                        lastRun.started_at,
                        lastRun.finished_at,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
