import { useQuery } from '@tanstack/react-query';
import { Loader2, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

type PortfolioReference = {
  id: string;
  label: string;
  pole: string;
  source: string;
};

type RelatedRecord = {
  id: string;
  description: string;
  secondary?: string;
};

type PortfolioDetail = {
  title: string;
  pole: string;
  items: RelatedRecord[];
  tasks: RelatedRecord[];
  sourceLabel: string;
};

/**
 * A detail request rechecks ownership against Supabase, rather than trusting
 * a portfolio ID clicked in the browser. RLS is the final security boundary.
 */
async function fetchPersonalPortfolioDetail(reference: PortfolioReference, userId: string): Promise<PortfolioDetail> {
  const now = new Date().toISOString();
  let source = reference.source;
  let linkedId = reference.id;
  let pole = reference.pole;
  let title = reference.label;

  if (source === 'rbac') {
    const { data: assignment, error: assignmentError } = await supabase
      .from('access_portfolio_assignments').select('id')
      .eq('employee_id', userId).eq('portfolio_id', reference.id)
      .eq('assignment_status', 'active')
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`).limit(1).maybeSingle();
    if (assignmentError) throw assignmentError;
    if (!assignment) throw new Error('Ce portefeuille ne vous est plus attribué.');
    const { data: business, error: businessError } = await supabase
      .from('access_business_portfolios')
      .select('source_id,label_snapshot,status,portfolio_type:access_portfolio_types(portfolio_type_key,business_pole,status)')
      .eq('id', reference.id).eq('status', 'active').maybeSingle();
    if (businessError) throw businessError;
    const type = business?.portfolio_type && (Array.isArray(business.portfolio_type)
      ? business.portfolio_type[0] : business.portfolio_type);
    if (!business || !type || type.status !== 'active' || type.business_pole !== reference.pole)
      throw new Error('Périmètre du portefeuille indisponible.');
    title = business.label_snapshot || title;
    pole = type.business_pole;
    linkedId = business.source_id;
    source = type.portfolio_type_key === 'supplier' ? 'supplier'
      : type.portfolio_type_key === 'merchant' ? 'merchant'
      : type.portfolio_type_key === 'shop' ? 'shop'
      : 'unknown';
  }

  let items: RelatedRecord[] = [];
  let sourceLabel = 'Dossiers rattachés';

  if (source === 'supplier') {
    // A RBAC entitlement grants access only to the underlying supplier
    // portfolio that it references; direct portfolio visits require ownership.
    const { data: portfolio, error } = await supabase.from('supplier_portfolios')
      .select('id,category,responsible_id,backup_id,archived_at')
      .eq('id', linkedId).is('archived_at', null).maybeSingle();
    if (error) throw error;
    if (!portfolio || (reference.source !== 'rbac' &&
      portfolio.responsible_id !== userId && portfolio.backup_id !== userId))
      throw new Error('Portefeuille fournisseur non autorisé.');
    title = portfolio.category || title;
    sourceLabel = 'Fournisseurs du portefeuille';
    const { data: assignments, error: assignmentError } = await supabase
      .from('portfolio_assignments')
      .select('id,supplier_id').eq('portfolio_id', linkedId).limit(100);
    if (assignmentError) throw assignmentError;
    const ids = [...new Set((assignments ?? []).map(a => a.supplier_id).filter((id): id is string => !!id))];
    if (ids.length) {
      const { data: suppliers, error: supplierError } = await supabase
        .from('suppliers').select('id,name,status,country')
        .in('id', ids).limit(100);
      if (supplierError) throw supplierError;
      items = (suppliers ?? []).map(s => ({
        id: s.id, description: s.name || 'Fournisseur',
        secondary: [s.status,s.country].filter(Boolean).join(' · '),
      }));
    }
  } else if (source === 'merchant') {
    const { data: portfolio, error } = await supabase.from('merchant_portfolios')
      .select('id,name,owner_id,status,notes').eq('id',linkedId).eq('status','active').maybeSingle();
    if (error) throw error;
    if (!portfolio || (reference.source !== 'rbac' && portfolio.owner_id !== userId))
      throw new Error('Portefeuille marchand non autorisé.');
    title = portfolio.name || title;
    sourceLabel = 'Marchands du portefeuille';
    const { data: assignments, error: assignmentError } = await supabase
      .from('merchant_portfolio_assignments')
      .select('id,merchant_id,assigned_at').eq('portfolio_id',linkedId)
      .is('ended_at',null).limit(100);
    if (assignmentError) throw assignmentError;
    items = (assignments ?? []).map(a => ({
      id: a.id, description: `Marchand — référence ${a.merchant_id}`,
      secondary: a.assigned_at ? `Affecté le ${new Date(a.assigned_at).toLocaleDateString('fr-FR')}` : undefined,
    }));
  } else if (source === 'case') {
    const { data: portfolio, error } = await supabase.from('bib_case_portfolios')
      .select('id,name,pole,owner_id,status').eq('id',linkedId).eq('status','active').maybeSingle();
    if (error) throw error;
    if (!portfolio || portfolio.owner_id !== userId || portfolio.pole !== pole)
      throw new Error('Dossier métier non autorisé.');
    title = portfolio.name || title;
    sourceLabel = 'Dossiers et entités du portefeuille';
    const { data: members, error: membersError } = await supabase.from('bib_case_portfolio_members')
      .select('id,entity_kind,entity_id,assigned_at').eq('portfolio_id',linkedId)
      .is('ended_at',null).limit(100);
    if (membersError) throw membersError;
    items = (members ?? []).map(m => ({
      id: m.id, description: `${m.entity_kind} — référence ${m.entity_id}`,
      secondary: m.assigned_at ? `Rattaché le ${new Date(m.assigned_at).toLocaleDateString('fr-FR')}` : undefined,
    }));
  } else if (source === 'shop') {
    // No direct shop-record mapping in this register yet. Never substitute
    // an unrelated general list of shop records.
    sourceLabel = 'Boutiques du portefeuille';
  } else {
    sourceLabel = 'Dossiers métier';
  }

  // These are the employee's own tasks within this pole, NOT tasks directly
  // attached to a portfolio (work_tasks has no portfolio_id column).
  const { data: tasks, error: tasksError } = await supabase.from('work_tasks')
    .select('id,title,status,priority,due_date')
    .eq('assignee_id',userId).eq('pole',pole)
    .is('archived_at',null).order('created_at',{ascending:false}).limit(15);
  if (tasksError) throw tasksError;
  return {
    title,pole,sourceLabel,items,
    tasks:(tasks ?? []).map(t => ({
      id:t.id,description:t.title,
      secondary:[t.status,t.priority,t.due_date ? `Échéance : ${new Date(t.due_date).toLocaleDateString('fr-FR')}` : null].filter(Boolean).join(' · '),
    })),
  };
}

export function PersonalPortfolioDetails({ reference, onClose }: {
  reference: PortfolioReference; onClose: () => void;
}) {
  const { user, profile } = useAuth();
  const isOwnSession = !!user && profile?.id === user.id
    && profile.hr_status === 'active' && profile.app_origin === 'connect' && !profile.test_account;
  const { data, isPending, isError, refetch } = useQuery({
    queryKey:['my-portfolio-detail',user?.id,reference.source,reference.id],
    queryFn:() => fetchPersonalPortfolioDetail(reference,user!.id),
    enabled:isOwnSession,
    retry:false,
    staleTime:15_000,
    refetchOnWindowFocus:true,
  });
  if (!isOwnSession) return null;
  return (
    <div className="mt-3 rounded-lg border bg-muted/20 p-4" data-testid="personal-portfolio-details">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div><h4 className="font-semibold">Détail du portefeuille</h4>
          <p className="text-xs text-muted-foreground">{reference.label} · {reference.pole}</p>
        </div>
        <Button size="sm" variant="ghost" aria-label="Fermer les détails" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      {isPending ? <p className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin"/>Chargement du détail…</p>
        : isError ? <div role="alert" className="text-sm text-destructive">Impossible de vérifier le contenu ou vos habilitations.
          <Button variant="outline" size="sm" className="ml-2" onClick={() => void refetch()}>Réessayer</Button>
        </div>
        : data ? <>
          <p className="mb-3 text-sm font-medium">{data.title}</p>
          <h5 className="mb-2 text-sm font-medium">{data.sourceLabel} ({data.items.length})</h5>
          {data.items.length ? <ul className="mb-4 space-y-2">{data.items.map(item =>
            <li key={item.id} className="rounded border p-2 text-sm">
              <div>{item.description}</div>
              {item.secondary && <div className="text-xs text-muted-foreground">{item.secondary}</div>}
            </li>)}</ul>
          : <p className="mb-4 text-sm text-muted-foreground">Aucun dossier rattaché visible ou répertorié.</p>}
          <h5 className="mb-1 text-sm font-medium">Mes tâches du pôle ({data.tasks.length})</h5>
          <p className="mb-2 text-xs text-muted-foreground">Tâches personnelles de ce pôle : leur association directe au portefeuille n'est pas enregistrée.</p>
          {data.tasks.length ? <ul className="space-y-2">{data.tasks.map(task =>
            <li key={task.id} className="rounded border p-2 text-sm">
              <div>{task.description}</div>
              <div className="text-xs text-muted-foreground">{task.secondary}</div>
            </li>)}</ul>
          : <p className="text-sm text-muted-foreground">Aucune tâche personnelle du pôle.</p>}
        </> : null}
    </div>
  );
}
