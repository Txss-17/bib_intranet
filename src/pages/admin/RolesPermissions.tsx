import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, Save, RotateCcw, Eye, History, Lock, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useViewAs } from '@/hooks/useViewAs';
import { jobRoles, jobDepartments } from '@/data/jobRoles';
import { logSensitiveAccess } from '@/lib/sensitiveAudit';
import { ProtectedPage } from '@/components/PermissionGate';
import {
  ActionSet, MatrixOverrides, PERMISSION_ACTIONS, PermissionAction, RESTRICTED_PAGES,
  appendMatrixHistory, getDataScope, isRbacEnforced, loadMatrixHistory, loadMatrixOverrides,
  pageRegistry, resolvePagePermissions, saveMatrixOverrides, setRbacEnforced,
} from '@/data/permissionMatrix';

const RolesPermissionsInner = () => {
  const { profile } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const { roleId: simulatedId, setRole } = useViewAs();
  const [roleId, setRoleId] = useState<string>('comptable');
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [draft, setDraft] = useState<MatrixOverrides>(loadMatrixOverrides());
  const [enforced, setEnforced] = useState(isRbacEnforced());
  const [history, setHistory] = useState(loadMatrixHistory());

  const role = jobRoles.find((r) => r.id === roleId);
  const scopes = useMemo(
    () => Array.from(new Set(pageRegistry.map((p) => p.scope))).sort(),
    [],
  );

  const pages = useMemo(() => pageRegistry.filter((p) => {
    if (scopeFilter !== 'all' && p.scope !== scopeFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.label.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
  }), [scopeFilter, search]);

  const effective = (pageId: string): ActionSet =>
    resolvePagePermissions(pageId, {
      role, poles: role?.poles ?? [], seniority: role?.seniority ?? 'junior', overrides: draft,
    });

  const toggle = (pageId: string, action: PermissionAction, value: boolean) => {
    setDraft((prev) => ({
      ...prev,
      [roleId]: { ...(prev[roleId] || {}), [pageId]: { ...(prev[roleId]?.[pageId] || {}), [action]: value } },
    }));
  };

  const handleSave = async () => {
    const before = loadMatrixOverrides();
    const entries = [] as Parameters<typeof appendMatrixHistory>[0];
    Object.entries(draft[roleId] || {}).forEach(([pageId, actions]) => {
      Object.entries(actions).forEach(([action, value]) => {
        if (before[roleId]?.[pageId]?.[action as PermissionAction] !== value) {
          entries.push({
            at: new Date().toISOString(),
            actor: profile?.email || 'inconnu',
            roleId, pageId, action: action as PermissionAction, value: !!value,
          });
        }
      });
    });
    saveMatrixOverrides(draft);
    if (entries.length) appendMatrixHistory(entries);
    setHistory(loadMatrixHistory());
    await logSensitiveAccess({
      section: 'admin.roles_permissions',
      action: 'update_permission_matrix',
      allowed: true,
      details: { role: roleId, changes: entries.length },
    });
    toast({ title: 'Permissions enregistrées', description: `${entries.length} modification(s) appliquée(s) au rôle ${role?.label}.` });
  };

  const handleReset = () => {
    const next = { ...draft };
    delete next[roleId];
    setDraft(next);
    saveMatrixOverrides(next);
    toast({ title: 'Rôle réinitialisé', description: `${role?.label} revient aux droits par défaut.` });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Rôles & Permissions
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Matrice centralisée — pôle × page × action, avec restrictions de données et historique.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Moindre privilège</span>
            <Switch
              checked={enforced}
              onCheckedChange={(v) => { setEnforced(v); setRbacEnforced(v); toast({ title: v ? 'RBAC appliqué' : 'Mode construction (accès ouvert)' }); }}
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" /> Réinitialiser le rôle
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" /> Enregistrer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="matrix">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="matrix">Matrice</TabsTrigger>
          <TabsTrigger value="roles">Rôles & périmètres</TabsTrigger>
          <TabsTrigger value="restricted">Pages restreintes</TabsTrigger>
          <TabsTrigger value="sensitive">Données sensibles</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="sensitive" className="mt-4">
          <SensitiveRulesMatrix />
        </TabsContent>


        <TabsContent value="matrix" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Rôle configuré</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-80">
                  {jobDepartments.map((d) => (
                    <div key={d.id}>
                      <div className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">{d.label}</div>
                      {jobRoles.filter((r) => r.department === d.id).map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              {role && (
                <>
                  <Badge variant="outline" className="capitalize">{role.seniority}</Badge>
                  {role.poles.map((p) => <Badge key={p} variant="secondary" className="capitalize">{p}</Badge>)}
                </>
              )}
              <Button
                variant={simulatedId === roleId ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setRole(simulatedId === roleId ? null : roleId); toast({ title: simulatedId === roleId ? 'Simulation arrêtée' : `Visualiser comme ${role?.label}` }); }}
                className="ml-auto"
              >
                <Eye className="h-4 w-4 mr-2" />
                {simulatedId === roleId ? 'Arrêter la simulation' : 'Tester ce rôle'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-base">Permissions par page</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une page…" className="pl-8 w-56" />
                </div>
                <Select value={scopeFilter} onValueChange={setScopeFilter}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="all">Tous les pôles</SelectItem>
                    {scopes.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[240px]">Page</TableHead>
                    {PERMISSION_ACTIONS.map((a) => (
                      <TableHead key={a.key} className="text-center text-xs">{a.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page) => {
                    const perms = effective(page.id);
                    return (
                      <TableRow key={page.id}>
                        <TableCell>
                          <div className="text-sm font-medium">{page.label}</div>
                          <div className="text-xs text-muted-foreground font-mono">{page.id}</div>
                        </TableCell>
                        {PERMISSION_ACTIONS.map((a) => (
                          <TableCell key={a.key} className="text-center">
                            <Checkbox
                              checked={perms[a.key]}
                              onCheckedChange={(v) => toggle(page.id, a.key, !!v)}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {!pages.length && <p className="text-sm text-muted-foreground py-6 text-center">Aucune page trouvée.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Rôles, pôles et restrictions de données</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Département</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Pôles visibles</TableHead>
                    <TableHead>Périmètre de données</TableHead>
                    <TableHead className="text-right">Test</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobRoles.map((r) => {
                    const sc = getDataScope(r);
                    const scopeLabel = [
                      sc.regions ? `Régions ${sc.regions.join('/')}` : 'Toutes régions',
                      sc.ownRecordsOnly ? 'Ses enregistrements' : null,
                    ].filter(Boolean).join(' · ');
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium text-sm">{r.label}</TableCell>
                        <TableCell className="text-xs capitalize">{r.department}</TableCell>
                        <TableCell className="text-xs capitalize">{r.seniority}</TableCell>
                        <TableCell className="text-xs">{r.poles.length > 6 ? `${r.poles.length} pôles` : r.poles.join(', ')}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{scopeLabel}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setRole(r.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restricted" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Pages totalement interdites hors profils autorisés</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Profils autorisés</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(RESTRICTED_PAGES).map(([pageId, owners]) => (
                    <TableRow key={pageId}>
                      <TableCell className="text-sm">
                        <span className="font-medium">{pageRegistry.find((p) => p.id === pageId)?.label ?? pageId}</span>
                        <span className="block text-xs font-mono text-muted-foreground">{pageId}</span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-wrap gap-1">
                          {owners.map((o) => (
                            <Badge key={o} variant="outline">{jobRoles.find((r) => r.id === o)?.label ?? o}</Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> Historique des modifications de droits</CardTitle></CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Aucune modification enregistrée.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Auteur</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Page</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Valeur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((h, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{new Date(h.at).toLocaleString('fr-FR')}</TableCell>
                        <TableCell className="text-xs">{h.actor}</TableCell>
                        <TableCell className="text-xs">{jobRoles.find((r) => r.id === h.roleId)?.label ?? h.roleId}</TableCell>
                        <TableCell className="text-xs font-mono">{h.pageId}</TableCell>
                        <TableCell className="text-xs">{PERMISSION_ACTIONS.find((a) => a.key === h.action)?.label}</TableCell>
                        <TableCell>
                          <Badge variant={h.value ? 'default' : 'secondary'}>{h.value ? 'Accordé' : 'Retiré'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {!isSuperAdmin && (
        <p className="text-xs text-muted-foreground">
          Vous consultez cette matrice avec des droits limités : les modifications restent locales à votre poste.
        </p>
      )}
    </div>
  );
};

export default function RolesPermissions() {
  return (
    <ProtectedPage pageId="admin.roles">
      <RolesPermissionsInner />
    </ProtectedPage>
  );
}
