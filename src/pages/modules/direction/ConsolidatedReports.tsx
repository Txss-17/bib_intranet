import React from 'react';
 import { 
   FileBarChart, Calendar, TrendingUp,
  DollarSign, Users, Package, Leaf
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { ExportButtons } from '@/components/ExportButtons';
 
 const reportColumns = [
   { header: 'ID', accessor: 'id' },
   { header: 'Titre', accessor: 'title' },
   { header: 'Type', accessor: 'type' },
   { header: 'Date', accessor: 'date' },
   { header: 'Statut', accessor: 'status' },
 ];
 
 const kpiColumns = [
   { header: 'Métrique', accessor: 'metric' },
   { header: 'Valeur actuelle', accessor: 'current' },
   { header: 'Valeur précédente', accessor: 'previous' },
   { header: 'Évolution (%)', accessor: 'change' },
 ];
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const reports = [
  {
    id: '1',
    title: 'Rapport Mensuel Décembre 2025',
    type: 'monthly',
    date: '2026-01-05',
    status: 'ready',
    sections: ['Finance', 'Ops', 'Utilisateurs', 'ESG']
  },
  {
    id: '2',
    title: 'Rapport Trimestriel Q4 2025',
    type: 'quarterly',
    date: '2026-01-03',
    status: 'ready',
    sections: ['KPIs', 'Croissance', 'Prévisions']
  },
  {
    id: '3',
    title: 'Rapport Annuel 2025',
    type: 'annual',
    date: '2026-01-15',
    status: 'draft',
    sections: ['Bilan', 'Résultats', 'Perspectives']
  },
];

const kpiSummary = {
  revenue: { current: 2450000, previous: 2180000, change: 12.4 },
  users: { current: 1247, previous: 1150, change: 8.4 },
  orders: { current: 3420, previous: 3100, change: 10.3 },
  esg: { current: 78, previous: 74, change: 5.4 }
};

const ConsolidatedReports = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FileBarChart className="h-8 w-8 text-primary" />
            Rapports Consolidés
          </h1>
          <p className="text-muted-foreground mt-1">Synthèse et rapports multi-pôles</p>
        </div>
         <ExportButtons
           filename="rapports-consolides"
           title="Rapports Consolidés"
           poleName="Direction"
           columns={reportColumns}
           data={reports}
         />
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">€{(kpiSummary.revenue.current / 1000000).toFixed(2)}M</p>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <Badge variant="outline" className="text-emerald-500 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{kpiSummary.revenue.change}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{kpiSummary.users.current.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Utilisateurs</p>
                <Badge variant="outline" className="text-emerald-500 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{kpiSummary.users.change}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{kpiSummary.orders.current.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Commandes</p>
                <Badge variant="outline" className="text-emerald-500 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{kpiSummary.orders.change}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Leaf className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{kpiSummary.esg.current}/100</p>
                <p className="text-sm text-muted-foreground">Score ESG</p>
                <Badge variant="outline" className="text-emerald-500 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{kpiSummary.esg.change}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="monthly">Mensuels</TabsTrigger>
          <TabsTrigger value="quarterly">Trimestriels</TabsTrigger>
          <TabsTrigger value="annual">Annuels</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="space-y-4">
            {reports.map(report => (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <FileBarChart className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{report.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{report.date}</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          {report.sections.map(section => (
                            <Badge key={section} variant="outline" className="text-xs">{section}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={report.status === 'ready' ? 'default' : 'secondary'}>
                        {report.status === 'ready' ? 'Prêt' : 'Brouillon'}
                      </Badge>
                       <ExportButtons
                         filename={`rapport-${report.id}`}
                         title={report.title}
                         poleName="Direction"
                         columns={kpiColumns}
                         data={[
                           { metric: 'Revenue', current: `€${(kpiSummary.revenue.current / 1000000).toFixed(2)}M`, previous: `€${(kpiSummary.revenue.previous / 1000000).toFixed(2)}M`, change: `+${kpiSummary.revenue.change}%` },
                           { metric: 'Utilisateurs', current: kpiSummary.users.current, previous: kpiSummary.users.previous, change: `+${kpiSummary.users.change}%` },
                           { metric: 'Commandes', current: kpiSummary.orders.current, previous: kpiSummary.orders.previous, change: `+${kpiSummary.orders.change}%` },
                           { metric: 'Score ESG', current: `${kpiSummary.esg.current}/100`, previous: `${kpiSummary.esg.previous}/100`, change: `+${kpiSummary.esg.change}` },
                         ]}
                         variant="outline"
                         size="sm"
                       />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsolidatedReports;
