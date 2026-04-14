import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell, MessageSquare, CheckSquare, Search, Menu, Sun, Moon, ChevronDown,
  LogOut, User, Settings, Circle, ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getPoleById } from '@/data/poles';
import { PoleId } from '@/types';
import { EmployeeStatus } from '@/types/roles';
import { useCriticalAlerts } from '@/hooks/useCriticalAlerts';
import { CriticalAlertsPanel } from '@/components/notifications/CriticalAlertsPanel';
import { CriticalAlertToast } from '@/components/notifications/CriticalAlertToast';
import { useAuth } from '@/hooks/useAuth';
import { positionInfos } from '@/types/positions';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface TopBarProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activePoleId?: PoleId;
}

const statusColors: Record<EmployeeStatus, string> = {
  online: 'bg-success',
  absent: 'bg-muted-foreground',
  busy: 'bg-warning',
  offline: 'bg-muted-foreground/50',
};

const statusLabels: Record<EmployeeStatus, string> = {
  online: 'En ligne',
  absent: 'Absent',
  busy: 'Occupé',
  offline: 'Hors ligne',
};

function useNotifications() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['notifications', profile?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'critical': return 'bg-destructive';
    case 'warning': return 'bg-warning';
    case 'success': return 'bg-success';
    default: return 'bg-accent';
  }
};

export function TopBar({ onToggleSidebar, sidebarCollapsed, darkMode, onToggleDarkMode, activePoleId }: TopBarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const { alerts, unreadCount, criticalCount, lastAlert, markAsRead, markAllAsRead, dismissLastAlert } = useCriticalAlerts();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: dbNotifications = [] } = useNotifications();
  
  const firstName = profile?.first_name || 'U';
  const lastName = profile?.last_name || '';
  const email = profile?.email || '';
  const posInfo = profile?.position ? positionInfos[profile.position as keyof typeof positionInfos] : null;
  const roleTitle = posInfo?.titleFr || profile?.position || 'Collaborateur';

  const unreadNotifications = dbNotifications.filter(n => !n.read).length;
  const activePole = activePoleId ? getPoleById(activePoleId) : null;

  return (
    <>
    <header
      className={cn(
        'fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-64'
      )}
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="shrink-0"><Menu className="h-5 w-5" /></Button>
        {activePole && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border">
            <span className={cn('h-2 w-2 rounded-full', activePole.color)} />
            <span className="text-sm font-medium text-foreground">{activePole.shortName}</span>
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text" placeholder="Rechercher..."
            className={cn('h-9 rounded-lg border border-input bg-secondary/50 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-accent focus:ring-1 focus:ring-accent', searchFocused ? 'w-64' : 'w-48')}
            onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/30">
          <Circle className={cn('h-2 w-2 fill-current', statusColors['online'])} />
          <span className="text-xs text-muted-foreground">{statusLabels['online']}</span>
        </div>

        <Button variant="ghost" size="icon" onClick={onToggleDarkMode} className="text-muted-foreground hover:text-foreground">
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className={cn('relative', criticalCount > 0 && 'animate-pulse')}>
              <ShieldAlert className={cn('h-5 w-5', criticalCount > 0 ? 'text-destructive' : '')} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">{unreadCount}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="p-0 w-auto">
            <CriticalAlertsPanel alerts={alerts} onMarkAsRead={markAsRead} onMarkAllAsRead={markAllAsRead} />
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">{unreadNotifications}</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-sm font-semibold">Notifications</span>
              <span className="text-xs text-muted-foreground">{dbNotifications.length} récentes</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {dbNotifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Aucune notification</div>
              ) : (
                dbNotifications.slice(0, 5).map((notification) => {
                  const pole = notification.pole_id ? getPoleById(notification.pole_id as PoleId) : null;
                  return (
                    <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                      <div className="flex items-center gap-2 w-full">
                        <span className={cn('h-2 w-2 rounded-full', getNotificationIcon(notification.type || 'info'))} />
                        <span className="text-sm font-medium truncate flex-1">{notification.title}</span>
                        {!notification.read && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 pl-4">{notification.message}</p>
                      {pole && (
                        <div className="flex items-center gap-1 pl-4 mt-1">
                          <span className={cn('h-1.5 w-1.5 rounded-full', pole.color)} />
                          <span className="text-[10px] text-muted-foreground">{pole.shortName}</span>
                        </div>
                      )}
                    </DropdownMenuItem>
                  );
                })
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Link to="/modules/gateway/inbox">
          <Button variant="ghost" size="icon" className="relative"><MessageSquare className="h-5 w-5" /></Button>
        </Link>

        <div className="mx-2 h-6 w-px bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <span className="text-sm font-medium">{firstName[0]}{lastName[0]}</span>
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{firstName} {lastName}</span>
                <span className="text-[10px] text-muted-foreground">{roleTitle}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-medium">{firstName} {lastName}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
              <p className="text-xs text-accent mt-1">{roleTitle}</p>
            </div>
            <DropdownMenuItem asChild><Link to="/profile" className="flex items-center gap-2 cursor-pointer"><User className="h-4 w-4" /><span>Mon profil</span></Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/settings" className="flex items-center gap-2 cursor-pointer"><Settings className="h-4 w-4" /><span>Paramètres</span></Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2 text-destructive cursor-pointer" onClick={async () => { await signOut(); navigate('/login'); }}>
              <LogOut className="h-4 w-4" /><span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    {lastAlert && <CriticalAlertToast alert={lastAlert} onDismiss={dismissLastAlert} onMarkAsRead={markAsRead} />}
    </>
  );
}
