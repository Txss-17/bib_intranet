import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface IncidentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident?: {
    id: string;
    title: string;
    category: string;
    severity: string;
    status: string;
    assignee: string;
  };
  onSubmit: (data: any) => void;
}

export default function IncidentForm({ open, onOpenChange, incident, onSubmit }: IncidentFormProps) {
  const [formData, setFormData] = useState({
    title: incident?.title || '',
    category: incident?.category || '',
    severity: incident?.severity || 'medium',
    status: incident?.status || 'investigating',
    assignee: incident?.assignee || '',
    description: '',
    impactedSystems: '',
    affectedUsers: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{incident ? 'Modifier l\'incident' : 'Déclarer un incident'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre de l'incident</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Problème de connexion API"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Logistique">Logistique</SelectItem>
                  <SelectItem value="Qualité">Qualité</SelectItem>
                  <SelectItem value="Tech">Technique</SelectItem>
                  <SelectItem value="Fournisseur">Fournisseur</SelectItem>
                  <SelectItem value="Client">Client</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Sécurité">Sécurité</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity">Sévérité</Label>
              <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="investigating">Investigation</SelectItem>
                  <SelectItem value="mitigating">Mitigation</SelectItem>
                  <SelectItem value="monitoring">Surveillance</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignee">Assigné à</Label>
              <Input
                id="assignee"
                value={formData.assignee}
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                placeholder="Nom du responsable"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="impactedSystems">Systèmes impactés</Label>
            <Input
              id="impactedSystems"
              value={formData.impactedSystems}
              onChange={(e) => setFormData({ ...formData, impactedSystems: e.target.value })}
              placeholder="Ex: API, Base de données, Front-end"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="affectedUsers">Utilisateurs affectés</Label>
            <Input
              id="affectedUsers"
              value={formData.affectedUsers}
              onChange={(e) => setFormData({ ...formData, affectedUsers: e.target.value })}
              placeholder="Ex: ~500 utilisateurs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description détaillée</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez l'incident, son origine et son impact..."
              rows={4}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" variant={incident ? 'default' : 'destructive'}>
              {incident ? 'Enregistrer' : 'Déclarer l\'incident'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
