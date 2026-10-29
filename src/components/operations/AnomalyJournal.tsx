import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAnomalyActions, useAnomalyEvents, useAnomalyNotifications } from '@/hooks/useAnomalies';
import { ANOMALY_STATUS_LABELS, SEVERITY_LABELS, NOTIF_KIND_LABELS, anomalyDate, type AnomalyStatus, type AnomalySeverity } from '@/lib/opsAnomalies';
const labels = { title: 'Titre', type: 'Type', description: 'Constat', severity: 'Sévérité', status: 'Statut', team: 'Équipe', category: 'Catégorie', owner_id: 'Responsable', due_at: 'Échéance', reminder_at: 'Rappel', checks: 'Vérifications prévues', completed_checks: 'Vérifications effectuées', corrective_action: 'Action corrective', evidence: 'Preuve', resolution: 'Résolution proposée', closure_kind: 'Type de clôture', archived_at: 'Archivage', document_ids: 'Pièces jointes' };
function display(key: string, value: unknown) {
 if (value == null || value === '') return '—';
 if (key === 'status') return ANOMALY_STATUS_LABELS[value as AnomalyStatus] || String(value);
 if (key === 'severity') return SEVERITY_LABELS[value as AnomalySeverity] || String(value);
 if (key === 'closure_kind') return value === 'dismissed' ? 'Classement sans suite' : 'Résolution validée';
 if (key === 'owner_id') return 'Collaborateur attribué';
 if (['due_at','reminder_at','archived_at'].includes(key)) return anomalyDate(String(value));
 if (key === 'document_ids' && Array.isArray(value)) return `${value.length} pièce(s)`;
 if (Array.isArray(value)) return value.join('\n') || '—';return String(value);
}
export default function AnomalyJournal({ id, canComment }: { id: string; canComment: boolean }) {
 const [offset, setOffset] = useState(0);const [body, setBody] = useState('');const query = useAnomalyEvents(id, offset);const { comment } = useAnomalyActions();
 return <section className="space-y-3 border-t pt-4"><h2 className="font-semibold">Commentaires et historique</h2>{canComment && <div className="space-y-2"><Label htmlFor="anomaly-comment">Commentaire interne</Label><Textarea id="anomaly-comment" maxLength={5000} value={body} onChange={event => setBody(event.target.value)} /><Button disabled={comment.isPending || !body.trim()} onClick={() => comment.mutate({ id, message: body }, { onSuccess: () => { setBody('');setOffset(0); } })}>Ajouter le commentaire</Button></div>}
 {query.isLoading && <p role="status">Chargement de l’historique…</p>}{query.isError && <p role="alert">Historique indisponible. <Button variant="link" onClick={() => void query.refetch()}>Réessayer</Button></p>}
 {query.data?.rows.map(event => {
 const before = event.before_state as Record<string, unknown> | null;const after = event.after_state as Record<string, unknown> | null;
 return <details key={event.id} className="rounded border p-3"><summary className="cursor-pointer text-sm">{event.kind === 'comment' ? 'Commentaire' : event.kind === 'created' ? 'Création' : event.kind === 'status' ? 'Changement d’état' : 'Modification'} · {event.actor_name || 'Système'} · {anomalyDate(event.created_at)}</summary>{event.message && <p className="mt-2 whitespace-pre-wrap">{event.message}</p>}<dl className="mt-2 space-y-2">{Object.entries(labels).filter(([key]) => JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key])).map(([key, label]) => <div key={key}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="whitespace-pre-wrap break-words text-sm">{display(key, before?.[key])} → {display(key, after?.[key])}</dd></div>)}</dl></details>;
 })}<div className="flex justify-end gap-2"><Button variant="outline" size="sm" disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 50))}>Plus récents</Button><Button variant="outline" size="sm" disabled={!query.data?.has_more} onClick={() => setOffset(offset + 50)}>Plus anciens</Button></div></section>;
}
export function AnomalyNotifications({ id = null }: { id?: string | null }) {
 const [offset, setOffset] = useState(0);const [params, setParams] = useSearchParams();const query = useAnomalyNotifications(id, offset);
 return <section className="space-y-3"><h2 className="font-semibold">Notifications internes envoyées</h2>{query.isLoading && <p role="status">Chargement…</p>}{query.isError && <p role="alert">Journal des rappels indisponible. <Button variant="link" onClick={() => void query.refetch()}>Réessayer</Button></p>}{query.data?.rows.length === 0 && <p className="text-sm text-muted-foreground">Aucune notification consignée.</p>}<ul className="divide-y">{query.data?.rows.map(notification => <li key={notification.id}><button className="w-full py-3 text-left text-sm hover:underline" onClick={() => { const next = new URLSearchParams(params);next.set('anomaly', notification.anomaly_id);setParams(next, { replace: true }); }}><span className="block font-medium">{notification.reference} · {NOTIF_KIND_LABELS[notification.kind] || notification.kind}</span><span className="block whitespace-pre-wrap">{notification.message}</span><span className="text-xs text-muted-foreground">{notification.recipient_name || 'Destinataire indisponible'} · {anomalyDate(notification.sent_at)}</span></button></li>)}</ul><div className="flex justify-end gap-2"><Button variant="outline" size="sm" disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 50))}>Plus récentes</Button><Button variant="outline" size="sm" disabled={!query.data?.has_more} onClick={() => setOffset(offset + 50)}>Plus anciennes</Button></div></section>;
}
