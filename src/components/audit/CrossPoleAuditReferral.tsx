import {useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {toast} from 'sonner';
import {supabase} from '@/integrations/supabase/client';
import {intranetRpc} from '@/lib/intranet';
import {usePermissions} from '@/hooks/usePermissions';
import {useAuth} from '@/hooks/useAuth';
import {readAllPages} from '@/lib/operationsMetrics';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {Dialog,DialogContent,DialogHeader,DialogTitle} from '@/components/ui/dialog';

type SourcePole='marketplace'|'ops';
type SourceType='shop'|'logistics_incident';
type Modality='documentary'|'on_site'|'quality_control';
type AuditReferral={
 id:string; source_pole:SourcePole;source_type:SourceType;source_id:string;
 audit_modality:Modality;reason:string;sent_by:string;sent_at:string;status:string;
};
const modalityLabels:Record<Modality,string>={
 documentary:'Audit documentaire',
 on_site:'Audit sur site',
 quality_control:'Contrôle qualité ciblé',
};
const from=()=> (supabase as any).from('audit_cross_pole_referrals');

function useAuditReferrals(){
 const {user,profile}=useAuth();
 return useQuery({
  queryKey:['audit-cross-pole-referrals',user?.id,profile?.test_account===true],
  enabled:!!user&&!!profile,
  queryFn:()=>readAllPages<AuditReferral>(cursor=>{
   let query=from().select('id,source_pole,source_type,source_id,audit_modality,reason,sent_by,sent_at,status')
     .order('id').limit(500);
   if(cursor)query=query.gt('id',cursor);
   return query;
  }),
  staleTime:10_000,
 });
}

export function CrossPoleAuditReferralButton({sourcePole,sourceType,sourceId}:{
 sourcePole:SourcePole;sourceType:SourceType;sourceId:string;
}){
 const {can}=usePermissions();
 const qc=useQueryClient();
 const query=useAuditReferrals();
 const [open,setOpen]=useState(false);
 const [reason,setReason]=useState('');
 const [modality,setModality]=useState<Modality>('documentary');
 const permitted=sourcePole==='marketplace'
  ? can('marketplace.stores','update')
  : can('ops.incidents','update');
 const recorded=query.data?.find(r=>r.source_pole===sourcePole&&r.source_id===sourceId);
 const save=useMutation({
  mutationFn:()=>intranetRpc<{id:string;already_transmitted:boolean}>(
    'transmit_cross_pole_audit_request',{
     p_source_pole:sourcePole,p_source_type:sourceType,p_source_id:sourceId,
     p_modality:modality,p_reason:reason.trim(),
    }),
  onSuccess:()=>{
   toast.success('Demande d’audit transmise au pôle Audit.');
   setOpen(false);setReason('');
   void qc.invalidateQueries({queryKey:['audit-cross-pole-referrals']});
  },
  onError:(error:Error)=>toast.error(error.message),
 });
 if(!permitted)return null;
 if(query.isLoading)return <span className="text-xs text-muted-foreground">Vérification transmission Audit…</span>;
 if(query.isError)return <span role="alert" className="text-xs text-destructive">
  Transmission Audit indisponible : statut non vérifié.
  <Button type="button" size="sm" variant="ghost" onClick={()=>void query.refetch()}>Réessayer</Button>
 </span>;
 return <>
  {recorded ? <Badge variant="secondary">Transmis à Audit · {new Date(recorded.sent_at).toLocaleDateString('fr-FR')}</Badge>:
   <Button type="button" size="sm" variant="outline" onClick={()=>setOpen(true)}>
    Demander un audit
   </Button>}
  <Dialog open={open} onOpenChange={value=>!save.isPending&&setOpen(value)}>
   <DialogContent>
    <DialogHeader><DialogTitle>Transmettre au pôle Audit</DialogTitle></DialogHeader>
    <div className="space-y-3">
     <p className="break-all text-xs text-muted-foreground">Source vérifiée : {sourceType} · {sourceId}</p>
     <Label htmlFor={`audit-referral-kind-${sourceId}`}>Modalité demandée</Label>
     <select id={`audit-referral-kind-${sourceId}`} className="h-10 w-full rounded-md border bg-background px-3"
      value={modality} onChange={event=>setModality(event.target.value as Modality)}>
      {Object.entries(modalityLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}
     </select>
     <Label htmlFor={`audit-referral-reason-${sourceId}`}>Motif et constat à analyser (12 à 1000 caractères)</Label>
     <Textarea id={`audit-referral-reason-${sourceId}`} value={reason} maxLength={1000}
      onChange={e=>setReason(e.target.value)}
      placeholder="Références, faits constatés, documents et risque justifiant un contrôle…"/>
     <p className="text-xs text-muted-foreground">
      Une demande d’audit ne constitue ni une certification, ni une facture, ni une décision de conformité.
      Le pôle Audit conserve l’instruction et les validations.
     </p>
     <Button disabled={save.isPending||reason.trim().length<12} onClick={()=>save.mutate()}>
      {save.isPending?'Transmission en cours…':'Confirmer la transmission'}
     </Button>
    </div>
   </DialogContent>
  </Dialog>
 </>;
}

export function AuditCrossPoleInbox(){
 const {can}=usePermissions();
 const query=useAuditReferrals();
 if(!can('audit.missions','read'))return null;
 return <section className="rounded-lg border p-4 space-y-3">
  <div>
   <h2 className="font-semibold">Demandes d’audit reçues des autres pôles</h2>
   <p className="text-xs text-muted-foreground">Demandes Marchands et Logistique, avec identifiant source, auteur, date et motif. Une demande ne crée pas automatiquement une mission, un rapport ou une facture.</p>
  </div>
  {query.isLoading&&<p role="status">Chargement des transmissions…</p>}
  {query.isError&&<p role="alert" className="text-destructive text-sm">Réception indisponible. <Button variant="outline" size="sm" onClick={()=>void query.refetch()}>Réessayer</Button></p>}
  {query.data&&!query.data.length&&<p className="text-sm text-muted-foreground">Aucune transmission inter-pôles enregistrée.</p>}
  {query.data&&<ul className="space-y-2">
   {[...query.data].sort((a,b)=>b.sent_at.localeCompare(a.sent_at)).map(r=><li key={r.id} className="rounded-md border p-3 text-sm">
    <div className="flex flex-wrap gap-2 items-center">
     <Badge variant="outline">{r.source_pole==='marketplace'?'Marchands':'Logistique'}</Badge>
     <Badge variant="secondary">{modalityLabels[r.audit_modality]}</Badge>
     <span className="text-xs text-muted-foreground">{new Date(r.sent_at).toLocaleString('fr-FR')}</span>
    </div>
    <p className="my-2 whitespace-pre-wrap">{r.reason}</p>
    <p className="break-all text-xs text-muted-foreground">Source : {r.source_type} / {r.source_id} · Transmis par : {r.sent_by}</p>
   </li>)}
  </ul>}
 </section>;
}
