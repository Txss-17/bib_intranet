// Shared verbatim with BIB Platform. No identity is included in the catalogue DTO.
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const fail = message => { throw new Error(message); };
const object = (value, keys) => {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key))) fail("invalid_supply_object");
};
const text = (value, limit = 2000) => {
  if (typeof value !== "string" || !value.trim() || value.length > limit) fail("required_supply_text");
  return value;
};
const integer = (value, min, max) => {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail("invalid_supply_amount");
  return value;
};

export function parseAcquisitionPrice(value) {
  object(value, ["version", "currency", "goods_unit_cents", "delivery_unit_cents", "bib_fee_unit_cents"]);
  text(value.version, 100);
  if (value.currency !== "EUR") fail("unsupported_supply_currency");
  const total = integer(value.goods_unit_cents, 1, 100_000_000) + integer(value.delivery_unit_cents, 0, 100_000_000) + integer(value.bib_fee_unit_cents, 0, 100_000_000);
  integer(total, 1, 100_000_000);
  return { version: value.version, currency: "EUR", goods_unit_cents: value.goods_unit_cents, delivery_unit_cents: value.delivery_unit_cents, bib_fee_unit_cents: value.bib_fee_unit_cents };
}
export function acquisitionUnitTotal(value) {
  const price = parseAcquisitionPrice(value);
  return price.goods_unit_cents + price.delivery_unit_cents + price.bib_fee_unit_cents;
}

export function parseSupplyQuote(value) {
  object(value, ["schema_version", "model", "purpose", "merchant_id", "boutique_id", "catalog_id", "supplier_id", "quantity", "currency", "parties", "lines", "valid_until", "mandate_reference", "terms_reference", "delivery_terms", "ownership_terms"]);
  if (value.schema_version !== 1 || value.model !== "transparent_intermediation" || !["sample", "stock", "on_demand"].includes(value.purpose) || value.currency !== "EUR") fail("invalid_supply_model");
  for (const key of ["merchant_id", "boutique_id", "catalog_id", "supplier_id"]) if (!uuid.test(value[key] ?? "")) fail("invalid_supply_identity");
  integer(value.quantity, 1, 100_000);
  object(value.parties, ["merchant", "supplier", "bib", "logistics"]);
  for (const role of ["merchant", "supplier", "bib", ...(value.parties.logistics ? ["logistics"] : [])]) {
    const party = value.parties[role];
    object(party, ["entity_id", "legal_name", "registration_id", "address", "email", "evidence_reference"]);
    if (!uuid.test(party.entity_id ?? "")) fail("invalid_supply_party");
    for (const key of ["legal_name", "registration_id", "address", "email", "evidence_reference"]) text(party[key], key === "address" ? 1000 : 500);
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(party.email)) fail("invalid_supply_email");
  }
  if (value.parties.supplier.entity_id !== value.supplier_id) fail("supplier_party_mismatch");
  if (!Array.isArray(value.lines) || value.lines.length !== 3) fail("three_supply_components_required");
  const components = new Set();
  for (const line of value.lines) {
    object(line, ["component", "issuer", "label", "quantity", "unit_net_cents", "tax_rate_bps", "tax_reason"]);
    if (!["goods", "delivery", "bib_fee"].includes(line.component) || components.has(line.component) || !["supplier", "bib", "logistics"].includes(line.issuer)) fail("invalid_supply_line");
    if (line.component === "goods" && (line.issuer !== "supplier" || line.quantity !== value.quantity)) fail("supplier_is_goods_seller");
    if (line.component === "bib_fee" && line.issuer !== "bib") fail("bib_is_fee_issuer");
    if (line.issuer === "logistics" && !value.parties.logistics) fail("logistics_identity_required");
    text(line.label, 500); text(line.tax_reason, 1000);
    integer(line.quantity, 1, 100_000); integer(line.unit_net_cents, line.component === "goods" ? 1 : 0, 100_000_000); integer(line.tax_rate_bps, 0, 10_000);
    components.add(line.component);
  }
  if (value.parties.merchant.entity_id === value.parties.bib.entity_id && value.lines.some(line => line.issuer === "bib" && line.unit_net_cents !== 0)) fail("no_self_invoicing");
  const date = typeof value.valid_until === "string" && /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?Z$/.exec(value.valid_until);
  if (!date || Number(date[1]) < 1 || !Number.isFinite(Date.parse(value.valid_until)) || new Date(value.valid_until).getUTCDate() !== Number(date[3])) fail("invalid_supply_validity");
  for (const key of ["mandate_reference", "terms_reference", "delivery_terms", "ownership_terms"]) text(value[key]);
  return value;
}

export function supplyQuoteTotals(input) {
  const quote = parseSupplyQuote(input);
  const byIssuer = { supplier: 0, bib: 0, logistics: 0 };
  const byIssuerNet = { supplier: 0, bib: 0, logistics: 0 };
  let net = 0, tax = 0;
  const lines = quote.lines.map(line => {
    const netCents = integer(line.quantity * line.unit_net_cents, 0, 100_000_000_000);
    const taxCents = Math.floor((netCents * line.tax_rate_bps + 5000) / 10_000);
    const totalCents = integer(netCents + taxCents, 0, 100_000_000_000);
    byIssuer[line.issuer] += totalCents; byIssuerNet[line.issuer] += netCents; net += netCents; tax += taxCents;
    return { ...line, net_cents: netCents, tax_cents: taxCents, total_cents: totalCents };
  });
  integer(net + tax, 1, 100_000_000_000);
  return { currency: quote.currency, net_cents: net, tax_cents: tax, total_cents: net + tax, by_issuer: byIssuer, by_issuer_net: byIssuerNet, lines };
}

export function destinationChargePlan(input, route) {
  const quote = parseSupplyQuote(input), totals = supplyQuoteTotals(quote);
  if (totals.by_issuer.logistics > 0) fail("destination_charges_single_beneficiary_required");
  if (!route || route.enabled !== true || route.flow !== "merchant_acquisition" || route.entity_id !== quote.parties.supplier.entity_id || !/^acct_[a-zA-Z0-9]+$/.test(route.account_id ?? "") || !["sandbox", "live"].includes(route.environment)) fail("verified_destination_required");
  return { total_cents: totals.total_cents, supplier_cents: totals.by_issuer.supplier, bib_revenue_cents: totals.by_issuer_net.bib, bib_collected_cents: totals.by_issuer.bib,
    payment_intent_data: { on_behalf_of: route.account_id, transfer_data: { destination: route.account_id }, application_fee_amount: totals.by_issuer.bib } };
}
