import ProductRequests from '@/pages/ProductStudio';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';
import { Tabs,TabsList,TabsTrigger,TabsContent } from '@/components/ui/tabs';
export default function ProductStudio(){return <Tabs defaultValue="requests"><TabsList><TabsTrigger value="requests">Demandes produit</TabsTrigger><TabsTrigger value="dossiers">Dossiers de conception</TabsTrigger></TabsList><TabsContent value="requests"><ProductRequests /></TabsContent><TabsContent value="dossiers"><ModuleWorkspace pageId="product.studio" /></TabsContent></Tabs>}
