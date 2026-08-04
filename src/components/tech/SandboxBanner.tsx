import { Link } from 'react-router-dom';
import { FlaskConical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSandbox } from '@/hooks/useSandbox';

export function SandboxBanner() {
  const { isSandbox, setEnabled, totalRecords } = useSandbox();
  if (!isSandbox) return null;

  return (
    <div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-2 border-b border-warning/50 bg-warning/15 px-4 py-2 text-sm">
      <span className="flex items-center gap-2 font-medium">
        <FlaskConical className="h-4 w-4 text-warning" />
        Mode Sandbox — données fictives ({totalRecords} enregistrements simulés). Aucune donnée de production n'est
        affectée.
      </span>
      <span className="flex items-center gap-2">
        <Button size="sm" variant="outline" asChild>
          <Link to="/pole/tech/sandbox">Gérer la sandbox</Link>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEnabled(false)}>
          <X className="mr-1.5 h-3.5 w-3.5" /> Revenir en production
        </Button>
      </span>
    </div>
  );
}
