import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ClipboardCheck, ExternalLink, FlaskConical, LockKeyhole, ShieldAlert, TestTube2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePermissions } from '@/hooks/usePermissions';

type Step = { action: string; expected: string; owner: string };
type Scenario = {
  key: string; name: string; area: string; description: string; steps: Step[];
};
const scenarios: Scenario[] = [
  {
    key: 'merchant', name: 'Boutique pilote — création et publication', area: 'Marketplace',
    description: 'Compte marchand fictif, accès à la boutique, configuration, catalogue et publication contrôlée.',
    steps: [
      { action: 'Créer un marchand de recette et une boutique test dans le projet Platform de staging', expected: 'Identité et boutique isolées des marchands réels', owner: 'Produit / Marketplace' },
      { action: 'Configurer les droits, l’abonnement de recette et les collaborateurs de boutique', expected: 'Aucune activation ni facturation réelle ; séparation entre boutiques confirmée', owner: 'Marketplace / Security' },
      { action: 'Ajouter des produits fictifs puis vérifier les étapes de publication', expected: 'Catalogue publié uniquement dans la préproduction', owner: 'Produit / Fournisseurs' },
      { action: 'Contrôler les champs visibles par un client, un marchand tiers et un invité', expected: 'Aucune donnée privée hors périmètre ; tests RLS négatifs documentés', owner: 'Security & IT' },
    ],
  },
  {
    key: 'checkout', name: 'Commande et paiement sandbox', area: 'Marketplace / Finance',
    description: 'Panier, commande, paiement Stripe test, échec, annulation et idempotence.',
    steps: [
      { action: 'Passer une commande avec le client test et le stock de recette', expected: 'Commande cohérente et aucune modification du stock réel', owner: 'Marketplace' },
      { action: 'Payer avec les moyens de test Stripe sur le backend sandbox', expected: 'Webhook de test associé à la commande test, aucune transaction live', owner: 'Finance / Engineering' },
      { action: 'Rejouer le webhook et tester les paiements refusés ou expirés', expected: 'Aucun doublon de débit de stock ni de commande', owner: 'Engineering' },
      { action: 'Inspecter les journaux et la remontée des commandes dans l’Intranet de recette', expected: 'État transport et état métier concordants, traces horodatées', owner: 'Ops / Data' },
    ],
  },
  {
    key: 'supplier', name: 'Fournisseurs et validation produit', area: 'Fournisseurs / Qualité',
    description: 'Candidature, qualification, catalogue, validation et règles de confidentialité.',
    steps: [
      { action: 'Soumettre une candidature fictive depuis Platform', expected: 'Dossier reçu une seule fois dans l’environnement Intranet de recette', owner: 'Fournisseurs' },
      { action: 'Évaluer les produits et les documents de conformité simulés', expected: 'Règles de décision et preuves conservées', owner: 'Qualité & Audit' },
      { action: 'Publier uniquement le produit approuvé dans la boutique pilote', expected: 'Aucune publication d’un produit refusé', owner: 'Fournisseurs / Produit' },
      { action: 'Tester les accès entre deux comptes fournisseurs fictifs', expected: 'Documents et données privées du fournisseur B interdits au fournisseur A', owner: 'Security & IT' },
    ],
  },
  {
    key: 'logistics', name: 'Préparation, logistique et réception', area: 'Opérations & Logistique',
    description: 'Transfert et livraison via les partenaires BIB, sans expédition directe marchand → client.',
    steps: [
      { action: 'Créer une commande sandbox éligible à la livraison simulée', expected: 'Aucune mission envoyée à un prestataire réel', owner: 'Engineering / Ops' },
      { action: 'Attribuer la mission à un partenaire logistique fictif', expected: 'Seul le partenaire affecté reçoit le minimum d’information', owner: 'Logistique' },
      { action: 'Simuler les événements de préparation, prise en charge et livraison', expected: 'Statuts cohérents côté Platform et Intranet de recette', owner: 'Logistique / Data' },
      { action: 'Rejouer l’événement de réception', expected: 'Aucun double crédit de stock ni double expédition', owner: 'Engineering' },
    ],
  },
  {
    key: 'sav', name: 'SAV, retours et remboursement', area: 'Support / Finance',
    description: 'Responsabilité du marchand, escalade encadrée et éventuelle assurance BIB.',
    steps: [
      { action: 'Déclarer un incident sur une commande fictive', expected: 'Ticket rattaché au client, marchand et à la commande de test', owner: 'Support' },
      { action: 'Vérifier le traitement prioritaire par le marchand', expected: 'Aucune substitution automatique de responsabilité juridique', owner: 'Support / Conformité' },
      { action: 'Simuler l’échéance de 48 h sans réponse et l’éligibilité à l’option assurance', expected: 'Escalade uniquement lorsque toutes les conditions contractuelles sont remplies', owner: 'Support / Engineering' },
      { action: 'Simuler un remboursement partiel puis total', expected: 'Montants cohérents, événements uniques et aucune écriture monétaire live', owner: 'Finance / Engineering' },
    ],
  },
  {
    key: 'permissions', name: 'Sécurité RLS et comptes de test', area: 'Security & IT',
    description: 'Tests négatifs sur les marchands, clients, fournisseurs, logistique et collaborateurs BIB.',
    steps: [
      { action: 'Préparer deux comptes par profil métier dans l’environnement de recette', expected: 'Comptes distincts, anonymes et sans données personnelles réelles', owner: 'Security & IT' },
      { action: 'Tester les lectures et écritures autorisées pour chaque rôle', expected: 'Les parcours fonctionnels sont utilisables dans le périmètre attendu', owner: 'Engineering / Security' },
      { action: 'Répéter les mêmes requêtes sur les données d’un autre tenant ou d’une autre boutique', expected: 'Accès refusés par les politiques serveur, pas uniquement par l’interface', owner: 'Security & IT' },
      { action: 'Contrôler les fonctions service_role, webhooks et exports vers l’Intranet', expected: 'Aucun contournement de propriété ou fuite de données dans les journaux', owner: 'Security & IT' },
    ],
  },
];

