import {test} from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createMerchantSupplyPortal} from "../../supabase/functions/_shared/merchant-supply-portal-handler.mjs";
const secret="unit-test-bridge-key-32-characters-only";
const body=()=>({action:"list",environment:"sandbox",merchant_id:randomUUID(),boutique_id:randomUUID(),buyer_entity_id:randomUUID()});
const request=(value,key=secret)=>new Request("https://example.test/merchant-supply-portal",{method:"POST",headers:{"x-bib-bridge-key":key},body:typeof value==="string"?value:JSON.stringify(value)});
test("invalid caller, environment or payload cannot instantiate an administrator",async()=>{
 let calls=0;const handler=createMerchantSupplyPortal({secret,environment:"sandbox",getAdmin(){calls++;throw new Error("must not run");}});
 assert.equal((await handler(request(body(),"wrong-key"))).status,401);
 for(const value of [{...body(),environment:"live"},{...body(),action:"delete"},{...body(),supplier_id:randomUUID()},{...body(),payload:[]},"{malformed"])
  assert.equal((await handler(request(value))).status,400);
 assert.equal(calls,0);
 assert.equal((await createMerchantSupplyPortal({secret:"short",environment:"sandbox",getAdmin(){calls++;}})(request(body()))).status,503);
 assert.equal(calls,0);
});
test("merchant projection hides finance evidence and staff IDs while preserving seller and invoice identities",async()=>{
 const q={id:randomUUID(),payload:{parties:{supplier:{legal_name:"Vendeur de test"}}},state:"issued",checkout_eligible:true,
  approval_reference:"PRIVATE REVIEW",coverage:{evidence_reference:"PRIVATE BANK"},approved_by:randomUUID(),created_by:randomUUID(),
  acceptance:{at:"2030-01-01",signatory:"Acheteur",capacity:"Gérant",quote_hash:"a".repeat(64),actor_id:randomUUID(),payload:{private:true}},
  invoice_documents:[{issuer:"supplier",reference:"F-TEST",document_reference:"DOC-TEST",amount_cents:1000,debtor:"merchant",recorded_by:randomUUID()}],
  payment_evidence:[{state:"paid",amount_cents:1000,currency:"EUR",psp_evidence:{private:true},stripe_session_id:"cs_private"}]};
 let args;const handler=createMerchantSupplyPortal({secret,environment:"sandbox",getAdmin:()=>({rpc:async(name,input)=>{args={name,input};return{data:[q]};}})});
 const input=body(),response=await handler(request(input)),result=await response.json();assert.equal(response.status,200);
 assert.equal(args.name,"merchant_supply_portal");assert.equal(args.input.p_merchant_id,input.merchant_id);
 assert.equal(result.quotes[0].payload.parties.supplier.legal_name,"Vendeur de test");assert.equal(result.quotes[0].checkout_eligible,true);
 assert.equal(result.quotes[0].acceptance.actor_id,q.acceptance.actor_id);
 assert.equal(JSON.stringify(result).includes("PRIVATE"),false);assert.equal(JSON.stringify(result).includes("recorded_by"),false);
 assert.deepEqual(result.quotes[0].payment_evidence,[{state:"paid",amount_cents:1000,currency:"EUR"}]);
});
test("stale acceptance returns conflict and a failed settlement is never acknowledged",async()=>{
 const handler=createMerchantSupplyPortal({secret,environment:"sandbox",getAdmin:()=>({rpc:async()=>({error:{code:"40001",message:"private SQL"}})})});
 const acceptance={...body(),action:"accept",quote_id:randomUUID(),payload:{accepted:true,quote_hash:"a".repeat(64),quote_version:1,signatory:"Acheteur test",capacity:"Mandataire test"}};
 const response=await handler(request(acceptance));assert.equal(response.status,409);assert.deepEqual(await response.json(),{error:"quote_changed"});
 const settlement=await handler(request({action:"settlement",environment:"sandbox",quote_id:randomUUID(),payload:{}}));
 assert.equal(settlement.status,409);assert.equal((await settlement.json()).ok,undefined);
});
