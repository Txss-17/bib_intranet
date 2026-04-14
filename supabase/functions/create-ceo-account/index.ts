import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = Deno.env.get("LINKSY_API_SECRET_KEY");
    if (!apiKey || apiKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const email = "tgliyeta@gmail.com";
    const password = "Linksy-CEO-2026!";

    // Create user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: "GLIYETA",
        last_name: "Tshiessesse",
      },
    });

    if (userError) {
      return new Response(JSON.stringify({ error: userError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // Update profile with CEO position
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        first_name: "GLIYETA",
        last_name: "Tshiessesse",
        position: "ceo",
        poles: ["direction", "finance", "ops", "tech", "rh", "supplier", "audit", "compliance", "rse", "marketing", "risk", "lifecycle"],
        seniority: "executive",
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // Assign admin role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .update({ role: "admin" })
      .eq("user_id", userId);

    if (roleError) {
      console.error("Role update error:", roleError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Compte CEO créé avec succès",
        user_id: userId,
        email,
        position: "ceo",
        temporary_password: password,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
