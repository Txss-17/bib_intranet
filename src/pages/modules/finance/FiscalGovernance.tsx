import {useMemo,useState} from 'react';
import {useLocation} from 'react-router-dom';
import FiscalHub,{Transport} from '@/components/finance/fiscal/FiscalHub';
import FiscalEntityDrafts from '@/components/finance/fiscal/FiscalEntityDrafts';
import FiscalEntityOperations from '@/components/finance/fiscal/FiscalEntityOperations';
import {FiscalRecord,refs} from '@/components/finance/fiscal/data';
import {useAuth} from '@/hooks/useAuth';
import {usePermissions} from '@/hooks/usePermissions';
import {intranetRpc} from '@/lib/intranet';
import {driveAction,DriveDocument,DriveSource} from '@/lib/driveDocuments';
import {exportToCSV,exportToPDF} from '@/lib/exportUtils';

const poleNames:Record<string,string>={finance:'Finance',compliance:'Conformité & Juridique',supplier:'Fournisseurs & Produits',ops:'Opérations & Logistique',marketplace:'Marketplace & Customer',support:'Support & Customer Success',product:'Produit & Engineering',security:'Security & IT',direction:'Direction'};
function FiscalDrivePicker({onAdded,enabled}:{onAdded:(e:any)=>void;enabled:boolean}){
 const [source,setSource]=useState(''),[search,setSearch]=useState(''),[files,setFiles]=useState<DriveSource[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [requestKey,setRequestKey]=useState(()=>crypto.randomUUID());
 const importFile=async(file?:DriveSource)=>{setBusy(true);setError('');try{const doc=await driveAction<DriveDocument>({action:'import',request_key:requestKey,source:file?.id||source,page_id:'finance.fiscal',name:file?.name||'Justificatif fiscal BIB.pdf',classification:'confidential'});if(!doc.url)throw new Error('Import incomplet : aucune pièce exploitable.');onAdded({id:doc.id,name:doc.name,url:new URL(doc.url,window.location.origin).href,type:'link',addedAt:new Date().toISOString()});setSource('');setFiles([]);setRequestKey(crypto.randomUUID());}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
 const list=async()=>{setBusy(true);setError('');try{const result=await driveAction<{files:DriveSource[]}>({action:'list',search});setFiles(result.files);}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
 return <div className="fh-form fh-native-drive"><h3>Importer depuis Google Drive BIB</h3><p className="fh-small-note">La pièce est rattachée au registre documentaire existant et conserve les contrôles d’accès de l’intranet.</p><label>Rechercher dans Drive BIB<input disabled={!enabled||busy} value={search} onChange={e=>setSearch(e.target.value)}/></label><button className="fh-button" disabled={!enabled||busy} onClick={()=>void list()}>Rechercher</button>{files.map(f=><button key={f.id} className="fh-button" disabled={!enabled||busy} onClick={()=>void importFile(f)}>{f.name}</button>)}<label>Lien Google Drive BIB<input disabled={!enabled||busy} value={source} onChange={e=>{setSource(e.target.value);setRequestKey(crypto.randomUUID());}} placeholder="https://drive.google.com/…"/></label><button className="fh-button" disabled={!enabled||busy||!source.trim()} onClick={()=>void importFile()}>{busy?'Import en cours…':'Importer et rattacher'}</button>{error&&<p role="alert" className="fh-alert danger">{error}</p>}</div>;
}
export default function FiscalGovernance(){
 const {can,canViewPage}=usePermissions(),location=useLocation();
 const {user,profile}=useAuth();
 const transport=useMemo<Transport>(()=>({
  list:()=>intranetRpc('list_bib_fiscal_records'),
  save:r=>intranetRpc<FiscalRecord>('save_bib_fiscal_record',{p_record:r,p_expected_revision:r.revision}),
  history:id=>intranetRpc('list_bib_fiscal_events',{p_record_id:id}),
  upload:async()=>{throw new Error('Utilisez l’import depuis Drive BIB.');},
  evidencePicker:(_record,onAdded,enabled)=><FiscalDrivePicker onAdded={onAdded} enabled={enabled}/>,
  export:async(format,records,filters)=>{
   const data=records.map(r=>({id:r.id,title:r.title,entity:r.entity,pole:r.pole,contributors:r.contributors.join(' ; '),confidence:r.confidence,status:r.status,risk:r.risk,owner:r.owner,due:r.due||r.trigger,body:[r.summary,...Object.entries(r.details).map(([k,v])=>k+' : '+v),'Responsable : '+r.owner,'Dépendances : '+r.dependencies.join(', '),'Contrôles : '+r.controls.map(c=>(c.done?'[fait] ':'[à faire] ')+c.label).join('; '),'Pièces : '+r.evidence.map(e=>e.name+' '+e.url).join('; '),'Textes : '+r.refs.map(id=>refs[id]?.code+' '+refs[id]?.url).join('; '),'Notes : '+r.notes].join('\n')}));
   const columns=format==='csv'?[{header:'Référence',accessor:'id'},{header:'Dossier',accessor:'title'},{header:'Entité',accessor:'entity'},{header:'Pôle',accessor:'pole'},{header:'Contributeurs',accessor:'contributors'},{header:'Qualification',accessor:'confidence'},{header:'Statut',accessor:'status'},{header:'Risque',accessor:'risk'},{header:'Responsable',accessor:'owner'},{header:'Échéance / déclencheur',accessor:'due'}]:[{header:'Référence',accessor:'id'},{header:'Dossier',accessor:'title'},{header:'Cadre, suivi et preuves',accessor:'body'}];
   const options={filename:'BIB_Pilotage_Fiscal_'+new Date().toISOString().slice(0,10),title:'Pilotage fiscal BIB — '+(filters.pole||'Tous les pôles'),columns,data,poleName:'Finance & conformité'};
   if(format==='csv')await exportToCSV(options);else await exportToPDF(options);
  },
 }),[user?.id,profile?.test_account]);
 if(!canViewPage('finance.fiscal'))return <p role="alert">Accès restreint au pilotage fiscal.</p>;
 const scope=location.pathname.split('/')[2];
 return <><FiscalEntityDrafts/><FiscalEntityOperations/><FiscalHub key={[scope,user?.id,profile?.test_account].join(':')} embedded transport={transport} canValidate={can('finance.fiscal','validate')} initialPole={scope==='finance'?'':poleNames[scope]||''}/></>;
}
