import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users,
  Wallet,
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  Download
} from "lucide-react";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock data
const salaryHistory = [
  { month: 'Juil', gross: 78000, net: 62400 },
  { month: 'Août', gross: 78000, net: 62400 },
  { month: 'Sept', gross: 82000, net: 65600 },
  { month: 'Oct', gross: 82000, net: 65600 },
  { month: 'Nov', gross: 85000, net: 68000 },
  { month: 'Déc', gross: 92000, net: 73600 },
];

const salaries = [
  { id: 1, employee: 'Marie D.', position: 'CEO', grossAmount: 12000, netAmount: 9600, bonuses: 0, status: 'paid', paidDate: '2026-01-03' },
  { id: 2, employee: 'Thomas L.', position: 'CTO', grossAmount: 10000, netAmount: 8000, bonuses: 2000, status: 'paid', paidDate: '2026-01-03' },
  { id: 3, employee: 'Sophie M.', position: 'Finance Manager', grossAmount: 7500, netAmount: 6000, bonuses: 500, status: 'paid', paidDate: '2026-01-03' },
  { id: 4, employee: 'Pierre R.', position: 'Ops Manager', grossAmount: 6500, netAmount: 5200, bonuses: 0, status: 'paid', paidDate: '2026-01-03' },
  { id: 5, employee: 'Julie K.', position: 'Supplier Manager', grossAmount: 5500, netAmount: 4400, bonuses: 300, status: 'pending', paidDate: null },
  { id: 6, employee: 'Marc B.', position: 'Tech Lead', grossAmount: 7000, netAmount: 5600, bonuses: 0, status: 'pending', paidDate: null },
  { id: 7, employee: 'Claire V.', position: 'Marketing', grossAmount: 4500, netAmount: 3600, bonuses: 0, status: 'pending', paidDate: null },
  { id: 8, employee: 'Antoine P.', position: 'Support', grossAmount: 3800, netAmount: 3040, bonuses: 0, status: 'pending', paidDate: null },
];

const Salaries = () => {
  const [selectedMonth, setSelectedMonth] = useState('janvier-2026');
  const [statusFilter, setStatusFilter] = useState('all');

  const totalGross = salaries.reduce((sum, s) => sum + s.grossAmount, 0);
  const totalNet = salaries.reduce((sum, s) => sum + s.netAmount, 0);
  const totalBonuses = salaries.reduce((sum, s) => sum + s.bonuses, 0);
  const paidCount = salaries.filter(s => s.status === 'paid').length;
  const pendingCount = salaries.filter(s => s.status === 'pending').length;

  const filteredSalaries = salaries.filter(salary =>
    statusFilter === 'all' || salary.status === statusFilter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Salaires & Primes</h1>
          <p className="text-muted-foreground mt-1">Gestion de la masse salariale mensuelle</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="janvier-2026">Janvier 2026</SelectItem>
              <SelectItem value="decembre-2025">Décembre 2025</SelectItem>
              <SelectItem value="novembre-2025">Novembre 2025</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
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
                <p className="text-xl font-bold">{salaries.length}</p>
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
                <p className="text-xl font-bold">{paidCount}/{salaries.length}</p>
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
          <CardTitle>Détail Janvier 2026</CardTitle>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSalaries.map((salary) => (
                <TableRow key={salary.id}>
                  <TableCell className="font-medium">{salary.employee}</TableCell>
                  <TableCell className="text-muted-foreground">{salary.position}</TableCell>
                  <TableCell className="text-right">€{salary.grossAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold">€{salary.netAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {salary.bonuses > 0 ? (
                      <span className="text-green-500">+€{salary.bonuses.toLocaleString()}</span>
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
                    {salary.paidDate || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Total Row */}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Salaries;
