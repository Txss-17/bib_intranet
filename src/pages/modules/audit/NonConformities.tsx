import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, AlertTriangle, CheckCircle, Clock, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function NonConformities() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: nonConformities = [], isLoading, error } = useQuery({
    queryKey: ['quality_alerts'],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from('quality_alerts')
        .select('*, suppliers(name), products(name)')
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      return data;
    },
  });

  const filteredNCs = nonConformities.filter(nc =>
    nc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (nc.suppliers?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (nc.products?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed': return <Badge className="bg-green-500/10 text-green-500">Résolu</Badge>;
      case 'investigating': return <Badge className="bg-blue-500/10 text-blue-500">En cours</Badge>;
      case 'open': return <Badge variant="destructive">Ouvert</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge className="bg-red-600 text-white">Critique</Badge>;
      case 'high': return <Badge variant="destructive">Élevée</Badge>;
      case 'medium': return <Badge variant="secondary">Moyenne</Badge>;
      case 'low': return <Badge variant="outline">Faible</Badge>;
      default: return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const openCount = nonConformities.filter(nc => nc.status === 'open').length;
  const inProgressCount = nonConformities.filter(nc => nc.status === 'investigating').length;
  const resolvedAlerts = nonConformities.filter(nc => (nc.status === 'resolved' || nc.status === 'closed') && nc.resolved_at);
  const averageResolutionDays = resolvedAlerts.length > 0
    ? Math.round(resolvedAlerts.reduce((total, nc) => total + (
      new Date(nc.resolved_at!).getTime() - new Date(nc.created_at).getTime()
    ) / 86_400_000, 0) / resolvedAlerts.length)
    : null;

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-destructive">Impossible de charger les non-conformités : {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Non-conformités</h1>
          <p className="text-muted-foreground">Suivi et résolution des non-conformités</p>
        </div>
        <Button asChild>
          <Link to="/pole/supplier/alerts">
          <Plus className="mr-2 h-4 w-4" />
          Déclarer une NC
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ouvertes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{openCount}</div>
            <p className="text-xs text-muted-foreground">À traiter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{inProgressCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Résolues</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{resolvedAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Résolues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Délai moyen</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageResolutionDays === null ? '—' : `${averageResolutionDays}j`}</div>
            <p className="text-xs text-muted-foreground">Résolution</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une NC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des non-conformités</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Sévérité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Créée le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNCs.map((nc) => (
                <TableRow key={nc.id}>
                  <TableCell className="font-medium">{nc.title}</TableCell>
                  <TableCell>{nc.suppliers?.name ?? nc.products?.name ?? 'Signalement'}</TableCell>
                  <TableCell>{getSeverityBadge(nc.severity)}</TableCell>
                  <TableCell>{getStatusBadge(nc.status)}</TableCell>
                  <TableCell>{nc.assigned_to ? 'Assignée' : 'Non assignée'}</TableCell>
                  <TableCell>
                    {new Date(nc.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="sm"><Link to="/pole/supplier/alerts">Détails</Link></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
