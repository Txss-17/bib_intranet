import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Edit, Loader2, ExternalLink } from 'lucide-react';
import ContractForm from '@/components/forms/ContractForm';
import { ExportButtons } from '@/components/ExportButtons';
import { useContracts, useCreateContract, useUpdateContract, CONTRACT_STATUS_LABELS, type Contract } from '@/hooks/useContracts';
import { useShops } from '@/hooks/useShops';

const ALL = '__all__';

export function statusVariant(s: Contract['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'signed' || s === 'active') return 'default';
  if (s === 'expiring' || s === 'sent') return 'secondary';
  if (s === 'draft') return 'outline';
  return 'destructive';
}

export default function Contracts() {
  const [search, setSearch] = useState('');
  const [shopFilter, setShopFilter] = useState(ALL);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | undefined>();

  const { data: shops = [] } = useShops();
  const { data: contracts = [], isLoading } = useContracts(search || undefined, shopFilter === ALL ? undefined : shopFilter);
  const create = useCreateContract();
  const update = useUpdateContract();
  const onErr = (e: Error) => toast.error('Erreur', { description: e.message });

  const handleSubmit = (data: any) => {
    if (editing) {
      update.mutate({ id: editing.id, ...data }, { onSuccess: () => toast.success('Contrat modifié'), onError: onErr });
    } else {
      const num = `C-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
      create.mutate({ contract_number: num, ...data }, { onSuccess: () => toast.success('Contrat créé'), onError: onErr });
    }
    setEditing(undefined);
  };

  const rows = contracts.map((c) => ({ ...c, shop_name: c.shop?.name ?? '' }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Contrats</h1><p className="text-muted-foreground">Contrats et accords, rattachés aux boutiques</p></div>
        <div className="flex gap-2">
          <ExportButtons filename="contrats" title="Liste des contrats" poleName="Compliance" columns={[
            { header: 'N°', accessor: 'contract_number' }, { header: 'Titre', accessor: 'title' },
            { header: 'Boutique', accessor: 'shop_name' }, { header: 'Type', accessor: 'type' },
            { header: 'Début', accessor: 'start_date' }, { header: 'Fin', accessor: 'end_date' },
            { header: 'Valeur', accessor: 'value' }, { header: 'Statut', accessor: 'status' },
          ]} data={rows} />
          <Button onClick={() => { setEditing(undefined); setFormOpen(true); }}><Plus className="mr-2 h-4 w-4" />Nouveau contrat</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher un contrat..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={shopFilter} onValueChange={setShopFilter}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Toutes les boutiques</SelectItem>
                {shops.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>N°</TableHead><TableHead>Titre</TableHead><TableHead>Boutique</TableHead><TableHead>Type</TableHead>
                <TableHead>Début</TableHead><TableHead>Fin</TableHead><TableHead>Valeur</TableHead><TableHead>Statut</TableHead><TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {contracts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono">{c.contract_number}</TableCell>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell>{c.shop?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{c.type}</TableCell>
                    <TableCell>{c.start_date ?? '—'}</TableCell>
                    <TableCell>{c.end_date ?? '—'}</TableCell>
                    <TableCell>{c.value || '—'}</TableCell>
                    <TableCell><Badge variant={statusVariant(c.status)}>{CONTRACT_STATUS_LABELS[c.status] ?? c.status}</Badge></TableCell>
                    <TableCell><div className="flex gap-1">
                      {c.document_url && <Button variant="ghost" size="icon" asChild><a href={c.document_url} target="_blank" rel="noreferrer" aria-label="Voir le document"><ExternalLink className="h-4 w-4" /></a></Button>}
                      <Button variant="ghost" size="icon" aria-label="Modifier" onClick={() => { setEditing(c); setFormOpen(true); }}><Edit className="h-4 w-4" /></Button>
                    </div></TableCell>
                  </TableRow>
                ))}
                {contracts.length === 0 && <TableRow><TableCell colSpan={9} className="py-8 text-center text-muted-foreground">Aucun contrat trouvé</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <ContractForm open={formOpen} onOpenChange={setFormOpen} contract={editing} onSubmit={handleSubmit} />
    </div>
  );
}
