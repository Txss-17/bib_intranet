import { MessageCircle, Heart, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { FeedItem } from '@/types';
import { getPoleById } from '@/data/poles';
import { formatDistanceToNow } from 'date-fns';

interface FeedCardProps {
  item: FeedItem;
}

export function FeedCard({ item }: FeedCardProps) {
  const pole = item.poleId ? getPoleById(item.poleId) : null;

  const getTypeBadgeVariant = () => {
    switch (item.type) {
      case 'announcement':
        return 'default';
      case 'policy':
        return 'secondary';
      case 'achievement':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <article className="enterprise-card p-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
          <span className="text-sm font-medium">
            {item.author.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground">{item.author.name}</span>
            <span className="text-sm text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">{item.author.role}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </span>
            {pole && (
              <>
                <span className="text-muted-foreground">·</span>
                <div className="flex items-center gap-1">
                  <span className={cn('h-2 w-2 rounded-full', pole.color)} />
                  <span className="text-xs text-muted-foreground">{pole.name}</span>
                </div>
              </>
            )}
          </div>
        </div>
        <Badge variant={getTypeBadgeVariant()} className="text-[10px] shrink-0">
          {item.type}
        </Badge>
      </div>

      {/* Content */}
      <div className="mt-3 pl-13">
        <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          {item.content}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center gap-4 pl-13 pt-3 border-t border-border/50">
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Heart className="h-4 w-4" />
          <span>{item.reactions}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <MessageCircle className="h-4 w-4" />
          <span>{item.comments}</span>
        </button>
      </div>
    </article>
  );
}
