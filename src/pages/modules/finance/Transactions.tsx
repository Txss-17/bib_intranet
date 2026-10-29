import FinancialOverview from '@/components/operations/FinancialOverview';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';
import {Tabs,TabsList,TabsTrigger,TabsContent}from '@/components/ui/tabs';
export default function Transactions(){return <Tabs defaultValue="ledger"><TabsList><TabsTrigger value="ledger">Mouvements enregistrés</TabsTrigger><TabsTrigger value="review">Dossiers de contrôle</TabsTrigger></TabsList><TabsContent value="ledger"><FinancialOverview title="Transactions"/></TabsContent><TabsContent value="review"><ModuleWorkspace pageId="finance.transactions"/></TabsContent></Tabs>}
