import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, ExternalLink, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ContractForm from '@/components/forms/ContractForm';
import { useContracts, useCreateContract, CONTRACT_STATUS_LABELS } from '@/hooks/useContracts';
import { usePlatformActions } from '@/hooks/usePlatformSync';
import { statusVariant } from '@/pages/modules/compliance/Contracts';
import type { Shop } from '@/hooks/useShops';

export function ShopContractsPanel({ shop }: { shop: Shop }) {
  const { data: contracts = [] } = useContracts(undefined, shop.id);
  const create = useCreateContract();
  const { pushShopStatus } = usePlatformActions();
  const [open, setOpen] = useState(false);
  const hasSigned = contracts.some((c) => c.status === 'signed' || c.status === 'active');
  const platformId = (shop as any).platform_id as string | null | undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Contrats</p>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />Ajouter</Button>
      </div>
      {!hasSigned && shop.status !== 'active' && (
        <p className="text-xs text-muted-foreground">Un contrat signé est requis avant l'activation de la boutique.</p>
      )}
      {contracts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun contrat rattaché.</p>
      ) : (
        <ul className="divide-y rounded-md border text-sm">
          {contracts.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 p-2">
              <span className="min-w-0">
                <span className="block truncate font-medium">{c.title}</span>
                <span className="text-xs text-muted-foreground">{c.contract_number} · {c.type}{c.end_date ? ` · fin ${c.end_date}` : ''}</span>
              </span>
              <span className="flex items-center gap-1">
                {c.document_url && <Button variant="ghost" size="icon" asChild><a href={c.document_url} target="_blank" rel="noreferrer" aria-label="Voir le document"><ExternalLink className="h-4 w-4" /></a></Button>}
                <Badge variant={statusVariant(c.status)}>{CONTRACT_STATUS_LABELS[c.status]}</Badge>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between rounded-md border p-2 text-sm">
        <span className="text-muted-foreground">{platformId ? 'Liée à B.I.B Platform' : 'Non liée à B.I.B Platform'}</span>
        {platformId && (
          <Button size="sm" variant="ghost" disabled={pushShopStatus.isPending} onClick={() => pushShopStatus.mutate(shop.id)}>
            <Upload className="mr-1 h-4 w-4" />Transmettre le statut
          </Button>
        )}
      </div>
      <ContractForm
        open={open}
        onOpenChange={setOpen}
        defaultShopId={shop.id}
        onSubmit={(data) => {
          const num = `C-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
          create.mutate({ contract_number: num, party: shop.merchant_name, ...data, shop_id: shop.id }, {
            onSuccess: () => toast.success('Contrat rattaché à la boutique'),
            onError: (e: Error) => toast.error('Erreur', { description: e.message }),
          });
        }}
      />
    </div>
  );
}
