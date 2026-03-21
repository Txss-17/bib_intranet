import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { Search, ShieldCheck, AlertTriangle, CheckCircle, Clock, Eye } from 'lucide-react';

const complianceData = [
  { id: 'CMP-001', entity: 'EcoStore Paris', type: 'boutique', kycStatus: 'valid', documentsStatus: 'complete', rseScore: 92, lastCheck: '15/03/2025', nextReview: '15/06/2025', overallStatus: 'compliant' },
  { id: 'CMP-002', entity: 'GreenLeaf SARL', type: 'supplier', kycStatus: 'expired', documentsStatus: 'incomplete', rseScore: 45, lastCheck: '01/02/2025', nextReview: '01/04/2025', overallStatus: 'non_compliant' },
  { id: 'CMP-003', entity: 'BioConnect GmbH', type: 'supplier', kycStatus: 'valid', documentsStatus: 'complete', rseScore: 88, lastCheck: '10/03/2025', nextReview: '10/06/2025', overallStatus: 'compliant' },
  { id: 'CMP-004', entity: 'NaturBoutique Lyon', type: 'boutique', kycStatus: 'pending', documentsStatus: 'incomplete', rseScore: 60, lastCheck: '20/02/2025', nextReview: '20/04/2025', overallStatus: 'at_risk' },
  { id: 'CMP-005', entity: 'EthicSupply Ltd', type: 'supplier', kycStatus: 'valid', documentsStatus: 'complete', rseScore: 95, lastCheck: '18/03/2025', nextReview: '18/06/2025', overallStatus: 'compliant' },
  { id: 'CMP-006', entity: 'PlanetShop Bordeaux', type: 'boutique', kycStatus: 'expired', documentsStatus: 'complete', rseScore: 72, lastCheck: '05/01/2025', nextReview: '05/04/2025', overallStatus: 'at_risk' },
];

const kpis = [
  { label: 'Conformes', value: '78%', icon: ShieldCheck, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  { label: 'Non-conformes', value: 12, icon: AlertTriangle, color: 'text-destructive', bgColor: 'bg-destructive/10' },
  { label: 'Revue à venir (30j)', value: 18, icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { label: 'KYC expirés', value: 7, icon: AlertTriangle, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  compliant: { label: 'Conforme', variant: 'default' },
  at_risk: { label: 'À risque', variant: 'secondary' },
  non_compliant: { label: 'Non-conforme', variant: 'destructive' },
};

const kycConfig: Record<string, { label: string; color: string }> = {
  valid: { label: 'Valide', color: 'text-emerald-500' },
  pending: { label: 'En attente', color: 'text-orange-500' },
  expired: { label: 'Expiré', color: 'text-destructive' },
};

export default function ComplianceStatus() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [filters, setFiltersState] = useState<Record<string, string>>({});
  const setFilter = (key: string, value: string) => setFiltersState(prev => ({ ...prev, [key]: value }));
  const toggleSort = (col: string) => {
    if (sortColumn === col) { if (sortDirection === 'asc') setSortDirection('desc'); else { setSortColumn(null); setSortDirection(null); } }
    else { setSortColumn(col); setSortDirection('asc'); }
  };

  const filtered = complianceData
    .filter(c => {
      if (searchQuery && !c.entity.toLowerCase().includes(searchQuery.toLowerCase()) && !c.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filters.type && filters.type !== 'all' && c.type !== filters.type) return false;
      if (filters.status && filters.status !== 'all' && c.overallStatus !== filters.status) return false;
      return true;
    })
    .sort((a, b) => {
      if (!sortColumn || !sortDirection) return 0;
      const dir = sortDirection === 'asc' ? 1 : -1;
      const av = a[sortColumn as keyof typeof a]; const bv = b[sortColumn as keyof typeof b];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Statut Conformité</h1>
        <p className="text-muted-foreground">Suivi KYC, documents et conformité RSE des partenaires</p>
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
            <CardTitle>Statut des Partenaires</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-48" />
              </div>
              <Select value={filters.type || 'all'} onValueChange={v => setFilter('type', v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="boutique">Boutique</SelectItem>
                  <SelectItem value="supplier">Fournisseur</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.status || 'all'} onValueChange={v => setFilter('status', v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="compliant">Conforme</SelectItem>
                  <SelectItem value="at_risk">À risque</SelectItem>
                  <SelectItem value="non_compliant">Non-conforme</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="id" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>ID</SortableTableHead>
                <SortableTableHead column="entity" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Entité</SortableTableHead>
                <TableHead>Type</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Documents</TableHead>
                <SortableTableHead column="rseScore" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Score RSE</SortableTableHead>
                <TableHead>Statut</TableHead>
                <SortableTableHead column="nextReview" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Prochaine revue</SortableTableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.id}</TableCell>
                  <TableCell className="font-medium">{c.entity}</TableCell>
                  <TableCell><Badge variant="outline">{c.type === 'boutique' ? 'Boutique' : 'Fournisseur'}</Badge></TableCell>
                  <TableCell><span className={`font-medium text-sm ${kycConfig[c.kycStatus].color}`}>{kycConfig[c.kycStatus].label}</span></TableCell>
                  <TableCell><Badge variant={c.documentsStatus === 'complete' ? 'default' : 'destructive'}>{c.documentsStatus === 'complete' ? 'Complet' : 'Incomplet'}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={c.rseScore} className="h-2 w-16" />
                      <span className="text-xs">{c.rseScore}%</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={statusConfig[c.overallStatus].variant}>{statusConfig[c.overallStatus].label}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.nextReview}</TableCell>
                  <TableCell><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
