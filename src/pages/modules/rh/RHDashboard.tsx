import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Shield,
  UserPlus,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { useEmployees } from '@/hooks/useEmployees';
import {
  HR_STATUS,
  useHrEmployeeRequests,
} from '@/hooks/useHrOnboarding';

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const getEmployeeName = (
  firstName?: string | null,
  lastName?: string | null,
) => {
  return `${firstName ?? ''} ${lastName ?? ''}`.trim() || 'Collaborateur';
};

export default function RHDashboard() {
  const {
    data: employees = [],
    isLoading: employeesLoading,
    isError: employeesError,
  } = useEmployees();

  const {
    data: onboardingRequests = [],
    isLoading: onboardingLoading,
    isError: onboardingError,
  } = useHrEmployeeRequests();

  const activeEmployees = employees.filter(
    (employee) =>
      employee.hr_status === 'active',
  );

  const onboardingEmployees = employees.filter(
    (employee) =>
      employee.hr_status === 'onboarding',
  );

  const employeesOnLeave = employees.filter(
    (employee) =>
      employee.hr_status === 'leave',
  );

  const pendingOnboardingRequests =
    onboardingRequests.filter(
      (request) =>
        request.status === 'submitted',
    );

  const validatedOnboardingRequests =
    onboardingRequests.filter(
      (request) =>
        request.status === 'hr_validated',
    );

  const accountCreationRequests =
    onboardingRequests.filter(
      (request) =>
        request.status === 'account_created',
    );

  const completedOnboardingRequests =
    onboardingRequests.filter(
      (request) =>
        request.status === 'completed',
    );

  const recentOnboarding =
    onboardingRequests.slice(0, 5);

  const dataLoading =
    employeesLoading || onboardingLoading;

  const dataError =
    employeesError || onboardingError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">
            Pôle RH
          </h1>

          <p className="text-muted-foreground">
            Pilotage des collaborateurs, des dossiers et
            des parcours RH.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <Link to="/pole/rh/collaborateurs">
              <Users className="mr-1.5 h-4 w-4" />
              Collaborateurs
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
          >
            <Link to="/pole/rh/onboarding">
              <UserPlus className="mr-1.5 h-4 w-4" />
              Nouvel onboarding
            </Link>
          </Button>
        </div>
      </div>

      {/* Erreur */}
      {dataError && (
        <Card className="border-destructive/50">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />

            <div>
              <p className="font-medium">
                Certaines données RH sont indisponibles.
              </p>

              <p className="text-sm text-muted-foreground">
                Vérifie les droits d'accès Supabase et les
                tables utilisées par les modules RH.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Collaborateurs actifs
            </CardTitle>

            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {employeesLoading
                ? '…'
                : activeEmployees.length}
            </div>

            <p className="text-xs text-muted-foreground">
              Comptes collaborateurs au statut actif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Onboarding en cours
            </CardTitle>

            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {employeesLoading
                ? '…'
                : onboardingEmployees.length}
            </div>

            <p className="text-xs text-muted-foreground">
              Collaborateurs actuellement en onboarding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              À valider
            </CardTitle>

            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {onboardingLoading
                ? '…'
                : pendingOnboardingRequests.length}
            </div>

            <p className="text-xs text-muted-foreground">
              Dossiers soumis à la validation RH
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              En congé
            </CardTitle>

            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {employeesLoading
                ? '…'
                : employeesOnLeave.length}
            </div>

            <p className="text-xs text-muted-foreground">
              Collaborateurs actuellement au statut congé
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow onboarding */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>
                Parcours d'onboarding
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                État réel des demandes enregistrées dans le
                workflow RH.
              </p>
            </div>

            <Button
              asChild
              variant="ghost"
              size="sm"
            >
              <Link to="/pole/rh/onboarding">
                Ouvrir
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Soumis RH
                </span>

                <Clock3 className="h-4 w-4 text-muted-foreground" />
              </div>

              <p className="mt-1 text-2xl font-bold">
                {onboardingLoading
                  ? '…'
                  : pendingOnboardingRequests.length}
              </p>

              <p className="text-xs text-muted-foreground">
                À examiner
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Validés RH
                </span>

                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </div>

              <p className="mt-1 text-2xl font-bold">
                {onboardingLoading
                  ? '…'
                  : validatedOnboardingRequests.length}
              </p>

              <p className="text-xs text-muted-foreground">
                Prêts pour le provisionnement
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Compte à finaliser
                </span>

                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>

              <p className="mt-1 text-2xl font-bold">
                {onboardingLoading
                  ? '…'
                  : accountCreationRequests.length}
              </p>

              <p className="text-xs text-muted-foreground">
                Provisionnement effectué
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Terminés
                </span>

                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </div>

              <p className="mt-1 text-2xl font-bold">
                {onboardingLoading
                  ? '…'
                  : completedOnboardingRequests.length}
              </p>

              <p className="text-xs text-muted-foreground">
                Parcours RH finalisés
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dossiers récents + état RH */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>
                  Derniers dossiers d'onboarding
                </CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Les demandes les plus récemment créées.
                </p>
              </div>

              <Button
                asChild
                variant="outline"
                size="sm"
              >
                <Link to="/pole/rh/onboarding">
                  Tout voir
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {onboardingLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Chargement…
              </div>
            ) : recentOnboarding.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <UserPlus className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />

                <p className="font-medium">
                  Aucun dossier d'onboarding
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Les nouveaux dossiers apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOnboarding.map((request) => {
                  const status =
                    HR_STATUS[request.status];

                  return (
                    <div
                      key={request.id}
                      className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {getEmployeeName(
                            request.first_name,
                            request.last_name,
                          )}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          {request.position || 'Fonction non renseignée'}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {request.reference} ·{' '}
                          {formatDate(request.created_at)}
                        </p>
                      </div>

                      <Badge
                        variant={
                          status?.variant ?? 'outline'
                        }
                      >
                        {status?.label ?? request.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              État du périmètre RH
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Indicateurs issus des données actuellement
              disponibles dans le pôle RH.
            </p>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />

                  <div>
                    <p className="font-medium">
                      Collaborateurs
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Tous statuts confondus
                    </p>
                  </div>
                </div>

                <span className="font-semibold">
                  {employeesLoading
                    ? '…'
                    : employees.length}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <UserPlus className="h-5 w-5 text-muted-foreground" />

                  <div>
                    <p className="font-medium">
                      Dossiers onboarding
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Demandes enregistrées
                    </p>
                  </div>
                </div>

                <span className="font-semibold">
                  {onboardingLoading
                    ? '…'
                    : onboardingRequests.length}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />

                  <div>
                    <p className="font-medium">
                      En congé
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Statut RH actuel
                    </p>
                  </div>
                </div>

                <span className="font-semibold">
                  {employeesLoading
                    ? '…'
                    : employeesOnLeave.length}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-muted-foreground" />

                  <div>
                    <p className="font-medium">
                      Formation
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Module dédié
                    </p>
                  </div>
                </div>

                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                >
                  <Link to="/pole/rh/formation">
                    Ouvrir
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>
            Accès rapides
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              asChild
              variant="outline"
              className="justify-between"
            >
              <Link to="/pole/rh/collaborateurs">
                Collaborateurs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="justify-between"
            >
              <Link to="/pole/rh/dossiers">
                Dossiers collaborateurs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="justify-between"
            >
              <Link to="/pole/rh/access">
                Accès & permissions
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="justify-between"
            >
              <Link to="/pole/rh/alertes">
                Alertes RH
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
