import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RecordAttachments from '@/components/operations/RecordAttachments';
import { useQualityPeople, useQualityReferences } from '@/hooks/useQualityAlerts';
import { QualityAlert, QualityFields, QualityPage, QUALITY_SEVERITY } from '@/lib/qualityAlerts';
import { usePoleCollaborators, collaboratorName } from '@/hooks/usePoleCollaborators';
export default function QualityAlertEditor({ page, original, pending, close, save }: { page: QualityPage; original?: QualityAlert; pending: boolean; close: () => void; save: (fields: QualityFields) => void }) {
 const people = useQualityPeople(page); const references = useQualityReferences(page);
 const pole = page === 'audit.nonconformities' ? 'audit' : 'supplier';
 const directory = usePoleCollaborators(pole, page, 'update');
 const eligibleIds = new Set((people.data || []).map(p => p.id));
 const [form, setForm] = useState<QualityFields>({ title: original?.title || '', description: original?.description || '', severity: original?.severity || 'medium', supplier_id: original?.supplier_id || null, product_id: original?.product_id || null, assigned_to: original?.assigned_to || null, is_nonconformity: original?.is_nonconformity ?? page === 'audit.nonconformities', corrective_action: original?.corrective_action || null, corrective_due_date: original?.corrective_due_date || null, evidence: original?.evidence || null, document_ids: original?.document_ids || [] });
 const set = <K extends keyof QualityFields>(key: K, value: QualityFields[K]) => setForm(current => ({ ...current, [key]: value }));
 const products = (references.data?.products || []).filter(product => !form.supplier_id || product.supplier_id === form.supplier_id);
 return <Dialog open onOpenChange={open => !open && !pending && close()}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{original ? 'Modifier' : 'Créer'} · {form.is_nonconformity ? 'Non-conformité' : 'Alerte qualité'}</DialogTitle></DialogHeader>
  <form className="space-y-4" onSubmit={event => { event.preventDefault(); save({ ...form, title: form.title.trim(), description: form.description.trim() }); }}>
   <div><Label htmlFor="quality-title">Titre et entité concernée</Label><Input id="quality-title" required maxLength={255} value={form.title} disabled={pending} onChange={e => set('title', e.target.value)} /></div>
   <div><Label htmlFor="quality-description">Constat</Label><Textarea id="quality-description" required maxLength={20000} rows={4} value={form.description} disabled={pending} onChange={e => set('description', e.target.value)} /></div>
   <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><Label>Sévérité</Label><Select value={form.severity} disabled={pending} onValueChange={value => set('severity', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(QUALITY_SEVERITY).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div><div><Label>Responsable</Label><Select value={form.assigned_to || 'none'} disabled={pending || people.isLoading || people.isError || directory.isLoading || directory.isError} onValueChange={value => set('assigned_to', value === 'none' ? null : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Non attribué</SelectItem>{directory.data?.map(person => <SelectItem key={person.id} value={person.id} disabled={!eligibleIds.has(person.id)}>{collaboratorName(person)}{eligibleIds.has(person.id) ? '' : ' — droits insuffisants'}</SelectItem>)}</SelectContent></Select>{(people.isError || directory.isError) && <p role="alert">Membres du pôle indisponibles ou droits insuffisants. Vérifiez la migration 0074.</p>}</div></div>
   <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.is_nonconformity} disabled={pending || !!original?.is_nonconformity || !original && page === 'audit.nonconformities'} onChange={event => set('is_nonconformity', event.target.checked)} />Non-conformité formelle, soumise aux validations Audit.</label>
   <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><Label>Fournisseur</Label><Select value={form.supplier_id || 'none'} disabled={pending || references.isError} onValueChange={value => { set('supplier_id', value === 'none' ? null : value); set('product_id', null); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Non rattaché</SelectItem>{references.data?.suppliers.map(supplier => <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>)}</SelectContent></Select></div><div><Label>Produit</Label><Select value={form.product_id || 'none'} disabled={pending || references.isError} onValueChange={value => set('product_id', value === 'none' ? null : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Non rattaché</SelectItem>{products.map(product => <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>)}</SelectContent></Select></div></div>
   {references.isError && <p role="alert">Références indisponibles. <Button type="button" variant="link" onClick={() => void references.refetch()}>Réessayer</Button></p>}
   <div><Label htmlFor="quality-correction">Action corrective</Label><Textarea id="quality-correction" rows={3} maxLength={10000} value={form.corrective_action || ''} disabled={pending} onChange={e => set('corrective_action', e.target.value || null)} /></div>
   <div><Label htmlFor="quality-due">Échéance corrective</Label><Input id="quality-due" type="date" value={form.corrective_due_date || ''} disabled={pending} onChange={e => set('corrective_due_date', e.target.value || null)} /></div>
   <div><Label htmlFor="quality-evidence">Éléments de preuve et contrôle effectué</Label><Textarea id="quality-evidence" rows={3} maxLength={10000} value={form.evidence || ''} disabled={pending} onChange={e => set('evidence', e.target.value || null)} /></div>
   <fieldset disabled={pending}><RecordAttachments value={form.document_ids} onChange={ids => set('document_ids', ids)} ownerOnly /></fieldset>
   <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={pending} onClick={close}>Annuler</Button><Button type="submit" disabled={pending || !form.title.trim() || !form.description.trim()}>{pending ? 'Enregistrement…' : 'Enregistrer'}</Button></div>
  </form>
 </DialogContent></Dialog>;
}
