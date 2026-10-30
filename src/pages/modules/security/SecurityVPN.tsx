import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, MonitorSmartphone, RefreshCw, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import { useSecurityVpnAccess } from '@/hooks/useSecurityData';
import { readableDate } from '@/hooks/useSecurityOperations';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';

export default function SecurityVPN() {
  const { canViewPage } = usePermissions();
  const vpn = useSecurityVpnAccess();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const rows = vpn.data ?? [];
  const filtered = useMemo(() => rows.filter(row => {
    const matchesStatus = status === 'all' || row.status === status;
    const matchesText = [
      row.user_name, row.user_email, row.device_name, row.provider, row.provider_device_id,
    ].some(value => String(value ?? '').toLowerCase().includes(search.trim().toLowerCase()));
    return matchesStatus && matchesText;
  }), [rows, search, status]);
  const active = rows.filter(row => row.status === 'active').length;
  const revoked = rows.filter(row => row.status === 'revoked').length;

  if (!canViewPage('security.vpn')) return <p role="alert">Accès VPN non autorisé.</p>;

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold"><KeyRound className="h-6 w-6" />Accès VPN & réseau</h1>
        <p className="mt-2 text-sm text-muted-foreground">Inventaire des connexions réseau connues, terminaux, fournisseurs et traces de révocation, distinct des demandes d’autorisation.</p>
        <p className="mt-1 text-xs text-muted-foreground">Les statuts ci-dessous proviennent de l'Intranet. La confirmation d'accès effectif nécessite une synchronisation avec le fournisseur VPN.</p>
      </div>
      <Button variant="outline" disabled={vpn.isFetching} onClick={() => void vpn.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Actualiser</Button>
    </header>
    <Tabs defaultValue="access">
      <TabsList><TabsTrigger value="access">Accès connus</TabsTrigger><TabsTrigger value="approvals">Demandes & révocations</TabsTrigger></TabsList>
      <TabsContent value="access" className="space-y-5">
        {vpn.isError && <p role="alert" className="rounded-lg border p-3 text-sm text-destructive">Les accès VPN enregistrés ne sont pas disponibles. <Button variant="outline" size="sm" onClick={() => void vpn.refetch()}>Réessayer</Button></p>}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Entrées enregistrées', count: rows.length, icon: MonitorSmartphone },
            { label: 'Statut déclaré actif', count: active, icon: KeyRound },
            { label: 'Statut déclaré révoqué', count: revoked, icon: ShieldCheck },
          ].map(item => <Card key={item.label}><CardContent className="flex items-center gap-3 p-4"><item.icon className="h-5 w-5 text-muted-foreground" /><div><p className="text-2xl font-semibold">{vpn.isLoading || vpn.isError ? '—' : item.count}</p><p className="text-xs text-muted-foreground">{item.label}</p></div></CardContent></Card>)}
        </div>
        <div className="flex flex-wrap gap-3">
          <Input value={search} onChange={e => setSearch(e.target.value)} className="max-w-lg flex-1" aria-label="Rechercher un accès VPN" placeholder="Compte, appareil ou fournisseur…" />
          <select className="h-10 rounded-md border bg-background px-3 text-sm" aria-label="Statut des accès VPN" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="all">Tous les statuts</option><option value="active">Actif déclaré</option><option value="revoked">Révoqué</option><option value="pending">En attente</option>
          </select>
        </div>
        {vpn.isLoading && <p role="status">Chargement des accès réseau…</p>}
        {!vpn.isLoading && !vpn.isError && <div className="overflow-x-auto rounded-lg border">
          <Table><TableHeader><TableRow><TableHead>Compte</TableHead><TableHead>Terminal</TableHead><TableHead>Fournisseur</TableHead><TableHead>Statut enregistré</TableHead><TableHead>Dernière activité</TableHead><TableHead>Révocation</TableHead></TableRow></TableHeader>
            <TableBody>{filtered.map(row => <TableRow key={row.id}>
              <TableCell><p>{row.user_name || 'Non renseigné'}</p><p className="text-xs text-muted-foreground">{row.user_email || '—'}</p></TableCell>
              <TableCell>{row.device_name || 'Non renseigné'}</TableCell><TableCell>{row.provider || 'Non renseigné'}</TableCell>
              <TableCell><Badge variant="outline">{row.status || 'Non renseigné'}</Badge></TableCell>
              <TableCell>{readableDate(row.last_seen_at)}</TableCell><TableCell>{readableDate(row.revoked_at)}</TableCell>
            </TableRow>)}
            {!filtered.length && <TableRow><TableCell colSpan={6} className="p-6 text-center text-muted-foreground">Aucun accès VPN correspondant n'est enregistré. Cela ne prouve pas qu'aucune connexion n'existe chez le fournisseur.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>}
        <p className="text-xs text-muted-foreground">La liste n'est pas un annuaire d'utilisateurs. Les comptes de démonstration ne doivent pas être utilisés pour autoriser des accès réels.</p>
        <Link to="/pole/security/access" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">Vérifier les identités et rôles</Link>
      </TabsContent>
      <TabsContent value="approvals" className="space-y-3">
        <div className="rounded-lg border p-4 text-sm">Toute demande doit comporter un bénéficiaire vérifié, un motif, une date d'expiration, une validation indépendante et une preuve de révocation. Cette fiche ne crée ni ne révoque de tunnel chez le fournisseur.</div>
        <ModuleWorkspace pageId="security.vpn" />
      </TabsContent>
    </Tabs>
  </div>;
}
