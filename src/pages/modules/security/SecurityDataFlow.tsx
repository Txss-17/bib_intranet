import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSecurityBridgeRuns, readableDate } from '@/hooks/useSecurityOperations';
import { usePermissions } from '@/hooks/usePermissions';
import {
  ArrowRight,
  Server,
  Globe,
  Database,
  Lock,
  ShieldCheck,
  Network,
} from 'lucide-react';

interface DataFlow {
  from: string;
  to: string;
  via: string;
  description: string;
  icon: typeof Globe;
}

const FLOWS: DataFlow[] = [
  {
    from: 'BIB Platform',
    to: 'Base Supabase Platform',
    via: 'Authentification et RLS Platform',
    description: 'Marchands, boutiques, clients, produits et commandes : Platform reste la source de vérité.',
    icon: Globe,
  },
  {
    from: 'Base Supabase Platform',
    to: 'Bridge serveur privé',
    via: 'intranet-export / intranet-import',
    description: 'Échange des projections autorisées par des fonctions serveur, sans accès direct du navigateur aux données privées.',
    icon: Server,
  },
  {
    from: 'Bridge serveur privé',
    to: 'Base Supabase Intranet',
    via: 'platform-bridge',
    description: 'Rapprochement des identifiants, versions, contrôles métier et journalisation des synchronisations.',
    icon: Database,
  },
  {
    from: 'Base Supabase Intranet',
    to: 'BIB Intranet',
    via: 'Autorisations Connect et RLS',
    description: 'Consultation et actions internes selon les habilitations et les responsabilités de chaque pôle.',
    icon: Lock,
  },
];

const PUBLIC_ZONE = [
  'BIB Platform et ses espaces marchands, clients et partenaires',
  'Authentification et permissions propres à Platform',
  'Données commerciales stockées dans la base Supabase Platform',
];

const INTERNAL_ZONE = [
  'BIB Intranet et ses collaborateurs autorisés',
  'Base Supabase Intranet distincte de la base Platform',
  'Fonctions serveur du bridge avec secrets non exposés',
  'Dossiers, documents et opérations sensibles par droits de pôle',
];

const SECURITY_CONTROLS = [
  {
    title: 'RLS',
    description: 'Les politiques de chaque base limitent les lectures et écritures au périmètre métier autorisé.',
  },
  {
    title: 'Deux bases distinctes',
    description: 'Les données Platform et Intranet sont stockées séparément ; le bridge échange des projections contrôlées.',
  },
  {
    title: 'Secret serveur',
    description: 'Les transferts privilégiés passent par les fonctions serveur. Aucun secret du bridge ne doit être exposé au navigateur.',
  },
  {
    title: 'Intégrité et reprise',
    description: 'Le rapprochement repose sur les UUID, les versions, la gestion des conflits et la journalisation des exécutions.',
  },
];

export default function SecurityDataFlow() {
  const { canViewPage } = usePermissions();
  const bridge = useSecurityBridgeRuns();
  if (!canViewPage('security.dataflow')) return <p role="alert">Accès aux flux de données non autorisé.</p>;
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
        <strong>Architecture cible, non certification de déploiement.</strong>
        <p className="mt-1 text-muted-foreground">Ce schéma décrit les frontières de confiance attendues entre BIB Platform, BIB Intranet et Audit Hub. Les liaisons, politiques RLS et sauvegardes doivent être vérifiées avec des tests d'intégration et les journaux d'exécution.</p>
      </div>
      <div className="rounded-lg border p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium">Échanges Platform enregistrés</h2>
          <Button variant="outline" size="sm" onClick={() => void bridge.refetch()} disabled={bridge.isFetching}>Actualiser</Button>
        </div>
        {bridge.isLoading && <p role="status" className="mt-2 text-muted-foreground">Chargement des échanges…</p>}
        {bridge.isError && <p role="alert" className="mt-2 text-destructive">Source de synchronisation indisponible.</p>}
        {!bridge.isLoading && !bridge.isError && <div className="mt-2 flex flex-wrap gap-4">
          <p>{bridge.data?.length ?? 0} exécution(s) enregistrée(s) dans la fenêtre de 100</p>
          <p>En erreur : {(bridge.data ?? []).filter(row => ['error', 'failed', 'failure'].includes(row.status.toLowerCase())).length}</p>
          <p>Dernière exécution : {readableDate(bridge.data?.[0]?.started_at)}</p>
        </div>}
        <p className="mt-2 text-xs text-muted-foreground">Les journaux n'établissent ni l'exhaustivité de la synchronisation ni l'exactitude du contrat d'API.</p>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <Network className="h-7 w-7" />

          <h1 className="text-3xl font-bold">
            Flux de données
          </h1>
        </div>

        <p className="mt-1 text-muted-foreground">
          Cartographie technique entre deux bases distinctes. Cette page décrit l'architecture ; elle n'est pas une surveillance en temps réel.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flux applicatifs</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {FLOWS.map((flow) => {
              const Icon = flow.icon;

              return (
                <div
                  key={`${flow.from}-${flow.to}`}
                  className="rounded-lg border p-4"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <Icon className="h-6 w-6 text-muted-foreground" />

                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                      <span className="font-medium text-sm">
                        {flow.from}
                      </span>

                      <ArrowRight className="h-4 w-4 text-muted-foreground" />

                      <span className="font-medium text-sm">
                        {flow.to}
                      </span>
                    </div>

                    <Badge
                      variant="outline"
                      className="font-mono text-xs"
                    >
                      {flow.via}
                    </Badge>
                  </div>

                  <p className="mt-3 pl-10 text-xs text-muted-foreground">
                    {flow.description}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Zone publique
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            {PUBLIC_ZONE.map((item) => (
              <div
                key={item}
                className="flex items-start gap-2"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
                <span>{item}</span>
              </div>
            ))}

            <div className="border-t pt-3 text-xs text-muted-foreground">
              Les données exposées à cette zone doivent rester limitées
              au périmètre fonctionnel nécessaire.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Zone interne
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            {INTERNAL_ZONE.map((item) => (
              <div
                key={item}
                className="flex items-start gap-2"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
                <span>{item}</span>
              </div>
            ))}

            <div className="border-t pt-3 text-xs text-muted-foreground">
              Les données internes et sensibles sont soumises aux
              contrôles d’authentification, d’autorisation et de
              segmentation applicative.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Contrôles de sécurité
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {SECURITY_CONTROLS.map((control) => (
              <div
                key={control.title}
                className="rounded-lg border p-4"
              >
                <div className="mb-1 flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />

                  <h3 className="font-medium">
                    {control.title}
                  </h3>
                </div>

                <p className="text-sm text-muted-foreground">
                  {control.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}