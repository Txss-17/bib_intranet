import React, { useState } from 'react';
import { AlertTriangle, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDeclareIncident } from '@/hooks/useNewModules';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import ProtectedScreen from '@/components/ProtectedScreen';

const Page = () => {
  const declare = useDeclareIncident();
  const nav = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: 'general', severity: 'medium', pole_id: '' as any });

  const submit = async () => {
    try {
      const payload: any = { ...form };
      if (!payload.pole_id) delete payload.pole_id;
      await declare.mutateAsync(payload);
      toast.success('Incident déclaré — l\'équipe Audit a été notifiée');
      nav('/modules/independent-audit');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-destructive" /> Déclarer un incident</h1>
        <p className="text-muted-foreground mt-1">Toute déclaration est tracée et confidentielle vis-à-vis du pôle concerné</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Formulaire de déclaration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Titre *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Description détaillée *</Label><Textarea rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Catégorie</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Général</SelectItem>
                  <SelectItem value="ethics">Éthique</SelectItem>
                  <SelectItem value="security">Sécurité</SelectItem>
                  <SelectItem value="quality">Qualité</SelectItem>
                  <SelectItem value="financial">Financier</SelectItem>
                  <SelectItem value="operational">Opérationnel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Sévérité</Label>
              <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Pôle concerné (optionnel)</Label>
            <Select value={form.pole_id || 'none'} onValueChange={v => setForm({ ...form, pole_id: v === 'none' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {['direction','finance','ops','tech','rh','supplier','audit','compliance','rse','marketing','risk','lifecycle','rd'].map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={submit} disabled={!form.title || !form.description || declare.isPending}>
            <Send className="h-4 w-4 mr-2" />Soumettre la déclaration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default function IncidentDeclaration() {
  return <ProtectedScreen screenId="audit.declare"><Page /></ProtectedScreen>;
}
