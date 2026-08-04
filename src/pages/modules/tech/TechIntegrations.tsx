import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plug, RefreshCw, ExternalLink, Github, Database, Sparkles, Mail, CreditCard, Chrome } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const services = [
  { name: 'GitHub', icon: Github, status: 'connected', last: "Aujourd'hui 09:12", version: 'main', action: 'Synchroniser' },
  { name: 'Backend (base de données)', icon: Database, status: 'connected', last: "Aujourd'hui 09:10", version: 'v2.5', action: 'Ouvrir' },
  { name: 'Lovable', icon: Sparkles, status: 'connected', last: "Aujourd'hui 09:08", version: 'Build 145', action: 'Synchroniser' },
  { name: 'Google Workspace', icon: Chrome, status: 'connected', last: "Aujourd'hui 09:05", version: 'Stable', action: 'Tester' },
  { name: 'Stripe', icon: CreditCard, status: 'pending', last: 'Hier 18:40', version: 'API 2026', action: 'Vérifier' },
  { name: 'Emails transactionnels', icon: Mail, status: 'connected', last: "Aujourd'hui 09:03", version: 'notify.brand-in-a-box.space', action: 'Tester' },
];

const statusLabel: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  connected: { label: '🟢 Connecté', variant: 'default' },
  pending: { label: '🟠 À vérifier', variant: 'secondary' },
  error: { label: '🔴 Erreur', variant: 'destructive' },
};

export default function TechIntegrations() {
  const run = (name: string, action: string) =>
    toast({ title: `${action} — ${name}`, description: 'Opération lancée depuis le centre de synchronisation.' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Plug className="h-7 w-7" /> Intégrations & Centre de synchronisation
        </h1>
        <p className="text-muted-foreground">
          Toutes les connexions externes de la plateforme : état, dernière synchronisation, version et actions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Centre de synchronisation</CardTitle>
          <CardDescription>Clés API masquées. Accès réservé aux profils techniques autorisés.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>État</TableHead>
                <TableHead className="hidden md:table-cell">Dernière synchro</TableHead>
                <TableHead className="hidden md:table-cell">Version</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.name}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      <s.icon className="h-4 w-4 text-muted-foreground" />
                      {s.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusLabel[s.status].variant}>{statusLabel[s.status].label}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{s.last}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="font-mono text-xs">{s.version}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => run(s.name, s.action)}>
                      {s.action === 'Ouvrir' ? (
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      ) : (
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {s.action}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Clés & secrets</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {['GITHUB_TOKEN', 'LINKSY_API_SECRET_KEY', 'RESEND_API_KEY'].map((k) => (
              <div key={k} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                <span className="font-mono text-xs">{k}</span>
                <span className="font-mono text-xs text-muted-foreground">••••••••••••</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Journal des erreurs</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Aucune erreur de synchronisation sur les dernières 24 h.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
