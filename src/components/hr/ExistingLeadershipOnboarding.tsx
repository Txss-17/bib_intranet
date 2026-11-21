import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHrOnboardingPermissions } from '@/hooks/useHrEmployeeMutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import LeadershipEvidenceUploader from '@/components/hr/LeadershipEvidenceUploader';
import LeadershipEvidenceReviewAccess from '@/components/hr/LeadershipEvidenceReviewAccess';
import { openManagedDocument } from '@/lib/driveDocuments';

type Step = {subject_id:string;display_name:string;position:string;step_key:string;status:string;evidence_ref:string|null;note:string|null;reviewed_at:string|null;reviewer_id:string|null};
type ProofOption = {subject_id:string;step_key:string;evidence_ref:string;label:string};
const keys = ['identity','assignment','documents','hr_review','independent_review','access_security','integration'] as const;
const labels:Record<string,string> = {
 identity:'Identité et dossier nominatif',assignment:'Poste, pôle et rattachement',documents:'Documents obligatoires et signatures',
 hr_review:'Contrôle administratif RH',independent_review:'Visa indépendant',access_security:'Accès, périmètre et sécurité',
 integration:'Intégration et formations'
};
const registeredDocument = /^BIB-RH-DOC-[0-9]{4}-[0-9]{6,}$/;
const registeredOnboarding = /^(?:HR-[0-9]{8}-[0-9]{4}|BIB-RH-ONB-[0-9]{4}-[0-9]{6,})$/;
const assignmentReference = /^ACCESS:[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const requiresReviewNote = (stepKey:string) =>
 ['documents','hr_review','independent_review','access_security','integration'].includes(stepKey);
const hasPossibleReferenceFormat = (stepKey:string, value:string) => {
 const ref=value.trim();
 if(stepKey==='identity')return registeredOnboarding.test(ref)||registeredDocument.test(ref);
 if(stepKey==='assignment')return assignmentReference.test(ref);
 return registeredDocument.test(ref);
};
const proofGuidance:Record<string,string> = {
 identity:'Référence HR-… ou BIB-RH-ONB-… liée à ce compte, ou BIB-RH-DOC-… avec fichier BIB enregistré',
 assignment:'Référence ACCESS:<UUID> de l’affectation RBAC active de ce compte',
 documents:'Référence BIB-RH-DOC-… d’un document réellement importé et lié au titulaire ; contrôler la signature',
 hr_review:'Référence BIB-RH-DOC-… d’un contrôle RH documenté ; observations de 30 caractères minimum',
 independent_review:'Référence BIB-RH-DOC-… et second validateur distinct du contrôleur RH',
 access_security:'Référence BIB-RH-DOC-… du contrôle des accès et périmètres',
 integration:'Référence BIB-RH-DOC-… de la formation ou intégration vérifiée'
};
export default function ExistingLeadershipOnboarding() {
 const {user}=useAuth();
 const permissions=useHrOnboardingPermissions();
 const cache=useQueryClient();
 const [evidence,setEvidence]=useState<Record<string,string>>({});
 const [notes,setNotes]=useState<Record<string,string>>({});
 const [resolvedProof,setResolvedProof]=useState<{subjectId:string;reference:string;documentId:string}|null>(null);
 const {data:steps=[],isLoading,isError,refetch}=useQuery({
  queryKey:['leadership-onboarding'],
  enabled:permissions.data?.read===true,
  queryFn:async():Promise<Step[]>=>{
   const {data,error}=await supabase.rpc('list_existing_leadership_onboarding' as never);
   if(error)throw error;
   return (data??[]) as Step[];
  }
 });
 const {data:registeredEvidenceOptions=[],isError:proofOptionsError,refetch:refetchProofOptions}=useQuery({
  queryKey:['leadership-evidence-options'],
  enabled:permissions.data?.read===true,
  queryFn:async():Promise<ProofOption[]>=>{
   const {data,error}=await supabase.rpc('rh_leadership_evidence_options' as never);
   if(error)throw error;
   return (data??[]) as ProofOption[];
  }
 });
 const resolveProof=useMutation({
  mutationFn:async({subjectId,reference}:{subjectId:string;reference:string})=>{
   const {data,error}=await supabase.rpc('rh_open_leadership_evidence' as never,{
    p_subject_id:subjectId,p_evidence_ref:reference
   } as never);
   if(error)throw error;
   if(typeof data!=='string')throw new Error('Pièce BIB non disponible.');
   return {subjectId,reference,documentId:data};
  },
  onSuccess:(value)=>setResolvedProof(value)
 });
 const review=useMutation({
  mutationFn:async({step,decision}:{step:Step;decision:'validated'|'rejected'})=>{
   const id=step.subject_id+':'+step.step_key;
   const {error}=await supabase.rpc('review_existing_leadership_onboarding_step' as never,{
    p_subject:step.subject_id,p_step:step.step_key,p_decision:decision,
    p_evidence_ref:(evidence[id]??'').trim(),p_note:(notes[id]??'').trim()||null
   } as never);
   if(error)throw error;
  },
  onSuccess:(_data,variables)=>{
   const id=variables.step.subject_id+':'+variables.step.step_key;
   setEvidence(current=>({...current,[id]:''}));
   setNotes(current=>({...current,[id]:''}));
   void cache.invalidateQueries({queryKey:['leadership-onboarding']});
  }
 });
 if(permissions.isLoading)return <p role="status">Vérification des habilitations RH…</p>;
 if(permissions.isError||!permissions.data?.read)return null;
 const subjects=[...new Map(steps.map(s=>[s.subject_id,{id:s.subject_id,name:s.display_name,position:s.position}])).values()];
 return <Card>
  <CardHeader><CardTitle>Validation des étapes — comptes existants CEO / RH</CardTitle>
   <CardDescription>Régularisation des comptes existants sans création de compte ni modification automatique des accès. Chaque étape exige une preuve et un validateur habilité distinct du titulaire.</CardDescription>
  </CardHeader>
  <CardContent className="space-y-6">
   {isLoading?<p>Chargement des étapes…</p>:isError?<div role="alert">Étapes indisponibles (migration et droits à vérifier). <Button variant="outline" onClick={()=>void refetch()}>Réessayer</Button></div>:null}
   {subjects.map(subject=>{
    const rows=keys.map(key=>steps.find(s=>s.subject_id===subject.id&&s.step_key===key)).filter((s):s is Step=>Boolean(s));
    return <section key={subject.id} className="space-y-3 rounded-md border p-4">
     <h3 className="font-semibold">{subject.name} — {subject.position==='ceo'?'CEO':'Responsable RH'}</h3>
     <p className="text-sm text-muted-foreground">{rows.filter(s=>s.status==='validated').length} / {rows.length} étapes validées</p>
     {subject.id===user?.id&&<LeadershipEvidenceUploader subjectId={subject.id} />}
     {subject.id===user?.id&&<LeadershipEvidenceReviewAccess subjectId={subject.id} />}
     {rows.map((step,index)=>{
      const id=step.subject_id+':'+step.step_key;
      const previousOk=rows.slice(0,index).every(s=>s.status==='validated');
      const independentReviewerConflict=step.step_key==='independent_review' &&
        rows.find(s=>s.step_key==='hr_review')?.reviewer_id===user?.id;
      const canReview=permissions.data?.validate===true&&user?.id!==subject.id&&
        previousOk&&step.status!=='validated'&&!independentReviewerConflict;
      const referenceReady=hasPossibleReferenceFormat(step.step_key,evidence[id]??'');
      const noteReady=!requiresReviewNote(step.step_key)||(notes[id]??'').trim().length>=30;
      const availableReferences=registeredEvidenceOptions.filter(opt=>opt.subject_id===subject.id&&opt.step_key===step.step_key);
      return <div className="space-y-2 border-t pt-3" key={step.step_key}>
       <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{index+1}. {labels[step.step_key]}</strong>
        <Badge variant={step.status==='validated'?'default':step.status==='rejected'?'destructive':'outline'}>{step.status==='validated'?'Validé':step.status==='rejected'?'Refusé':'À vérifier'}</Badge></div>
       {step.status==='validated'?<p className="text-xs text-muted-foreground">Preuve enregistrée : <span className="font-mono">{step.evidence_ref}</span> · Revue le {step.reviewed_at?new Date(step.reviewed_at).toLocaleString('fr-FR'):'—'}</p>:<>
        {step.note?.startsWith('Contrôle rouvert') && <p role="alert" className="rounded border border-amber-500/50 p-2 text-xs text-amber-700">{step.note}</p>}
        {independentReviewerConflict && <p role="status" className="text-xs text-amber-700">Ce visa nécessite une personne habilitée différente de celle qui a réalisé le contrôle RH.</p>}
        <p className="text-xs text-muted-foreground">{proofGuidance[step.step_key]}. Une mention « Aucun », un nom de poste ou un lien externe ne constituent pas une preuve.</p>
        {availableReferences.length>0&&
         <div className="space-y-1">
          <label className="text-xs font-medium" htmlFor={'rh-proof-option-'+id}>Preuves enregistrées et rattachées au compte</label>
          <select id={'rh-proof-option-'+id} className="h-10 w-full rounded-md border bg-background px-2 text-sm"
           value={availableReferences.some(o=>o.evidence_ref===(evidence[id]??''))?(evidence[id]??''):''}
           disabled={!canReview} onChange={e=>setEvidence(v=>({...v,[id]:e.target.value}))}>
           <option value="">Choisir une référence BIB vérifiée</option>
           {availableReferences.map(opt=><option key={opt.evidence_ref} value={opt.evidence_ref}>{opt.label}</option>)}
          </select>
         </div>}
        {!proofOptionsError&&availableReferences.length===0&&
         <p className="text-xs text-amber-700">Aucune référence justificative disponible pour cette étape et ce compte. Enregistrez d’abord la pièce réelle dans Documents BIB / Dossiers collaborateurs, ou vérifiez les affectations du compte.</p>}
        {proofOptionsError&&<div role="alert" className="flex items-center gap-2 text-xs text-destructive">
          <span>Impossible de charger les références justificatives.</span>
          <Button type="button" variant="outline" size="sm" onClick={()=>void refetchProofOptions()}>Réessayer</Button>
        </div>}
        <Input aria-label={'Référence de preuve — '+labels[step.step_key]} placeholder={proofGuidance[step.step_key]} value={evidence[id]??''} maxLength={160} onChange={e=>setEvidence(v=>({...v,[id]:e.target.value}))} disabled={!canReview}/>
        {canReview&&(evidence[id]??'').trim()&&!referenceReady&&<p role="status" className="text-xs text-destructive">Format de référence invalide. Sélectionnez une référence attribuée par BIB et associée à ce compte.</p>}
        {canReview&&referenceReady&&registeredDocument.test((evidence[id]??'').trim())&&
         <div className="space-y-1 rounded-md border p-2">
          <p className="text-xs text-muted-foreground">
           Pour les pièces BIB, le relecteur doit avoir le droit nominatif de consultation
           et ouvrir le PDF avant de valider l’étape. Sa préparation est tracée côté serveur ; le relecteur doit encore vérifier le contenu et consigner ses observations.
          </p>
          <div className="flex flex-wrap gap-2">
           <Button type="button" size="sm" variant="outline" disabled={resolveProof.isPending}
            onClick={()=>{setResolvedProof(null);resolveProof.mutate({subjectId:subject.id,reference:(evidence[id]??'').trim()});}}>
            Vérifier mon accès à la pièce
           </Button>
           {resolvedProof?.subjectId===subject.id&&resolvedProof.reference===(evidence[id]??'').trim()&&
            <Button type="button" size="sm" variant="outline"
             onClick={()=>openManagedDocument('/documents?document='+resolvedProof.documentId)}>
             Ouvrir la pièce dans Documents BIB
            </Button>}
          </div>
          {resolveProof.isError&&<p role="alert" className="text-xs text-destructive">
           Pièce inaccessible. Le titulaire doit autoriser nominativement votre consultation ou vérifier le rattachement du fichier.
          </p>}
         </div>}

        <Textarea aria-label={'Note de contrôle — '+labels[step.step_key]} placeholder={requiresReviewNote(step.step_key)?'Préciser la pièce vérifiée, les contrôles effectués et, le cas échéant, la signature constatée (30 caractères minimum)':'Observations et motif de décision'} value={notes[id]??''} onChange={e=>setNotes(v=>({...v,[id]:e.target.value}))} disabled={!canReview}/>
        <div className="flex gap-2"><Button size="sm" disabled={!canReview||!referenceReady||!noteReady||review.isPending} onClick={()=>review.mutate({step,decision:'validated'})}>Valider avec preuve vérifiable</Button>
        <Button size="sm" variant="outline" disabled={!canReview||(notes[id]??'').trim().length<20||review.isPending} onClick={()=>review.mutate({step,decision:'rejected'})}>Refuser</Button></div>
       </>}
      </div>;
     })}
    </section>;
   })}
   {review.isError&&<p role="alert" className="text-sm text-destructive">{
     review.error instanceof Error && review.error.message.includes('leadership_evidence_not_verifiable')
       ? 'La référence fournie n’est pas retrouvée dans le registre RH/BIB du titulaire ou ne pointe pas vers une pièce documentaire contrôlée.'
       : review.error instanceof Error && review.error.message.includes('leadership_evidence_not_opened_by_reviewer')
         ? 'Ouvrez la pièce via Documents BIB avec votre propre compte avant de valider ; une référence seule ne suffit pas.'
       : review.error instanceof Error && review.error.message.includes('Previous onboarding steps')
         ? 'Les étapes précédentes doivent posséder une preuve vérifiable avant de poursuivre.'
         : review.error instanceof Error?review.error.message:'Validation refusée'
   }</p>}
   {!isLoading&&!isError&&!subjects.length&&<p className="text-sm text-muted-foreground">Aucun compte CEO ou Responsable RH éligible visible.</p>}
  </CardContent>
 </Card>;
}
