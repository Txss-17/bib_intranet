import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProductCatalog } from '@/hooks/useOpsControl';
import { useAuth } from '@/hooks/useAuth';
import { Search, Lock } from 'lucide-react';

export default function ProductCatalog() {
  const { data: items = [], isLoading } = useProductCatalog();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');

  // SKU interne visible : admin OR ops_logistics_manager
  const canSeeInternalSku =
    profile?.position === 'ops_logistics_manager' ||
    profile?.position === 'ceo' ||
    profile?.poles?.includes('direction');

  const filtered = items.filter((p) => {
    const q = search.toLowerCase();
    return !q || p.shop_sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || (p.barcode ?? '').includes(q);
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Référentiel produits</h1>
        <p className="text-muted-foreground">Source de vérité OPS — données envoyées aux partenaires</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Catalogue ({items.length})</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="SKU, nom ou code-barres…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU boutique</TableHead>
                  <TableHead>SKU interne {!canSeeInternalSku && <Lock className="inline h-3 w-3 ml-1" />}</TableHead>
                  <TableHead>Code-barres</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Poids brut</TableHead>
                  <TableHead className="text-right">Poids net</TableHead>
                  <TableHead>Packaging</TableHead>
                  <TableHead>État</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs font-medium">{p.shop_sku}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {canSeeInternalSku ? p.internal_sku ?? '—' : <span className="text-muted-foreground">••••••</span>}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.barcode ?? '—'}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.category && <Badge variant="outline">{p.category}</Badge>}</TableCell>
                    <TableCell className="text-right">{p.weight_gross_g ? `${p.weight_gross_g}g` : '—'}</TableCell>
                    <TableCell className="text-right">{p.weight_net_g ? `${p.weight_net_g}g` : '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.packaging_type ?? '—'}</TableCell>
                    <TableCell>
                      {p.is_active ? (
                        <Badge variant="secondary">Actif</Badge>
                      ) : (
                        <Badge variant="outline">Inactif</Badge>
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
