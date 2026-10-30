import MarketplaceSubscriptions from '@/pages/modules/marketplace/MarketplaceSubscriptions';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
export default function Subscriptions() {
  return <div className="space-y-4">
    <header>
      <h1 className="text-2xl font-semibold">Contrôle financier des abonnements</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Le statut commercial des abonnements provient de la Marketplace.
        Le pôle Finance vérifie séparément les échéances, les écarts de facturation,
        les justificatifs et les règlements effectifs.
      </p>
    </header>
    <Tabs defaultValue="reviews">
      <TabsList>
        <TabsTrigger value="reviews">Contrôles financiers</TabsTrigger>
        <TabsTrigger value="subscriptions">Abonnements Marketplace (consultation)</TabsTrigger>
      </TabsList>
      <TabsContent value="reviews"><ModuleWorkspace pageId="finance.subscriptions" /></TabsContent>
      <TabsContent value="subscriptions">
        <p className="mb-3 text-xs text-muted-foreground">Cette vue n’effectue aucun encaissement ni remboursement ; vérifier les écritures et la source de paiement avant de valider un dossier.</p>
        <MarketplaceSubscriptions />
      </TabsContent>
    </Tabs>
  </div>;
}
