import { Link } from 'react-router-dom';
import { LayoutGrid, Users, ShieldCheck, ExternalLink, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { usePosition } from '@/hooks/usePosition';
import { poles } from '@/data/poles';
import { positionInfos, EmployeePosition } from '@/types/positions';
import { usePermissionRules } from '@/hooks/usePermissionRules';

const WORKSPACE_GROUPS = [
  { name: 'linksy-all@brand-in-a-box.space', role: 'Membre' },
  { name: 'intranet-users@brand-in-a-box.space', role: 'Membre' },
];

export function AccessTab() {
  const { profile } = useAuth();
  const { accessiblePoles, positionInfo } = usePosition();
  const rights = usePermissionRules();
  const position = profile?.position as EmployeePosition | null;
  const posInfo = position ? positionInfos[position] : null;

  const activeRights: { label: string; on: boolean }[] = [
    { label: 'Consultation données sensibles', on: rights.can_view_sensitive },
    { label: 'Journal d\'audit complet', on: rights.can_view_audit_log },
    { label: 'Configuration des permissions', on: rights.can_configure_permissions },
  ];

  return (
    <div className="space-y-6">
      <div className="enterprise-card p-6">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" /> Modules accessibles
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {poles.map((p) => {
            const hasAccess = accessiblePoles.includes(p.id);
            return (
              <div
                key={p.id}
                className={`rounded-md border p-3 flex items-center justify-between ${
                  hasAccess ? 'border-border bg-background' : 'border-border/40 bg-muted/20 opacity-50'
                }`}
              >
                <span className="text-sm font-medium capitalize">{p.name}</span>
                {hasAccess ? (
                  <Badge variant="secondary" className="text-[10px]">OK</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">—</Badge>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Pôle principal : <span className="font-medium text-foreground">{posInfo?.module || 'N/A'}</span>
        </p>
      </div>

      <div className="enterprise-card p-6">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" /> Droits étendus
        </h3>
        <div className="space-y-2">
          {activeRights.map((r) => (
            <div key={r.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-sm">{r.label}</span>
              {r.on ? (
                <Badge variant="default">Activé</Badge>
              ) : (
                <Badge variant="outline">Non</Badge>
              )}
            </div>
          ))}
        </div>
        {rights.can_configure_permissions && (
          <div className="mt-4">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/roles-permissions">
                <ShieldCheck className="h-4 w-4 mr-2" /> Ouvrir la matrice de permissions
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="enterprise-card p-6">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <Users className="h-4 w-4" /> Groupes Workspace
        </h3>
        <div className="space-y-2">
          {WORKSPACE_GROUPS.map((g) => (
            <div key={g.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{g.name}</p>
                <p className="text-xs text-muted-foreground">{g.role}</p>
              </div>
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="enterprise-card p-6">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <KeyRound className="h-4 w-4" /> Sessions & clés
        </h3>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium">Sessions actives</p>
            <p className="text-xs text-muted-foreground">Gérez vos connexions depuis l'onglet Sécurité</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="#security">Voir</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
