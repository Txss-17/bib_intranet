import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface SupportTicketFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket?: any;
  onSubmit: (data: any) => void;
}

export default function SupportTicketForm({ open, onOpenChange, ticket, onSubmit }: SupportTicketFormProps) {
  const [formData, setFormData] = useState({
    subject: '', description: '', priority: 'medium', category: 'general', status: 'open', assigned_to: '',
  });

  useEffect(() => {
    if (ticket) {
      setFormData({
        subject: ticket.subject || '', description: ticket.description || '',
        priority: ticket.priority || 'medium', category: ticket.category || 'general',
        status: ticket.status || 'open', assigned_to: ticket.assigned_to || '',
      });
    } else {
      setFormData({ subject: '', description: '', priority: 'medium', category: 'general', status: 'open', assigned_to: '' });
    }
  }, [ticket, open]);

  const handleSubmit = () => {
    onSubmit({ ...formData, assigned_to: formData.assigned_to || null });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{ticket ? 'Modifier le ticket' : 'Nouveau ticket support'}</DialogTitle>
          <DialogDescription>Renseignez les informations du ticket</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Sujet</Label><Input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} /></div>
          <div className="grid gap-2"><Label>Description</Label><Textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Priorité</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Catégorie</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Général</SelectItem>
                  <SelectItem value="billing">Facturation</SelectItem>
                  <SelectItem value="technical">Technique</SelectItem>
                  <SelectItem value="delivery">Livraison</SelectItem>
                  <SelectItem value="quality">Qualité</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Statut</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Ouvert</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                  <SelectItem value="closed">Fermé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Assigné à</Label><Input value={formData.assigned_to} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })} placeholder="Nom de l'agent" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={!formData.subject || !formData.description}>{ticket ? 'Modifier' : 'Créer'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
