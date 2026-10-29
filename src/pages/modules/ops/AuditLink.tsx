import QualityPreview from '@/components/operations/QualityPreview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AuditLink() {
  const products = useQuery({
    queryKey: ['ops-audit-link', 'products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, status, rejection_reason, validated_at')
        .order('updated_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Interface Audit</h1>
        <p className="text-muted-foreground">Liaison OPS ↔ Audit : produits validés, anomalies, impact stock</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produits — décisions récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Validation</TableHead>
                <TableHead>Motif refus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(products.data ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'validated' ? 'secondary' : p.status === 'rejected' ? 'destructive' : 'outline'}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.validated_at ? new Date(p.validated_at).toLocaleDateString('fr-FR') : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-destructive">{p.rejection_reason ?? ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anomalies fournisseurs (impact stock potentiel)</CardTitle>
        </CardHeader>
        <CardContent>
          <QualityPreview limit={20} />
        </CardContent>
      </Card>
    </div>
  );
}
