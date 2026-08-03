import React from 'react';
import { Navigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionAction } from '@/data/permissionMatrix';
import { AccessDenied } from '@/components/ProtectedScreen';

interface PermissionGateProps {
  pageId: string;
  action?: PermissionAction;
  children: React.ReactNode;
  /** Rien n'est rendu si l'accès est refusé (par défaut) */
  fallback?: React.ReactNode;
}

/** Masque un élément d'interface non autorisé (il n'apparaît pas du tout). */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  pageId, action = 'read', children, fallback = null,
}) => {
  const { can } = usePermissions();
  if (!can(pageId, action)) return <>{fallback}</>;
  return <>{children}</>;
};

/** Protège une page entière : affiche « Accès restreint » si non autorisé. */
export const ProtectedPage: React.FC<{ pageId: string; children: React.ReactNode; redirectTo?: string }> = ({
  pageId, children, redirectTo,
}) => {
  const { canViewPage } = usePermissions();
  if (!canViewPage(pageId)) {
    return redirectTo ? <Navigate to={redirectTo} replace /> : <AccessDenied />;
  }
  return <>{children}</>;
};

/** Badge discret indiquant une restriction de périmètre de données. */
export const ScopeBadge: React.FC = () => {
  const { scope } = usePermissions();
  const parts: string[] = [];
  if (scope.regions) parts.push(`Régions : ${scope.regions.join(', ')}`);
  if (scope.subsidiaries) parts.push(`Filiales : ${scope.subsidiaries.join(', ')}`);
  if (scope.ownRecordsOnly) parts.push('Mes enregistrements uniquement');
  if (!parts.length) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
      <Lock className="h-3 w-3" /> {parts.join(' · ')}
    </span>
  );
};

export default PermissionGate;
