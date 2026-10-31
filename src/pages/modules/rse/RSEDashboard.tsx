import { Link } from 'react-router-dom';
import { ArrowUpRight, BarChart3, Cloud, Leaf, Package, Recycle, Star, Truck, AlertTriangle, FileCheck2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';

type Entry = { label: string; id: string; route: string; icon: LucideIcon; detail: string; };
const sections: Array<{ title: string; detail: string; links: Entry[] }> = [
  {
    title: '1. Emballages & circularité',
    detail: 'Définir les exigences, qualifier les matériaux et suivre les filières partenaires.',
    links: [
      { label: 'Emballages et conformité', id: 'rse.packaging', route: '/pole/rse/packaging', icon: Package, detail: 'Matériaux, preuves, certification, fournisseur et décision' },
      { label: 'Recyclage & traçabilité', id: 'rse.recycling', route: '/pole/rse/recycling', icon: Recycle, detail: 'Collecte, pesées, destinations, justificatifs et limites de mesure' },
    ],
  },
  {
    title: '2. Mesures d’impact & reporting',
    detail: 'Documenter les sources, les périmètres, les méthodes et les décisions avant toute publication.',
    links: [
      { label: 'Impact CO₂', id: 'rse.co2', route: '/pole/rse/co2', icon: Cloud, detail: 'Méthodes, facteurs d’émission, hypothèses et incertitudes' },
      { label: 'Reporting ESG', id: 'rse.esg', route: '/pole/rse/esg', icon: BarChart3, detail: 'Indicateurs, qualité des données, limites et contrôles de publication' },
    ],
  },
  {
    title: '3. Programmes circulaires & amélioration',
    detail: 'Expérimenter sans annoncer de récompenses ou d’impacts non mesurés.',
    links: [
      { label: 'Points clients — pilote', id: 'rse.points', route: '/pole/rse/points', icon: Star, detail: 'Conditions de lancement, anti-fraude et dépendance à BIB Platform' },
    ],
  },
];

export default function RSEDashboard() {
  const { canViewPage } = usePermissions();
  return <div className="space-y-6">
    <header className="space-y-2">
      <div className="flex items-center gap-2"><Leaf className="h-6 w-6"/><h1 className="text-2xl font-semibold">RSE & Impact</h1></div>
      <p className="max-w-3xl text-sm text-muted-foreground">
        Pilotage des emballages responsables, de la circularité, des émissions et des engagements ESG de BIB.
        Les déclarations doivent distinguer données constatées, estimations et hypothèses.
      </p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Traçabilité et preuves</Badge>
        <Badge variant="secondary">Points clients : pilote non activé</Badge>
      </div>
    </header>
    <div role="note" className="flex items-start gap-3 rounded-lg border border-amber-500/40 p-4 text-sm">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"/>
      <p>Les registres RSE utilisent le backend générique de dossiers Intranet, dont les fonctions serveur
        restent à raccorder. Aucun chiffre environnemental n’est calculé ici et aucun programme client
        n’est activé par la seule validation d’un dossier. Les preuves, unités et périodes doivent être
        vérifiées avant toute consolidation ou communication externe.</p>
    </div>

    {sections.map(section => {
      const visible = section.links.filter(entry => canViewPage(entry.id));
      if (!visible.length) return null;
      return <section key={section.title} className="space-y-3">
        <div><h2 className="text-lg font-semibold">{section.title}</h2>
          <p className="text-sm text-muted-foreground">{section.detail}</p></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map(entry => {
            const Icon = entry.icon;
            return <Card key={entry.route}><CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><Icon className="h-4 w-4"/>{entry.label}</CardTitle>
            </CardHeader><CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{entry.detail}</p>
              <Button asChild variant="outline" size="sm"><Link to={entry.route}>
                Ouvrir <ArrowUpRight className="ml-2 h-4 w-4"/>
              </Link></Button>
            </CardContent></Card>;
          })}
        </div>
      </section>;
    })}

    <Card><CardHeader><CardTitle className="text-base">Coordination inter-pôles</CardTitle></CardHeader>
      <CardContent className="grid gap-3 text-sm md:grid-cols-2">
        <div><p className="flex items-center gap-2 font-medium"><Truck className="h-4 w-4"/>Opérations & Logistique</p><p className="text-muted-foreground">Preuves des emballages, flux de collecte, transport et traitement réel.</p></div>
        <div><p className="flex items-center gap-2 font-medium"><FileCheck2 className="h-4 w-4"/>Qualité & Audit</p><p className="text-muted-foreground">Contrôle des justificatifs, anomalies et écarts de conformité.</p></div>
        <div><p className="flex items-center gap-2 font-medium"><BarChart3 className="h-4 w-4"/>Data & BI</p><p className="text-muted-foreground">Consolidation d’indicateurs compatibles et qualité des données.</p></div>
        <div><p className="flex items-center gap-2 font-medium"><Star className="h-4 w-4"/>Produit & Engineering</p><p className="text-muted-foreground">Fonctionnalités de collecte, intégrations et points clients seulement après validation.</p></div>
      </CardContent>
    </Card>
  </div>;
}
