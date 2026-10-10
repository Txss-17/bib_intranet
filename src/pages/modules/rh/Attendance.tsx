import { HrRecordsPage, HrRecordsConfig } from '@/components/rh/HrRecordsPage';

const config: HrRecordsConfig = {
  table: 'hr_attendance_records',
  title: 'Présences',
  description: 'Pointage quotidien et suivi des présences',
  itemLabel: 'Présence',
  orderBy: 'work_date',
  employeeKey: 'employee_id',
  dateKey: 'work_date',
  selfService: true,
  searchKeys: ['employee_id', 'notes'],
  fields: [
    { key: 'employee_id', label: 'Collaborateur', type: 'employee', required: true, hrOnly: true },
    { key: 'work_date', label: 'Date', type: 'date', required: true, defaultValue: new Date().toISOString().slice(0, 10) },
    { key: 'status', label: 'Statut', type: 'select', required: true, defaultValue: 'present', inTable: false, options: [
      { value: 'present', label: 'Présent' }, { value: 'remote', label: 'Télétravail' }, { value: 'absent', label: 'Absent' },
      { value: 'late', label: 'Retard' }, { value: 'leave', label: 'En congé' } ] },
    { key: 'check_in', label: 'Arrivée', type: 'time' },
    { key: 'check_out', label: 'Départ', type: 'time' },
    { key: 'notes', label: 'Notes', type: 'textarea', inTable: false },
  ],
  statuses: [
    { value: 'present', label: 'Présent', tone: 'default' },
    { value: 'remote', label: 'Télétravail', tone: 'secondary' },
    { value: 'absent', label: 'Absent', tone: 'destructive' },
    { value: 'late', label: 'Retard', tone: 'outline' },
    { value: 'leave', label: 'En congé', tone: 'secondary' },
  ],
};

export default function Attendance() {
  return <HrRecordsPage config={config} />;
}
