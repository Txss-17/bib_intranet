import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Metric } from '@/types';

interface MetricCardProps {
  metric: Metric;
  className?: string;
}

export function MetricCard({ metric, className }: MetricCardProps) {
  const getTrendIcon = () => {
    if (!metric.changeType) return null;
    
    switch (metric.changeType) {
      case 'positive':
        return <TrendingUp className="h-3 w-3 text-success" />;
      case 'negative':
        return <TrendingDown className="h-3 w-3 text-destructive" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getChangeColor = () => {
    switch (metric.changeType) {
      case 'positive':
        return 'text-success';
      case 'negative':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className={cn('metric-card', className)}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {metric.label}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-foreground">
          {metric.value}
          {metric.unit && <span className="text-sm ml-0.5">{metric.unit}</span>}
        </span>
        {metric.change !== undefined && (
          <div className={cn('flex items-center gap-0.5 text-xs', getChangeColor())}>
            {getTrendIcon()}
            <span>{metric.change > 0 ? '+' : ''}{metric.change}</span>
          </div>
        )}
      </div>
    </div>
  );
}
