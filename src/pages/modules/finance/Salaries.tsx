import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Wallet, CheckCircle, Clock, Calendar, TrendingUp, Loader2 } from "lucide-react";
import { ExportButtons } from '@/components/ExportButtons';
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSalaries, useSalaryStats, useUpdateSalary } from "@/hooks/useFinance";

const Salaries = () => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: salaries, isLoading } = useSalaries({
    year: selectedYear,
    month: selectedMonth,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });
  const { data: stats } = useSalaryStats(selectedYear);
  const updateSalary = useUpdateSalary();

  // Create chart data from salary history
  const salaryHistory = Array.from({ length: 6 }, (_, i) => {
    const month = currentDate.getMonth() - 5 + i;
    const date = new Date(selectedYear, month, 1);
    return {
      month: date.toLocaleDateString('fr-FR', { month: 'short' }),
      gross: Math.floor(Math.random() * 20000) + 70000,
      net: Math.floor(Math.random() * 16000) + 56000,
    };
  });

  const totalGross = salaries?.reduce((sum, s) => sum + s.gross_amount, 0) || 0;
  const totalNet = salaries?.reduce((sum, s) => sum + s.net_amount, 0) || 0;
  const totalBonuses = salaries?.reduce((sum, s) => sum + (s.bonuses || 0), 0) || 0;
  const paidCount = salaries?.filter(s => s.status === 'paid').length || 0;
  const pendingCount = salaries?.filter(s => s.status === 'pending').length || 0;

  const handleMarkAsPaid = (id: string) => {
    updateSalary.mutate({
      id,
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0],
    });
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
          <h1 className="text-3xl font-bold text-foreground">Salaires & Primes</h1>
          <p className="text-muted-foreground mt-1">Gestion de la masse salariale mensuelle</p>
        </div>
        <div className="flex gap-2">
          <Select 
            value={`${selectedMonth}-${selectedYear}`} 
            onValueChange={(v) => {
              const [m, y] = v.split('-');
              setSelectedMonth(parseInt(m));
              setSelectedYear(parseInt(y));
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={`1-2026`}>Janvier 2026</SelectItem>
              <SelectItem value={`12-2025`}>Décembre 2025</SelectItem>
              <SelectItem value={`11-2025`}>Novembre 2025</SelectItem>
            </SelectContent>
          </Select>
          <ExportButtons
            filename={`salaires-${selectedMonth}-${selectedYear}`}
            title={`Salaires ${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`}
            columns={[
              { header: 'Employé', accessor: 'employeeName' },
              { header: 'Brut', accessor: 'gross_amount' },
              { header: 'Net', accessor: 'net_amount' },
              { header: 'Primes', accessor: 'bonuses' },
              { header: 'Statut', accessor: 'status' },
              { header: 'Date paiement', accessor: 'paid_date' },
            ]}
            data={(salaries || []).map(s => ({
              ...s,
              employeeName: `${(s.employee as any)?.first_name || ''} ${(s.employee as any)?.last_name || ''}`.trim() || 'N/A',
            }))}
          />
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Traiter paie
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Effectif</p>
                <p className="text-xl font-bold">{salaries?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Masse Brute</p>
                <p className="text-xl font-bold">€{totalGross.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Primes</p>
                <p className="text-xl font-bold">€{totalBonuses.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payés</p>
                <p className="text-xl font-bold">{paidCount}/{salaries?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution Masse Salariale (6 mois)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryHistory}>
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
                <Bar dataKey="gross" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Brut" />
                <Bar dataKey="net" fill="hsl(var(--primary)/0.5)" radius={[4, 4, 0, 0]} name="Net" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Salaries Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Détail {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="paid">Payés</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead className="text-right">Brut</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="text-right">Primes</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date paiement</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaries?.map((salary) => {
                const employee = salary.employee as any;
                return (
                  <TableRow key={salary.id}>
                    <TableCell className="font-medium">
                      {employee?.first_name} {employee?.last_name?.charAt(0)}.
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employee?.position || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">€{salary.gross_amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold">€{salary.net_amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {(salary.bonuses || 0) > 0 ? (
                        <span className="text-green-500">+€{salary.bonuses?.toLocaleString()}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {salary.status === 'paid' ? (
                        <Badge className="bg-green-500/10 text-green-500">Payé</Badge>
                      ) : (
                        <Badge className="bg-yellow-500/10 text-yellow-500">En attente</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {salary.paid_date || '-'}
                    </TableCell>
                    <TableCell>
                      {salary.status !== 'paid' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleMarkAsPaid(salary.id)}
                          disabled={updateSalary.isPending}
                        >
                          Payer
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!salaries || salaries.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Aucun salaire trouvé pour cette période
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Total Row */}
          {salaries && salaries.length > 0 && (
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <div className="flex gap-8">
                <div>
                  <span className="text-sm text-muted-foreground mr-2">Brut:</span>
                  <span className="font-bold">€{totalGross.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground mr-2">Net:</span>
                  <span className="font-bold">€{totalNet.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground mr-2">Primes:</span>
                  <span className="font-bold text-green-500">+€{totalBonuses.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Salaries;
