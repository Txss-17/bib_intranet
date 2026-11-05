import test from "node:test";
import assert from "node:assert/strict";
import {
  canPublishSupplierProduct,
  loadAdmittedSupplierProduct,
} from "../../supabase/functions/_shared/supplier-reference-publication.mjs";

test("publication uses current read and validate rights on the same page", async () => {
  const caller = (grants) => ({
    rpc: async (_, { p_page, p_action }) => ({
      data: grants.includes(`${p_page}:${p_action}`),
      error: null,
    }),
  });
  assert.equal(
    await canPublishSupplierProduct(
      caller([
        "supplier.validated-products:read",
        "supplier.validated-products:validate",
      ]),
    ),
    true,
  );
  assert.equal(
    await canPublishSupplierProduct(
      caller(["marketplace.products:read", "marketplace.products:validate"]),
    ),
    true,
  );
  assert.equal(
    await canPublishSupplierProduct(
      caller([
        "supplier.validated-products:read",
        "marketplace.products:validate",
      ]),
    ),
    false,
  );
  assert.equal(
    await canPublishSupplierProduct(
      caller(["supplier.validated-products:read"]),
    ),
    false,
  );
  assert.equal(
    await canPublishSupplierProduct({
      rpc: async () => ({
        data: true,
        error: { message: "permission service unavailable" },
      }),
    }),
    false,
  );
});

function setup(
  product,
  { readError = null, admitted = true, admissionError = null, pricing = price, pricingError = null } = {},
) {
  const calls = [];
  const caller = {
    from(table) {
      calls.push(["caller", table]);
      return {
        select() {
          return this;
        },
        eq(column, id) {
          calls.push([column, id]);
          return this;
        },
        async single() {
          return { data: product, error: readError };
        },
      };
    },
  };
  const admin = {
    rpc: async (name, args) => {
      calls.push([name, args]);
      return name === "get_catalog_acquisition_publication" ? {data:{price:pricing,source_updated_at:"2026-11-05T12:00:00Z"},error:pricingError} : { data: admitted, error: admissionError };
    },
  };
  return { caller, admin, calls };
}
const price = {version:"TEST-v1",currency:"EUR",goods_unit_cents:1000,delivery_unit_cents:100,bib_fee_unit_cents:150};
const approved = {
  id: "product-1",
  status: "validated",
  supplier_id: "supplier-exact",
  sku: "SKU-A",
  test_account: false,
};

test("an inaccessible, unvalidated or sandbox product never invokes privileged admission lookup", async () => {
  for (const product of [
    null,
    { ...approved, status: "draft" },
    { ...approved, test_account: true },
    { ...approved, supplier_id: null },
    { ...approved, sku: " " },
  ]) {
    const { caller, admin, calls } = setup(product);
    const result = await loadAdmittedSupplierProduct(
      caller,
      admin,
      approved.id,
    );
    assert.ok(result.error);
    assert.equal(result.product, undefined);
    assert.ok(
      !calls.some(([name]) => name === "get_supplier_reference_admission"),
    );
  }
});

test("publication requires the exact supplier reference and fails closed on missing or unavailable admission", async () => {
  for (const options of [
    { admitted: false },
    { admitted: null },
    { admissionError: { code: "42883" } },
  ]) {
    const { caller, admin, calls } = setup(approved, options);
    const result = await loadAdmittedSupplierProduct(
      caller,
      admin,
      approved.id,
    );
    assert.ok(result.error);
    assert.equal(result.product, undefined);
    assert.deepEqual(calls.at(-1), [
      "get_supplier_reference_admission",
      {
        p_supplier_id: "supplier-exact",
        p_reference: "SKU-A",
        p_test_account: false,
      },
    ]);
  }
});

test("an admitted product retains the caller-scoped record without a service-role product read", async () => {
  const { caller, admin, calls } = setup(approved);
  const result = await loadAdmittedSupplierProduct(caller, admin, approved.id);
  assert.deepEqual(result.product, {...approved, acquisition_pricing: price,updated_at:"2026-11-05T12:00:00Z"});
  assert.deepEqual(calls.slice(0, 2), [
    ["caller", "products"],
    ["id", approved.id],
  ]);
});

test("an admitted product still cannot publish without an approved global acquisition price", async () => {
 for(const options of [{pricing:null},{pricingError:{code:"42883"}}]) {
  const {caller,admin}=setup(approved,options);
  const result=await loadAdmittedSupplierProduct(caller,admin,approved.id);
  assert.equal(result.status,503);assert.equal(result.product,undefined);
 }
});

test("price approval advances the bridge version without rolling back a newer product version", async()=>{
 for(const [productDate,expected] of [["2026-11-01T00:00:00Z","2026-11-05T12:00:00Z"],["2026-11-06T00:00:00Z","2026-11-06T00:00:00Z"]]){
  const {caller,admin}=setup({...approved,updated_at:productDate});
  const result=await loadAdmittedSupplierProduct(caller,admin,approved.id);
  assert.equal(result.product.updated_at,expected);assert.deepEqual(result.product.acquisition_pricing,price);
 }
});
