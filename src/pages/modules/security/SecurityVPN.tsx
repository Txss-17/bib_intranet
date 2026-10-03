import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { useVpnAccess } from '@/hooks/useTechData';
import {
  Wifi,
  Plus,
  Info,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type VpnProvider =
  | 'manual'
  | 'tailscale'
  | 'wireguard'
  | 'openvpn';

type VpnStatus =
  | 'active'
  | 'revoked'
  | 'pending'
  | string;

interface VpnAccessRecord {
  id: string;
  user_name: string;
  user_email: string | null;
  device_name: string | null;
  ip_address: string;
  provider: VpnProvider | string;
  status: VpnStatus;
  created_at: string;
  notes?: string | null;
}

interface VpnForm {
  user_name: string;
  user_email: string;
  device_name: string;
  ip_address: string;
  provider: VpnProvider;
  notes: string;
}

const EMPTY_FORM: VpnForm = {
  user_name: '',
  user_email: '',
  device_name: '',
  ip_address: '',
  provider: 'manual',
  notes: '',
};

const getStatusVariant = (
  status: VpnStatus,
): 'default' | 'destructive' | 'secondary' => {
  if (status === 'active') {
    return 'default';
  }

  if (status === 'revoked') {
    return 'destructive';
  }

  return 'secondary';
};

const formatStatus = (status: VpnStatus) => {
  switch (status) {
    case 'active':
      return 'Actif';
    case 'revoked':
      return 'Révoqué';
    case 'pending':
      return 'En attente';
    default:
      return status;
  }
};

const formatProvider = (
  provider: VpnProvider | string,
) => {
  switch (provider) {
    case 'manual':
      return 'Manuel';
    case 'tailscale':
      return 'Tailscale';
    case 'wireguard':
      return 'WireGuard';
    case 'openvpn':
      return 'OpenVPN';
    default:
      return provider;
  }
};

export default function SecurityVPN() {
  const {
    data = [],
    isLoading,
    create,
    update,
  } = useVpnAccess();

  const records =
    data as VpnAccessRecord[];

  const [open, setOpen] = useState(false);

  const [form, setForm] =
    useState<VpnForm>(EMPTY_FORM);

  const updateForm = <K extends keyof VpnForm>(
    field: K,
    value: VpnForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submit = async () => {
    if (
      !form.user_name.trim() ||
      !form.ip_address.trim()
    ) {
      toast.error('Nom et IP requis');
      return;
    }

    try {
      await create.mutateAsync({
        user_name: form.user_name.trim(),
        user_email:
          form.user_email.trim() || null,
        device_name:
          form.device_name.trim() || null,
        ip_address: form.ip_address.trim(),
        provider: form.provider,
        notes: form.notes.trim() || null,
      });

      toast.success(
        'Accès VPN ajouté',
      );

      setOpen(false);
      setForm(EMPTY_FORM);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Impossible d’ajouter l’accès VPN.';

      toast.error(message);
    }
  };

  const revoke = async (id: string) => {
    try {
      await update.mutateAsync({
        id,
        status: 'revoked',
      });

      toast.success(
        'Accès VPN révoqué',
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Impossible de révoquer l’accès VPN.';

      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Wifi className="h-7 w-7" />
            Réseau & VPN
          </h1>

          <p className="text-muted-foreground">
            Gestion des accès réseau, des connexions VPN,
            des adresses IP autorisées et des appareils
            associés.
          </p>
        </div>

        <Dialog
          open={open}
          onOpenChange={setOpen}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" />
              Nouvel accès
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Ajouter un accès VPN
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="vpn-user-name">
                  Nom utilisateur *
                </Label>

                <Input
                  id="vpn-user-name"
                  value={form.user_name}
                  onChange={(event) =>
                    updateForm(
                      'user_name',
                      event.target.value,
                    )
                  }
                  placeholder="Nom du collaborateur"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vpn-user-email">
                  Email
                </Label>

                <Input
                  id="vpn-user-email"
                  type="email"
                  value={form.user_email}
                  onChange={(event) =>
                    updateForm(
                      'user_email',
                      event.target.value,
                    )
                  }
                  placeholder="collaborateur@brand-in-a-box.space"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vpn-device">
                  Nom du device
                </Label>

                <Input
                  id="vpn-device"
                  value={form.device_name}
                  onChange={(event) =>
                    updateForm(
                      'device_name',
                      event.target.value,
                    )
                  }
                  placeholder="MacBook-Pro"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vpn-ip">
                  Adresse IP *
                </Label>

                <Input
                  id="vpn-ip"
                  value={form.ip_address}
                  onChange={(event) =>
                    updateForm(
                      'ip_address',
                      event.target.value,
                    )
                  }
                  placeholder="100.64.0.5"
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Fournisseur VPN
                </Label>

                <Select
                  value={form.provider}
                  onValueChange={(value) =>
                    updateForm(
                      'provider',
                      value as VpnProvider,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="manual">
                      Manuel
                    </SelectItem>

                    <SelectItem value="tailscale">
                      Tailscale
                    </SelectItem>

                    <SelectItem value="wireguard">
                      WireGuard
                    </SelectItem>

                    <SelectItem value="openvpn">
                      OpenVPN
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vpn-notes">
                  Notes
                </Label>

                <Input
                  id="vpn-notes"
                  value={form.notes}
                  onChange={(event) =>
                    updateForm(
                      'notes',
                      event.target.value,
                    )
                  }
                  placeholder="Informations complémentaires"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>

              <Button
                onClick={submit}
                disabled={create.isPending}
              >
                {create.isPending
                  ? 'Enregistrement…'
                  : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Alert>
        <Info className="h-4 w-4" />

        <AlertDescription>
          <strong>Mode hybride.</strong>{' '}
          Le registre des accès est actuellement géré
          manuellement. Une intégration Tailscale,
          WireGuard ou OpenVPN pourra être raccordée
          ultérieurement via une edge function.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>
            Accès enregistrés ({records.length})
          </CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Chargement…
            </p>
          ) : records.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun accès enregistré.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Utilisateur
                  </TableHead>

                  <TableHead>
                    Device
                  </TableHead>

                  <TableHead>
                    IP
                  </TableHead>

                  <TableHead>
                    Fournisseur
                  </TableHead>

                  <TableHead>
                    Statut
                  </TableHead>

                  <TableHead>
                    Créé
                  </TableHead>

                  <TableHead className="text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {records.map((record) => (
                  <TableRow
                    key={record.id}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {record.user_name}
                        </p>

                        {record.user_email && (
                          <p className="text-xs text-muted-foreground">
                            {record.user_email}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {record.device_name || '—'}
                    </TableCell>

                    <TableCell className="font-mono text-sm">
                      {record.ip_address}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">
                        {formatProvider(
                          record.provider,
                        )}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={getStatusVariant(
                          record.status,
                        )}
                      >
                        {formatStatus(
                          record.status,
                        )}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {record.created_at
                        ? format(
                            new Date(
                              record.created_at,
                            ),
                            'dd/MM/yyyy',
                          )
                        : '—'}
                    </TableCell>

                    <TableCell className="text-right">
                      {record.status ===
                        'active' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={
                            update.isPending
                          }
                          onClick={() =>
                            revoke(
                              record.id,
                            )
                          }
                        >
                          {update.isPending
                            ? '…'
                            : 'Révoquer'}
                        </Button>
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