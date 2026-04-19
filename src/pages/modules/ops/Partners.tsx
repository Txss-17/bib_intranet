import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOpsPartners } from '@/hooks/useOpsControl';
import { Search, Loader2 } from 'lucide-react';

interface PartnerEnriched {
  id: string;
  name: string;
  type: string | null;
  status: string | null;
  region: string | null;
  contact_email: string | null;
  volume_processed: number | null;
  avg_lead_time_hours: number | null;
  error_rate: number | null;
}

const Partners = () => {
  const { data: partners = [], isLoading } = useOpsPartners();
  const [q, setQ] = useState('');

  const list = (partners as PartnerEnriched[]).filter(
    (p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || (p.region ?? '').toLowerCase().includes(q.toLowerCase())
  );

  const active = (partners as PartnerEnriched[]).filter((p) => p.status === 'active').length;
  const totalVol = (partners as PartnerEnriched[]).reduce((a, p) => a + (p.volume_processed ?? 0), 0);
  const avgErr =
    partners.length === 0
      ? 0
      : (partners as PartnerEnriched[]).reduce((a, p) => a + (p.error_rate ?? 0), 0) / partners.length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Partenaires logistiques</h1>
        <p className="text-muted-foreground">Pilotage : volume, délais, taux d'erreur</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{partners.length}</div><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-success">{active}</div><p className="text-xs text-muted-foreground">Actifs</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{totalVol.toLocaleString()}</div><p className="text-xs text-muted-foreground">Volume traité</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{avgErr.toFixed(1)}%</div><p className="text-xs text-muted-foreground">Taux d'erreur moyen</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Liste ({list.length})</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Nom ou région…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partenaire</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Région</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Délai moyen</TableHead>
                <TableHead>Taux d'erreur</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><Badge variant="outline">{p.type ?? '—'}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{p.region ?? '—'}</TableCell>
                  <TableCell className="text-right">{(p.volume_processed ?? 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{p.avg_lead_time_hours ?? 0}h</TableCell>
                  <TableCell className="w-40">
                    <div className="flex items-center gap-2">
                      <Progress value={Math.min((p.error_rate ?? 0) * 10, 100)} className="h-2 flex-1" />
                      <span className="text-xs">{(p.error_rate ?? 0).toFixed(1)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'active' ? 'secondary' : 'outline'}>{p.status}</Badge>
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

export default Partners;
