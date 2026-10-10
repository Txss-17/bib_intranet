import { HrRecordsPage, HrRecordsConfig } from '@/components/rh/HrRecordsPage';

const config: HrRecordsConfig = {
  table: 'hr_trainings',
  title: 'Formation',
  description: 'Formations des collaborateurs, échéances et suivi',
  itemLabel: 'Formation',
  orderBy: 'created_at',
  employeeKey: 'employee_id',
  dateKey: 'start_date',
  searchKeys: ['title', 'provider', 'employee_id'],
  fields: [
    { key: 'title', label: 'Intitulé', type: 'text', required: true },
    { key: 'employee_id', label: 'Collaborateur', type: 'employee', required: true },
    { key: 'provider', label: 'Organisme', type: 'text' },
    { key: 'start_date', label: 'Début', type: 'date' },
    { key: 'due_date', label: 'Échéance', type: 'date' },
    { key: 'notes', label: 'Notes', type: 'textarea', inTable: false },
  ],
  statuses: [
    { value: 'planned', label: 'Planifiée', tone: 'outline' },
    { value: 'in_progress', label: 'En cours', tone: 'secondary' },
    { value: 'completed', label: 'Terminée', tone: 'default' },
    { value: 'cancelled', label: 'Annulée', tone: 'destructive' },
  ],
  transitions: { planned: ['in_progress', 'cancelled'], in_progress: ['completed', 'cancelled'] },
};

export default function Training() {
  return <HrRecordsPage config={config} />;
}
