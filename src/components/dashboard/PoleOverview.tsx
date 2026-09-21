import { Link } from 'react-router-dom';
import type { ComponentType } from 'react';
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  Code,
  Cog,
  Crown,
  Headphones,
  Leaf,
  Megaphone,
  Package,
  Scale,
  ShieldCheck,
  Store,
  Users,
  Wallet,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { poles } from '@/data/poles';
import type { PoleId } from '@/types';

type PoleActivity = {
  tasks: number;
  incidents: number;
  updates: number;
};

const iconMap: Record<
  string,
  ComponentType<{ className?: string }>
> = {
  Crown,
  Wallet,
  Cog,
  Package,
  Store,
  Headphones,
  Megaphone,
  Users,
  ClipboardCheck,
  Scale,
  Leaf,
  Code,
  BarChart3,
  ShieldCheck,
};

/**
 * Données d'activité de démonstration.
 *
 * Ces valeurs servent uniquement à alimenter la vue consolidée
 * des pôles dans le dashboard. Elles pourront ensuite être
 * remplacées par les KPI réels issus de Supabase.
 */
const poleActivity: Record<PoleId, PoleActivity> = {
  direction: {
    tasks: 5,
    incidents: 0,
    updates: 3,
  },

  finance: {
    tasks: 12,
    incidents: 0,
    updates: 8,
  },

  ops: {
    tasks: 24,
    incidents: 2,
    updates: 15,
  },

  supplier: {
    tasks: 15,
    incidents: 1,
    updates: 9,
  },

  marketplace: {
    tasks: 18,
    incidents: 1,
    updates: 14,
  },

  support: {
    tasks: 16,
    incidents: 1,
    updates: 11,
  },

  marketing: {
    tasks: 11,
    incidents: 0,
    updates: 12,
  },

  rh: {
    tasks: 8,
    incidents: 0,
    updates: 6,
  },

  audit: {
    tasks: 6,
    incidents: 0,
    updates: 4,
  },

  compliance: {
    tasks: 9,
    incidents: 0,
    updates: 7,
  },

  rse: {
    tasks: 7,
    incidents: 0,
    updates: 5,
  },

  product: {
    tasks: 18,
    incidents: 1,
    updates: 13,
  },

  data: {
    tasks: 6,
    incidents: 0,
    updates: 4,
  },

  security: {
    tasks: 7,
    incidents: 1,
    updates: 6,
  },
};

export function PoleOverview() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {poles.map((pole) => {
        const Icon = iconMap[pole.icon] ?? Crown;
        const activity = poleActivity[pole.id];

        return (
          <Link
            key={pole.id}
            to={`/pole/${pole.id}`}
            className="enterprise-card group p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg bg-secondary',
                  )}
                >
                  <Icon className="h-5 w-5 text-foreground" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {pole.shortName}
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    {pole.name}
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  pole.color,
                )}
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {activity.tasks}
                </p>

                <p className="text-[10px] uppercase text-muted-foreground">
                  Tasks
                </p>
              </div>

              <div>
                <p
                  className={cn(
                    'text-lg font-semibold',
                    activity.incidents > 0
                      ? 'text-warning'
                      : 'text-foreground',
                  )}
                >
                  {activity.incidents}
                </p>

                <p className="text-[10px] uppercase text-muted-foreground">
                  Incidents
                </p>
              </div>

              <div>
                <p className="text-lg font-semibold text-foreground">
                  {activity.updates}
                </p>

                <p className="text-[10px] uppercase text-muted-foreground">
                  Updates
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-end text-xs text-muted-foreground transition-colors group-hover:text-accent">
              <span>View dashboard</span>

              <ArrowRight className="ml-1 h-3 w-3" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
