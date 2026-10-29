import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { intranetRpc,resolveIntranetPage } from '@/lib/intranet';
type Event={id:string;action:string;before_state:Record<string,unknown>|null;after_state:Record<string,unknown>|null;created_at:string};
const safe=(key:string)=>!/(password|secret|token|cipher|private_key|credential)/i.test(key);
const value=(v:unknown)=>v==null?'—':typeof v==='object'?'Données structurées modifiées':String(v);
export default function BusinessHistoryPanel(){
 const {user}=useAuth();const location=useLocation();const page=resolveIntranetPage(location.pathname);const [open,setOpen]=useState(false);
 const history=useQuery({queryKey:['business-history',user?.id,page?.id],enabled:open&&!!page,queryFn:()=>intranetRpc<Event[]>('list_intranet_business_history',{p_page:page!.id})});
 if(!page)return null;
 return <details className="mt-8 rounded border p-4 text-sm" open={open} onToggle={e=>setOpen(e.currentTarget.open)}><summary className="cursor-pointer font-medium">Journal des opérations de cette section</summary>{open&&<div className="mt-3 space-y-3">{history.isLoading&&<p>Chargement…</p>}{history.isError&&<p role="alert">Journal indisponible. <button onClick={()=>void history.refetch()}>Réessayer</button></p>}{history.data?.length===0&&<p className="text-muted-foreground">Aucune opération métier enregistrée dans ce journal. Les dossiers, documents et décisions possèdent aussi leur propre historique.</p>}{history.data?.map(event=><details key={event.id} className="border-b pb-2"><summary>{{insert:'Création',update:'Modification',delete:'Suppression'}[event.action]||'Opération'} · {new Date(event.created_at).toLocaleString('fr-FR')}</summary><dl className="mt-2 space-y-1">{Object.keys(event.after_state||event.before_state||{}).filter(safe).filter(key=>JSON.stringify(event.before_state?.[key])!==JSON.stringify(event.after_state?.[key])).map(key=><div key={key} className="break-words"><dt className="text-muted-foreground">{key.replace(/_/g,' ')}</dt><dd>{value(event.before_state?.[key])} → {value(event.after_state?.[key])}</dd></div>)}</dl></details>)}</div>}</details>
}
