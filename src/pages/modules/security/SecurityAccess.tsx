import { useMemo, useState } from 'react';
import { Users, Search } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';

import { useSecurityAccess } from '@/hooks/useTechData';
import { positionAccess } from '@/data/positionAccess';

interface SecurityAccessUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  position: keyof typeof positionAccess | null;
}

export default function SecurityAccess() {
  const { data: users = [], isLoading } = useSecurityAccess();
  const [query, setQuery] = useState('');

  const typedUsers = users as SecurityAccessUser[];

  const filtered = useMemo(() => {
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
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Users className="h-7 w-7" />
          Accès & identités
        </h1>

        <p className="mt-1 text-muted-foreground">
          Utilisateurs internes, habilitations et périmètres d'accès.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>
            {users.length} utilisateur{users.length > 1 ? 's' : ''} interne
            {users.length > 1 ? 's' : ''}
          </CardTitle>

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
            <p className="text-sm text-muted-foreground">
              Chargement des utilisateurs…
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun utilisateur ne correspond à la recherche.
            </p>
          ) : (
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
                {filtered.map((user) => {
                  const access = user.position
                    ? positionAccess[user.position]
                    : null;

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {user.first_name ?? ''}{' '}
                            {user.last_name ?? ''}
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
                            —
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
                            <span className="text-xs text-muted-foreground">
                              +{access.poles.length - 4}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {access?.screens.includes('*')
                            ? 'Tous'
                            : `${access?.screens.length ?? 0} écrans`}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
