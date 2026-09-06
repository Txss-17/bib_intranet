import { useState } from 'react';
import {
  Search,
  Filter,
  User,
  FileText,
  Calendar,
  Award,
  AlertTriangle,
  MessageSquare,
  Briefcase,
  Clock,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Eye,
  Edit,
  Plus,
  Download,
  Upload,
  Trash2,
  ShieldCheck,
  FileCheck,
  FileLock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ExportButtons } from '@/components/ExportButtons';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  type EmployeeFile,
  type EmployeeDocument,
  type EmployeeNote,
  initialEmployees,
} from '@/data/employeeData';

const docTypeConfig: Record<EmployeeDocument['type'], { label: string; icon: typeof FileText; className: string }> = {
  contrat: { label: 'Contrat', icon: Briefcase, className: 'bg-primary/10 text-primary' },
  identite: { label: 'Pièce d\'identité', icon: ShieldCheck, className: 'bg-accent/10 text-accent-foreground' },
  diplome: { label: 'Diplôme', icon: Award, className: 'bg-success/10 text-success' },
  medical: { label: 'Médical', icon: FileLock, className: 'bg-warning/10 text-warning' },
  administratif: { label: 'Administratif', icon: FileCheck, className: 'bg-secondary text-secondary-foreground' },
  autre: { label: 'Autre', icon: FileText, className: 'bg-muted text-muted-foreground' },
};

const statusConfig = {
  active: { label: 'Actif', variant: 'outline' as const, className: 'text-success border-success' },
  leave: { label: 'En congé', variant: 'secondary' as const, className: '' },
  probation: { label: 'Période d\'essai', variant: 'outline' as const, className: 'text-warning border-warning' },
  suspended: { label: 'Suspendu', variant: 'destructive' as const, className: '' },
};

const noteTypeConfig = {
  general: { label: 'Général', className: 'bg-secondary text-secondary-foreground' },
  performance: { label: 'Performance', className: 'bg-primary/10 text-primary' },
  disciplinary: { label: 'Disciplinaire', className: 'bg-destructive/10 text-destructive' },
  medical: { label: 'Médical', className: 'bg-warning/10 text-warning' },
  formation: { label: 'Formation', className: 'bg-accent/10 text-accent-foreground' },
};

const eventTypeIcons: Record<string, typeof FileText> = {
  contract: Briefcase,
  evaluation: Award,
  absence: Calendar,
  formation: Award,
  promotion: TrendingUp,
  warning: AlertTriangle,
  document: FileText,
};

