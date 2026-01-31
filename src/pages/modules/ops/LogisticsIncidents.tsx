import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Search, Filter, Loader2, CheckCircle2, Clock, User } from "lucide-react";
import { useLogisticsIncidents, LogisticsIncident } from "@/hooks/useOps";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const typeLabels: Record<LogisticsIncident['type'], string> = {
  delay: 'Retard',
  damage: 'Dommage',
  lost: 'Perdu',
  wrong_address: 'Mauvaise adresse',
  customer_complaint: 'Plainte client',
};

const severityColors: Record<LogisticsIncident['severity'], string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-yellow-500/10 text-yellow-600',
  high: 'bg-orange-500/10 text-orange-500',
  critical: 'bg-destructive/10 text-destructive',
};

const statusLabels: Record<LogisticsIncident['status'], string> = {
  open: 'Ouvert',
  investigating: 'En investigation',
  resolved: 'Résolu',
  closed: 'Fermé',
};

const LogisticsIncidents = () => {
  const { data: incidents = [], isLoading } = useLogisticsIncidents();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         incident.reported_by?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const openCount = incidents.filter(i => i.status === 'open').length;
  const investigatingCount = incidents.filter(i => i.status === 'investigating').length;
  const criticalCount = incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'closed').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidents logistiques</h1>
          <p className="text-muted-foreground">Gestion et résolution des incidents</p>
        </div>
        <Button variant="destructive">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Signaler un incident
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={criticalCount > 0 ? "border-destructive" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${criticalCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
              <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Critiques</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div className="text-2xl font-bold">{openCount}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ouverts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold">{investigatingCount}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">En investigation</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div className="text-2xl font-bold">{incidents.filter(i => i.status === 'resolved').length}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Résolus ce mois</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par description ou signalé par..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="open">Ouvert</SelectItem>
                <SelectItem value="investigating">En investigation</SelectItem>
                <SelectItem value="resolved">Résolu</SelectItem>
                <SelectItem value="closed">Fermé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Sévérité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      <div className="space-y-4">
        {filteredIncidents.map((incident) => (
          <Card key={incident.id} className={incident.severity === 'critical' ? 'border-destructive' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${severityColors[incident.severity]}`}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{incident.description}</h3>
                      <Badge variant="outline">{typeLabels[incident.type]}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Signalé par: {incident.reported_by || 'Système'}</span>
                      {incident.assigned_to && <span>Assigné à: {incident.assigned_to}</span>}
                      <span>{format(new Date(incident.created_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                    </div>
                    {incident.resolution && (
                      <p className="text-sm text-green-600 mt-2">
                        <CheckCircle2 className="h-4 w-4 inline mr-1" />
                        Résolution: {incident.resolution}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={severityColors[incident.severity]}>
                    {incident.severity === 'critical' ? 'Critique' :
                     incident.severity === 'high' ? 'Haute' :
                     incident.severity === 'medium' ? 'Moyenne' : 'Basse'}
                  </Badge>
                  <Badge variant={
                    incident.status === 'open' ? 'destructive' :
                    incident.status === 'investigating' ? 'default' :
                    'secondary'
                  }>
                    {statusLabels[incident.status]}
                  </Badge>
                </div>
              </div>
              {incident.status !== 'resolved' && incident.status !== 'closed' && (
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button size="sm" variant="outline">Assigner</Button>
                  <Button size="sm" variant="outline">Investiguer</Button>
                  <Button size="sm">Résoudre</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filteredIncidents.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Aucun incident trouvé
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LogisticsIncidents;
