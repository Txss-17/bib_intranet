import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bell,
  MessageSquare,
  CheckSquare,
  Search,
  Menu,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { currentUser, tasks } from '@/data/mockData';
import { getPoleById, poles } from '@/data/poles';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

interface TopBarProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

// Module-specific actions based on current route
const moduleActions: Record<string, { label: string; path: string }[]> = {
  '/': [
    { label: 'Vue globale', path: '/' },
    { label: 'Métriques', path: '/#metrics' },
    { label: 'Activité récente', path: '/#activity' },
  ],
  '/modules/ethics': [
    { label: 'Soumettre', path: '/modules/ethics?tab=submit' },
    { label: 'Suivre', path: '/modules/ethics?tab=track' },
  ],
  '/modules/gateway': [
    { label: 'Tous les messages', path: '/modules/gateway' },
    { label: 'En attente', path: '/modules/gateway?status=pending' },
    { label: 'Validés', path: '/modules/gateway?status=validated' },
    { label: 'Routés', path: '/modules/gateway?status=routed' },
  ],
  '/feed': [
    { label: 'Tous', path: '/feed' },
    { label: 'Annonces', path: '/feed?type=announcement' },
    { label: 'Mises à jour', path: '/feed?type=update' },
  ],
  '/documents': [
    { label: 'Tous', path: '/documents' },
    { label: 'Contrats', path: '/documents?type=contract' },
    { label: 'Procédures', path: '/documents?type=procedure' },
    { label: 'Rapports', path: '/documents?type=report' },
  ],
};

export function TopBar({ onToggleSidebar, sidebarCollapsed, darkMode, onToggleDarkMode }: TopBarProps) {
  const location = useLocation();
  const [searchFocused, setSearchFocused] = useState(false);
  const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead } = useRealtimeNotifications();
  
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;

  // Get current module actions
  const currentPath = location.pathname;
  const actions = moduleActions[currentPath] || [];

  // Find if we're on a pole page
  const poleMatch = currentPath.match(/^\/pole\/(.+)$/);
  const currentPole = poleMatch ? poles.find(p => p.id === poleMatch[1]) : null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-destructive';
      case 'warning':
        return 'bg-warning';
      case 'success':
        return 'bg-success';
      default:
        return 'bg-accent';
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-64'
      )}
    >
      {/* Left section - Module Actions (OX) */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Module-specific actions */}
        {currentPole ? (
          <div className="flex items-center gap-2">
            <span className={cn('h-3 w-3 rounded-full', currentPole.color)} />
            <span className="font-medium text-foreground">{currentPole.name}</span>
          </div>
        ) : actions.length > 0 ? (
          <nav className="hidden md:flex items-center gap-1">
            {actions.map((action, idx) => (
              <Link
                key={idx}
                to={action.path}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors',
                  location.pathname + location.search === action.path
                    ? 'bg-secondary text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                {action.label}
              </Link>
            ))}
          </nav>
        ) : null}

        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher..."
            className={cn(
              'h-9 rounded-lg border border-input bg-secondary/50 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-accent focus:ring-1 focus:ring-accent',
              searchFocused ? 'w-80' : 'w-48'
            )}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Connection status */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
          {isConnected ? (
            <>
              <Wifi className="h-3 w-3 text-success" />
              <span>Connecté</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-destructive" />
              <span>Hors ligne</span>
            </>
          )}
        </div>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleDarkMode}
          className="text-muted-foreground hover:text-foreground"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-sm font-semibold">Notifications</span>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAllAsRead()}
                    className="text-xs text-accent hover:underline"
                  >
                    Tout marquer lu
                  </button>
                )}
                <Link to="/notifications" className="text-xs text-accent hover:underline">
                  Voir tout
                </Link>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Aucune notification
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => {
                  const pole = notification.pole_id ? getPoleById(notification.pole_id as any) : null;
                  return (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className={cn('h-2 w-2 rounded-full', getNotificationIcon(notification.type))} />
                        <span className="text-sm font-medium truncate flex-1">{notification.title}</span>
                        {!notification.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 pl-4">
                        {notification.message}
                      </p>
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

        {/* Messages */}
        <Button variant="ghost" size="icon" className="relative">
          <MessageSquare className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
            2
          </span>
        </Button>

        {/* Tasks */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <CheckSquare className="h-5 w-5" />
              {pendingTasks > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-warning text-[10px] font-medium text-warning-foreground">
                  {pendingTasks}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-sm font-semibold">Mes Tâches</span>
              <Link to="/tasks" className="text-xs text-accent hover:underline">
                Voir tout
              </Link>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {tasks.map((task) => {
                const pole = getPoleById(task.poleId);
                return (
                  <DropdownMenuItem
                    key={task.id}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Badge
                        variant={task.priority === 'critical' ? 'destructive' : 'secondary'}
                        className="text-[10px] h-4 px-1.5"
                      >
                        {task.priority}
                      </Badge>
                      <span className="text-sm font-medium truncate flex-1">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 pl-0 mt-1">
                      {pole && (
                        <div className="flex items-center gap-1">
                          <span className={cn('h-1.5 w-1.5 rounded-full', pole.color)} />
                          <span className="text-[10px] text-muted-foreground">{pole.shortName}</span>
                        </div>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        Échéance: {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Separator */}
        <div className="mx-2 h-6 w-px bg-border" />

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <span className="text-sm font-medium">
                  {currentUser.firstName[0]}{currentUser.lastName[0]}
                </span>
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">
                  {currentUser.firstName} {currentUser.lastName}
                </span>
                <span className="text-[10px] text-muted-foreground capitalize">
                  {currentUser.role}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-medium">{currentUser.firstName} {currentUser.lastName}</p>
              <p className="text-xs text-muted-foreground">{currentUser.email}</p>
            </div>
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                <span>Profil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                <span>Paramètres</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2 text-destructive cursor-pointer">
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
