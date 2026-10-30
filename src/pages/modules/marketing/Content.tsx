import { Link } from 'react-router-dom';
import { FileText, CalendarDays, ShieldCheck } from 'lucide-react';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';
export default function Content() {
  return <div className="space-y-5">
    <header>
      <h1 className="flex items-center gap-2 text-2xl font-semibold"><FileText className="h-6 w-6" />Production éditoriale BIB</h1>
      <p className="mt-1 text-sm text-muted-foreground">Briefs, contenus, canaux, déclinaisons et droits médias. Cette section prépare et valide les publications, contrairement au suivi budgétaire des <Link className="underline" to="/pole/marketing/campaigns">campagnes</Link>.</p>
    </header>
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border p-4 text-sm"><CalendarDays className="mb-2 h-5 w-5" /><strong>Calendrier éditorial</strong><p className="mt-1 text-muted-foreground">Planifier une diffusion, le canal et l'audience du contenu dans le dossier ci-dessous.</p></div>
      <div className="rounded-lg border p-4 text-sm"><ShieldCheck className="mb-2 h-5 w-5" /><strong>Validation et droits</strong><p className="mt-1 text-muted-foreground">Joindre les preuves de droits médias et obtenir l'autorisation avant toute publication externe.</p></div>
    </div>
    <ModuleWorkspace pageId="marketing.content" />
  </div>;
}
