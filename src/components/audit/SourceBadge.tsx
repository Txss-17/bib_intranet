import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Shield } from 'lucide-react';

export type AuditSource = 'connect' | 'audit_hub' | 'bos';

const labels: Record<string, string> = {
  connect: 'Connect',
  audit_hub: 'Audit Hub',
  bos: 'B.O.S',
};

export function SourceBadge({ source }: { source?: string | null }) {
  const s = source || 'connect';
  if (s === 'audit_hub') {
    return (
      <Badge variant="outline" className="gap-1 border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400">
        <Shield className="h-3 w-3" /> {labels[s]}
      </Badge>
    );
  }
  if (s === 'bos') {
    return (
      <Badge variant="outline" className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <Building2 className="h-3 w-3" /> {labels[s]}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 border-primary/40 bg-primary/10 text-primary">
      <Building2 className="h-3 w-3" /> {labels.connect}
    </Badge>
  );
}

export function SourceFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Source" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Toutes les sources</SelectItem>
        <SelectItem value="connect">Connect</SelectItem>
        <SelectItem value="audit_hub">B.I.B Audit Hub</SelectItem>
        <SelectItem value="bos">Business OS</SelectItem>
      </SelectContent>
    </Select>
  );
}
