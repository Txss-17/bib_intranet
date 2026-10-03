import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import {
  AlertOctagon,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import {
  ESCALATION_SEVERITY_LABELS,
  ESCALATION_STATUS_LABELS,
  type EscalationSeverity,
  type EscalationStatus,
  useWorkEscalations,
  useWorkModuleActions,
} from '@/hooks/useWorkModule';

import { useTaskAssignees } from '@/hooks/useWorkTasks';

const statusVariant = (
  status: EscalationStatus,
): 'default' | 'secondary' | 'outline' => {
  if (status === 'resolved') {
    return 'default';
  }

  if (status === 'acknowledged') {
    return 'secondary';
  }

  return 'outline';
};

const severityVariant = (
  severity: EscalationSeverity,
): 'destructive' | 'outline' => {
  return severity === 'critical' || severity === 'high'
    ? 'destructive'
    : 'outline';
};

export default function SupportEscalations() {
  const {
    data: rows = [],
    isLoading,
  } = useWorkEscalations();

  const {
    data: people = [],
  } = useTaskAssignees();

  const {
    escalations,
  } = useWorkModuleActions();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('open');

  const [createOpen, setCreateOpen] =
    useState(false);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    pole: 'support',
    severity: 'medium',
    assigned_to: '',
  });

  const [edit, setEdit] = useState({
    title: '',
    description: '',
    pole: 'support',
    severity: 'medium',
    assigned_to: '',
    resolution_note: '',
  });

  const selected =
    rows.find((row) => row.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) {
      return;
    }

    setEdit({
      title: selected.title,
      description: selected.description ?? '',
      pole: selected.pole ?? 'support',
      severity: selected.severity,
      assigned_to: selected.assigned_to ?? '',
      resolution_note: selected.resolution_note ?? '',
    });
  }, [selected]);

  const filtered = useMemo(() => {
    const normalizedQuery =
      query.toLowerCase().trim();

    return rows.filter((escalation) => {
      const matchesStatus =
        status === 'all' ||
        (status === 'open'
          ? escalation.status !== 'resolved'
          : escalation.status === status);

      const searchContent = [
        escalation.title,
        escalation.raised_by_name,
        escalation.assigned_name,
        escalation.pole,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesQuery =
        !normalizedQuery ||
        searchContent.includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [rows, query, status]);

  const count = (
    statuses: EscalationStatus[],
  ) =>
    rows.filter((row) =>
      statuses.includes(row.status),
    ).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <AlertOctagon className="h-8 w-8 text-primary" />
            Escalades Support
          </h1>

          <p className="mt-1 text-muted-foreground">
            Points bloquants remontés par le Support et le Customer Success.
          </p>
        </div>

        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle escalade
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              Ouvertes
            </p>

            <p className="text-2xl font-semibold">
              {count(['open'])}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              Prises en charge
            </p>

            <p className="text-2xl font-semibold">
              {count(['acknowledged'])}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              Résolues
            </p>

            <p className="text-2xl font-semibold">
              {count(['resolved'])}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

          <Input
            className="pl-9"
            placeholder="Rechercher une escalade..."
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
          />
        </div>

        <Select
          value={status}
          onValueChange={setStatus}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="open">
              Non résolues
            </SelectItem>

            <SelectItem value="all">
              Toutes
            </SelectItem>

            {Object.entries(
              ESCALATION_STATUS_LABELS,
            ).map(([key, label]) => (
              <SelectItem
                key={key}
                value={key}
              >
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">
              Chargement…
            </p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Aucune escalade.
            </p>
          ) : (
            <ul className="divide-y">
              {filtered.map((escalation) => (
                <li key={escalation.id}>
                  <button
                    className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/50"
                    onClick={() =>
                      setSelectedId(escalation.id)
                    }
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {escalation.title}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {escalation.raised_by_name ?? '—'}

                        {escalation.assigned_name
                          ? ` → ${escalation.assigned_name}`
                          : ''}

                        {escalation.pole
                          ? ` · ${escalation.pole}`
                          : ''}

                        {` · ${format(
                          new Date(escalation.created_at),
                          'dd MMM yyyy',
                          { locale: fr },
                        )}`}
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center gap-2">
                      <Badge
                        variant={severityVariant(
                          escalation.severity,
                        )}
                      >
                        {
                          ESCALATION_SEVERITY_LABELS[
                            escalation.severity
                          ]
                        }
                      </Badge>

                      <Badge
                        variant={statusVariant(
                          escalation.status,
                        )}
                      >
                        {
                          ESCALATION_STATUS_LABELS[
                            escalation.status
                          ]
                        }
                      </Badge>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Nouvelle escalade Support
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div>
              <Label>Titre</Label>

              <Input
                value={form.title}
                onChange={(event) =>
                  setForm({
                    ...form,
                    title: event.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Description</Label>

              <Textarea
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description: event.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Pôle concerné</Label>

                <Input
                  value={form.pole}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      pole: event.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>Gravité</Label>

                <Select
                  value={form.severity}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      severity: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {Object.entries(
                      ESCALATION_SEVERITY_LABELS,
                    ).map(([key, label]) => (
                      <SelectItem
                        key={key}
                        value={key}
                      >
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Assigner à</Label>

              <Select
                value={form.assigned_to}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    assigned_to: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>

                <SelectContent>
                  {people.map((person) => (
                    <SelectItem
                      key={person.id}
                      value={person.id}
                    >
                      {person.first_name}{' '}
                      {person.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              disabled={
                !form.title ||
                escalations.create.isPending
              }
              onClick={() =>
                escalations.create.mutate(
                  {
                    title: form.title,
                    description:
                      form.description || null,
                    pole: form.pole || 'support',
                    severity: form.severity,
                    assigned_to:
                      form.assigned_to || null,
                  },
                  {
                    onSuccess: () => {
                      setCreateOpen(false);

                      setForm({
                        title: '',
                        description: '',
                        pole: 'support',
                        severity: 'medium',
                        assigned_to: '',
                      });
                    },
                  },
                )
              }
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
          }
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {selected.title}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-4 space-y-5 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={statusVariant(
                      selected.status,
                    )}
                  >
                    {
                      ESCALATION_STATUS_LABELS[
                        selected.status
                      ]
                    }
                  </Badge>

                  <Badge
                    variant={severityVariant(
                      selected.severity,
                    )}
                  >
                    {
                      ESCALATION_SEVERITY_LABELS[
                        selected.severity
                      ]
                    }
                  </Badge>
                </div>

                <div className="grid gap-3 rounded-md border p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Modifier l'escalade
                  </p>

                  <div>
                    <Label>Titre</Label>

                    <Input
                      value={edit.title}
                      onChange={(event) =>
                        setEdit({
                          ...edit,
                          title: event.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Description</Label>

                    <Textarea
                      value={edit.description}
                      onChange={(event) =>
                        setEdit({
                          ...edit,
                          description:
                            event.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Pôle</Label>

                      <Input
                        value={edit.pole}
                        onChange={(event) =>
                          setEdit({
                            ...edit,
                            pole: event.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label>Gravité</Label>

                      <Select
                        value={edit.severity}
                        onValueChange={(value) =>
                          setEdit({
                            ...edit,
                            severity: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          {Object.entries(
                            ESCALATION_SEVERITY_LABELS,
                          ).map(
                            ([key, label]) => (
                              <SelectItem
                                key={key}
                                value={key}
                              >
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Assignée à</Label>

                    <Select
                      value={
                        edit.assigned_to || 'none'
                      }
                      onValueChange={(value) =>
                        setEdit({
                          ...edit,
                          assigned_to:
                            value === 'none'
                              ? ''
                              : value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="none">
                          Personne
                        </SelectItem>

                        {people.map((person) => (
                          <SelectItem
                            key={person.id}
                            value={person.id}
                          >
                            {person.first_name}{' '}
                            {person.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>
                      Note de résolution
                    </Label>

                    <Textarea
                      value={edit.resolution_note}
                      placeholder="Obligatoire pour passer en « Résolue »"
                      onChange={(event) =>
                        setEdit({
                          ...edit,
                          resolution_note:
                            event.target.value,
                        })
                      }
                    />
                  </div>

                  <Button
                    size="sm"
                    disabled={
                      !edit.title ||
                      escalations.update.isPending
                    }
                    onClick={() =>
                      escalations.update.mutate({
                        id: selected.id,
                        title: edit.title,
                        description:
                          edit.description || null,
                        pole:
                          edit.pole || 'support',
                        severity: edit.severity,
                        assigned_to:
                          edit.assigned_to || null,
                        resolution_note:
                          edit.resolution_note ||
                          null,
                      })
                    }
                  >
                    Enregistrer les modifications
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-md border p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Remontée par
                    </p>

                    <p className="font-medium">
                      {selected.raised_by_name ??
                        '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Résolue le
                    </p>

                    <p className="font-medium">
                      {selected.resolved_at
                        ? format(
                            new Date(
                              selected.resolved_at,
                            ),
                            'dd MMM yyyy HH:mm',
                            { locale: fr },
                          )
                        : '—'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selected.status === 'open' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        escalations.update.isPending
                      }
                      onClick={() =>
                        escalations.update.mutate({
                          id: selected.id,
                          status: 'acknowledged',
                        })
                      }
                    >
                      → Prise en charge
                    </Button>
                  )}

                  {selected.status !== 'resolved' && (
                    <Button
                      size="sm"
                      disabled={
                        !edit.resolution_note.trim() ||
                        escalations.update.isPending
                      }
                      onClick={() =>
                        escalations.update.mutate({
                          id: selected.id,
                          status: 'resolved',
                          resolved_at:
                            new Date().toISOString(),
                          resolution_note:
                            edit.resolution_note.trim(),
                        })
                      }
                    >
                      → Résolue
                    </Button>
                  )}

                  {selected.status === 'resolved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        escalations.update.isPending
                      }
                      onClick={() =>
                        escalations.update.mutate({
                          id: selected.id,
                          status: 'open',
                          resolved_at: null,
                        })
                      }
                    >
                      Rouvrir
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={
                      escalations.remove.isPending
                    }
                    onClick={() =>
                      escalations.remove.mutate(
                        selected.id,
                        {
                          onSuccess: () =>
                            setSelectedId(null),
                        },
                      )
                    }
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}