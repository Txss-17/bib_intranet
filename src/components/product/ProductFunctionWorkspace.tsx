import { Link } from 'react-router-dom';
import { ArrowUpRight, Code2, Layers3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissions } from '@/hooks/usePermissions';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';

type Area = 'product' | 'engineering';
const config = {
  product: {
    id: 'product.product',
    title: 'Gestion du produit BIB',
    description: 'Besoins utilisateur, cahiers des charges, critères d’acceptation et décisions sur les parcours de BIB Platform et de l’Intranet.',
    checks: ['Besoin utilisateur et périmètre', 'Critères d’acceptation mesurables', 'Dépendances Marketplace, Fournisseurs ou Logistique', 'Revue fonctionnelle et preuve de recette'],
    related: [
      { to: '/pole/product/roadmap', label: 'Roadmap produit' },
      { to: '/pole/product/backlog', label: 'Backlog priorisé' },
      { to: '/pole/product/frictions', label: 'Frictions produit' },
    ],
    caution: 'Une spécification validée n’équivaut pas à une fonctionnalité déployée sur BIB Platform.',
  },
  engineering: {
    id: 'product.engineering',
    title: 'Engineering & livraison',
    description: 'Implémentation, contrats techniques, qualité logicielle et suivi de la livraison des évolutions de BIB Platform, de l’Intranet et d’Audit Hub.',
    checks: ['Référence du changement et dépendances techniques', 'Tests unitaires, intégration et régression', 'Validation des droits serveur et de la sécurité', 'Préproduction, vérification et stratégie de rollback'],
    related: [
      { to: '/pole/product/integrations', label: 'Contrats d’intégration' },
      { to: '/pole/security/code', label: 'Revue sécurité du code' },
      { to: '/pole/security/environments', label: 'Contrôles de déploiement' },
    ],
    caution: 'La validation d’un dossier Engineering n’exécute pas un déploiement et ne modifie pas les bases de production.',
  },
};

export default function ProductFunctionWorkspace({ area }: { area: Area }) {
  const c = config[area];
  const { canViewPage } = usePermissions();
  if (!canViewPage(c.id)) return <p role="alert">Accès à ce module non autorisé.</p>;
  return <div className="space-y-6">
    <header className="space-y-2">
      <h1 className="flex items-center gap-2 text-2xl font-semibold">
        {area === 'product' ? <Layers3 className="h-6 w-6" /> : <Code2 className="h-6 w-6" />}
        {c.title}
      </h1>
      <p className="max-w-3xl text-sm text-muted-foreground">{c.description}</p>
    </header>
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader><CardTitle className="text-base">{area === 'product' ? 'Cycle de définition produit' : 'Cycle de livraison logicielle'}</CardTitle></CardHeader>
        <CardContent><ol className="space-y-3 text-sm">
          {c.checks.map((item, index) => <li key={item} className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs">{index + 1}</span>
            {item}
          </li>)}
        </ol></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Dossiers connexes</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {c.related.map((item) => <Link key={item.to} to={item.to}
            className="flex items-center justify-between rounded-md border p-2 text-sm hover:bg-muted">
            {item.label}<ArrowUpRight className="h-4 w-4" /></Link>)}
          <p className="pt-2 text-xs text-muted-foreground">{c.caution}</p>
        </CardContent>
      </Card>
    </div>
    <ModuleWorkspace pageId={c.id} />
  </div>;
}
