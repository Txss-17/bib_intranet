import { Link } from 'react-router-dom';
import { ArrowUpRight, ClipboardList, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissions } from '@/hooks/usePermissions';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';

type Mode = 'compliance' | 'onboarding';
const details = {
  compliance: {
    id: 'support.compliance',
    title: 'Suivi des dossiers de conformité client',
    lead: 'Collecte des pièces, suivi des blocages et transmission au pôle Conformité & Juridique.',
    stages: ['Qualifier le compte et la pièce manquante', 'Informer le client des documents attendus', 'Transmettre au pôle Conformité si décision requise', 'Vérifier la régularisation et clôturer le suivi'],
    link: '/pole/compliance',
    linkLabel: 'Pôle Conformité & Juridique',
    notice: 'Le Support ne statue pas sur la conformité légale, ne valide pas de KYC et ne modifie pas les obligations du marchand.',
  },
  onboarding: {
    id: 'support.onboarding',
    title: 'Accompagnement et onboarding des partenaires',
    lead: 'Suivi des étapes d’intégration, résolution des blocages et coordination avec les équipes Marketplace et Fournisseurs.',
    stages: ['Identifier le compte BIB Platform', 'Qualifier les blocages de parcours', 'Orienter vers Marketplace ou Fournisseurs', 'Documenter la preuve de finalisation et le retour client'],
    link: '/pole/marketplace',
    linkLabel: 'Pôle Marketplace',
    notice: 'Ce suivi ne crée pas directement de compte sur BIB Platform et ne remplace pas les vérifications métier.',
  },
};
export default function SupportCoordinationPage({ mode }: { mode: Mode }) {
  const d = details[mode];
  const { canViewPage } = usePermissions();
  if (!canViewPage(d.id)) return <p role="alert">Accès à ce suivi non autorisé.</p>;
  return <div className="space-y-6">
    <header>
      <h1 className="flex items-center gap-2 text-2xl font-semibold">
        {mode === 'compliance' ? <ShieldCheck className="h-6 w-6" /> : <ClipboardList className="h-6 w-6" />}
        {d.title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{d.lead}</p>
    </header>
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card><CardHeader><CardTitle className="text-base">Étapes de prise en charge</CardTitle></CardHeader>
        <CardContent><ol className="space-y-3 text-sm">
          {d.stages.map((step, index) => <li key={step} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs">{index + 1}</span>{step}
          </li>)}
        </ol></CardContent>
      </Card>
      <Card><CardHeader><CardTitle className="text-base">Coordination et responsabilités</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">{d.notice}</p>
          <Link to={d.link} className="inline-flex items-center gap-1 text-primary hover:underline">
            {d.linkLabel}<ArrowUpRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
    <ModuleWorkspace pageId={d.id} />
  </div>;
}
