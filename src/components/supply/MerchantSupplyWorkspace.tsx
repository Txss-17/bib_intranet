import {supplyMoney} from "@/lib/supplyMoney";
import {useState,useRef,type FormEvent} from "react";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {usePermissions} from "@/hooks/usePermissions";
import {useMerchantSupply,useSupplyCommand,type SupplyRequest} from "@/hooks/useMerchantSupply";
import {SupplyQuoteSummary,type SupplyQuote,type SupplyParty} from "./SupplyQuoteSummary";
import {parseSupplyQuote} from "../../../supabase/functions/_shared/supply-contract.mjs";

const status:Record<string,string>={draft:"Brouillon",review:"Validation Finance",approved:"Approuvé",issued:"Communiqué",accepted:"Accepté",withdrawn:"Retiré"};
const cents=(value:string)=>{if(!/^\d+(?:[.,]\d{1,2})?$/.test(value))throw new Error("Renseignez un montant exact avec au plus deux décimales.");return Math.round(Number(value.replace(",","."))*100);};
const percent=(value:string)=>{if(!/^\d+(?:[.,]\d{1,2})?$/.test(value))throw new Error("Précisez le taux de TVA, y compris s’il est nul.");return Math.round(Number(value.replace(",","."))*100);};
function Field({label,value,set,type=label.startsWith("Échéance")?"datetime-local":"text"}:{label:string;value:string;set:(v:string)=>void;type?:string}){return <Label className="block space-y-2"><span>{label}</span><Input type={type} value={value} onChange={e=>set(e.target.value)} required /></Label>;}

