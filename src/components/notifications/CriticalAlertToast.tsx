import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CriticalAlert } from '@/hooks/useCriticalAlerts';

interface CriticalAlertToastProps {
  alert: CriticalAlert;
  onDismiss: () => void;
  onMarkAsRead: (id: string) => void;
}

export function CriticalAlertToast({ alert, onDismiss, onMarkAsRead }: CriticalAlertToastProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleAction = () => {
    onMarkAsRead(alert.id);
    onDismiss();
    if (alert.actionUrl) navigate(alert.actionUrl);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div className={cn(
        'flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm',
        alert.severity === 'critical'
          ? 'bg-destructive/10 border-destructive/30'
          : 'bg-warning/10 border-warning/30'
      )}>
        <div className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          alert.severity === 'critical' ? 'bg-destructive text-destructive-foreground' : 'bg-warning text-warning-foreground'
        )}>
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{alert.title}</p>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onDismiss}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.description}</p>
          <Button variant="ghost" size="sm" className="text-xs h-7 mt-2 px-0 text-primary" onClick={handleAction}>
            Voir détails <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
