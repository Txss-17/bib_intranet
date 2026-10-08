import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Row {
  id: string; email: string; first_name: string | null; last_name: string | null;
  position: string | null; poles: string[] | null; hr_status: string;
  roles: string[]; last_sign_in_at: string | null;
}

export function ConnectedEmployeesBlock() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['employee-access-directory'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('employee_access_directory');
      if (error) throw error;
      return (data || []) as Row[];
    },
  });

  // Hidden when the user isn't allowed (function returns nothing)
  if (!isLoading && data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" /> Employés connectés et accès ({data.length})
        </CardTitle>
        <Button asChild size="sm" variant="outline"><Link to="/pole/rh/employees">Collaborateurs</Link></Button>
      </CardHeader>
      <CardContent className="divide-y">
        {isLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : data.map((e) => (
          <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <div>
              <p className="text-sm font-medium">{[e.first_name, e.last_name].filter(Boolean).join(' ') || e.email}</p>
              <p className="text-xs text-muted-foreground">
                {e.position || 'Poste non défini'} · dernière connexion {e.last_sign_in_at ? formatDistanceToNow(new Date(e.last_sign_in_at), { addSuffix: true, locale: fr }) : '—'}
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {e.roles.length ? e.roles.map((r) => <Badge key={r}>{r}</Badge>) : <Badge variant="outline">aucun rôle</Badge>}
              {(e.poles || []).map((p) => <Badge key={p} variant="secondary">{p}</Badge>)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
