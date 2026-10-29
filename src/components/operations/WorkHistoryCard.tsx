import { useWorkModuleEvents, WorkModuleKind, ESCALATION_SEVERITY_LABELS } from '@/hooks/useWorkModule';
import { workStatusLabel, workEventLabel } from '@/lib/workModuleLabels';
import { poles } from '@/data/poles';
import { Button } from '@/components/ui/button';

const labels: Record<string, string> = {
  name: 'Nom', title: 'Titre', description: 'Description', pole: 'Pôle', status: 'Statut',
  owner_id: 'Responsable', validator_id: 'Validateur', assigned_to: 'Responsable',
  due_date: 'Échéance', steps: 'Étapes', severity: 'Gravité',
  decision_note: 'Motif de décision', resolution_note: 'Résolution',
};
function show(kind: WorkModuleKind, key: string, value: unknown, responsible: string) {
  if (value == null || value === '') return '—';
  if (['owner_id', 'validator_id', 'assigned_to'].includes(key)) return responsible || 'Compte non disponible';
  if (key === 'pole') return poles.find(p => p.id === value)?.name || String(value);
  if (key === 'severity') return ESCALATION_SEVERITY_LABELS[String(value) as keyof typeof ESCALATION_SEVERITY_LABELS] || String(value);
  if (key === 'status') return workStatusLabel(kind, String(value));
  if (Array.isArray(value)) return value.map(x => typeof x === 'object' && x && 'label' in x ? String(x.label) : String(x)).join('\n');
  return String(value);
}
export default function WorkHistoryCard({ kind, id }: { kind: WorkModuleKind; id: string }) {
  const query = useWorkModuleEvents(kind, id);
  return (
    <section className="space-y-3 border-t pt-4">
      <h2 className="font-semibold">Historique</h2>
      {query.isLoading && <p role="status">Chargement…</p>}
      {query.isError && <p role="alert">Historique indisponible. <Button variant="link" onClick={() => void query.refetch()}>Réessayer</Button></p>}
      {query.data?.length === 0 && <p className="text-muted-foreground">Les prochains changements apparaîtront ici.</p>}
      {query.data?.map(event => (
        <details key={event.id} className="rounded border p-3 text-sm">
          <summary className="cursor-pointer">
            {workEventLabel(event.action)} · {event.actor_name || 'Système'} · {new Date(event.created_at).toLocaleString('fr-FR')}
          </summary>
          {event.note && <p className="mt-2 whitespace-pre-wrap">{event.note}</p>}
          <dl className="mt-2 space-y-2">
            {Object.entries(labels)
              .filter(([key]) => JSON.stringify(event.before_state?.[key]) !== JSON.stringify(event.after_state?.[key]))
              .map(([key, label]) => (
                <div key={key}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="whitespace-pre-wrap break-words">
                    {show(kind, key, event.before_state?.[key], event.before_responsible)} → {show(kind, key, event.after_state?.[key], event.after_responsible)}
                  </dd>
                </div>
              ))}
          </dl>
        </details>
      ))}
    </section>
  );
}
