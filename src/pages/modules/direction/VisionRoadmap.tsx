import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Target, Calendar, CheckCircle2, Clock, Milestone, Pencil, Plus, Trash2, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  RoadmapItem, useIsLeadership, useRoadmapActions, useRoadmapHistory, useRoadmapItems,
} from '@/hooks/useDirectionContent';

const MILESTONE_STATUS: Record<string, string> = { planned: 'Planifié', in_progress: 'En cours', completed: 'Terminé' };
const PRIORITY_STATUS: Record<string, string> = { on_track: 'On track', at_risk: 'At risk' };
const ACTION_LABELS: Record<string, string> = { create: 'Création', update: 'Modification', delete: 'Suppression' };
const FIELD_LABELS: Record<string, string> = {
  title: 'Titre', phase: 'Période', start_date: 'Début', end_date: 'Fin', status: 'Statut', progress: 'Progression', weight: 'Poids', objectives: 'Objectifs',
};

type ObjDraft = { name: string; completed: boolean; start_date: string; end_date: string };
type Draft = { id?: string; kind: 'milestone' | 'priority'; title: string; phase: string; start_date: string; end_date: string; status: string; progress: number; weight: number; objectives: ObjDraft[] };

const fmtD = (d?: string | null) => (d ? format(new Date(d), 'dd MMM yyyy', { locale: fr }) : '');
const period = (a?: string | null, b?: string | null) => (a || b ? `${fmtD(a) || '…'} → ${fmtD(b) || '…'}` : '');

const toDraft = (i: RoadmapItem): Draft => ({
  id: i.id, kind: i.kind, title: i.title, phase: i.phase ?? '', start_date: i.start_date ?? '', end_date: i.end_date ?? '',
  status: i.status, progress: i.progress, weight: i.weight,
  objectives: i.objectives.map((o) => ({ name: o.name, completed: !!o.completed, start_date: o.start_date ?? '', end_date: o.end_date ?? '' })),
});

const changedFields = (o: any, n: any) =>
  Object.keys(FIELD_LABELS).filter((k) => JSON.stringify(o?.[k]) !== JSON.stringify(n?.[k])).map((k) => FIELD_LABELS[k]);

