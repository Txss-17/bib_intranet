import { TableHead } from '@/components/ui/table';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableTableHeadProps {
  children: React.ReactNode;
  column: string;
  currentSort: string | null;
  direction: 'asc' | 'desc' | null;
  onSort: (column: string) => void;
  className?: string;
}

export function SortableTableHead({ children, column, currentSort, direction, onSort, className }: SortableTableHeadProps) {
  const isActive = currentSort === column;

  return (
    <TableHead
      className={cn('cursor-pointer select-none hover:bg-muted/50 transition-colors', className)}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        <span>{children}</span>
        {isActive && direction === 'asc' && <ChevronUp className="h-3 w-3" />}
        {isActive && direction === 'desc' && <ChevronDown className="h-3 w-3" />}
        {!isActive && <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />}
      </div>
    </TableHead>
  );
}
