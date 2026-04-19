import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useReplenishment, useApproveReplenishment, useProductCatalog, useOpsPartners } from '@/hooks/useOpsControl';
import { Check, X, Sparkles } from 'lucide-react';

export default function Replenishment() {
  const { data: suggestions = [], isLoading } = useReplenishment();
  const { data: catalog = [] } = useProductCatalog();
  const { data: partners = [] } = useOpsPartners();
  const action = useApproveReplenishment();

  const productName = (id: string) => catalog.find((c) => c.id === id)?.name ?? '—';
  const partnerName = (id: string | null) => (id ? (partners as Array<{ id: string; name: string }>).find((p) => p.id === id)?.name ?? '—' : '—');

  const priorityBadge = (p: string) => {
    const variant: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    };
    return <Badge variant={variant[p] ?? 'outline'}>{p}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-accent" /> Réapprovisionnement
        </h1>
        <p className="text-muted-foreground">Suggestions automatiques de redistribution entre partenaires</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suggestions ({suggestions.filter((s) => s.status === 'pending').length} en attente)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Cible</TableHead>
                  <TableHead className="text-right">Qté suggérée</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{productName(s.catalog_id)}</TableCell>
                    <TableCell className="text-muted-foreground">{partnerName(s.source_partner_id)}</TableCell>
                    <TableCell>{partnerName(s.target_partner_id)}</TableCell>
                    <TableCell className="text-right font-medium">{s.suggested_quantity}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{s.reason}</TableCell>
                    <TableCell>{priorityBadge(s.priority)}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === 'pending' ? 'outline' : 'secondary'}>{s.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {s.status === 'pending' && (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => action.mutate({ id: s.id, status: 'approved' })}
                          >
                            <Check className="h-4 w-4 text-success" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => action.mutate({ id: s.id, status: 'rejected' })}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {suggestions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Aucune suggestion
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
