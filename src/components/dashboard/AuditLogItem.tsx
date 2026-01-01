import { cn } from '@/lib/utils';
import { AuditLog } from '@/types';
import { getPoleById } from '@/data/poles';
import { format } from 'date-fns';

interface AuditLogItemProps {
  log: AuditLog;
  isLast?: boolean;
}

export function AuditLogItem({ log, isLast }: AuditLogItemProps) {
  const pole = log.poleId ? getPoleById(log.poleId) : null;

  const getActionColor = () => {
    switch (log.action) {
      case 'CREATE':
        return 'text-success';
      case 'UPDATE':
        return 'text-accent';
      case 'DELETE':
        return 'text-destructive';
      case 'DEPLOY':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="relative pl-8 pb-4">
      {/* Timeline dot and connector */}
      <div className="absolute left-0 top-1 flex flex-col items-center">
        <div className={cn('h-2 w-2 rounded-full bg-border', pole && pole.color)} />
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>

      {/* Content */}
      <div className="text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground">{log.userName}</span>
          <span className={cn('font-mono text-xs', getActionColor())}>{log.action}</span>
          <span className="text-muted-foreground">{log.resource}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{format(new Date(log.timestamp), 'MMM d, yyyy · HH:mm')}</span>
          {pole && (
            <>
              <span>·</span>
              <div className="flex items-center gap-1">
                <span className={cn('h-1.5 w-1.5 rounded-full', pole.color)} />
                <span>{pole.shortName}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
