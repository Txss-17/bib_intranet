import { useMemo, useState } from 'react';
import { ProtectedScreen } from '@/components/ProtectedScreen';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSupplierCatalogUploads, useReviewCatalogUpload, type SupplierCatalogUpload } from '@/hooks/useSupplierCatalogUploads';
import { FileText, ExternalLink, Check, X } from 'lucide-react';

const statusLabels: Record<string, string> = { pending: 'À traiter', reviewing: 'En revue', approved: 'Approuvé', rejected: 'Refusé' };
function statusColor(s: string) {
  return s === 'approved' ? 'bg-green-500/15 text-green-700 dark:text-green-400'
    : s === 'rejected' ? 'bg-red-500/15 text-red-700 dark:text-red-400'
    : s === 'reviewing' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
    : 'bg-orange-500/15 text-orange-700 dark:text-orange-400';
}

export default function SupplierCatalogInbox() {
  const { data: uploads = [], isLoading } = useSupplierCatalogUploads();
  const review = useReviewCatalogUpload();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [active, setActive] = useState<SupplierCatalogUpload | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [notes, setNotes] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return uploads.filter(u => {
      if (status !== 'all' && u.status !== status) return false;
      if (q && !`${u.file_name} ${u.version ?? ''} ${u.submitted_by_email ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [uploads, search, status]);

  const submit = async () => {
    if (!active || !decision) return;
    await review.mutateAsync({ id: active.id, status: decision, notes: notes.trim() || undefined, supplierId: active.supplier_id });
    setActive(null); setDecision(null); setNotes('');
  };

  return (
    <ProtectedScreen screenId="supplier.catalog_inbox">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><FileText className="h-7 w-7" /> Inbox catalogues</h1>
          <p className="text-muted-foreground">Nouveaux catalogues uploadés par les fournisseurs depuis leur portail</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Filtres</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Rechercher fichier, email, version..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Uploads ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p className="text-muted-foreground py-8 text-center">Chargement...</p> :
            filtered.length === 0 ? <p className="text-muted-foreground py-8 text-center">Aucun catalogue</p> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Fichier</TableHead><TableHead>Version</TableHead><TableHead>Soumis par</TableHead>
                  <TableHead>Taille</TableHead><TableHead>Statut</TableHead><TableHead>Reçu le</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.file_name}</TableCell>
                      <TableCell>{u.version ?? '—'}</TableCell>
                      <TableCell>{u.submitted_by_email ?? '—'}</TableCell>
                      <TableCell>{u.file_size ? `${Math.round(u.file_size / 1024)} Ko` : '—'}</TableCell>
                      <TableCell><Badge className={statusColor(u.status)}>{statusLabels[u.status]}</Badge></TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleString('fr-FR')}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" asChild>
                            <a href={u.file_url} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3" /></a>
                          </Button>
                          {(u.status === 'pending' || u.status === 'reviewing') && (
                            <>
                              <Button size="sm" variant="outline" className="text-green-600" onClick={() => { setActive(u); setDecision('approved'); }}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600" onClick={() => { setActive(u); setDecision('rejected'); }}>
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!active && !!decision} onOpenChange={(o) => { if (!o) { setActive(null); setDecision(null); setNotes(''); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{decision === 'approved' ? 'Approuver' : 'Refuser'} le catalogue</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{active?.file_name}</p>
              <div>
                <Label>Commentaire (visible côté fournisseur)</Label>
                <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={decision === 'rejected' ? 'Raison du refus...' : 'Note (optionnel)'} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setActive(null); setDecision(null); }}>Annuler</Button>
              <Button onClick={submit} disabled={review.isPending || (decision === 'rejected' && !notes.trim())}>Confirmer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedScreen>
  );
}
