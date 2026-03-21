import { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  Bell,
  BellOff,
  User,
  Filter,
  Search,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExportButtons } from '@/components/ExportButtons';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type AlertType = 'contract_end' | 'probation_end' | 'leave_return' | 'leave_start' | 'document_expiry';
type AlertPriority = 'critical' | 'high' | 'medium' | 'low';
type AlertStatus = 'active' | 'acknowledged' | 'resolved';

interface HRAlert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  employeeName: string;
  employeePole: string;
  title: string;
  description: string;
  dueDate: string;
  daysRemaining: number;
  createdAt: string;
}

const typeConfig: Record<AlertType, { label: string; icon: typeof AlertTriangle; className: string }> = {
  contract_end: { label: 'Fin de contrat', icon: FileText, className: 'bg-destructive/10 text-destructive' },
  probation_end: { label: 'Fin période d\'essai', icon: Clock, className: 'bg-warning/10 text-warning' },
  leave_return: { label: 'Retour de congé', icon: Calendar, className: 'bg-primary/10 text-primary' },
  leave_start: { label: 'Début de congé', icon: Calendar, className: 'bg-accent/10 text-accent-foreground' },
  document_expiry: { label: 'Document expiré', icon: FileText, className: 'bg-secondary text-secondary-foreground' },
};

const priorityConfig: Record<AlertPriority, { label: string; variant: 'destructive' | 'default' | 'secondary' | 'outline'; className?: string }> = {
  critical: { label: 'Critique', variant: 'destructive' },
  high: { label: 'Élevée', variant: 'default' },
  medium: { label: 'Moyenne', variant: 'secondary' },
  low: { label: 'Basse', variant: 'outline' },
};

