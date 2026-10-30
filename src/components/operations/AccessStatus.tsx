import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AccessState } from '@/lib/permissionReadiness';

export function AccessStatus({ state, retry }: { state: Exclude<AccessState, 'ready'>; retry: () => void }) {
  const loading = state === 'loading';
  return <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6 text-center" role={loading ? 'status' : 'alert'}>
    <Shield className={`h-8 w-8 text-muted-foreground ${loading ? 'animate-pulse' : ''}`} />
    <p>{loading ? 'Chargement de vos accès…' : 'Impossible de charger vos accès pour le moment.'}</p>
    {!loading && <><p className="max-w-md text-sm text-muted-foreground">Réessayez pour retrouver vos modules. Si le problème persiste, contactez votre administrateur BIB.</p><Button onClick={retry}>Réessayer</Button></>}
  </div>;
}
