import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Truck, AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logSensitiveAccess } from '@/lib/sensitiveAudit';

function useOpsCompliance() {
  return useQuery({
    queryKey: ['compliance_ops'],
    queryFn: async () => {
      const [incidents, syncEvents, replen, qa] = await Promise.all([
        supabase.from('logistics_incidents').select('id, incident_type, severity, status, description, created_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('partner_sync_events').select('id, partner_id, event_type, status, error_message, created_at').eq('status', 'failed').order('created_at', { ascending: false }).limit(20),
        supabase.from('replenishment_suggestions').select('id, priority, status, reason, created_at').eq('status', 'pending').order('created_at', { ascending: false }).limit(20),
        supabase.from('quality_alerts').select('id, title, severity, status, created_at').eq('status', 'open').order('created_at', { ascending: false }).limit(10),
      ]);
      const inc = incidents.data || [];
      const open = inc.filter((i) => i.status !== 'resolved' && i.status !== 'closed');
      const critical = open.filter((i) => i.severity === 'critical' || i.severity === 'high');
      return {
        incidents: inc,
        open,
        critical,
        syncFailed: syncEvents.data || [],
        pendingReplen: replen.data || [],
        qualityAlerts: qa.data || [],
      };
    },
  });
}

export default function OpsCompliance() {
  const { data } = useOpsCompliance();
  useEffect(() => {
    logSensitiveAccess({ section: 'compliance.ops', action: 'view_pole_compliance', allowed: true });
  }, []);
  const d = data;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <Button asChild size="sm" variant="ghost" className="mb-2 -ml-2">
          <Link to="/compliance-audit"><ArrowLeft className="h-4 w-4 mr-1" /> Conformité & Audit</Link>
        </Button>
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Truck className="h-5 w-5" /> Conformité Ops</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Incidents logistiques, échecs de synchronisation et files de revue opérationnelles.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Incidents ouverts" value={d?.open.length ?? 0} tone={d && d.open.length > 0 ? 'warning' : 'default'} />
        <KPI label="Critiques / hauts" value={d?.critical.length ?? 0} tone={d && d.critical.length > 0 ? 'destructive' : 'default'} />
        <KPI label="Sync partenaires KO" value={d?.syncFailed.length ?? 0} />
        <KPI label="Restock en attente" value={d?.pendingReplen.length ?? 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Incidents logistiques à revoir</CardTitle>
          </CardHeader>
          <CardContent>
            {!d?.critical.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun incident prioritaire.</p>
            ) : (
              <div className="space-y-2">
                {d.critical.slice(0, 8).map((i) => (
                  <div key={i.id} className="flex items-start justify-between gap-3 border-b last:border-0 pb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{i.incident_type}</p>
                      <p className="text-xs text-muted-foreground truncate">{i.description}</p>
                    </div>
                    <Badge variant="destructive" className="shrink-0 capitalize">{i.severity}</Badge>
                  </div>
                ))}
                <Button asChild size="sm" variant="ghost" className="h-7 px-2 mt-1 text-xs">
                  <Link to="/pole/ops/incidents">Voir tous les incidents <ArrowRight className="h-3 w-3 ml-1" /></Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Synchronisations en échec</CardTitle>
          </CardHeader>
          <CardContent>
            {!d?.syncFailed.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun échec récent.</p>
            ) : (
              <div className="space-y-2">
                {d.syncFailed.slice(0, 8).map((e) => (
                  <div key={e.id} className="flex items-start justify-between gap-3 border-b last:border-0 pb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{e.event_type}</p>
                      <p className="text-xs text-muted-foreground truncate">{e.error_message || '—'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                ))}
                <Button asChild size="sm" variant="ghost" className="h-7 px-2 mt-1 text-xs">
                  <Link to="/pole/ops/flows">Voir les flux <ArrowRight className="h-3 w-3 ml-1" /></Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Alertes qualité ouvertes</CardTitle>
          </CardHeader>
          <CardContent>
            {!d?.qualityAlerts.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucune alerte qualité.</p>
            ) : (
              <div className="space-y-2">
                {d.qualityAlerts.map((a) => (
                  <div key={a.id} className="flex items-start justify-between gap-3 border-b last:border-0 pb-2">
                    <p className="text-sm truncate">{a.title}</p>
                    <Badge variant={a.severity === 'critical' || a.severity === 'high' ? 'destructive' : 'secondary'} className="capitalize">{a.severity}</Badge>
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

function KPI({ label, value, tone = 'default' }: { label: string; value: any; tone?: 'default' | 'warning' | 'destructive' }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-semibold mt-1 ${tone === 'warning' ? 'text-warning' : tone === 'destructive' ? 'text-destructive' : ''}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
