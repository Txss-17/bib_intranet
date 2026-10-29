import MarketplaceSubscriptions from '@/pages/modules/marketplace/MarketplaceSubscriptions';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';
import { Tabs,TabsList,TabsTrigger,TabsContent } from '@/components/ui/tabs';
export default function Subscriptions(){return <Tabs defaultValue="subscriptions"><TabsList><TabsTrigger value="subscriptions">Abonnements enregistrés</TabsTrigger><TabsTrigger value="reviews">Contrôles financiers</TabsTrigger></TabsList><TabsContent value="subscriptions"><MarketplaceSubscriptions /></TabsContent><TabsContent value="reviews"><ModuleWorkspace pageId="finance.subscriptions" /></TabsContent></Tabs>}
