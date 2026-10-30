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

import { useSecurityAccess } from '@/hooks/useSecurityData';

export default function SecurityAccess() {
  const { data: users = [], isLoading, isError, refetch } = useSecurityAccess();
  const [query, setQuery] = useState('');

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return users;
    }

    return users.filter((user) =>
      [
        user.first_name ?? '',
        user.last_name ?? '',
        user.email ?? '',
        user.position ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(search),
    );
  }, [users, query]);

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
              {users.length} utilisateur
              {users.length > 1 ? 's' : ''} interne
              {users.length > 1 ? 's' : ''}
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Pôles déclarés dans les profils. Les habilitations effectives dépendent des rôles,
              des périmètres et des contrôles serveur, et ne peuvent pas être déduites du poste seul.
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
          ) : isError ? (
            <div role="alert" className="space-y-3 p-6 text-center">
              <p className="text-destructive">Impossible de charger l’annuaire des accès.</p>
              <button className="rounded-md border px-3 py-2 text-sm" onClick={() => void refetch()}>Réessayer</button>
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
                    <TableHead>Pôles déclarés</TableHead>
                    <TableHead>Permissions effectives</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredUsers.map((user) => {
                    const declaredPoles = user.poles ?? [];
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
                              {user.email || 'Adresse e-mail non renseignée'}
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
                            {declaredPoles.slice(0, 4).map((pole) => (
                              <Badge
                                key={pole}
                                variant="secondary"
                                className="text-xs"
                              >
                                {pole}
                              </Badge>
                            ))}

                            {declaredPoles.length > 4 && (
                              <Badge
                                variant="outline"
                                className="text-xs"
                              >
                                +{declaredPoles.length - 4}
                              </Badge>
                            )}

                            {declaredPoles.length === 0 && (
                              <span className="text-xs text-muted-foreground">
                                Aucun pôle déclaré
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            Consultation dans Rôles & Permissions
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