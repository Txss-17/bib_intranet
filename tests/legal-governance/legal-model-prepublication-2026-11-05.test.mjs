import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const source=JSON.parse(read("docs/legal-model-prepublication-contract-2026-11-05.json"));
const sql=read("drizzle/migrations/0084_legal_document_governance.sql");
test("la source de prépublication ne déclenche aucune publication Intrabib",()=>{
 assert.equal(source.status,"BROUILLON_NON_PUBLIE");
 assert.equal(source.effective_at,null);
 assert.deepEqual(source.approval,{legal:false,direction:false,transmission:false});
 assert.deepEqual(source.allowed_models,["JUR-B01","JUR-B02","JUR-B03"]);
});
test("mêmes champs obligatoires que le contrat SQL Intrabib",()=>{
 const block=sql.match(/required:=CASE p->>'model_key'([\s\S]*?) END;/)?.[1];
 assert.ok(block);
 const readArray=(s)=>s.match(/'[^']+'/g).map(v=>v.slice(1,-1));
 for(const k of ["JUR-B01","JUR-B02"]){
   const spec=block.match(new RegExp("WHEN '"+k+"' THEN ARRAY\\[([^\\]]+)\\]"))?.[1];
   assert.ok(spec,k);
   assert.deepEqual(readArray(spec),source.required_placeholders[k]);
 }
 assert.deepEqual(readArray(block.match(/ELSE ARRAY\[([^\]]+)\]/)?.[1]),source.required_placeholders["JUR-B03"]);
});
test("deux revues distinctes imposées par le moteur Intrabib",()=>{
 assert.match(sql,/independent_legal_review_required/);
 assert.match(sql,/independent_direction_review_required/);
 assert.match(sql,/direction_approved/);
 assert.match(sql,/published/);
});
