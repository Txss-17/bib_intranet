import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthLogs, useEdgeFunctionLogs } from '@/hooks/useTechData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';

const useAuditLogs = () => useQuery({
  queryKey: ['audit_logs_tech'],
  queryFn: async () => {
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    return data || [];
  },
});

export default function TechLogs() {
  const { data: authLogs = [] } = useAuthLogs(200);
  const { data: edgeLogs = [] } = useEdgeFunctionLogs(200);
  const { data: auditLogs = [] } = useAuditLogs();
  const [q, setQ] = useState('');
  const [eventFilter, setEventFilter] = useState('all');

  const filteredAuth = useMemo(() => {
    return authLogs.filter((l: any) => {
      if (eventFilter !== 'all' && l.event_type !== eventFilter) return false;
      if (q && !`${l.user_email} ${l.ip_address}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [authLogs, q, eventFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Activity className="h-7 w-7" /> Logs & activité</h1>
        <p className="text-muted-foreground">Traces complètes : authentification, actions métier, edge functions</p>
      </div>

      <Tabs defaultValue="auth">
        <TabsList>
          <TabsTrigger value="auth">Auth ({authLogs.length})</TabsTrigger>
          <TabsTrigger value="audit">Actions métier ({auditLogs.length})</TabsTrigger>
          <TabsTrigger value="edge">Edge Functions ({edgeLogs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Connexions, déconnexions, échecs</CardTitle>
              <div className="flex gap-2">
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous événements</SelectItem>
                    <SelectItem value="login_success">Connexion OK</SelectItem>
                    <SelectItem value="login_failure">Échec connexion</SelectItem>
                    <SelectItem value="logout">Déconnexion</SelectItem>
                    <SelectItem value="password_reset">Reset mdp</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Email ou IP…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead><TableHead>Événement</TableHead><TableHead>Utilisateur</TableHead>
                  <TableHead>IP</TableHead><TableHead>App</TableHead><TableHead>User Agent</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filteredAuth.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Aucun log</TableCell></TableRow>
                  ) : filteredAuth.slice(0, 100).map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs">{format(new Date(l.created_at), 'dd/MM HH:mm:ss')}</TableCell>
                      <TableCell><Badge variant={l.event_type === 'login_failure' ? 'destructive' : 'default'}>{l.event_type}</Badge></TableCell>
                      <TableCell className="text-sm">{l.user_email || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{l.ip_address || '—'}</TableCell>
                      <TableCell><Badge variant="outline">{l.app_origin || 'bos'}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-xs">{l.user_agent || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader><CardTitle>Actions métier</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead><TableHead>Utilisateur</TableHead><TableHead>Action</TableHead>
                  <TableHead>Ressource</TableHead><TableHead>Pôle</TableHead><TableHead>IP</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {auditLogs.slice(0, 100).map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs">{format(new Date(l.created_at), 'dd/MM HH:mm:ss')}</TableCell>
                      <TableCell className="text-sm">{l.user_name || '—'}</TableCell>
                      <TableCell><Badge variant="outline">{l.action}</Badge></TableCell>
                      <TableCell className="text-sm">{l.resource}</TableCell>
                      <TableCell>{l.pole_id && <Badge variant="secondary">{l.pole_id}</Badge>}</TableCell>
                      <TableCell className="font-mono text-xs">{l.ip_address || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edge">
          <Card>
            <CardHeader><CardTitle>Appels Edge Functions</CardTitle></CardHeader>
            <CardContent>
              {edgeLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun log d'edge function. Les fonctions doivent appeler la table edge_function_logs pour s'enregistrer.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Date</TableHead><TableHead>Fonction</TableHead><TableHead>Méthode</TableHead>
                    <TableHead>Status</TableHead><TableHead>Durée</TableHead><TableHead>Erreur</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {edgeLogs.slice(0, 100).map((l: any) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs">{format(new Date(l.created_at), 'dd/MM HH:mm:ss')}</TableCell>
                        <TableCell className="font-mono text-sm">{l.function_name}</TableCell>
                        <TableCell><Badge variant="outline">{l.method}</Badge></TableCell>
                        <TableCell><Badge variant={l.status_code >= 400 ? 'destructive' : 'default'}>{l.status_code}</Badge></TableCell>
                        <TableCell>{l.duration_ms}ms</TableCell>
                        <TableCell className="text-xs text-destructive truncate max-w-xs">{l.error_message || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
