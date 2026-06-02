import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useExecutiveKPIs } from '@/hooks/useExecutiveKPIs';

export default function StrategicKPIs() {
  const { data, isLoading } = useExecutiveKPIs();

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const kpis = [
    { label: "Chiffre d'affaires", value: (data?.totalRevenue ?? 0).toLocaleString('fr-FR'), unit: '€' },
    { label: 'EBITDA', value: (data?.ebitda ?? 0).toLocaleString('fr-FR'), unit: '€' },
    { label: 'Commandes', value: data?.totalOrders ?? 0, unit: '' },
    { label: 'Fournisseurs actifs', value: data?.totalSuppliers ?? 0, unit: '' },
    { label: 'Utilisateurs à risque', value: data?.atRiskUsers ?? 0, unit: '' },
    { label: 'Incidents ouverts', value: data?.openIncidents ?? 0, unit: '' },
    { label: 'Tickets ouverts', value: data?.openTickets ?? 0, unit: '' },
    { label: 'Produits en attente', value: data?.pendingProducts ?? 0, unit: '' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">KPI stratégiques</h1>
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
          <Badge variant="outline">Score moyen : {data?.avgSupplierQuality ?? 0}%</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
