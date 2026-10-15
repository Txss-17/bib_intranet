import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
Scale,
Clock,
CheckCircle2,
XCircle,
AlertTriangle,
FileText,
Plus,
History,
Loader2,
CalendarClock,
RefreshCw,
} from 'lucide-react';

import {
Card,
CardContent,
CardDescription,
CardHeader,
CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
Dialog,
DialogContent,
DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle,
} from '@/components/ui/dialog';
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from '@/components/ui/select';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsLeadership } from '@/hooks/useDirectionContent';
import { toast } from 'sonner';

type DecisionStatus = 'pending' | 'approved' | 'refused' | 'deferred';
type DecisionPriority = 'low' | 'medium' | 'high' | 'critical';

type Decision = {
id: string;
title: string;
description: string;
category: string;
priority: DecisionPriority;
impact: string | null;
recommendation: string | null;
status: DecisionStatus;
decision_notes: string | null;
defer_until: string | null;
submitted_by: string;
submitted_by_name: string | null;
decided_by: string | null;
decided_at: string | null;
created_at: string;
updated_at: string;
};

type DecisionHistory = {
id: string;
decision_id: string;
event_type: string;
old_status: string | null;
new_status: string | null;
notes: string | null;
actor_id: string | null;
created_at: string;
};

type DecisionDraft = {
title: string;
description: string;
category: string;
priority: DecisionPriority;
impact: string;
recommendation: string;
};

const emptyDraft: DecisionDraft = {
title: '',
description: '',
category: 'general',
priority: 'medium',
impact: '',
recommendation: '',
};

const statusLabels: Record<DecisionStatus, string> = {
pending: 'En attente',
approved: 'Approuvée',
refused: 'Refusée',
deferred: 'Reportée',
};

const priorityLabels: Record<DecisionPriority, string> = {
low: 'Basse',
medium: 'Moyenne',
high: 'Haute',
critical: 'Critique',
};

const categoryLabels: Record<string, string> = {
general: 'Générale',
finance: 'Finance',
supplier: 'Fournisseurs',
operations: 'Opérations',
technology: 'Technologie',
marketing: 'Marketing',
human_resources: 'Ressources humaines',
strategy: 'Stratégie',
other: 'Autre',
};

const statusVariant = (status: DecisionStatus) => {
if (status === 'approved') return 'default' as const;
if (status === 'refused') return 'destructive' as const;
return 'secondary' as const;
};

const priorityVariant = (priority: DecisionPriority) => {
if (priority === 'critical' || priority === 'high') return 'destructive' as const;
if (priority === 'medium') return 'secondary' as const;
return 'outline' as const;
};

const formatDate = (value: string | null | undefined) => {
if (!value) return '—';

const date = new Date(value);
if (Number.isNaN(date.getTime())) return value;

return date.toLocaleString('fr-FR', {
dateStyle: 'medium',
timeStyle: value.includes('T') ? 'short' : undefined,
});
};

const errorMessage = (error: unknown) =>
error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';

