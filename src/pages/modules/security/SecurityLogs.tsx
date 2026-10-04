import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useSecurityAuthLogs,
  useProductEdgeFunctionLogs,
} from '@/hooks/useTechData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Activity,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';

type AuthLog = {
  id: string;
  created_at: string;
  event_type: string;
  user_email?: string | null;
  ip_address?: string | null;
  app_origin?: string | null;
  user_agent?: string | null;
};

type AuditLog = {
  id: string;
  created_at: string;
  user_name?: string | null;
  action: string;
  resource: string;
  pole_id?: string | null;
  ip_address?: string | null;
};

type EdgeFunctionLog = {
  id: string;
  created_at: string;
  function_name: string;
  method: string;
  status_code: number;
  duration_ms?: number | null;
  error_message?: string | null;
};

const useAuditLogs = () =>
  useQuery<AuditLog[]>({
    queryKey: ['audit_logs_security'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', {
          ascending: false,
        })
        .limit(200);

      if (error) {
        throw error;
      }

      return (data ?? []) as AuditLog[];
    },
  });

const formatDateTime = (
  value: string,
) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return format(
    date,
    'dd/MM HH:mm:ss',
  );
};

const formatAuthEvent = (
  eventType: string,
) => {
  switch (eventType) {
    case 'login_success':
      return 'Connexion OK';

    case 'login_failure':
      return 'Échec connexion';

    case 'logout':
      return 'Déconnexion';

    case 'password_reset':
      return 'Réinitialisation';

    default:
      return eventType;
  }
};

