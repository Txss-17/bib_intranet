import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Server, ShieldAlert, Activity, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logSensitiveAccess } from '@/lib/sensitiveAudit';

function useTechCompliance() {
  return useQuery({
    queryKey: ['compliance_tech'],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const [alerts, auth, deploys] = await Promise.all([
        (supabase as any).from('security_alerts').select('id, title, alert_type, severity, status, ip_address, created_at').order('created_at', { ascending: false }).limit(100),
        (supabase as any).from('auth_logs').select('id, event_type, user_email, ip_address, created_at').gte('created_at', since).order('created_at', { ascending: false }).limit(200),
        supabase.from('deployments').select('id, version, environment, status, deployed_at').order('deployed_at', { ascending: false }).limit(20),
      ]);
      const al = alerts.data || [];
      const openAlerts = al.filter((a: any) => a.status === 'open' || a.status === 'investigating');
      const criticalOpen = openAlerts.filter((a: any) => a.severity === 'critical' || a.severity === 'high');
      const authEvents = auth.data || [];
      const failedAuth = authEvents.filter((e: any) => (e.event_type || '').toLowerCase().includes('fail'));
      const failedDeploys = (deploys.data || []).filter((d: any) => d.status === 'failed' || d.status === 'rolled_back');
      return { openAlerts, criticalOpen, authEvents, failedAuth, deploys: deploys.data || [], failedDeploys };
    },
  });
}

export default function TechCompliance() {
  const { data } = useTechCompliance();
  useEffect(() => {
    logSensitiveAccess({ section: 'compliance.tech', action: 'view_pole_compliance', allowed: true });
  }, []);
  const d = data;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <Button asChild size="sm" variant="ghost" className="mb-2 -ml-2">
          <Link to="/compliance-audit"><ArrowLeft className="h-4 w-4 mr-1" /> Conformité & Audit</Link>
        </Button>
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Server className="h-5 w-5" /> Conformité Tech</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Sécurité, événements d'authentification et déploiements à surveiller.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Alertes sécurité ouvertes" value={d?.openAlerts.length ?? 0} tone={d && d.openAlerts.length > 0 ? 'warning' : 'default'} />
        <KPI label="Critiques / hautes" value={d?.criticalOpen.length ?? 0} tone={d && d.criticalOpen.length > 0 ? 'destructive' : 'default'} />
        <KPI label="Échecs auth (7j)" value={d?.failedAuth.length ?? 0} />
        <KPI label="Déploiements KO" value={d?.failedDeploys.length ?? 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Alertes sécurité à revoir</CardTitle>
          </CardHeader>
          <CardContent>
            {!d?.criticalOpen.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucune alerte prioritaire.</p>
            ) : (
              <div className="space-y-2">
                {d.criticalOpen.slice(0, 8).map((a: any) => (
                  <div key={a.id} className="flex items-start justify-between gap-3 border-b last:border-0 pb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.alert_type} · {a.ip_address || '—'}</p>
                    </div>
                    <Badge variant="destructive" className="shrink-0 capitalize">{a.severity}</Badge>
                  </div>
                ))}
                <Button asChild size="sm" variant="ghost" className="h-7 px-2 mt-1 text-xs">
                  <Link to="/pole/tech/security">Voir la sécurité <ArrowRight className="h-3 w-3 ml-1" /></Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" /> Échecs d'authentification (7j)</CardTitle>
          </CardHeader>
          <CardContent>
            {!d?.failedAuth.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun échec récent.</p>
            ) : (
              <div className="space-y-2">
                {d.failedAuth.slice(0, 8).map((e: any) => (
                  <div key={e.id} className="flex items-start justify-between gap-3 border-b last:border-0 pb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{e.user_email || '—'}</p>
                      <p className="text-xs text-muted-foreground">{e.event_type} · {e.ip_address || '—'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                ))}
                <Button asChild size="sm" variant="ghost" className="h-7 px-2 mt-1 text-xs">
                  <Link to="/pole/tech/logs">Voir les logs <ArrowRight className="h-3 w-3 ml-1" /></Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Derniers déploiements</CardTitle>
          </CardHeader>
          <CardContent>
            {!d?.deploys.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun déploiement.</p>
            ) : (
              <div className="space-y-2">
                {d.deploys.slice(0, 8).map((dp: any) => (
                  <div key={dp.id} className="flex items-center justify-between gap-3 border-b last:border-0 pb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{dp.version} <span className="text-muted-foreground">· {dp.environment}</span></p>
                      <p className="text-xs text-muted-foreground">{dp.deployed_at ? new Date(dp.deployed_at).toLocaleString('fr-FR') : '—'}</p>
                    </div>
                    <Badge variant={dp.status === 'success' || dp.status === 'deployed' ? 'default' : dp.status === 'failed' ? 'destructive' : 'secondary'} className="capitalize">{dp.status}</Badge>
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
