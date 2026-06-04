import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wallet, ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logSensitiveAccess } from '@/lib/sensitiveAudit';

const HIGH_AMOUNT_THRESHOLD = 10000;

function useFinanceCompliance() {
  return useQuery({
    queryKey: ['compliance_finance'],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const [cashflows, payments, fund] = await Promise.all([
        supabase.from('cashflows').select('id, type, category, amount, transaction_date, description').gte('transaction_date', since).order('transaction_date', { ascending: false }).limit(100),
        supabase.from('supplier_payments').select('id, amount, status, created_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('guarantee_fund').select('id, type, amount, reason, transaction_date').order('transaction_date', { ascending: false }).limit(20),
      ]);
      const cf = cashflows.data || [];
      const pay = payments.data || [];
      const gf = fund.data || [];
      const inflows = cf.filter((c) => c.type === 'income' || Number(c.amount) > 0).reduce((s, c) => s + Number(c.amount || 0), 0);
      const outflows = cf.filter((c) => c.type === 'expense' || Number(c.amount) < 0).reduce((s, c) => s + Math.abs(Number(c.amount || 0)), 0);
      const pending = pay.filter((p) => p.status === 'pending' || p.status === 'processing');
      const highValue = cf.filter((c) => Math.abs(Number(c.amount || 0)) >= HIGH_AMOUNT_THRESHOLD).slice(0, 6);
      return { cf, pay, gf, inflows, outflows, pending, highValue };
    },
  });
}

export default function FinanceCompliance() {
  const { data } = useFinanceCompliance();
  useEffect(() => {
    logSensitiveAccess({ section: 'compliance.finance', action: 'view_pole_compliance', allowed: true });
  }, []);
  const d = data;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Button asChild size="sm" variant="ghost" className="mb-2 -ml-2">
            <Link to="/compliance-audit"><ArrowLeft className="h-4 w-4 mr-1" /> Conformité & Audit</Link>
          </Button>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Wallet className="h-5 w-5" /> Conformité Finance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Indicateurs financiers, paiements en attente et opérations à revoir.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Entrées 30j" value={`${(d?.inflows || 0).toLocaleString('fr-FR')} €`} />
        <KPI label="Sorties 30j" value={`${(d?.outflows || 0).toLocaleString('fr-FR')} €`} />
        <KPI label="Paiements en attente" value={d?.pending.length ?? 0} tone={d && d.pending.length > 0 ? 'warning' : 'default'} />
        <KPI label="Mouvements fonds garantie" value={d?.gf.length ?? 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Opérations à revoir (≥ {HIGH_AMOUNT_THRESHOLD.toLocaleString('fr-FR')} €)</CardTitle>
          </CardHeader>
          <CardContent>
            {!d?.highValue.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucune opération à revoir.</p>
            ) : (
              <div className="space-y-2">
                {d.highValue.map((c) => (
                  <div key={c.id} className="flex items-start justify-between gap-3 border-b last:border-0 pb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.description || c.category || c.type}</p>
                      <p className="text-xs text-muted-foreground">{c.transaction_date} · {c.category || c.type}</p>
                    </div>
                    <Badge variant="destructive" className="shrink-0">{Number(c.amount).toLocaleString('fr-FR')} €</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Paiements fournisseurs en attente</CardTitle>
          </CardHeader>
          <CardContent>
            {!d?.pending.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun paiement en attente.</p>
            ) : (
              <div className="space-y-2">
                {d.pending.slice(0, 8).map((p) => (
                  <div key={p.id} className="flex items-start justify-between gap-3 border-b last:border-0 pb-2">
                    <div>
                      <p className="text-sm font-medium">{Number(p.amount).toLocaleString('fr-FR')} €</p>
                      <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">{p.status}</Badge>
                  </div>
                ))}
                <Button asChild size="sm" variant="ghost" className="h-7 px-2 mt-1 text-xs">
                  <Link to="/pole/finance/supplier-payments">Voir tous les paiements <ArrowRight className="h-3 w-3 ml-1" /></Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPI({ label, value, tone = 'default' }: { label: string; value: any; tone?: 'default' | 'warning' }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-semibold mt-1 ${tone === 'warning' ? 'text-warning' : ''}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
