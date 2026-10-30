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
  const entities = useMemo(() => unique((org.data ?? [])
    .map(p => p.subsidiary ?? '').filter(Boolean)), [org.data]);
  const permittedPoles = (subsidiaries: string[]) => {
    if (!subsidiaries.length) return new Set<string>();
    // A role covering multiple subsidiaries can select only poles verified
    // in EACH subsidiary; otherwise one branch would silently be unverified.
    const perSubsidiary = subsidiaries.map(entity => new Set(
      (org.data ?? []).filter(profile => profile.subsidiary === entity)
        .flatMap(profile => profile.poles ?? []),
    ));
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
    return allPoles.filter(pole => permitted.every(values => values.has(pole.id)));
  }, [draft.subsidiaries, org.data]);
  const valid = !!roleId && draft.subsidiaries.length > 0 &&
    draft.poles.every(pole => allowedPoles.some(item => item.id === pole)) &&
    draft.regions.length === 0 && draft.portfolios.length === 0;
  const canEdit = isSuperAdmin && !!roleId && !saving &&
    !org.isError && !stored.isError && !org.isLoading && !stored.isLoading;
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
        <p className="text-xs text-muted-foreground">Sélectionner « Global dans la filiale » ou plusieurs pôles précis. Tous les choix restent limités aux entités BIB parentes.</p>
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
        <p className="text-sm text-muted-foreground">
          Le rattachement doit respecter à la fois l’entité BIB et le ou les pôles choisis.
          La base ne fournit pas encore de relation filiale → région ou filiale → portefeuille
          permettant une sélection fiable. Ces deux filtres sont donc indisponibles pour les nouvelles politiques.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-2 text-sm">
            <span>Régions de l’entité / du pôle</span>
            <Input disabled value="" placeholder="Aucune région vérifiée pour cette sélection" />
          </label>
          <label className="block space-y-2 text-sm">
            <span>Portefeuilles de l’entité / du pôle</span>
            <Input disabled value="" placeholder="Rattachement aux filiales à compléter" />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Dans cette préparation, « tous » désigne les régions et portefeuilles du parent sélectionné,
          pas ceux des autres filiales ou pôles. Leur contrôle réel devra être appliqué par les APIs métier.
        </p>
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
