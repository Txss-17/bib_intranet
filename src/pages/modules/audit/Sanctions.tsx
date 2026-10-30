import { Link } from 'react-router-dom';
import { Scale, ShieldAlert, FileCheck2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';
import { usePermissions } from '@/hooks/usePermissions';

export default function Sanctions() {
  const { canViewPage } = usePermissions();
  if (!canViewPage('audit.sanctions')) return <p role="alert">Accès refusé au suivi des propositions de sanctions.</p>;
  return <div className="space-y-6">
    <header>
      <h1 className="flex items-center gap-2 text-2xl font-semibold"><Scale className="h-6 w-6" />Propositions de sanctions</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Instruction contradictoire des manquements, étude de proportionnalité et validation par une autorité habilitée.
        Cette section ne prononce ni n’exécute automatiquement de sanction sur BIB Platform.
      </p>
    </header>
    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldAlert className="h-4 w-4" />Établir les faits</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Référence du constat, identité de l'entité, preuves datées, manquement contractuel et droits de réponse.</CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Scale className="h-4 w-4" />Évaluer la mesure</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Base juridique, gravité, proportionnalité, recours possible et contrôle indépendant de la proposition.</CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileCheck2 className="h-4 w-4" />Soumettre à décision</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Dossier motivé transmis à l'autorité compétente. Vérifier avec le <Link className="underline" to="/pole/compliance/disputes">pôle Conformité</Link> avant toute exécution externe.</CardContent></Card>
    </div>
    <ModuleWorkspace pageId="audit.sanctions" />
  </div>;
}
