import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Plus,
  Send,
  Loader2,
  History,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Wrench,
  UserPlus,
  ShieldCheck,
  Code2,
  Rocket,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useAuth } from '@/hooks/useAuth';
import { poles as allPoles } from '@/data/poles';
import {
  PRIORITIES,
  PRODUCT_REQUEST_CATEGORIES,
  PRODUCT_REQUEST_STATUS,
  ProductRequest,
  ProductRequestStatus,
  useProductRequestActions,
  useProductRequestThread,
  useProductRequests,
} from '@/hooks/useTechRequests';
import {
  HR_STATUS,
  useHrEmployeeRequests,
  useHrOnboardingActions,
} from '@/hooks/useHrOnboarding';

const poleLabel = (id?: string | null) =>
  allPoles.find((pole) => pole.id === id)?.shortName ?? id ?? '—';

const isProductPole = (pole?: string | null) => pole === 'product';

const isSecurityPole = (pole?: string | null) => pole === 'security';

function NewRequestDialog({ defaultPole }: { defaultPole: string }) {
  const [open, setOpen] = useState(false);
  const { create } = useProductRequestActions();

  const [form, setForm] = useState({
    title: '',
    description: '',
    requester_pole: defaultPole,
    category: 'evolution',
    priority: 'medium',
    target_date: '',
  });

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim()) return;

    await create.mutateAsync({
      ...form,
      target_date: form.target_date || null,
    });

    setOpen(false);

    setForm({
      title: '',
      description: '',
      requester_pole: defaultPole,
      category: 'evolution',
      priority: 'medium',
      target_date: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Nouvelle demande
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Demande Produit & Engineering</DialogTitle>

          <DialogDescription>
            Décrivez le besoin de votre pôle. Le pôle Produit & Engineering
            analyse, priorise et suit la demande jusqu’à sa livraison.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="product-request-title">Objet</Label>

            <Input
              id="product-request-title"
              value={form.title}
              onChange={(event) =>
                setForm({
                  ...form,
                  title: event.target.value,
                })
              }
              placeholder="Ex. ajouter un export CSV des réassorts"
            />
          </div>

          <div>
            <Label htmlFor="product-request-description">
              Description & impact métier
            </Label>

            <Textarea
              id="product-request-description"
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm({
                  ...form,
                  description: event.target.value,
                })
              }
              placeholder="Décrivez le besoin, le problème rencontré et son impact métier."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Pôle demandeur</Label>

              <Select
                value={form.requester_pole}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    requester_pole: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {allPoles.map((pole) => (
                    <SelectItem key={pole.id} value={pole.id}>
                      {pole.shortName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Catégorie</Label>

              <Select
                value={form.category}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    category: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {PRODUCT_REQUEST_CATEGORIES.map((category) => (
                    <SelectItem
                      key={category.value}
                      value={category.value}
                    >
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priorité</Label>

              <Select
                value={form.priority}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    priority: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem
                      key={priority.value}
                      value={priority.value}
                    >
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="product-request-date">
                Échéance souhaitée
              </Label>

              <Input
                id="product-request-date"
                type="date"
                value={form.target_date}
                onChange={(event) =>
                  setForm({
                    ...form,
                    target_date: event.target.value,
                  })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
          >
            Annuler
          </Button>

          <Button
            onClick={submit}
            disabled={
              create.isPending ||
              !form.title.trim() ||
              !form.description.trim()
            }
          >
            {create.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-4 w-4" />
            )}

            Transmettre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestDetail({
  request,
  canManage,
  onClose,
}: {
  request: ProductRequest;
  canManage: boolean;
  onClose: () => void;
}) {
  const { comments, events } = useProductRequestThread(request.id);
  const { changeStatus, comment } = useProductRequestActions();

  const [body, setBody] = useState('');
  const [reason, setReason] = useState('');

  const act = (status: ProductRequestStatus) => {
    changeStatus.mutate({
      request,
      status,
      reason: reason || undefined,
    });
  };

  const statusConfig = PRODUCT_REQUEST_STATUS[request.status];

  return (
    <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          {request.reference}

          <Badge variant={statusConfig.variant}>
            {statusConfig.label}
          </Badge>
        </SheetTitle>

        <SheetDescription>
          {poleLabel(request.requester_pole)} ·{' '}
          {request.requester_name ?? '—'} ·{' '}
          {format(
            new Date(request.created_at),
            'dd MMM yyyy',
            { locale: fr },
          )}
        </SheetDescription>
      </SheetHeader>

      <div className="mt-4 space-y-4">
        <div>
          <p className="text-sm font-semibold">
            {request.title}
          </p>

          <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
            {request.description}
          </p>
        </div>

        {request.decision_reason && (
          <p className="rounded-md border border-border p-3 text-xs text-muted-foreground">
            Motif de décision : {request.decision_reason}
          </p>
        )}

        {canManage && (
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />

              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pilotage Produit & Engineering
              </p>
            </div>

            <Textarea
              className="mt-2"
              rows={2}
              placeholder="Motif / précision — obligatoire pour un refus"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />

            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => act('under_review')}
              >
                En revue
              </Button>

              <Button
                size="sm"
                onClick={() => act('accepted')}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Valider
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => act('in_progress')}
              >
                <Wrench className="mr-1.5 h-3.5 w-3.5" />
                En cours
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => act('done')}
              >
                <Rocket className="mr-1.5 h-3.5 w-3.5" />
                Livrée
              </Button>

              <Button
                size="sm"
                variant="destructive"
                disabled={!reason.trim()}
                onClick={() => act('rejected')}
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Refuser
              </Button>
            </div>
          </div>
        )}

        <Separator />

        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            Commentaires
          </p>

          <div className="mt-2 space-y-2">
            {(comments.data ?? []).map((commentItem) => (
              <div
                key={commentItem.id}
                className="rounded-md border border-border p-2.5"
              >
                <p className="text-xs font-medium">
                  {commentItem.author_name}

                  <span className="text-muted-foreground">
                    {' '}
                    · {poleLabel(commentItem.author_pole)} ·{' '}
                    {format(
                      new Date(commentItem.created_at),
                      'dd/MM HH:mm',
                    )}
                  </span>
                </p>

                <p className="mt-1 whitespace-pre-line text-sm">
                  {commentItem.body}
                </p>
              </div>
            ))}

            {!comments.data?.length && (
              <p className="text-sm text-muted-foreground">
                Aucun commentaire.
              </p>
            )}
          </div>

          <div className="mt-2 flex gap-2">
            <Input
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Écrire un commentaire…"
            />

            <Button
              size="sm"
              disabled={!body.trim() || comment.isPending}
              onClick={async () => {
                await comment.mutateAsync({
                  requestId: request.id,
                  body,
                });

                setBody('');
              }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <History className="h-3.5 w-3.5" />
            Historique
          </p>

          <div className="mt-2 space-y-2">
            {(events.data ?? []).map((event) => (
              <div
                key={event.id}
                className="text-xs"
              >
                <span className="text-muted-foreground">
                  {format(
                    new Date(event.created_at),
                    'dd/MM HH:mm',
                  )}{' '}
                  ·{' '}
                </span>

                <span className="font-medium">
                  {event.actor_name}
                </span>

                {' — '}
                {event.action}

                {event.note && (
                  <span className="text-muted-foreground">
                    {' '}
                    ({event.note})
                  </span>
                )}
              </div>
            ))}

            {!events.data?.length && (
              <p className="text-sm text-muted-foreground">
                Aucun événement.
              </p>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full"
          onClick={onClose}
        >
          Fermer
        </Button>
      </div>
    </SheetContent>
  );
}

export default function ProductStudio() {
  const { profile } = useAuth();

  const profilePoles = profile?.poles ?? [];

  const canManageProduct =
    profilePoles.includes('product') ||
    profilePoles.includes('direction');

  const canManageSecurity =
    profilePoles.includes('security') ||
    profilePoles.includes('direction');

  const canManageRequests =
    canManageProduct || canManageSecurity;

  const { data: requests = [], isLoading } =
    useProductRequests();

  const hrRequests = useHrEmployeeRequests();
  const { provisionAccount } =
    useHrOnboardingActions();

  const [selected, setSelected] =
    useState<ProductRequest | null>(null);

  const [statusFilter, setStatusFilter] =
    useState<string>('all');

  const [poleFilter, setPoleFilter] =
    useState<string>('all');

  const [search, setSearch] =
    useState('');

  const filtered = useMemo(
    () =>
      requests.filter(
        (request) =>
          (statusFilter === 'all' ||
            request.status === statusFilter) &&
          (poleFilter === 'all' ||
            request.requester_pole === poleFilter) &&
          (!search ||
            `${request.reference} ${request.title}`
              .toLowerCase()
              .includes(search.toLowerCase())),
      ),
    [
      requests,
      statusFilter,
      poleFilter,
      search,
    ],
  );

  const kpis = useMemo(
    () => ({
      total: requests.length,

      open: requests.filter((request) =>
        ['submitted', 'under_review'].includes(
          request.status,
        ),
      ).length,

      running: requests.filter((request) =>
        ['accepted', 'in_progress'].includes(
          request.status,
        ),
      ).length,

      done: requests.filter(
        (request) => request.status === 'done',
      ).length,
    }),
    [requests],
  );

  const pendingAccounts =
    (hrRequests.data ?? []).filter(
      (request) => request.status === 'hr_validated',
    );

  const defaultRequesterPole =
    profilePoles.find(
      (pole) =>
        !isProductPole(pole) &&
        !isSecurityPole(pole),
    ) ??
    profilePoles[0] ??
    'ops';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="h-6 w-6 text-primary" />

            <h1 className="text-2xl font-semibold">
              Produit & Engineering
            </h1>
          </div>

          <p className="text-sm text-muted-foreground">
            Centre de demandes inter-pôles : cadrage,
            validation, développement, livraison et historique.
          </p>
        </div>

        <NewRequestDialog
          defaultPole={defaultRequesterPole}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Demandes',
            value: kpis.total,
          },
          {
            label: 'À traiter',
            value: kpis.open,
          },
          {
            label: 'En cours',
            value: kpis.running,
          },
          {
            label: 'Livrées',
            value: kpis.done,
          },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {kpi.label}
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {kpi.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-start gap-3 pt-6">
            <div className="rounded-lg bg-primary/10 p-2">
              <Code2 className="h-5 w-5 text-primary" />
            </div>

            <div>
              <p className="font-semibold">
                Produit & Engineering
              </p>

              <p className="text-sm text-muted-foreground">
                Produit, développement, architecture,
                intégrations et évolutions de la plateforme.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-3 pt-6">
            <div className="rounded-lg bg-primary/10 p-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>

            <div>
              <p className="font-semibold">
                Security & IT
              </p>

              <p className="text-sm text-muted-foreground">
                Accès, infrastructure, sécurité, environnements
                et supervision technique.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">
            Demandes
          </TabsTrigger>

          {canManageRequests && (
            <TabsTrigger value="accounts">
              Comptes à créer
              {pendingAccounts.length
                ? ` (${pendingAccounts.length})`
                : ''}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent
          value="requests"
          className="mt-4"
        >
          <Card>
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  className="max-w-xs"
                  placeholder="Rechercher…"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />

                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">
                      Tous les statuts
                    </SelectItem>

                    {Object.entries(
                      PRODUCT_REQUEST_STATUS,
                    ).map(([key, value]) => (
                      <SelectItem
                        key={key}
                        value={key}
                      >
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={poleFilter}
                  onValueChange={setPoleFilter}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Pôle" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">
                      Tous les pôles
                    </SelectItem>

                    {allPoles.map((pole) => (
                      <SelectItem
                        key={pole.id}
                        value={pole.id}
                      >
                        {pole.shortName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Aucune demande.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Réf.</TableHead>
                      <TableHead>Objet</TableHead>
                      <TableHead>Pôle</TableHead>
                      <TableHead>Priorité</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filtered.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-xs">
                          {request.reference}
                        </TableCell>

                        <TableCell className="max-w-[280px] truncate">
                          {request.title}
                        </TableCell>

                        <TableCell>
                          {poleLabel(
                            request.requester_pole,
                          )}
                        </TableCell>

                        <TableCell className="capitalize">
                          {PRIORITIES.find(
                            (priority) =>
                              priority.value ===
                              request.priority,
                          )?.label ??
                            request.priority}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              PRODUCT_REQUEST_STATUS[
                                request.status
                              ].variant
                            }
                          >
                            {
                              PRODUCT_REQUEST_STATUS[
                                request.status
                              ].label
                            }
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setSelected(request)
                            }
                          >
                            Ouvrir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canManageRequests && (
          <TabsContent
            value="accounts"
            className="mt-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Dossiers validés par les RH
                </CardTitle>

                <CardDescription>
                  Créer le compte, le profil et les accès du
                  collaborateur après validation RH.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {pendingAccounts.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Aucun compte à créer.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Réf.</TableHead>
                        <TableHead>
                          Collaborateur
                        </TableHead>
                        <TableHead>
                          Pôles
                        </TableHead>
                        <TableHead>
                          Rôle
                        </TableHead>
                        <TableHead className="text-right">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {pendingAccounts.map(
                        (request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-mono text-xs">
                              {request.reference}
                            </TableCell>

                            <TableCell>
                              {request.first_name}{' '}
                              {request.last_name}

                              <span className="block text-xs text-muted-foreground">
                                {request.work_email ??
                                  request.personal_email}
                              </span>
                            </TableCell>

                            <TableCell className="text-xs">
                              {(request.poles ?? [])
                                .map(poleLabel)
                                .join(', ') || '—'}
                            </TableCell>

                            <TableCell>
                              <Badge variant="outline">
                                {request.requested_role}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                disabled={
                                  provisionAccount.isPending
                                }
                                onClick={() =>
                                  provisionAccount.mutate(
                                    request,
                                  )
                                }
                              >
                                {provisionAccount.isPending ? (
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                                )}

                                Créer le compte
                              </Button>
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                )}

                <p className="mt-3 text-xs text-muted-foreground">
                  Statuts suivis :{' '}
                  {Object.values(HR_STATUS)
                    .map(
                      (status) => status.label,
                    )
                    .join(' → ')}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Sheet
        open={!!selected}
        onOpenChange={(open) =>
          !open && setSelected(null)
        }
      >
        {selected && (
          <RequestDetail
            request={selected}
            canManage={canManageRequests}
            onClose={() => setSelected(null)}
          />
        )}
      </Sheet>
    </div>
  );
}