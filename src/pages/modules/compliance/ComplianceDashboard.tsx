import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { FileText, Scale, AlertTriangle, Shield, Search, Eye, Bell, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// Product Compliance by Market
const marketCompliance = [
  { market: 'USA', flag: '🇺🇸', percent: 92, body: 'FDA', reviewed: '73/79', nextReview: '73/79', date: 'July 15', color: 'border-red-500 bg-red-50 dark:bg-red-950/30' },
  { market: 'EU', flag: '🇪🇺', percent: 87, body: 'CE', reviewed: '34/42', nextReview: '58/67', date: 'May 20', color: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' },
  { market: 'UAE', flag: '🇦🇪', percent: 81, body: 'ESMA', reviewed: '33/62', nextReview: '54/42', date: 'July 2', color: 'border-yellow-600 bg-yellow-50 dark:bg-yellow-950/30' },
];

// Contract Tracking data
const contractExpiration = [
  { name: 'Active', value: 36, color: 'hsl(var(--chart-1))' },
  { name: 'Under Review', value: 12, color: 'hsl(var(--chart-3))' },
  { name: 'Expired', value: 7, color: 'hsl(var(--destructive))' },
];

// Contract table data
const contracts = [
  { id: 'S-098', type: 'Supplier', status: 'active', expiry: 'Oct 2024' },
  { id: 'U-307', type: 'User Terms', status: 'review', expiry: 'Nov 2024' },
  { id: 'S-056', type: 'Supplier', status: 'expired', expiry: 'Apr 2024' },
  { id: 'S-021', type: 'Supplier', status: 'active', expiry: 'Dec 2024' },
  { id: 'P-112', type: 'Partner', status: 'active', expiry: 'Feb 2025' },
  { id: 'S-045', type: 'Supplier', status: 'review', expiry: 'Jan 2025' },
];

// Audit status
const auditQuarters = [
  { quarter: 'Q1', status: 'compliant', label: 'Compliant', color: 'bg-emerald-500' },
  { quarter: 'Q2', status: 'in_progress', label: 'In Progress', progress: 7, color: 'bg-yellow-500' },
  { quarter: 'Q3', status: 'upcoming', label: 'Upcoming', progress: 7, color: 'bg-muted' },
  { quarter: 'Q4', status: 'upcoming', label: 'Upcoming', color: 'bg-muted' },
];

// Watchlist & Alerts
const alerts = [
  { id: 'S-021', severity: 'urgent', title: 'Supplier Contract Expiry', description: 'S-021 Exp: 30 days', date: 'Apr 22', action: 'RENEW', priority: 'P1' },
  { id: 'CE-001', severity: 'urgent', title: 'CE Certification Update', description: '3 products CE certification expire in 10 days', date: 'Apr 19', action: 'REVIEW', priority: 'P1' },
  { id: 'ESMA-001', severity: 'moderate', title: 'ESMA Audit Reminder', description: 'Audit confirmation needed for UAE by July 2', date: 'Apr 16', action: 'REVIEW', priority: 'P2' },
  { id: 'TM-001', severity: 'follow_up', title: 'Trademark Renewal', description: 'EU trademark renewal process starts soon', date: 'Apr 10', action: 'REVIEW', priority: 'P3' },
];

const getStatusBadge = (status: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: 'Active', cls: 'bg-emerald-500 text-white' },
    review: { label: 'Under Review', cls: 'bg-yellow-500 text-white' },
    expired: { label: 'Expired', cls: 'bg-destructive text-destructive-foreground' },
  };
  const s = map[status] || { label: status, cls: '' };
  return <Badge className={s.cls}>{s.label}</Badge>;
};

const getSeverityBadge = (severity: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    urgent: { label: 'URGENT', cls: 'bg-destructive text-destructive-foreground' },
    moderate: { label: 'MODERATE', cls: 'bg-yellow-500 text-white' },
    follow_up: { label: 'FOLLOW UP', cls: 'bg-blue-500 text-white' },
  };
  const s = map[severity] || { label: severity, cls: '' };
  return <Badge className={`text-[10px] ${s.cls}`}>{s.label}</Badge>;
};

