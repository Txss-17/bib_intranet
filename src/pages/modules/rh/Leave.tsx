import { HrRecordsPage, HrRecordsConfig } from '@/components/rh/HrRecordsPage';

const config: HrRecordsConfig = {
  table: 'hr_leave_requests',
  title: 'Congés',
  description: 'Demandes de congés, validation RH et historique',
  itemLabel: 'Demande de congé',
  orderBy: 'start_date',
  employeeKey: 'employee_id',
  dateKey: 'start_date',
  selfService: true,
  searchKeys: ['employee_id', 'leave_type', 'reason'],
  fields: [
    { key: 'employee_id', label: 'Collaborateur', type: 'employee', required: true, hrOnly: true },
    { key: 'leave_type', label: 'Type', type: 'select', required: true, defaultValue: 'cp', options: [
      { value: 'cp', label: 'Congés payés' }, { value: 'rtt', label: 'RTT' }, { value: 'sick', label: 'Maladie' },
      { value: 'unpaid', label: 'Sans solde' }, { value: 'other', label: 'Autre' } ] },
    { key: 'start_date', label: 'Début', type: 'date', required: true },
    { key: 'end_date', label: 'Fin', type: 'date', required: true },
    { key: 'reason', label: 'Motif', type: 'textarea' },
  ],
  statuses: [
    { value: 'pending', label: 'En attente', tone: 'outline' },
    { value: 'approved', label: 'Approuvé', tone: 'default' },
    { value: 'rejected', label: 'Refusé', tone: 'destructive' },
    { value: 'cancelled', label: 'Annulé', tone: 'secondary' },
  ],
  transitions: { pending: ['approved', 'rejected'], approved: ['cancelled'] },
};

export default function Leave() {
  return <HrRecordsPage config={config} />;
}
