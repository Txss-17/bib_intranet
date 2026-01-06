import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  AlertTriangle,
  TrendingUp,
  Plus,
  History
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock data
const fundHistory = [
  { month: 'Juil', balance: 85000 },
  { month: 'Août', balance: 92000 },
  { month: 'Sept', balance: 88000 },
  { month: 'Oct', balance: 95000 },
  { month: 'Nov', balance: 102000 },
  { month: 'Déc', balance: 115000 },
];

const movements = [
  { id: 1, date: '2026-01-05', type: 'deposit', amount: 5000, reason: 'Provision mensuelle', user: null, processedBy: 'Système' },
  { id: 2, date: '2026-01-03', type: 'withdrawal', amount: 2800, reason: 'Impayé couvert - SmallBiz', user: 'SmallBiz Solutions', processedBy: 'Sophie M.' },
  { id: 3, date: '2025-12-28', type: 'deposit', amount: 8000, reason: 'Provision Q4', user: null, processedBy: 'Système' },
  { id: 4, date: '2025-12-15', type: 'withdrawal', amount: 1500, reason: 'Litige résolu - RetailPlus', user: 'RetailPlus GmbH', processedBy: 'Sophie M.' },
  { id: 5, date: '2025-12-01', type: 'deposit', amount: 5000, reason: 'Provision mensuelle', user: null, processedBy: 'Système' },
  { id: 6, date: '2025-11-20', type: 'withdrawal', amount: 4200, reason: 'Défaut paiement - StartupHub', user: 'StartupHub', processedBy: 'Sophie M.' },
];

const provisions = [
  { id: 1, user: 'SmallBiz Solutions', riskLevel: 'high', amount: 3200, reason: 'Retards paiement récurrents' },
  { id: 2, user: 'NewStartup Inc', riskLevel: 'medium', amount: 1500, reason: 'Stock engagé élevé' },
  { id: 3, user: 'EcoStore Online', riskLevel: 'low', amount: 800, reason: 'Nouveau client' },
];

const GuaranteeFund = () => {
  const currentBalance = 115000;
  const totalProvisions = provisions.reduce((sum, p) => sum + p.amount, 0);
  const availableBalance = currentBalance - totalProvisions;
  const coverageRatio = ((currentBalance / 228000) * 100).toFixed(1); // vs MRR

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-destructive/10 text-destructive">Élevé</Badge>;
      case 'medium':
        return <Badge className="bg-orange-500/10 text-orange-500">Moyen</Badge>;
      case 'low':
        return <Badge className="bg-green-500/10 text-green-500">Faible</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fonds de Garantie</h1>
          <p className="text-muted-foreground mt-1">Réserves et provisions pour risques clients</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <History className="h-4 w-4 mr-2" />
            Historique
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter provision
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solde Total</p>
                <p className="text-2xl font-bold">€{currentBalance.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <PiggyBank className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+12.7%</span>
              <span className="text-muted-foreground ml-1">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Provisions Actives</p>
                <p className="text-2xl font-bold">€{totalProvisions.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <span>{provisions.length} utilisateurs provisionnés</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponible</p>
                <p className="text-2xl font-bold text-green-500">€{availableBalance.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ratio / MRR</p>
                <p className="text-2xl font-bold">{coverageRatio}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <span>Objectif: &gt;50%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fund Evolution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution du Fonds (6 mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fundHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => `€${value.toLocaleString()}`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                    name="Solde"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Active Provisions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Provisions Actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {provisions.map((provision) => (
                <div key={provision.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{provision.user}</p>
                    <p className="text-sm text-muted-foreground">{provision.reason}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {getRiskBadge(provision.riskLevel)}
                    <span className="font-semibold">€{provision.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movements History */}
      <Card>
        <CardHeader>
          <CardTitle>Mouvements Récents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Utilisateur lié</TableHead>
                <TableHead>Traité par</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>{movement.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {movement.type === 'deposit' ? (
                        <>
                          <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                            <ArrowDownRight className="h-4 w-4 text-green-500" />
                          </div>
                          <span>Dépôt</span>
                        </>
                      ) : (
                        <>
                          <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                            <ArrowUpRight className="h-4 w-4 text-destructive" />
                          </div>
                          <span>Retrait</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{movement.reason}</TableCell>
                  <TableCell className="text-muted-foreground">{movement.user || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{movement.processedBy}</TableCell>
                  <TableCell className={`text-right font-semibold ${
                    movement.type === 'deposit' ? 'text-green-500' : 'text-destructive'
                  }`}>
                    {movement.type === 'deposit' ? '+' : '-'}€{movement.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuaranteeFund;
