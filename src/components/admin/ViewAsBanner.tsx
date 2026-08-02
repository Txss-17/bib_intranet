import { useViewAs } from '@/hooks/useViewAs';
import { Eye, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ViewAsBanner() {
  const { role, setRole } = useViewAs();
  if (!role) return null;
  return (
    <div className="flex items-center justify-center gap-3 border-b border-accent/40 bg-accent/10 px-4 py-2 text-xs">
      <Eye className="h-3.5 w-3.5 text-accent" />
      <span>
        Mode simulation : interface vue comme <strong>{role.label}</strong>
      </span>
      <Link to="/admin/test-accounts" className="underline underline-offset-2">Changer</Link>
      <button onClick={() => setRole(null)} className="inline-flex items-center gap-1 underline underline-offset-2">
        <X className="h-3 w-3" /> Quitter
      </button>
    </div>
  );
}
