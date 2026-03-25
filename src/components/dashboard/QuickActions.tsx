import { Link } from 'react-router-dom';
import {
  Plus,
  FileText,
  AlertTriangle,
  Users,
  Calendar,
  MessageSquare,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const quickActions = [
  {
    label: 'Documents',
    icon: FileText,
    path: '/documents',
    color: 'bg-accent/10 text-accent hover:bg-accent/20',
  },
  {
    label: 'Signaler un incident',
    icon: AlertTriangle,
    path: '/pole/risk/active',
    color: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
  },
  {
    label: 'Audits',
    icon: ClipboardList,
    path: '/pole/audit',
    color: 'bg-warning/10 text-warning hover:bg-warning/20',
  },
  {
    label: 'Congés & Absences',
    icon: Calendar,
    path: '/pole/rh/leave',
    color: 'bg-success/10 text-success hover:bg-success/20',
  },
  {
    label: 'Feed interne',
    icon: MessageSquare,
    path: '/feed',
    color: 'bg-pole-marketing/10 text-pole-marketing hover:bg-pole-marketing/20',
  },
  {
    label: 'Employés',
    icon: Users,
    path: '/pole/rh/employees',
    color: 'bg-pole-rh/10 text-pole-rh hover:bg-pole-rh/20',
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {quickActions.map((action) => (
        <Link
          key={action.label}
          to={action.path}
          className={cn(
            'flex items-center gap-3 rounded-lg p-3 transition-colors',
            action.color
          )}
        >
          <action.icon className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
