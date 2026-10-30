import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useSavEscalationQueue, useSavEscalationEvents, useSavEscalationActions } from '@/hooks/useSavEscalations';
import WorkModulePage from '@/components/operations/WorkModulePage';

const labels = {
 awaiting_intake: 'À prendre en charge',
 acknowledged: 'Prise en charge',
 closed: 'Clôturée',
};
const when = (value: string) => Number.isFinite(Date.parse(value))
 ? new Date(value).toLocaleString('fr-FR') : 'Date indisponible';

export default function SupportEscalations() {
 const { user } = useAuth();
 const { can } = usePermissions();
 const [params, setParams] = useSearchParams();
 const queue = useSavEscalationQueue();
 const actions = useSavEscalationActions();
 const [note, setNote] = useState('');
 const issueId = params.get('issue');
 const rows = queue.data ?? [];
 const selected = rows.find(item => item.issue_id === issueId);
 const events = useSavEscalationEvents(selected?.issue_id ?? null);
 const mayUpdate = can('support.escalations', 'update');
 const busy = actions.acknowledge.isPending || actions.close.isPending;
 const open = (id: string | null) => {
  const next = new URLSearchParams(params);
  if (id) next.set('issue', id); else next.delete('issue');
  setParams(next, { replace: true });
  setNote('');
 };
 const totalPending = rows.filter(item => item.status === 'awaiting_intake').length;

 return <div className="space-y-7">
  <Card>
   <CardHeader>
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div>
      <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" />SAV assuré — reprises après 48 h</CardTitle>
      <p className="mt-2 text-sm text-muted-foreground">
       File des dossiers pour lesquels Platform a confirmé l'absence de réponse du marchand
       et l'éligibilité à l'assurance BIB. BIB coordonne la suite ; le marchand demeure le vendeur juridique.
      </p>
     </div>
     <Button variant="outline" disabled={queue.isFetching} onClick={() => void queue.refetch()}>
      <RefreshCw className="mr-2 h-4 w-4" />Actualiser
     </Button>
    </div>
   </CardHeader>
   <CardContent className="space-y-4">
    <div className="text-sm text-muted-foreground">
     {queue.isLoading ? 'Lecture de la file SAV…'
      : queue.isError ? 'Les données SAV ne sont pas disponibles.'
      : `${totalPending} à prendre en charge sur les ${rows.length} derniers dossiers visibles (200 maximum).`}
    </div>
    {queue.isError && <div role="alert" className="text-sm text-destructive">
     Une migration ou une permission peut être manquante. Aucun dossier n'est considéré comme traité.
     <Button variant="link" onClick={() => void queue.refetch()}>Réessayer</Button>
    </div>}
    {!queue.isLoading && !queue.isError && rows.length === 0 &&
     <p className="text-sm text-muted-foreground">
      Aucun transfert SAV enregistré dans cette file. Cela ne confirme pas que le planificateur Platform est actif.
     </p>}
    {!queue.isError && rows.length > 0 && <div className="divide-y rounded-lg border">
     {rows.map(item => <button key={item.issue_id} type="button"
      className={`flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left hover:bg-muted/40 ${issueId === item.issue_id ? 'bg-muted/50' : ''}`}
      onClick={() => open(item.issue_id)}>
      <span>
       <span className="block font-medium">Signalement {item.issue_id.slice(0, 8)}</span>
       <span className="text-xs text-muted-foreground">
        Commande {item.platform_order_id.slice(0, 8)} · Échéance {when(item.due_at)} · Escaladé le {when(item.escalated_at)}
       </span>
      </span>
      <Badge variant={item.status === 'awaiting_intake' ? 'destructive' : 'outline'}>{labels[item.status]}</Badge>
     </button>)}
    </div>}
    {issueId && !queue.isLoading && !queue.isError && !selected &&
     <p role="alert" className="text-sm text-muted-foreground">
      Ce dossier n'est pas accessible dans les 200 dernières entrées de votre périmètre.
     </p>}
    {selected && <div className="space-y-3 rounded-lg border p-4">
     <div className="flex items-center justify-between gap-2">
      <h3 className="font-medium">Dossier SAV {selected.issue_id.slice(0, 8)}</h3>
      <Button variant="ghost" onClick={() => open(null)}>Fermer le détail</Button>
     </div>
     <p className="text-sm text-muted-foreground">
      Statut : {labels[selected.status]}. Opération limitée à la coordination SAV, sans remboursement ni notification client automatique.
     </p>
     <p className="text-sm">Référence commande Platform : <code>{selected.platform_order_id}</code></p>
     <p className="text-sm">Boutique Platform : <code>{selected.platform_boutique_id}</code></p>
     {selected.status === 'awaiting_intake' && <Button disabled={!mayUpdate || busy}
      onClick={() => actions.acknowledge.mutate(selected.issue_id)}>
      <CheckCircle2 className="mr-2 h-4 w-4" />Prendre en charge
     </Button>}
     {selected.status === 'acknowledged' && selected.assigned_to === user?.id && <>
      <Textarea value={note} onChange={event => setNote(event.target.value)}
       maxLength={3000} placeholder="Résumé factuel du traitement, décisions et références (10 caractères minimum)" />
      <Button disabled={!mayUpdate || busy || note.trim().length < 10}
       onClick={() => actions.close.mutate({ issueId: selected.issue_id, note })}>Clôturer avec compte rendu</Button>
     </>}
     {(actions.acknowledge.isError || actions.close.isError) &&
      <p role="alert" className="text-sm text-destructive">
       {actions.acknowledge.error?.message || actions.close.error?.message || 'Opération indisponible.'}
      </p>}
     <h4 className="text-sm font-medium">Historique des décisions</h4>
     {events.isLoading && <p className="text-xs text-muted-foreground">Chargement de l'historique…</p>}
     {events.isError && <p role="alert" className="text-xs text-destructive">Historique indisponible.</p>}
     {events.data?.length === 0 && <p className="text-xs text-muted-foreground">Aucune action interne enregistrée.</p>}
     {events.data?.map(event => <p key={event.id} className="text-xs text-muted-foreground">
      {when(event.created_at)} · {event.action} {event.note ? `· ${event.note}` : ''}
     </p>)}
    </div>}
   </CardContent>
  </Card>
  <div>
   <h2 className="mb-3 text-lg font-semibold">Autres escalades Support</h2>
   <WorkModulePage kind="escalations" defaultPole="support" title="Escalades Support internes" />
  </div>
 </div>;
}
