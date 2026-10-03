import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  Search,
  Truck,
  XCircle,
} from 'lucide-react';
import { useOpsPartners } from '@/hooks/useOpsControl';

interface PartnerEnriched {
  id: string;
  name: string;
  type: string | null;
  status: string | null;
  region: string | null;
  contact_email: string | null;
  volume_processed: number | null;
  avg_lead_time_hours: number | null;
  error_rate: number | null;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  suspended: 'Suspendu',
  pending: 'En attente',
};

const TYPE_LABELS: Record<string, string> = {
  carrier: 'Transporteur',
  distributor: 'Distributeur',
  logistics: 'Logistique',
  fulfillment: 'Fulfillment',
  warehouse: 'Entrepôt',
};

const formatStatus = (status: string | null) => {
  if (!status) return 'Non renseigné';
  return STATUS_LABELS[status] ?? status;
};

const formatType = (type: string | null) => {
  if (!type) return 'Non renseigné';
  return TYPE_LABELS[type] ?? type;
};

const Partners = () => {
  const { data: rawPartners = [], isLoading, isError } = useOpsPartners();

  const [search, setSearch] = useState('');

  const partners = rawPartners as PartnerEnriched[];

  const filteredPartners = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return partners;

    return partners.filter((partner) => {
      return [
        partner.name,
        partner.type,
        partner.status,
        partner.region,
        partner.contact_email,
      ].some((value) =>
        (value ?? '').toLowerCase().includes(query),
      );
    });
  }, [partners, search]);

  const stats = useMemo(() => {
    const active = partners.filter(
      (partner) => partner.status === 'active',
    ).length;

    const suspended = partners.filter(
      (partner) => partner.status === 'suspended',
    ).length;

    const pending = partners.filter(
      (partner) => partner.status === 'pending',
    ).length;

    const totalVolume = partners.reduce(
      (total, partner) =>
        total + Number(partner.volume_processed ?? 0),
      0,
    );

    const partnersWithErrorRate = partners.filter(
      (partner) => partner.error_rate !== null,
    );

    const averageErrorRate =
      partnersWithErrorRate.length === 0
        ? 0
        : partnersWithErrorRate.reduce(
            (total, partner) =>
              total + Number(partner.error_rate ?? 0),
            0,
          ) / partnersWithErrorRate.length;

    const partnersWithLeadTime = partners.filter(
      (partner) => partner.avg_lead_time_hours !== null,
    );

    const averageLeadTime =
      partnersWithLeadTime.length === 0
        ? 0
        : partnersWithLeadTime.reduce(
            (total, partner) =>
              total + Number(partner.avg_lead_time_hours ?? 0),
            0,
          ) / partnersWithLeadTime.length;

    return {
      total: partners.length,
      active,
      suspended,
      pending,
      totalVolume,
      averageErrorRate,
      averageLeadTime,
    };
  }, [partners]);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Actif
          </Badge>
        );

      case 'suspended':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Suspendu
          </Badge>
        );

      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock3 className="h-3 w-3" />
            En attente
          </Badge>
        );

      case 'inactive':
        return (
          <Badge variant="outline">
            Inactif
          </Badge>
        );

      default:
        return (
          <Badge variant="outline">
            {formatStatus(status)}
          </Badge>
        );
    }
  };

  const getErrorRateState = (errorRate: number | null) => {
    const value = Number(errorRate ?? 0);

    if (value >= 5) {
      return {
        label: 'Élevé',
        variant: 'destructive' as const,
      };
    }

    if (value >= 2) {
      return {
        label: 'À surveiller',
        variant: 'outline' as const,
      };
    }

    return {
      label: 'Normal',
      variant: 'secondary' as const,
    };
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement des partenaires logistiques…
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4 p-6">
        <Card className="border-destructive/30">
          <CardContent className="flex items-center gap-3 py-8">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium">
                Impossible de charger les partenaires logistiques
              </p>
              <p className="text-sm text-muted-foreground">
                Vérifie la connexion à Supabase et les droits d'accès
                à la table des partenaires.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Truck className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              Partenaires logistiques
            </h1>

            <p className="text-muted-foreground">
              Supervision des transporteurs, distributeurs et partenaires
              opérationnels BIB.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Partenaires
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {stats.total}
                </p>
              </div>

              <Truck className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Actifs
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {stats.active}
                </p>
              </div>

              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Volume traité
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {stats.totalVolume.toLocaleString('fr-FR')}
                </p>
              </div>

              <PackageIcon />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Délai moyen
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {stats.averageLeadTime.toFixed(1)} h
                </p>
              </div>

              <Clock3 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary indicators */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />

            <div>
              <p className="text-sm font-medium">
                Partenaires actifs
              </p>

              <p className="text-xs text-muted-foreground">
                {stats.active} partenaire(s) opérationnel(s)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Clock3 className="h-5 w-5 text-muted-foreground" />

            <div>
              <p className="text-sm font-medium">
                En attente
              </p>

              <p className="text-xs text-muted-foreground">
                {stats.pending} partenaire(s) à traiter
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />

            <div>
              <p className="text-sm font-medium">
                Taux d'erreur moyen
              </p>

              <p className="text-xs text-muted-foreground">
                {stats.averageErrorRate.toFixed(1)} %
                {stats.suspended > 0 &&
                  ` · ${stats.suspended} suspendu(s)`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partners table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>
                Partenaires ({filteredPartners.length})
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Données issues de Supabase.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un partenaire, type, région…"
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredPartners.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
              <Truck className="mb-3 h-8 w-8 text-muted-foreground" />

              <p className="font-medium">
                {partners.length === 0
                  ? 'Aucun partenaire logistique'
                  : 'Aucun résultat'}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {partners.length === 0
                  ? 'Les partenaires logistiques apparaîtront ici lorsqu’ils seront enregistrés.'
                  : 'Modifie les critères de recherche.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partenaire</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Région</TableHead>
                    <TableHead className="text-right">
                      Volume
                    </TableHead>
                    <TableHead className="text-right">
                      Délai moyen
                    </TableHead>
                    <TableHead>
                      Taux d'erreur
                    </TableHead>
                    <TableHead>
                      Statut
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredPartners.map((partner) => {
                    const errorRate = Number(
                      partner.error_rate ?? 0,
                    );

                    const errorState =
                      getErrorRateState(partner.error_rate);

                    return (
                      <TableRow key={partner.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {partner.name}
                            </p>

                            {partner.contact_email && (
                              <p className="text-xs text-muted-foreground">
                                {partner.contact_email}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline">
                            {formatType(partner.type)}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {partner.region ?? '—'}
                        </TableCell>

                        <TableCell className="text-right font-medium">
                          {Number(
                            partner.volume_processed ?? 0,
                          ).toLocaleString('fr-FR')}
                        </TableCell>

                        <TableCell className="text-right">
                          {partner.avg_lead_time_hours !== null
                            ? `${Number(
                                partner.avg_lead_time_hours,
                              ).toFixed(1)} h`
                            : '—'}
                        </TableCell>

                        <TableCell>
                          <div className="flex min-w-[180px] items-center gap-3">
                            <Progress
                              value={Math.min(
                                errorRate * 10,
                                100,
                              )}
                              className="h-2"
                            />

                            <span className="w-12 text-right text-xs">
                              {errorRate.toFixed(1)} %
                            </span>

                            <Badge
                              variant={errorState.variant}
                              className="hidden xl:inline-flex"
                            >
                              {errorState.label}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell>
                          {getStatusBadge(partner.status)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const PackageIcon = () => (
  <div className="flex h-9 w-9 items-center justify-center">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground"
      aria-hidden="true"
    >
      <path d="m16.5 9.4-9-5.19" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  </div>
);

export default Partners;