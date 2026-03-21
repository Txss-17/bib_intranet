import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Package, Clock, CheckCircle, XCircle, Eye, Filter, Search, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExportButtons } from '@/components/ExportButtons';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const mockProducts = [
  { id: 'PRD-001', name: 'Savon Bio Lavande 100g', supplier: 'BioCosmetics SAS', country: '🇫🇷', category: 'Hygiène', priceFactory: 2.50, moq: 500, leadTime: '14j', packaging: 'Recyclable', markets: 'FR, DE', status: 'pending', riskScore: 'low', submittedAt: '2026-03-18T10:30:00Z' },
  { id: 'PRD-002', name: 'Crème Hydratante 50ml', supplier: 'NaturaCare', country: '🇩🇪', category: 'Soins', priceFactory: 8.90, moq: 200, leadTime: '21j', packaging: 'Compostable', markets: 'EU', status: 'review', riskScore: 'medium', submittedAt: '2026-03-17T14:15:00Z' },
  { id: 'PRD-003', name: 'Shampoing Solide Avocat', supplier: 'GreenBeauty', country: '🇮🇹', category: 'Cheveux', priceFactory: 5.20, moq: 300, leadTime: '18j', packaging: 'Recyclable', markets: 'FR', status: 'pending', riskScore: 'low', submittedAt: '2026-03-16T09:00:00Z' },
  { id: 'PRD-004', name: 'Déodorant Pierre Alun', supplier: 'BioCosmetics SAS', country: '🇫🇷', category: 'Hygiène', priceFactory: 4.30, moq: 400, leadTime: '12j', packaging: 'Recyclable', markets: 'FR, UK', status: 'review', riskScore: 'high', submittedAt: '2026-03-15T16:45:00Z' },
  { id: 'PRD-005', name: 'Huile Argan Bio 30ml', supplier: 'OrganicLab', country: '🇲🇦', category: 'Soins', priceFactory: 12.50, moq: 150, leadTime: '25j', packaging: 'Verre recyclé', markets: 'FR, DE, US', status: 'pending', riskScore: 'low', submittedAt: '2026-03-14T11:00:00Z' },
  { id: 'PRD-006', name: 'Baume Lèvres Karité', supplier: 'NaturaCare', country: '🇩🇪', category: 'Soins', priceFactory: 3.80, moq: 600, leadTime: '10j', packaging: 'Compostable', markets: 'EU', status: 'pending', riskScore: 'low', submittedAt: '2026-03-13T08:30:00Z' },
];

const ITEMS_PER_PAGE = 10;

