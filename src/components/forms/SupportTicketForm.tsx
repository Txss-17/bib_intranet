import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSupportAssignees } from '@/hooks/useSupportTickets';
import { useUserAccounts } from '@/hooks/useLifecycle';
import { SUPPORT_CATEGORY, SUPPORT_PRIORITY, SupportTicket, SupportTicketFields } from '@/lib/supportTickets';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket?: SupportTicket | null;
  pending: boolean;
  onSubmit: (data: SupportTicketFields) => void;
}
export default function SupportTicketForm({ open, onOpenChange, ticket, pending, onSubmit }: Props) {
  // The parent remounts on each edit: keep the form's original revision and content while it is open.
  const [form, setForm] = useState<SupportTicketFields>({
    subject: ticket?.subject || '', description: ticket?.description || '', priority: ticket?.priority || 'medium',
    category: ticket?.category || 'general', assigned_to: ticket?.assigned_to || null, user_account_id: ticket?.user_account_id || null,
  });
  const people = useSupportAssignees();
  const accounts = useUserAccounts();
  const set = (key: keyof SupportTicketFields, value: string | null) => setForm(current => ({ ...current, [key]: value }));
  return (
    <Dialog open={open} onOpenChange={value => !pending && onOpenChange(value)}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ticket ? 'Modifier le ticket' : 'Nouveau ticket support'}</DialogTitle>
          <DialogDescription>Sujet, contexte client et responsable du suivi.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={event => { event.preventDefault(); onSubmit({ ...form, subject: form.subject.trim(), description: form.description.trim() }); }}>
          <div className="space-y-2"><Label htmlFor="support-subject">Sujet</Label><Input id="support-subject" required maxLength={255} value={form.subject} disabled={pending} onChange={e => set('subject', e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="support-description">Description</Label><Textarea id="support-description" required maxLength={20000} rows={5} value={form.description} disabled={pending} onChange={e => set('description', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Priorité</Label><Select value={form.priority} disabled={pending} onValueChange={value => set('priority', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(SUPPORT_PRIORITY).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Catégorie</Label><Select value={form.category} disabled={pending} onValueChange={value => set('category', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(SUPPORT_CATEGORY).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-2">
            <Label>Responsable</Label>
            <Select value={form.assigned_to || 'none'} disabled={pending || people.isLoading || people.isError} onValueChange={value => set('assigned_to', value === 'none' ? null : value)}>
              <SelectTrigger><SelectValue placeholder="Choisir un agent" /></SelectTrigger>
              <SelectContent><SelectItem value="none">Non attribué</SelectItem>{people.data?.map(person => <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>)}</SelectContent>
            </Select>
            {people.isError && <p role="alert" className="text-sm">Responsables indisponibles. <Button type="button" variant="link" onClick={() => void people.refetch()}>Réessayer</Button></p>}
          </div>
          <div className="space-y-2">
            <Label>Compte client</Label>
            <Select value={form.user_account_id || 'none'} disabled={pending || accounts.isLoading || accounts.isError} onValueChange={value => set('user_account_id', value === 'none' ? null : value)}>
              <SelectTrigger><SelectValue placeholder="Choisir un compte" /></SelectTrigger>
              <SelectContent><SelectItem value="none">Non rattaché</SelectItem>{accounts.data?.map(account => <SelectItem key={account.id} value={account.id}>{account.company_name}</SelectItem>)}</SelectContent>
            </Select>
            {accounts.isError && <p role="alert" className="text-sm">Comptes indisponibles. <Button type="button" variant="link" onClick={() => void accounts.refetch()}>Réessayer</Button></p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={pending || !form.subject.trim() || !form.description.trim()}>{pending ? 'Enregistrement…' : ticket ? 'Enregistrer' : 'Créer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
