import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase as typedSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// New migration 0090 is intentionally not added to generated Supabase types yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = typedSupabase as any;
type Kind = 'supplier' | 'logistics';
const SUPPLIER = [
 ['application_received','Candidature reçue'],
 ['precontract_catalog_received','Catalogue précontractuel reçu'],
 ['precontract_screened','Éligibilité précontractuelle examinée'],
 ['contract_signed','Contrat signé et validé'],
 ['access_invitation_prepared','Invitation d’accès à préparer'],
 ['portal_access_recorded','Accès portail transmis et confirmé'],
 ['catalog_received','Catalogue complet reçu'],
 ['catalog_reviewed','Documents et certifications examinés'],
 ['products_selected','Produits éligibles retenus'],
] as const;
const LOGISTICS = [
 ['application_received','Candidature reçue'],
 ['contact_completed','Échange sur les attentes BIB réalisé'],
 ['requirements_sent','Fiche des besoins BIB transmise'],
 ['requirements_accepted','Accord du logisticien sur les besoins'],
 ['contract_signed','Contrat signé et validé'],
 ['portal_access_recorded','Accès portail transmis et confirmé'],
] as const;
type Case = {id:string;stage:string;platform_submission_id:string|null};
type Product = {id:string;sku:string;product_description:string;status:string;documentary_evidence:unknown;certification_evidence:unknown;audit_reuse_reference:string|null};
function parseReferences(text:string): string[] {
 return text.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,30);
}
/** A workflow ledger. Nothing here issues portal tokens or publishes products. */
export default function PartnerPostApplicationWorkflow({kind,sourceId}:{kind:Kind;sourceId:string}) {
 const { user,profile } = useAuth();
 const qc=useQueryClient();
 const [reference,setReference]=useState('');
 const [notes,setNotes]=useState('');
 const [platformId,setPlatformId]=useState('');
 const [sku,setSku]=useState('');
 const [description,setDescription]=useState('');
 const [documents,setDocuments]=useState('');
 const [certificates,setCertificates]=useState('');
 const [auditRef,setAuditRef]=useState('');
 const [decision,setDecision]=useState('under_review');
 const [accessRecipient,setAccessRecipient]=useState('');
 const [accessChannel,setAccessChannel]=useState('transactional_email');
 const [invitationRef,setInvitationRef]=useState('');
 const [deliveryRef,setDeliveryRef]=useState('');
 const key=['postapplication',kind,sourceId,user?.id,profile?.test_account===true];
 const query=useQuery({
  queryKey:key, enabled:!!user&&!!profile&&!!sourceId,
  queryFn:async():Promise<{item:Case|null;products:Product[]}>=>{
   const {data,error}=await db.from('bib_partner_onboarding_cases')
    .select('id,stage,platform_submission_id')
    .eq('partner_kind',kind).eq('source_id',sourceId).maybeSingle();
   if(error)throw error;
   if(!data||kind!=='supplier')return {item:data??null,products:[]};
   const result=await db.from('bib_partner_catalog_eligibility')
    .select('id,sku,product_description,status,documentary_evidence,certification_evidence,audit_reuse_reference')
    .eq('case_id',data.id).order('sku');
   if(result.error)throw result.error;
   return {item:data,products:result.data??[]};
  },
 });
 const handoffQuery=useQuery({
  queryKey:['partner-access-handoff',kind,sourceId,user?.id,profile?.test_account===true],
  enabled:!!query.data?.item?.id&&!!user&&!!profile,
  queryFn:async()=>{
   const {data,error}=await db.from('bib_partner_access_handoffs')
    .select('id,delivery_state,channel,recipient_email,invitation_reference,delivery_reference')
    .eq('case_id',query.data?.item?.id).maybeSingle();
   if(error)throw error;
   return data as null | {id:string;delivery_state:string;channel:string;
    recipient_email:string;invitation_reference:string;delivery_reference:string|null};
  },
 });
 const accessMutation=useMutation({
  mutationFn:async(action:'prepare'|'confirm')=>{
   if(!query.data?.item?.id)throw new Error('Contrat non validé dans le parcours');
   const h=handoffQuery.data;
   const {error}=await db.rpc('bib_record_partner_access_handoff',{
    p_case_id:query.data.item.id,
    p_action:action,p_channel:action==='confirm'?h?.channel:accessChannel,
    p_recipient:action==='confirm'?h?.recipient_email:accessRecipient.trim().toLowerCase(),
    p_invitation_reference:action==='confirm'?h?.invitation_reference:invitationRef.trim(),
    p_delivery_reference:action==='confirm'?deliveryRef.trim():null,
   });
   if(error)throw error;
  },
  onSuccess:()=>{
   toast.success('Preuve de remise des accès enregistrée');
   setDeliveryRef('');
   void qc.invalidateQueries({queryKey:['partner-access-handoff',kind,sourceId]});
  },
  onError:(e:Error)=>toast.error('Preuve d’accès refusée',{description:e.message}),
 });
 const stages=kind==='supplier'?SUPPLIER:LOGISTICS;
 const current=query.data?.item?.stage??'application_received';
 const currentIndex=stages.findIndex(s=>s[0]===current);
 const next=stages[currentIndex+1];
 const needsPlatform=kind==='logistics';
 const linkedId=query.data?.item?.platform_submission_id??platformId.trim();
 const transition=useMutation({
  mutationFn:async()=>{
   const {error}=await db.rpc('bib_advance_partner_onboarding',{
    p_kind:kind,p_source_id:sourceId,p_expected_stage:current,
    p_next_stage:next?.[0],p_evidence_reference:reference.trim(),
    p_notes:notes.trim()||null,p_platform_submission_id:needsPlatform?linkedId:null,
   });if(error)throw error;
  },
  onSuccess:()=>{
   toast.success('Étape enregistrée');setReference('');setNotes('');
   void qc.invalidateQueries({queryKey:key});
  },
  onError:(e:Error)=>toast.error('Étape refusée',{description:e.message}),
 });
 const productMutation=useMutation({
  mutationFn:async()=>{
   if(!query.data?.item?.id)throw new Error('Dossier non créé');
   const {error}=await db.rpc('bib_record_partner_catalog_eligibility',{
    p_case_id:query.data.item.id,p_sku:sku.trim(),p_description:description.trim(),
    p_status:decision,p_documentary:parseReferences(documents),
    p_certifications:parseReferences(certificates),p_audit_reference:auditRef.trim()||null,
   });if(error)throw error;
  },
  onSuccess:()=>{
   toast.success('Examen documentaire enregistré');
   setSku('');setDescription('');setDocuments('');setCertificates('');setAuditRef('');
   void qc.invalidateQueries({queryKey:key});
  },
  onError:(e:Error)=>toast.error('Décision refusée',{description:e.message}),
 });
 const canRecordProduct=kind==='supplier'&&['catalog_received','catalog_reviewed','products_selected'].includes(current);
 const eligible=(query.data?.products??[]).filter(p=>p.status==='eligible').length;
 return <Card>
  <CardHeader>
   <CardTitle>Parcours après candidature — {kind==='supplier'?'Fournisseur':'Logistique'}</CardTitle>
   <p className="text-sm text-muted-foreground">
    Dossier de contrôle interne. La signature du contrat ne transmet pas automatiquement des identifiants.
    La transmission et sa réception doivent être attestées par une preuve distincte.
   </p>
  </CardHeader>
  <CardContent className="space-y-4">
   {query.isLoading&&<p role="status">Lecture du parcours…</p>}
   {query.isError&&<p role="alert" className="text-destructive">Registre indisponible : vérifier la migration 0090 et vos droits.</p>}
   {!query.isError&&!query.isLoading&&<>
    <div className="space-y-2">
     {stages.map(([code,label],idx)=><div key={code} className="flex items-center gap-2">
      <Badge variant={idx<=currentIndex?'secondary':'outline'}>{idx+1}</Badge>
      <span className={idx<=currentIndex?'font-medium':'text-muted-foreground'}>{label}</span>
     </div>)}
    </div>
    {kind==='supplier'&&<p className="text-sm">
     Produits éligibles documentés : {eligible} / {(query.data?.products??[]).length}. 
     Les références documentaires servent de base à l'audit, sans le remplacer ni publier automatiquement le catalogue.
    </p>}
    {needsPlatform&&<Input value={linkedId} onChange={e=>setPlatformId(e.target.value)}
     disabled={Boolean(query.data?.item?.platform_submission_id)}
     aria-label="Identifiant Platform du logisticien"
     placeholder="UUID exact du dossier logistique Platform (rapprochement contrôlé)"/>}
    {current==='access_invitation_prepared'&&<div className="space-y-3 rounded-lg border p-3">
     <h3 className="font-medium">Remise sécurisée de l'accès partenaire</h3>
     <p className="text-sm text-muted-foreground">
      Après contrat validé, le partenaire doit recevoir une invitation de connexion.
      Le parcours Platform utilise une vérification par code OTP : ne jamais communiquer
      de mot de passe, de jeton d'accès ou de lien confidentiel dans ce registre.
     </p>
     <p className="text-sm">Parcours de connexion public : {kind==='supplier'
       ? 'https://brand-in-a-box.space/suppliers/resume?portal=suppliers'
       : 'https://brand-in-a-box.space/ops/resume?portal=ops'}</p>
     {!handoffQuery.data&&<div className="space-y-2">
      <Input aria-label="Adresse destinataire" type="email" placeholder="Adresse professionnelle vérifiée"
       value={accessRecipient} onChange={e=>setAccessRecipient(e.target.value)} />
      <select aria-label="Canal de remise" className="w-full rounded-md border bg-background p-2"
       value={accessChannel} onChange={e=>setAccessChannel(e.target.value)}>
       <option value="transactional_email">E-mail transactionnel via Gateway</option>
       <option value="verified_manual">Remise manuelle avec preuve indépendante</option>
      </select>
      <Input aria-label="Référence d'invitation" value={invitationRef}
       onChange={e=>setInvitationRef(e.target.value)}
       placeholder="Référence interne de demande d'envoi (sans secret)" maxLength={500}/>
      <Button type="button" variant="outline"
       disabled={accessMutation.isPending||invitationRef.trim().length<8||!accessRecipient.includes('@')}
       onClick={()=>accessMutation.mutate('prepare')}>Enregistrer la préparation</Button>
     </div>}
     {handoffQuery.data&&<div className="space-y-2">
      <p className="text-sm">Invitation : {handoffQuery.data.delivery_state} · {handoffQuery.data.recipient_email}</p>
      {handoffQuery.data.delivery_state!=='confirmed'&&<>
       <Input aria-label="Preuve de transmission vérifiée" value={deliveryRef}
        onChange={e=>setDeliveryRef(e.target.value)}
        placeholder="Référence de remise/accusé (sans URL ni code)" maxLength={500}/>
       <Button type="button" variant="outline"
        disabled={accessMutation.isPending||deliveryRef.trim().length<8}
        onClick={()=>accessMutation.mutate('confirm')}>Confirmer après vérification indépendante</Button>
      </>}
      {handoffQuery.data.delivery_state==='confirmed'&&
       <p className="text-sm">Remise confirmée. L'accès opérationnel reste soumis à l'approbation Platform et à la sélection pilote.</p>}
     </div>}
    </div>}
    {next&&<div className="space-y-2 rounded-lg border p-3">
     <p className="font-medium">Prochaine étape : {next[1]}</p>
     <Input value={reference} onChange={e=>setReference(e.target.value)}
      aria-label="Preuve de l'étape" placeholder="Référence de pièce ou décision (8 caractères minimum)" maxLength={500}/>
     <Textarea value={notes} onChange={e=>setNotes(e.target.value)}
      aria-label="Observations" placeholder="Responsable, vérification réalisée, date ou réserve" maxLength={2000}/>
     <Button disabled={transition.isPending||reference.trim().length<8||
      (needsPlatform&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(linkedId))}
      onClick={()=>transition.mutate()}>Enregistrer l'étape</Button>
    </div>}
    {canRecordProduct&&<div className="space-y-2 rounded-lg border p-3">
     <h3 className="font-medium">Éligibilité documentaire par référence (audit initial)</h3>
     <Input value={sku} onChange={e=>setSku(e.target.value)} placeholder="SKU exact" aria-label="SKU exact"/>
     <Input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description produit" aria-label="Description produit"/>
     <Textarea value={documents} onChange={e=>setDocuments(e.target.value)}
      placeholder="Une référence documentaire par ligne" aria-label="Références documentaires"/>
     <Textarea value={certificates} onChange={e=>setCertificates(e.target.value)}
      placeholder="Une référence de certification par ligne" aria-label="Références certifications"/>
     <Input value={auditRef} onChange={e=>setAuditRef(e.target.value)}
      placeholder="Référence du dossier d'audit à rapprocher" aria-label="Référence audit"/>
     <select aria-label="Décision produit" value={decision} onChange={e=>setDecision(e.target.value)}
      className="w-full rounded-md border bg-background p-2">
      <option value="under_review">À examiner</option>
      <option value="eligible">Éligible</option>
      <option value="changes_requested">Compléments demandés</option>
      <option value="rejected">Non éligible</option>
     </select>
     <Button disabled={productMutation.isPending||!sku.trim()||!description.trim()||
      (decision==='eligible'&&!parseReferences(documents).length)}
      onClick={()=>productMutation.mutate()}>Enregistrer la décision produit</Button>
     <div className="space-y-1 text-sm">
      {(query.data?.products??[]).map(p=><p key={p.id}>{p.sku} — {p.status} — {p.audit_reuse_reference??'Audit à rattacher'}</p>)}
     </div>
    </div>}
   </>}
  </CardContent>
 </Card>;
}
