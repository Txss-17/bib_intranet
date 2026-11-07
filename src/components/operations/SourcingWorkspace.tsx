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
type Mission = {id:string;pole:Pole;purpose:string;title:string;requirements:string;status:string;priority:string;merchant_reference:string|null;due_date:string|null};
type Candidate = {id:string;mission_id:string;organization_name:string;offer_summary:string;candidate_status:string;comparison_notes:string|null;evidence_reference:string|null};
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
 const [filter,setFilter]=useState('all');
 const [selectedId,setSelectedId]=useState('');
 const [candidateName,setCandidateName]=useState('');
 const [offer,setOffer]=useState('');
 const [contact,setContact]=useState('');
 const [reviewStatus,setReviewStatus]=useState('identified');
 const [reviewNotes,setReviewNotes]=useState('');
 const [reviewReference,setReviewReference]=useState('');
 const [reviewCandidate,setReviewCandidate]=useState('');
 const key=['sourcing',pole,user?.id,profile?.test_account===true];
 const missions=useQuery({
  queryKey:[...key,'missions'],enabled:!!user&&!!profile,
  queryFn:async():Promise<Mission[]>=>{
   const {data,error}=await db.from('bib_sourcing_missions')
    .select('id,pole,purpose,title,requirements,status,priority,merchant_reference,due_date')
    .eq('pole',pole).order('created_at',{ascending:false}).limit(500);
   if(error)throw error;
   return data??[];
  },
 });
 const candidates=useQuery({
  queryKey:[...key,'candidates',selectedId],enabled:!!selectedId&&!!user&&!!profile,
  queryFn:async():Promise<Candidate[]>=>{
   const {data,error}=await db.from('bib_sourcing_candidates')
    .select('id,mission_id,organization_name,offer_summary,candidate_status,comparison_notes,evidence_reference')
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
    p_merchant_reference:merchantRef.trim()||null,p_due_date:null,
   });if(error)throw error;
  },
  onSuccess:()=>{
   setTitle('');setRequirements('');setMerchantRef('');
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
     <Input aria-label="Référence de demande marchand" value={merchantRef}
      onChange={e=>setMerchantRef(e.target.value)} maxLength={250}
      placeholder="Référence du besoin marchand, si applicable"/>
     <Button disabled={createMission.isPending||title.trim().length<5||requirements.trim().length<10}
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
     {c.comparison_notes&&<p className="text-xs text-muted-foreground">{c.comparison_notes}</p>}
     <Button size="sm" variant="outline" onClick={()=>{setReviewCandidate(c.id);
      setReviewStatus(c.candidate_status);setReviewNotes(c.comparison_notes??'');
      setReviewReference(c.evidence_reference??'');}}>Évaluer</Button>
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
     </div>}
    </div>)}
    {!candidates.isLoading&&!candidates.data?.length&&<p className="text-sm text-muted-foreground">
     Aucun partenaire encore prospecté pour cette mission.
    </p>}
   </div>}
  </CardContent>
 </Card>;
}
