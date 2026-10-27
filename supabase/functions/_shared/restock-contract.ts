/** Public Platform restock data only. Purchasing and stock movements stay separate. */
export const RESTOCK_STATUSES = ["requested", "approved", "ordered", "received", "rejected", "cancelled"] as const;
export interface RestockRequest {
  id: string;
  product_id: string;
  supplier_product_id: string;
  intranet_product_id: string;
  boutique_id: string;
  boutique_name: string | null;
  product_name: string;
  requested_quantity: number;
  catalog_moq: number;
  status: typeof RESTOCK_STATUSES[number];
  note: string | null;
  review_comment: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function text(value: unknown, max: number, nullable = false): string | null {
  if (nullable && value === null) return null;
  if (typeof value !== "string" || value.length > max || (!nullable && !value.trim()))
    throw new Error("invalid_restock_text");
  return value;
}
export function parseRestockRequest(input: unknown): RestockRequest {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("invalid_restock_request");
  const row = input as Record<string, unknown>;
  const ids = ["id", "product_id", "supplier_product_id", "intranet_product_id", "boutique_id"] as const;
  for (const key of ids)
    if (typeof row[key] !== "string" || !uuidPattern.test(row[key] as string))
      throw new Error("invalid_restock_identity: " + key);
  for (const key of ["version", "requested_quantity", "catalog_moq"] as const)
    if (!Number.isSafeInteger(row[key]) || Number(row[key]) < 1 || Number(row[key]) > 2147483647)
      throw new Error("invalid_restock_integer: " + key);
  if (!RESTOCK_STATUSES.includes(row.status as RestockRequest["status"]))
    throw new Error("invalid_restock_status");
  for (const key of ["created_at", "updated_at"] as const)
    if (typeof row[key] !== "string" || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(row[key] as string) || !Number.isFinite(Date.parse(row[key] as string)))
      throw new Error("invalid_restock_timestamp: " + key);
  if (Date.parse(row.updated_at as string) < Date.parse(row.created_at as string))
    throw new Error("invalid_restock_timestamp_order");
  return {
    id: row.id as string,
    product_id: row.product_id as string,
    supplier_product_id: row.supplier_product_id as string,
    intranet_product_id: row.intranet_product_id as string,
    boutique_id: row.boutique_id as string,
    boutique_name: text(row.boutique_name, Infinity, true),
    product_name: text(row.product_name, Infinity) as string,
    requested_quantity: row.requested_quantity as number,
    catalog_moq: row.catalog_moq as number,
    status: row.status as RestockRequest["status"],
    note: text(row.note, Infinity, true),
    review_comment: text(row.review_comment, 2000, true),
    version: row.version as number,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}
export function restockMirrorPayload(row: RestockRequest) {
  return {
    platform_request_id: row.id,
    product_id: row.intranet_product_id,
    platform_product_id: row.product_id,
    platform_supplier_product_id: row.supplier_product_id,
    platform_boutique_id: row.boutique_id,
    boutique_name: row.boutique_name,
    product_name: row.product_name,
    requested_quantity: row.requested_quantity,
    catalog_moq: row.catalog_moq,
    status: row.status,
    note: row.note,
    review_comment: row.review_comment,
    version: row.version,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
export function assertRestockReview(request: RestockRequest, response: unknown, version: number, status: "approved" | "rejected", comment: string | null) {
  if (!response || typeof response !== "object" || Array.isArray(response))
    throw new Error("invalid_restock_review_response");
  const result = parseRestockRequest({
    ...(response as Record<string, unknown>),
    intranet_product_id: request.intranet_product_id,
    boutique_name: request.boutique_name,
    product_name: request.product_name,
  });
  if (result.id !== request.id || result.product_id !== request.product_id
      || result.supplier_product_id !== request.supplier_product_id
      || result.intranet_product_id !== request.intranet_product_id
      || result.boutique_id !== request.boutique_id
      || result.version !== version + 1 || result.status !== status
      || result.review_comment !== comment
      || result.requested_quantity !== request.requested_quantity
      || result.catalog_moq !== request.catalog_moq
      || result.note !== request.note || Date.parse(result.created_at) !== Date.parse(request.created_at))
    throw new Error("invalid_restock_review_response");
  return result;
}
