import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ClipboardCheck, GitCommitHorizontal, LockKeyhole, Rocket, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { useProductRequests } from '@/hooks/useProductRequests';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const appLabels = { bib_platform: 'BIB Platform', bib_intranet: 'BIB Intranet', bib_audit_hub: 'BIB Audit Hub' };
const appKeys = Object.keys(appLabels) as (keyof typeof appLabels)[];
type Status = 'planning'|'development'|'testing'|'review'|'approved'|'released'|'rolled_back';
type Env = 'sandbox'|'staging'|'production';
type Release = {
  id:string;request_id:string;app_key:keyof typeof appLabels;version:string;environment:Env;
  status:Status;change_reference:string|null;test_reference:string|null;
  security_reference:string|null;rollback_reference:string|null;
  reviewer_id:string|null;reviewed_at:string|null;deployed_at:string|null;updated_at:string;
};
type Form = {
 request_id:string; app_key:keyof typeof appLabels; version:string;environment:Env;
 status:Status;change_reference:string;test_reference:string;security_reference:string;
 rollback_reference:string;note:string;
};
const newForm = ():Form=>({
 request_id:'',app_key:'bib_intranet',version:'',environment:'sandbox',status:'planning',
 change_reference:'',test_reference:'',security_reference:'',rollback_reference:'',note:'',
});
const statuses:Status[]=['planning','development','testing','review','approved','released','rolled_back'];
const names:Record<Status,string>={
 planning:'Planifiée',development:'En développement',testing:'En recette',review:'En revue',
 approved:'Approuvée (décision)',released:'Mise en production déclarée',rolled_back:'Retour arrière déclaré',
};
const db = supabase as any;
export default function ProductReleases(){
 const {canViewPage,can}=usePermissions();
 const {toast}=useToast();
 const qc=useQueryClient();
 const requests=useProductRequests();
 const [editing,setEditing]=useState<string|null>(null);
 const [form,setForm]=useState<Form>(newForm);
 const [filter,setFilter]=useState('all');
 const releases=useQuery({
  queryKey:['product-release-tracking'],
  enabled:canViewPage('product.engineering'),
  queryFn:async():Promise<Release[]>=>{
    const {data,error}=await db.from('product_release_tracking').select('*')
      .order('updated_at',{ascending:false}).limit(250);
    if(error)throw error;
    return (data??[]) as Release[];
  },
 });
 const mutation=useMutation({
  mutationFn:async({record,previous}: {record:Form;previous:string|null})=>{
    const {data,error}=await db.rpc('save_product_release_tracking',{
      p_id:previous,p_request_id:record.request_id,p_app_key:record.app_key,
      p_version:record.version,p_environment:record.environment,
      p_change_reference:record.change_reference||null,p_test_reference:record.test_reference||null,
      p_security_reference:record.security_reference||null,
      p_rollback_reference:record.rollback_reference||null,
      p_status:record.status,p_note:record.note,
    });
    if(error)throw error;
    return data;
  },
  onSuccess:()=>{
    void qc.invalidateQueries({queryKey:['product-release-tracking']});
    setEditing(null);setForm(newForm());
    toast({title:'Décision de livraison enregistrée',description:'Enregistrement et journal côté serveur. Aucune livraison automatique.'});
  },
  onError:(error:Error)=>toast({title:'Enregistrement refusé',description:error.message,variant:'destructive'}),
 });
 const available=(releases.data??[]).filter(r=>filter==='all'||r.app_key===filter);
 const selected=useMemo(()=>editing?(releases.data??[]).find(r=>r.id===editing):undefined,[editing,releases.data]);
 const canEdit=can('product.engineering','update')||can('product.engineering','create');
 const start=(r?:Release)=>{
   setEditing(r?.id??'new');
   setForm(r?{
     request_id:r.request_id,app_key:r.app_key,version:r.version,
     environment:r.environment,status:r.status,
     change_reference:r.change_reference??'',test_reference:r.test_reference??'',
     security_reference:r.security_reference??'',rollback_reference:r.rollback_reference??'',note:'',
   }:newForm());
 };
 const save=()=>{if(!canEdit||!form.request_id||!form.version.trim()||form.note.trim().length<8)return;
   mutation.mutate({record:form,previous:editing==='new'?null:editing});
 };
 if(!canViewPage('product.engineering'))return <p role="alert">Accès Engineering non autorisé.</p>;
 return <div className="space-y-6 p-6">
  <header className="space-y-2">
   <div className="flex items-center gap-2"><Rocket className="h-6 w-6"/><h1 className="text-2xl font-semibold">Livraisons & recettes BIB</h1></div>
   <p className="max-w-3xl text-sm text-muted-foreground">Traçabilité des modifications, vérifications, décisions de publication et retours arrière pour Platform, Intranet et Audit Hub.</p>
   <Badge variant="outline">Registre de preuves — ne déclenche aucun build ou déploiement</Badge>
  </header>
  {(releases.isError||requests.isError)&&<div role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm">
   Le registre des livraisons ou des demandes est indisponible. Cette section n’est pas opérationnelle tant que la migration et ses droits ne sont pas installés.
   <Button variant="outline" size="sm" className="ml-3" onClick={()=>{void releases.refetch();void requests.refetch();}}>Réessayer</Button>
  </div>}
  <div className="grid gap-3 md:grid-cols-3">
   {[
    {label:'Modifications documentées',value:releases.isLoading||releases.isError?'—':String(releases.data?.length??0),icon:GitCommitHorizontal},
    {label:'En revue',value:releases.isLoading||releases.isError?'—':String((releases.data??[]).filter(r=>r.status==='review').length),icon:ClipboardCheck},
    {label:'Livraisons déclarées',value:releases.isLoading||releases.isError?'—':String((releases.data??[]).filter(r=>r.status==='released').length),icon:Rocket},
   ].map(({label,value,icon:Icon})=><Card key={label}><CardContent className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4"/>{label}</div><p className="mt-2 text-2xl font-semibold">{value}</p></CardContent></Card>)}
  </div>
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div className="min-w-48"><Select value={filter} onValueChange={setFilter}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Les trois applications</SelectItem>{appKeys.map(k=><SelectItem key={k} value={k}>{appLabels[k]}</SelectItem>)}</SelectContent></Select></div>
   <Button disabled={!canEdit||releases.isError||requests.isError} onClick={()=>start()}>Nouvelle fiche de livraison</Button>
  </div>
  {releases.isLoading&&<p role="status" className="text-sm text-muted-foreground">Chargement des livraisons…</p>}
  {!releases.isError&&<div className="grid gap-3 md:grid-cols-2">
   {available.map(r=><Card key={r.id}><CardHeader><CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
     <span>{appLabels[r.app_key]} · {r.version}</span><Badge variant="outline">{names[r.status]}</Badge></CardTitle></CardHeader>
     <CardContent className="space-y-3 text-sm">
      <p>Environnement : <strong>{r.environment}</strong></p>
      <p className="text-muted-foreground">Demande : {requests.data?.find(q=>q.id===r.request_id)?.reference??r.request_id}</p>
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
       <p><GitCommitHorizontal className="mr-1 inline h-3 w-3"/>Changement : {r.change_reference?'Documenté':'Absent'}</p>
       <p><ClipboardCheck className="mr-1 inline h-3 w-3"/>Tests : {r.test_reference?'Référence fournie':'Absents'}</p>
       <p><ShieldCheck className="mr-1 inline h-3 w-3"/>Sécurité : {r.security_reference?'Référence fournie':'À vérifier'}</p>
       <p><LockKeyhole className="mr-1 inline h-3 w-3"/>Rollback : {r.rollback_reference?'Documenté':'Absent'}</p>
      </div>
      <Button variant="outline" size="sm" disabled={!canEdit} onClick={()=>start(r)}>Consulter / mettre à jour</Button>
     </CardContent></Card>)}
   {!releases.isLoading&&!available.length&&<p className="text-sm text-muted-foreground">Aucune livraison enregistrée. Un dossier approuvé ne signifie pas qu'une version est déployée.</p>}
  </div>}
  {editing&&<Card><CardHeader><CardTitle className="text-base">{editing==='new'?'Préparer une livraison':'Mettre à jour la fiche'}</CardTitle></CardHeader>
   <CardContent className="space-y-4">
    <div className="grid gap-3 md:grid-cols-2">
     <div className="space-y-1"><Label>Demande produit liée</Label><Select value={form.request_id} disabled={editing!=='new'} onValueChange={v=>setForm(f=>({...f,request_id:v}))}><SelectTrigger><SelectValue placeholder="Choisir une demande réelle" /></SelectTrigger><SelectContent>{(requests.data??[]).map(q=><SelectItem key={q.id} value={q.id}>{q.reference} · {q.title}</SelectItem>)}</SelectContent></Select></div>
     <div className="space-y-1"><Label>Application</Label><Select value={form.app_key} disabled={editing!=='new'} onValueChange={v=>setForm(f=>({...f,app_key:v as Form['app_key']}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{appKeys.map(k=><SelectItem key={k} value={k}>{appLabels[k]}</SelectItem>)}</SelectContent></Select></div>
     <div className="space-y-1"><Label>Version / lot</Label><Input value={form.version} disabled={editing!=='new'} onChange={e=>setForm(f=>({...f,version:e.target.value}))} placeholder="Ex. 0.4.2"/></div>
     <div className="space-y-1"><Label>Environnement</Label><Select value={form.environment} disabled={editing!=='new'} onValueChange={v=>setForm(f=>({...f,environment:v as Env}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{(['sandbox','staging','production'] as const).map(k=><SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent></Select></div>
     <div className="space-y-1"><Label>Référence PR / commit</Label><Input value={form.change_reference} onChange={e=>setForm(f=>({...f,change_reference:e.target.value}))} placeholder="URL ou identifiant traçable"/></div>
     <div className="space-y-1"><Label>Preuve de tests / recette</Label><Input value={form.test_reference} onChange={e=>setForm(f=>({...f,test_reference:e.target.value}))} placeholder="Rapport CI ou recette signé"/></div>
     <div className="space-y-1"><Label>Revue Security & IT</Label><Input value={form.security_reference} onChange={e=>setForm(f=>({...f,security_reference:e.target.value}))} placeholder="Référence de contrôle sécurité"/></div>
     <div className="space-y-1"><Label>Plan de retour arrière</Label><Input value={form.rollback_reference} onChange={e=>setForm(f=>({...f,rollback_reference:e.target.value}))} placeholder="Procédure de rollback"/></div>
     <div className="space-y-1"><Label>État déclaré</Label><Select value={form.status} onValueChange={v=>setForm(f=>({...f,status:v as Status}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{statuses.map(k=><SelectItem key={k} value={k}>{names[k]}</SelectItem>)}</SelectContent></Select></div>
    </div>
    <div className="space-y-1"><Label>Motif et observation (journalisé)</Label><Textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="Décrivez l'avancement et les preuves vérifiées"/></div>
    <p className="text-xs text-muted-foreground">Approbation et mise en production sont des décisions humaines consignées. La base impose l'existence de références de preuves mais n'exécute pas la CI. Ne fournissez ni tokens, ni clés, ni données de vrais utilisateurs.</p>
    {selected?.status==='released'&&<p className="text-xs text-amber-700">Une livraison déclarée reste figée ; seul un retour arrière peut être consigné.</p>}
    <div className="flex gap-2">
     <Button disabled={mutation.isPending||!form.request_id||!form.version.trim()||form.note.trim().length<8} onClick={save}>Enregistrer</Button>
     <Button variant="outline" onClick={()=>{setEditing(null);setForm(newForm());}}>Annuler</Button>
    </div>
   </CardContent>
  </Card>}
  <p className="text-xs text-muted-foreground">Les vrais statuts CI/CD doivent être vérifiés dans les dépôts et environnements de chaque application. <Link to="/pole/security/code" className="underline">Revue du code et sécurité</Link>.</p>
 </div>;
}