function protocol(scenario: Scenario) {
  return [
    '# Protocole de recette — ' + scenario.name,
    'État : NON EXÉCUTÉ — protocole préparatoire uniquement',
    'Périmètre : BIB Platform staging + Intranet de recette ; production interdite',
    'Préconditions : comptes et données fictifs, backend sandbox distinct, intégrations externes neutralisées, règles RLS vérifiées',
    'Références obligatoires : identité de recette, version/commit, environnement, demande produit, rapport de tests, observation, responsable, horodatage',
    '',
    ...scenario.steps.flatMap((step,index)=>[
      (index+1)+'. '+step.action,
      '   Résultat attendu : '+step.expected,
      '   Responsable : '+step.owner,
      '   Résultat observé : NON TESTÉ',
      '   Preuve : À RENSEIGNER',
      '',
    ]),
    'Décision de recette : NON DÉTERMINÉE',
    'Ne renseigner une réussite que sur preuve et validation indépendantes.',
  ].join('\n');
}

export default function ProductTestingCenter() {
  const { canViewPage } = usePermissions();
  const [selected,setSelected] = useState(scenarios[0].key);
  const scenario = useMemo(()=>scenarios.find(item=>item.key===selected) ?? scenarios[0],[selected]);
  if (!canViewPage('product.engineering')) return <p role="alert">Accès à la préparation des tests non autorisé.</p>;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(protocol(scenario));
      toast.success('Protocole non exécuté copié. Renseigner les preuves après une vraie recette.');
    } catch {
      toast.error('Copie impossible. Vérifiez les autorisations du navigateur.');
    }
  };
  return <div className="space-y-6 p-6">
    <header className="space-y-2">
      <div className="flex items-center gap-2"><FlaskConical className="h-6 w-6" /><h1 className="text-2xl font-semibold">Centre de tests & boutiques pilotes</h1></div>
      <p className="max-w-3xl text-sm text-muted-foreground">Protocoles de recette transverses pour BIB Platform et ses interactions avec BIB Intranet : boutiques fictives, commandes, fournisseurs, logistique, sécurité et SAV.</p>
      <Badge variant="outline">Protocoles prêts à documenter — aucune exécution automatique</Badge>
    </header>

    <div role="alert" className="flex items-start gap-3 rounded-lg border border-amber-500/40 p-4 text-sm">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"/>
      <div className="space-y-1">
        <strong>Environnement de recette non certifié</strong>
        <p>Cette page ne crée pas de boutique sur la plateforme et ne lance ni paiement, ni commande, ni livraison. Les simulations locales de Security & IT ne sont pas des essais de bout en bout. Avant toute exécution, vérifier la séparation des bases, secrets Stripe, intégrations et stocks test/production.</p>
      </div>
    </div>

    <div className="grid gap-3 md:grid-cols-3">
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Parcours de recette définis</p><p className="text-2xl font-semibold">{scenarios.length}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Scénarios exécutés depuis cet écran</p><p className="text-2xl font-semibold">0</p><p className="text-xs text-muted-foreground">Aucun moteur de test raccordé</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Rapports CI/CD remontés automatiquement</p><p className="text-2xl font-semibold">—</p><p className="text-xs text-muted-foreground">Connecteur à développer</p></CardContent></Card>
    </div>

    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <Card className="h-fit"><CardHeader><CardTitle className="text-base">Choisir un scénario</CardTitle></CardHeader><CardContent className="space-y-3">
        <Select value={selected} onValueChange={setSelected}><SelectTrigger aria-label="Scénario de test"><SelectValue/></SelectTrigger>
          <SelectContent>{scenarios.map(item=><SelectItem key={item.key} value={item.key}>{item.name}</SelectItem>)}</SelectContent></Select>
        <div className="space-y-2">{scenarios.map(item=><button key={item.key} type="button" onClick={()=>setSelected(item.key)}
          aria-pressed={selected===item.key}
          className={`w-full rounded-md border p-3 text-left text-sm transition-colors hover:bg-muted ${selected===item.key?'border-primary bg-muted/30':''}`}>
          <span className="font-medium">{item.name}</span><span className="mt-1 block text-xs text-muted-foreground">{item.area}</span>
        </button>)}</div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
        {scenario.name}<Badge variant="outline">Non testé</Badge></CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{scenario.description}</p>
          <div className="space-y-3">{scenario.steps.map((step,i)=><div key={step.action} className="rounded-lg border p-3 text-sm">
            <div className="flex items-start gap-2"><span className="font-semibold">{i+1}.</span><p className="font-medium">{step.action}</p></div>
            <p className="mt-2 text-xs text-muted-foreground"><CheckCircle2 className="mr-1 inline h-3 w-3"/>Attendu : {step.expected}</p>
            <p className="mt-1 text-xs text-muted-foreground">Pôle : {step.owner} · Résultat : non testé</p>
          </div>)}</div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={()=>void copy()}><ClipboardCheck className="mr-2 h-4 w-4"/>Copier le protocole</Button>
            <Button variant="outline" asChild><Link to="/pole/product/studio">Créer une demande produit <ExternalLink className="ml-2 h-4 w-4"/></Link></Button>
            <Button asChild><Link to="/pole/product/releases">Associer à une livraison <ExternalLink className="ml-2 h-4 w-4"/></Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><LockKeyhole className="h-4 w-4"/>Conditions de recette réelle</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p><strong>Produit & Engineering :</strong> prépare les comptes et boutiques fictifs en préproduction, exécute les tests et associe les preuves aux changements.</p>
        <p><strong>Security & IT :</strong> valide l’isolation des projets, les permissions RLS, les secrets et l’absence d’effets en production.</p>
        <p><strong>Pôles métier :</strong> valident chaque flux fonctionnel selon leur rôle, notamment Marketplace, Fournisseurs, Logistique, Support et Finance.</p>
        <p><strong>Qualité & Audit :</strong> vérifie les anomalies et consigne la décision de recette indépendante.</p>
        <p className="text-muted-foreground">La réussite d’un protocole doit provenir d’une exécution attestée, jamais de l’ouverture de cette page ni d’une donnée de démonstration.</p>
      </CardContent>
    </Card>
  </div>;
}