// Generate alerts based on simulated deadlines relative to today
function generateAlerts(): HRAlert[] {
  const today = new Date();
  const d = (offset: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    return date.toISOString().split('T')[0];
  };

  return [
    {
      id: 'hra-1', type: 'contract_end', priority: 'critical', status: 'active',
      employeeName: 'Karim Hadj', employeePole: 'Marketing',
      title: 'CDD expire dans 5 jours',
      description: 'Le CDD de Karim Hadj (Chargé de communication) arrive à terme le ' + d(5) + '. Décision de renouvellement ou fin de contrat requise.',
      dueDate: d(5), daysRemaining: 5, createdAt: d(-10),
    },
    {
      id: 'hra-2', type: 'contract_end', priority: 'high', status: 'active',
      employeeName: 'Nicolas Faure', employeePole: 'Tech',
      title: 'Stage se termine dans 18 jours',
      description: 'La convention de stage de Nicolas Faure (Stagiaire Développeur) prend fin le ' + d(18) + '. Évaluation de fin de stage à planifier.',
      dueDate: d(18), daysRemaining: 18, createdAt: d(-5),
    },
    {
      id: 'hra-3', type: 'probation_end', priority: 'critical', status: 'active',
      employeeName: 'Léa Moreau', employeePole: 'Ops',
      title: 'Période d\'essai expire dans 3 jours',
      description: 'La période d\'essai de Léa Moreau (Assistante logistique, CDI) se termine le ' + d(3) + '. Validation ou renouvellement obligatoire.',
      dueDate: d(3), daysRemaining: 3, createdAt: d(-14),
    },
    {
      id: 'hra-4', type: 'probation_end', priority: 'medium', status: 'acknowledged',
      employeeName: 'Romain Leclerc', employeePole: 'Finance',
      title: 'Fin de période d\'essai dans 25 jours',
      description: 'La période d\'essai de Romain Leclerc (Contrôleur de gestion, CDI) arrive à terme le ' + d(25) + '. Bilan intermédiaire planifié.',
      dueDate: d(25), daysRemaining: 25, createdAt: d(-3),
    },
    {
      id: 'hra-5', type: 'leave_return', priority: 'medium', status: 'active',
      employeeName: 'Julie Petit', employeePole: 'RH',
      title: 'Retour de congé maternité dans 12 jours',
      description: 'Julie Petit (Chargée de recrutement) revient de congé maternité le ' + d(12) + '. Entretien de reprise et réintégration à organiser.',
      dueDate: d(12), daysRemaining: 12, createdAt: d(-7),
    },
    {
      id: 'hra-6', type: 'leave_start', priority: 'low', status: 'active',
      employeeName: 'Thomas Girard', employeePole: 'Supplier',
      title: 'Début congé CP dans 8 jours',
      description: 'Thomas Girard (Acheteur) part en congés payés du ' + d(8) + ' au ' + d(22) + ' (14 jours). Passation à organiser avec le pôle Supplier.',
      dueDate: d(8), daysRemaining: 8, createdAt: d(-2),
    },
    {
      id: 'hra-7', type: 'contract_end', priority: 'medium', status: 'active',
      employeeName: 'Clara Dubois', employeePole: 'RH',
      title: 'CDD expire dans 30 jours',
      description: 'Le CDD de Clara Dubois (Assistante RH, intérim maternité) se termine le ' + d(30) + '. Évaluation du besoin de prolongation.',
      dueDate: d(30), daysRemaining: 30, createdAt: d(-1),
    },
    {
      id: 'hra-8', type: 'document_expiry', priority: 'high', status: 'active',
      employeeName: 'Amira Belkacem', employeePole: 'Compliance',
      title: 'Certification DPO expire dans 10 jours',
      description: 'La certification DPO d\'Amira Belkacem expire le ' + d(10) + '. Renouvellement à initier pour maintenir la conformité.',
      dueDate: d(10), daysRemaining: 10, createdAt: d(-5),
    },
    {
      id: 'hra-9', type: 'leave_return', priority: 'low', status: 'resolved',
      employeeName: 'Marc Lefèvre', employeePole: 'RH',
      title: 'Retour de congé maladie effectué',
      description: 'Marc Lefèvre est revenu de congé maladie le ' + d(-2) + '. Entretien de reprise réalisé.',
      dueDate: d(-2), daysRemaining: -2, createdAt: d(-15),
    },
    {
      id: 'hra-10', type: 'probation_end', priority: 'high', status: 'resolved',
      employeeName: 'Sarah Nguyen', employeePole: 'Tech',
      title: 'Période d\'essai validée',
      description: 'La période d\'essai de Sarah Nguyen (UX Designer) a été validée le ' + d(-5) + '. CDI confirmé.',
      dueDate: d(-5), daysRemaining: -5, createdAt: d(-30),
    },
  ];
}

