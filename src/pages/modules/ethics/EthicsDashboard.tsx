import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { FileText, Search, Eye, AlertTriangle, CheckCircle, Clock, Users, Shield } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// KPIs
const kpis = [
  { label: 'New Reports', value: 4, icon: FileText, color: 'bg-blue-500 text-white' },
  { label: 'Open Cases', value: 12, icon: AlertTriangle, color: 'bg-orange-500 text-white' },
  { label: 'Under Investigation', value: 7, icon: Search, color: 'bg-muted text-foreground' },
  { label: 'Closed Cases', value: 28, icon: CheckCircle, color: 'bg-muted text-foreground' },
];

// Category breakdown donuts
const categoryData = [
  { name: 'Harassment', value: 35, color: 'hsl(var(--chart-1))' },
  { name: 'Discrimination', value: 25, color: 'hsl(var(--chart-2))' },
  { name: 'Fraud/Misconduct', value: 20, color: 'hsl(var(--chart-3))' },
  { name: 'Other', value: 20, color: 'hsl(var(--chart-4))' },
];

const priorityData = [
  { name: 'Urgent', value: 32, color: 'hsl(var(--destructive))' },
  { name: 'Moderate', value: 45, color: 'hsl(var(--chart-3))' },
  { name: 'Low', value: 23, color: 'hsl(var(--chart-2))' },
];

const sourceData = [
  { name: 'Anonymous', value: 53, color: 'hsl(var(--chart-1))' },
  { name: 'Identified', value: 29, color: 'hsl(var(--chart-2))' },
  { name: 'Fraud', value: 18, color: 'hsl(var(--chart-4))' },
];

// New Reports
const newReports = [
  { id: 'I-209', caseType: 'Harassment', priority: 'P1', priorityLabel: 'Urgent', reported: 'Apr 25', investigator: 'Alex M.' },
  { id: 'I-208', caseType: 'Power Abuse', priority: 'P2', priorityLabel: 'Moderate', reported: 'Apr 24', investigator: 'Julia L.' },
  { id: 'I-207', caseType: 'Discrimination', priority: 'P3', priorityLabel: 'Low', reported: 'Apr 23', investigator: 'Unassigned' },
  { id: 'I-206', caseType: 'Fraud', priority: 'P3', priorityLabel: 'Low', reported: 'Apr 22', investigator: 'Unassigned' },
  { id: 'I-199', caseType: 'Derek Jones', priority: 'P1', priorityLabel: 'Ongoing', reported: 'Apr 15', investigator: '' },
];

// Open Reports
const openReports = [
  { id: 'I-204', caseType: 'Harassment', priority: 'P2', status: 'Escalate', investigator: 'Alex M.', action: 'Details' },
  { id: 'I-196', caseType: 'Discrimination', priority: 'P2', status: 'Moderate', investigator: 'Gabriel T.', action: 'Escalate' },
  { id: 'I-192', caseType: 'Power Abuse', priority: 'P1', status: 'Due Diligence', investigator: 'Julia L.', action: 'Details' },
  { id: 'I-189', caseType: 'Fraud', priority: 'P4', status: 'Low', investigator: '', action: 'Details' },
  { id: 'I-177', caseType: 'Discrimination', priority: 'P2', status: 'Moderate', investigator: 'Kevin S.', action: 'Escalate' },
];

// Whistleblowing Log
const whistleblowingLog = [
  { id: 'I-166', caseType: 'Fraud', priority: 'P1', priorityLabel: 'Urgent', status: 'Closed', date: 'Apr 15' },
  { id: 'I-152', caseType: 'Harassment', priority: 'P2', priorityLabel: 'Moderate', status: 'Closed', date: 'Apr 2' },
  { id: 'I-148', caseType: 'Discrimination', priority: 'P3', priorityLabel: 'Low', status: 'Closed', date: 'Mar 28' },
];

// Investigators
const investigators = [
  { id: 'I-102', caseType: 'Ethics', priority: 'Prior', status: 'Closed', date: 'Apr 15', investigator: 'Gabriel T.' },
  { id: 'I-152', caseType: 'Harassment', priority: 'Investigative', status: 'Closed', date: 'Apr 2', investigator: 'Alex M.' },
];

const getPriorityBadge = (priority: string) => {
  const map: Record<string, string> = {
    P1: 'bg-destructive text-destructive-foreground',
    P2: 'bg-orange-500 text-white',
    P3: 'bg-blue-500 text-white',
    P4: 'bg-muted text-muted-foreground',
  };
  return <Badge className={`text-[10px] ${map[priority] || ''}`}>{priority}</Badge>;
};

