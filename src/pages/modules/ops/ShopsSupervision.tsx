import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Store,
  FlaskConical,
  CheckCircle2,
  PauseCircle,
  Plus,
  Search,
  Clock,
  History,
  ShoppingBag,
} from 'lucide-react';
import {
  useShops,
  useShopActions,
  useShopEvents,
  useShopOrderSummaries,
  useShopOrders,
  testDaysLeft,
  SHOP_STATUS_LABELS,
  SHOP_TRANSITIONS,
  type Shop,
  type ShopStatus,
} from '@/hooks/useShops';

const STATUS_FILTERS: Array<{ value: 'all' | ShopStatus; label: string }> = [
  { value: 'all', label: 'Toutes' },
  { value: 'application', label: 'Candidatures' },
  { value: 'review', label: 'En revue' },
  { value: 'test', label: 'En test' },
  { value: 'active', label: 'Actives' },
  { value: 'suspended', label: 'Suspendues' },
  { value: 'closed', label: 'Clôturées' },
];

const statusBadge = (status: ShopStatus) => {
  const label = SHOP_STATUS_LABELS[status];
  switch (status) {
    case 'active':
      return <Badge className="bg-success text-success-foreground">{label}</Badge>;
    case 'test':
      return <Badge className="bg-warning text-warning-foreground">{label}</Badge>;
    case 'suspended':
      return <Badge variant="destructive">{label}</Badge>;
    case 'closed':
      return <Badge variant="outline">{label}</Badge>;
    default:
      return <Badge variant="secondary">{label}</Badge>;
  }
};

