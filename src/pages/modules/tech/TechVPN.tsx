import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useVpnAccess } from '@/hooks/useTechData';
import { Wifi, Plus, Info } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function TechVPN() {
  const { data = [], isLoading, create, update } = useVpnAccess();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ user_name: '', user_email: '', device_name: '', ip_address: '', provider: 'manual', notes: '' });

  const submit = async () => {
    if (!form.user_name || !form.ip_address) {
      toast.error('Nom et IP requis');
      return;
    }
    try {
      await create.mutateAsync(form);
      toast.success('Accès VPN ajouté');
      setOpen(false);
      setForm({ user_name: '', user_email: '', device_name: '', ip_address: '', provider: 'manual', notes: '' });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const revoke = async (id: string) => {
    try {
      await update.mutateAsync({ id, status: 'revoked' });
      toast.success('Accès révoqué');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Wifi className="h-7 w-7" /> Réseau / VPN</h1>
          <p className="text-muted-foreground">Registre des accès VPN, IPs autorisées et devices connectés</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Nouvel accès</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Ajouter un accès VPN</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nom utilisateur *</Label><Input value={form.user_name} onChange={(e) => setForm({ ...form, user_name: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.user_email} onChange={(e) => setForm({ ...form, user_email: e.target.value })} /></div>
              <div><Label>Nom du device</Label><Input value={form.device_name} onChange={(e) => setForm({ ...form, device_name: e.target.value })} placeholder="MacBook-Pro-Yann" /></div>
              <div><Label>Adresse IP *</Label><Input value={form.ip_address} onChange={(e) => setForm({ ...form, ip_address: e.target.value })} placeholder="100.64.0.5" /></div>
              <div>
                <Label>Provider</Label>
                <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manuel</SelectItem>
                    <SelectItem value="tailscale">Tailscale</SelectItem>
                    <SelectItem value="wireguard">WireGuard</SelectItem>
                    <SelectItem value="openvpn">OpenVPN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={submit}>Enregistrer</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Mode hybride : registre manuel actif. Une intégration Tailscale/WireGuard pourra être branchée plus tard via une edge function.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader><CardTitle>Accès enregistrés ({data.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun accès enregistré.</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Utilisateur</TableHead><TableHead>Device</TableHead><TableHead>IP</TableHead>
                <TableHead>Provider</TableHead><TableHead>Statut</TableHead><TableHead>Créé</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {data.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell><div><p className="font-medium">{v.user_name}</p><p className="text-xs text-muted-foreground">{v.user_email}</p></div></TableCell>
                    <TableCell>{v.device_name || '—'}</TableCell>
                    <TableCell className="font-mono text-sm">{v.ip_address}</TableCell>
                    <TableCell><Badge variant="outline">{v.provider}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={v.status === 'active' ? 'default' : v.status === 'revoked' ? 'destructive' : 'secondary'}>
                        {v.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(v.created_at), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      {v.status === 'active' && (
                        <Button size="sm" variant="ghost" onClick={() => revoke(v.id)}>Révoquer</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
