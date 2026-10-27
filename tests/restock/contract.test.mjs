import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const source = fs.readFileSync(new URL("../../supabase/functions/_shared/restock-contract.ts", import.meta.url), "utf8");
const javascript = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { parseRestockRequest, restockMirrorPayload, assertRestockReview } = await import("data:text/javascript;base64," + Buffer.from(javascript).toString("base64"));
const id = n => "10000000-0000-4000-8000-" + String(n).padStart(12, "0");
const row = () => ({
  id:id(1), product_id:id(2), supplier_product_id:id(3), intranet_product_id:id(4), boutique_id:id(5),
  boutique_name:"Boutique BIB", product_name:"Produit", requested_quantity:20, catalog_moq:10,
  status:"requested", note:null, review_comment:null, version:1,
  created_at:"2026-10-27T09:00:00Z", updated_at:"2026-10-27T09:00:00Z",
});
test("accepts a complete public export and maps each distinct identity", () => {
  const parsed=parseRestockRequest(row()), mirror=restockMirrorPayload(parsed);
  assert.equal(mirror.platform_request_id,id(1));
  assert.equal(mirror.product_id,id(4));
  assert.equal(mirror.platform_product_id,id(2));
  assert.equal(mirror.platform_supplier_product_id,id(3));
  assert.equal(mirror.platform_boutique_id,id(5));
  assert.equal("stock" in mirror,false);
});
test("every required identity is validated", () => {
  for(const key of ["id","product_id","supplier_product_id","intranet_product_id","boutique_id"])
    assert.throws(()=>parseRestockRequest({...row(),[key]:"wrong"}));
});
test("requires positive int32 quantities MOQ and version", () => {
  for(const key of ["requested_quantity","catalog_moq","version"])
    for(const value of [undefined,null,0,-1,1.5,"1",Infinity,2147483648])
      assert.throws(()=>parseRestockRequest({...row(),[key]:value}));
});
test("rejects malformed status and timestamps", () => {
  for(const patch of [{status:"draft"},{created_at:"yesterday"},{updated_at:"2026-10-26T09:00:00Z"},{updated_at:"2026-10-27T09:00:00"}])
    assert.throws(()=>parseRestockRequest({...row(),...patch}));
});
test("existing long names and notes remain valid; review comments have a hard bound", () => {
  assert.equal(parseRestockRequest({...row(),product_name:"P".repeat(1000),note:"N".repeat(5000)}).note.length,5000);
  assert.throws(()=>parseRestockRequest({...row(),review_comment:"X".repeat(2001)}));
});
test("review uses raw authoritative response and retains export enrichment", () => {
  const response={...row(),status:"approved",version:2,review_comment:"Délai confirmé",updated_at:"2026-10-27T10:00:00Z"};
  delete response.intranet_product_id; delete response.product_name; delete response.boutique_name;
  const result=assertRestockReview(row(),response,1,"approved","Délai confirmé");
  assert.equal(result.intranet_product_id,id(4)); assert.equal(result.product_name,"Produit");
  assert.equal(result.status,"approved"); assert.equal(result.version,2);
});
test("review rejects mismatched identifiers, decision, quantities and version", () => {
  const response={...row(),status:"approved",version:2,review_comment:null,updated_at:"2026-10-27T10:00:00Z"};
  for(const patch of [{id:id(9)},{product_id:id(9)},{supplier_product_id:id(9)},{boutique_id:id(9)},{status:"rejected"},{version:1},{version:3},{requested_quantity:21},{catalog_moq:11},{review_comment:"unexpected"},{note:"changed"}])
    assert.throws(()=>assertRestockReview(row(),{...response,...patch},1,"approved",null));
});
test("creation timestamp representations may differ without changing the instant", () => {
  const response={...row(),status:"approved",version:2,created_at:"2026-10-27T09:00:00+00:00",updated_at:"2026-10-27T10:00:00Z"};
  assert.equal(assertRestockReview(row(),response,1,"approved",null).status,"approved");
});
test("bridge checks caller scope before posting and only mirrors authoritative reply", () => {
  const bridge=fs.readFileSync(new URL("../../supabase/functions/platform-bridge/index.ts",import.meta.url),"utf8");
  const section=bridge.slice(bridge.indexOf('if (body.action === "review_restock")'),bridge.indexOf('if (body.action === "review_customization")'));
  assert.match(section,/Authorization: "Bearer " \+ token/);
  assert.ok(section.indexOf('caller.rpc("can_manage_product_customization"')<section.indexOf('type: "restock_review"'));
  assert.ok(section.indexOf("assertRestockReview(")<section.indexOf('admin.rpc("upsert_platform_stock_restock_request"'));
  assert.doesNotMatch(section,/stock_movements|supplier_restock_orders|current_stock/);
  assert.match(section,/body.status === "rejected" && !comment/);
});
