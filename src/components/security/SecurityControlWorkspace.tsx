import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, ClipboardCheck, FileCheck2, LockKeyhole, ServerCog } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIntranetRecords } from '@/hooks/useIntranetRecords';
import { usePermissions } from '@/hooks/usePermissions';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';

type ControlKind = 'infrastructure' | 'environments' | 'vpn' | 'code' | 'console' | 'documentation';

const definitions: Record<ControlKind, {
  pageId: string;
  title: string;
  purpose: string;
  checks: readonly string[];
  sourceLinks: readonly { label: string; to: string }[];
  warning: string;
}> = {
  infrastructure: {
    pageId: 'security.infrastructure',
    title: 'Infrastructure & continuité',
    purpose: 'Inventaire des systèmes, responsabilités, sauvegardes, restauration et mesures de durcissement.',
    checks: ['Identifier le service et son propriétaire', 'Documenter sauvegarde, rétention et dépendances', 'Renseigner la preuve du dernier test de restauration', 'Fixer la prochaine revue et faire valider le plan'],
    sourceLinks: [{ label: 'Supervision technique', to: '/pole/security/supervision' }, { label: 'Journaux', to: '/pole/security/logs' }],
    warning: 'L’enregistrement de ce contrôle ne configure pas un hébergement, une sauvegarde ou un pare-feu.',
  },
  environments: {
    pageId: 'security.environments',
    title: 'Environnements & déploiements',
    purpose: 'Changements contrôlés entre développement, préproduction et production, avec vérifications et retour arrière.',
    checks: ['Référencer la version ou le commit', 'Distinguer préproduction et production', 'Conserver les résultats des tests et l’autorisation', 'Décrire le plan de rollback avant intervention'],
    sourceLinks: [{ label: 'Revue de code', to: '/pole/security/code' }, { label: 'Supervision', to: '/pole/security/supervision' }],
    warning: 'Une décision approuvée dans l’Intranet ne déclenche pas automatiquement un déploiement.',
  },
  vpn: {
    pageId: 'security.vpn',
    title: 'Accès réseau & VPN',
    purpose: 'Demandes temporaires d’accès réseau avec bénéficiaire, motif, validation, expiration et révocation.',
    checks: ['Vérifier l’identité et le besoin métier', 'Limiter la ressource, la durée et le périmètre', 'Conserver l’autorisation indépendante', 'Prouver la révocation ou le renouvellement'],
    sourceLinks: [{ label: 'Annuaire des identités', to: '/pole/security/access' }, { label: 'Journaux de sécurité', to: '/pole/security/logs' }],
    warning: 'Cette revue ne crée pas de tunnel VPN ni d’autorisation réseau sans intégration technique validée.',
  },
  code: {
    pageId: 'security.code',
    title: 'Code & sécurité applicative',
    purpose: 'Revue des commits, dépendances, contrôles de secrets, résultats CI et autorisations de livraison.',
    checks: ['Identifier le dépôt, le commit et le changement', 'Vérifier revue des dépendances et détection de secrets', 'Conserver les résultats des contrôles CI', 'Documenter les régressions et mesures de correction'],
    sourceLinks: [{ label: 'Environnements', to: '/pole/security/environments' }, { label: 'Documentation', to: '/pole/security/documentation' }],
    warning: 'Ce registre documente une revue. Il ne vaut pas exécution d’un pipeline CI ni fusion de code.',
  },
  console: {
    pageId: 'security.console',
    title: 'Interventions techniques sensibles',
    purpose: 'Encadrement des changements exceptionnels : justification, intervenant, autorisation, preuve et rollback.',
    checks: ['Référencer le ticket de changement et l’opérateur', 'Définir la procédure et les limites', 'Obtenir une approbation préalable indépendante', 'Archiver preuve d’exécution et contrôle post-intervention'],
    sourceLinks: [{ label: 'Environnements', to: '/pole/security/environments' }, { label: 'Alertes', to: '/pole/security/security' }],
    warning: 'Aucune commande ou opération privilégiée n’est exécutée directement depuis cette fiche.',
  },
  documentation: {
    pageId: 'security.documentation',
    title: 'Documentation et runbooks',
    purpose: 'Maintenir les procédures opérationnelles versionnées, leurs propriétaires et leur niveau de confidentialité.',
    checks: ['Identifier la version et le service concerné', 'Utiliser une référence Drive BIB ou un dépôt autorisé', 'Préciser lecteur, mainteneur et relecteur', 'Planifier la revue et documenter ses preuves'],
    sourceLinks: [{ label: 'Infrastructure', to: '/pole/security/infrastructure' }, { label: 'Flux de données', to: '/pole/security/dataflow' }],
    warning: 'La fiche renvoie vers un document contrôlé ; elle ne déverrouille pas les documents Drive non autorisés.',
  },
};

export default function SecurityControlWorkspace({ kind }: { kind: ControlKind }) {
  const d = definitions[kind];
  const { canViewPage } = usePermissions();
  const query = useIntranetRecords(d.pageId, '', 'open', 0);
  if (!canViewPage(d.pageId)) return <p role="alert">Accès à cette section non autorisé.</p>;

  return <div className="space-y-6">
    <header className="space-y-2">
      <div className="flex items-center gap-2">
        <ServerCog className="h-6 w-6 text-primary" aria-hidden />
        <h1 className="text-2xl font-semibold">{d.title}</h1>
      </div>
      <p className="max-w-3xl text-sm text-muted-foreground">{d.purpose}</p>
    </header>
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-4 w-4" /> Vérifications du contrôle</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {d.checks.map((step, index) => <li key={step} className="flex items-start gap-3 text-sm">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs">{index + 1}</span>
              {step}
            </li>)}
          </ol>
          <p className="mt-4 flex items-start gap-2 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
            <LockKeyhole className="h-4 w-4 shrink-0" aria-hidden />
            {d.warning}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileCheck2 className="h-4 w-4" /> Périmètre et preuves</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground">Dossiers actifs de la section</p>
            <p className="text-2xl font-semibold">{query.isLoading || query.isError ? '—' : query.data?.stats.total ?? 0}</p>
            {query.isError && <p role="alert" className="mt-1 text-xs text-destructive">
              Registre indisponible. <button className="underline" onClick={() => void query.refetch()}>Réessayer</button>
            </p>}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sources de vérification</p>
            {d.sourceLinks.map((link) => <Link key={link.to} to={link.to} className="flex items-center justify-between rounded border p-2 text-sm hover:bg-muted">
              {link.label}<ArrowUpRight className="h-4 w-4" />
            </Link>)}
          </div>
          <Badge variant="outline" className="gap-1"><AlertTriangle className="h-3 w-3" /> Validation avec preuve requise</Badge>
        </CardContent>
      </Card>
    </div>
    <section aria-label="Dossiers et décisions de contrôle" className="space-y-2">
      <div className="border-b pb-2">
        <h2 className="text-lg font-semibold">Registre de contrôle et décisions</h2>
        <p className="text-sm text-muted-foreground">Créer une revue, affecter le responsable, joindre les preuves Drive BIB et demander les validations.</p>
      </div>
      <ModuleWorkspace pageId={d.pageId} />
    </section>
  </div>;
}
