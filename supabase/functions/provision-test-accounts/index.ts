// Fake/test identity provisioning is permanently disabled.
// Production BIB Intranet accepts only real, authorized user identities.
Deno.serve((request) => new Response(JSON.stringify({ error: "test_account_provisioning_disabled" }), {
  status: 410, headers: {
    "Content-Type": "application/json", "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info",
  },
}));
