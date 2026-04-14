import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardCheck, AlertTriangle, CheckCircle, Calendar, FileText, TrendingUp, Shield, Eye, RefreshCw, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

function useAuditStats() {
  return useQuery({
    queryKey: ['audit_dashboard_stats'],
    queryFn: async () => {
      const { data: audits, error } = await supabase
        .from('field_audits')
        .select('*')
        .order('scheduled_date', { ascending: false });
      if (error) throw error;

      const scheduled = audits.filter(a => a.status === 'scheduled').length;
      const inProgress = audits.filter(a => a.status === 'in_progress').length;
      const completed = audits.filter(a => a.status === 'completed');
      const avgScore = completed.length > 0
        ? Math.round(completed.reduce((s, a) => s + (a.score || 0), 0) / completed.length)
        : 0;

      const initial = audits.filter(a => a.audit_type === 'initial');
      const continuous = audits.filter(a => a.audit_type === 'continuous');
      const periodic = audits.filter(a => a.audit_type === 'periodic');

      return { scheduled, inProgress, completed: completed.length, avgScore, initial, continuous, periodic, total: audits.length };
    },
  });
}

function useNonConformities() {
  return useQuery({
    queryKey: ['audit_non_conformities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quality_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });
}

export default function AuditDashboard() {
  const { data: stats, isLoading } = useAuditStats();
  const { data: nonConformities = [] } = useNonConformities();

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const openNCs = nonConformities.filter(nc => nc.status === 'open').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pôle Audit</h1>
          <p className="text-muted-foreground">Suivi des audits et conformité — 3 niveaux d'audit</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/pole/audit/supplier">Audits fournisseurs</Link></Button>
          <Button variant="outline" asChild><Link to="/pole/audit/ops">Audits Ops</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audits planifiés</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.scheduled ?? 0}</div><p className="text-xs text-muted-foreground">Ce trimestre</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-500">{stats?.inProgress ?? 0}</div><p className="text-xs text-muted-foreground">Audits actifs</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-conformités</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-500">{openNCs}</div><p className="text-xs text-muted-foreground">À résoudre</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-500">{stats?.avgScore ?? 0}%</div><p className="text-xs text-muted-foreground">Conformité</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Audits par type</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="initial">
            <TabsList>
              <TabsTrigger value="initial" className="gap-1"><Eye className="h-3.5 w-3.5" /> Initial ({stats?.initial.length ?? 0})</TabsTrigger>
              <TabsTrigger value="continuous" className="gap-1"><RefreshCw className="h-3.5 w-3.5" /> Surveillance ({stats?.continuous.length ?? 0})</TabsTrigger>
              <TabsTrigger value="periodic" className="gap-1"><Calendar className="h-3.5 w-3.5" /> Périodique ({stats?.periodic.length ?? 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="initial" className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">Audits déclenchés à l'ajout d'un nouveau fournisseur — obligatoires avant validation.</p>
              <div className="space-y-3">
                {(stats?.initial || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun audit initial</p>
                ) : (stats?.initial || []).map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{a.target_name || 'Audit initial'}</p>
                      <p className="text-xs text-muted-foreground">{a.scheduled_date ? new Date(a.scheduled_date).toLocaleDateString('fr-FR') : '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.score !== null ? (
                        <span className={`font-bold text-sm ${(a.score || 0) >= 70 ? 'text-green-500' : 'text-yellow-500'}`}>{a.score}%</span>
                      ) : (
                        <Badge variant="default">{a.status === 'in_progress' ? 'En cours' : 'Planifié'}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="continuous" className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">Surveillance automatique basée sur des seuils (score, incidents, retards).</p>
              <div className="space-y-3">
                {(stats?.continuous || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun audit en surveillance continue</p>
                ) : (stats?.continuous || []).map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{a.target_name || 'Surveillance'}</p>
                      <p className="text-xs text-muted-foreground">{a.findings || 'Aucune anomalie détectée'}</p>
                    </div>
                    <Badge variant={a.status === 'in_progress' ? 'destructive' : 'secondary'}>
                      {a.status === 'in_progress' ? 'Alerte déclenchée' : 'OK'}
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="periodic" className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">Audits planifiés à intervalle régulier (trimestriel, semestriel, annuel).</p>
              <div className="space-y-3">
                {(stats?.periodic || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun audit périodique</p>
                ) : (stats?.periodic || []).map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{a.target_name || 'Audit périodique'}</p>
                      <p className="text-xs text-muted-foreground">{a.scheduled_date ? new Date(a.scheduled_date).toLocaleDateString('fr-FR') : '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.score !== null ? (
                        <span className={`font-bold text-sm ${(a.score || 0) >= 70 ? 'text-green-500' : (a.score || 0) >= 50 ? 'text-yellow-500' : 'text-destructive'}`}>{a.score}%</span>
                      ) : (
                        <Badge variant="secondary">Planifié</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Non-conformités récentes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nonConformities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune non-conformité</p>
              ) : nonConformities.map(nc => (
                <div key={nc.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{nc.title}</p>
                    <p className="text-sm text-muted-foreground">{nc.description?.slice(0, 60)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={nc.severity === 'high' || nc.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {nc.severity === 'high' || nc.severity === 'critical' ? 'Majeure' : 'Mineure'}
                    </Badge>
                    {nc.status === 'resolved' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Statistiques par niveau</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Initial</span>
                </div>
                <Badge variant="outline">{stats?.initial.length ?? 0} audits</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">Surveillance continue</span>
                </div>
                <Badge variant="outline">{stats?.continuous.length ?? 0} audits</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">Périodique</span>
                </div>
                <Badge variant="outline">{stats?.periodic.length ?? 0} audits</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
