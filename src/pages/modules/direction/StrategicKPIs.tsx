import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useExecutiveKPIs } from '@/hooks/useExecutiveKPIs';

export default function StrategicKPIs() {
  const { data, isLoading, isError, refetch } = useExecutiveKPIs();

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if(isError)return <p role="alert">Les indicateurs sont indisponibles ou hors de votre périmètre. <button onClick={()=>void refetch()}>Réessayer</button></p>;
  const present = (n: number | null | undefined) => n == null || !Number.isFinite(n) ? '—' : n.toLocaleString('fr-FR');
  const kpis = [
    { label: "Entrées EUR", value: present(data?.recordedIncome), unit: '€' },
    { label: 'Solde des flux', value: present(data?.cashBalance), unit: '€' },
    { label: 'Commandes', value: present(data?.totalOrders), unit: '' },
    { label: 'Fournisseurs actifs', value: present(data?.totalSuppliers), unit: '' },
    { label: 'Utilisateurs à risque', value: present(data?.atRiskUsers), unit: '' },
    { label: 'Incidents ouverts', value: present(data?.openIncidents), unit: '' },
    { label: 'Tickets ouverts', value: present(data?.openTickets), unit: '' },
    { label: 'Produits en attente', value: present(data?.pendingProducts), unit: '' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">KPI stratégiques</h1><p className="text-xs text-muted-foreground">Trésorerie EUR : 500 derniers mouvements enregistrés.</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          Indicateurs clés consolidés en temps réel.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {kpi.value}
                {kpi.unit && <span className="text-base text-muted-foreground ml-1">{kpi.unit}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Qualité fournisseurs</CardTitle></CardHeader>
        <CardContent>
          <Badge variant="outline">Score moyen : {data?.avgSupplierQuality == null ? 'Non évalué' : `${data.avgSupplierQuality}%`}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
