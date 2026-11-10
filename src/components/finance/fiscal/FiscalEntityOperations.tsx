import {useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {supabase} from '@/integrations/supabase/client';
import {useAuth} from '@/hooks/useAuth';
import {usePermissions} from '@/hooks/usePermissions';
import {Button} from '@/components/ui/button';
import {Card,CardContent,CardHeader,CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';

type LegalEntity={id:string;legal_name:string;country_code:string;legal_form:string;
 status:'project'|'reviewed'|'active'|'suspended';registration_identifier?:string|null;review_reference?:string|null};
type Grant={entity_id:string;user_id:string;can_update:boolean;expires_at:string};
type SavedView={id:string;label:string;filters:Record<string,string>};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function callRpc<T>(name:string,args?:Record<string,unknown>):Promise<T>{
 const {data,error}=await supabase.rpc(name as never,args as never);
 if(error)throw error;
 return data as T;
}

// Access is always rechecked inside the SECURITY DEFINER RPCs.
// This component does not grant rights merely because a user belongs to a pole.
export default function FiscalEntityOperations(){
 const {user,profile}=useAuth();
 const {can}=usePermissions();
 const qc=useQueryClient();
 const isCEO=Boolean(user&&profile?.position==='ceo'&&profile?.test_account===false);
 const canReview=!isCEO&&can('compliance.contracts','validate');
 const [reviewEntity,setReviewEntity]=useState('');
 const [registration,setRegistration]=useState('');
 const [reviewReference,setReviewReference]=useState('');
 const [grantEntity,setGrantEntity]=useState('');
 const [grantUser,setGrantUser]=useState('');
 const [canUpdate,setCanUpdate]=useState(false);
 const [expires,setExpires]=useState('');
 const [viewLabel,setViewLabel]=useState('');
 const [viewEntity,setViewEntity]=useState('');
 const [viewPole,setViewPole]=useState('');
 const [viewRisk,setViewRisk]=useState('');
 const [viewStatus,setViewStatus]=useState('');
 const entityKey=['bib-fiscal-legal-entities',user?.id];
 const reviewKey=['bib-fiscal-legal-reviews',user?.id];
 const grantKey=['bib-fiscal-entity-grants',user?.id];
 const viewKey=['bib-fiscal-saved-views',user?.id];
 const entities=useQuery({queryKey:entityKey,enabled:isCEO,
  queryFn:()=>callRpc<LegalEntity[]>('list_bib_fiscal_legal_entities')});
 const reviews=useQuery({queryKey:reviewKey,enabled:canReview,
  queryFn:()=>callRpc<LegalEntity[]>('list_bib_fiscal_entity_reviews')});
 const grants=useQuery({queryKey:grantKey,enabled:isCEO,
  queryFn:()=>callRpc<Grant[]>('list_bib_fiscal_entity_grants')});
 const views=useQuery({queryKey:viewKey,enabled:isCEO,
  queryFn:()=>callRpc<SavedView[]>('list_bib_fiscal_saved_views')});
 const review=useMutation({mutationFn:()=>callRpc('bib_review_fiscal_legal_entity',{
  p_id:reviewEntity,p_registration_identifier:registration.trim(),p_reference:reviewReference.trim()}),
  onSuccess:()=>{setReviewEntity('');setRegistration('');setReviewReference('');
   void qc.invalidateQueries({queryKey:reviewKey});void qc.invalidateQueries({queryKey:entityKey});}});
 const activate=useMutation({mutationFn:(id:string)=>callRpc('bib_activate_fiscal_legal_entity',{p_id:id}),
  onSuccess:()=>void qc.invalidateQueries({queryKey:entityKey})});
 const suspend=useMutation({mutationFn:(id:string)=>callRpc('bib_suspend_fiscal_legal_entity',{p_id:id}),
  onSuccess:()=>void qc.invalidateQueries({queryKey:entityKey})});
 const grant=useMutation({mutationFn:()=>callRpc('bib_grant_fiscal_entity_access',{
  p_entity_id:grantEntity,p_user_id:grantUser,p_can_update:canUpdate,
  p_expires_at:expires?new Date(expires+'T23:59:59Z').toISOString():null}),
  onSuccess:()=>{setGrantUser('');setExpires('');setCanUpdate(false);
   void qc.invalidateQueries({queryKey:grantKey});}});
 const revoke=useMutation({mutationFn:(g:Grant)=>callRpc('bib_revoke_fiscal_entity_access',{
  p_entity_id:g.entity_id,p_user_id:g.user_id}),
  onSuccess:()=>void qc.invalidateQueries({queryKey:grantKey})});
 const saveView=useMutation({mutationFn:()=>callRpc('bib_save_fiscal_view',{
  p_label:viewLabel.trim(),p_filters:{
   ...(viewEntity?{entityId:viewEntity}:{}),...(viewPole?{pole:viewPole}:{}),
   ...(viewRisk?{risk:viewRisk}:{}),...(viewStatus?{status:viewStatus}:{})
  }}),onSuccess:()=>{setViewLabel('');void qc.invalidateQueries({queryKey:viewKey});}});
 const goToView=(v:SavedView)=>{
  const p=new URLSearchParams(window.location.search);
  for(const k of ['entite','pole','risque','statut'])p.delete(k);
  if(v.filters.entityId)p.set('entite',v.filters.entityId);
  if(v.filters.pole)p.set('pole',v.filters.pole);
  if(v.filters.risk)p.set('risque',v.filters.risk);
  if(v.filters.status)p.set('statut',v.filters.status);
  window.location.assign(window.location.pathname+'?'+p.toString());
 };
 if(!isCEO&&!canReview)return null;
 return <section className="mb-5 space-y-4">
  {canReview&&<Card>
   <CardHeader><CardTitle className="text-base">Juridique · Vérification indépendante des entités</CardTitle>
    <p className="text-sm text-muted-foreground">Contrôlez l'existence juridique réelle et la pièce de preuve avant de valider. Le créateur de l'entité ne peut pas approuver son propre dossier.</p></CardHeader>
   <CardContent className="space-y-3">
    {reviews.isError&&<p role="alert" className="text-sm text-destructive">La liste juridique est indisponible ou votre habilitation est insuffisante.</p>}
    {reviews.isSuccess&&<form className="grid gap-3 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();review.mutate();}}>
     <label className="grid gap-1 text-sm">Projet à vérifier
      <select className="h-10 rounded-md border border-input bg-background px-3" required value={reviewEntity} onChange={e=>setReviewEntity(e.target.value)}>
       <option value="">Sélectionner un dossier</option>
       {reviews.data.map(e=><option key={e.id} value={e.id}>{e.legal_name} · {e.country_code}</option>)}
      </select></label>
     <label className="grid gap-1 text-sm">Immatriculation vérifiée (SIREN à 9 chiffres en France)
      <Input required value={registration} maxLength={60} onChange={e=>setRegistration(e.target.value)}/></label>
     <label className="grid gap-1 text-sm sm:col-span-2">Référence de preuve de vérification (document officiel)
      <Input required minLength={8} maxLength={500} value={reviewReference} onChange={e=>setReviewReference(e.target.value)}/></label>
     {review.isError&&<p role="alert" className="text-sm text-destructive sm:col-span-2">{(review.error as Error).message}</p>}
     <div className="sm:col-span-2"><Button type="submit" disabled={review.isPending||!reviewEntity||reviewReference.trim().length<8||registration.trim().length<5}>Valider la revue indépendante</Button></div>
    </form>}
   </CardContent>
  </Card>}
  {isCEO&&<Card>
   <CardHeader><CardTitle className="text-base">Direction · Activation et suspension des entités</CardTitle>
    <p className="text-sm text-muted-foreground">Une entité en projet n'est pas déclarable. L'activation n'est proposée qu'après visa juridique indépendant, identifié et documenté.</p></CardHeader>
   <CardContent className="space-y-2">
    {entities.isError&&<p role="alert" className="text-sm text-destructive">Registre juridique inaccessible.</p>}
    {entities.data?.map(e=><div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
     <div><strong>{e.legal_name}</strong> · {e.status}
      <p className="text-xs text-muted-foreground">{e.registration_identifier||'Identité en attente'} {e.review_reference?'· Visa enregistré':''}</p></div>
     <div className="flex gap-2">
      {e.status==='reviewed'&&<Button size="sm" onClick={()=>activate.mutate(e.id)} disabled={activate.isPending}>Activer après vérification</Button>}
      {e.status==='active'&&<Button size="sm" variant="outline" onClick={()=>suspend.mutate(e.id)} disabled={suspend.isPending}>Suspendre les accès</Button>}
     </div>
    </div>)}
    {(activate.isError||suspend.isError)&&<p role="alert" className="text-sm text-destructive">{String((activate.error||suspend.error) as Error)}</p>}
   </CardContent>
  </Card>}
  {isCEO&&<Card>
   <CardHeader><CardTitle className="text-base">Direction · Délégations fiscales individuelles</CardTitle>
    <p className="text-sm text-muted-foreground">Accès nominatif, limité à une entité activée, à une durée maximale de 365 jours et aux droits métier existants. Aucun accès automatique par pôle. Les fonctions de déclarations et de dépôt restent indépendantes.</p></CardHeader>
   <CardContent className="space-y-3">
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();grant.mutate();}}>
     <label className="grid gap-1 text-sm">Entité active
      <select required className="h-10 rounded-md border border-input bg-background px-3" value={grantEntity} onChange={e=>setGrantEntity(e.target.value)}>
       <option value="">Sélectionner</option>
       {entities.data?.filter(e=>e.status==='active').map(e=><option key={e.id} value={e.id}>{e.legal_name}</option>)}
      </select></label>
     <label className="grid gap-1 text-sm">ID du collaborateur (depuis Accès et permissions)
      <Input required value={grantUser} onChange={e=>setGrantUser(e.target.value)} placeholder="UUID nominatif"/></label>
     <label className="grid gap-1 text-sm">Expiration de l'habilitation
      <Input type="date" required value={expires} onChange={e=>setExpires(e.target.value)}/></label>
     <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={canUpdate} onChange={e=>setCanUpdate(e.target.checked)}/>Autoriser la contribution (sinon lecture seule)</label>
     {grant.isError&&<p role="alert" className="text-sm text-destructive sm:col-span-2">{(grant.error as Error).message}</p>}
     <div className="sm:col-span-2"><Button type="submit" disabled={grant.isPending||!uuid.test(grantUser)||!grantEntity||!expires}>Accorder une délégation limitée</Button></div>
    </form>
    {grants.isError&&<p role="alert" className="text-sm text-destructive">Les habilitations ne peuvent pas être chargées.</p>}
    {grants.data?.map(g=><div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-xs" key={g.entity_id+g.user_id}>
     <span>{entities.data?.find(e=>e.id===g.entity_id)?.legal_name||g.entity_id} · {g.user_id} · {g.can_update?'Contribution':'Lecture'} · échéance {new Date(g.expires_at).toLocaleDateString('fr-FR')}</span>
     <Button size="sm" variant="outline" disabled={revoke.isPending} onClick={()=>revoke.mutate(g)}>Révoquer</Button>
    </div>)}
    {revoke.isError&&<p role="alert" className="text-sm text-destructive">{(revoke.error as Error).message}</p>}
   </CardContent>
  </Card>}
  {isCEO&&<Card>
   <CardHeader><CardTitle className="text-base">Direction · Vues fiscales enregistrées</CardTitle>
    <p className="text-sm text-muted-foreground">Filtres de présentation uniquement. Une vue n'élargit jamais les droits du collaborateur qui la consulte.</p></CardHeader>
   <CardContent className="space-y-3">
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();saveView.mutate();}}>
     <label className="grid gap-1 text-sm">Nom de la vue
      <Input required minLength={3} maxLength={80} value={viewLabel} onChange={e=>setViewLabel(e.target.value)}/></label>
     <label className="grid gap-1 text-sm">Entité (facultatif)
      <select className="h-10 rounded-md border border-input bg-background px-3" value={viewEntity} onChange={e=>setViewEntity(e.target.value)}>
       <option value="">Toutes les entités autorisées</option>
       {entities.data?.map(e=><option key={e.id} value={e.id}>{e.legal_name}</option>)}
      </select></label>
     <label className="grid gap-1 text-sm">Pôle
      <select className="h-10 rounded-md border border-input bg-background px-3" value={viewPole} onChange={e=>setViewPole(e.target.value)}>
       <option value="">Tous</option>
       {['Finance','Conformité & Juridique','Fournisseurs & Produits','Opérations & Logistique','Marketplace & Customer','Support & Customer Success','Produit & Engineering','Security & IT','Direction'].map(p=><option key={p} value={p}>{p}</option>)}
      </select></label>
     <label className="grid gap-1 text-sm">Risque
      <select className="h-10 rounded-md border border-input bg-background px-3" value={viewRisk} onChange={e=>setViewRisk(e.target.value)}>
       <option value="">Tous</option>
       {['Faible','Modéré','Élevé','Critique'].map(p=><option key={p} value={p}>{p}</option>)}
      </select></label>
     <label className="grid gap-1 text-sm">Statut
      <select className="h-10 rounded-md border border-input bg-background px-3" value={viewStatus} onChange={e=>setViewStatus(e.target.value)}>
       <option value="">Tous</option>
       {['À préparer','En cours','Bloqué','En revue','Validé'].map(p=><option key={p} value={p}>{p}</option>)}
      </select></label>
     {saveView.isError&&<p role="alert" className="text-sm text-destructive sm:col-span-2">{(saveView.error as Error).message}</p>}
     <div className="sm:col-span-2"><Button type="submit" disabled={saveView.isPending||viewLabel.trim().length<3}>Enregistrer cette vue</Button></div>
    </form>
    {views.isError&&<p role="alert" className="text-sm text-destructive">Impossible de lire les vues enregistrées.</p>}
    {views.data?.map(v=><div key={v.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
      <span>{v.label}</span><Button size="sm" variant="outline" onClick={()=>goToView(v)}>Appliquer</Button>
     </div>)}
   </CardContent>
  </Card>}
 </section>;
}
