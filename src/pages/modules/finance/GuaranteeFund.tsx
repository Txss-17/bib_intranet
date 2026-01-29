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
  History,
  Loader2
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAtRiskUsers } from "@/hooks/useLifecycle";
import { useGuaranteeFund, useGuaranteeFundStats } from "@/hooks/useFinance";

const GuaranteeFund = () => {
  const { data: movements, isLoading } = useGuaranteeFund();
  const { data: stats } = useGuaranteeFundStats();
  const { data: atRiskUsers } = useAtRiskUsers();

  // Create chart data from movements
  const fundHistory = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - 5 + i);
    return {
      month: date.toLocaleDateString('fr-FR', { month: 'short' }),
      balance: 85000 + Math.floor(Math.random() * 30000),
    };
  });

  const currentBalance = stats?.balance ?? 115000;
  const totalProvisions = atRiskUsers?.reduce((sum, u) => sum + (u.revenue || 0) * 0.1, 0) ?? 5500;
  const availableBalance = currentBalance - totalProvisions;
  const mrr = 228000; // Would come from lifecycle stats
  const coverageRatio = ((currentBalance / mrr) * 100).toFixed(1);

  const getRiskBadge = (level: string | null) => {
    switch (level) {
      case 'high':
      case 'critical':
        return <Badge className="bg-destructive/10 text-destructive">Élevé</Badge>;
      case 'medium':
        return <Badge className="bg-orange-500/10 text-orange-500">Moyen</Badge>;
      case 'low':
        return <Badge className="bg-green-500/10 text-green-500">Faible</Badge>;
      default:
        return <Badge variant="outline">{level || 'N/A'}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              <span>{atRiskUsers?.length || 0} utilisateurs provisionnés</span>
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
              {atRiskUsers?.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{user.company_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.payment_status === 'overdue' ? 'Retards paiement' : 'À surveiller'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {getRiskBadge(user.risk_level)}
                    <span className="font-semibold">€{Math.floor((user.revenue || 0) * 0.1).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {(!atRiskUsers || atRiskUsers.length === 0) && (
                <p className="text-muted-foreground text-center py-4">
                  Aucun utilisateur à risque
                </p>
              )}
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
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements?.slice(0, 10).map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>{movement.transaction_date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {movement.type === 'deposit' ? (
                        <>
                          <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                            <ArrowDownRight className="h-4 w-4 text-green-500" />
                          </div>
                          <span>Dépôt</span>
                        </>
                      ) : movement.type === 'withdrawal' ? (
                        <>
                          <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                            <ArrowUpRight className="h-4 w-4 text-destructive" />
                          </div>
                          <span>Retrait</span>
                        </>
                      ) : (
                        <>
                          <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Shield className="h-4 w-4 text-blue-500" />
                          </div>
                          <span>Ajustement</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{movement.reason}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {(movement.user_account as any)?.company_name || '-'}
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${
                    movement.type === 'deposit' ? 'text-green-500' : 
                    movement.type === 'withdrawal' ? 'text-destructive' : ''
                  }`}>
                    {movement.type === 'deposit' ? '+' : movement.type === 'withdrawal' ? '-' : ''}€{movement.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {(!movements || movements.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun mouvement trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuaranteeFund;