export default function EthicsDashboard() {
  const newReportsTable = useTableInteractions({
    data: newReports,
    searchFields: ['id', 'caseType', 'investigator'],
  });

  const openReportsTable = useTableInteractions({
    data: openReports,
    searchFields: ['id', 'caseType', 'investigator'],
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Ethics & Whistleblowing</h1>
        <p className="text-muted-foreground">Gestion des signalements, investigations et conformité éthique</p>
      </div>

      {/* KPIs */}
      <Card>
        <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.label} className={`rounded-lg p-4 ${k.color}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{k.label}</p>
                  <k.icon className="h-5 w-5 opacity-70" />
                </div>
                <p className="text-3xl font-bold mt-2">{k.value}</p>
              </div>
            ))}
          </div>

          {/* Category donuts */}
          <div className="grid gap-4 md:grid-cols-3 mt-6">
            {[
              { title: 'By Category', data: categoryData },
              { title: 'By Priority', data: priorityData },
              { title: 'By Source', data: sourceData },
            ].map((chart) => (
              <div key={chart.title} className="rounded-lg border p-4">
                <p className="text-sm font-medium text-center mb-2">{chart.title}</p>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie data={chart.data} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2} dataKey="value">
                      {chart.data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 text-xs mt-2">
                  {chart.data.map((d) => (
                    <div key={d.name} className="flex justify-between">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                        <span>{d.name}</span>
                      </div>
                      <span className="font-semibold">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New Reports + Open Reports */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New Reports</CardTitle>
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={newReportsTable.searchQuery} onChange={e => newReportsTable.setSearchQuery(e.target.value)} className="pl-8 h-9" />
              </div>
              <Select value={newReportsTable.filters.priority || 'all'} onValueChange={v => newReportsTable.setFilter('priority', v)}>
                <SelectTrigger className="w-[100px] h-9"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="P1">P1</SelectItem>
                  <SelectItem value="P2">P2</SelectItem>
                  <SelectItem value="P3">P3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="id" currentSort={newReportsTable.sortColumn as string} direction={newReportsTable.sortDirection} onSort={c => newReportsTable.toggleSort(c as keyof typeof newReports[0])}>ID</SortableTableHead>
                  <TableHead>Case Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <SortableTableHead column="reported" currentSort={newReportsTable.sortColumn as string} direction={newReportsTable.sortDirection} onSort={c => newReportsTable.toggleSort(c as keyof typeof newReports[0])}>Reported</SortableTableHead>
                  <TableHead>Investigator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newReportsTable.processedData.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                        {r.caseType}
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(r.priority)} <span className="text-xs text-muted-foreground ml-1">{r.priorityLabel}</span></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.reported}</TableCell>
                    <TableCell className="text-sm">{r.investigator || <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open Reports</CardTitle>
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={openReportsTable.searchQuery} onChange={e => openReportsTable.setSearchQuery(e.target.value)} className="pl-8 h-9" />
              </div>
              <Select value={openReportsTable.filters.priority || 'all'} onValueChange={v => openReportsTable.setFilter('priority', v)}>
                <SelectTrigger className="w-[100px] h-9"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="P1">P1</SelectItem>
                  <SelectItem value="P2">P2</SelectItem>
                  <SelectItem value="P4">P4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="id" currentSort={openReportsTable.sortColumn as string} direction={openReportsTable.sortDirection} onSort={c => openReportsTable.toggleSort(c as keyof typeof openReports[0])}>ID</SortableTableHead>
                  <TableHead>Case Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Investigator</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openReportsTable.processedData.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                        {r.caseType}
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(r.priority)}</TableCell>
                    <TableCell><span className="text-xs">{r.status}</span></TableCell>
                    <TableCell className="text-sm">{r.investigator || '—'}</TableCell>
                    <TableCell>
                      <Button size="sm" variant={r.action === 'Escalate' ? 'destructive' : 'outline'} className="text-xs h-7">
                        {r.action === 'Details' && <Eye className="h-3 w-3 mr-1" />}
                        {r.action}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Whistleblowing Log + Investigators */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Whistleblowing Log</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Case Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {whistleblowingLog.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {w.caseType}
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(w.priority)} <span className="text-xs ml-1">{w.priorityLabel}</span></TableCell>
                    <TableCell><Badge variant="secondary">{w.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{w.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Investigators</CardTitle>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">Assign New Case</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Case Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Investigator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investigators.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {inv.caseType}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{inv.priority}</Badge></TableCell>
                    <TableCell><Badge className="bg-emerald-500 text-white text-xs">{inv.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{inv.date}</TableCell>
                    <TableCell className="text-sm">{inv.investigator}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
