import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Save, RotateCcw, Lock, Eye, FileSearch, Settings as SettingsIcon } from 'lucide-react';
import { usePermissionRules, useOverridesSnapshot } from '@/hooks/usePermissionRules';
import {
  DEFAULT_RULES, POLES_FOR_MATRIX, SENIORITY_ORDER, saveOverrides,
  PermissionRule, Seniority,
} from '@/data/permissionRules';
import { logSensitiveAccess } from '@/lib/sensitiveAudit';
import { toast } from '@/hooks/use-toast';

const FLAGS: Array<{ key: keyof PermissionRule; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'can_view_sensitive', label: 'Données sensibles', icon: Eye },
  { key: 'can_view_audit_log', label: "Journal d'audit", icon: FileSearch },
  { key: 'can_configure_permissions', label: 'Configurer permissions', icon: SettingsIcon },
];

/**
 * Éditeur des règles de visibilité sensible (pôle × niveau hiérarchique).
 * Anciennement page /permissions, désormais intégré à Rôles & Permissions.
 */
export const SensitiveRulesMatrix = () => {
  const rights = usePermissionRules();
  const overrides = useOverridesSnapshot();
  const [draft, setDraft] = useState<Record<string, Record<string, PermissionRule>>>(overrides);
  const [activePole, setActivePole] = useState<string>('rh');

  useEffect(() => { setDraft(overrides); }, [overrides]);

  useEffect(() => {
    logSensitiveAccess({
      section: 'permissions.matrix',
      action: 'view_permissions_matrix',
      allowed: rights.can_configure_permissions,
      reason: rights.can_configure_permissions ? 'authorized' : 'denied_by_rule',
    });
  }, [rights.can_configure_permissions]);

  const canEdit = rights.can_configure_permissions;

  const effectiveRule = (pole: string, sen: Seniority): PermissionRule =>
    draft[pole]?.[sen] ?? DEFAULT_RULES[pole]?.[sen] ??
    { can_view_sensitive: false, can_view_audit_log: false, can_configure_permissions: false };

  const setFlag = (pole: string, sen: Seniority, key: keyof PermissionRule, val: boolean) => {
    setDraft((prev) => {
      const next = { ...prev, [pole]: { ...(prev[pole] || {}) } };
      next[pole][sen] = { ...effectiveRule(pole, sen), [key]: val };
      return next;
    });
  };

  const handleSave = async () => {
    saveOverrides(draft);
    await logSensitiveAccess({
      section: 'permissions.matrix',
      action: 'update_permissions_matrix',
      allowed: true,
      details: { changed_poles: Object.keys(draft) },
    });
    toast({
      title: 'Règles enregistrées',
      description: "Elles s'appliquent immédiatement au chargement des paramètres.",
    });
  };

  const handleReset = () => {
    setDraft({});
    saveOverrides({});
    toast({ title: 'Règles remises par défaut' });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-xl">
          Visibilité des sections sensibles des paramètres par pôle et niveau hiérarchique.
          Appliquée au chargement des paramètres de chaque collaborateur.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={!canEdit}>
            <RotateCcw className="h-4 w-4 mr-2" /> Réinitialiser
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!canEdit}>
            <Save className="h-4 w-4 mr-2" /> Enregistrer les règles
          </Button>
        </div>
      </div>

      {!canEdit && (
        <Card className="border-dashed">
          <CardContent className="pt-6 flex gap-3 text-sm text-muted-foreground">
            <Lock className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Lecture seule — le droit <code>can_configure_permissions</code> n'est pas accordé
              à votre pôle et niveau actuel.
            </span>
          </CardContent>
        </Card>
      )}

      <Tabs value={activePole} onValueChange={setActivePole}>
        <TabsList className="flex flex-wrap h-auto">
          {POLES_FOR_MATRIX.map((p) => (
            <TabsTrigger key={p} value={p} className="capitalize text-xs">{p}</TabsTrigger>
          ))}
        </TabsList>
        {POLES_FOR_MATRIX.map((pole) => (
          <TabsContent key={pole} value={pole} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base capitalize">Pôle {pole}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Niveau hiérarchique</TableHead>
                      {FLAGS.map((f) => (
                        <TableHead key={f.key} className="text-center">
                          <span className="inline-flex items-center gap-1 text-xs">
                            <f.icon className="h-3 w-3" /> {f.label}
                          </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SENIORITY_ORDER.map((sen) => {
                      const rule = effectiveRule(pole, sen);
                      return (
                        <TableRow key={sen}>
                          <TableCell className="capitalize font-medium">{sen}</TableCell>
                          {FLAGS.map((f) => (
                            <TableCell key={f.key} className="text-center">
                              <Switch
                                checked={rule[f.key]}
                                disabled={!canEdit}
                                onCheckedChange={(v) => setFlag(pole, sen, f.key, v)}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default SensitiveRulesMatrix;
