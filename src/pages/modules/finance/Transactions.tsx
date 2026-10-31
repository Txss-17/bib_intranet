import FinancialOverview from '@/components/operations/FinancialOverview';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function Transactions() {
  return <div className="space-y-5">
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold">Transactions financières BIB</h1>
      <p className="text-sm text-muted-foreground">
        Les ventes, abonnements et remboursements naissent sur la plateforme BIB ;
        Stripe traite les paiements correspondants. Le registre ci-dessous ne constitue
        ni le journal complet Stripe ni un relevé bancaire.
      </p>
    </header>
    <Card><CardContent className="space-y-3 p-4">
      <p className="font-medium">Suivi des opérations de la plateforme</p>
      <p className="text-sm text-muted-foreground">
        Pour contrôler un paiement, rapprocher sa commande, son montant Stripe,
        ses éventuels remboursements et sa facture. Pour les règlements marchands,
        contrôler séparément le montant dû et le versement réellement confirmé.
        Les transactions absentes du registre ne doivent pas être considérées comme inexistantes.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild><Link to="/pole/finance/reconciliation">Rapprocher commandes et paiements Stripe</Link></Button>
        <Button variant="outline" asChild><Link to="/pole/finance/payouts">Contrôler les reversements marchands</Link></Button>
        <Button variant="outline" asChild><Link to="/pole/finance/subscriptions">Contrôler les abonnements</Link></Button>
      </div>
    </CardContent></Card>
    <Tabs defaultValue="ledger">
      <TabsList><TabsTrigger value="ledger">Écritures financières synchronisées</TabsTrigger><TabsTrigger value="review">Dossiers de contrôle</TabsTrigger></TabsList>
      <TabsContent value="ledger"><FinancialOverview title="Transactions importées de BIB Platform" mode="transactions" /></TabsContent>
      <TabsContent value="review"><ModuleWorkspace pageId="finance.transactions" /></TabsContent>
    </Tabs>
  </div>;
}
