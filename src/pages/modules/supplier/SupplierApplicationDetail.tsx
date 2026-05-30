import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedScreen } from '@/components/ProtectedScreen';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useSupplierApplication,
  useUpdateApplicationStatus,
  useReassignApplication,
  useSupplierManagers,
} from '@/hooks/useSupplierApplications';
import { useUserRole } from '@/hooks/useUserRole';
import { ArrowLeft, CheckCircle2, XCircle, Clock, UserPlus } from 'lucide-react';

const statusLabels: Record<string, string> = {
  new: 'Nouvelle', assigned: 'Assignée', in_review: 'En revue',
  approved: 'Approuvée', rejected: 'Refusée', on_hold: 'En attente',
};

export default function SupplierApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useSupplierApplication(id);
  const { data: managers = [] } = useSupplierManagers();
  const updateStatus = useUpdateApplicationStatus();
  const reassign = useReassignApplication();
  const { isAdmin, isManager } = useUserRole();
  const canDecide = isAdmin || isManager;

  const [notes, setNotes] = useState('');
  const [assignee, setAssignee] = useState<string>('');

  if (isLoading || !data) return <MainLayout><div className="p-6 text-muted-foreground">Chargement…</div></MainLayout>;
  const { app, events } = data;

  const decide = (status: 'approved' | 'rejected' | 'in_review' | 'on_hold') => {
    if (!id) return;
    updateStatus.mutate({ id, status, notes: notes || undefined, fromStatus: app.status });
    setNotes('');
  };

  const doReassign = () => {
    if (!id || !assignee) return;
    const m = managers.find((x: any) => x.id === assignee);
    if (!m) return;
    reassign.mutate({ id, assigneeId: m.id, assigneeName: m.name });
  };

  return (
    <MainLayout>
      <ProtectedScreen screenId="supplier.applications">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm"><Link to="/pole/supplier/applications"><ArrowLeft className="h-4 w-4 mr-1" /> Retour</Link></Button>
            <div>
              <h1 className="text-2xl font-semibold">{app.company_name}</h1>
              <p className="text-sm text-muted-foreground">
                {app.type} · {app.country ?? '—'} · Score <Badge variant="outline" className="ml-1">{app.score}</Badge>
                <span className="ml-2">Priorité: <strong>{app.priority}</strong></span>
                <span className="ml-2">Statut: <Badge variant="secondary">{statusLabels[app.status]}</Badge></span>
              </p>
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="decision">Décision</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Nom: </span>{app.contact_name ?? '—'}</div>
                  <div><span className="text-muted-foreground">Email: </span>{app.contact_email}</div>
                  <div><span className="text-muted-foreground">Téléphone: </span>{app.contact_phone ?? '—'}</div>
                  <div><span className="text-muted-foreground">Catégorie: </span>{app.category ?? '—'}</div>
                  <div><span className="text-muted-foreground">Lead time: </span>{app.lead_time_days ?? '—'} j</div>
                  <div><span className="text-muted-foreground">MOQ: </span>{app.moq ?? '—'}</div>
                  <div><span className="text-muted-foreground">Audit accepté: </span>{app.audit_accepted ? 'Oui' : 'Non'}</div>
                  <div><span className="text-muted-foreground">Source: </span>{app.source}</div>
                </CardContent>
              </Card>
              {app.blocking_criteria?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base text-destructive">Critères bloquants</CardTitle></CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {app.blocking_criteria.map(c => <Badge key={c} variant="destructive">{c}</Badge>)}
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader><CardTitle className="text-base">Payload brut</CardTitle></CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-80">{JSON.stringify(app.raw_payload, null, 2)}</pre>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardContent className="pt-6">
                  {Array.isArray(app.documents) && app.documents.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {app.documents.map((d: any, i: number) => (
                        <li key={i}>
                          {typeof d === 'string'
                            ? <a className="text-primary underline" href={d} target="_blank" rel="noreferrer">{d}</a>
                            : <a className="text-primary underline" href={d.url} target="_blank" rel="noreferrer">{d.name ?? d.url}</a>}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-muted-foreground">Aucun document fourni</p>}
                  {Array.isArray(app.certifications) && app.certifications.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Certifications</div>
                      <div className="flex flex-wrap gap-2">
                        {app.certifications.map((c: any, i: number) => (
                          <Badge key={i} variant="outline">{typeof c === 'string' ? c : c.name ?? JSON.stringify(c)}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="decision" className="space-y-4">
              {!canDecide && (
                <Card><CardContent className="pt-6 text-sm text-muted-foreground">Lecture seule — votre rôle ne permet pas la décision.</CardContent></Card>
              )}
              {canDecide && (
                <>
                  <Card>
                    <CardHeader><CardTitle className="text-base">Réassigner</CardTitle></CardHeader>
                    <CardContent className="flex gap-3">
                      <Select value={assignee} onValueChange={setAssignee}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder={app.assigned_to_name ?? 'Choisir un gestionnaire'} /></SelectTrigger>
                        <SelectContent>
                          {managers.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button onClick={doReassign} disabled={!assignee || reassign.isPending}><UserPlus className="h-4 w-4 mr-1" /> Assigner</Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base">Décision</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <Textarea placeholder="Commentaire / motif (recommandé)" value={notes} onChange={e => setNotes(e.target.value)} />
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => decide('in_review')} variant="outline"><Clock className="h-4 w-4 mr-1" /> Mettre en revue</Button>
                        <Button onClick={() => decide('on_hold')} variant="outline">En attente</Button>
                        <Button onClick={() => decide('approved')} className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="h-4 w-4 mr-1" /> Approuver</Button>
                        <Button onClick={() => decide('rejected')} variant="destructive"><XCircle className="h-4 w-4 mr-1" /> Refuser</Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardContent className="pt-6">
                  {events.length === 0 ? <p className="text-sm text-muted-foreground">Aucun événement</p> : (
                    <ol className="space-y-3">
                      {events.map((e: any) => (
                        <li key={e.id} className="border-l-2 border-primary/40 pl-3">
                          <div className="text-sm font-medium">{e.event_type}{e.to_status ? ` → ${statusLabels[e.to_status] ?? e.to_status}` : ''}</div>
                          {e.notes && <div className="text-sm text-muted-foreground">{e.notes}</div>}
                          <div className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString('fr-FR')}</div>
                        </li>
                      ))}
                    </ol>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ProtectedScreen>
    </MainLayout>
  );
}