export default function HRAlerts() {
  const [alerts, setAlerts] = useState<HRAlert[]>(generateAlerts);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const { toast } = useToast();

  const filtered = alerts.filter(a => {
    const matchesSearch = a.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || a.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || a.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesType && matchesPriority && matchesStatus;
  }).sort((a, b) => a.daysRemaining - b.daysRemaining);

  const updateStatus = (id: string, newStatus: AlertStatus, label: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    toast({ title: label, description: 'Statut de l\'alerte mis à jour.' });
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const criticalCount = activeAlerts.filter(a => a.priority === 'critical').length;
  const contractEndCount = activeAlerts.filter(a => a.type === 'contract_end').length;
  const probationCount = activeAlerts.filter(a => a.type === 'probation_end').length;
  const leaveCount = activeAlerts.filter(a => a.type === 'leave_return' || a.type === 'leave_start').length;

  const getDaysLabel = (days: number) => {
    if (days < 0) return `Il y a ${Math.abs(days)}j`;
    if (days === 0) return "Aujourd'hui";
    return `Dans ${days}j`;
  };

  const getDaysClass = (days: number) => {
    if (days <= 3) return 'text-destructive font-semibold';
    if (days <= 7) return 'text-warning font-medium';
    if (days <= 14) return 'text-primary';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Alertes RH</h1>
        <p className="text-sm text-muted-foreground mt-1">Suivi automatique des échéances contractuelles, périodes d'essai et congés</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Alertes actives</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{activeAlerts.length}</p>
        </div>
        <div className="enterprise-card p-4 border-destructive/30">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Critiques</p>
          <p className="text-2xl font-semibold text-destructive mt-1">{criticalCount}</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Fins de contrat</p>
          <p className="text-2xl font-semibold text-warning mt-1">{contractEndCount}</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Périodes d'essai</p>
          <p className="text-2xl font-semibold text-primary mt-1">{probationCount}</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Congés</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{leaveCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher par nom ou alerte..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            <SelectItem value="contract_end">Fin de contrat</SelectItem>
            <SelectItem value="probation_end">Période d'essai</SelectItem>
            <SelectItem value="leave_return">Retour congé</SelectItem>
            <SelectItem value="leave_start">Début congé</SelectItem>
            <SelectItem value="document_expiry">Document expiré</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Priorité" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="critical">Critique</SelectItem>
            <SelectItem value="high">Élevée</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="low">Basse</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">Actives</SelectItem>
            <SelectItem value="acknowledged">Prises en charge</SelectItem>
            <SelectItem value="resolved">Résolues</SelectItem>
          </SelectContent>
        </Select>
        <ExportButtons filename="alertes-rh" title="Alertes RH" columns={[
          { header: 'Employé', accessor: 'employeeName' }, { header: 'Pôle', accessor: 'employeePole' },
          { header: 'Type', accessor: 'type' }, { header: 'Priorité', accessor: 'priority' },
          { header: 'Titre', accessor: 'title' }, { header: 'Échéance', accessor: 'dueDate' },
          { header: 'Jours restants', accessor: 'daysRemaining' }, { header: 'Statut', accessor: 'status' },
        ]} data={filtered} />
      </div>

      {/* Alert cards */}
      <div className="space-y-3">
        {filtered.map(alert => {
          const tc = typeConfig[alert.type];
          const pc = priorityConfig[alert.priority];
          const TypeIcon = tc.icon;

          return (
            <div key={alert.id} className={cn(
              'enterprise-card p-4 transition-colors',
              alert.status === 'resolved' && 'opacity-60',
              alert.priority === 'critical' && alert.status === 'active' && 'border-destructive/30',
            )}>
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tc.className)}>
                  <TypeIcon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{alert.title}</span>
                    <Badge variant={pc.variant} className="text-[10px]">{pc.label}</Badge>
                    {alert.status === 'acknowledged' && <Badge variant="outline" className="text-[10px]">Pris en charge</Badge>}
                    {alert.status === 'resolved' && <Badge variant="outline" className="text-[10px] text-success border-success">Résolu</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-foreground">{alert.employeeName}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{alert.employeePole}</Badge>
                    <span className="text-muted-foreground">Échéance: {new Date(alert.dueDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                {/* Right: countdown + actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={cn('text-sm tabular-nums', getDaysClass(alert.daysRemaining))}>
                    {getDaysLabel(alert.daysRemaining)}
                  </span>
                  {alert.status === 'active' && (
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => updateStatus(alert.id, 'acknowledged', 'Alerte prise en charge')}>
                        <Bell className="h-3 w-3 mr-1" />Prendre en charge
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => updateStatus(alert.id, 'resolved', 'Alerte résolue')}>
                        <CheckCircle className="h-3 w-3 mr-1" />Résoudre
                      </Button>
                    </div>
                  )}
                  {alert.status === 'acknowledged' && (
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => updateStatus(alert.id, 'resolved', 'Alerte résolue')}>
                      <CheckCircle className="h-3 w-3 mr-1" />Résoudre
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12">Aucune alerte correspondante</div>
        )}
      </div>
    </div>
  );
}