export default function SecurityLogs() {
  const {
    data: authLogs = [],
  } = useSecurityAuthLogs(200);

  const {
    data: edgeLogs = [],
  } = useProductEdgeFunctionLogs(200);

  const {
    data: auditLogs = [],
  } = useAuditLogs();

  const [query, setQuery] =
    useState('');

  const [eventFilter, setEventFilter] =
    useState('all');

  const filteredAuth =
    useMemo(() => {
      const normalizedQuery =
        query.trim().toLowerCase();

      return (authLogs as AuthLog[]).filter(
        (log) => {
          if (
            eventFilter !== 'all' &&
            log.event_type !== eventFilter
          ) {
            return false;
          }

          if (
            normalizedQuery &&
            !`${log.user_email ?? ''} ${
              log.ip_address ?? ''
            }`
              .toLowerCase()
              .includes(normalizedQuery)
          ) {
            return false;
          }

          return true;
        },
      );
    }, [
      authLogs,
      query,
      eventFilter,
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Activity className="h-7 w-7" />
          Logs & activité
        </h1>

        <p className="text-muted-foreground">
          Supervision des authentifications,
          actions métier et exécutions techniques
          de l’infrastructure BIB.
        </p>
      </div>

      <Tabs defaultValue="auth">
        <TabsList>
          <TabsTrigger value="auth">
            Auth ({authLogs.length})
          </TabsTrigger>

          <TabsTrigger value="audit">
            Actions métier ({auditLogs.length})
          </TabsTrigger>

          <TabsTrigger value="edge">
            Edge Functions ({edgeLogs.length})
          </TabsTrigger>
        </TabsList>

        {/* AUTHENTIFICATION */}

        <TabsContent
          value="auth"
          className="space-y-4"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>
                Connexions, déconnexions et échecs
              </CardTitle>

              <div className="flex gap-2">
                <Select
                  value={eventFilter}
                  onValueChange={
                    setEventFilter
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">
                      Tous les événements
                    </SelectItem>

                    <SelectItem value="login_success">
                      Connexion OK
                    </SelectItem>

                    <SelectItem value="login_failure">
                      Échec connexion
                    </SelectItem>

                    <SelectItem value="logout">
                      Déconnexion
                    </SelectItem>

                    <SelectItem value="password_reset">
                      Réinitialisation
                    </SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />

                  <Input
                    placeholder="Email ou IP…"
                    value={query}
                    onChange={(event) =>
                      setQuery(
                        event.target.value,
                      )
                    }
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Date
                    </TableHead>

                    <TableHead>
                      Événement
                    </TableHead>

                    <TableHead>
                      Utilisateur
                    </TableHead>

                    <TableHead>
                      IP
                    </TableHead>

                    <TableHead>
                      Application
                    </TableHead>

                    <TableHead>
                      User Agent
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredAuth.length ===
                  0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground"
                      >
                        Aucun log
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAuth
                      .slice(0, 100)
                      .map((log) => (
                        <TableRow
                          key={log.id}
                        >
                          <TableCell className="text-xs">
                            {formatDateTime(
                              log.created_at,
                            )}
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant={
                                log.event_type ===
                                'login_failure'
                                  ? 'destructive'
                                  : 'default'
                              }
                            >
                              {formatAuthEvent(
                                log.event_type,
                              )}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-sm">
                            {log.user_email ||
                              '—'}
                          </TableCell>

                          <TableCell className="font-mono text-xs">
                            {log.ip_address ||
                              '—'}
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline">
                              {log.app_origin ||
                                'BIB'}
                            </Badge>
                          </TableCell>

                          <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                            {log.user_agent ||
                              '—'}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUDIT MÉTIER */}

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>
                Actions métier
              </CardTitle>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Date
                    </TableHead>

                    <TableHead>
                      Utilisateur
                    </TableHead>

                    <TableHead>
                      Action
                    </TableHead>

                    <TableHead>
                      Ressource
                    </TableHead>

                    <TableHead>
                      Pôle
                    </TableHead>

                    <TableHead>
                      IP
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {auditLogs.length ===
                  0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground"
                      >
                        Aucun log d’audit
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs
                      .slice(0, 100)
                      .map((log) => (
                        <TableRow
                          key={log.id}
                        >
                          <TableCell className="text-xs">
                            {formatDateTime(
                              log.created_at,
                            )}
                          </TableCell>

                          <TableCell className="text-sm">
                            {log.user_name ||
                              '—'}
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline">
                              {log.action}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-sm">
                            {log.resource ||
                              '—'}
                          </TableCell>

                          <TableCell>
                            {log.pole_id ? (
                              <Badge variant="secondary">
                                {log.pole_id}
                              </Badge>
                            ) : (
                              '—'
                            )}
                          </TableCell>

                          <TableCell className="font-mono text-xs">
                            {log.ip_address ||
                              '—'}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EDGE FUNCTIONS */}

        <TabsContent value="edge">
          <Card>
            <CardHeader>
              <CardTitle>
                Appels Edge Functions
              </CardTitle>
            </CardHeader>

            <CardContent>
              {edgeLogs.length ===
              0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun log d’Edge Function.
                  Les fonctions doivent
                  enregistrer leur exécution
                  dans la table dédiée.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Date
                      </TableHead>

                      <TableHead>
                        Fonction
                      </TableHead>

                      <TableHead>
                        Méthode
                      </TableHead>

                      <TableHead>
                        Statut
                      </TableHead>

                      <TableHead>
                        Durée
                      </TableHead>

                      <TableHead>
                        Erreur
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {(edgeLogs as EdgeFunctionLog[])
                      .slice(0, 100)
                      .map((log) => (
                        <TableRow
                          key={log.id}
                        >
                          <TableCell className="text-xs">
                            {formatDateTime(
                              log.created_at,
                            )}
                          </TableCell>

                          <TableCell className="font-mono text-sm">
                            {log.function_name}
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline">
                              {log.method}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant={
                                log.status_code >=
                                400
                                  ? 'destructive'
                                  : 'default'
                              }
                            >
                              {log.status_code}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            {log.duration_ms ??
                              '—'}
                            {log.duration_ms !=
                            null
                              ? ' ms'
                              : ''}
                          </TableCell>

                          <TableCell className="max-w-xs truncate text-xs text-destructive">
                            {log.error_message ||
                              '—'}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}