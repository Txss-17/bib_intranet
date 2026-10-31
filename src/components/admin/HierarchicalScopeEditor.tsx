import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layers3, LockKeyhole, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { poles as allPoles } from '@/data/poles';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  emptyHierarchicalScope,
  describeHierarchicalScope,
  type HierarchicalScope,
} from '@/lib/hierarchicalScope';

const unique = (items: string[]) => [...new Set(items)].sort();
const toggle = (items: string[], value: string, checked: boolean) =>
  checked ? unique([...items, value]) : items.filter((item) => item !== value);

type ProfileOrg = { subsidiary: string | null; poles: string[] | null };
const initial = emptyHierarchicalScope();

export default function HierarchicalScopeEditor({ roleId }: { roleId: string }) {
  const { isSuperAdmin } = usePermissions();
  const { user } = useAuth();
  const { toast } = useToast();
  const [draft, setDraft] = useState<HierarchicalScope>(initial);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [regionDraft, setRegionDraft] = useState('');
  const [portfolioDraft, setPortfolioDraft] = useState('');
  const [mappingReason, setMappingReason] = useState('');
  const [mappingPole, setMappingPole] = useState('');
  const [mappingSubsidiary, setMappingSubsidiary] = useState('');
  const [mappingSaving, setMappingSaving] = useState(false);
  const org = useQuery({
    queryKey: ['scope-org', user?.id],
    enabled: isSuperAdmin && !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles')
        .select('subsidiary,poles').eq('test_account', false).not('subsidiary', 'is', null);
      if (error) throw error;
      return (data ?? []) as ProfileOrg[];
    },
  });
  const stored = useQuery({
    queryKey: ['hierarchical-scope-policy', roleId],
    enabled: isSuperAdmin && !!roleId,
    queryFn: async (): Promise<HierarchicalScope | null> => {
      const { data, error } = await (supabase as any).from('access_role_scope_policy_drafts')
        .select('policy').eq('role_id', roleId).maybeSingle();
      if (error) throw error;
      return data?.policy ?? null;
    },
  });
  useEffect(() => {
    setDraft(stored.data ?? emptyHierarchicalScope());
    setReason('');
  }, [stored.data, roleId]);

  const permittedPoles = (subsidiaries: string[]) => {
    if (!subsidiaries.length) return new Set<string>();
    // A role covering multiple subsidiaries can select only poles verified
    // in EACH subsidiary; otherwise one branch would silently be unverified.
    const perSubsidiary = subsidiaries.map(entity => new Set(
      (org.data ?? []).filter(profile => profile.subsidiary === entity)
        .flatMap(profile => profile.poles ?? []),
    ));
    // When no employee has yet joined a subsidiary, its future pole scope
    // can still be prepared. This remains an unapplied draft, not an access grant.
    if (perSubsidiary.some(values => values.size === 0)) {
      return new Set(allPoles.map(pole => pole.id));
    }
    return new Set([...perSubsidiary[0]].filter(pole =>
      perSubsidiary.every(values => values.has(pole)),
    ));
  };
  const allowedPoles = useMemo(() => {
    if (!draft.subsidiaries.length) return [];
    const permitted = draft.subsidiaries.map(entity => new Set(
      (org.data ?? []).filter(profile => profile.subsidiary === entity)
        .flatMap(profile => profile.poles ?? []),
    ));
    // Do not hide the official pole catalog just because no collaborator is
    // assigned yet. Actual data access remains subject to server-side RLS.
    if (permitted.some(values => values.size === 0)) return allPoles;
    return allPoles.filter(pole => permitted.every(values => values.has(pole.id)));
  }, [draft.subsidiaries, org.data]);
  const mapped = useQuery({
    queryKey: ['hierarchical-scope-dimensions', roleId],
    enabled: isSuperAdmin && !!roleId,
    queryFn: async () => {
      const [regions, portfolios, businesses, types] = await Promise.all([
        (supabase as any).from('access_scope_regions').select('subsidiary,pole,region_code,label,status').eq('status','active'),
        (supabase as any).from('access_scope_portfolios').select('subsidiary,pole,portfolio_id,status').eq('status','active'),
        supabase.from('access_business_portfolios').select('id,label_snapshot,status,portfolio_type_id').eq('status','active'),
        supabase.from('access_portfolio_types').select('id,business_pole,status').eq('status','active'),
      ]);
      const error = regions.error || portfolios.error || businesses.error || types.error;
      if (error) throw error;
      return {
        regions: (regions.data ?? []) as {subsidiary:string;pole:string;region_code:string;label:string}[],
        portfolios: (portfolios.data ?? []) as {subsidiary:string;pole:string;portfolio_id:string}[],
        businesses: (businesses.data ?? []) as {id:string;label_snapshot:string;portfolio_type_id:string}[],
        types: (types.data ?? []) as {id:string;business_pole:string}[],
      };
    },
  });
  // The scope editor configures future roles, not only roles of existing employees.
  // Keep the subsidiary catalog based on verified organisation and mapping records.
  const entities = useMemo(() => unique([
    ...(org.data ?? []).map(p => p.subsidiary ?? ''),
    ...(mapped.data?.regions ?? []).map(item => item.subsidiary),
    ...(mapped.data?.portfolios ?? []).map(item => item.subsidiary),
  ].filter(Boolean)), [org.data, mapped.data]);
  // A choice is available only when it is recorded in EVERY selected
  // subsidiary/pole pair. No cross-entity, cross-pole join is inferred.
  const selectedPairs = useMemo(() => draft.subsidiaries.flatMap(subsidiary =>
    (draft.poles.length ? draft.poles : allowedPoles.map(p => p.id))
      .map(pole => ({subsidiary,pole}))), [draft.subsidiaries,draft.poles,allowedPoles]);
  const regionChoices = useMemo(() => unique((mapped.data?.regions ?? [])
    .filter(item => selectedPairs.length > 0 && selectedPairs.every(pair =>
      mapped.data?.regions.some(candidate => candidate.subsidiary===pair.subsidiary &&
        candidate.pole===pair.pole && candidate.region_code===item.region_code)))
    .map(item => item.region_code)), [mapped.data,selectedPairs]);
  const portfolioChoices = useMemo(() => unique((mapped.data?.portfolios ?? [])
    .filter(item => selectedPairs.length > 0 && selectedPairs.every(pair =>
      mapped.data?.portfolios.some(candidate => candidate.subsidiary===pair.subsidiary &&
        candidate.pole===pair.pole && candidate.portfolio_id===item.portfolio_id)))
    .map(item => item.portfolio_id)), [mapped.data,selectedPairs]);
  const sourcePortfolios = useMemo(() => {
    const typeIds = new Set((mapped.data?.types ?? []).filter(x => x.business_pole===mappingPole).map(x=>x.id));
    return (mapped.data?.businesses ?? []).filter(x => typeIds.has(x.portfolio_type_id));
  },[mapped.data,mappingPole]);
  const createMapping = async (kind: 'region'|'portfolio', value: string) => {
    if (!isSuperAdmin || !mappingSubsidiary || !mappingPole || mappingReason.trim().length < 8 || !value) return;
    setMappingSaving(true);
    try {
      const { error } = await (supabase as any).rpc('configure_verified_scope_dimension',{
        p_kind:kind,p_subsidiary:mappingSubsidiary,p_pole:mappingPole,p_value:value,p_reason:mappingReason.trim(),
      });
      if (error) throw error;
      await mapped.refetch();
      setRegionDraft('');setPortfolioDraft('');setMappingReason('');
      toast({title:'Rattachement métier enregistré',description:'Il reste soumis aux contrôles hiérarchiques et aux permissions serveur.'});
    } catch(error) {
      toast({title:'Rattachement refusé',description:error instanceof Error?error.message:'Source de données indisponible',variant:'destructive'});
    } finally {setMappingSaving(false);}
  };
  const valid = !!roleId && draft.subsidiaries.length > 0 &&
    draft.poles.every(pole => allowedPoles.some(item => item.id === pole)) &&
    draft.regions.every(value => regionChoices.includes(value)) &&
    draft.portfolios.every(value => portfolioChoices.includes(value)) && !mapped.isError && !mapped.isLoading;
  const canEdit = isSuperAdmin && !!roleId && !saving &&
    !org.isError && !stored.isError && !org.isLoading && !stored.isLoading && !mapped.isError && !mapped.isLoading;
  const selectEntity = (entity: string, checked: boolean) => {
    const subsidiaries = toggle(draft.subsidiaries, entity, checked);
    const available = permittedPoles(subsidiaries);
    setDraft(current => ({
      ...current,
      subsidiaries,
      poles: current.poles.filter(pole => available.has(pole)),
      regions: [], portfolios: [],
    }));
  };
  const save = async () => {
    if (!canEdit || !valid || reason.trim().length < 8) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any).rpc('save_hierarchical_scope_policy_draft', {
        p_role_id: roleId, p_policy: draft, p_reason: reason.trim(),
      });
      if (error) throw error;
      await stored.refetch();
      setReason('');
      toast({ title: 'Politique hiérarchique enregistrée en brouillon',
        description: 'Elle ne modifie pas encore les autorisations effectives ni les règles RLS.' });
    } catch (error) {
      toast({ title: 'Enregistrement impossible',
        description: error instanceof Error ? error.message : 'Vérifiez la configuration serveur.',
        variant: 'destructive' });
    } finally { setSaving(false); }
  };
  if (!isSuperAdmin) return <p role="alert">La préparation des politiques hiérarchiques est réservée à l'administration technique.</p>;

  return <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Layers3 className="h-5 w-5"/>Périmètre hiérarchique du rôle</CardTitle>
      <p className="text-sm text-muted-foreground">
        Les choix se croisent : filiale ET pôle ET région ET portefeuille ET propriété des dossiers.
        « Tout » à chaque niveau signifie global dans la sélection parente, jamais accès total à BIB.
      </p>
      <Badge variant="outline" className="w-fit">Brouillon non applicable aux données avant intégration RLS</Badge>
    </CardHeader>
    <CardContent className="space-y-5">
      {!roleId && <p role="status">Sélectionnez d'abord un rôle.</p>}
      {(org.isError || stored.isError) && <p role="alert" className="text-sm text-destructive">
        Impossible de lire les organisations ou les politiques. Enregistrement désactivé.
      </p>}
      <fieldset disabled={!canEdit} className="space-y-3 rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">1 — Entités et filiales BIB</legend>
        <p className="text-xs text-muted-foreground">Source : entités des collaborateurs réels. Au moins une entité doit être choisie.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {entities.map(entity => <label key={entity} className="flex gap-2 rounded border p-2 text-sm">
            <input type="checkbox" checked={draft.subsidiaries.includes(entity)} onChange={e => selectEntity(entity, e.target.checked)}/>
            {entity}
          </label>)}
        </div>
        {!entities.length && <p className="text-xs text-muted-foreground">Aucune entité vérifiée.</p>}
      </fieldset>
      <fieldset disabled={!canEdit || !draft.subsidiaries.length} className="space-y-3 rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">2 — Pôles dans les entités sélectionnées</legend>
        <p className="text-xs text-muted-foreground">Sélectionner « Global dans la filiale » ou plusieurs pôles précis. Les 14 pôles du catalogue peuvent être préparés même avant le recrutement. Cette sélection reste un brouillon sans ouverture de droits.</p>
        <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
          <input type="radio" name="hierarchy-poles" checked={draft.poles.length === 0}
            onChange={() => setDraft(current => ({ ...current, poles: [], regions: [], portfolios: [] }))} />
          <span><strong>Global dans la filiale</strong> — tous les pôles appartenant aux entités BIB sélectionnées</span>
        </label>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {allowedPoles.map(pole => <label key={pole.id} className="flex gap-2 rounded border p-2 text-sm">
            <input type="checkbox" checked={draft.poles.includes(pole.id)}
              onChange={e => setDraft(current => ({
                ...current, poles: toggle(current.poles, pole.id, e.target.checked),
                regions: [], portfolios: [],
              }))}/>
            {pole.name}
          </label>)}
        </div>
        {draft.subsidiaries.length > 0 && !allowedPoles.length && <p className="text-xs text-destructive">Aucun pôle autorisable dans ces entités.</p>}
      </fieldset>
      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">3 — Régions et portefeuilles du périmètre</legend>
        <p className="text-xs text-muted-foreground">Les options sont limitées aux rattachements vérifiés pour chaque paire filiale/pôle sélectionnée. Sans restriction cochée, Global signifie tous ceux du périmètre parent.</p>
        {mapped.isError && <p role="alert" className="text-sm text-destructive">Catalogue métier non installé ou inaccessible. Aucun filtre région ou portefeuille ne peut être enregistré.</p>}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Régions vérifiées</h4>
            {regionChoices.map(value => <label key={value} className="flex items-center gap-2 text-sm">
              <input type="checkbox" disabled={!canEdit} checked={draft.regions.includes(value)}
                onChange={e=>setDraft(d=>({...d,regions:toggle(d.regions,value,e.target.checked),portfolios:[]}))}/>
              {value}
            </label>)}
            {!regionChoices.length && <p className="text-xs text-muted-foreground">Aucune région rattachée à ce périmètre.</p>}
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Portefeuilles vérifiés</h4>
            {portfolioChoices.map(value => <label key={value} className="flex items-center gap-2 text-sm">
              <input type="checkbox" disabled={!canEdit} checked={draft.portfolios.includes(value)}
                onChange={e=>setDraft(d=>({...d,portfolios:toggle(d.portfolios,value,e.target.checked)}))}/>
              {mapped.data?.businesses.find(x=>x.id===value)?.label_snapshot ?? value}
            </label>)}
            {!portfolioChoices.length && <p className="text-xs text-muted-foreground">Aucun portefeuille rattaché à toutes les filiales et tous les pôles sélectionnés.</p>}
          </div>
        </div>
        <div className="space-y-3 rounded-md border bg-muted/20 p-3">
          <p className="text-sm font-semibold">Administrer les rattachements métier</p>
          <p className="text-xs text-muted-foreground">Créer une relation vérifiée filiale + pôle + région ou portefeuille existant ; aucun nouveau portefeuille commercial n’est créé.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <select className="h-10 rounded border bg-background px-2 text-sm" aria-label="Filiale du rattachement"
              value={mappingSubsidiary} onChange={e=>{setMappingSubsidiary(e.target.value);setMappingPole('');}}
              disabled={!isSuperAdmin||mappingSaving}>
              <option value="">Filiale BIB</option>
              {entities.map(entity=><option key={entity} value={entity}>{entity}</option>)}
            </select>
            <select className="h-10 rounded border bg-background px-2 text-sm" aria-label="Pôle du rattachement"
              value={mappingPole} onChange={e=>setMappingPole(e.target.value)}
              disabled={!mappingSubsidiary||!isSuperAdmin||mappingSaving}>
              <option value="">Pôle rattaché</option>
              {allPoles.filter(pole=>(org.data??[]).some(profile =>
                profile.subsidiary===mappingSubsidiary && (profile.poles??[]).includes(pole.id)))
                .map(pole=><option key={pole.id} value={pole.id}>{pole.name}</option>)}
            </select>
          </div>
          <Input aria-label="Motif de rattachement" value={mappingReason}
            onChange={e=>setMappingReason(e.target.value)} placeholder="Motif vérifiable (8 caractères minimum)" />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex gap-2">
              <Input aria-label="Code région" value={regionDraft} onChange={e=>setRegionDraft(e.target.value)}
                placeholder="Code région officiellement vérifié" />
              <Button type="button" variant="outline" disabled={!mappingPole||!regionDraft.trim()||mappingReason.trim().length<8||mappingSaving||mapped.isError}
                onClick={()=>void createMapping('region',regionDraft.trim())}>Rattacher</Button>
            </div>
            <div className="flex gap-2">
              <select aria-label="Portefeuille existant" className="h-10 min-w-0 flex-1 rounded border bg-background px-2 text-sm"
                value={portfolioDraft} onChange={e=>setPortfolioDraft(e.target.value)}>
                <option value="">Portefeuille actif du pôle</option>
                {sourcePortfolios.map(item=><option key={item.id} value={item.id}>{item.label_snapshot}</option>)}
              </select>
              <Button type="button" variant="outline" disabled={!mappingPole||!portfolioDraft||mappingReason.trim().length<8||mappingSaving||mapped.isError}
                onClick={()=>void createMapping('portfolio',portfolioDraft)}>Rattacher</Button>
            </div>
          </div>
        </div>
      </fieldset>
      <fieldset disabled={!canEdit || !draft.subsidiaries.length} className="rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">4 — Propriété des enregistrements</legend>
        <div className="space-y-3 text-sm">
          <label className="flex items-center gap-3">
            <input type="radio" name="record-range" checked={!draft.ownRecords}
              onChange={() => setDraft(current => ({ ...current, ownRecords: false }))}/>
            <span><strong>Global dans le périmètre actuel</strong> — tous les dossiers des filiales, pôles et sous-périmètres sélectionnés, selon les droits du rôle</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="radio" name="record-range" checked={draft.ownRecords}
              onChange={() => setDraft(current => ({ ...current, ownRecords: true }))}/>
            <span><strong>Mes enregistrements</strong> — uniquement les dossiers du collaborateur à l’intérieur du périmètre actuel</span>
          </label>
        </div>
      </fieldset>
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-sm font-medium">Prévisualisation logique (intersection)</p>
        <p className="mt-2 text-sm">{describeHierarchicalScope(draft)}</p>
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="h-4 w-4" />Prévisualisation uniquement. Les APIs métier doivent appliquer ces restrictions côté serveur avant activation.</p>
      </div>
      <label className="block space-y-2 text-sm">
        <span>Motif de modification (journalisé)</span>
        <Input value={reason} onChange={e => setReason(e.target.value)} disabled={!canEdit}
          placeholder="Décrivez le besoin métier et l'autorisation obtenue"/>
      </label>
      <div className="flex justify-end"><Button disabled={!canEdit || !valid || reason.trim().length < 8} onClick={() => void save()}>
        <Save className="mr-2 h-4 w-4"/>Enregistrer le brouillon hiérarchique
      </Button></div>
    </CardContent>
  </Card>;
}
