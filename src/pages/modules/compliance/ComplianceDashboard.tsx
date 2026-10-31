import { Link } from 'react-router-dom';
import { ArrowUpRight, FileSignature, Scale, ScrollText, ShieldAlert, Gavel, Building2, LockKeyhole } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';

type Section = { label: string; id: string; path: string; icon: LucideIcon; description: string; };
const groups: Array<{ title: string; intro: string; pages: Section[] }> = [
  {
    title: '1. Cadre juridique & obligations',
    intro: 'Structurer les engagements, les obligations applicables et la diffusion des règles internes.',
    pages: [
      { label: 'Contrats & conventions', id: 'compliance.contracts', path: '/pole/compliance/contracts', icon: FileSignature, description: 'Contrats marchands, partenaires, fournisseurs, prestataires et suivi des échéances' },
      { label: 'Politiques & procédures', id: 'compliance.policies', path: '/pole/compliance/policies', icon: ScrollText, description: 'Règles internes, version, entrée en vigueur et publication contrôlée' },
    ],
  },
  {
    title: '2. Litiges & maîtrise des risques',
    intro: 'Suivre les contestations, évaluer les risques et formaliser les décisions et mesures correctives.',
    pages: [
      { label: 'Litiges & précontentieux', id: 'compliance.disputes', path: '/pole/compliance/disputes', icon: Gavel, description: 'Responsabilités, parties concernées, preuves, négociation et résolution validée' },
      { label: 'Registre des risques', id: 'compliance.risks', path: '/pole/compliance/risks', icon: ShieldAlert, description: 'Risques contractuels, réglementaires, probabilité, impact et mesures de maîtrise' },
    ],
  },
];

export default function ComplianceDashboard() {
  const { canViewPage } = usePermissions();
  return <div className="space-y-6">
    <header className="space-y-2">
      <div className="flex items-center gap-2"><Scale className="h-6 w-6"/><h1 className="text-2xl font-semibold">Conformité & Juridique</h1></div>
      <p className="max-w-3xl text-sm text-muted-foreground">Gouvernance des obligations légales, contrats et engagements de BIB, gestion des litiges et prévention des risques. Chaque dossier doit être rattaché à la bonne entité juridique.</p>
    </header>
    <div role="note" className="rounded-lg border border-amber-500/40 p-4 text-sm">
      Les fonctions génériques de dossiers et les procédures spécialisées de gestion des litiges
      ne sont pas confirmées opérationnelles sur la base actuelle. Les accords signés, habilitations
      et validations doivent être vérifiés dans leurs systèmes de référence ; une fiche validée n'est
      ni une signature contractuelle, ni un jugement, ni une conformité attestée.
    </div>
    {groups.map(group => {
      const visible=group.pages.filter(page=>canViewPage(page.id));
      if (!visible.length) return null;
      return <section className="space-y-3" key={group.title}>
        <div><h2 className="text-lg font-semibold">{group.title}</h2>
          <p className="text-sm text-muted-foreground">{group.intro}</p></div>
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map(page=>{
            const Icon=page.icon;
            return <Card key={page.path}><CardHeader><CardTitle className="flex items-center gap-2 text-base">
              <Icon className="h-4 w-4"/>{page.label}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{page.description}</p>
                <Button asChild size="sm" variant="outline"><Link to={page.path}>Ouvrir <ArrowUpRight className="ml-2 h-4 w-4"/></Link></Button>
              </CardContent></Card>;
          })}
        </div>
      </section>;
    })}
    <Card><CardHeader><CardTitle className="text-base">Gouvernance des responsabilités</CardTitle></CardHeader>
      <CardContent className="grid gap-3 text-sm md:grid-cols-2">
        <p><Building2 className="mr-2 inline h-4 w-4"/><strong>Groupe et filiales :</strong> chaque contrat, litige ou obligation relève de l'entité concernée. Les accès groupe doivent être explicitement habilités.</p>
        <p><LockKeyhole className="mr-2 inline h-4 w-4"/><strong>Confidentialité :</strong> privilèges de lecture et d'édition limités aux personnes autorisées, y compris pour les pièces sensibles.</p>
        <p><strong>Marchands BIB Platform :</strong> vendeurs juridiques des commandes, avec leurs obligations propres ; BIB intervient selon son contrat et son rôle.</p>
        <p><strong>Qualité, Audit et Security & IT :</strong> contrôles et recommandations ; l'arbitrage juridique demeure du ressort du pôle responsable ou du conseil compétent.</p>
      </CardContent>
    </Card>
  </div>;
}
