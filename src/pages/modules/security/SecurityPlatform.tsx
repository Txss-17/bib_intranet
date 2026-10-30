import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Database, ExternalLink, LockKeyhole, ShieldCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';

type Actor = {
  name: string; identity: string; owned: string; forbidden: string; check: string;
};
const actors: Actor[] = [
  {
    name: 'Marchand', identity: 'Propriétaire ou membre habilité de boutique',
    owned: 'Ses boutiques, commandes et opérations autorisées',
    forbidden: 'Données privées des autres boutiques et profils clients non concernés',
    check: 'boutiques · boutique_members · orders',
  },
  {
    name: 'Client final', identity: 'Compte client authentifié ou parcours public borné',
    owned: 'Son profil, ses commandes rattachées, son SAV',
    forbidden: 'Commandes d’autrui, marges et données internes marchands',
    check: 'customer_profiles · orders · order_issues',
  },
  {
    name: 'Fournisseur', identity: 'Compte fournisseur et convention d’accès',
    owned: 'Ses produits, dossiers et actions expressément attribués',
    forbidden: 'Identités d’autres fournisseurs et données commerciales non autorisées',
    check: 'supplier_products · partner_onboarding_submissions',
  },
  {
    name: 'Logistique', identity: 'Partenaire opérationnel et mission attribuée',
    owned: 'Uniquement les expéditions, adresses minimales et événements nécessaires à la mission',
    forbidden: 'Commandes non affectées, prix et données personnelles superflues',
    check: 'order_shipments · shipment_events · order_shipping_addresses',
  },
  {
    name: 'Personnel BIB', identity: 'Identité professionnelle et habilitation interne',
    owned: 'Interventions autorisées et journaux nécessaires à la fonction',
    forbidden: 'Accès direct universel aux données Platform par simple appartenance à l’Intranet',
    check: 'Ponts Platform / Intranet · service roles · audit',
  },
];

const observed = [
  { table: 'profiles', policies: 3, domain: 'Identités Platform' },
  { table: 'customer_profiles', policies: 3, domain: 'Profil client' },
  { table: 'boutiques', policies: 5, domain: 'Boutiques marchandes' },
  { table: 'boutique_members', policies: 2, domain: 'Collaborateurs marchands' },
  { table: 'orders', policies: 5, domain: 'Commandes' },
  { table: 'order_shipments', policies: 1, domain: 'Expéditions' },
  { table: 'supplier_products', policies: 1, domain: 'Produits fournisseurs' },
  { table: 'partner_onboarding_submissions', policies: 3, domain: 'Candidatures partenaires' },
  { table: 'payments', policies: 1, domain: 'Paiements' },
  { table: 'order_refunds', policies: 0, domain: 'Remboursements' },
  { table: 'order_shipping_addresses', policies: 0, domain: 'Adresses de livraison' },
];
const checkpoints = [
  { title: 'Isolation multi-boutique', description: 'Marchand A ne lit ni ne modifie la boutique, les commandes ou les documents du marchand B.' },
  { title: 'Propriété des données clients', description: 'Un client ne lit que ses propres commandes, adresses, remboursements et tickets liés.' },
  { title: 'Périmètre fournisseur', description: 'Les produits publics et les données contractuelles privées restent séparés.' },
  { title: 'Mission logistique', description: 'Le partenaire ne reçoit les adresses et statuts que pour ses expéditions assignées.' },
  { title: 'Accès BIB interne', description: 'RBAC Intranet et jetons d’intégration ne permettent pas de contourner les RLS Platform.' },
  { title: 'Fonctions privilégiées', description: 'Service-role, webhooks et Edge Functions valident le propriétaire, l’objet et l’action avant toute opération.' },
  { title: 'Sandbox / production', description: 'Les comptes, paiements, stocks et actions de test ne déclenchent pas de traitement de production.' },
  { title: 'Traçabilité et réponse aux incidents', description: 'L’accès sensible, les exports, les incidents et les changements de politiques disposent de preuves horodatées.' },
];