export default function PendingProducts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [marketFilter, setMarketFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<typeof mockProducts[0] | null>(null);
  const [actionDialog, setActionDialog] = useState<'validate' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const filtered = mockProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.supplier.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchCountry = countryFilter === 'all' || p.country.includes(countryFilter);
    const matchRisk = riskFilter === 'all' || p.riskScore === riskFilter;
    const matchMarket = marketFilter === 'all' || p.markets.includes(marketFilter);
    const matchTab = activeTab === 'all' || p.status === activeTab;
    return matchSearch && matchCat && matchCountry && matchRisk && matchMarket && matchTab;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const pendingCount = mockProducts.filter(p => p.status === 'pending').length;
  const reviewCount = mockProducts.filter(p => p.status === 'review').length;

  const categories = [...new Set(mockProducts.map(p => p.category))];

  const getRiskBadge = (risk: string) => {
    const map: Record<string, string> = { high: 'bg-destructive text-destructive-foreground', medium: 'bg-orange-500 text-white', low: 'bg-emerald-500 text-white' };
    return <Badge className={map[risk] || ''}>{risk === 'high' ? 'Élevé' : risk === 'medium' ? 'Moyen' : 'Bas'}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Revue Produits Fournisseurs</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} produit(s) — Page {currentPage}/{totalPages || 1}</p>
        </div>
        <ExportButtons filename="produits-revue" title="Revue Produits" columns={[
          { header: 'ID', accessor: 'id' }, { header: 'Nom', accessor: 'name' }, { header: 'Fournisseur', accessor: 'supplier' },
          { header: 'Catégorie', accessor: 'category' }, { header: 'Prix Usine', accessor: 'priceFactory' }, { header: 'MOQ', accessor: 'moq' },
        ]} data={filtered} />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }}>
        <TabsList>
          <TabsTrigger value="pending">En attente ({pendingCount})</TabsTrigger>
          <TabsTrigger value="review">En revue ({reviewCount})</TabsTrigger>
          <TabsTrigger value="all">Tous</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher ID, nom, fournisseur..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Catégorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Score risque" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous risques</SelectItem>
            <SelectItem value="high">Élevé</SelectItem>
            <SelectItem value="medium">Moyen</SelectItem>
            <SelectItem value="low">Bas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={marketFilter} onValueChange={setMarketFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Marché" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous marchés</SelectItem>
            <SelectItem value="FR">France</SelectItem>
            <SelectItem value="DE">Allemagne</SelectItem>
            <SelectItem value="EU">EU</SelectItem>
            <SelectItem value="US">US</SelectItem>
            <SelectItem value="UK">UK</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Produit</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix Usine</TableHead>
                <TableHead>MOQ</TableHead>
                <TableHead>Délai</TableHead>
                <TableHead>Packaging</TableHead>
                <TableHead>Marchés</TableHead>
                <TableHead>Risque</TableHead>
                <TableHead>Soumission</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.id}</TableCell>
                  <TableCell><span className="mr-1">{p.country}</span>{p.supplier}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell>{p.priceFactory.toFixed(2)} €</TableCell>
                  <TableCell>{p.moq}</TableCell>
                  <TableCell>{p.leadTime}</TableCell>
                  <TableCell><Badge variant="outline">{p.packaging}</Badge></TableCell>
                  <TableCell className="text-xs">{p.markets}</TableCell>
                  <TableCell>{getRiskBadge(p.riskScore)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(p.submittedAt), 'd MMM yyyy', { locale: fr })}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(p)}><Eye className="h-3 w-3" /></Button>
                      <Button variant="outline" size="sm" className="text-emerald-500" onClick={() => { setSelectedProduct(p); setActionDialog('validate'); }}>
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => { setSelectedProduct(p); setActionDialog('reject'); }}>
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Product Info + History */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Informations produits</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">Sélectionnez un produit pour voir ses informations détaillées : composition, certifications, photos, fiches techniques.</p>
              {selectedProduct && (
                <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                  <p><strong>Produit:</strong> {selectedProduct.name}</p>
                  <p><strong>Fournisseur:</strong> {selectedProduct.supplier}</p>
                  <p><strong>Prix usine:</strong> {selectedProduct.priceFactory.toFixed(2)} €</p>
                  <p><strong>MOQ:</strong> {selectedProduct.moq} unités</p>
                  <p><strong>Packaging:</strong> {selectedProduct.packaging}</p>
                  <p><strong>Marchés:</strong> {selectedProduct.markets}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Historique & Traçabilité</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {[
                { date: '18 Mar 2026', action: 'PRD-001 soumis par BioCosmetics SAS' },
                { date: '17 Mar 2026', action: 'PRD-002 passé en revue' },
                { date: '15 Mar 2026', action: 'PRD-004 flaggé risque élevé' },
                { date: '14 Mar 2026', action: 'PRD-005 soumis par OrganicLab' },
              ].map((h, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{h.action}</p>
                    <p className="text-xs text-muted-foreground">{h.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <Dialog open={actionDialog === 'validate'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider le produit</DialogTitle>
            <DialogDescription>Confirmez la validation de "{selectedProduct?.name}" ?</DialogDescription>
          </DialogHeader>
          <div className="py-4 grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted-foreground">Fournisseur</p><p className="font-medium">{selectedProduct?.supplier}</p></div>
            <div><p className="text-muted-foreground">Prix</p><p className="font-medium">{selectedProduct?.priceFactory.toFixed(2)} €</p></div>
            <div><p className="text-muted-foreground">MOQ</p><p className="font-medium">{selectedProduct?.moq}</p></div>
            <div><p className="text-muted-foreground">Risque</p><p className="font-medium">{selectedProduct?.riskScore}</p></div>
          </div>
          {selectedProduct?.riskScore === 'high' && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-4 w-4" /><span className="text-sm font-medium">Score de risque élevé</span></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Annuler</Button>
            <Button onClick={() => setActionDialog(null)} className="bg-emerald-500 hover:bg-emerald-600">Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog === 'reject'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser le produit</DialogTitle>
            <DialogDescription>Raison du refus pour "{selectedProduct?.name}"</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Raison du refus..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => { setActionDialog(null); setRejectionReason(''); }} disabled={!rejectionReason.trim()}>Confirmer le refus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