const money = (n: number, currency = 'EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

export default function ShopsSupervision() {
  const { data: shops = [], isLoading } = useShops();
  const { data: summaries } = useShopOrderSummaries();
  const { create, changeStatus, extendTest } = useShopActions();

  const [filter, setFilter] = useState<'all' | ShopStatus>('all');
  const [search, setSearch] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [selected, setSelected] = useState<Shop | null>(null);
  const [decision, setDecision] = useState<{ shop: Shop; to: ShopStatus } | null>(null);
  const [reason, setReason] = useState('');
  const [testDays, setTestDays] = useState(30);
  const [extend, setExtend] = useState<Shop | null>(null);
  const [extendDays, setExtendDays] = useState(15);

  const [form, setForm] = useState({
    name: '',
    merchant_name: '',
    merchant_email: '',
    country: '',
    category: '',
    subscription_plan: '',
    commission_rate: '',
    notes: '',
  });

  const { data: events = [] } = useShopEvents(selected?.id);
  const { data: shopOrders = [] } = useShopOrders(selected?.id);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shops.filter((s) => {
      if (filter !== 'all' && s.status !== filter) return false;
      if (!q) return true;
      return [s.name, s.shop_code, s.merchant_name, s.merchant_email, s.country]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [shops, filter, search]);

  const kpis = useMemo(() => {
    const revenue = Array.from(summaries?.values() ?? []).reduce((a, s) => a + s.revenue, 0);
    const expiring = shops.filter((s) => {
      const d = testDaysLeft(s);
      return d !== null && d <= 7;
    }).length;
    return {
      active: shops.filter((s) => s.status === 'active').length,
      test: shops.filter((s) => s.status === 'test').length,
      pending: shops.filter((s) => s.status === 'application' || s.status === 'review').length,
      suspended: shops.filter((s) => s.status === 'suspended').length,
      revenue,
      expiring,
    };
  }, [shops, summaries]);

  const submitCreate = () => {
    if (!form.name.trim()) return;
    create.mutate(
      {
        name: form.name.trim(),
        merchant_name: form.merchant_name || undefined,
        merchant_email: form.merchant_email || undefined,
        country: form.country || undefined,
        category: form.category || undefined,
        subscription_plan: form.subscription_plan || undefined,
        commission_rate: form.commission_rate ? Number(form.commission_rate) : undefined,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          setOpenCreate(false);
          setForm({
            name: '',
            merchant_name: '',
            merchant_email: '',
            country: '',
            category: '',
            subscription_plan: '',
            commission_rate: '',
            notes: '',
          });
        },
      },
    );
  };

  const submitDecision = () => {
    if (!decision) return;
    changeStatus.mutate(
      {
        shop: decision.shop,
        to: decision.to,
        reason: reason || undefined,
        testDurationDays: decision.to === 'test' ? testDays : undefined,
      },
      {
        onSuccess: () => {
          setDecision(null);
          setReason('');
          setSelected(null);
        },
      },
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Boutiques & Marchands</h1>
          <p className="text-muted-foreground">
            Supervision du cycle de vie, des périodes de test et des commandes rattachées
          </p>
        </div>
        <Button className="gap-2" onClick={() => setOpenCreate(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle candidature
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Boutiques actives</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En période de test</CardTitle>
            <FlaskConical className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.test}</div>
            <p className="text-xs text-muted-foreground">{kpis.expiring} arrivent à échéance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">À traiter</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Suspendues</CardTitle>
            <PauseCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.suspended}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CA rattaché</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{money(kpis.revenue)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Registre des boutiques
            </CardTitle>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Rechercher une boutique, un marchand…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | ShopStatus)}>
            <TabsList className="flex-wrap">
              {STATUS_FILTERS.map((f) => (
                <TabsTrigger key={f.value} value={f.value}>
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Boutique</TableHead>
                <TableHead>Marchand</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Période de test</TableHead>
                <TableHead className="text-right">Commandes</TableHead>
                <TableHead className="text-right">CA</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Chargement…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Aucune boutique pour ce filtre.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((shop) => {
                const days = testDaysLeft(shop);
                const sum = summaries?.get(shop.id);
                return (
                  <TableRow key={shop.id}>
                    <TableCell>
                      <div className="font-medium">{shop.name}</div>
                      <div className="text-xs text-muted-foreground">{shop.shop_code}</div>
                    </TableCell>
                    <TableCell>
                      <div>{shop.merchant_name ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{shop.country ?? ''}</div>
                    </TableCell>
                    <TableCell>{statusBadge(shop.status)}</TableCell>
                    <TableCell>
                      {days === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : days < 0 ? (
                        <Badge variant="destructive">Échue</Badge>
                      ) : (
                        <span className={days <= 7 ? 'font-medium text-warning' : ''}>
                          {days} j restants
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{sum?.orders ?? 0}</TableCell>
                    <TableCell className="text-right">{money(sum?.revenue ?? 0)}</TableCell>
                    <TableCell className="text-right">
                      {shop.commission_rate ? `${shop.commission_rate} %` : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(shop)}>
                        Ouvrir
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Fiche boutique */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selected.name}
                  {statusBadge(selected.status)}
                </SheetTitle>
                <SheetDescription>
                  {selected.shop_code} · {selected.category ?? 'Catégorie non renseignée'}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Marchand</p>
                    <p className="font-medium">{selected.merchant_name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Contact</p>
                    <p className="font-medium">{selected.merchant_email ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Abonnement</p>
                    <p className="font-medium">{selected.subscription_plan ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Commission</p>
                    <p className="font-medium">
                      {selected.commission_rate ? `${selected.commission_rate} %` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Contrat</p>
                    <p className="font-medium">{selected.contract_status ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Prolongations de test</p>
                    <p className="font-medium">{selected.test_extensions}</p>
                  </div>
                </div>

                {selected.suspension_reason && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                    <p className="font-medium">Motif enregistré</p>
                    <p className="text-muted-foreground">{selected.suspension_reason}</p>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-sm font-medium">Décisions disponibles</p>
                  <div className="flex flex-wrap gap-2">
                    {SHOP_TRANSITIONS[selected.status].length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Cycle terminé, aucune action possible.
                      </p>
                    )}
                    {SHOP_TRANSITIONS[selected.status].map((to) => (
                      <Button
                        key={to}
                        size="sm"
                        variant={to === 'closed' || to === 'suspended' ? 'destructive' : 'default'}
                        onClick={() => {
                          setReason('');
                          setDecision({ shop: selected, to });
                        }}
                      >
                        Passer en {SHOP_STATUS_LABELS[to].toLowerCase()}
                      </Button>
                    ))}
                    {selected.status === 'test' && (
                      <Button size="sm" variant="outline" onClick={() => setExtend(selected)}>
                        Prolonger le test
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <ShoppingBag className="h-4 w-4" />
                    Commandes rattachées ({shopOrders.length})
                  </p>
                  <div className="space-y-2">
                    {shopOrders.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Aucune commande rattachée à cette boutique.
                      </p>
                    )}
                    {shopOrders.map((o) => (
                      <div
                        key={o.id}
                        className="flex items-center justify-between rounded-md border p-2 text-sm"
                      >
                        <div>
                          <p className="font-medium">{o.order_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {o.current_stage ?? o.status ?? '—'}
                          </p>
                        </div>
                        <span>{money(Number(o.total_amount ?? 0), o.currency ?? 'EUR')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <History className="h-4 w-4" />
                    Historique des décisions
                  </p>
                  <div className="space-y-2">
                    {events.length === 0 && (
                      <p className="text-sm text-muted-foreground">Aucun évènement.</p>
                    )}
                    {events.map((ev) => (
                      <div key={ev.id} className="rounded-md border p-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {ev.from_status
                              ? `${SHOP_STATUS_LABELS[ev.from_status as ShopStatus] ?? ev.from_status} → ${SHOP_STATUS_LABELS[ev.to_status as ShopStatus] ?? ev.to_status}`
                              : SHOP_STATUS_LABELS[ev.to_status as ShopStatus] ?? ev.to_status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(ev.performed_at).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        {ev.reason && (
                          <p className="text-xs text-muted-foreground">{ev.reason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Nouvelle candidature */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle candidature boutique</DialogTitle>
            <DialogDescription>
              La boutique entre dans le cycle au statut « Candidature ».
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Nom de la boutique *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Marchand</Label>
                <Input
                  value={form.merchant_name}
                  onChange={(e) => setForm({ ...form, merchant_name: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={form.merchant_email}
                  onChange={(e) => setForm({ ...form, merchant_email: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Pays</Label>
                <Input
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Catégorie</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Abonnement</Label>
                <Select
                  value={form.subscription_plan}
                  onValueChange={(v) => setForm({ ...form, subscription_plan: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Formule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Commission (%)</Label>
                <Input
                  type="number"
                  value={form.commission_rate}
                  onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Notes internes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>
              Annuler
            </Button>
            <Button onClick={submitCreate} disabled={!form.name.trim() || create.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Décision de cycle */}
      <Dialog open={!!decision} onOpenChange={(o) => !o && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision && `Passer « ${decision.shop.name} » en ${SHOP_STATUS_LABELS[decision.to].toLowerCase()}`}
            </DialogTitle>
            <DialogDescription>
              La décision, son auteur et son motif sont enregistrés dans l’historique.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {decision?.to === 'test' && (
              <div className="grid gap-1.5">
                <Label>Durée du test (jours)</Label>
                <Input
                  type="number"
                  value={testDays}
                  onChange={(e) => setTestDays(Number(e.target.value) || 30)}
                />
              </div>
            )}
            <div className="grid gap-1.5">
              <Label>
                Motif {decision && ['suspended', 'closed'].includes(decision.to) ? '*' : '(optionnel)'}
              </Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)}>
              Annuler
            </Button>
            <Button
              onClick={submitDecision}
              disabled={
                changeStatus.isPending ||
                (!!decision && ['suspended', 'closed'].includes(decision.to) && !reason.trim())
              }
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prolongation de test */}
      <Dialog open={!!extend} onOpenChange={(o) => !o && setExtend(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prolonger la période de test</DialogTitle>
            <DialogDescription>
              {extend?.name} — prolongation ajoutée à la date d’échéance actuelle.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Nombre de jours</Label>
              <Input
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(Number(e.target.value) || 15)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Motif</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtend(null)}>
              Annuler
            </Button>
            <Button
              disabled={extendTest.isPending}
              onClick={() =>
                extend &&
                extendTest.mutate(
                  { shop: extend, days: extendDays, reason: reason || undefined },
                  {
                    onSuccess: () => {
                      setExtend(null);
                      setReason('');
                      setSelected(null);
                    },
                  },
                )
              }
            >
              Prolonger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
