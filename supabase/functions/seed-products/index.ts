import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const results: any = {};

  // Create storage bucket
  const { error: bucketError } = await supabase.storage.createBucket("product-assets", {
    public: true,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    fileSizeLimit: 10485760,
  });
  results.bucket = bucketError ? (bucketError.message.includes("already exists") ? "exists" : bucketError.message) : "created";

  // Insert test suppliers
  const { error: suppError } = await supabase.from("suppliers").upsert([
    { id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", name: "BioNature France", status: "validated", country: "France", contact_name: "Jean Dupont", contact_email: "jean@bionature.fr", phone: "+33 1 23 45 67 89", risk_score: 15, validated_at: new Date().toISOString() },
    { id: "b2c3d4e5-f6a7-8901-bcde-f12345678901", name: "EcoSpice Maroc", status: "validated", country: "Maroc", contact_name: "Fatima Alami", contact_email: "fatima@ecospice.ma", phone: "+212 5 22 33 44 55", risk_score: 25, validated_at: new Date().toISOString() },
    { id: "c3d4e5f6-a7b8-9012-cdef-123456789012", name: "GreenLeaf Italia", status: "validated", country: "Italie", contact_name: "Marco Rossi", contact_email: "marco@greenleaf.it", phone: "+39 02 1234 5678", risk_score: 10, validated_at: new Date().toISOString() },
  ], { onConflict: "id" });
  results.suppliers = suppError?.message || "ok";

  // Insert test products
  const now = new Date();
  const { error: prodError } = await supabase.from("products").upsert([
    {
      id: "d4e5f6a7-b8c9-0123-defa-234567890123",
      name: "Huile d'olive extra vierge Bio",
      sku: "HUI-OLV-001",
      supplier_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      category: "Huiles & Vinaigres",
      description: "Huile d'olive extra vierge biologique, pressée à froid. Provenance directe des oliveraies du sud de la France. Certification AB et Eurofeuille.",
      unit_price: 8.50, selling_price: 14.90, margin: 42.95, moq: 24,
      status: "validated",
      image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400",
      ingredients: "Huile d'olive vierge extra biologique",
      dimensions: "250ml - Bouteille verre", weight: "350g",
      barcode: "3760001234567", origin: "Provence, France", shelf_life: "18 mois",
      tech_integration_status: "not_sent",
      validated_at: new Date(now.getTime() - 5 * 86400000).toISOString(),
    },
    {
      id: "e5f6a7b8-c9d0-1234-efab-345678901234",
      name: "Épices Ras el Hanout Premium",
      sku: "EPC-RAS-002",
      supplier_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      category: "Épices & Condiments",
      description: "Mélange traditionnel marocain de 27 épices soigneusement sélectionnées. Sans additifs ni conservateurs. Torréfaction artisanale.",
      unit_price: 4.20, selling_price: 9.50, margin: 55.79, moq: 48,
      status: "validated",
      image_url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400",
      ingredients: "Cumin, coriandre, curcuma, cannelle, gingembre, poivre noir, muscade, cardamome, clou de girofle, piment doux",
      dimensions: "100g - Pot verre", weight: "180g",
      barcode: "3760002345678", origin: "Marrakech, Maroc", shelf_life: "24 mois",
      tech_integration_status: "pending",
      validated_at: new Date(now.getTime() - 3 * 86400000).toISOString(),
      transmitted_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
    },
    {
      id: "f6a7b8c9-d0e1-2345-fabc-456789012345",
      name: "Pesto Basilic Genovese AOP",
      sku: "PST-BAS-003",
      supplier_id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
      category: "Sauces & Condiments",
      description: "Pesto alla genovese traditionnel AOP. Basilic frais de Ligurie, pignons de pin italiens, Parmigiano Reggiano DOP et huile d'olive extra vierge.",
      unit_price: 5.80, selling_price: 11.90, margin: 51.26, moq: 36,
      status: "validated",
      image_url: "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=400",
      ingredients: "Basilic genovese DOP (40%), huile d'olive extra vierge, pignons de pin, Parmigiano Reggiano DOP, Pecorino Fiore Sardo DOP, ail, sel",
      dimensions: "190g - Pot verre", weight: "280g",
      barcode: "3760003456789", origin: "Gênes, Italie", shelf_life: "12 mois",
      tech_integration_status: "integrated",
      validated_at: new Date(now.getTime() - 10 * 86400000).toISOString(),
      transmitted_at: new Date(now.getTime() - 7 * 86400000).toISOString(),
    },
    {
      id: "a7b8c9d0-e1f2-3456-abcd-567890123456",
      name: "Miel de Lavande Bio",
      sku: "MIL-LAV-004",
      supplier_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      category: "Miels & Sucres",
      description: "Miel de lavande biologique récolté dans les Alpes de Haute-Provence. Texture crémeuse, arôme floral délicat. Récolte 2024.",
      unit_price: 12.00, selling_price: 22.50, margin: 46.67, moq: 12,
      status: "validated",
      image_url: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400",
      ingredients: "Miel de lavande biologique",
      dimensions: "500g - Pot verre", weight: "650g",
      barcode: "3760004567890", origin: "Valensole, France", shelf_life: "36 mois",
      tech_integration_status: "not_sent",
      validated_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
    },
    {
      id: "b8c9d0e1-f2a3-4567-bcde-678901234567",
      name: "Thé Vert Menthe Premium",
      sku: "THE-MNT-005",
      supplier_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      category: "Thés & Infusions",
      description: "Thé vert gunpowder de qualité supérieure associé à de la menthe nana fraîche du Maroc. Conditionnement en vrac.",
      unit_price: 3.50, selling_price: 7.90, margin: 55.70, moq: 60,
      status: "validated",
      image_url: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400",
      ingredients: "Thé vert gunpowder (60%), feuilles de menthe nana (40%)",
      dimensions: "200g - Sachet refermable", weight: "220g",
      barcode: "3760005678901", origin: "Meknès, Maroc", shelf_life: "24 mois",
      tech_integration_status: "integrated",
      validated_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
      transmitted_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
    },
    {
      id: "c9d0e1f2-a3b4-5678-cdef-789012345678",
      name: "Vinaigre Balsamique di Modena IGP",
      sku: "VIN-BAL-006",
      supplier_id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
      category: "Huiles & Vinaigres",
      description: "Vinaigre balsamique de Modène IGP vieilli 8 ans en fûts de chêne. Dense et sirupeux avec des notes de fruits mûrs.",
      unit_price: 9.90, selling_price: 18.50, margin: 46.49, moq: 24,
      status: "validated",
      image_url: "https://images.unsplash.com/photo-1601648764658-cf37e8c89b70?w=400",
      ingredients: "Moût de raisin cuit, vinaigre de vin",
      dimensions: "250ml - Bouteille verre", weight: "450g",
      barcode: "3760006789012", origin: "Modène, Italie", shelf_life: "60 mois",
      tech_integration_status: "integrated",
      validated_at: new Date(now.getTime() - 8 * 86400000).toISOString(),
      transmitted_at: new Date(now.getTime() - 5 * 86400000).toISOString(),
    },
  ], { onConflict: "id" });
  results.products = prodError?.message || "ok";

  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
