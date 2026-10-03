import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { RefreshCw, Link2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePlatformActions, usePlatformStatus, usePlatformSyncRuns } from '@/hooks/usePlatformSync';

const STATUS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  running: { label: 'En cours', variant: 'outline' },
  success: { label: 'Succès', variant: 'default' },
  partial: { label: 'Partiel', variant: 'secondary' },
  error: { label: 'Erreur', variant: 'destructive' },
};

export function PlatformBridgeCard() {
  const { data: status } = usePlatformStatus();
  const { data: runs = [] } = usePlatformSyncRuns();
  const { pull } = usePlatformActions();

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2"><Link2 className="h-4 w-4" />B.I.B Platform</CardTitle>
          <CardDescription>
            Lecture : boutiques, commandes, tickets. Envoi : produits fournisseurs validés, statuts boutiques.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status?.configured ? 'default' : 'outline'}>
            {status?.configured ? 'Connectée' : 'À configurer'}
          </Badge>
          <Button size="sm" onClick={() => pull.mutate()} disabled={pull.isPending || !status?.configured}>
            <RefreshCw className={`mr-2 h-4 w-4 ${pull.isPending ? 'animate-spin' : ''}`} />Synchroniser maintenant
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun échange enregistré.</p>
        ) : (
          <ul className="divide-y text-sm">
            {runs.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="font-medium">{r.direction === 'pull' ? 'Lecture' : 'Envoi'}</span>
                  <span className="text-muted-foreground"> · {r.action} · {r.items_count} élément(s)</span>
                  {r.errors?.length > 0 && (
                    <span className="block truncate text-xs text-destructive">{r.errors[0]}</span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground">{format(new Date(r.started_at), 'dd MMM HH:mm', { locale: fr })}</span>
                  <Badge variant={STATUS[r.status]?.variant}>{STATUS[r.status]?.label}</Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
