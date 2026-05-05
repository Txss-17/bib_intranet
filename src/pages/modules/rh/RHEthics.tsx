import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield } from 'lucide-react';
import EthicsDashboard from '@/pages/modules/ethics/EthicsDashboard';
import EthicsReceived from '@/pages/modules/ethics/EthicsReceived';
import EthicsOngoing from '@/pages/modules/ethics/EthicsOngoing';
import EthicsClosed from '@/pages/modules/ethics/EthicsClosed';
import EthicsStats from '@/pages/modules/ethics/EthicsStats';

export default function RHEthics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Éthique & Signalements
        </h1>
        <p className="text-muted-foreground">
          Suivi confidentiel des signalements internes — réservé aux référents RH habilités.
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="dashboard">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="received">Reçus</TabsTrigger>
          <TabsTrigger value="ongoing">En cours</TabsTrigger>
          <TabsTrigger value="closed">Clôturés</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="mt-6"><EthicsDashboard /></TabsContent>
        <TabsContent value="received" className="mt-6"><EthicsReceived /></TabsContent>
        <TabsContent value="ongoing" className="mt-6"><EthicsOngoing /></TabsContent>
        <TabsContent value="closed" className="mt-6"><EthicsClosed /></TabsContent>
        <TabsContent value="stats" className="mt-6"><EthicsStats /></TabsContent>
      </Tabs>
    </div>
  );
}
