import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Search, AlertCircle, Inbox } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const db = supabase as any;

export type FieldType = 'text' | 'textarea' | 'date' | 'time' | 'select' | 'employee' | 'position' | 'pole';
export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  inTable?: boolean;
  defaultValue?: string;
  /** Champ masqué pour un collaborateur non-RH (ex. choix du collaborateur) */
  hrOnly?: boolean;
}
export interface HrRecordsConfig {
  table: string;
  title: string;
  description?: string;
  itemLabel: string;
  fields: FieldDef[];
  statuses: { value: string; label: string; tone?: 'default' | 'secondary' | 'destructive' | 'outline' }[];
  searchKeys: string[];
  orderBy: string;
  /** Actions de statut rapides (RH uniquement) */
  transitions?: Record<string, string[]>;
  /** Un collaborateur non-RH peut créer pour lui-même */
  selfService?: boolean;
  employeeKey?: string;
  dateKey?: string;
}

const POLES = ['direction','finance','ops','tech','rh','supplier','audit','compliance','rse','marketing','risk','lifecycle'];

export function useIsHr() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['is-hr', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await db.rpc('can_access_rh_profiles', { _uid: user!.id });
      return !!data;
    },
  });
}

export function HrRecordsPage({ config }: { config: HrRecordsConfig }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: isHr = false } = useIsHr();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const key = ['hr-records', config.table];

  const records = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await db.from(config.table).select('*').order(config.orderBy, { ascending: false }).limit(500);
      if (error) throw error;
      return (data ?? []) as Record<string, any>[];
    },
  });

  const needsEmployees = config.fields.some((f) => f.type === 'employee');
  const employees = useQuery({
    queryKey: ['hr-employee-options'],
    enabled: needsEmployees,
    queryFn: async () => {
      const { data } = await db.from('profiles').select('id, first_name, last_name, email').eq('test_account', false).order('first_name');
      return (data ?? []) as { id: string; first_name: string; last_name: string; email: string }[];
    },
  });
  const positions = useQuery({
    queryKey: ['hr-position-options'],
    enabled: config.fields.some((f) => f.type === 'position'),
    queryFn: async () => {
      const { data } = await db.from('rh_position_catalog').select('position_key, label').eq('active', true).order('label');
      return (data ?? []) as { position_key: string; label: string }[];
    },
  });

  const empName = (id?: string | null) => {
    if (!id) return '—';
    const e = employees.data?.find((x) => x.id === id);
    if (e) return `${e.first_name} ${e.last_name}`;
    return id === user?.id ? 'Moi' : '—';
  };
  const posLabel = (k?: string) => positions.data?.find((p) => p.position_key === k)?.label ?? k ?? '—';
  const statusDef = (v: string) => config.statuses.find((s) => s.value === v);

  const display = (f: FieldDef, row: Record<string, any>) => {
    const v = row[f.key];
    if (f.type === 'employee') return empName(v);
    if (f.type === 'position') return posLabel(v);
    if (f.type === 'select') return f.options?.find((o) => o.value === v)?.label ?? v ?? '—';
    if (f.type === 'date' && v) return new Date(v).toLocaleDateString('fr-FR');
    return v ?? '—';
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (records.data ?? []).filter((r) => {
      if (status !== 'all' && r.status !== status) return false;
      if (config.employeeKey && employeeFilter !== 'all' && r[config.employeeKey] !== employeeFilter) return false;
      if (config.dateKey && from && r[config.dateKey] < from) return false;
      if (config.dateKey && to && r[config.dateKey] > to) return false;
      if (!q) return true;
      return config.searchKeys.some((k) => {
        const f = config.fields.find((x) => x.key === k);
        const val = f ? String(display(f, r)) : String(r[k] ?? '');
        return val.toLowerCase().includes(q);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records.data, search, status, employeeFilter, from, to, employees.data, positions.data]);

  const create = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {};
      config.fields.forEach((f) => { if (form[f.key]) payload[f.key] = form[f.key]; });
      if (config.employeeKey && !isHr) payload[config.employeeKey] = user?.id;
      const missing = config.fields.find((f) => f.required && (!f.hrOnly || isHr) && !payload[f.key]);
      if (missing) throw new Error(`Le champ « ${missing.label} » est obligatoire.`);
      const { error } = await db.from(config.table).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      setOpen(false); setForm({});
      toast({ title: `${config.itemLabel} enregistré(e)` });
    },
    onError: (e: Error) => toast({ title: 'Enregistrement impossible', description: e.message, variant: 'destructive' }),
  });

  const setStatusMut = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: string }) => {
      const { error } = await db.from(config.table).update({ status: next }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast({ title: 'Statut mis à jour' }); },
    onError: (e: Error) => toast({ title: 'Action refusée', description: e.message, variant: 'destructive' }),
  });

  const canCreate = isHr || config.selfService;
  const tableFields = config.fields.filter((f) => f.inTable !== false);
  const formFields = config.fields.filter((f) => !f.hrOnly || isHr);

  const openCreate = () => {
    const init: Record<string, string> = {};
    config.fields.forEach((f) => { if (f.defaultValue) init[f.key] = f.defaultValue; });
    setForm(init); setOpen(true);
  };

  const renderInput = (f: FieldDef) => {
    const v = form[f.key] ?? '';
    const set = (val: string) => setForm((p) => ({ ...p, [f.key]: val }));
    if (f.type === 'textarea') return <Textarea value={v} onChange={(e) => set(e.target.value)} />;
    if (f.type === 'date' || f.type === 'time' || f.type === 'text')
      return <Input type={f.type === 'text' ? 'text' : f.type} value={v} onChange={(e) => set(e.target.value)} />;
    const opts = f.type === 'employee'
      ? (employees.data ?? []).map((e) => ({ value: e.id, label: `${e.first_name} ${e.last_name}` }))
      : f.type === 'position'
        ? (positions.data ?? []).map((p) => ({ value: p.position_key, label: p.label }))
        : f.type === 'pole' ? POLES.map((p) => ({ value: p, label: p.toUpperCase() })) : f.options ?? [];
    return (
      <Select value={v} onValueChange={set}>
        <SelectTrigger><SelectValue placeholder={opts.length ? 'Sélectionner' : 'Aucune option disponible'} /></SelectTrigger>
        <SelectContent>{opts.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{config.title}</h1>
          {config.description && <p className="text-muted-foreground">{config.description}</p>}
        </div>
        {canCreate && <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nouveau</Button>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {config.statuses.slice(0, 4).map((s) => (
          <Card key={s.value} className="cursor-pointer" onClick={() => setStatus(status === s.value ? 'all' : s.value)}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-semibold">{(records.data ?? []).filter((r) => r.status === s.value).length}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {config.statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {config.employeeKey && isHr && (
          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les collaborateurs</SelectItem>
              {(employees.data ?? []).map((e) => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {config.dateKey && (
          <>
            <Input type="date" className="w-[160px]" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Du" />
            <Input type="date" className="w-[160px]" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Au" />
          </>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {records.isLoading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Chargement…</div>
          ) : records.error ? (
            <div className="flex items-center justify-center gap-2 p-10 text-destructive"><AlertCircle className="h-4 w-4" />{(records.error as Error).message}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
              <Inbox className="h-6 w-6" />
              <p>{(records.data ?? []).length === 0 ? `Aucun(e) ${config.itemLabel.toLowerCase()} enregistré(e) pour le moment.` : 'Aucun résultat pour ces filtres.'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {tableFields.map((f) => <TableHead key={f.key}>{f.label}</TableHead>)}
                  <TableHead>Statut</TableHead>
                  {isHr && config.transitions && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const sd = statusDef(r.status);
                  const nexts = config.transitions?.[r.status] ?? [];
                  return (
                    <TableRow key={r.id}>
                      {tableFields.map((f) => <TableCell key={f.key}>{display(f, r)}</TableCell>)}
                      <TableCell><Badge variant={sd?.tone ?? 'secondary'}>{sd?.label ?? r.status}</Badge></TableCell>
                      {isHr && config.transitions && (
                        <TableCell className="space-x-1 text-right">
                          {nexts.map((n) => (
                            <Button key={n} size="sm" variant="outline" disabled={setStatusMut.isPending}
                              onClick={() => setStatusMut.mutate({ id: r.id, next: n })}>
                              {statusDef(n)?.label ?? n}
                            </Button>
                          ))}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nouveau — {config.itemLabel}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {formFields.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label>{f.label}{f.required ? ' *' : ''}</Label>
                {renderInput(f)}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default HrRecordsPage;
