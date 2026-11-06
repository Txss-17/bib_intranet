import { before, beforeEach, after, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { supplyQuoteTotals, destinationChargePlan } from "../../supabase/functions/_shared/supply-contract.mjs";
const supplier="10000000-0000-4000-8000-000000000001",product="20000000-0000-4000-8000-000000000001",merchant="30000000-0000-4000-8000-000000000001",boutique="40000000-0000-4000-8000-000000000001";
const author="50000000-0000-4000-8000-000000000001",finance="50000000-0000-4000-8000-000000000002",outsider="50000000-0000-4000-8000-000000000003";
const party=(id,name)=>({entity_id:id,legal_name:name,registration_id:"REG-TEST",address:"Adresse fictive",email:"test@example.test",evidence_reference:"JUSTIFICATIF-TEST"});
const bibId="60000000-0000-4000-8000-000000000001";
const payload=()=>({schema_version:1,model:"transparent_intermediation",purpose:"stock",merchant_id:merchant,boutique_id:boutique,catalog_id:product,supplier_id:supplier,quantity:3,currency:"EUR",parties:{supplier:party(supplier,"Fournisseur test"),merchant:{...party(merchant,"Marchand test"),evidence_reference:"Dossier juridique 70000000-0000-4000-8000-000000000001"},bib:party(bibId,"Opérateur BIB test")},lines:[{component:"goods",issuer:"supplier",label:"Produit",quantity:3,unit_net_cents:1000,tax_rate_bps:2000,tax_reason:"Régime fictif test"},{component:"delivery",issuer:"bib",label:"Livraison",quantity:1,unit_net_cents:500,tax_rate_bps:2000,tax_reason:"Régime fictif test"},{component:"bib_fee",issuer:"bib",label:"Commission BIB",quantity:1,unit_net_cents:200,tax_rate_bps:2000,tax_reason:"Régime fictif test"}],valid_until:"2030-01-01T00:00:00Z",mandate_reference:"MANDAT-TEST",terms_reference:"CGS-TEST",delivery_terms:"Réception chez un partenaire logistique BIB ; pas d’expédition directe au client.",ownership_terms:"Le contrat fournisseur fixe le transfert ; la sélection et le dépôt 3PL ne transfèrent pas la propriété."});
let db;
before(async()=>{db=new PGlite();await db.exec(await readFile(new URL("./fixture.sql",import.meta.url),"utf8"));await db.exec(await readFile(new URL("../../drizzle/migrations/0086_merchant_supply_model.sql",import.meta.url),"utf8")).catch(error=>{delete error.query;throw error;});await db.exec(await readFile(new URL("../../drizzle/migrations/0087_catalog_sandbox_isolation.sql",import.meta.url),"utf8"));});
after(async()=>db.close());
beforeEach(async()=>{
 await db.exec("TRUNCATE legal_governance_records");
 await db.query("UPDATE supply_operator_configuration SET enabled=true,party=$1,evidence_reference='REVUE-OP-TEST' WHERE singleton",[party(bibId,"Opérateur BIB test")]);
 const legalId="70000000-0000-4000-8000-000000000001";
 await db.query("INSERT INTO legal_governance_records(id,kind,payload,state,test_account,activation_sequence) VALUES($1,'identity',$2,'published',false,1)",[legalId,{store_id:boutique,owner_id:merchant,legal_entity_id:merchant,fields:{VENDEUR_NOM_LEGAL:"Marchand test",SIREN_SIRET:"REG-TEST",ADRESSE:"Adresse fictive",CONTACT_VENDEUR:"test@example.test"}}]);
 await db.exec("TRUNCATE test_reference_admissions,logistics_partners,merchant_supply_quotes,merchant_supply_events,catalog_acquisition_prices,suppliers,products,user_accounts,shops,test_permissions CASCADE");
 await db.query("INSERT INTO suppliers VALUES($1,'Supplier test','validated',false)",[supplier]);
 await db.query("INSERT INTO products VALUES($1,$2,'Produit test','SKU-1','validated',false)",[product,supplier]);
 await db.query("INSERT INTO test_reference_admissions VALUES($1,'SKU-1',true,false)",[supplier]);
 for(const action of ["read","create","update"])await db.query("INSERT INTO test_permissions VALUES($1,'supplier.restock',$2)",[author,action]);
 const owner=randomUUID();await db.query("INSERT INTO user_accounts VALUES($1,$2)",[owner,merchant]);await db.query("INSERT INTO shops VALUES($1,$2,$3,'Boutique test')",[randomUUID(),boutique,owner]);
 for(const action of ["read","create","update"])await db.query("INSERT INTO test_permissions VALUES($1,'supplier.suppliers',$2)",[author,action]);
 for(const action of ["read","validate"])await db.query("INSERT INTO test_permissions VALUES($1,'finance.billing',$2)",[finance,action]);
});
async function as(actor,fn,role="authenticated",testMode=false) {return db.transaction(async tx=>{await tx.exec("SET LOCAL ROLE "+role);await tx.query("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('bib.test_mode',$3,true)",[actor??"",role,String(testMode)]);return fn(tx);});}
const rpc=(actor,name,args,role,testMode=false)=>as(actor,async tx=>(await tx.query(`SELECT ${name}(${args.map((_,i)=>`$${i+1}`).join(',')}) result`,args)).rows[0].result,role,testMode).catch(e=>{delete e.query;throw e;});
const verifiedSample=()=>({merchant_id:merchant,boutique_id:boutique,catalog_id:product,environment:"live",sample_id:randomUUID(),product_id:randomUUID(),purchase_id:randomUUID(),visual_confirmed_at:"2026-11-01T12:00:00Z",verified_at:"2026-11-05T12:00:00Z"});
const create=async(p=payload(),key=randomUUID(),actor=author)=>{
 let source=null;if(p.purpose!=="sample")source=(await rpc(null,"create_merchant_supply_request",[merchant,boutique,merchant,"live",randomUUID(),{catalog_id:product,purpose:p.purpose,quantity:p.quantity,note:"Test",verified_sample:verifiedSample()}],"service_role")).request_id;
 return rpc(actor,"create_merchant_supply_quote",[key,p,source]);
};
const advance=(q,action,data={},actor=author,key=randomUUID())=>rpc(actor,"advance_merchant_supply_quote",[q.id,q.revision,key,action,data]);
async function issue(p=payload()) {let q=await create(p);q=await advance(q,"submit");q=await advance(q,"approve",{evidence_reference:"REVUE-TEST"},finance);return advance(q,"issue");}
const portal=(q,action="accept",p={})=>rpc(null,"merchant_supply_portal",[merchant,boutique,merchant,"live",action,q?.id??null,{accepted:true,quote_hash:q?.quote_hash,quote_version:q?.quote_version,signatory:"Représentant test",capacity:"Habilité pour le marchand",...p}],"service_role");
test("global total is exact, includes all components and keeps invoice issuers separate",async()=>{
 const p=payload(),js=supplyQuoteTotals(p),sql=await rpc(author,"calculate_supply_quote",[p]);assert.deepEqual(sql,js);assert.equal(sql.total_cents,4440);assert.deepEqual(sql.by_issuer,{supplier:3600,bib:840,logistics:0});
 const plan=destinationChargePlan(p,{flow:"merchant_acquisition",enabled:true,entity_id:supplier,account_id:"acct_SupplierTest",environment:"live"});assert.equal(plan.payment_intent_data.on_behalf_of,"acct_SupplierTest");assert.equal(plan.payment_intent_data.application_fee_amount,840);
});
test("one named supplier is visible only after issue and only to its exact merchant/boutique",async()=>{
 const q=await create();assert.deepEqual(await portal(null,"list"),[]);
 const sent=await issue();const [visible]=await portal(sent,"list");assert.equal(visible.payload.parties.supplier.legal_name,"Fournisseur test");assert.ok(!('approval_reference' in visible));
 const wrong=await rpc(null,"merchant_supply_portal",[randomUUID(),boutique,merchant,"live","list",null,{}],"service_role");assert.deepEqual(wrong,[]);
});
test("Finance approval is independent and direct changes cannot forge approval, amounts or paid state",async()=>{
 let q=await create();q=await advance(q,"submit");await assert.rejects(()=>advance(q,"approve",{evidence_reference:"X"}),/finance_permission_required/);
 await assert.rejects(()=>as(author,tx=>tx.query("UPDATE merchant_supply_quotes SET state='accepted' WHERE id=$1",[q.id])),/direct_write/);
 await assert.rejects(()=>advance(q,"record_coverage",{amount_cents:999999,evidence_reference:"X",coverage_terms:"X"}),/finance_permission_required/);
});
test("revision invalidates approval and stale acceptance; exact accepted text stays immutable",async()=>{
 let q=await issue();const old=q;q=await advance(q,"revise",{payload:{...q.payload,delivery_terms:"Nouvelle livraison"}});await assert.rejects(()=>portal(old),/acceptance_conflict/);
 q=await advance(q,"submit");q=await advance(q,"approve",{evidence_reference:"R2"},finance);q=await advance(q,"issue");q=await portal(q);
 assert.equal(q.state,"accepted");assert.equal(q.acceptance.quote_hash,q.quote_hash);await assert.rejects(()=>advance(q,"revise",{payload:payload()}),/immutable/);
 assert.equal((await portal(q)).state,"accepted");
});
test("acceptance never marks paid or credits physical stock; invoices use the true issuer and merchant debtor",async()=>{
 let q=await portal(await issue());assert.deepEqual(q.payment_evidence,[]);
 await assert.rejects(()=>advance(q,"attach_invoice",{issuer:"supplier",reference:"F-TEST",document_reference:"DOC",amount_cents:4440,debtor:"merchant"},finance),/issuer_or_amount/);
 q=await advance(q,"attach_invoice",{issuer:"supplier",reference:"F-TEST",document_reference:"DOC",amount_cents:3600,debtor:"merchant"},finance);assert.equal(q.invoice_documents[0].issuer,"supplier");
});
test("catalogue price cannot be approved by its author and contains no supplier identity",async()=>{
 const price={version:"test-v1",currency:"EUR",goods_unit_cents:1000,delivery_unit_cents:100,bib_fee_unit_cents:150};
 const id=await rpc(author,"propose_catalog_acquisition_price",[product,price,"TARIF-TEST"]);await assert.rejects(()=>rpc(author,"approve_catalog_acquisition_price",[id]),/finance_permission_required/);
 await rpc(finance,"approve_catalog_acquisition_price",[id]);assert.deepEqual(await rpc(null,"get_catalog_acquisition_price",[product],"service_role"),price);
 const publication=await rpc(null,"get_catalog_acquisition_publication",[product],"service_role");assert.deepEqual(publication.price,price);
 assert.ok(Date.parse(publication.source_updated_at)>Date.parse("2026-11-01T00:00:00Z"),"an approved price has a durable publication version");

 await assert.rejects(()=>rpc(author,"propose_catalog_acquisition_price",[product,{...price,supplier_name:"leak"},"TARIF"]),/invalid_acquisition_price/);
});
test("single-destination payment refuses an additional independent logistics beneficiary",()=>{
 const p=payload();p.lines[1].issuer="logistics";p.parties.logistics=party(randomUUID(),"Transporteur test");assert.throws(()=>destinationChargePlan(p,{enabled:true}),/single_beneficiary/);
});
test("merchant requests are scoped, idempotent and atomically linked to the prepared quote",async()=>{
 const input={catalog_id:product,quantity:3,purpose:"stock",note:"Personnalisation à chiffrer",verified_sample:verifiedSample()},key=randomUUID();
 const request=()=>rpc(null,"create_merchant_supply_request",[merchant,boutique,merchant,"live",key,input],"service_role");
 const first=await request();assert.deepEqual(await request(),first);
 await assert.rejects(()=>rpc(null,"create_merchant_supply_request",[merchant,boutique,merchant,"live",key,{...input,quantity:4}],"service_role"),/request_key_conflict/);
 await assert.rejects(()=>rpc(null,"create_merchant_supply_request",[outsider,boutique,merchant,"live",randomUUID(),input],"service_role"),/verified_supply_request/);
 await assert.rejects(()=>rpc(null,"create_merchant_supply_request",[merchant,boutique,merchant,"sandbox",randomUUID(),input],"service_role"),/verified_supply_request/);
 const quote=await rpc(author,"create_merchant_supply_quote",[randomUUID(),payload(),first.request_id]);
 const linked=(await db.query("SELECT state,quote_id FROM merchant_supply_requests WHERE id=$1",[first.request_id])).rows[0];
 assert.equal(linked.state,"quoted");assert.equal(linked.quote_id,quote.id);
});
test("latest audit withdrawal blocks acceptance and makes an accepted quote ineligible for checkout",async()=>{
 let q=await issue();await db.exec("UPDATE test_reference_admissions SET admitted=false");
 await assert.rejects(()=>portal(q),/current_supplier_admission/);
 assert.equal((await portal(q,"list"))[0].checkout_eligible,false);
 await db.exec("UPDATE test_reference_admissions SET admitted=true");q=await portal(q);
 await db.exec("UPDATE test_reference_admissions SET admitted=false");
 assert.equal((await portal(q,"list"))[0].checkout_eligible,false);
});
test("a paid PSP event alone cannot start production; coverage and refund holds are enforced",async()=>{
 let q=await portal(await issue());const destination=randomUUID();await db.query("INSERT INTO logistics_partners VALUES($1,'Entrepôt fictif','active')",[destination]);
 const order=(await as(author,tx=>tx.query("INSERT INTO supplier_restock_orders(supply_quote_id,destination_type,destination_id,destination_name) VALUES($1,'logistics_partner',$2,'Entrepôt fictif') RETURNING *",[q.id,destination]))).rows[0];
 assert.equal(order.buyer_merchant_id,merchant);assert.equal(order.quantity,3);assert.equal(order.status,"draft");
 const status=value=>as(author,tx=>tx.query("UPDATE supplier_restock_orders SET status=$1 WHERE id=$2",[value,order.id]));
 await assert.rejects(()=>status("received"),/transition_conflict/);await status("sent");
 const evidence={quote_id:q.id,quote_hash:q.quote_hash,environment:"live",amount_cents:4440,currency:"EUR",supplier_cents:3600,bib_revenue_cents:700,stripe_session_id:"cs_test",event_id:"evt_test",state:"paid",revision:2};
 const receive=value=>rpc(null,"receive_merchant_supply_settlement",[q.id,"live",value],"service_role");
 assert.equal(await receive(evidence),"applied");assert.equal(await receive(evidence),"replayed");
 await assert.rejects(()=>status("in_production"),/financial_coverage_required/);
 q=(await db.query("SELECT * FROM merchant_supply_quotes WHERE id=$1",[q.id])).rows[0];
 q=await advance(q,"record_coverage",{amount_cents:4440,evidence_reference:"GARANTIE-TEST",coverage_terms:"Fonds réellement disponibles, vérifiés pour cette opération",valid_until:"2030-01-01T00:00:00Z"},finance);
 await status("in_production");
 assert.equal(await receive({...evidence,event_id:"evt_refund",state:"partially_refunded",refunded_cents:1000,revision:3}),"applied");
 assert.equal(await receive(evidence),"stale");
 await assert.rejects(()=>status("shipped"),/financial_coverage_required/);
 assert.equal((await db.query("SELECT payment_evidence FROM merchant_supply_quotes WHERE id=$1",[q.id])).rows[0].payment_evidence.length,2);
 await assert.rejects(()=>receive({...evidence,event_id:"evt_invalid_restore",state:"paid",revision:4}),/supply_refund_regression/);
});
test("self fees and ambiguous or invalid dates are rejected by both validators",async()=>{
 const self=payload();self.parties.bib=self.parties.merchant;
 assert.throws(()=>supplyQuoteTotals(self),/no_self_invoicing/);
 await assert.rejects(()=>rpc(author,"calculate_supply_quote",[self]),/invalid_supply_issuer_or_amount/);
 for(const date of ["2030-01-01","2030-02-30T00:00:00Z","2030-01-01T24:00:00Z"]){
  const invalid={...payload(),valid_until:date};assert.throws(()=>supplyQuoteTotals(invalid));
  await assert.rejects(()=>rpc(author,"calculate_supply_quote",[invalid]));
 }
});

test("staff cannot bypass the verified merchant sample request when drafting stock quotes",async()=>{
 await assert.rejects(()=>rpc(author,"create_merchant_supply_quote",[randomUUID(),payload()]),/verified_sample_request_required/);
 await assert.rejects(()=>rpc(null,"create_merchant_supply_request",[merchant,boutique,merchant,"live",randomUUID(),{catalog_id:product,purpose:"stock",quantity:1,note:"No proof"}],"service_role"),/verified_paid_sample_required/);
 const p=payload();p.purpose="sample";assert.equal((await create(p)).state,"draft");
});

test("a won dispute requires a fresh Finance coverage review before production resumes",async()=>{
 let q=await portal(await issue());const destination=randomUUID();await db.query("INSERT INTO logistics_partners VALUES($1,'Logisticien fictif','active')",[destination]);
 const order=(await as(author,tx=>tx.query("INSERT INTO supplier_restock_orders(supply_quote_id,destination_type,destination_id,destination_name) VALUES($1,'logistics_partner',$2,'Test') RETURNING id",[q.id,destination]))).rows[0];
 const status=value=>as(author,tx=>tx.query("UPDATE supplier_restock_orders SET status=$1 WHERE id=$2",[value,order.id]));await status("sent");
 const coverage={amount_cents:4440,evidence_reference:"COVERAGE-TEST",coverage_terms:"Fonds vérifiés pour l’opération",valid_until:"2030-01-01T00:00:00Z"};
 q=await advance(q,"record_coverage",coverage,finance);
 const evidence={quote_id:q.id,quote_hash:q.quote_hash,environment:"live",amount_cents:4440,currency:"EUR",supplier_cents:3600,bib_revenue_cents:700,stripe_session_id:"cs_dispute_test",event_id:"evt_dispute",state:"disputed",revision:2,refunded_cents:0,requires_finance_review:true};
 const receive=value=>rpc(null,"receive_merchant_supply_settlement",[q.id,"live",value],"service_role");
 await receive(evidence);await assert.rejects(()=>status("in_production"),/financial_coverage_required/);
 await receive({...evidence,event_id:"evt_won",state:"paid",revision:3});await assert.rejects(()=>status("in_production"),/financial_coverage_required/);
 q=(await db.query("SELECT * FROM merchant_supply_quotes WHERE id=$1",[q.id])).rows[0];q=await advance(q,"record_coverage",{...coverage,evidence_reference:"FRESH-COVERAGE-TEST"},finance);
 await status("in_production");
});

test("sandbox price publications stay private and cannot be read through the legacy live API",async()=>{
 await db.exec("UPDATE products SET test_account=true;UPDATE suppliers SET test_account=true");
 const price={version:"PRIX-SANDBOX",currency:"EUR",goods_unit_cents:1000,delivery_unit_cents:100,bib_fee_unit_cents:150};
 const id=await rpc(author,"propose_catalog_acquisition_price",[product,price,"TARIF-FICTIF"],"authenticated",true);
 await rpc(finance,"approve_catalog_acquisition_price",[id],"authenticated",true);
 assert.equal(await rpc(null,"get_catalog_acquisition_publication",[product],"service_role"),null);
 assert.equal(await rpc(null,"get_catalog_acquisition_publication",[product,false],"service_role"),null);
 assert.deepEqual((await rpc(null,"get_catalog_acquisition_publication",[product,true],"service_role")).price,price);
 await assert.rejects(()=>rpc(author,"get_catalog_acquisition_publication",[product,true]),/permission denied/);
});
