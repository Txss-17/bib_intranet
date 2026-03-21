import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { Switch } from '@/components/ui/switch';
import { Search, Shield, Users, Eye, Lock } from 'lucide-react';

const moduleAccessData = [
  { id: 1, user: 'Sarah Martin', role: 'Directrice Générale', direction: true, finance: true, ops: true, tech: true, rh: true, supplier: true, audit: true, compliance: true, rse: true, marketing: true, risk: true, lifecycle: true },
  { id: 2, user: 'Marc Leblanc', role: 'DAF', direction: false, finance: true, ops: false, tech: false, rh: false, supplier: false, audit: true, compliance: true, rse: false, marketing: false, risk: true, lifecycle: false },
  { id: 3, user: 'Julie Dupont', role: 'Head of Ops', direction: false, finance: false, ops: true, tech: false, rh: false, supplier: true, audit: false, compliance: false, rse: true, marketing: false, risk: true, lifecycle: true },
  { id: 4, user: 'Pierre Klein', role: 'CTO', direction: false, finance: false, ops: false, tech: true, rh: false, supplier: false, audit: false, compliance: false, rse: false, marketing: false, risk: true, lifecycle: false },
  { id: 5, user: 'Marie Laurent', role: 'DRH', direction: false, finance: false, ops: false, tech: false, rh: true, supplier: false, audit: false, compliance: true, rse: false, marketing: false, risk: false, lifecycle: false },
  { id: 6, user: 'Thomas Bernard', role: 'Head of Marketing', direction: false, finance: false, ops: false, tech: false, rh: false, supplier: false, audit: false, compliance: false, rse: false, marketing: true, risk: false, lifecycle: true },
];

const modules = [
  { key: 'direction', label: 'Direction' },
  { key: 'finance', label: 'Finance' },
  { key: 'ops', label: 'Ops' },
  { key: 'tech', label: 'Tech' },
  { key: 'rh', label: 'RH' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'audit', label: 'Audit' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'rse', label: 'RSE' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'risk', label: 'Risk' },
  { key: 'lifecycle', label: 'Lifecycle' },
];

const kpis = [
  { label: 'Utilisateurs', value: 24, icon: Users, color: 'text-primary', bgColor: 'bg-primary/10' },
  { label: 'Modules actifs', value: 12, icon: Shield, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  { label: 'Accès en lecture', value: 48, icon: Eye, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { label: 'Restrictions', value: 15, icon: Lock, color: 'text-destructive', bgColor: 'bg-destructive/10' },
];

export default function ModuleAccess() {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = moduleAccessData.filter(u => {
    if (searchQuery && !u.user.toLowerCase().includes(searchQuery.toLowerCase()) && !u.role.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Accès Lecture Modules</h1>
        <p className="text-muted-foreground">Gestion des droits d'accès en lecture seule par utilisateur et module</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map(k => (
          <Card key={k.label}><CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
                <p className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</p>
              </div>
              <div className={`h-10 w-10 rounded-lg ${k.bgColor} flex items-center justify-center`}><k.icon className={`h-5 w-5 ${k.color}`} /></div>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Matrice d'Accès</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un utilisateur..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10">Utilisateur</TableHead>
                  <TableHead className="sticky left-0 bg-background z-10">Rôle</TableHead>
                  {modules.map(m => (
                    <TableHead key={m.key} className="text-center text-xs whitespace-nowrap">{m.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium whitespace-nowrap">{u.user}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{u.role}</TableCell>
                    {modules.map(m => (
                      <TableCell key={m.key} className="text-center">
                        <Switch checked={u[m.key as keyof typeof u] as boolean} disabled className="data-[state=checked]:bg-primary" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
