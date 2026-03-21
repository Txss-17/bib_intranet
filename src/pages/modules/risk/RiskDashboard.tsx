import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { AlertTriangle, Shield, Activity, Clock, Eye, UserPlus, ArrowUpRight, CheckCircle2, Search } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const severityBanner = [
  { label: 'Critical P1', count: 3, color: 'bg-destructive text-destructive-foreground' },
  { label: 'Open Incidents', count: 12, color: 'bg-orange-500 text-white' },
  { label: 'Escalations', count: 5, color: 'bg-muted text-muted-foreground' },
];

const incidentOverview = [
  { name: 'P1 - Critical', value: 3, color: 'hsl(0, 84%, 60%)' },
  { name: 'P2 - High', value: 5, color: 'hsl(25, 95%, 53%)' },
  { name: 'P3 - Medium', value: 8, color: 'hsl(48, 96%, 53%)' },
  { name: 'P4 - Low', value: 12, color: 'hsl(142, 76%, 36%)' },
];

const incidentTimeline = [
  { month: 'Jan', P1: 2, P2: 5, P3: 8, P4: 12 },
  { month: 'Fév', P1: 1, P2: 4, P3: 10, P4: 15 },
  { month: 'Mar', P1: 3, P2: 6, P3: 7, P4: 11 },
  { month: 'Avr', P1: 1, P2: 3, P3: 9, P4: 14 },
  { month: 'Mai', P1: 2, P2: 4, P3: 6, P4: 10 },
  { month: 'Juin', P1: 3, P2: 5, P3: 8, P4: 13 },
];

const supplierIncidents = [
  { id: 'SI-045', issue: 'Retard livraison lot #B789', severity: 'P1', status: 'investigating', action: '' },
  { id: 'SI-044', issue: 'Non-conformité certificat ISO', severity: 'P2', status: 'mitigating', action: '' },
  { id: 'SI-043', issue: 'Qualité produit en dessous norme', severity: 'P1', status: 'escalated', action: '' },
];

const clientIncidents = [
  { id: 'CI-089', issue: 'Colis endommagé — réclamation', severity: 'P2', status: 'investigating', action: '' },
  { id: 'CI-088', issue: 'Produit non conforme reçu', severity: 'P3', status: 'resolved', action: '' },
  { id: 'CI-087', issue: 'Retard remboursement > 15j', severity: 'P2', status: 'monitoring', action: '' },
];

const internalIncidents = [
  { id: 'INT-034', issue: 'Panne système de paiement', severity: 'P1', status: 'resolved', action: '' },
  { id: 'INT-033', issue: 'Faille sécurité API détectée', severity: 'P2', status: 'mitigating', action: '' },
  { id: 'INT-032', issue: 'Surcharge serveur warehouse', severity: 'P3', status: 'monitoring', action: '' },
];

const getSeverityBadge = (sev: string) => {
  const map: Record<string, string> = {
    P1: 'bg-destructive text-destructive-foreground',
    P2: 'bg-orange-500 text-white',
    P3: 'bg-yellow-500 text-black',
    P4: 'bg-muted text-muted-foreground',
  };
  return <Badge className={map[sev] || ''}>{sev}</Badge>;
};

const getStatusLabel = (s: string) => {
  const map: Record<string, string> = {
    investigating: 'Investigation',
    mitigating: 'Mitigation',
    monitoring: 'Surveillance',
    resolved: 'Résolu',
    escalated: 'Escaladé',
  };
  return map[s] || s;
};

interface IncidentData {
  id: string;
  issue: string;
  severity: string;
  status: string;
  action: string;
}

const IncidentTable = ({ title, data }: { title: string; data: IncidentData[] }) => {
  const table = useTableInteractions({
    data,
    searchFields: ['id', 'issue'],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher par ID ou problème..." value={table.searchQuery} onChange={e => table.setSearchQuery(e.target.value)} className="pl-8 h-9" />
          </div>
          <Select value={table.filters.severity || 'all'} onValueChange={v => table.setFilter('severity', v)}>
            <SelectTrigger className="w-[100px] h-9"><SelectValue placeholder="Sévérité" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="P1">P1</SelectItem>
              <SelectItem value="P2">P2</SelectItem>
              <SelectItem value="P3">P3</SelectItem>
            </SelectContent>
          </Select>
          <Select value={table.filters.status || 'all'} onValueChange={v => table.setFilter('status', v)}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="investigating">Investigation</SelectItem>
              <SelectItem value="mitigating">Mitigation</SelectItem>
              <SelectItem value="monitoring">Surveillance</SelectItem>
              <SelectItem value="resolved">Résolu</SelectItem>
              <SelectItem value="escalated">Escaladé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead column="id" currentSort={table.sortColumn as string} direction={table.sortDirection} onSort={c => table.toggleSort(c as keyof IncidentData)}>ID</SortableTableHead>
              <SortableTableHead column="issue" currentSort={table.sortColumn as string} direction={table.sortDirection} onSort={c => table.toggleSort(c as keyof IncidentData)}>Problème</SortableTableHead>
              <SortableTableHead column="severity" currentSort={table.sortColumn as string} direction={table.sortDirection} onSort={c => table.toggleSort(c as keyof IncidentData)}>Sévérité</SortableTableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.processedData.map(inc => (
              <TableRow key={inc.id}>
                <TableCell className="font-medium">{inc.id}</TableCell>
                <TableCell>{inc.issue}</TableCell>
                <TableCell>{getSeverityBadge(inc.severity)}</TableCell>
                <TableCell><Badge variant="outline">{getStatusLabel(inc.status)}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm"><Eye className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm"><UserPlus className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm"><ArrowUpRight className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm"><CheckCircle2 className="h-3 w-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {table.processedData.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Aucun résultat</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default function RiskDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Risques & Incidents</h1>
        <p className="text-muted-foreground">Surveillance et gestion des risques opérationnels</p>
      </div>

      {/* Severity Banner */}
      <div className="grid gap-4 md:grid-cols-3">
        {severityBanner.map(b => (
          <div key={b.label} className={`${b.color} rounded-lg p-4 flex items-center justify-between`}>
            <span className="font-medium">{b.label}</span>
            <span className="text-3xl font-bold">{b.count}</span>
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Incidents actifs', value: 12, icon: AlertTriangle, color: 'text-destructive' },
          { label: 'Risques surveillés', value: 23, icon: Shield, color: 'text-yellow-500' },
          { label: 'Score risque global', value: '72/100', icon: Activity, color: 'text-muted-foreground' },
          { label: 'Temps résolution moy.', value: '4.2h', icon: Clock, color: 'text-muted-foreground' },
        ].map(s => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{s.value}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Incident Overview</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={incidentOverview} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {incidentOverview.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Incident Timeline</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={incidentTimeline}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="P1" name="P1 Critical" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="P2" name="P2 High" stroke="hsl(25, 95%, 53%)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="P3" name="P3 Medium" stroke="hsl(48, 96%, 53%)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="P4" name="P4 Low" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Incident Tables */}
      <IncidentTable title="Supplier Incidents" data={supplierIncidents} />
      <IncidentTable title="Client Incidents" data={clientIncidents} />
      <IncidentTable title="Internal Incidents" data={internalIncidents} />
    </div>
  );
}
