import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Activity, AlertOctagon, CheckCircle2, CheckSquare, FolderKanban, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkTasks } from '@/hooks/useWorkTasks';
import { useWorkEscalations, useWorkProjects, useWorkValidations } from '@/hooks/useWorkModule';

interface ActivityItem {
  id: string;
  kind: 'task' | 'project' | 'validation' | 'escalation';
  label: string;
  detail: string;
  date: string;
}

const KIND_META = {
  task: { label: 'Tâche', icon: CheckSquare },
  project: { label: 'Projet', icon: FolderKanban },
  validation: { label: 'Validation', icon: CheckCircle2 },
  escalation: { label: 'Escalade', icon: AlertOctagon },
} as const;

export default function WorkActivities() {
  const { data: tasks = [], isLoading: l1 } = useWorkTasks();
  const { data: projects = [], isLoading: l2 } = useWorkProjects();
  const { data: validations = [], isLoading: l3 } = useWorkValidations();
  const { data: escalations = [], isLoading: l4 } = useWorkEscalations();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<string>('all');

  const items = useMemo<ActivityItem[]>(() => {
    const all: ActivityItem[] = [
      ...tasks.map((t) => ({
        id: `task-${t.id}`,
        kind: 'task' as const,
        label: t.title,
        detail: `${t.assignee_name ?? 'Non assignée'} · ${t.status}`,
        date: t.created_at,
      })),
      ...projects.map((p) => ({
        id: `project-${p.id}`,
        kind: 'project' as const,
        label: p.name,
        detail: `${p.owner_name ?? 'Sans porteur'} · ${p.status}`,
        date: p.created_at,
      })),
      ...validations.map((v) => ({
        id: `validation-${v.id}`,
        kind: 'validation' as const,
        label: v.title,
        detail: `${v.requester_name ?? '—'} → ${v.validator_name ?? '—'} · ${v.status}`,
        date: v.created_at,
      })),
      ...escalations.map((e) => ({
        id: `escalation-${e.id}`,
        kind: 'escalation' as const,
        label: e.title,
        detail: `${e.raised_by_name ?? '—'} · ${e.severity} · ${e.status}`,
        date: e.created_at,
      })),
    ];
    return all.sort((a, b) => b.date.localeCompare(a.date));
  }, [tasks, projects, validations, escalations]);

  const filtered = items.filter(
    (i) =>
      (kind === 'all' || i.kind === kind) &&
      (!q || `${i.label} ${i.detail}`.toLowerCase().includes(q.toLowerCase())),
  );

  const isLoading = l1 || l2 || l3 || l4;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Activity className="h-5 w-5" />
          Activités
        </h1>
        <p className="text-sm text-muted-foreground">
          Fil d'activité du module Travail : tâches, projets, validations et escalades récents.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tout</SelectItem>
            {Object.entries(KIND_META).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Aucune activité.</p>
          ) : (
            <ul className="divide-y">
              {filtered.map((i) => {
                const Icon = KIND_META[i.kind].icon;
                return (
                  <li key={i.id} className="flex items-center gap-3 p-4">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{i.label}</span>
                      <span className="text-xs text-muted-foreground">{i.detail}</span>
                    </span>
                    <Badge variant="outline">{KIND_META[i.kind].label}</Badge>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {format(new Date(i.date), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
