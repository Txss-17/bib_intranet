import { Link } from 'react-router-dom';
import {
  Crown,
  Wallet,
  Cog,
  Code,
  Users,
  Package,
  ClipboardCheck,
  Scale,
  Leaf,
  Megaphone,
  ShieldAlert,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { poles } from '@/data/poles';
import { PoleId } from '@/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Crown,
  Wallet,
  Cog,
  Code,
  Users,
  Package,
  ClipboardCheck,
  Scale,
  Leaf,
  Megaphone,
  ShieldAlert,
  RefreshCw,
};

// Mock activity data
const poleActivity: Record<PoleId, { tasks: number; incidents: number; updates: number }> = {
  direction: { tasks: 5, incidents: 0, updates: 3 },
  finance: { tasks: 12, incidents: 0, updates: 8 },
  ops: { tasks: 24, incidents: 2, updates: 15 },
  tech: { tasks: 18, incidents: 1, updates: 22 },
  rh: { tasks: 8, incidents: 0, updates: 6 },
  supplier: { tasks: 15, incidents: 1, updates: 9 },
  audit: { tasks: 6, incidents: 0, updates: 4 },
  compliance: { tasks: 9, incidents: 0, updates: 7 },
  rse: { tasks: 7, incidents: 0, updates: 5 },
  marketing: { tasks: 11, incidents: 0, updates: 12 },
  risk: { tasks: 4, incidents: 3, updates: 6 },
  lifecycle: { tasks: 13, incidents: 1, updates: 8 },
};

export function PoleOverview() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {poles.map((pole) => {
        const Icon = iconMap[pole.icon] || Crown;
        const activity = poleActivity[pole.id];

        return (
          <Link
            key={pole.id}
            to={`/pole/${pole.id}`}
            className="enterprise-card p-4 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-secondary')}>
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{pole.shortName}</h3>
                  <p className="text-xs text-muted-foreground">{pole.name}</p>
                </div>
              </div>
              <span className={cn('h-2 w-2 rounded-full', pole.color)} />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-semibold text-foreground">{activity.tasks}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Tasks</p>
              </div>
              <div>
                <p className={cn(
                  'text-lg font-semibold',
                  activity.incidents > 0 ? 'text-warning' : 'text-foreground'
                )}>
                  {activity.incidents}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">Incidents</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{activity.updates}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Updates</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-end text-xs text-muted-foreground group-hover:text-accent transition-colors">
              <span>View dashboard</span>
              <ArrowRight className="ml-1 h-3 w-3" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
