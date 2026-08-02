import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Eye, RotateCcw, UserPlus, LogIn, Search, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useViewAs } from '@/hooks/useViewAs';
import {
  jobRoles, jobDepartments, priorityRoles, testAccountEmail,
  TEST_ACCOUNT_PASSWORD, JobRole,
} from '@/data/jobRoles';

const seniorityLabel: Record<string, string> = {
  junior: 'Junior', mid: 'Confirmé', senior: 'Senior', lead: 'Responsable', executive: 'Direction',
};

export default function TestAccounts() {
  const navigate = useNavigate();
  const { roleId, role, setRole } = useViewAs();
  const [pending, setPending] = useState<string | null>(roleId);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState<string>('all');
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobRoles.filter((r) =>
      (dept === 'all' || r.department === dept) &&
      (!q || r.label.toLowerCase().includes(q) || r.id.includes(q))
    );
  }, [search, dept]);

  const apply = () => {
    setRole(pending || null);
    const target = jobRoles.find((r) => r.id === pending);
    toast.success(target ? `Vue simulée : ${target.label}` : 'Simulation désactivée');
    if (target?.landing) navigate(target.landing);
  };

  const reset = () => {
    setRole(null);
    setPending(null);
    toast.success('Retour à votre rôle réel');
  };

  const provision = async (roles: JobRole[]) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('provision-test-accounts', {
        body: { roles: roles.map((r) => ({ id: r.id, label: r.label, email: testAccountEmail(r), position: r.position, poles: r.poles, seniority: r.seniority })) },
      });
      if (error) throw error;
      toast.success(`${(data as any)?.created ?? 0} compte(s) créé(s), ${(data as any)?.updated ?? 0} mis à jour`);
    } catch (e: any) {
      toast.error(e?.message || 'Provisionnement impossible');
    } finally {
      setBusy(false);
    }
  };

  const signInAs = async (r: JobRole) => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: testAccountEmail(r), password: TEST_ACCOUNT_PASSWORD,
    });
    setBusy(false);
    if (error) return toast.error(`Connexion impossible : ${error.message}. Provisionnez d'abord le compte.`);
    setRole(null);
    toast.success(`Connecté en tant que ${r.label}`);
    navigate(r.landing || '/');
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Comptes de test & rôles</h1>
        <p className="text-sm text-muted-foreground">
          Catalogue des {jobRoles.length} rôles métiers Brand in a Box — simulation d'interface et comptes de test réels.
        </p>
      </div>

      {role && (
        <Card className="border-accent">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4 text-accent" />
              <span>Mode simulation actif — interface vue comme <strong>{role.label}</strong> ({role.poles.length} pôles)</span>
            </div>
            <Button size="sm" variant="outline" onClick={reset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Désactiver
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="view-as">
        <TabsList>
          <TabsTrigger value="view-as">Visualiser comme</TabsTrigger>
          <TabsTrigger value="accounts">Comptes de test</TabsTrigger>
          <TabsTrigger value="catalog">Catalogue des rôles</TabsTrigger>
        </TabsList>

        {/* --- Mode développeur : visualiser comme --- */}
        <TabsContent value="view-as" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mode développeur</CardTitle>
              <CardDescription>
                Simule les permissions et les menus d'un rôle sans changer de session. Rapide, mais ne teste pas les données propres à l'utilisateur.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Select value={pending ?? 'none'} onValueChange={(v) => setPending(v === 'none' ? null : v)}>
                  <SelectTrigger className="sm:max-w-md"><SelectValue placeholder="Choisir un rôle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Mon rôle réel —</SelectItem>
                    {jobDepartments.map((d) => {
                      const rs = jobRoles.filter((r) => r.department === d.id);
                      if (!rs.length) return null;
                      return rs.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{d.label} · {r.label}</SelectItem>
                      ));
                    })}
                  </SelectContent>
                </Select>
                <Button onClick={apply}>Appliquer</Button>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Rôles prioritaires</p>
                <div className="flex flex-wrap gap-2">
                  {priorityRoles().map((r) => (
                    <Button key={r.id} size="sm" variant={roleId === r.id ? 'default' : 'outline'}
                      onClick={() => { setPending(r.id); setRole(r.id); if (r.landing) navigate(r.landing); }}>
                      {r.priority}. {r.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Comptes de test réels --- */}
        <TabsContent value="accounts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comptes de test réels</CardTitle>
              <CardDescription>
                Provisionne de véritables comptes (email confirmé, profil, pôles) pour valider les workflows de bout en bout.
                Mot de passe commun : <code>{TEST_ACCOUNT_PASSWORD}</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button disabled={busy} onClick={() => provision(priorityRoles())}>
                  <UserPlus className="mr-2 h-4 w-4" /> Provisionner les rôles prioritaires
                </Button>
                <Button variant="outline" disabled={busy} onClick={() => provision(filtered)}>
                  <ShieldCheck className="mr-2 h-4 w-4" /> Provisionner la sélection ({filtered.length})
                </Button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Rechercher un rôle…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={dept} onValueChange={setDept}>
                  <SelectTrigger className="sm:w-64"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les départements</SelectItem>
                    {jobDepartments.map((d) => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Email de test</TableHead>
                      <TableHead>Pôles</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          {r.label}
                          {r.readOnly && <Badge variant="secondary" className="ml-2">lecture seule</Badge>}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{testAccountEmail(r)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.poles.join(', ')}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" disabled={busy} onClick={() => signInAs(r)}>
                            <LogIn className="mr-2 h-4 w-4" /> Se connecter
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Catalogue --- */}
        <TabsContent value="catalog" className="mt-4 space-y-4">
          {jobDepartments.map((d) => {
            const rs = jobRoles.filter((r) => r.department === d.id);
            if (!rs.length) return null;
            return (
              <Card key={d.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{d.label} <span className="text-sm font-normal text-muted-foreground">({rs.length})</span></CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {rs.map((r) => (
                    <button key={r.id} onClick={() => { setPending(r.id); setRole(r.id); if (r.landing) navigate(r.landing); }}
                      className="rounded-lg border p-3 text-left transition-colors hover:bg-muted/50">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{r.label}</span>
                        <Badge variant="outline" className="shrink-0 text-[10px]">{seniorityLabel[r.seniority]}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{r.poles.join(' · ')}</p>
                    </button>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
