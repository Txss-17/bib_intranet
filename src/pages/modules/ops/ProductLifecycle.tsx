import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { GitBranch, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  LifecycleProduct, LifecycleStatus, LIFECYCLE_LABELS, LIFECYCLE_TRANSITIONS,
  useLifecycleActions, useLifecycleProducts, useProductDecisions,
} from '@/hooks/useProductLifecycle';

const variant = (s: LifecycleStatus) =>
  s === 'rejected' ? 'destructive' : s === 'active' || s === 'approved' ? 'default' : 'outline';

const fmtPrice = (v: number | null, c: string | null) =>
  v === null ? '—' : `${v.toFixed(2)} ${c ?? 'EUR'}`;

export default function ProductLifecycle() {
  const { data: rows = [], isLoading } = useLifecycleProducts();
  const { move } = useLifecycleActions();
  const [q, setQ] = useState('');
  const [step, setStep] = useState<string>('open');
  const [selId, setSelId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const sel = rows.find((r) => r.id === selId) ?? null;
  const { data: decisions = [] } = useProductDecisions(sel?.id);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (step === 'all' ||
            (step === 'open'
              ? !['archived', 'rejected'].includes(r.lifecycle_status)
              : r.lifecycle_status === step)) &&
          (!q || `${r.name} ${r.sku} ${r.supplier_name}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [rows, q, step],
  );

  const count = (s: LifecycleStatus[]) => rows.filter((r) => s.includes(r.lifecycle_status)).length;

  const go = (p: LifecycleProduct, to: LifecycleStatus) => {
    if (to === 'rejected' && !reason) return;
    move.mutate(
      { id: p.id, to, reason: reason || undefined },
      { onSuccess: () => setReason('') },
    );
  };

  const marginOk = (p: LifecycleProduct) =>
    p.unit_price !== null && p.selling_price !== null && p.selling_price >= p.unit_price * 1.2 - 0.001;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <GitBranch className="h-5 w-5" />
          Cycle de vie produits
        </h1>
        <p className="text-sm text-muted-foreground">
          Brouillon → revue → audit → validation → actif → suspendu → archivé. Prix de vente minimum : coût × 1,20.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {([
          ['À traiter', ['draft', 'review']],
          ['En audit', ['audit_required', 'audit']],
          ['Validés', ['approved']],
          ['Actifs', ['active']],
          ['Refusés / archivés', ['rejected', 'archived']],
        ] as [string, LifecycleStatus[]][]).map(([l, s]) => (
          <Card key={l}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{l}</p>
              <p className="text-2xl font-semibold">{count(s)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={step} onValueChange={setStep}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">En cours</SelectItem>
            <SelectItem value="all">Tous</SelectItem>
            {Object.entries(LIFECYCLE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Aucun produit.</p>
          ) : (
            <ul className="divide-y">
              {filtered.map((p) => (
                <li key={p.id}>
                  <button
                    className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/50"
                    onClick={() => setSelId(p.id)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.sku ?? '—'} · {p.supplier_name ?? 'Sans fournisseur'} · Coût {fmtPrice(p.unit_price, p.currency)} → Vente {fmtPrice(p.selling_price, p.currency)}
                      </span>
                    </span>
                    <Badge variant={variant(p.lifecycle_status)}>{LIFECYCLE_LABELS[p.lifecycle_status]}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!sel} onOpenChange={(o) => !o && setSelId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {sel && (
            <>
              <SheetHeader>
                <SheetTitle>{sel.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-5 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={variant(sel.lifecycle_status)}>{LIFECYCLE_LABELS[sel.lifecycle_status]}</Badge>
                  <span className="text-muted-foreground">
                    {sel.sku ?? '—'} · {sel.category ?? 'Sans catégorie'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-md border p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Coût fournisseur</p>
                    <p className="font-medium">{fmtPrice(sel.unit_price, sel.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Prix de vente</p>
                    <p className="font-medium">{fmtPrice(sel.selling_price, sel.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Marge</p>
                    <p className="font-medium">{sel.margin !== null ? `${sel.margin}%` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">MOQ</p>
                    <p className="font-medium">{sel.moq ?? '—'}</p>
                  </div>
                </div>

                {sel.lifecycle_status === 'approved' && !marginOk(sel) && (
                  <p className="rounded-md border border-destructive/50 p-3 text-xs text-destructive">
                    Activation impossible : le prix de vente doit être au moins égal au coût × 1,20.
                  </p>
                )}
                {sel.rejection_reason && (
                  <div className="rounded-md border p-3">
                    <p className="font-medium">Motif du refus</p>
                    <p className="mt-1">{sel.rejection_reason}</p>
                  </div>
                )}

                {['review', 'audit_required', 'audit'].includes(sel.lifecycle_status) && (
                  <div>
                    <Label>Motif (obligatoire pour un refus)</Label>
                    <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {LIFECYCLE_TRANSITIONS[sel.lifecycle_status].map((to) => (
                    <Button
                      key={to}
                      size="sm"
                      variant={to === 'rejected' ? 'destructive' : 'default'}
                      disabled={
                        move.isPending ||
                        (to === 'rejected' && !reason) ||
                        (to === 'active' && !marginOk(sel))
                      }
                      onClick={() => go(sel, to)}
                    >
                      → {LIFECYCLE_LABELS[to]}
                    </Button>
                  ))}
                </div>

                <div>
                  <p className="mb-2 font-medium">Historique des décisions</p>
                  {decisions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucune décision enregistrée.</p>
                  ) : (
                    <ul className="space-y-2">
                      {decisions.map((d) => (
                        <li key={d.id} className="border-l-2 pl-3">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(d.decision_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                          </span>
                          <p>
                            {d.previous_status
                              ? `${LIFECYCLE_LABELS[d.previous_status as LifecycleStatus] ?? d.previous_status} → `
                              : ''}
                            {LIFECYCLE_LABELS[d.new_status as LifecycleStatus] ?? d.new_status}
                          </p>
                          {d.reason && <p className="text-muted-foreground">{d.reason}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
