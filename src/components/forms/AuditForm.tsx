import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface AuditFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audit?: any;
  onSubmit: (data: any) => void;
  type: 'ops' | 'supplier';
}

export default function AuditForm({ open, onOpenChange, audit, onSubmit, type }: AuditFormProps) {
  const [formData, setFormData] = useState({
    process: '', supplier: '', scope: '', category: '', auditor: '', date: '', status: 'scheduled', score: '', recommendations: '', findings: '', notes: '',
  });

  useEffect(() => {
    if (audit) {
      setFormData({
        process: audit.process || '', supplier: audit.supplier || '', scope: audit.scope || '', category: audit.category || '',
        auditor: audit.auditor || '', date: audit.date?.split('T')[0] || '', status: audit.status || 'scheduled',
        score: audit.score?.toString() || '', recommendations: audit.recommendations?.toString() || '',
        findings: typeof audit.findings === 'number' ? audit.findings.toString() : audit.findings || '', notes: audit.notes || '',
      });
    } else {
      setFormData({ process: '', supplier: '', scope: '', category: '', auditor: '', date: '', status: 'scheduled', score: '', recommendations: '', findings: '', notes: '' });
    }
  }, [audit, open]);

  const handleSubmit = () => {
    const base = {
      auditor: formData.auditor, date: formData.date, status: formData.status,
      score: formData.score ? parseInt(formData.score) : null, notes: formData.notes || null,
    };
    if (type === 'ops') {
      onSubmit({ ...base, process: formData.process, scope: formData.scope,
        recommendations: formData.recommendations ? parseInt(formData.recommendations) : null,
        findings: formData.findings || null });
    } else {
      onSubmit({ ...base, supplier: formData.supplier, category: formData.category,
        findings: formData.findings ? parseInt(formData.findings) : null });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{audit ? 'Modifier l\'audit' : 'Planifier un audit'}</DialogTitle>
          <DialogDescription>{type === 'ops' ? 'Audit opérationnel' : 'Audit fournisseur'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {type === 'ops' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Processus</Label><Input value={formData.process} onChange={(e) => setFormData({ ...formData, process: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Périmètre</Label><Input value={formData.scope} onChange={(e) => setFormData({ ...formData, scope: e.target.value })} /></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Fournisseur</Label><Input value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Catégorie</Label><Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} /></div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Auditeur</Label><Input value={formData.auditor} onChange={(e) => setFormData({ ...formData, auditor: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Date</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Statut</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Planifié</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Score (%)</Label><Input type="number" min="0" max="100" value={formData.score} onChange={(e) => setFormData({ ...formData, score: e.target.value })} /></div>
            <div className="grid gap-2"><Label>{type === 'ops' ? 'Recommandations' : 'NC détectées'}</Label><Input type="number" min="0" value={type === 'ops' ? formData.recommendations : formData.findings} onChange={(e) => setFormData({ ...formData, [type === 'ops' ? 'recommendations' : 'findings']: e.target.value })} /></div>
          </div>
          <div className="grid gap-2"><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit}>{audit ? 'Modifier' : 'Planifier'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