const DecisionArbitrage = () => {
const queryClient = useQueryClient();
const { user, profile } = useAuth();
const { data: canDecide = false } = useIsLeadership();

const [createOpen, setCreateOpen] = useState(false);
const [reviewOpen, setReviewOpen] = useState(false);
const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
const [draft, setDraft] = useState<DecisionDraft>(emptyDraft);
const [decisionNotes, setDecisionNotes] = useState('');
const [deferUntil, setDeferUntil] = useState('');
const [statusFilter, setStatusFilter] = useState('all');
const [priorityFilter, setPriorityFilter] = useState('all');
const [search, setSearch] = useState('');

const db = supabase as any;

const decisionsQuery = useQuery({
queryKey: ['direction-decisions'],
queryFn: async (): Promise<Decision[]> => {
const { data, error } = await db
.from('direction_decisions')
.select('*')
.order('created_at', { ascending: false });

```
  if (error) throw error;
  return (data ?? []) as Decision[];
},
refetchInterval: 60_000,
```

});

const historyQuery = useQuery({
queryKey: ['direction-decision-history'],
queryFn: async (): Promise<DecisionHistory[]> => {
const { data, error } = await db
.from('direction_decision_history')
.select('*')
.order('created_at', { ascending: false });

```
  if (error) throw error;
  return (data ?? []) as DecisionHistory[];
},
```

});

const decisions = decisionsQuery.data ?? [];
const history = historyQuery.data ?? [];

const filteredDecisions = useMemo(() => {
const term = search.trim().toLocaleLowerCase('fr');

```
return decisions.filter((decision) => {
  if (statusFilter !== 'all' && decision.status !== statusFilter) return false;
  if (priorityFilter !== 'all' && decision.priority !== priorityFilter) return false;

  if (!term) return true;

  return [
    decision.title,
    decision.description,
    decision.submitted_by_name ?? '',
    categoryLabels[decision.category] ?? decision.category,
  ].some((value) => value.toLocaleLowerCase('fr').includes(term));
});
```

}, [decisions, search, statusFilter, priorityFilter]);

const stats = useMemo(() => ({
pending: decisions.filter((d) => d.status === 'pending').length,
urgent: decisions.filter(
(d) => d.status === 'pending' && ['high', 'critical'].includes(d.priority),
).length,
approved: decisions.filter((d) => {
if (d.status !== 'approved' || !d.decided_at) return false;
const date = new Date(d.decided_at);
const now = new Date();
return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}).length,
refused: decisions.filter((d) => {
if (d.status !== 'refused' || !d.decided_at) return false;
const date = new Date(d.decided_at);
const now = new Date();
return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}).length,
}), [decisions]);

const createMutation = useMutation({
mutationFn: async (payload: DecisionDraft) => {
if (!user?.id) throw new Error('Vous devez être connecté pour soumettre une décision.');

```
  const submittedByName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(' ')
    || profile?.email
    || user.email
    || 'Collaborateur';

  const { error } = await db.from('direction_decisions').insert({
    title: payload.title.trim(),
    description: payload.description.trim(),
    category: payload.category,
    priority: payload.priority,
    impact: payload.impact.trim() || null,
    recommendation: payload.recommendation.trim() || null,
    status: 'pending',
    submitted_by: user.id,
    submitted_by_name: submittedByName,
  });

  if (error) throw error;
},
onSuccess: async () => {
  await queryClient.invalidateQueries({ queryKey: ['direction-decisions'] });
  await queryClient.invalidateQueries({ queryKey: ['direction-decision-history'] });
  toast.success('Décision soumise.');
  setCreateOpen(false);
  setDraft(emptyDraft);
},
onError: (error) => toast.error(`Création impossible : ${errorMessage(error)}`),
```

});

const decisionMutation = useMutation({
mutationFn: async ({
decision,
status,
notes,
deferDate,
}: {
decision: Decision;
status: DecisionStatus;
notes: string;
deferDate: string;
}) => {
if (!canDecide) {
throw new Error('Vous ne disposez pas des droits d’arbitrage.');
}

```
  if (status === 'refused' && !notes.trim()) {
    throw new Error('Motivez le refus dans les notes de décision.');
  }

  if (status === 'deferred' && !deferDate) {
    throw new Error('Choisissez une date de réexamen pour reporter cette décision.');
  }

  const updates: Record<string, unknown> = {
    status,
    decision_notes: notes.trim() || null,
    defer_until: status === 'deferred' ? deferDate : null,
  };

  const { error } = await db
    .from('direction_decisions')
    .update(updates)
    .eq('id', decision.id)
    .eq('status', decision.status);

  if (error) throw error;
},
onSuccess: async () => {
  await queryClient.invalidateQueries({ queryKey: ['direction-decisions'] });
  await queryClient.invalidateQueries({ queryKey: ['direction-decision-history'] });
  toast.success('Arbitrage enregistré.');
  setReviewOpen(false);
  setSelectedDecision(null);
  setDecisionNotes('');
  setDeferUntil('');
},
onError: (error) => toast.error(`Arbitrage impossible : ${errorMessage(error)}`),
```

});

const openReview = (decision: Decision) => {
setSelectedDecision(decision);
setDecisionNotes(decision.decision_notes ?? '');
setDeferUntil(decision.defer_until ?? '');
setReviewOpen(true);
};

const submitDecision = (status: DecisionStatus) => {
if (!selectedDecision) return;

```
decisionMutation.mutate({
  decision: selectedDecision,
  status,
  notes: decisionNotes,
  deferDate: deferUntil,
});
```

};

const submitDraft = () => {
if (!draft.title.trim() || !draft.description.trim()) {
toast.error('Le titre et la description sont obligatoires.');
return;
}

```
createMutation.mutate(draft);
```

};

const selectedHistory = selectedDecision
? history.filter((item) => item.decision_id === selectedDecision.id)
: [];

return ( <div className="space-y-6 p-4 md:p-6"> <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"> <div> <h1 className="flex items-center gap-3 text-2xl font-bold md:text-3xl"> <Scale className="h-8 w-8 text-primary" />
Arbitrage des décisions </h1> <p className="mt-1 text-muted-foreground">
Soumission, examen et traçabilité des décisions de la Direction. </p> </div>

```
    <Button onClick={() => setCreateOpen(true)}>
      <Plus className="mr-2 h-4 w-4" />
      Soumettre une décision
    </Button>
  </div>

  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Clock className="h-7 w-7 text-yellow-500" />
        <div>
          <p className="text-2xl font-bold">{stats.pending}</p>
          <p className="text-sm text-muted-foreground">En attente</p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <AlertTriangle className="h-7 w-7 text-destructive" />
        <div>
          <p className="text-2xl font-bold">{stats.urgent}</p>
          <p className="text-sm text-muted-foreground">Prioritaires</p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <CheckCircle2 className="h-7 w-7 text-emerald-500" />
        <div>
          <p className="text-2xl font-bold">{stats.approved}</p>
          <p className="text-sm text-muted-foreground">Approuvées ce mois</p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <XCircle className="h-7 w-7 text-muted-foreground" />
        <div>
          <p className="text-2xl font-bold">{stats.refused}</p>
          <p className="text-sm text-muted-foreground">Refusées ce mois</p>
        </div>
      </CardContent>
    </Card>
  </div>

  <Card>
    <CardHeader>
      <CardTitle>Registre des décisions</CardTitle>
      <CardDescription>
        Les compteurs sont calculés à partir des enregistrements accessibles dans Supabase.
      </CardDescription>
      <div className="grid grid-cols-1 gap-3 pt-3 md:grid-cols-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une décision…"
          aria-label="Rechercher une décision"
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="approved">Approuvées</SelectItem>
            <SelectItem value="refused">Refusées</SelectItem>
            <SelectItem value="deferred">Reportées</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Toutes les priorités" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les priorités</SelectItem>
            <SelectItem value="critical">Critique</SelectItem>
            <SelectItem value="high">Haute</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="low">Basse</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardHeader>

    <CardContent className="space-y-4">
      {decisionsQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : decisionsQuery.isError ? (
        <div className="space-y-3 rounded-lg border border-destructive/30 p-5 text-sm">
          <p className="font-medium text-destructive">Impossible de charger les décisions.</p>
          <p className="text-muted-foreground">{errorMessage(decisionsQuery.error)}</p>
          <Button variant="outline" onClick={() => decisionsQuery.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      ) : filteredDecisions.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Aucune décision à afficher</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Modifiez les filtres ou soumettez une nouvelle décision.
          </p>
        </div>
      ) : (
        filteredDecisions.map((decision) => (
          <div key={decision.id} className="rounded-lg border p-4 transition-colors hover:bg-muted/20">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{decision.title}</h3>
                  <Badge variant={statusVariant(decision.status)}>
                    {statusLabels[decision.status]}
                  </Badge>
                  <Badge variant={priorityVariant(decision.priority)}>
                    {priorityLabels[decision.priority]}
                  </Badge>
                </div>

                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {decision.description}
                </p>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Catégorie : {categoryLabels[decision.category] ?? decision.category}</span>
                  <span>Soumise par : {decision.submitted_by_name || 'Collaborateur'}</span>
                  <span>Créée le : {formatDate(decision.created_at)}</span>
                  {decision.defer_until && (
                    <span>Réexamen prévu : {formatDate(decision.defer_until)}</span>
                  )}
                </div>
              </div>

              <Button variant="outline" onClick={() => openReview(decision)}>
                Examiner
              </Button>
            </div>
          </div>
        ))
      )}
    </CardContent>
  </Card>

  <Dialog open={createOpen} onOpenChange={setCreateOpen}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Soumettre une décision</DialogTitle>
        <DialogDescription>
          Décrivez l’arbitrage demandé. La demande sera enregistrée avec votre identité.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="decision-title">Titre *</Label>
          <Input
            id="decision-title"
            value={draft.title}
            maxLength={180}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Ex. : Validation d’un investissement"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select
              value={draft.category}
              onValueChange={(value) => setDraft({ ...draft, category: value })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Priorité</Label>
            <Select
              value={draft.priority}
              onValueChange={(value: DecisionPriority) => setDraft({ ...draft, priority: value })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Basse</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="decision-description">Contexte et justification *</Label>
          <Textarea
            id="decision-description"
            rows={4}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Présentez la situation, le besoin et les éléments utiles à l'arbitrage."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="decision-impact">Impact attendu</Label>
          <Textarea
            id="decision-impact"
            rows={2}
            value={draft.impact}
            onChange={(e) => setDraft({ ...draft, impact: e.target.value })}
            placeholder="Impact financier, opérationnel, humain ou stratégique."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="decision-recommendation">Recommandation du demandeur</Label>
          <Textarea
            id="decision-recommendation"
            rows={2}
            value={draft.recommendation}
            onChange={(e) => setDraft({ ...draft, recommendation: e.target.value })}
            placeholder="Décision recommandée et conditions éventuelles."
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setCreateOpen(false)}>
          Annuler
        </Button>
        <Button
          onClick={submitDraft}
          disabled={createMutation.isPending || !draft.title.trim() || !draft.description.trim()}
        >
          {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Soumettre
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog
    open={reviewOpen}
    onOpenChange={(open) => {
      setReviewOpen(open);
      if (!open) {
        setSelectedDecision(null);
        setDecisionNotes('');
        setDeferUntil('');
      }
    }}
  >
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:ma
