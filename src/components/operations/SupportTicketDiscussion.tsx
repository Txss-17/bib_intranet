import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSupportActions, useSupportHistory, useSupportNotes } from '@/hooks/useSupportTickets';
import { SUPPORT_CATEGORY, SUPPORT_PRIORITY, SUPPORT_STATUS, SupportTicket } from '@/lib/supportTickets';

const fieldLabels = {
  subject: 'Sujet', description: 'Description', status: 'Statut', priority: 'Priorité', category: 'Catégorie',
  assigned_to: 'Responsable', user_account_id: 'Compte client', resolution: 'Résolution',
  resolved_at: 'Date de résolution', closed_at: 'Date de fermeture', archived_at: 'Archivage',
};
const date = (value: string) => new Date(value).toLocaleString('fr-FR');
export default function SupportTicketDiscussion({ ticket, canComment, people }: {
  ticket: SupportTicket; canComment: boolean; people: { id: string; name: string }[];
}) {
  const [body, setBody] = useState('');
  const [notesOffset, setNotesOffset] = useState(0);
  const [historyOffset, setHistoryOffset] = useState(0);
  const notes = useSupportNotes(ticket.id, notesOffset);
  const history = useSupportHistory(ticket.id, historyOffset);
  const { addNote } = useSupportActions();
  const display = (key: string, value: unknown) => {
    if (value == null || value === '') return '—';
    if (key === 'status') return SUPPORT_STATUS[String(value) as keyof typeof SUPPORT_STATUS] || String(value);
    if (key === 'priority') return SUPPORT_PRIORITY[String(value) as keyof typeof SUPPORT_PRIORITY] || String(value);
    if (key === 'category') return SUPPORT_CATEGORY[String(value) as keyof typeof SUPPORT_CATEGORY] || String(value);
    if (key === 'assigned_to') return people.find(p => p.id === value)?.name || 'Compte indisponible';
    if (key === 'user_account_id') return 'Compte rattaché';
    if (key.endsWith('_at')) return date(String(value));
    return String(value);
  };
  return (
    <div className="space-y-6 border-t pt-5">
      <section className="space-y-3">
        <h2 className="font-semibold">Notes internes</h2>
        {notes.isLoading && <p role="status">Chargement…</p>}
        {notes.isError && <p role="alert">Notes indisponibles. <Button variant="link" onClick={() => void notes.refetch()}>Réessayer</Button></p>}
        {notes.data?.rows.length === 0 && <p className="text-muted-foreground">Aucune note interne.</p>}
        {notes.data?.rows.map(note => <div key={note.id} className="rounded border p-3"><p className="text-xs text-muted-foreground">{note.actor_name || 'Collaborateur'} · {date(note.created_at)}</p><p className="mt-1 whitespace-pre-wrap break-words">{note.body}</p></div>)}
        <div className="flex justify-end gap-2"><Button size="sm" variant="outline" disabled={!notesOffset} onClick={() => setNotesOffset(Math.max(0, notesOffset - 50))}>Notes récentes</Button><Button size="sm" variant="outline" disabled={!notes.data?.has_more} onClick={() => setNotesOffset(notesOffset + 50)}>Notes précédentes</Button></div>
        {canComment && <div className="space-y-2"><Label htmlFor="support-note">Ajouter une note interne</Label><Textarea id="support-note" maxLength={5000} rows={3} value={body} disabled={addNote.isPending} onChange={e => setBody(e.target.value)} /><Button disabled={addNote.isPending || !body.trim()} onClick={() => addNote.mutate({ id: ticket.id, body }, { onSuccess: () => { setBody(''); setNotesOffset(0); } })}>{addNote.isPending ? 'Enregistrement…' : 'Ajouter la note'}</Button></div>}
      </section>
      <section className="space-y-3">
        <h2 className="font-semibold">Historique du ticket</h2>
        {history.isLoading && <p role="status">Chargement…</p>}
        {history.isError && <p role="alert">Historique indisponible. <Button variant="link" onClick={() => void history.refetch()}>Réessayer</Button></p>}
        {history.data?.rows.length === 0 && <p className="text-muted-foreground">Les prochains changements seront consignés ici.</p>}
        {history.data?.rows.map(event => <details key={event.id} className="rounded border p-3"><summary className="cursor-pointer">{event.action === 'insert' ? 'Création' : event.after_state?.archived_at && !event.before_state?.archived_at ? 'Archivage' : event.after_state?.status !== event.before_state?.status ? 'Changement de statut' : 'Modification'} · {event.actor_name || 'Système'} · {date(event.created_at)}</summary>
          {event.after_state?.change_note && event.after_state.change_note !== event.before_state?.change_note && <p className="mt-2 whitespace-pre-wrap">{event.after_state.change_note}</p>}
          <dl className="mt-2 space-y-2">{Object.entries(fieldLabels).filter(([key]) => JSON.stringify(event.before_state?.[key]) !== JSON.stringify(event.after_state?.[key])).map(([key, label]) => <div key={key}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="whitespace-pre-wrap break-words">{display(key, event.before_state?.[key])} → {display(key, event.after_state?.[key])}</dd></div>)}</dl>
        </details>)}
        <div className="flex justify-end gap-2"><Button size="sm" variant="outline" disabled={!historyOffset} onClick={() => setHistoryOffset(Math.max(0, historyOffset - 50))}>Événements récents</Button><Button size="sm" variant="outline" disabled={!history.data?.has_more} onClick={() => setHistoryOffset(historyOffset + 50)}>Événements précédents</Button></div>
      </section>
    </div>
  );
}