export default function SecurityPlatform() {
  const { canViewPage } = usePermissions();
  // Reuse the existing Security authorization until a separate platform-security
  // permission has been created and deployed on the server. Never default open.
  if (!canViewPage('security.security')) return <p role="alert">Accès à la revue de sécurité BIB Platform non autorisé.</p>;

  return <div className="space-y-6">
    <header className="space-y-2">
      <div className="flex items-center gap-2"><ShieldCheck className="h-6 w-6" /><h1 className="text-2xl font-semibold">Sécurité de BIB Platform</h1></div>
      <p className="max-w-3xl text-sm text-muted-foreground">
        Revue des frontières de confiance entre marchands, clients, fournisseurs, partenaires logistiques et personnel BIB :
        identités, RLS, API, données sensibles et opérations inter-applications.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">État observé : 30 octobre 2026</Badge>
        <Badge variant="secondary">Lecture et plan de contrôle uniquement</Badge>
        <a className="inline-flex items-center gap-1 text-sm text-primary hover:underline" href="https://lovable.dev/projects/1aa1b209-5f17-4dd2-aaca-54cdffc202fc" target="_blank" rel="noreferrer">Projet BIB Platform <ExternalLink className="h-3 w-3"/></a>
      </div>
    </header>

    <div className="rounded-lg border border-warning/40 p-4 text-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <p><strong>Ce n’est pas une supervision en temps réel.</strong> Les chiffres ci-dessous proviennent d'une lecture ponctuelle du schéma de BIB Platform.
          La présence d’une politique RLS ne garantit ni l’absence de fuite, ni la conformité métier. Une batterie de tests avec plusieurs identités et un audit des fonctions privilégiées restent nécessaires.</p>
      </div>
    </div>

    <Tabs defaultValue="actors" className="space-y-4">
      <TabsList className="flex h-auto flex-wrap">
        <TabsTrigger value="actors">Acteurs & frontières</TabsTrigger>
        <TabsTrigger value="rls">Registre RLS</TabsTrigger>
        <TabsTrigger value="reviews">Contrôles de sécurité</TabsTrigger>
        <TabsTrigger value="handoff">Interventions & escalade</TabsTrigger>
      </TabsList>

      <TabsContent value="actors" className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {actors.map(actor => <Card key={actor.name}>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" />{actor.name}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Identité</p><p>{actor.identity}</p></div>
              <div><p className="text-xs text-muted-foreground">Données potentiellement autorisées</p><p>{actor.owned}</p></div>
              <div><p className="text-xs text-muted-foreground">Frontière à protéger</p><p>{actor.forbidden}</p></div>
              <p className="border-t pt-2 font-mono text-xs text-muted-foreground">{actor.check}</p>
            </CardContent>
          </Card>)}
        </div>
        <p className="text-xs text-muted-foreground">Ces frontières sont des exigences à tester, pas une attestation que chaque table les applique déjà.</p>
      </TabsContent>

      <TabsContent value="rls" className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['Tables publiques avec RLS', '45'],
            ['Politiques enregistrées', '97'],
            ['Tables publiques sans RLS', '0'],
          ].map(([label,value]) => <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">Instantané de la base Platform, non actualisé automatiquement</p></CardContent></Card>)}
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>Table Platform</TableHead><TableHead>Fonction</TableHead><TableHead>Politiques</TableHead><TableHead>Évaluation</TableHead></TableRow></TableHeader>
            <TableBody>{observed.map(item => <TableRow key={item.table}>
              <TableCell className="font-mono text-xs">{item.table}</TableCell>
              <TableCell>{item.domain}</TableCell><TableCell>{item.policies}</TableCell>
              <TableCell><Badge variant="outline">Tests d'isolation requis</Badge></TableCell>
            </TableRow>)}</TableBody>
          </Table>
        </div>
        <p className="text-sm text-muted-foreground">
          RLS activée sans politique sur certaines tables (notamment remboursements et adresses) :
          cela bloque en principe l’accès direct ordinaire, mais les Edge Functions utilisant des privilèges élevés
          doivent être auditées séparément. Les opérations anonymes de commande nécessitent aussi des tests anti-abus.
        </p>
      </TabsContent>

      <TabsContent value="reviews" className="space-y-3">
        <p className="text-sm text-muted-foreground">Contrôles à exécuter par profil réel ou de recette isolé : refus d'accès croisé, lecture, écriture, API et effets métier. Aucun contrôle ci-dessous n'est déclaré réussi sans preuve.</p>
        {checkpoints.map((check,index) => <div key={check.title} className="flex items-start gap-3 rounded-lg border p-4">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">{index+1}. {check.title}</p>
            <p className="text-xs text-muted-foreground">{check.description}</p>
          </div>
          <Badge variant="outline">À vérifier</Badge>
        </div>)}
      </TabsContent>

      <TabsContent value="handoff" className="space-y-4">
        <Card><CardHeader><CardTitle className="text-base">Répartition des responsabilités</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><strong>Security & IT :</strong> définit les contrôles, vérifie les droits, qualifie les incidents et examine les preuves.</p>
            <p><strong>Produit & Engineering :</strong> corrige les politiques, Edge Functions, API et mécanismes d'authentification, puis exécute les tests techniques.</p>
            <p><strong>Pôles métier :</strong> valident la nécessité des données et des actions pour chaque catégorie d'utilisateur.</p>
            <p><strong>Qualité & Audit :</strong> vérifie indépendamment la résolution des écarts critiques.</p>
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link to="/pole/security/security">Alertes de sécurité <ArrowRight className="ml-2 h-4 w-4"/></Link></Button>
          <Button asChild variant="outline"><Link to="/pole/security/dataflow">Flux Platform / Intranet <ArrowRight className="ml-2 h-4 w-4"/></Link></Button>
          <Button asChild variant="outline"><Link to="/pole/product/engineering">Revue Engineering <ArrowRight className="ml-2 h-4 w-4"/></Link></Button>
        </div>
      </TabsContent>
    </Tabs>
  </div>;
}
