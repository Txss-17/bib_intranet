import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, Radio, X, CheckCheck, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CriticalAlert, AlertSeverity, AlertModule } from '@/hooks/useCriticalAlerts';

interface CriticalAlertsPanelProps {
  alerts: CriticalAlert[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const severityConfig: Record<AlertSeverity, { label: string; className: string; icon: typeof AlertTriangle }> = {
  critical: { label: 'Critique', className: 'bg-destructive text-destructive-foreground', icon: ShieldAlert },
  high: { label: 'Élevée', className: 'bg-warning text-warning-foreground', icon: AlertTriangle },
  medium: { label: 'Moyenne', className: 'bg-secondary text-secondary-foreground', icon: Radio },
};

const moduleLabels: Record<AlertModule, string> = {
  ethics: 'Ethics',
  gateway: 'Gateway',
};

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'À l\'instant';
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${Math.floor(hours / 24)}j`;
}

export function CriticalAlertsPanel({ alerts, onMarkAsRead, onMarkAllAsRead }: CriticalAlertsPanelProps) {
  const navigate = useNavigate();
  const unread = alerts.filter(a => !a.read).length;

  return (
    <div className="w-96">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          <span className="text-sm font-semibold text-foreground">Alertes critiques</span>
          {unread > 0 && (
            <Badge variant="destructive" className="text-[10px] h-5 px-1.5">{unread}</Badge>
          )}
        </div>
        {unread > 0 && (
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onMarkAllAsRead}>
            <CheckCheck className="h-3 w-3 mr-1" />
            Tout lire
          </Button>
        )}
      </div>

      {/* Alerts list */}
      <ScrollArea className="max-h-96">
        {alerts.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Aucune alerte active
          </div>
        ) : (
          alerts.slice(0, 10).map((alert) => {
            const severity = severityConfig[alert.severity];
            const SeverityIcon = severity.icon;
            return (
              <div
                key={alert.id}
                className={cn(
                  'flex gap-3 px-4 py-3 border-b border-border/50 cursor-pointer transition-colors hover:bg-secondary/30',
                  !alert.read && 'bg-secondary/20'
                )}
                onClick={() => {
                  onMarkAsRead(alert.id);
                  if (alert.actionUrl) navigate(alert.actionUrl);
                }}
              >
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', severity.className)}>
                  <SeverityIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{alert.title}</span>
                    {!alert.read && <span className="h-2 w-2 rounded-full bg-destructive shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">{moduleLabels[alert.module]}</Badge>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(alert.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </ScrollArea>
    </div>
  );
}
