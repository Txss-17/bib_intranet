import React, { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuditIncidents, useUpdateIncidentStatus } from '@/hooks/useNewModules';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import ProtectedScreen from '@/components/ProtectedScreen';

const sevColor = (s: string) =>
  s === 'critical' ? 'bg-destructive text-destructive-foreground'
  : s === 'high' ? 'bg-orange-500 text-white'
  : s === 'medium' ? 'bg-yellow-500 text-black'
  : 'bg-muted';

const IncidentRow = ({ incident, canManage }: { incident: any; canManage: boolean }) => {
  const update = useUpdateIncidentStatus();
  const [notes, setNotes] = useState(incident.resolution_notes || '');

  const setStatus = async (status: string) => {
    try {
      await update.mutateAsync({ id: incident.id, status, resolution_notes: notes });
      toast.success(`Statut: ${status}`);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="p-4 border rounded space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold">{incident.title}</span>
            <Badge className={sevColor(incident.severity)}>{incident.severity}</Badge>
            <Badge variant="outline">{incident.status}</Badge>
            {incident.category && <Badge variant="secondary">{incident.category}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{incident.description}</p>
          <p className="text-xs text-muted-foreground mt-1">Déclaré le {new Date(incident.declared_at).toLocaleString()}</p>
        </div>
      </div>
      {canManage && (
        <>
          <Textarea placeholder="Notes de résolution" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          <div className="flex gap-2">
            {incident.status === 'declared' && <Button size="sm" variant="outline" onClick={() => setStatus('investigating')}>Démarrer enquête</Button>}
            {incident.status !== 'resolved' && <Button size="sm" onClick={() => setStatus('resolved')}><CheckCircle2 className="h-4 w-4 mr-1" />Marquer résolu</Button>}
            {incident.status !== 'closed' && incident.status === 'resolved' && <Button size="sm" variant="secondary" onClick={() => setStatus('closed')}>Clôturer</Button>}
          </div>
        </>
      )}
    </div>
  );
};

const Page = () => {
  const { data, isLoading } = useAuditIncidents();
  const { isAdmin, isManager } = useUserRole();
  const canManage = isAdmin || isManager;

  const groups = {
    declared: (data ?? []).filter((i: any) => i.status === 'declared'),
    investigating: (data ?? []).filter((i: any) => i.status === 'investigating'),
    resolved: (data ?? []).filter((i: any) => i.status === 'resolved' || i.status === 'closed'),
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3"><CheckCircle2 className="h-8 w-8" /> Suivi de résolution</h1>
        <p className="text-muted-foreground mt-1">Pilotage des incidents jusqu'à clôture</p>
      </div>
      {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
        <Card>
          <CardHeader><CardTitle>Incidents</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="declared">
              <TabsList>
                <TabsTrigger value="declared">Déclarés ({groups.declared.length})</TabsTrigger>
                <TabsTrigger value="investigating">En enquête ({groups.investigating.length})</TabsTrigger>
                <TabsTrigger value="resolved">Résolus ({groups.resolved.length})</TabsTrigger>
              </TabsList>
              {(['declared','investigating','resolved'] as const).map(k => (
                <TabsContent key={k} value={k} className="space-y-3 mt-4">
                  {groups[k].map((i: any) => <IncidentRow key={i.id} incident={i} canManage={canManage} />)}
                  {groups[k].length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Aucun incident</p>}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default function ResolutionTracking() {
  return <ProtectedScreen screenId="audit.resolution"><Page /></ProtectedScreen>;
}
