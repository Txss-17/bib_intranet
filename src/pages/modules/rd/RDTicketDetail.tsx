import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, History, Save, Lightbulb, FileText, ShieldAlert } from 'lucide-react';
import { useRDTicket, useUpdateRDTicket, useProfiles } from '@/hooks/useRD';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import ProtectedScreen from '@/components/ProtectedScreen';

const prioColor = (p: string) =>
  p === 'critical' ? 'bg-destructive text-destructive-foreground'
  : p === 'high' ? 'bg-orange-500 text-white'
  : p === 'medium' ? 'bg-yellow-500 text-black'
  : 'bg-muted';

const Page = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useRDTicket(id);
  const { data: profiles } = useProfiles();
  const update = useUpdateRDTicket();
  const { isAdmin, isManager } = useUserRole();
  const canEdit = isAdmin || isManager;

  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [assigned, setAssigned] = useState<string>('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (data?.incident) {
      setStatus(data.incident.status);
      setSeverity(data.incident.severity);
      setAssigned(data.incident.assigned_to || '');
    }
  }, [data?.incident?.id]);

  if (isLoading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data?.incident) return <div className="p-6 text-muted-foreground">Ticket introuvable</div>;

  const inc = data.incident;

  const submit = async () => {
    const updates: any = {};
    if (status !== inc.status) updates.status = status;
    if (severity !== inc.severity) updates.severity = severity;
    if ((assigned || null) !== (inc.assigned_to || null)) updates.assigned_to = assigned || null;
    if (Object.keys(updates).length === 0 && !note) {
      toast.info('Aucune modification');
      return;
    }
    try {
      await update.mutateAsync({ ticketId: inc.id, updates, changeNote: note });
      toast.success('Ticket mis à jour');
      setNote('');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild><Link to="/pole/rd/reports"><ArrowLeft className="h-4 w-4 mr-1" />Retour</Link></Button>
      </div>

      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold">{inc.title}</h1>
          <Badge variant="outline">{inc.pole_id || '—'}</Badge>
          <Badge>{inc.status}</Badge>
          <Badge className={prioColor(inc.severity)}>{inc.severity}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Créé le {new Date(inc.created_at).toLocaleString()} • {inc.declared_by_name || 'Système'}
        </p>
      </div>

      {data.recommendation && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lightbulb className="h-4 w-4" />Recommandation R&D d'origine</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">{data.recommendation.detail}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {data.recommendation.category && <Badge variant="secondary">{data.recommendation.category}</Badge>}
              <Badge className={prioColor(data.recommendation.priority)}>{data.recommendation.priority}</Badge>
              <Badge variant="outline">{data.recommendation.status}</Badge>
            </div>
            {data.report && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" />Rapport: {data.report.title} ({data.report.type})
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
        <CardContent><pre className="text-sm whitespace-pre-wrap font-sans">{inc.description || '—'}</pre></CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Pilotage du ticket
            {!canEdit && <Badge variant="outline" className="text-xs"><ShieldAlert className="h-3 w-3 mr-1" />Lecture seule</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Statut</Label>
              <Select value={status} onValueChange={setStatus} disabled={!canEdit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="declared">Déclaré</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                  <SelectItem value="closed">Clos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priorité</Label>
              <Select value={severity} onValueChange={setSeverity} disabled={!canEdit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsable</Label>
              <Select value={assigned || 'none'} onValueChange={v => setAssigned(v === 'none' ? '' : v)} disabled={!canEdit}>
                <SelectTrigger><SelectValue placeholder="Non assigné" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non assigné</SelectItem>
                  {(profiles ?? []).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {canEdit && (
            <>
              <div>
                <Label>Note de modification (optionnel)</Label>
                <Textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Justification du changement..." />
              </div>
              <Button onClick={submit} disabled={update.isPending}><Save className="h-4 w-4 mr-2" />Enregistrer</Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" />Historique</CardTitle></CardHeader>
        <CardContent>
          {data.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun changement enregistré</p>
          ) : (
            <ul className="space-y-2">
              {data.history.map((h: any) => (
                <li key={h.id} className="text-sm border-l-2 border-primary pl-3 py-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{h.user_name || 'Système'}</span>
                    <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span>
                  </div>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans mt-1">
                    {JSON.stringify(h.details?.changes ?? {}, null, 0)}
                    {h.details?.note ? `\n${h.details.note}` : ''}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default function RDTicketDetail() {
  return <ProtectedScreen screenId="rd.tickets"><Page /></ProtectedScreen>;
}
