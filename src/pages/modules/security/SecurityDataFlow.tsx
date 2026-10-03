import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    to: 'Backend partagé',
    via: 'app_origin: platform',
    description:
      'Échanges entre les interfaces publiques de la plateforme et les services backend.',
    icon: Globe,
  },
  {
    from: 'BIB Intranet',
    to: 'Backend partagé',
    via: 'app_origin: intranet',
    description:
      'Accès interne aux services métier et aux données opérationnelles.',
    icon: Lock,
  },
  {
    from: 'Edge Functions',
    to: 'Tables Supabase',
    via: 'service_role + RLS',
    description:
      'Traitement serveur contrôlé avec application des politiques de sécurité.',
    icon: Server,
  },
  {
    from: 'Site public',
    to: 'Services externes',
    via: 'API Gateway',
    description:
      'Transmission contrôlée des données issues des formulaires et intégrations publiques.',
    icon: Globe,
  },
];

const PUBLIC_ZONE = [
  'Site public et pages marketing',
  'BIB Platform',
  'Interfaces destinées aux clients, boutiques et fournisseurs',
  'API Gateway pour les échanges publics',
];

const INTERNAL_ZONE = [
  'BIB Intranet',
  'Services backend internes',
  'Edge Functions à privilèges contrôlés',
  'Accès aux données sensibles selon les droits attribués',
];

const SECURITY_CONTROLS = [
  {
    title: 'RLS',
    description:
      'Les politiques Row Level Security limitent l’accès aux données selon le contexte autorisé.',
  },
  {
    title: 'Origine applicative',
    description:
      'Les flux peuvent être distingués selon leur origine applicative afin de séparer les usages publics et internes.',
  },
  {
    title: 'Contrôle des privilèges',
    description:
      'Les opérations sensibles sont exécutées côté serveur avec des privilèges explicitement contrôlés.',
  },
  {
    title: 'Segmentation',
    description:
      'Les zones publiques, internes et les services backend sont traités comme des périmètres distincts.',
  },
];

export default function SecurityDataFlow() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Network className="h-7 w-7" />

          <h1 className="text-3xl font-bold">
            Flux de données
          </h1>
        </div>

        <p className="mt-1 text-muted-foreground">
          Supervision des échanges entre BIB Platform, BIB Intranet,
          les services backend et les zones externes.
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