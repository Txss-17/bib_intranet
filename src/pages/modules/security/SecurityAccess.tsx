import { useMemo, useState } from 'react';
import { Search, ShieldCheck, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { positionAccess } from '@/data/positionAccess';
import { useSecurityAccess } from '@/hooks/useSecurityData';

type Position = keyof typeof positionAccess;

interface SecurityAccessUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  position: Position | null;
}

function isSecurityAccessUser(value: unknown): value is SecurityAccessUser {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const user = value as Record<string, unknown>;

  return (
    typeof user.id === 'string' &&
    (typeof user.first_name === 'string' || user.first_name === null) &&
    (typeof user.last_name === 'string' || user.last_name === null) &&
    typeof user.email === 'string' &&
    (typeof user.position === 'string' || user.position === null)
  );
}

export default function SecurityAccess() {
  const { data: users = [], isLoading } = useSecurityAccess();
  const [query, setQuery] = useState('');

  const typedUsers = useMemo<SecurityAccessUser[]>(
    () => users.filter(isSecurityAccessUser),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return typedUsers;
    }

    return typedUsers.filter((user) =>
      [
        user.first_name ?? '',
        user.last_name ?? '',
        user.email,
        user.position ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(search),
    );
  }, [typedUsers, query]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7" />
            <h1 className="text-3xl font-bold">
              Accès & identités
            </h1>
          </div>

          <p className="mt-1 text-muted-foreground">
            Security & IT — utilisateurs internes, habilitations et
            périmètres d'accès.
          </p>
        </div>

        <Badge variant="outline" className="gap-1.5">
          <Users className="h-3.5 w-3.5" />
          Contrôle des accès
        </Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>
              {typedUsers.length} utilisateur
              {typedUsers.length > 1 ? 's' : ''} interne
              {typedUsers.length > 1 ? 's' : ''}
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Habilitations calculées selon le poste et les périmètres
              autorisés.
            </p>
          </div>

          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un utilisateur…"
              className="pl-9"
            />
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-muted-foreground">
                Chargement des utilisateurs…
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users className="mb-3 h-8 w-8 text-muted-foreground" />

              <p className="font-medium">
                Aucun utilisateur trouvé
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Aucun utilisateur ne correspond à la recherche actuelle.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Poste</TableHead>
                    <TableHead>Pôles accessibles</TableHead>
                    <TableHead>Écrans</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredUsers.map((user) => {
                    const access = user.position
                      ? positionAccess[user.position]
                      : null;

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {[user.first_name, user.last_name]
                                .filter(Boolean)
                                .join(' ') || 'Utilisateur sans nom'}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          {user.position ? (
                            <Badge variant="outline">
                              {user.position}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Non défini
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {access?.poles.slice(0, 4).map((pole) => (
                              <Badge
                                key={pole}
                                variant="secondary"
                                className="text-xs"
                              >
                                {pole}
                              </Badge>
                            ))}

                            {access && access.poles.length > 4 && (
                              <Badge
                                variant="outline"
                                className="text-xs"
                              >
                                +{access.poles.length - 4}
                              </Badge>
                            )}

                            {!access && (
                              <span className="text-xs text-muted-foreground">
                                Aucun périmètre défini
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {access?.screens.includes('*')
                              ? 'Tous les écrans'
                              : `${access?.screens.length ?? 0} écran${
                                  (access?.screens.length ?? 0) > 1
                                    ? 's'
                                    : ''
                                }`}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}