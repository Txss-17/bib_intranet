import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, AlertTriangle, CheckCircle, Search, Lock, Eye } from 'lucide-react';

const securityAlerts = [
  { id: 1, type: 'Tentative de connexion suspecte', severity: 'high', status: 'open', source: '192.168.1.45', createdAt: '2025-02-02 15:30' },
  { id: 2, type: 'Certificat SSL expire bientôt', severity: 'medium', status: 'open', source: 'api.example.com', createdAt: '2025-02-02 10:00' },
  { id: 3, type: 'Mise à jour de sécurité disponible', severity: 'low', status: 'open', source: 'PostgreSQL', createdAt: '2025-02-01 09:00' },
  { id: 4, type: 'Accès refusé multiple', severity: 'high', status: 'resolved', source: '10.0.0.23', createdAt: '2025-01-31 14:20' },
  { id: 5, type: 'Scan de ports détecté', severity: 'medium', status: 'resolved', source: 'Externe', createdAt: '2025-01-30 22:15' },
];

const auditLogs = [
  { action: 'Connexion réussie', user: 'admin@example.com', ip: '192.168.1.10', time: 'Il y a 5 min' },
  { action: 'Modification rôle', user: 'manager@example.com', ip: '192.168.1.15', time: 'Il y a 15 min' },
  { action: 'Export données', user: 'analyst@example.com', ip: '192.168.1.20', time: 'Il y a 1h' },
  { action: 'Création utilisateur', user: 'admin@example.com', ip: '192.168.1.10', time: 'Il y a 2h' },
];

export default function Security() {
  const [searchTerm, setSearchTerm] = useState('');

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return <Badge variant="destructive">Critique</Badge>;
      case 'medium': return <Badge className="bg-yellow-500/10 text-yellow-500">Moyen</Badge>;
      default: return <Badge variant="secondary">Faible</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sécurité</h1>
        <p className="text-muted-foreground">Alertes de sécurité et logs d'audit</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Ouvertes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critiques</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">1</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Résolues ce mois</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">12</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Sécurité</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85/100</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Alertes de Sécurité</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Sévérité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {securityAlerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-medium">{alert.type}</TableCell>
                  <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                  <TableCell>
                    <Badge variant={alert.status === 'open' ? 'outline' : 'secondary'}>
                      {alert.status === 'open' ? 'Ouvert' : 'Résolu'}
                    </Badge>
                  </TableCell>
                  <TableCell>{alert.source}</TableCell>
                  <TableCell>{alert.createdAt}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs d'Audit Récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditLogs.map((log, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium">{log.action}</p>
                  <p className="text-sm text-muted-foreground">{log.user}</p>
                </div>
                <div className="text-right text-sm">
                  <p>{log.ip}</p>
                  <p className="text-muted-foreground">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
