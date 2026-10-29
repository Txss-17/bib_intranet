import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQualityActions, useQualityTimeline } from '@/hooks/useQualityAlerts';
import { QualityPage, QUALITY_STATUS, QUALITY_SEVERITY } from '@/lib/qualityAlerts';
const fields = { title: 'Titre', description: 'Constat', status: 'État', severity: 'Sévérité', assigned_to: 'Responsable', is_nonconformity: 'Non-conformité', corrective_action: 'Action corrective', corrective_due_date: 'Échéance', evidence: 'Éléments de preuve', resolution_notes: 'Compte rendu de correction', first_reviewer: 'Première validation', closed_by: 'Clôture', archived_at: 'Archivage' };
export default function QualityTimeline({ page, id, canComment, people }: { page: QualityPage; id: string; canComment: boolean; people: { id: string; name: string }[] }) {
 const [offset, setOffset] = useState(0); const [body, setBody] = useState(''); const query = useQualityTimeline(page, id, offset); const { comment } = useQualityActions(page);
 const display = (key: string, value: unknown) => {
  if (value == null || value === '') return '—';
  if (key === 'status') return QUALITY_STATUS[String(value) as keyof typeof QUALITY_STATUS] || String(value);
  if (key === 'severity') return QUALITY_SEVERITY[String(value) as keyof typeof QUALITY_SEVERITY] || String(value);
  if (['assigned_to','first_reviewer','closed_by'].includes(key)) return people.find(p => p.id === value)?.name || 'Collaborateur';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';return String(value);
 };
 return <section className="space-y-3 border-t pt-5"><h2 className="font-semibold">Commentaires et historique</h2>
  {canComment && <div className="space-y-2"><Label htmlFor="quality-comment">Commentaire interne</Label><Textarea id="quality-comment" maxLength={5000} rows={3} value={body} onChange={event => setBody(event.target.value)} /><Button disabled={!body.trim() || comment.isPending} onClick={() => comment.mutate({ id, body }, { onSuccess: () => { setBody(''); setOffset(0); } })}>Ajouter le commentaire</Button></div>}
  {query.isLoading && <p role="status">Chargement…</p>}{query.isError && <p role="alert">Historique indisponible. <Button variant="link" onClick={() => void query.refetch()}>Réessayer</Button></p>}{query.data?.rows.length === 0 && <p className="text-muted-foreground">Les prochains changements seront consignés ici.</p>}
  {query.data?.rows.map(event => <details key={event.id} className="rounded border p-3 text-sm"><summary className="cursor-pointer">{{ comment: 'Commentaire', insert: 'Création', imported: 'État historique repris', update: 'Modification' }[event.action] || 'Événement'} · {event.actor_name || 'Système'} · {new Date(event.created_at).toLocaleString('fr-FR')}</summary>{event.note && <p className="mt-2 whitespace-pre-wrap">{event.note}</p>}<dl className="mt-2 space-y-2">{Object.entries(fields).filter(([key]) => JSON.stringify(event.before_state?.[key]) !== JSON.stringify(event.after_state?.[key])).map(([key, label]) => <div key={key}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="whitespace-pre-wrap break-words">{display(key, event.before_state?.[key])} → {display(key, event.after_state?.[key])}</dd></div>)}</dl></details>)}
  <div className="flex justify-end gap-2"><Button size="sm" variant="outline" disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 50))}>Plus récents</Button><Button size="sm" variant="outline" disabled={!query.data?.has_more} onClick={() => setOffset(offset + 50)}>Plus anciens</Button></div>
 </section>;
}
