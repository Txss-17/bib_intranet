import { useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useHrOnboardingPermissions } from '@/hooks/useHrEmployeeMutations';
import { resolveIntranetPage } from '@/lib/intranet';
import { AccessDenied } from '@/components/ProtectedScreen';
import { AccessStatus } from './AccessStatus';

// Onboarding has a dedicated, server-authoritative RH permission RPC.
// The generic interface matrix can lag behind it; avoid blocking an RH
// account that has explicit read permission in the dedicated policy.
function HrOnboardingAccessGate({ children }: { children: React.ReactNode }) {
  const permissions = useHrOnboardingPermissions();
  if (permissions.isLoading || permissions.isPending) {
    return <AccessStatus state="loading" retry={() => void permissions.refetch()} />;
  }
  if (permissions.isError) {
    return <AccessStatus state="error" retry={() => void permissions.refetch()} />;
  }
  return permissions.data?.read === true ? <>{children}</> : <AccessDenied />;
}

export function RouteAccessGate({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { canViewPage, accessState, retryAccess } = usePermissions();
  const page = resolveIntranetPage(pathname);

  if (page?.id === 'rh.onboarding') {
    return <HrOnboardingAccessGate>{children}</HrOnboardingAccessGate>;
  }

  const state = page ? accessState(page.id) : 'ready';
  if (state !== 'ready') return <AccessStatus state={state} retry={() => retryAccess(page!.id)} />;
  return page && canViewPage(page.id) ? <>{children}</> : <AccessDenied />;
}
