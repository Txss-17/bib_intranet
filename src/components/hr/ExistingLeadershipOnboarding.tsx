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

type Step = {subject_id:string;display_name:string;position:string;step_key:string;status:string;evidence_ref:string|null;note:string|null;reviewed_at:string|null;reviewer_id:string|null};
const keys = ['identity','assignment','documents','hr_review','independent_review','access_security','integration'] as const;
const labels:Record<string,string> = {
 identity:'Identité et dossier nominatif',assignment:'Poste, pôle et rattachement',documents:'Documents obligatoires et signatures',
 hr_review:'Contrôle administratif RH',independent_review:'Visa indépendant',access_security:'Accès, périmètre et sécurité',
 integration:'Intégration et formations'
};
export default function ExistingLeadershipOnboarding() {
 const {user}=useAuth();
 const permissions=useHrOnboardingPermissions();
 const cache=useQueryClient();
 const [evidence,setEvidence]=useState<Record<string,string>>({});
 const [notes,setNotes]=useState<Record<string,string>>({});
 const {data:steps=[],isLoading,isError,refetch}=useQuery({
  queryKey:['leadership-onboarding'],
  enabled:permissions.data?.read===true,
  queryFn:async():Promise<Step[]>=>{
   const {data,error}=await supabase.rpc('list_existing_leadership_onboarding' as never);
   if(error)throw error;
   return (data??[]) as Step[];
  }
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
  onSuccess:()=>void cache.invalidateQueries({queryKey:['leadership-onboarding']})
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
     {rows.map((step,index)=>{
      const id=step.subject_id+':'+step.step_key;
      const previousOk=rows.slice(0,index).every(s=>s.status==='validated');
      const canReview=permissions.data?.validate===true&&user?.id!==subject.id&&previousOk&&step.status!=='validated';
      return <div className="space-y-2 border-t pt-3" key={step.step_key}>
       <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{index+1}. {labels[step.step_key]}</strong>
        <Badge variant={step.status==='validated'?'default':step.status==='rejected'?'destructive':'outline'}>{step.status==='validated'?'Validé':step.status==='rejected'?'Refusé':'À vérifier'}</Badge></div>
       {step.status==='validated'?<p className="text-xs text-muted-foreground">Preuve : {step.evidence_ref} · Validé le {step.reviewed_at?new Date(step.reviewed_at).toLocaleString('fr-FR'):'—'}</p>:<>
        <Input aria-label={'Référence de preuve — '+labels[step.step_key]} placeholder="Référence documentaire ou justificatif vérifiable" value={evidence[id]??''} onChange={e=>setEvidence(v=>({...v,[id]:e.target.value}))} disabled={!canReview}/>
        <Textarea aria-label={'Note de contrôle — '+labels[step.step_key]} placeholder="Observations et motif de décision" value={notes[id]??''} onChange={e=>setNotes(v=>({...v,[id]:e.target.value}))} disabled={!canReview}/>
        <div className="flex gap-2"><Button size="sm" disabled={!canReview||!(evidence[id]??'').trim()||review.isPending} onClick={()=>review.mutate({step,decision:'validated'})}>Valider avec preuve</Button>
        <Button size="sm" variant="outline" disabled={!canReview||!(notes[id]??'').trim()||review.isPending} onClick={()=>review.mutate({step,decision:'rejected'})}>Refuser</Button></div>
       </>}
      </div>;
     })}
    </section>;
   })}
   {review.isError&&<p role="alert" className="text-sm text-destructive">{review.error instanceof Error?review.error.message:'Validation refusée'}</p>}
   {!isLoading&&!isError&&!subjects.length&&<p className="text-sm text-muted-foreground">Aucun compte CEO ou Responsable RH éligible visible.</p>}
  </CardContent>
 </Card>;
}
