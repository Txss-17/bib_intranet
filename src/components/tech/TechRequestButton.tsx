import { useEffect, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { PRIORITIES, TECH_REQUEST_CATEGORIES, useTechRequestActions } from '@/hooks/useTechRequests';

interface TechRequestButtonProps {
  /** Pôle demandeur (ex : 'data', 'finance', 'audit', 'lifecycle') */
  pole: string;
  /** Catégorie par défaut (voir TECH_REQUEST_CATEGORIES) */
  category?: string;
  /** Objet pré-rempli */
  defaultTitle?: string;
  /** Description pré-remplie */
  defaultDescription?: string;
  defaultPriority?: string;
  label?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function TechRequestButton({
  pole,
  category = 'evolution',
  defaultTitle = '',
  defaultDescription = '',
  defaultPriority = 'medium',
  label = 'Demander au Tech Studio',
  dialogTitle = 'Demande au Tech Studio',
  dialogDescription = "La Tech reçoit la demande, la valide ou la refuse avec un motif, et vous suivez l'avancement.",
  variant = 'outline',
  size = 'sm',
  className,
}: TechRequestButtonProps) {
  const [open, setOpen] = useState(false);
  const { create } = useTechRequestActions();
  const [form, setForm] = useState({
    title: defaultTitle,
    description: defaultDescription,
    category,
    priority: defaultPriority,
    target_date: '',
  });

  useEffect(() => {
    if (open) {
      setForm({ title: defaultTitle, description: defaultDescription, category, priority: defaultPriority, target_date: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    await create.mutateAsync({
      title: form.title.trim(),
      description: form.description.trim(),
      requester_pole: pole,
      category: form.category,
      priority: form.priority,
      target_date: form.target_date || null,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Send className="mr-1.5 h-3.5 w-3.5" /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="trb-title">Objet</Label>
            <Input id="trb-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="trb-desc">Description du besoin</Label>
            <Textarea id="trb-desc" rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Catégorie</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TECH_REQUEST_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priorité</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="trb-date">Échéance souhaitée (optionnel)</Label>
            <Input id="trb-date" type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={create.isPending || !form.title.trim() || !form.description.trim()}>
            {create.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
            Transmettre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TechRequestButton;
