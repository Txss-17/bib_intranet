import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Eye, FileSearch, Settings as SettingsIcon, ClipboardCheck, AlertTriangle, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissionRules } from '@/hooks/usePermissionRules';
import { logSensitiveAccess } from '@/lib/sensitiveAudit';
import { supabase } from '@/integrations/supabase/client';

function useRecentAuditEvents() {
  return useQuery({
    queryKey: ['compliance_audit_recent_events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, action, resource, user_name, created_at, details')
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data || [];
    },
  });
}

function usePendingReviews() {
  return useQuery({
    queryKey: ['compliance_audit_pending'],
    queryFn: async () => {
      const [nc, audits, incidents] = await Promise.all([
        supabase.from('quality_alerts').select('id,title,severity,status,created_at').eq('status', 'open').order('created_at', { ascending: false }).limit(5),
        supabase.from('field_audits').select('id,target_name,audit_type,status,scheduled_date').eq('status', 'scheduled').order('scheduled_date', { ascending: true }).limit(5),
        supabase.from('audit_incidents').select('id,title,severity,status,declared_at').in('status', ['declared', 'investigating']).order('declared_at', { ascending: false }).limit(5),
      ]);
      return {
        nonConformities: nc.data || [],
        scheduledAudits: audits.data || [],
        incidents: incidents.data || [],
      };
    },
  });
}

const labelForAction = (a: string) =>
  ({
    view_sensitive_section: 'Consultation section sensible',
    view_permissions_matrix: 'Ouverture matrice permissions',
    update_permissions_matrix: 'Mise à jour matrice permissions',
  }[a] || a);

export default function ComplianceAudit() {
  const { profile } = useAuth();
  const rights = usePermissionRules();
  const { data: events = [] } = useRecentAuditEvents();
  const { data: pending } = usePendingReviews();

  useEffect(() => {
    logSensitiveAccess({
      section: 'compliance.dashboard',
      action: 'view_compliance_dashboard',
      allowed: true,
      reason: 'overview',
    });
  }, []);

  const isRhOrDirection = (profile?.poles || []).some((p) => p === 'rh' || p === 'direction');

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5" /> Conformité & Audit
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Statuts de visibilité, événements d'audit récents et actions nécessitant une revue RH/Direction.
          </p>
        </div>
        {isRhOrDirection && (
          <Button asChild size="sm" variant="outline">
            <Link to="/permissions"><SettingsIcon className="h-4 w-4 mr-2" /> Matrice de permissions</Link>
          </Button>
        )}
      </div>

      {/* Visibility status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" /> Vos statuts de visibilité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatusItem icon={Eye} label="Données sensibles" allowed={rights.can_view_sensitive} />
            <StatusItem icon={FileSearch} label="Journal d'audit complet" allowed={rights.can_view_audit_log} />
            <StatusItem icon={SettingsIcon} label="Configurer permissions" allowed={rights.can_configure_permissions} />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Calculé d'après vos pôles ({(profile?.poles || []).join(', ') || '—'}) et votre niveau ({profile?.seniority || '—'}).
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent audit events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Derniers événements d'audit</CardTitle>
            {rights.can_view_audit_log && (
              <Button asChild size="sm" variant="ghost">
                <Link to="/settings">Journal complet <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun événement récent</p>
            ) : (
              <div className="space-y-2">
                {events.map((e) => (
                  <div key={e.id} className="flex items-start justify-between gap-3 border-b last:border-0 pb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{labelForAction(e.action)}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {e.user_name || '—'} · {e.resource}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(e.created_at as string).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending HR/Direction reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Actions à revoir</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ReviewBlock
              title="Non-conformités ouvertes"
              items={(pending?.nonConformities || []).map((nc) => ({
                id: nc.id,
                label: nc.title,
                meta: nc.severity,
                tone: nc.severity === 'high' || nc.severity === 'critical' ? 'destructive' : 'secondary',
              }))}
              cta={{ label: 'Voir les non-conformités', to: '/pole/audit/nonconformities' }}
            />
            <ReviewBlock
              title="Audits planifiés"
              items={(pending?.scheduledAudits || []).map((a) => ({
                id: a.id,
                label: a.target_name || `Audit ${a.audit_type}`,
                meta: a.scheduled_date ? new Date(a.scheduled_date).toLocaleDateString('fr-FR') : '—',
                tone: 'outline',
              }))}
              cta={{ label: 'Voir les audits', to: '/pole/audit' }}
            />
            <ReviewBlock
              title="Incidents audit indépendant"
              items={(pending?.incidents || []).map((i) => ({
                id: i.id,
                label: i.title,
                meta: i.severity,
                tone: i.severity === 'high' || i.severity === 'critical' ? 'destructive' : 'secondary',
              }))}
              cta={{ label: 'Voir les incidents', to: '/modules/independent-audit' }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusItem({ icon: Icon, label, allowed }: { icon: any; label: string; allowed: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className={`h-8 w-8 rounded-md flex items-center justify-center ${allowed ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{label}</p>
        <Badge variant={allowed ? 'default' : 'outline'} className="mt-0.5 text-[10px]">
          {allowed ? 'Accordé' : 'Restreint'}
        </Badge>
      </div>
      {allowed && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
    </div>
  );
}

function ReviewBlock({
  title,
  items,
  cta,
}: {
  title: string;
  items: Array<{ id: string; label: string; meta?: string | null; tone: 'destructive' | 'secondary' | 'outline' }>;
  cta: { label: string; to: string };
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
        <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Rien à revoir.</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{it.label}</span>
              {it.meta && <Badge variant={it.tone as any} className="text-[10px] capitalize shrink-0">{it.meta}</Badge>}
            </div>
          ))}
        </div>
      )}
      <Button asChild size="sm" variant="ghost" className="h-7 px-2 mt-1 text-xs">
        <Link to={cta.to}>{cta.label} <ArrowRight className="h-3 w-3 ml-1" /></Link>
      </Button>
    </div>
  );
}
