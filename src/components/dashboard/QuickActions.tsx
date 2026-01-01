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
    label: 'New Document',
    icon: FileText,
    path: '/documents/new',
    color: 'bg-accent/10 text-accent hover:bg-accent/20',
  },
  {
    label: 'Report Incident',
    icon: AlertTriangle,
    path: '/modules/incidents/new',
    color: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
  },
  {
    label: 'Create Task',
    icon: ClipboardList,
    path: '/tasks/new',
    color: 'bg-warning/10 text-warning hover:bg-warning/20',
  },
  {
    label: 'Schedule Meeting',
    icon: Calendar,
    path: '/calendar/new',
    color: 'bg-success/10 text-success hover:bg-success/20',
  },
  {
    label: 'Send Message',
    icon: MessageSquare,
    path: '/messages/new',
    color: 'bg-pole-marketing/10 text-pole-marketing hover:bg-pole-marketing/20',
  },
  {
    label: 'Add Contact',
    icon: Users,
    path: '/contacts/new',
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
