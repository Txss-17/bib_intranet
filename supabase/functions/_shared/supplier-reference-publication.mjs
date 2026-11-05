/** Resolve current saved rights; grants from separate pages cannot be combined. */
export async function canPublishSupplierProduct(caller) {
  const rights = await Promise.all(
    ["supplier.validated-products", "marketplace.products"].map(
      async (page) => {
        const [read, validate] = await Promise.all([
          caller.rpc("can_intranet_action", { p_page: page, p_action: "read" }),
          caller.rpc("can_intranet_action", {
            p_page: page,
            p_action: "validate",
          }),
        ]);
        return (
          !read.error &&
          !validate.error &&
          read.data === true &&
          validate.data === true
        );
      },
    ),
  );
  return rights.some(Boolean);
}

/** Use the caller's RLS for the product, then the trusted latest audit decision. */
export async function loadAdmittedSupplierProduct(caller, admin, productId) {
  const { data: product, error } = await caller
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();
  if (error || !product) return { status: 404, error: "Produit introuvable" };
  if (!["validated", "approved", "active"].includes(String(product.status))) {
    return {
      status: 412,
      error: "Seuls les produits validés peuvent être publiés",
    };
  }
  if (
    product.test_account === true ||
    !product.supplier_id ||
    typeof product.sku !== "string" ||
    !product.sku.trim()
  ) {
    return {
      status: 412,
      error:
        "Le fournisseur, sa référence exacte et un produit réel sont requis.",
    };
  }
  const { data: admitted, error: admissionError } = await admin.rpc(
    "get_supplier_reference_admission",
    {
      p_supplier_id: product.supplier_id,
      p_reference: product.sku,
      p_test_account: false,
    },
  );
  if (admissionError)
    return {
      status: 503,
      error: "La vérification du référencement est indisponible.",
    };
  if (admitted !== true) {
    return {
      status: 412,
      error:
        "Cette référence doit être admise après validation du rapport d’audit avant sa publication.",
    };
  }
  const { data: publication, error: pricingError } = await admin.rpc("get_catalog_acquisition_publication", { p_product_id: product.id });
  if (pricingError || !publication?.price || typeof publication.source_updated_at !== "string" || !Number.isFinite(Date.parse(publication.source_updated_at))) return { status: 503, error: "Le prix global produit, livraison et commission BIB doit être validé par Finance avant publication." };
  const version = Date.parse(product.updated_at ?? "") > Date.parse(publication.source_updated_at) ? product.updated_at : publication.source_updated_at;
  return { product: { ...product, acquisition_pricing: publication.price, updated_at: version } };
}
