import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Bell, Inbox, Loader2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const db = supabase as any;
type Severity = 'critical' | 'high' | 'medium';
export interface HrAlert {
  id: string;
  category: string;
  severity: Severity;
  title: string;
  detail: string;
  due?: string | null;
  link: string;
}

const SEV: Record<Severity, { label: string; tone: 'destructive' | 'default' | 'secondary' }> = {
  critical: { label: 'Critique', tone: 'destructive' },
  high: { label: 'Haute', tone: 'default' },
  medium: { label: 'Moyenne', tone: 'secondary' },
};

const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);

/** Alertes RH dérivées uniquement de données réelles (RLS appliquée). */
export function useHrAlerts() {
  return useQuery({
    queryKey: ['hr-alerts'],
    queryFn: async (): Promise<HrAlert[]> => {
      const [docs, reqs, leaves, trainings, profiles] = await Promise.all([
        db.from('rh_employee_documents').select('id, employee_id, name, expires_at').not('expires_at', 'is', null),
        db.from('hr_employee_requests').select('id, reference, first_name, last_name, status, created_at, start_date').in('status', ['submitted', 'hr_validated']),
        db.from('hr_leave_requests').select('id, employee_id, start_date, status').eq('status', 'pending'),
        db.from('hr_trainings').select('id, title, employee_id, due_date, status').in('status', ['planned', 'in_progress']).not('due_date', 'is', null),
        db.from('profiles').select('id, first_name, last_name').eq('test_account', false),
      ]);
      const name = (id: string) => {
        const p = (profiles.data ?? []).find((x: any) => x.id === id);
        return p ? `${p.first_name} ${p.last_name}` : 'Collaborateur';
      };
      const out: HrAlert[] = [];
      for (const d of docs.data ?? []) {
        const n = daysUntil(d.expires_at);
        if (n > 30) continue;
        out.push({ id: `doc-${d.id}`, category: 'Document', severity: n < 0 ? 'critical' : n <= 14 ? 'high' : 'medium',
          title: n < 0 ? `Document expiré : ${d.name}` : `Document à renouveler : ${d.name}`,
          detail: `${name(d.employee_id)} · ${n < 0 ? `expiré depuis ${-n} j` : `expire dans ${n} j`}`, due: d.expires_at, link: '/pole/rh/files' });
      }
      for (const r of reqs.data ?? []) {
        const age = -daysUntil(r.created_at);
        out.push({ id: `onb-${r.id}`, category: 'Onboarding', severity: age > 7 ? 'high' : 'medium',
          title: `Dossier ${r.reference} ${r.status === 'submitted' ? 'à valider (RH)' : 'compte à créer (Tech)'}`,
          detail: `${r.first_name} ${r.last_name} · en attente depuis ${age} j`, due: r.start_date, link: '/pole/rh/onboarding' });
      }
      for (const l of leaves.data ?? []) {
        const n = daysUntil(l.start_date);
        out.push({ id: `leave-${l.id}`, category: 'Congés', severity: n <= 3 ? 'high' : 'medium',
          title: 'Demande de congé à traiter', detail: `${name(l.employee_id)} · début dans ${n} j`, due: l.start_date, link: '/pole/rh/leave' });
      }
      for (const t of trainings.data ?? []) {
        const n = daysUntil(t.due_date);
        if (n > 14) continue;
        out.push({ id: `tr-${t.id}`, category: 'Formation', severity: n < 0 ? 'high' : 'medium',
          title: n < 0 ? `Formation en retard : ${t.title}` : `Échéance formation : ${t.title}`,
          detail: `${t.employee_id ? name(t.employee_id) : '—'} · ${n < 0 ? `${-n} j de retard` : `dans ${n} j`}`, due: t.due_date, link: '/pole/rh/training' });
      }
      const order = { critical: 0, high: 1, medium: 2 };
      return out.sort((a, b) => order[a.severity] - order[b.severity]);
    },
    staleTime: 30_000,
  });
}

export default function HRAlerts() {
  const { data = [], isLoading, error } = useHrAlerts();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const cats = Array.from(new Set(data.map((a) => a.category)));
  const rows = useMemo(() => data.filter((a) =>
    (cat === 'all' || a.category === cat) &&
    (!search || `${a.title} ${a.detail}`.toLowerCase().includes(search.toLowerCase()))), [data, cat, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alertes RH</h1>
        <p className="text-muted-foreground">Actions RH nécessaires, calculées à partir des dossiers, documents, congés et formations</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {(['critical', 'high', 'medium'] as Severity[]).map((s) => (
          <Card key={s}><CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{SEV[s].label}</p>
            <p className="text-2xl font-semibold">{data.filter((a) => a.severity === s).length}</p>
          </CardContent></Card>
        ))}
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-semibold">{data.length}</p>
        </CardContent></Card>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Card><CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center gap-2 p-10 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Chargement…</div>
        ) : error ? (
          <div className="flex justify-center gap-2 p-10 text-destructive"><AlertTriangle className="h-4 w-4" />{(error as Error).message}</div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-muted-foreground"><Inbox className="h-6 w-6" />Aucune alerte RH active.</div>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Gravité</TableHead><TableHead>Catégorie</TableHead><TableHead>Alerte</TableHead><TableHead>Échéance</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell><Badge variant={SEV[a.severity].tone}>{SEV[a.severity].label}</Badge></TableCell>
                  <TableCell>{a.category}</TableCell>
                  <TableCell><p className="font-medium">{a.title}</p><p className="text-sm text-muted-foreground">{a.detail}</p></TableCell>
                  <TableCell>{a.due ? new Date(a.due).toLocaleDateString('fr-FR') : '—'}</TableCell>
                  <TableCell><Link to={a.link} className="inline-flex items-center gap-1 text-sm text-primary hover:underline"><Bell className="h-3 w-3" />Traiter</Link></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}