export function MerchantSupplyWorkspace(){
 const {can}=usePermissions();
 if(!can("supplier.suppliers","read")&&!can("finance.billing","read"))return null;
 return <SupplyWorkspaceContent/>;
}
function SupplyWorkspaceContent(){
 const query=useMerchantSupply(),command=useSupplyCommand(),{can}=usePermissions();
 const [tab,setTab]=useState<"quotes"|"prices">("quotes");const [editing,setEditing]=useState<SupplyQuote|null|false>(false);
 const [requestSource,setRequestSource]=useState<SupplyRequest|null>(null);
 const data=query.data;
 const act=async(q:SupplyQuote,action:string,payload:Record<string,unknown>={})=>{
  try{await command.mutateAsync({name:"advance_merchant_supply_quote",args:{p_id:q.id,p_revision:q.revision,p_key:crypto.randomUUID(),p_action:action,p_payload:payload}});toast.success("Dossier mis à jour");}catch(e){toast.error((e as Error).message);}
 };
 return <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Acquisitions des marchands</h2><p className="mt-1 max-w-3xl text-sm text-muted-foreground">Le marchand achète au fournisseur ; BIB intervient dans son mandat. Le coût global regroupe produit, livraison et commission. Chaque facture conserve son émetteur réel.</p></div><Button variant="outline" onClick={()=>query.refetch()}>Actualiser</Button></div>
  <div className="flex flex-wrap gap-2"><Button variant={tab==="quotes"?"default":"outline"} onClick={()=>setTab("quotes")}>Devis marchands</Button><Button variant={tab==="prices"?"default":"outline"} onClick={()=>setTab("prices")}>Prix du catalogue</Button></div>
  {query.isLoading&&<p role="status">Chargement des dossiers…</p>}
  {query.isError&&<p role="alert" className="text-sm text-destructive">Les dossiers d’acquisition sont indisponibles. Aucune acceptation ni aucun règlement ne peut être déduit des anciennes données.</p>}
  {data&&tab==="quotes"&&<>
   {can("supplier.suppliers","create")&&<Button onClick={()=>{setRequestSource(null);setEditing(null);}}>Préparer un devis marchand</Button>}
   {!!data.requests.filter(r=>r.state==="received").length&&<div className="space-y-2 rounded-lg border p-3"><h3 className="font-semibold">Demandes des marchands à chiffrer</h3>{data.requests.filter(r=>r.state==="received").map(r=><div key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-t pt-3"><div><p className="text-sm font-medium">{data.products.find(p=>p.id===r.catalog_id)?.name??"Référence catalogue"} × {r.request.quantity} · {data.options.buyers.find(b=>b.boutique_id===r.boutique_id)?.name??"Boutique identifiée"}</p><p className="whitespace-pre-wrap break-words text-xs text-muted-foreground">{r.request.note}</p></div>{can("supplier.suppliers","create")&&<Button variant="outline" onClick={()=>{setRequestSource(r);setEditing(null);}}>Préparer ce devis</Button>}</div>)}</div>}
   {editing!==false&&<QuoteEditor key={editing?.id??requestSource?.id??"new"} initial={editing} request={requestSource} data={data} close={()=>setEditing(false)} />}
   {!data.quotes.length&&<p className="text-sm text-muted-foreground">Aucun devis d’acquisition enregistré.</p>}
   {data.quotes.map(q=><details key={q.id} className="rounded-lg border p-4"><summary className="cursor-pointer font-medium">{q.reference??`Devis ${q.id.slice(0,8)}`} · {q.product_name} · {status[q.state]??q.state} · {supplyMoney(q.totals.total_cents)}</summary><div className="mt-5 space-y-5"><SupplyQuoteSummary quote={q}/>
    {q.state!=="accepted"&&q.state!=="withdrawn"&&can("supplier.suppliers","update")&&<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>setEditing(q)}>Réviser le devis</Button>{q.state==="draft"&&<Button onClick={()=>act(q,"submit")}>Soumettre à Finance</Button>}{q.state==="approved"&&<Button onClick={()=>act(q,"issue")}>Communiquer au marchand</Button>}</div>}
    {q.state==="review"&&can("finance.billing","validate")&&<QuoteActionForm title="Valider les identités, les montants et le régime fiscal" fields={["Référence de la revue Finance"]} onSubmit={values=>act(q,"approve",{evidence_reference:values[0]})} />}
    {q.state==="accepted"&&can("finance.billing","validate")&&<FinanceEvidence quote={q} act={act}/>}
    <p className="text-xs text-muted-foreground">L’acceptation ne vaut ni paiement, ni réception, ni transfert automatique de propriété. {q.payment_evidence?.length?`Dernier événement de règlement : ${q.payment_evidence[q.payment_evidence.length-1].state??"à rapprocher"}.`:"Aucun événement de règlement PSP rapproché."}</p>
   </div></details>)}
  </>}
  {data&&tab==="prices"&&<PriceEditor data={data} canCreate={can("supplier.suppliers","create")} canApprove={can("finance.billing","validate")} />}
 </section>;
}
function QuoteActionForm({title,fields,onSubmit}:{title:string;fields:string[];onSubmit:(v:string[])=>Promise<void>}){
 const [values,setValues]=useState(fields.map(()=>"")),[pending,setPending]=useState(false);
 return <form className="space-y-3 rounded-lg border bg-muted/20 p-4" onSubmit={async e=>{e.preventDefault();setPending(true);try{await onSubmit(values);}finally{setPending(false);}}}><h4 className="font-medium">{title}</h4>{fields.map((label,i)=><Field key={label} label={label} value={values[i]} set={v=>setValues(a=>a.map((x,n)=>n===i?v:x))}/>) }<Button disabled={pending} type="submit">Enregistrer</Button></form>;
}
function FinanceEvidence({quote:q,act}:{quote:SupplyQuote;act:(q:SupplyQuote,a:string,p:Record<string,unknown>)=>Promise<void>}){
 const [issuer,setIssuer]=useState("supplier");
 return <div className="space-y-4"><Label className="block space-y-2"><span>Émetteur de la facture déjà émise</span><select className="h-10 w-full rounded-md border bg-background px-3" value={issuer} onChange={e=>setIssuer(e.target.value)}>{Object.keys(q.payload.parties).filter(k=>k!=="merchant").map(k=><option key={k} value={k}>{q.payload.parties[k as keyof typeof q.payload.parties]?.legal_name}</option>)}</select></Label>
  <QuoteActionForm title="Rattacher une facture existante (aucune émission fiscale ici)" fields={["Numéro de facture","Référence du document","Montant TTC réel en EUR"]} onSubmit={async v=>{try{await act(q,"attach_invoice",{issuer,reference:v[0],document_reference:v[1],amount_cents:cents(v[2]),debtor:"merchant"});}catch(e){toast.error((e as Error).message);}}}/>
  <QuoteActionForm title="Documenter une couverture financière avant production" fields={["Référence de la preuve","Montant couvert en EUR","Conditions de couverture","Échéance de couverture (date et heure avec fuseau)"]} onSubmit={async v=>{try{await act(q,"record_coverage",{evidence_reference:v[0],amount_cents:cents(v[1]),coverage_terms:v[2],valid_until:new Date(v[3]).toISOString()});}catch(e){toast.error((e as Error).message);}}}/>
 </div>;
}

type Data=NonNullable<ReturnType<typeof useMerchantSupply>["data"]>;
const localDateInput=(iso:string)=>{if(!iso)return "";const d=new Date(iso);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
function QuoteEditor({initial,request,data,close}:{initial:SupplyQuote|null;request:SupplyRequest|null;data:Data;close:()=>void}){
 const command=useSupplyCommand(),key=useRef(crypto.randomUUID());const p=initial?.payload;
 const [productId,setProductId]=useState(p?.catalog_id??request?.catalog_id??""),[buyerId,setBuyerId]=useState(p?.boutique_id??request?.boutique_id??""),[purpose,setPurpose]=useState(p?.purpose??request?.request.purpose??"sample");
 const [quantity,setQuantity]=useState(String(p?.quantity??request?.request.quantity??"")),[validity,setValidity]=useState(localDateInput(p?.valid_until??""));
 const initialSupplier=data.suppliers.find(s=>s.id===data.products.find(prod=>prod.id===request?.catalog_id)?.supplier_id);
 const [supplierParty,setSupplierParty]=useState<Partial<SupplyParty>>(p?.parties.supplier??{entity_id:initialSupplier?.id,legal_name:initialSupplier?.name??"",address:initialSupplier?.address??"",email:initialSupplier?.contact_email??initialSupplier?.email??"",registration_id:"",evidence_reference:""});
 const [amounts,setAmounts]=useState(["goods","delivery","bib_fee"].map(component=>{const l=p?.lines.find(l=>l.component===component);return l?String(l.unit_net_cents/100):"";}));
 const [rates,setRates]=useState(["goods","delivery","bib_fee"].map(component=>{const l=p?.lines.find(l=>l.component===component);return l?String(l.tax_rate_bps/100):"";}));
 const [taxReasons,setTaxReasons]=useState(["goods","delivery","bib_fee"].map(component=>p?.lines.find(l=>l.component===component)?.tax_reason??""));
 const [deliveryIssuer,setDeliveryIssuer]=useState(p?.lines.find(l=>l.component==="delivery")?.issuer??"");
 const [terms,setTerms]=useState([p?.mandate_reference??"",p?.terms_reference??"",p?.delivery_terms??"",p?.ownership_terms??""]);
 const product=data.products.find(x=>x.id===productId),supplier=data.suppliers.find(x=>x.id===product?.supplier_id),buyer=data.options.buyers.find(x=>x.boutique_id===buyerId);
 const updateArray=(set:React.Dispatch<React.SetStateAction<string[]>>,i:number,v:string)=>set(a=>a.map((x,n)=>n===i?v:x));
 async function submit(e:FormEvent){e.preventDefault();if(!product||!supplier||!buyer||!data.options.operator)return;
  try{
   const payload={schema_version:1,model:"transparent_intermediation",purpose,merchant_id:buyer.merchant_id,boutique_id:buyer.boutique_id,catalog_id:product.id,supplier_id:supplier.id,quantity:Number(quantity),currency:"EUR",parties:{merchant:buyer.party,supplier:{...supplierParty,entity_id:supplier.id},bib:data.options.operator},
    lines:["goods","delivery","bib_fee"].map((component,i)=>({component,issuer:component==="goods"?"supplier":component==="bib_fee"?"bib":deliveryIssuer,label:[product.name,"Livraison","Commission BIB"][i],quantity:i===0?Number(quantity):1,unit_net_cents:cents(amounts[i]),tax_rate_bps:percent(rates[i]),tax_reason:taxReasons[i]})),valid_until:new Date(validity).toISOString(),mandate_reference:terms[0],terms_reference:terms[1],delivery_terms:terms[2],ownership_terms:terms[3]};
   parseSupplyQuote(payload);
   await command.mutateAsync(initial?{name:"advance_merchant_supply_quote",args:{p_id:initial.id,p_revision:initial.revision,p_key:key.current,p_action:"revise",p_payload:{payload}}}:{name:"create_merchant_supply_quote",args:{p_key:key.current,p_payload:payload,p_request_id:request?.id??null}});
   toast.success("Devis enregistré en brouillon");close();
  }catch(error){toast.error((error as Error).message);}
 }
 return <form onSubmit={submit} className="space-y-5 rounded-xl border p-4">
  <h3 className="font-semibold">{initial?"Réviser le devis avant acceptation":"Préparer le devis d’acquisition"}</h3>
  {!data.options.operator&&<p role="alert" className="text-sm text-destructive">L’identité juridique de l’opérateur BIB doit être validée avant de préparer un devis.</p>}
  {!initial&&!request&&<p className="text-sm text-muted-foreground">Pour un devis de stock, partez d’une demande marchand avec échantillon payé et validé physiquement. Un devis d’échantillon peut être préparé avant ce contrôle.</p>}
  <div className="grid gap-4 md:grid-cols-2"><Label className="space-y-2"><span>Référence produit</span><select className="h-10 w-full rounded-md border bg-background px-3" required value={productId} onChange={e=>{setProductId(e.target.value);const prod=data.products.find(x=>x.id===e.target.value);const sup=data.suppliers.find(x=>x.id===prod?.supplier_id);setSupplierParty({entity_id:sup?.id,legal_name:sup?.name??"",address:sup?.address??"",email:sup?.contact_email??sup?.email??"",registration_id:"",evidence_reference:""});}}><option value="">Sélectionner une référence</option>{data.products.map(x=><option key={x.id} value={x.id}>{x.name} · {x.sku}</option>)}</select></Label>
  <Label className="space-y-2"><span>Marchand acheteur et boutique</span><select className="h-10 w-full rounded-md border bg-background px-3" required value={buyerId} onChange={e=>setBuyerId(e.target.value)}><option value="">Sélectionner un acheteur vérifié</option>{data.options.buyers.map(x=><option key={x.boutique_id} value={x.boutique_id}>{x.name} · {x.party.legal_name}</option>)}</select></Label>
  <Label className="space-y-2"><span>Objet</span><select className="h-10 w-full rounded-md border bg-background px-3" value={purpose} onChange={e=>setPurpose(e.target.value as typeof purpose)}><option value="sample">Échantillon</option><option value="stock">Approvisionnement</option><option value="on_demand">Commande à la demande</option></select></Label><Field label="Quantité produit" value={quantity} set={setQuantity} type="number"/></div>
  <fieldset className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2"><legend className="px-2 font-medium">Fournisseur vendeur identifié sur le devis</legend>{([['legal_name','Raison sociale légale'],['registration_id','Immatriculation / identifiant fiscal'],['address','Adresse légale'],['email','Email professionnel'],['evidence_reference','Référence de justificatif communicable au marchand']] as const).map(([k,label])=><Field key={k} label={label} value={supplierParty[k]??""} set={v=>setSupplierParty(a=>({...a,[k]:v}))}/>)}</fieldset>
  <div className="grid gap-4 md:grid-cols-3">{["Produit (prix HT unitaire)","Livraison (montant HT du devis)","Commission BIB (montant HT du devis)"].map((label,i)=><fieldset key={label} className="space-y-3 rounded-lg border p-3"><legend className="px-2 font-medium">{label}</legend><Field label="Montant HT en EUR" value={amounts[i]} set={v=>updateArray(setAmounts,i,v)}/><Field label="Taux de TVA en % (zéro à préciser)" value={rates[i]} set={v=>updateArray(setRates,i,v)}/><Field label="Régime fiscal applicable" value={taxReasons[i]} set={v=>updateArray(setTaxReasons,i,v)}/></fieldset>)}</div>
  <Label className="block space-y-2"><span>Émetteur réel de la facture de livraison</span><select className="h-10 w-full rounded-md border bg-background px-3" required value={deliveryIssuer} onChange={e=>setDeliveryIssuer(e.target.value as typeof deliveryIssuer)}><option value="">Sélectionner selon le contrat</option><option value="supplier">Le fournisseur facture sa prestation de livraison</option><option value="bib">BIB facture sa prestation propre de livraison</option></select></Label>
  <div className="grid gap-3 sm:grid-cols-2">{["Référence du mandat BIB","Contrat et version des conditions","Conditions et destination de livraison","Conditions de transfert de propriété"].map((label,i)=><Label key={label} className="block space-y-2"><span>{label}</span><Textarea required value={terms[i]} onChange={e=>updateArray(setTerms,i,e.target.value)}/></Label>)}<Field label="Fin de validité (heure locale)" value={validity} set={setValidity} type="datetime-local"/></div>
  <div className="flex flex-wrap gap-2"><Button disabled={command.isPending||!data.options.operator||(!initial&&!request&&purpose!=="sample")} type="submit">Enregistrer le brouillon</Button><Button type="button" variant="outline" onClick={close}>Fermer</Button></div>
 </form>;
}
function PriceEditor({data,canCreate,canApprove}:{data:Data;canCreate:boolean;canApprove:boolean}){
 const command=useSupplyCommand();const [product,setProduct]=useState(""),[amounts,setAmounts]=useState(["","",""]),[evidence,setEvidence]=useState("");
 return <div className="space-y-4"><p className="text-sm text-muted-foreground">Le prix indicatif visible au catalogue inclut produit, livraison et commission BIB. L’identité fournisseur reste dans les dossiers et devis protégés. La validation Finance ne qualifie pas le produit à la place de l’audit.</p>
  {canCreate&&<form className="space-y-3 rounded-lg border p-4" onSubmit={async e=>{e.preventDefault();try{await command.mutateAsync({name:"propose_catalog_acquisition_price",args:{p_product_id:product,p_price:{version:crypto.randomUUID(),currency:"EUR",goods_unit_cents:cents(amounts[0]),delivery_unit_cents:cents(amounts[1]),bib_fee_unit_cents:cents(amounts[2])},p_evidence_reference:evidence}});toast.success("Prix soumis à validation Finance");}catch(error){toast.error((error as Error).message);}}}>
   <Label className="block space-y-2"><span>Produit</span><select className="h-10 w-full rounded-md border bg-background px-3" required value={product} onChange={e=>setProduct(e.target.value)}><option value="">Sélectionner</option>{data.products.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Label>
   <div className="grid gap-3 sm:grid-cols-3">{["Produit TTC par unité","Livraison TTC par unité","Commission BIB TTC par unité"].map((label,i)=><Field key={label} label={label} value={amounts[i]} set={v=>setAmounts(a=>a.map((x,n)=>n===i?v:x))}/>)}</div>
   <Field label="Référence des conditions tarifaires à contrôler" value={evidence} set={setEvidence}/><Button disabled={command.isPending} type="submit">Soumettre le prix global</Button>
  </form>}
  {data.prices.map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-medium">{data.products.find(x=>x.id===p.product_id)?.name??"Référence catalogue"} · {supplyMoney(p.total_cents)}</p><p className="text-xs text-muted-foreground">{p.state==="approved"?"Validé Finance":p.state==="draft"?"À valider":"Remplacé"} · {p.evidence_reference}</p></div>{p.state==="draft"&&canApprove&&<Button variant="outline" disabled={command.isPending} onClick={async()=>{try{await command.mutateAsync({name:"approve_catalog_acquisition_price",args:{p_id:p.id}});toast.success("Prix global approuvé");}catch(error){toast.error((error as Error).message);}}}>Valider le prix</Button>}</div>)}
 </div>;
}
