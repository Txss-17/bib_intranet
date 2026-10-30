import { Link } from 'react-router-dom';
import { Leaf, Calculator, FileCheck2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';
import { usePermissions } from '@/hooks/usePermissions';

export default function CO2Impact() {
  const { canViewPage } = usePermissions();
  if (!canViewPage('rse.co2')) return <p role="alert">Accès non autorisé aux mesures d'impact.</p>;
  return <div className="space-y-6">
    <header>
      <h1 className="flex items-center gap-2 text-2xl font-semibold"><Leaf className="h-6 w-6" />Mesures d’impact CO₂</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Estimations documentées des émissions liées aux expéditions, emballages et opérations de BIB.
        Une valeur sans unité, méthode, source et périmètre n'est pas une mesure validée.
      </p>
    </header>
    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Calculator className="h-4 w-4" />Méthode</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Définir l'activité, la quantité, le facteur d'émission vérifiable et ses hypothèses avant le calcul.</CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileCheck2 className="h-4 w-4" />Traçabilité</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Indiquer la source, la période, le périmètre (scopes), les incertitudes et les exclusions.</CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Leaf className="h-4 w-4" />Consolidation</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Les données hétérogènes ne doivent pas être additionnées sans conversion ni méthode. Voir le <Link className="underline" to="/pole/rse/esg">reporting ESG</Link> pour les indicateurs publiables.</CardContent></Card>
    </div>
    <p className="rounded-lg border p-3 text-xs text-muted-foreground">
      Ce registre consigne des estimations et preuves. Aucune mesure automatique d'émission de BIB Platform n'est supposée active.
    </p>
    <ModuleWorkspace pageId="rse.co2" />
  </div>;
}
