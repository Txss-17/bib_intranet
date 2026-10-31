import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePoleCollaborators, collaboratorName } from '@/hooks/usePoleCollaborators';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Portfolio = { id: string; category: string; responsible_name: string };
type Assignment = {
  id: string; portfolio_id: string | null; assigned_to_id: string | null;
  assigned_to_name: string; assigned_at: string | null;
};
type Product = {
  id: string; name: string; sku: string | null; category: string | null;
  status: string; platform_publish_status: string | null;
};
type Certification = {
  id: string; name: string; type: string; issuer: string | null;
  certificate_number: string | null; status: string; expiry_date: string | null;
  product_id: string | null;
};
type AssignmentEvent = {
  id: string; created_at: string; portfolio_id: string | null;
  previous_portfolio_id: string | null; employee_id: string | null;
  previous_employee_id: string | null; reason: string | null;
};

const date = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('fr-FR') : '—';

export default function SupplierDossier({ supplierId, supplierStatus }: { supplierId: string; supplierStatus: string }) {
  const qc = useQueryClient();
  const { can } = usePermissions();
  const canManage = supplierStatus === 'validated' && can('supplier.suppliers', 'update');
  const staff = usePoleCollaborators('supplier', 'supplier.suppliers', 'update', canManage);
  const [portfolioId, setPortfolioId] = useState('unchanged');
  const [employeeId, setEmployeeId] = useState('unchanged');
  const [reason, setReason] = useState('');

  const portfolios = useQuery({
    queryKey: ['supplier-dossier-portfolios'],
    queryFn: async () => {
      const { data, error } = await supabase.from('supplier_portfolios')
        .select('id,category,responsible_name').order('category');
      if (error) throw error;
      return (data ?? []) as Portfolio[];
    },
  });
  const assignment = useQuery({
    queryKey: ['supplier-dossier-assignment', supplierId],
    queryFn: async () => {
      const { data, error } = await supabase.from('portfolio_assignments')
        .select('id,portfolio_id,assigned_to_id,assigned_to_name,assigned_at')
        .eq('supplier_id', supplierId)
        .order('assigned_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(1).maybeSingle();
      if (error) throw error;
      return (data ?? null) as Assignment | null;
    },
  });
  const products = useQuery({
    queryKey: ['supplier-dossier-products', supplierId],
    queryFn: async () => {
      const { data, error } = await supabase.from('products')
        .select('id,name,sku,category,status,platform_publish_status')
        .eq('supplier_id', supplierId).order('name');
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });
  const productIds = (products.data ?? []).map(product => product.id);
  const certificates = useQuery({
    queryKey: ['supplier-dossier-certifications', supplierId, productIds.join(',')],
    enabled: products.isSuccess,
    queryFn: async () => {
      // Direct supplier certificates and product-only certificates are both included.
      // Values come from UUID columns of this supplier's records, not free text.
      const base = supabase.from('certifications')
        .select('id,name,type,issuer,certificate_number,status,expiry_date,product_id,supplier_id');
      const query = productIds.length
        ? base.or(`supplier_id.eq.${supplierId},product_id.in.(${productIds.join(',')})`)
        : base.eq('supplier_id', supplierId);
      const { data, error } = await query.order('name');
      if (error) throw error;
      return (data ?? []) as (Certification & { supplier_id: string | null })[];
    },
  });
  const history = useQuery({
    queryKey: ['supplier-dossier-assignment-history', supplierId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('supplier_assignment_events')
        .select('id,created_at,portfolio_id,previous_portfolio_id,employee_id,previous_employee_id,reason')
        .eq('supplier_id',supplierId).order('created_at',{ ascending:false }).limit(50);
      if (error) throw error;
      return (data ?? []) as AssignmentEvent[];
    },
    enabled: can('supplier.suppliers','read'),
  });

  const current = assignment.data;
  const chosenPortfolio = portfolioId === 'unchanged' ? current?.portfolio_id || '' : portfolioId;
  const chosenEmployee = employeeId === 'unchanged' ? current?.assigned_to_id || '' : employeeId;
  const changed = (portfolioId !== 'unchanged' || employeeId !== 'unchanged')
    && (chosenPortfolio !== (current?.portfolio_id || '') || chosenEmployee !== (current?.assigned_to_id || ''));
  const names = new Map((portfolios.data ?? []).map(p => [p.id, p.category]));
  const members = new Map((staff.data ?? []).map(p => [p.id, collaboratorName(p)]));
  const eligible = (staff.data ?? []).filter(p => p.eligible);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('assign_validated_supplier_dossier' as never,{
        p_supplier_id: supplierId,
        p_portfolio_id: chosenPortfolio || null,
        p_employee_id: chosenEmployee || null,
        p_reason: reason.trim() || null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      setPortfolioId('unchanged');setEmployeeId('unchanged');setReason('');
      void qc.invalidateQueries({ queryKey: ['supplier-dossier-assignment', supplierId] });
      void qc.invalidateQueries({ queryKey: ['supplier-dossier-assignment-history', supplierId] });
      void qc.invalidateQueries({ queryKey: ['supplier-portfolio-data'] });
      void qc.invalidateQueries({ queryKey: ['assignment_candidates'] });
      toast.success('Affectation fournisseur enregistrée et historisée.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return <Tabs defaultValue="products" className="w-full">
    <TabsList className="flex w-full flex-wrap h-auto">
      <TabsTrigger value="products">Produits</TabsTrigger>
      <TabsTrigger value="certifications">Certifications</TabsTrigger>
      <TabsTrigger value="assignment">Affectation</TabsTrigger>
      <TabsTrigger value="history">Historique</TabsTrigger>
    </TabsList>

    <TabsContent value="products" className="space-y-3 pt-2">
      {products.isLoading && <p role="status">Chargement des produits…</p>}
      {products.isError && <p role="alert" className="text-destructive">Produits indisponibles. <Button variant="outline" onClick={() => void products.refetch()}>Réessayer</Button></p>}
      {!products.isLoading && !products.isError && <>
        <p className="text-sm text-muted-foreground">{products.data?.length ?? 0} produit(s) relié(s) au fournisseur par identifiant.</p>
        {(products.data ?? []).length === 0 && <p className="text-sm">Aucun produit rattaché à ce fournisseur.</p>}
        <ul className="max-h-72 space-y-2 overflow-y-auto">
          {(products.data ?? []).map(product => <li key={product.id} className="rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{product.name}</span><Badge variant="outline">{product.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{product.sku || 'Sans SKU'} · {product.category || 'Sans catégorie'}</p>
            {product.platform_publish_status && <p className="text-xs">BIB Platform : {product.platform_publish_status}</p>}
          </li>)}
        </ul>
        <Link className="text-sm text-primary underline" to="/pole/supplier/validated">Consulter les produits validés</Link>
      </>}
    </TabsContent>

    <TabsContent value="certifications" className="space-y-3 pt-2">
      {certificates.isLoading && <p role="status">Chargement des certifications…</p>}
      {certificates.isError && <p role="alert" className="text-destructive">Certifications indisponibles. <Button variant="outline" onClick={() => void certificates.refetch()}>Réessayer</Button></p>}
      {!certificates.isLoading && !certificates.isError && <>
        <p className="text-sm text-muted-foreground">{certificates.data?.length ?? 0} certification(s) fournisseur ou produit rattachée(s) à ce dossier.</p>
        {(certificates.data ?? []).length === 0 && <p className="text-sm">Aucune certification fournisseur enregistrée.</p>}
        <ul className="max-h-72 space-y-2 overflow-y-auto">
          {(certificates.data ?? []).map(cert => <li key={cert.id} className="rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{cert.name}</span><Badge variant="outline">{cert.status}</Badge></div>
            <p className="text-xs text-muted-foreground">Émetteur : {cert.issuer || 'Non renseigné'} · Réf. : {cert.certificate_number || '—'}</p>
            <p className="text-xs text-muted-foreground">Expiration : {date(cert.expiry_date)}{cert.product_id ? ' · Certification de produit' : ''}</p>
          </li>)}
        </ul>
        <Link className="text-sm text-primary underline" to="/pole/supplier/certifications">Registre des certifications</Link>
      </>}
    </TabsContent>

    <TabsContent value="assignment" className="space-y-4 pt-2">
      {assignment.isLoading && <p role="status">Chargement de l'affectation…</p>}
      {assignment.isError && <p role="alert" className="text-destructive">Affectation indisponible. <Button variant="outline" onClick={() => void assignment.refetch()}>Réessayer</Button></p>}
      {!assignment.isLoading && !assignment.isError && <>
        <div className="rounded-md border bg-muted/20 p-3 text-sm space-y-1">
          <p>Portefeuille : <strong>{current?.portfolio_id ? names.get(current.portfolio_id) || 'Portefeuille inaccessible' : 'Non rattaché'}</strong></p>
          <p>Collaborateur : <strong>{current?.assigned_to_id ? members.get(current.assigned_to_id) || current.assigned_to_name || 'Collaborateur inaccessible' : 'Non attribué'}</strong></p>
          <p className="text-xs text-muted-foreground">Dernière affectation : {date(current?.assigned_at || null)}</p>
        </div>
        {supplierStatus !== 'validated' && <p className="text-sm text-muted-foreground">L’affectation n’est disponible qu’après validation du fournisseur.</p>}
        {canManage && <form className="space-y-3" onSubmit={event => {event.preventDefault();save.mutate();}}>
          <div className="space-y-1">
            <Label htmlFor="supplier-dossier-portfolio">Portefeuille fournisseur</Label>
            <select id="supplier-dossier-portfolio" aria-label="Portefeuille fournisseur" value={portfolioId}
              onChange={event => setPortfolioId(event.target.value)} disabled={save.isPending || portfolios.isError || portfolios.isLoading}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="unchanged">Conserver le portefeuille actuel</option>
              <option value="">Sans portefeuille</option>
              {(portfolios.data ?? []).map(p => <option key={p.id} value={p.id}>{p.category}{p.responsible_name ? ' · '+p.responsible_name : ''}</option>)}
            </select>
            {portfolios.isError && <p role="alert" className="text-xs text-destructive">Liste des portefeuilles indisponible.</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="supplier-dossier-assignee">Collaborateur du pôle Fournisseurs</Label>
            <select id="supplier-dossier-assignee" aria-label="Collaborateur du pôle Fournisseurs" value={employeeId}
              onChange={event => setEmployeeId(event.target.value)} disabled={save.isPending || staff.isLoading || staff.isError}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="unchanged">Conserver le responsable actuel</option>
              <option value="">Non attribué</option>
              {eligible.map(p => <option key={p.id} value={p.id}>{collaboratorName(p)}</option>)}
            </select>
            {staff.isError && <p role="alert" className="text-xs text-destructive">Annuaire indisponible. Vérifier la migration 0074.</p>}
            {!staff.isLoading && !staff.isError && <p className="text-xs text-muted-foreground">{staff.data?.length || 0} membre(s) du pôle · {eligible.length} habilité(s) à être responsables.</p>}
          </div>
          <div className="space-y-1"><Label htmlFor="supplier-dossier-reason">Motif de l'affectation</Label>
            <Input id="supplier-dossier-reason" value={reason} maxLength={2000} placeholder="Prise en charge, transfert, nouveau portefeuille…" onChange={e => setReason(e.target.value)}/></div>
          <Button type="submit" disabled={save.isPending || !changed || (!chosenPortfolio && !chosenEmployee) || assignment.isError || portfolios.isError || staff.isError}>
            {save.isPending ? 'Enregistrement…' : 'Enregistrer l’affectation'}
          </Button>
          <p className="text-xs text-muted-foreground">La modification est vérifiée côté serveur et conserve un historique des changements.</p>
        </form>}
        <Link to="/pole/supplier/portfolios" className="text-sm text-primary underline">Gérer les portefeuilles fournisseurs</Link>
      </>}
    </TabsContent>

    <TabsContent value="history" className="space-y-3 pt-2">
      {history.isLoading && <p role="status">Chargement de l'historique…</p>}
      {history.isError && <p role="alert" className="text-destructive">Historique indisponible : vérifier la migration 0075. <Button variant="outline" onClick={() => void history.refetch()}>Réessayer</Button></p>}
      {!history.isLoading && !history.isError && (history.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Aucun transfert historisé depuis la mise en place du journal.</p>}
      <ul className="max-h-72 space-y-2 overflow-y-auto">
        {(history.data ?? []).map(event => <li key={event.id} className="rounded-md border p-3 text-xs">
          <p className="font-medium">{date(event.created_at)} · {event.reason || 'Affectation modifiée'}</p>
          <p>Portefeuille : {names.get(event.previous_portfolio_id || '') || '—'} → {names.get(event.portfolio_id || '') || '—'}</p>
          <p>Collaborateur : {members.get(event.previous_employee_id || '') || '—'} → {members.get(event.employee_id || '') || '—'}</p>
        </li>)}
      </ul>
    </TabsContent>
  </Tabs>;
}
