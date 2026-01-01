import { AlertTriangle, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Incident } from '@/types';
import { getPoleById } from '@/data/poles';
import { formatDistanceToNow } from 'date-fns';

interface IncidentCardProps {
  incident: Incident;
}

export function IncidentCard({ incident }: IncidentCardProps) {
  const pole = getPoleById(incident.poleId);

  const getSeverityVariant = () => {
    switch (incident.severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusColor = () => {
    switch (incident.status) {
      case 'open':
        return 'status-critical';
      case 'investigating':
        return 'status-pending';
      case 'resolved':
      case 'closed':
        return 'status-active';
      default:
        return 'bg-muted-foreground';
    }
  };

  return (
    <div className="enterprise-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            incident.severity === 'critical' || incident.severity === 'high'
              ? 'bg-destructive/10 text-destructive'
              : 'bg-warning/10 text-warning'
          )}>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground">{incident.title}</h4>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
              {incident.description}
            </p>
          </div>
        </div>
        <Badge variant={getSeverityVariant()} className="shrink-0 text-[10px]">
          {incident.severity}
        </Badge>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className={cn('status-dot', getStatusColor())} />
          <span className="capitalize">{incident.status.replace('_', ' ')}</span>
        </div>
        {pole && (
          <div className="flex items-center gap-1">
            <span className={cn('h-1.5 w-1.5 rounded-full', pole.color)} />
            <span>{pole.shortName}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}</span>
        </div>
        {incident.assignedTo && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{incident.assignedTo}</span>
          </div>
        )}
      </div>
    </div>
  );
}
