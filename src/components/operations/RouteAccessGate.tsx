import { useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { resolveIntranetPage } from '@/lib/intranet';
import { AccessDenied } from '@/components/ProtectedScreen';
export function RouteAccessGate({ children }: { children: React.ReactNode }) {
 const { pathname } = useLocation(); const { canViewPage } = usePermissions(); const page = resolveIntranetPage(pathname);
 return page && canViewPage(page.id) ? <>{children}</> : <AccessDenied />;
}
