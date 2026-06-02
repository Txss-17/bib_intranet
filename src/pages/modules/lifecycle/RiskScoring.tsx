import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Gauge } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function useScoring() {
  return useQuery({
    queryKey: ['lifecycle_risk_scoring'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('id, company_name, risk_level, risk_score, last_activity_at, status')
        .order('risk_score', { ascending: false, nullsFirst: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });
}

const riskBadge = (lvl: string | null) => {
  if (lvl === 'critical' || lvl === 'high') return 'destructive';
  if (lvl === 'medium') return 'secondary';
  return 'outline';
};

export default function RiskScoring() {
  const { data = [], isLoading } = useScoring();
  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const buckets = {
    critical: data.filter((a: any) => a.risk_level === 'critical').length,
    high: data.filter((a: any) => a.risk_level === 'high').length,
    medium: data.filter((a: any) => a.risk_level === 'medium').length,
    low: data.filter((a: any) => !a.risk_level || a.risk_level === 'low').length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Gauge className="h-5 w-5" /> Scoring risque
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Classement des comptes par niveau de risque.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['critical', 'high', 'medium', 'low'] as const).map((lvl) => (
          <Card key={lvl}>
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">{lvl}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{buckets[lvl]}</div></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Top comptes à surveiller</CardTitle></CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Aucun compte évalué.</p>
          ) : (
            <div className="space-y-2">
              {data.slice(0, 20).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between gap-3 border-b last:border-0 pb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.company_name || '—'}</p>
                    <p className="text-xs text-muted-foreground">Score {a.risk_score ?? 0}</p>
                  </div>
                  <Badge variant={riskBadge(a.risk_level) as any} className="capitalize">{a.risk_level || 'low'}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
