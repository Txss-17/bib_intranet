import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FileUploadZone from '@/components/FileUploadZone';
import { useAuth } from '@/hooks/useAuth';
import { intranetRpc } from '@/lib/intranet';
import { DriveDocument, managedDocumentId, openManagedDocument } from '@/lib/driveDocuments';
import { toast } from 'sonner';
export function DocumentLinks({ ids }: { ids: string[] }) {
 return <div className="flex flex-wrap gap-2">{ids.map((id,i) => <Button key={id} variant="outline" size="sm" type="button" onClick={() => { try { openManagedDocument(`/documents?document=${id}`); } catch(e){toast.error((e as Error).message)} }}>Consulter la pièce {i+1}</Button>)}</div>
}
export default function RecordAttachments({value,onChange,ownerOnly=false}: {value:string[];onChange:(ids:string[])=>void;ownerOnly?:boolean}) {
 const {user,profile}=useAuth(); const qc=useQueryClient(); const [search,setSearch]=useState('');
 const docs=useQuery({queryKey:['drive-documents',user?.id,profile?.test_account===true,search],queryFn:()=>intranetRpc<DriveDocument[]>('list_intranet_documents',{p_search:search,p_page:null})});
 return <fieldset className="space-y-3 rounded border p-3"><legend className="text-sm font-medium">Pièces jointes Drive BIB</legend><p className="text-xs text-muted-foreground">Les lecteurs autorisés du dossier pourront consulter les pièces jointes. Les documents restent dans Drive BIB.</p><DocumentLinks ids={value}/><Input aria-label="Chercher une pièce jointe" placeholder="Rechercher un document existant…" value={search} onChange={e=>setSearch(e.target.value)}/>{docs.isError&&<p role="alert">Documents indisponibles. <button type="button" onClick={()=>void docs.refetch()}>Réessayer</button></p>}<div className="max-h-36 space-y-2 overflow-auto">{docs.data?.filter(d=>!ownerOnly||value.includes(d.id)||d.owner_id===user?.id).map(d=><label key={d.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value.includes(d.id)} disabled={!value.includes(d.id)&&value.length>=20} onChange={e=>onChange(e.target.checked?[...value,d.id]:value.filter(id=>id!==d.id))}/>{d.name}</label>)}</div>{value.length>0&&<Button type="button" variant="ghost" onClick={()=>onChange([])}>Retirer les pièces jointes</Button>}<FileUploadZone bucket="managed-drive" folder="record-documents" multiple={false} files={[]} onFilesChange={files=>{const ids=files.map(f=>managedDocumentId(f.url)).filter((id):id is string=>!!id);onChange([...new Set([...value,...ids])].slice(0,20));void qc.invalidateQueries({queryKey:['drive-documents']});}}/></fieldset>
}
