import { useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { resolveIntranetPage } from '@/lib/intranet';
import { AccessDenied } from '@/components/ProtectedScreen';
import { AccessStatus } from './AccessStatus';
export function RouteAccessGate({ children }: { children: React.ReactNode }) {
 const { pathname } = useLocation(); const { canViewPage, accessState, retryAccess } = usePermissions(); const page = resolveIntranetPage(pathname);
 const state = page ? accessState(page.id) : 'ready';
 if (state !== 'ready') return <AccessStatus state={state} retry={() => retryAccess(page!.id)} />;
 return page && canViewPage(page.id) ? <>{children}</> : <AccessDenied />;
}
