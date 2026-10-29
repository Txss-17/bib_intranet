import {
  PROJECT_STATUS_LABELS, PROCESS_STATUS_LABELS, VALIDATION_STATUS_LABELS, ESCALATION_STATUS_LABELS,
} from '@/hooks/useWorkModule';

const statusLabels: Record<string, Record<string, string>> = {
  projects: PROJECT_STATUS_LABELS,
  processes: PROCESS_STATUS_LABELS,
  validations: VALIDATION_STATUS_LABELS,
  escalations: ESCALATION_STATUS_LABELS,
  tasks: { pending: 'À faire', in_progress: 'En cours', review: 'En revue', completed: 'Terminée' },
};
const eventLabels: Record<string, string> = {
  imported: 'État existant repris', created: 'Création', updated: 'Modification',
  status: 'Changement de statut', archived: 'Archivage', commented: 'Commentaire',
};
export const workStatusLabel = (kind: string, status: string | null) =>
  status ? statusLabels[kind]?.[status] || status : '—';
export const workEventLabel = (action: string) => eventLabels[action] || 'Événement';