export default function ComplianceDashboard() {
  const contractsTable = useTableInteractions({
    data: contracts,
    searchFields: ['id', 'type'],
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Compliance & Legal</h1>
        <p className="text-muted-foreground">Conformité produit par marché, suivi contrats et alertes réglementaires</p>
      </div>

      {/* Product Compliance by Market + Contract Tracking Donut */}
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader><CardTitle>Product Compliance by Market</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {marketCompliance.map((m) => (
                  <div key={m.market} className={`rounded-lg border-2 p-4 ${m.color}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{m.flag}</span>
                        <span className="font-bold text-lg">{m.market}</span>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{m.body}</span>
                    </div>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">{m.percent}%</div>
                    <p className="text-xs text-muted-foreground mb-3">Compliant</p>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div>
                        <p className="font-semibold">{m.nextReview}</p>
                        <p className="text-muted-foreground">Next Review</p>
                      </div>
                      <div>
                        <p className="font-semibold">{m.reviewed}</p>
                        <p className="text-muted-foreground">Reviewed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{m.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Contracts Expirations</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={contractExpiration} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value"
                    label={false}>
                    {contractExpiration.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center -mt-4 mb-3">
                <span className="text-3xl font-bold">55</span>
              </div>
              <div className="space-y-1 text-xs w-full">
                {contractExpiration.map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                      <span>{c.name}</span>
                    </div>
                    <span className="font-semibold">{c.value}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full text-xs">View All Contracts</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Audit Status + Watchlist */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Audit Status */}
          <Card>
            <CardHeader><CardTitle>Compliance Audit Status</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-1">
                {auditQuarters.map((q) => (
                  <div key={q.quarter} className={`flex-1 rounded-lg p-3 ${q.color} ${q.status === 'compliant' ? 'text-white' : q.status === 'in_progress' ? 'text-white' : 'text-muted-foreground'}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{q.quarter}</span>
                      {q.status === 'compliant' && <CheckCircle className="h-4 w-4" />}
                      {q.status === 'in_progress' && <Clock className="h-4 w-4" />}
                    </div>
                    <p className="text-xs mt-1">{q.label}</p>
                    {q.progress && <p className="text-xs mt-0.5">{q.progress}%</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contract Tracking Table */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Tracking</CardTitle>
              <div className="flex gap-2 mt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher..." value={contractsTable.searchQuery} onChange={e => contractsTable.setSearchQuery(e.target.value)} className="pl-8 h-9" />
                </div>
                <Select value={contractsTable.filters.status || 'all'} onValueChange={v => contractsTable.setFilter('status', v)}>
                  <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="review">Under Review</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={contractsTable.filters.type || 'all'} onValueChange={v => contractsTable.setFilter('type', v)}>
                  <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="Supplier">Supplier</SelectItem>
                    <SelectItem value="User Terms">User Terms</SelectItem>
                    <SelectItem value="Partner">Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead column="id" currentSort={contractsTable.sortColumn as string} direction={contractsTable.sortDirection} onSort={c => contractsTable.toggleSort(c as keyof typeof contracts[0])}>ID</SortableTableHead>
                    <SortableTableHead column="type" currentSort={contractsTable.sortColumn as string} direction={contractsTable.sortDirection} onSort={c => contractsTable.toggleSort(c as keyof typeof contracts[0])}>Contract Type</SortableTableHead>
                    <TableHead>Status</TableHead>
                    <SortableTableHead column="expiry" currentSort={contractsTable.sortColumn as string} direction={contractsTable.sortDirection} onSort={c => contractsTable.toggleSort(c as keyof typeof contracts[0])}>Expiry Date</SortableTableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractsTable.processedData.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.id}</TableCell>
                      <TableCell>{c.type}</TableCell>
                      <TableCell>{getStatusBadge(c.status)}</TableCell>
                      <TableCell>{c.expiry}</TableCell>
                      <TableCell><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                  {contractsTable.processedData.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Aucun résultat</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Watchlist & Alerts */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Watchlist & Alerts</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((a) => (
                <div key={a.id} className="p-3 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between">
                    {getSeverityBadge(a.severity)}
                    <span className="text-xs font-medium">{a.priority}</span>
                  </div>
                  <p className="font-semibold text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{a.date}</span>
                    <Button size="sm" variant={a.severity === 'urgent' ? 'destructive' : 'outline'} className="text-xs h-7">
                      {a.action}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
