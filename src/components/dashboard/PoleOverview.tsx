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

export function PoleOverview() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {poles.map((pole) => {
        const Icon = iconMap[pole.icon] ?? Crown;

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