const VisionRoadmap = () => {
  const { data: items = [], isLoading } = useRoadmapItems();
  const { data: canEdit = false } = useIsLeadership();
  const { data: history = [] } = useRoadmapHistory(canEdit);
  const { save, remove } = useRoadmapActions();
  const [draft, setDraft] = useState<Draft | null>(null);

  const priorities = items.filter((i) => i.kind === 'priority');
  const milestones = items.filter((i) => i.kind === 'milestone');

  const submit = () => {
    if (!draft) return;
    if (draft.start_date && draft.end_date && draft.end_date < draft.start_date) { alert('La date de fin doit suivre la date de début.'); return; }
    const objectives = draft.objectives.filter((o) => o.name.trim())
      .map((o) => ({ name: o.name.trim(), completed: o.completed, start_date: o.start_date || null, end_date: o.end_date || null }));
    const base = { kind: draft.kind, title: draft.title, status: draft.status, start_date: draft.start_date || null, end_date: draft.end_date || null };
    const payload = draft.kind === 'milestone'
      ? { ...base, phase: draft.phase || null, progress: Math.max(0, Math.min(100, Number(draft.progress) || 0)), objectives }
      : { ...base, weight: Number(draft.weight) || 0 };
    const sort_order = draft.id ? undefined : (items.filter((i) => i.kind === draft.kind).length + 1);
    save.mutate({ ...(draft.id ? { id: draft.id } : { sort_order }), ...payload } as any, { onSuccess: () => setDraft(null) });
  };

  const toggleObjective = (item: RoadmapItem, idx: number) => {
    if (!canEdit) return;
    const objectives = item.objectives.map((o, i) => (i === idx ? { ...o, completed: !o.completed } : o));
    save.mutate({ id: item.id, objectives });
  };

  const statusBadge = (s: string) =>
    s === 'in_progress' ? <Badge>En cours</Badge> : s === 'completed' ? <Badge variant="secondary">Terminé</Badge> : <Badge variant="outline">{MILESTONE_STATUS[s] ?? s}</Badge>;

  const EditButtons = ({ item }: { item: RoadmapItem }) =>
    canEdit ? (
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" aria-label="Modifier" onClick={() => setDraft(toDraft(item))}><Pencil className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" aria-label="Supprimer" onClick={() => confirm(`Supprimer « ${item.title} » ?`) && remove.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    ) : null;

  const newDraft = (kind: Draft['kind']): Draft => ({ kind, title: '', phase: '', start_date: '', end_date: '', status: kind === 'milestone' ? 'planned' : 'on_track', progress: 0, weight: 0, objectives: [] });
  const setObj = (i: number, patch: Partial<ObjDraft>) => draft && setDraft({ ...draft, objectives: draft.objectives.map((o, j) => (j === i ? { ...o, ...patch } : o)) });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Target className="h-8 w-8 text-primary" />
          Vision & Roadmap
        </h1>
        <p className="text-muted-foreground mt-1">Stratégie et objectifs BIB</p>
      </div>

      <Tabs defaultValue="roadmap">
        <TabsList>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          {canEdit && <TabsTrigger value="history"><History className="mr-1 h-4 w-4" />Historique</TabsTrigger>}
        </TabsList>

        <TabsContent value="roadmap" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Priorités stratégiques</CardTitle>
              {canEdit && <Button size="sm" variant="outline" onClick={() => setDraft(newDraft('priority'))}><Plus className="mr-1 h-4 w-4" />Priorité</Button>}
            </CardHeader>
            <CardContent>
              {priorities.length === 0 && <p className="text-sm text-muted-foreground">{isLoading ? 'Chargement…' : 'Aucune priorité.'}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {priorities.map((p) => (
                  <div key={p.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-medium">{p.title}</span>
                      <EditButtons item={p} />
                    </div>
                    <Badge variant={p.status === 'at_risk' ? 'destructive' : 'default'}>{PRIORITY_STATUS[p.status] ?? p.status}</Badge>
                    {period(p.start_date, p.end_date) && <p className="mt-1 text-xs text-muted-foreground">{period(p.start_date, p.end_date)}</p>}
                    <div className="text-2xl font-bold mt-2">{p.weight}%</div>
                    <Progress value={p.weight} className="mt-2 h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Milestone className="h-5 w-5" />Roadmap</h2>
              {canEdit && <Button size="sm" variant="outline" onClick={() => setDraft(newDraft('milestone'))}><Plus className="mr-1 h-4 w-4" />Étape</Button>}
            </div>
            {milestones.map((item) => (
              <Card key={item.id} className={item.status === 'in_progress' ? 'border-primary' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center ${item.status === 'in_progress' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{item.title}</h3>
                          {statusBadge(item.status)}
                        </div>
                        <EditButtons item={item} />
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{[item.phase, period(item.start_date, item.end_date)].filter(Boolean).join(' · ')}</p>
                      {item.status !== 'planned' && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-1"><span>Progression</span><span className="font-medium">{item.progress}%</span></div>
                          <Progress value={item.progress} className="h-2" />
                        </div>
                      )}
                      <div className="space-y-2">
                        {item.objectives.map((obj, i) => (
                          <button key={i} type="button" disabled={!canEdit} onClick={() => toggleObjective(item, i)} className="flex items-center gap-2 text-left disabled:cursor-default">
                            {obj.completed ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                            <span className={obj.completed ? 'line-through text-muted-foreground' : ''}>{obj.name}</span>
                            {period(obj.start_date, obj.end_date) && <span className="text-xs text-muted-foreground">({period(obj.start_date, obj.end_date)})</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {canEdit && (
          <TabsContent value="history">
            <Card>
              <CardContent className="p-0">
                {history.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">Aucune modification enregistrée.</p>
                ) : (
                  <ul className="divide-y">
                    {history.map((h) => (
                      <li key={h.id} className="p-4 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{ACTION_LABELS[h.action]}</Badge>
                          <span className="font-medium">{h.item_title}</span>
                          <span className="text-muted-foreground">
                            · {h.performer_name ?? 'Système'} · {format(new Date(h.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                          </span>
                        </div>
                        {h.action === 'update' && (
                          <p className="mt-1 text-xs text-muted-foreground">Champs modifiés : {changedFields(h.old_value, h.new_value).join(', ') || '—'}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? 'Modifier' : 'Ajouter'} {draft?.kind === 'priority' ? 'une priorité' : 'une étape'}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="grid gap-3">
              <div><Label>Titre</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
              <div>
                <Label>Statut</Label>
                <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(draft.kind === 'milestone' ? MILESTONE_STATUS : PRIORITY_STATUS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date de début</Label><Input type="date" value={draft.start_date} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} /></div>
                <div><Label>Date de fin</Label><Input type="date" value={draft.end_date} onChange={(e) => setDraft({ ...draft, end_date: e.target.value })} /></div>
              </div>
              {draft.kind === 'milestone' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Libellé de période</Label><Input value={draft.phase} placeholder="Q1 2027" onChange={(e) => setDraft({ ...draft, phase: e.target.value })} /></div>
                    <div><Label>Progression (%)</Label><Input type="number" min={0} max={100} value={draft.progress} onChange={(e) => setDraft({ ...draft, progress: Number(e.target.value) })} /></div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Objectifs</Label>
                      <Button type="button" size="sm" variant="outline" onClick={() => setDraft({ ...draft, objectives: [...draft.objectives, { name: '', completed: false, start_date: '', end_date: '' }] })}>
                        <Plus className="mr-1 h-4 w-4" />Objectif
                      </Button>
                    </div>
                    {draft.objectives.map((o, i) => (
                      <div key={i} className="space-y-2 rounded-md border p-2">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" aria-label="Atteint" checked={o.completed} onChange={(e) => setObj(i, { completed: e.target.checked })} />
                          <Input value={o.name} placeholder="Intitulé de l'objectif" onChange={(e) => setObj(i, { name: e.target.value })} />
                          <Button type="button" size="icon" variant="ghost" aria-label="Retirer" onClick={() => setDraft({ ...draft, objectives: draft.objectives.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input type="date" aria-label="Début" value={o.start_date} onChange={(e) => setObj(i, { start_date: e.target.value })} />
                          <Input type="date" aria-label="Fin" value={o.end_date} onChange={(e) => setObj(i, { end_date: e.target.value })} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div><Label>Poids (%)</Label><Input type="number" value={draft.weight} onChange={(e) => setDraft({ ...draft, weight: Number(e.target.value) })} /></div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button disabled={!draft?.title || save.isPending} onClick={submit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisionRoadmap;
