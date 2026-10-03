import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useTechAccess } from '@/hooks/useTechData';
import { useState, useMemo } from 'react';
import { Users, Search } from 'lucide-react';
import { positionAccess } from '@/data/positionAccess';

export default function TechAccess() {
  const { data: users = [], isLoading } = useTechAccess();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return users.filter((u: any) =>
      `${u.first_name} ${u.last_name} ${u.email} ${u.position || ''}`.toLowerCase().includes(s)
    );
  }, [users, q]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Users className="h-7 w-7" /> Accès & utilisateurs</h1>
        <p className="text-muted-foreground">Tous les utilisateurs internes, leur poste et leurs droits d'accès</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{users.length} utilisateurs internes</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : (
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
                {filtered.map((u: any) => {
                  const access = u.position ? positionAccess[u.position as keyof typeof positionAccess] : null;
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{u.first_name} {u.last_name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.position ? <Badge variant="outline">{u.position}</Badge> : <span className="text-muted-foreground text-sm">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {access?.poles.slice(0, 4).map((p) => (
                            <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                          ))}
                          {access && access.poles.length > 4 && <span className="text-xs text-muted-foreground">+{access.poles.length - 4}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {access?.screens.includes('*') ? 'Tous' : `${access?.screens.length || 0} écrans`}
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