export default function EmployeeFiles() {
  const [searchQuery, setSearchQuery] = useState('');
  const [poleFilter, setPoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeFile | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState({ type: 'general', content: '' });
  const [newDoc, setNewDoc] = useState({ name: '', type: 'contrat' as EmployeeDocument['type'] });
  const [employees, setEmployees] = useState(initialEmployees);
  const { toast } = useToast();

  const poles = [...new Set(employees.map(e => e.pole))];

  const filtered = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPole = poleFilter === 'all' || e.pole === poleFilter;
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesPole && matchesStatus;
  });

  const handleAddNote = () => {
    if (!selectedEmployee || !newNote.content.trim()) return;
    const note: EmployeeNote = {
      id: `n-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      author: 'RH',
      type: newNote.type as EmployeeNote['type'],
      content: newNote.content,
    };
    setEmployees(prev => prev.map(e =>
      e.id === selectedEmployee.id ? { ...e, notes: [note, ...e.notes] } : e
    ));
    setSelectedEmployee(prev => prev ? { ...prev, notes: [note, ...prev.notes] } : null);
    setNewNote({ type: 'general', content: '' });
    setNoteDialogOpen(false);
    toast({ title: 'Note ajoutée', description: `Note ajoutée au dossier de ${selectedEmployee.name}.` });
  };

  const handleAddDoc = () => {
    if (!selectedEmployee || !newDoc.name.trim()) return;
    const doc: EmployeeDocument = {
      id: `d-${Date.now()}`,
      name: newDoc.name,
      type: newDoc.type,
      uploadDate: new Date().toISOString().split('T')[0],
      size: '— Ko',
      uploadedBy: 'RH',
    };
    setEmployees(prev => prev.map(e =>
      e.id === selectedEmployee.id ? { ...e, employeeDocuments: [doc, ...e.employeeDocuments], documents: e.documents + 1 } : e
    ));
    setSelectedEmployee(prev => prev ? { ...prev, employeeDocuments: [doc, ...prev.employeeDocuments], documents: prev.documents + 1 } : null);
    setNewDoc({ name: '', type: 'contrat' });
    setDocDialogOpen(false);
    toast({ title: 'Document ajouté', description: `Document ajouté au dossier de ${selectedEmployee.name}.` });
  };

  const handleDeleteDoc = (docId: string) => {
    if (!selectedEmployee) return;
    setEmployees(prev => prev.map(e =>
      e.id === selectedEmployee.id ? { ...e, employeeDocuments: e.employeeDocuments.filter(d => d.id !== docId), documents: e.documents - 1 } : e
    ));
    setSelectedEmployee(prev => prev ? { ...prev, employeeDocuments: prev.employeeDocuments.filter(d => d.id !== docId), documents: prev.documents - 1 } : null);
    toast({ title: 'Document supprimé', description: 'Le document a été retiré du dossier.' });
  };

  const activeCount = employees.filter(e => e.status === 'active').length;
  const onLeaveCount = employees.filter(e => e.status === 'leave').length;
  const probationCount = employees.filter(e => e.status === 'probation').length;
  const warningCount = employees.filter(e => e.warnings > 0).length;

  // Detail view
  if (selectedEmployee) {
    const emp = selectedEmployee;
    const sc = statusConfig[emp.status];

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Back + header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedEmployee(null)}>
            ← Retour à la liste
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Identity card */}
          <div className="enterprise-card p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {emp.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{emp.name}</h2>
                <p className="text-sm text-muted-foreground">{emp.position}</p>
                <Badge variant={sc.variant} className={cn('text-[10px] mt-1', sc.className)}>{sc.label}</Badge>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="text-foreground">{emp.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Téléphone</span><span className="text-foreground">{emp.phone}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pôle</span><Badge variant="outline" className="text-[10px]">{emp.pole}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Manager</span><span className="text-foreground">{emp.manager}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Contrat</span><span className="text-foreground">{emp.contractType}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Début</span><span className="text-foreground">{new Date(emp.startDate).toLocaleDateString('fr-FR')}</span></div>
              {emp.contractEnd && <div className="flex justify-between"><span className="text-muted-foreground">Fin contrat</span><span className="text-foreground">{new Date(emp.contractEnd).toLocaleDateString('fr-FR')}</span></div>}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-secondary/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Évaluation</p>
                <p className="text-xl font-semibold text-foreground">{emp.evaluationScore ? `${emp.evaluationScore}/5` : '—'}</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Absences (j)</p>
                <p className="text-xl font-semibold text-foreground">{emp.absenceDays}</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Avertissements</p>
                <p className={cn('text-xl font-semibold', emp.warnings > 0 ? 'text-destructive' : 'text-foreground')}>{emp.warnings}</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Documents</p>
                <p className="text-xl font-semibold text-foreground">{emp.documents}</p>
              </div>
            </div>
          </div>

          {/* Right: Tabs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-lg font-semibold text-foreground">Dossier de {emp.name.split(' ')[0]}</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setDocDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-1" />Ajouter un document
                </Button>
                <Button size="sm" onClick={() => setNoteDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />Ajouter une note
                </Button>
              </div>
            </div>

            <Tabs defaultValue="documents" className="w-full">
              <TabsList>
                <TabsTrigger value="documents">Documents ({emp.employeeDocuments.length})</TabsTrigger>
                <TabsTrigger value="timeline">Chronologie</TabsTrigger>
                <TabsTrigger value="notes">Notes ({emp.notes.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="documents" className="mt-4 space-y-3">
                {/* Doc type summary */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {Object.entries(docTypeConfig).map(([key, cfg]) => {
                    const count = emp.employeeDocuments.filter(d => d.type === key).length;
                    if (count === 0) return null;
                    return (
                      <Badge key={key} className={cn('text-[10px]', cfg.className)}>
                        {cfg.label} ({count})
                      </Badge>
                    );
                  })}
                </div>

                {emp.employeeDocuments.map(doc => {
                  const cfg = docTypeConfig[doc.type];
                  const DocIcon = cfg.icon;
                  const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                  const isExpiringSoon = doc.expiryDate && !isExpired && new Date(doc.expiryDate) < new Date(Date.now() + 90 * 86400000);
                  return (
                    <div key={doc.id} className="enterprise-card p-4 flex items-center gap-4">
                      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', cfg.className)}>
                        <DocIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <Badge className={cn('text-[10px]', cfg.className)}>{cfg.label}</Badge>
                          <span>•</span>
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>Ajouté le {new Date(doc.uploadDate).toLocaleDateString('fr-FR')}</span>
                          <span>•</span>
                          <span>par {doc.uploadedBy}</span>
                        </div>
                        {doc.expiryDate && (
                          <p className={cn('text-xs mt-1', isExpired ? 'text-destructive font-medium' : isExpiringSoon ? 'text-warning' : 'text-muted-foreground')}>
                            {isExpired ? '⚠ Expiré' : `Expire le ${new Date(doc.expiryDate).toLocaleDateString('fr-FR')}`}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({ title: 'Téléchargement', description: `${doc.name} en cours de téléchargement...` })}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteDoc(doc.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {emp.employeeDocuments.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">Aucun document dans le dossier</div>
                )}
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                <div className="enterprise-card p-4 space-y-0">
                  {emp.events.map((event, idx) => {
                    const Icon = eventTypeIcons[event.type] || FileText;
                    return (
                      <div key={event.id} className="flex gap-4 py-3 border-b border-border/50 last:border-0">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          {idx < emp.events.length - 1 && <div className="w-px flex-1 bg-border/50 mt-1" />}
                        </div>
                        <div className="flex-1 pb-1">
                          <p className="text-sm font-medium text-foreground">{event.label}</p>
                          <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-4 space-y-3">
                {emp.notes.map(note => {
                  const ntc = noteTypeConfig[note.type];
                  return (
                    <div key={note.id} className="enterprise-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={cn('text-[10px]', ntc.className)}>{ntc.label}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(note.date).toLocaleDateString('fr-FR')}</span>
                        <span className="text-xs text-muted-foreground">• {note.author}</span>
                      </div>
                      <p className="text-sm text-foreground">{note.content}</p>
                    </div>
                  );
                })}
                {emp.notes.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">Aucune note dans le dossier</div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Add note dialog */}
        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une note au dossier</DialogTitle>
              <DialogDescription>Note pour le dossier de {emp.name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Type de note</Label>
                <Select value={newNote.type} onValueChange={v => setNewNote(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Général</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="disciplinary">Disciplinaire</SelectItem>
                    <SelectItem value="medical">Médical</SelectItem>
                    <SelectItem value="formation">Formation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contenu</Label>
                <Textarea
                  value={newNote.content}
                  onChange={e => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Détaillez l'observation, la décision ou l'événement..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleAddNote} disabled={!newNote.content.trim()}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add document dialog */}
        <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un document</DialogTitle>
              <DialogDescription>Ajouter un document au dossier de {emp.name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Type de document</Label>
                <Select value={newDoc.type} onValueChange={v => setNewDoc(prev => ({ ...prev, type: v as EmployeeDocument['type'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contrat">Contrat</SelectItem>
                    <SelectItem value="identite">Pièce d'identité</SelectItem>
                    <SelectItem value="diplome">Diplôme / Certification</SelectItem>
                    <SelectItem value="medical">Document médical</SelectItem>
                    <SelectItem value="administratif">Administratif</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nom du fichier</Label>
                <Input
                  value={newDoc.name}
                  onChange={e => setNewDoc(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: CDI_Nom_Prenom.pdf"
                />
              </div>
              <div className="space-y-2">
                <Label>Fichier</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Glissez un fichier ici ou cliquez pour parcourir</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG — Max 10 Mo</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDocDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleAddDoc} disabled={!newDoc.name.trim()}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dossiers employés</h1>
          <p className="text-sm text-muted-foreground mt-1">Suivi individuel complet de chaque collaborateur</p>
        </div>
        <Button asChild size="sm">
          <Link to="/pole/rh/onboarding"><Plus className="mr-1.5 h-4 w-4" /> Ajouter un dossier</Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Actifs</p>
          <p className="text-2xl font-semibold text-success mt-1">{activeCount}</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">En congé</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{onLeaveCount}</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Période d'essai</p>
          <p className="text-2xl font-semibold text-warning mt-1">{probationCount}</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Avec avertissement</p>
          <p className="text-2xl font-semibold text-destructive mt-1">{warningCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher par nom, email ou poste..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={poleFilter} onValueChange={setPoleFilter}>
          <SelectTrigger className="w-full sm:w-36"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Pôle" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les pôles</SelectItem>
            {poles.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="leave">En congé</SelectItem>
            <SelectItem value="probation">Période d'essai</SelectItem>
          </SelectContent>
        </Select>
        <ExportButtons filename="dossiers-employes" title="Dossiers employés" poleName="Ressources Humaines" columns={[
          { header: 'Nom', accessor: 'name' }, { header: 'Pôle', accessor: 'pole' },
          { header: 'Poste', accessor: 'position' }, { header: 'Statut', accessor: 'status' },
          { header: 'Contrat', accessor: 'contractType' }, { header: 'Évaluation', accessor: 'evaluationScore' },
          { header: 'Absences (j)', accessor: 'absenceDays' }, { header: 'Avertissements', accessor: 'warnings' },
        ]} data={filtered} />
      </div>

      {/* Employee cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(emp => {
          const sc = statusConfig[emp.status];
          return (
            <div
              key={emp.id}
              className="enterprise-card p-4 cursor-pointer hover:bg-secondary/20 transition-colors"
              onClick={() => setSelectedEmployee(emp)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {emp.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.position} • {emp.pole}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={sc.variant} className={cn('text-[10px]', sc.className)}>{sc.label}</Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>{emp.contractType}</span>
                <span>•</span>
                <span>Éval: {emp.evaluationScore ? `${emp.evaluationScore}/5` : '—'}</span>
                <span>•</span>
                <span>{emp.absenceDays}j abs.</span>
                {emp.warnings > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-destructive">{emp.warnings} avert.</span>
                  </>
                )}
                <span>•</span>
                <span>{emp.documents} docs</span>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-12">Aucun employé trouvé</div>
      )}
    </div>
  );
}
