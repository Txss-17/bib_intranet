import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function useActivity() {
  return useQuery({
    queryKey: ['lifecycle_activity_monitoring'],
    queryFn: async () => {
      const [accounts, events] = await Promise.all([
        supabase.from('user_accounts').select('id, company_name, last_order_date, risk_level, subscription_status').order('last_order_date', { ascending: false, nullsFirst: false }).limit(20),
        supabase.from('audit_logs').select('id, action, user_name, resource, created_at').order('created_at', { ascending: false }).limit(15),
      ]);
      return { accounts: accounts.data || [], events: events.data || [] };
    },
  });
}

export default function ActivityMonitoring() {
  const { data, isLoading } = useActivity();
  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Activity className="h-5 w-5" /> Suivi activité
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Dernière activité des comptes et journaux système.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Derniers comptes actifs</CardTitle></CardHeader>
          <CardContent>
            {data!.accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Aucun compte récent.</p>
            ) : (
              <div className="space-y-2">
                {data!.accounts.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between gap-2 border-b last:border-0 pb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.company_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">
                        Dernière commande : {a.last_order_date ? new Date(a.last_order_date).toLocaleDateString('fr-FR') : '—'}
                      </p>
                    </div>
                    <Badge variant={a.risk_level === 'critical' || a.risk_level === 'high' ? 'destructive' : 'outline'} className="capitalize">{a.risk_level || 'low'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Événements système</CardTitle></CardHeader>
          <CardContent>
            {data!.events.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Aucun événement récent.</p>
            ) : (
              <div className="space-y-2">
                {data!.events.map((e: any) => (
                  <div key={e.id} className="flex items-start justify-between gap-2 border-b last:border-0 pb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{e.action}</p>
                      <p className="text-xs text-muted-foreground truncate">{e.user_name || '—'} · {e.resource}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
