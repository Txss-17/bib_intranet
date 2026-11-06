const json = (body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
const id=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const externalQuote=q=>{
 const keys=["id","reference","payload","totals","product_name","quote_hash","quote_version","state","acceptance","invoice_documents","payment_evidence","revision","checkout_eligible"];
 const result=Object.fromEntries(keys.filter(k=>q?.[k]!==undefined).map(k=>[k,q[k]]));
 if(Array.isArray(result.invoice_documents))result.invoice_documents=result.invoice_documents.map(d=>Object.fromEntries(["issuer","reference","document_reference","amount_cents","debtor"].filter(k=>d[k]!==undefined).map(k=>[k,d[k]])));
 // The accepting merchant's identity is part of the payment evidence. Staff IDs stay private.
 if(result.acceptance)result.acceptance=Object.fromEntries(["actor_id","at","signatory","capacity","quote_hash","quote_version"].filter(k=>result.acceptance[k]!==undefined).map(k=>[k,result.acceptance[k]]));
 if(Array.isArray(result.payment_evidence))result.payment_evidence=result.payment_evidence.map(e=>Object.fromEntries(["state","recorded_at","amount_cents","currency"].filter(k=>e[k]!==undefined).map(k=>[k,e[k]])));
 return result;
};
const same=(a,b)=>{let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0;};
export function createMerchantSupplyPortal({secret,environment,getAdmin}){
 return async req=>{
  if(req.method!=="POST")return json({error:"method_not_allowed"},405);
  if(typeof secret!=="string"||secret.length<32||!["sandbox","live"].includes(environment))return json({error:"supply_portal_unavailable"},503);
  if(!same(req.headers.get("x-bib-bridge-key")??"",secret))return json({error:"unauthorized"},401);
  let body;try{const raw=await req.text();if(raw.length>12000)throw new Error();body=JSON.parse(raw);}catch{return json({error:"invalid_request"},400);}
  if(!body||typeof body!=="object"||Array.isArray(body)||Object.keys(body).some(k=>!["action","environment","merchant_id","boutique_id","buyer_entity_id","quote_id","request_key","payload"].includes(k))||body.environment!==environment||!["list","accept","settlement","request"].includes(body.action))return json({error:"invalid_request"},400);
  if(body.action!=="settlement"&&[body.merchant_id,body.boutique_id,body.buyer_entity_id].some(v=>typeof v!=="string"||!id.test(v)))return json({error:"invalid_request"},400);
  if(["accept","settlement"].includes(body.action)&&(typeof body.quote_id!=="string"||!id.test(body.quote_id)))return json({error:"invalid_request"},400);
  const p=body.payload??{};
  if(typeof p!=="object"||Array.isArray(p))return json({error:"invalid_request"},400);
  if(body.action==="request"&&(typeof body.request_key!=="string"||!id.test(body.request_key)))return json({error:"invalid_request"},400);
  if(body.action==="accept"&&(Object.keys(p).some(k=>!["quote_hash","quote_version","accepted","signatory","capacity"].includes(k))||p.accepted!==true||!/^[a-f0-9]{64}$/.test(p.quote_hash??"")||!Number.isSafeInteger(p.quote_version)||typeof p.signatory!=="string"||!p.signatory.trim()||p.signatory.length>250||typeof p.capacity!=="string"||!p.capacity.trim()||p.capacity.length>500))return json({error:"invalid_request"},400);
  const success=data=>json({schema_version:1,source_app:"intrabib",environment,...data});
  try{
   const {data,error}=body.action==="request"
    ?await getAdmin().rpc("create_merchant_supply_request",{p_merchant_id:body.merchant_id,p_boutique_id:body.boutique_id,p_buyer_entity_id:body.buyer_entity_id,p_environment:environment,p_key:body.request_key,p_payload:p})
    :body.action==="settlement"
    ?await getAdmin().rpc("receive_merchant_supply_settlement",{p_quote_id:body.quote_id,p_environment:environment,p_evidence:p})
    :await getAdmin().rpc("merchant_supply_portal",{p_merchant_id:body.merchant_id,p_boutique_id:body.boutique_id,p_buyer_entity_id:body.buyer_entity_id,p_environment:environment,p_action:body.action,p_quote_id:body.quote_id??null,p_payload:p});
   if(error)return json({error:error.code==="40001"?"quote_changed":"supply_portal_unavailable"},error.code==="40001"?409:503);
   if(body.action==="list")return success({quotes:(data??[]).map(externalQuote)});
   return success(body.action==="accept"?{quote:externalQuote(data)}:body.action==="request"?data:{ok:true});
  }catch{return json({error:"supply_portal_unavailable"},503);}
 };
}
