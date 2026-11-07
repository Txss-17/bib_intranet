import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase as typedSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// The sourcing migration is pending type regeneration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = typedSupabase as any;
type Pole = 'supplier' | 'ops';
type Mission = {id:string;pole:Pole;purpose:string;title:string;requirements:string;status:string;priority:string;merchant_reference:string|null;merchant_id:string|null;due_date:string|null};
type Candidate = {id:string;mission_id:string;organization_name:string;offer_summary:string;candidate_status:string;comparison_notes:string|null;evidence_reference:string|null;currency:string|null;price_amount:number|null;moq:number|null;lead_time_days:number|null;sla_percent:number|null;coverage:string|null;followup_due_at:string|null;converted_application_id:string|null};
const purposes: Record<string,string> = {proactive:'Proactif',merchant_request:'Demande marchand',substitution:'Substitution'};
const statuses:Record<string,string> = {identified:'Identifié',contacted:'Contacté',responded:'Réponse reçue',evaluating:'En comparaison',shortlisted:'Présélectionné',not_selected:'Non retenu'};

export default function SourcingWorkspace({pole}:{pole:Pole}) {
 const {user,profile}=useAuth();
 const qc=useQueryClient();
 const [purpose,setPurpose]=useState('proactive');
 const [priority,setPriority]=useState('standard');
 const [title,setTitle]=useState('');
 const [requirements,setRequirements]=useState('');
 const [merchantRef,setMerchantRef]=useState('');
 const [merchantId,setMerchantId]=useState('');
 const [filter,setFilter]=useState('all');
 const [selectedId,setSelectedId]=useState('');
 const [candidateName,setCandidateName]=useState('');
 const [offer,setOffer]=useState('');
 const [contact,setContact]=useState('');
 const [reviewStatus,setReviewStatus]=useState('identified');
 const [reviewNotes,setReviewNotes]=useState('');
 const [reviewReference,setReviewReference]=useState('');
 const [reviewCandidate,setReviewCandidate]=useState('');
 const [offerPrice,setOfferPrice]=useState('');
 const [offerCurrency,setOfferCurrency]=useState('EUR');
 const [offerMoq,setOfferMoq]=useState('');
 const [offerLead,setOfferLead]=useState('');
 const [offerSla,setOfferSla]=useState('');
 const [offerCoverage,setOfferCoverage]=useState('');
 const [followupDate,setFollowupDate]=useState('');
 const [followupNote,setFollowupNote]=useState('');
 const [conversionEmail,setConversionEmail]=useState('');
 const [conversionEvidence,setConversionEvidence]=useState('');
 const key=['sourcing',pole,user?.id,profile?.test_account===true];
 const merchantAccounts=useQuery({
  queryKey:['sourcing-merchant-accounts',user?.id,profile?.test_account===true],
  enabled:!!user&&!!profile&&purpose==='merchant_request',
  queryFn:async():Promise<{id:string;company_name:string}[]>=>{
   const {data,error}=await db.from('user_accounts').select('id,company_name').order('company_name').limit(500);
   if(error)throw error;
   return data??[];
  },
 });
 const missions=useQuery({
  queryKey:[...key,'missions'],enabled:!!user&&!!profile,
  queryFn:async():Promise<Mission[]>=>{
   const {data,error}=await db.from('bib_sourcing_missions')
    .select('id,pole,purpose,title,requirements,status,priority,merchant_reference,merchant_id,due_date')
    .eq('pole',pole).order('created_at',{ascending:false}).limit(500);
   if(error)throw error;
   return data??[];
  },
 });
 const candidates=useQuery({
  queryKey:[...key,'candidates',selectedId],enabled:!!selectedId&&!!user&&!!profile,
  queryFn:async():Promise<Candidate[]>=>{
   const {data,error}=await db.from('bib_sourcing_candidates')
    .select('id,mission_id,organization_name,offer_summary,candidate_status,comparison_notes,evidence_reference,currency,price_amount,moq,lead_time_days,sla_percent,coverage,followup_due_at,converted_application_id')
    .eq('mission_id',selectedId).order('created_at',{ascending:false}).limit(500);
   if(error)throw error;
   return data??[];
  },
 });
 const createMission=useMutation({
  mutationFn:async()=>{
   const {error}=await db.rpc('bib_create_sourcing_mission',{
    p_pole:pole,p_purpose:purpose,p_title:title.trim(),
    p_requirements:requirements.trim(),p_priority:priority,
    p_merchant_reference:merchantRef.trim()||null,p_due_date:null,p_merchant_id:merchantId||null,
   });if(error)throw error;
  },
  onSuccess:()=>{
   setTitle('');setRequirements('');setMerchantRef('');setMerchantId('');
   void qc.invalidateQueries({queryKey:key});
   toast.success('Mission de sourcing enregistrée');
  },
  onError:(e:Error)=>toast.error('Mission refusée',{description:e.message}),
 });
 const addCandidate=useMutation({
  mutationFn:async()=>{
   const {error}=await db.rpc('bib_add_sourcing_candidate',{
    p_mission:selectedId,p_name:candidateName.trim(),p_offer:offer.trim(),
    p_contact_reference:contact.trim()||null,
   });if(error)throw error;
  },
  onSuccess:()=>{
   setCandidateName('');setOffer('');setContact('');
   void qc.invalidateQueries({queryKey:[...key,'candidates',selectedId]});
   toast.success('Prospect ajouté au sourcing');
  },
  onError:(e:Error)=>toast.error('Prospect refusé',{description:e.message}),
 });
 const review=useMutation({
  mutationFn:async()=>{
   const {error}=await db.rpc('bib_update_sourcing_review',{
    p_candidate:reviewCandidate,p_status:reviewStatus,
    p_comparison_notes:reviewNotes.trim(),p_evidence_reference:reviewReference.trim()||null,
   });if(error)throw error;
  },
  onSuccess:()=>{
   setReviewCandidate('');setReviewNotes('');setReviewReference('');
   void qc.invalidateQueries({queryKey:[...key,'candidates',selectedId]});
   toast.success('Comparaison enregistrée');
  },
  onError:(e:Error)=>toast.error('Décision refusée',{description:e.message}),
 });
 const metrics=useMutation({
  mutationFn:async()=>{
   if(!reviewCandidate)throw new Error('Choisir un prospect');
   const {error}=await db.rpc('bib_set_sourcing_offer_metrics',{
    p_candidate:reviewCandidate,p_currency:offerCurrency.trim().toUpperCase()||null,
    p_price:offerPrice===''?null:Number(offerPrice),
    p_moq:offerMoq===''?null:Number(offerMoq),p_lead_days:offerLead===''?null:Number(offerLead),
    p_sla_percent:offerSla===''?null:Number(offerSla),p_coverage:offerCoverage.trim()||null,
   });if(error)throw error;
  },
  onSuccess:()=>{toast.success('Critères comparatifs enregistrés');
   void qc.invalidateQueries({queryKey:[...key,'candidates',selectedId]});},
  onError:(e:Error)=>toast.error('Comparaison impossible',{description:e.message}),
 });
 const followup=useMutation({
  mutationFn:async(candidateId:string)=>{
   if(!followupDate||!followupNote.trim())throw new Error('Date et note requises');
   const {error}=await db.rpc('bib_record_sourcing_followup',{
    p_candidate:candidateId,p_due_at:new Date(followupDate).toISOString(),
    p_outcome:'scheduled',p_note:followupNote.trim(),
   });if(error)throw error;
  },
  onSuccess:()=>{toast.success('Relance planifiée');setFollowupDate('');setFollowupNote('');
   void qc.invalidateQueries({queryKey:[...key,'candidates',selectedId]});},
  onError:(e:Error)=>toast.error('Relance refusée',{description:e.message}),
 });
 const conversion=useMutation({
  mutationFn:async(candidateId:string)=>{
   const {error}=await db.rpc('bib_convert_sourcing_to_supplier_application',{
    p_candidate:candidateId,p_email:conversionEmail.trim().toLowerCase(),
    p_evidence:conversionEvidence.trim(),
   });if(error)throw error;
  },
  onSuccess:()=>{toast.success('Candidature fournisseur créée, qualification requise');
   setConversionEmail('');setConversionEvidence('');
   void qc.invalidateQueries({queryKey:[...key,'candidates',selectedId]});},
  onError:(e:Error)=>toast.error('Conversion refusée',{description:e.message}),
 });
 const filtered=(missions.data??[]).filter(m=>filter==='all'||m.purpose===filter);
 const selected=missions.data?.find(m=>m.id===selectedId);
 return <Card>
  <CardHeader>
   <CardTitle>Sourcing {pole==='supplier'?'fournisseurs et produits':'prestataires logistiques'}</CardTitle>
   <p className="text-sm text-muted-foreground">
    Recherches proactives, demandes marchands et partenaires de remplacement.
    Le portefeuille de prospection reste sans plafond.
    La présélection ne vaut ni contrat, ni validation d'audit, ni activation pilote.
   </p>
  </CardHeader>
  <CardContent className="space-y-4">
   <details className="rounded-lg border p-3">
    <summary className="cursor-pointer font-medium">Créer une mission de sourcing</summary>
    <div className="mt-3 space-y-2">
     <select aria-label="Motif du sourcing" className="w-full rounded-md border bg-background p-2"
      value={purpose} onChange={e=>setPurpose(e.target.value)}>
      {Object.entries(purposes).map(([value,label])=><option value={value} key={value}>{label}</option>)}
     </select>
     <select aria-label="Priorité" className="w-full rounded-md border bg-background p-2"
      value={priority} onChange={e=>setPriority(e.target.value)}>
      <option value="low">Basse</option><option value="standard">Standard</option>
      <option value="high">Haute</option><option value="critical">Critique</option>
     </select>
     <Input aria-label="Titre de la mission" value={title} onChange={e=>setTitle(e.target.value)}
      placeholder="Produit, fournisseur ou prestation recherchée" maxLength={180}/>
     <Textarea aria-label="Critères de recherche" value={requirements}
      onChange={e=>setRequirements(e.target.value)} maxLength={5000}
      placeholder={pole==='supplier'
       ? 'Produits, MOQ, prix cible, volume, certificats, délais, pays…'
       : 'Zones couvertes, 3PL, entreposage, transport, retours, SLA, capacité…'}/>
     {purpose==='merchant_request'&&<div className="space-y-1">
      <label className="text-sm font-medium" htmlFor="sourcing-merchant">Marchand demandeur</label>
      <select id="sourcing-merchant" value={merchantId} onChange={e=>setMerchantId(e.target.value)}
       className="w-full rounded-md border bg-background p-2">
       <option value="">Sélectionner un marchand enregistré</option>
       {(merchantAccounts.data??[]).map(m=><option key={m.id} value={m.id}>{m.company_name}</option>)}
      </select>
      {merchantAccounts.isError&&<p role="alert" className="text-destructive text-sm">Référentiel des marchands indisponible.</p>}
     </div>}
     <Input aria-label="Référence de demande marchand" value={merchantRef}
      onChange={e=>setMerchantRef(e.target.value)} maxLength={250}
      placeholder="Référence du besoin marchand, si applicable"/>
     <Button disabled={createMission.isPending||title.trim().length<5||requirements.trim().length<10||(purpose==='merchant_request'&&(!merchantId||merchantAccounts.isError))}
      onClick={()=>createMission.mutate()}>Enregistrer la mission</Button>
    </div>
   </details>
   {missions.isError&&<p role="alert" className="text-sm text-destructive">
    Registre sourcing inaccessible : migration ou habilitations à vérifier.
   </p>}
   {missions.isLoading&&<p role="status">Chargement des missions…</p>}
   {!missions.isError&&<div className="space-y-2">
    <select aria-label="Filtrer les missions" className="w-full rounded-md border bg-background p-2"
     value={filter} onChange={e=>setFilter(e.target.value)}>
     <option value="all">Tous les types</option>
     {Object.entries(purposes).map(([value,label])=><option key={value} value={value}>{label}</option>)}
    </select>
    <div className="flex flex-wrap gap-2">
     {filtered.map(m=><Button type="button" key={m.id} size="sm"
      variant={selectedId===m.id?'default':'outline'} onClick={()=>{setSelectedId(m.id);setReviewCandidate('');}}>
      {m.title} · {purposes[m.purpose]}</Button>)}
    </div>
    {!filtered.length&&!missions.isLoading&&<p className="text-sm text-muted-foreground">
     Aucune mission pour ce filtre. Le sourcing peut être initié indépendamment des candidatures.
    </p>}
   </div>}
   {selected&&<div className="space-y-3 rounded-lg border p-3">
    <div className="flex flex-wrap items-center gap-2">
     <h3 className="font-medium">{selected.title}</h3>
     <Badge variant="secondary">{selected.status}</Badge>
     <Badge variant="outline">{selected.priority}</Badge>
    </div>
    <p className="whitespace-pre-wrap text-sm">{selected.requirements}</p>
    {selected.merchant_reference&&<p className="text-xs text-muted-foreground">
     Demande marchand : {selected.merchant_reference}
    </p>}
    <details className="rounded-md border p-3">
     <summary className="cursor-pointer font-medium">Ajouter un partenaire prospecté</summary>
     <div className="mt-3 space-y-2">
      <Input aria-label="Organisation prospectée" value={candidateName}
       onChange={e=>setCandidateName(e.target.value)} placeholder="Nom de la société" maxLength={200}/>
      <Textarea aria-label="Offre ou réponse proposée" value={offer}
       onChange={e=>setOffer(e.target.value)} placeholder="Prix, capacités, MOQ, SLA, délais…" maxLength={3000}/>
      <Input aria-label="Référence de contact" value={contact}
       onChange={e=>setContact(e.target.value)} placeholder="E-mail ou référence CRM interne" maxLength={500}/>
      <Button disabled={addCandidate.isPending||candidateName.trim().length<2||offer.trim().length<5}
       onClick={()=>addCandidate.mutate()}>Ajouter au registre</Button>
     </div>
    </details>
    {candidates.isError&&<p role="alert">Prospects indisponibles.</p>}
    {(candidates.data??[]).map(c=><div key={c.id} className="rounded-md border p-3 space-y-2">
     <div className="flex flex-wrap justify-between gap-2">
      <span className="font-medium">{c.organization_name}</span>
      <Badge variant="outline">{statuses[c.candidate_status]??c.candidate_status}</Badge>
     </div>
     <p className="text-sm">{c.offer_summary}</p>
     <p className="text-xs text-muted-foreground">Prix : {c.price_amount??'—'} {c.currency??''} · MOQ : {c.moq??'—'} · Délai : {c.lead_time_days??'—'} j · SLA : {c.sla_percent??'—'} % · Zone : {c.coverage??'—'}</p>
     {c.followup_due_at&&<p className="text-xs text-muted-foreground">Relance prévue : {new Date(c.followup_due_at).toLocaleString('fr-FR')}</p>}
     {c.converted_application_id&&<p className="text-xs">Candidature fournisseur : {c.converted_application_id}</p>}
     {c.comparison_notes&&<p className="text-xs text-muted-foreground">{c.comparison_notes}</p>}
     <Button size="sm" variant="outline" onClick={()=>{setReviewCandidate(c.id);
      setReviewStatus(c.candidate_status);setReviewNotes(c.comparison_notes??'');
      setReviewReference(c.evidence_reference??'');
      setOfferCurrency(c.currency??'EUR');setOfferPrice(c.price_amount==null?'':String(c.price_amount));
      setOfferMoq(c.moq==null?'':String(c.moq));setOfferLead(c.lead_time_days==null?'':String(c.lead_time_days));
      setOfferSla(c.sla_percent==null?'':String(c.sla_percent));setOfferCoverage(c.coverage??'');
      }}>Évaluer</Button>
     {reviewCandidate===c.id&&<div className="space-y-2">
      <select aria-label="Statut du prospect" className="w-full rounded-md border bg-background p-2"
       value={reviewStatus} onChange={e=>setReviewStatus(e.target.value)}>
       {Object.entries(statuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}
      </select>
      <Textarea aria-label="Comparaison et justification" value={reviewNotes}
       onChange={e=>setReviewNotes(e.target.value)} maxLength={5000}
       placeholder="Comparaison avec les besoins, risques et observations"/>
      <Input aria-label="Référence de preuve" value={reviewReference}
       onChange={e=>setReviewReference(e.target.value)} maxLength={500}
       placeholder="Référence du devis, des pièces ou de la décision"/>
      <Button disabled={review.isPending||
       (['shortlisted','not_selected'].includes(reviewStatus)&&reviewReference.trim().length<8)}
       onClick={()=>review.mutate()}>Enregistrer l'évaluation</Button>
      <div className="grid grid-cols-2 gap-2">
       <Input aria-label="Prix proposé" type="number" min="0" value={offerPrice} onChange={e=>setOfferPrice(e.target.value)} placeholder="Prix proposé"/>
       <Input aria-label="Devise" value={offerCurrency} onChange={e=>setOfferCurrency(e.target.value)} maxLength={3} placeholder="EUR"/>
       <Input aria-label="MOQ" type="number" min="0" value={offerMoq} onChange={e=>setOfferMoq(e.target.value)} placeholder="MOQ"/>
       <Input aria-label="Délai jours" type="number" min="0" value={offerLead} onChange={e=>setOfferLead(e.target.value)} placeholder="Délai (jours)"/>
       <Input aria-label="SLA pourcentage" type="number" min="0" max="100" value={offerSla} onChange={e=>setOfferSla(e.target.value)} placeholder="SLA (%)"/>
       <Input aria-label="Couverture géographique" value={offerCoverage} onChange={e=>setOfferCoverage(e.target.value)} placeholder="Zones couvertes"/>
      </div>
      <Button variant="outline" disabled={metrics.isPending} onClick={()=>metrics.mutate()}>Enregistrer les critères comparatifs</Button>
      <div className="space-y-2 border-t pt-2">
       <p className="text-sm font-medium">Planifier une relance</p>
       <Input aria-label="Date de relance" type="datetime-local" value={followupDate} onChange={e=>setFollowupDate(e.target.value)}/>
       <Input aria-label="Motif de relance" value={followupNote} onChange={e=>setFollowupNote(e.target.value)} placeholder="Motif et prochaine action" maxLength={2000}/>
       <Button variant="outline" disabled={followup.isPending||!followupDate||followupNote.trim().length<5} onClick={()=>followup.mutate(c.id)}>Enregistrer la relance</Button>
      </div>
      {pole==='supplier'&&reviewStatus==='shortlisted'&&<div className="space-y-2 border-t pt-2">
       <p className="text-sm font-medium">Créer un dossier de candidature fournisseur</p>
       <p className="text-xs text-muted-foreground">Création d'un dossier non qualifié, sans contrat ni activation. En sandbox, la conversion est refusée.</p>
       <Input aria-label="Adresse fournisseur vérifiée" type="email" value={conversionEmail} onChange={e=>setConversionEmail(e.target.value)} placeholder="E-mail du fournisseur"/>
       <Input aria-label="Preuve de conversion" value={conversionEvidence} onChange={e=>setConversionEvidence(e.target.value)} maxLength={500} placeholder="Référence du consentement ou accord de mise en relation"/>
       <Button variant="outline" disabled={conversion.isPending||!!c.converted_application_id||conversionEvidence.trim().length<8||!conversionEmail.includes('@')||profile?.test_account===true} onClick={()=>conversion.mutate(c.id)}>Créer la candidature</Button>
      </div>}
     </div>}
    </div>)}
    {!candidates.isLoading&&!candidates.data?.length&&<p className="text-sm text-muted-foreground">
     Aucun partenaire encore prospecté pour cette mission.
    </p>}
   </div>}
  </CardContent>
 </Card>;
}
