import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;
    
    // Import postgres
    const { default: postgres } = await import("https://deno.land/x/postgresjs@v3.4.5/mod.js");
    const sql = postgres(dbUrl);

    const results: { step: string; ok: boolean; error?: string }[] = [];

    const steps: [string, string][] = [
      // Fix user_accounts SELECT
      ["user_accounts SELECT", `DROP POLICY IF EXISTS "Authenticated users can view user accounts" ON public.user_accounts; CREATE POLICY "Authenticated users can view user accounts" ON public.user_accounts FOR SELECT TO authenticated USING (true);`],
      // Fix orders SELECT
      ["orders SELECT", `DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.orders; CREATE POLICY "Authenticated users can view orders" ON public.orders FOR SELECT TO authenticated USING (true);`],
      // Fix cashflows SELECT (restrict to managers)
      ["cashflows SELECT", `DROP POLICY IF EXISTS "Authenticated users can view cashflows" ON public.cashflows; CREATE POLICY "Authenticated users can view cashflows" ON public.cashflows FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));`],
      // Fix supplier_payments SELECT
      ["supplier_payments SELECT", `DROP POLICY IF EXISTS "Authenticated users can view supplier payments" ON public.supplier_payments; CREATE POLICY "Authenticated users can view supplier payments" ON public.supplier_payments FOR SELECT TO authenticated USING (true);`],
      // Fix guarantee_fund SELECT
      ["guarantee_fund SELECT", `DROP POLICY IF EXISTS "Authenticated users can view guarantee fund" ON public.guarantee_fund; CREATE POLICY "Authenticated users can view guarantee fund" ON public.guarantee_fund FOR SELECT TO authenticated USING (true);`],
      // Fix fundraising_rounds SELECT
      ["fundraising_rounds SELECT", `DROP POLICY IF EXISTS "Authenticated users can view fundraising rounds" ON public.fundraising_rounds; CREATE POLICY "Authenticated users can view fundraising rounds" ON public.fundraising_rounds FOR SELECT TO authenticated USING (true);`],
      // Fix support_tickets SELECT
      ["support_tickets SELECT", `DROP POLICY IF EXISTS "Authenticated users can view support tickets" ON public.support_tickets; CREATE POLICY "Authenticated users can view support tickets" ON public.support_tickets FOR SELECT TO authenticated USING (true);`],
      // Fix support_tickets INSERT
      ["support_tickets INSERT", `DROP POLICY IF EXISTS "Authenticated users can create support tickets" ON public.support_tickets; CREATE POLICY "Authenticated users can create support tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (true);`],
      // Fix support_tickets UPDATE
      ["support_tickets UPDATE", `DROP POLICY IF EXISTS "Managers and admins can manage support tickets" ON public.support_tickets; CREATE POLICY "Managers and admins can manage support tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));`],
      // Fix logistics_partners SELECT
      ["logistics_partners SELECT", `DROP POLICY IF EXISTS "Authenticated users can view logistics partners" ON public.logistics_partners; CREATE POLICY "Authenticated users can view logistics partners" ON public.logistics_partners FOR SELECT TO authenticated USING (true);`],
      // Fix logistics_incidents SELECT
      ["logistics_incidents SELECT", `DROP POLICY IF EXISTS "Authenticated users can view logistics incidents" ON public.logistics_incidents; CREATE POLICY "Authenticated users can view logistics incidents" ON public.logistics_incidents FOR SELECT TO authenticated USING (true);`],
      // Fix deployments SELECT
      ["deployments SELECT", `DROP POLICY IF EXISTS "Authenticated users can view deployments" ON public.deployments; CREATE POLICY "Authenticated users can view deployments" ON public.deployments FOR SELECT TO authenticated USING (true);`],
      // Fix bugs SELECT
      ["bugs SELECT", `DROP POLICY IF EXISTS "Authenticated users can view bugs" ON public.bugs; CREATE POLICY "Authenticated users can view bugs" ON public.bugs FOR SELECT TO authenticated USING (true);`],
      // Fix bugs INSERT
      ["bugs INSERT", `DROP POLICY IF EXISTS "Authenticated users can create bugs" ON public.bugs; CREATE POLICY "Authenticated users can create bugs" ON public.bugs FOR INSERT TO authenticated WITH CHECK (true);`],
      // Fix field_audits SELECT
      ["field_audits SELECT", `DROP POLICY IF EXISTS "Authenticated users can view field audits" ON public.field_audits; CREATE POLICY "Authenticated users can view field audits" ON public.field_audits FOR SELECT TO authenticated USING (true);`],
      // Fix salaries SELECT
      ["salaries SELECT", `DROP POLICY IF EXISTS "Managers and admins can view salaries" ON public.salaries; CREATE POLICY "Managers and admins can view salaries" ON public.salaries FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));`],
      // Fix whistleblower_updates SELECT
      ["whistleblower_updates SELECT", `DROP POLICY IF EXISTS "Auditors can view whistleblower updates" ON public.whistleblower_updates; CREATE POLICY "Auditors can view whistleblower updates" ON public.whistleblower_updates FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR EXISTS (SELECT 1 FROM public.whistleblower_submissions ws WHERE ws.id = submission_id AND ws.assigned_auditor_id = auth.uid()));`],
      // Fix packaging_submissions SELECT
      ["packaging_submissions SELECT", `DROP POLICY IF EXISTS "Authenticated users can view packaging submissions" ON public.packaging_submissions; CREATE POLICY "Authenticated users can view packaging submissions" ON public.packaging_submissions FOR SELECT TO authenticated USING (true);`],
      // Fix ALL policies: user_accounts
      ["user_accounts ALL", `DROP POLICY IF EXISTS "Managers and admins can manage user accounts" ON public.user_accounts; CREATE POLICY "Managers and admins can manage user accounts" ON public.user_accounts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));`],
      // Fix ALL: orders
      ["orders ALL", `DROP POLICY IF EXISTS "Managers and admins can manage orders" ON public.orders; CREATE POLICY "Managers and admins can manage orders" ON public.orders FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));`],
      // Fix ALL: cashflows
      ["cashflows ALL", `DROP POLICY IF EXISTS "Managers and admins can manage cashflows" ON public.cashflows; CREATE POLICY "Managers and admins can manage cashflows" ON public.cashflows FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));`],
      // Fix ALL: guarantee_fund
      ["guarantee_fund ALL", `DROP POLICY IF EXISTS "Managers and admins can manage guarantee fund" ON public.guarantee_fund; CREATE POLICY "Managers and admins can manage guarantee fund" ON public.guarantee_fund FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));`],
      // Fix ALL: fundraising_rounds
      ["fundraising_rounds ALL", `DROP POLICY IF EXISTS "Admins can manage fundraising rounds" ON public.fundraising_rounds; CREATE POLICY "Admins can manage fundraising rounds" ON public.fundraising_rounds FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));`],
      // Fix ALL: supplier_payments
      ["supplier_payments ALL", `DROP POLICY IF EXISTS "Managers and admins can manage supplier payments" ON public.supplier_payments; CREATE POLICY "Managers and admins can manage supplier payments" ON public.supplier_payments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));`],
      // Fix ALL: logistics_partners
      ["logistics_partners ALL", `DROP POLICY IF EXISTS "Managers and admins can manage logistics partners" ON public.logistics_partners; CREATE POLICY "Managers and admins can manage logistics partners" ON public.logistics_partners FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));`],
      // Fix ALL: logistics_incidents
      ["logistics_incidents ALL", `DROP POLICY IF EXISTS "Managers and admins can manage logistics incidents" ON public.logistics_incidents; CREATE POLICY "Managers and admins can manage logistics incidents" ON public.logistics_incidents FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));`],
      // Fix ALL: deployments
      ["deployments ALL", `DROP POLICY IF EXISTS "Managers and admins can manage deployments" ON public.deployments; CREATE POLICY "Managers and admins can manage deployments" ON public.deployments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));`],
      // Fix UPDATE: bugs
      ["bugs UPDATE", `DROP POLICY IF EXISTS "Managers and admins can manage bugs" ON public.bugs; CREATE POLICY "Managers and admins can manage bugs" ON public.bugs FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));`],
      // Fix ALL: field_audits
      ["field_audits ALL", `DROP POLICY IF EXISTS "Managers and admins can manage field audits" ON public.field_audits; CREATE POLICY "Managers and admins can manage field audits" ON public.field_audits FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));`],
      // Fix ALL: salaries
      ["salaries ALL", `DROP POLICY IF EXISTS "Admins can manage salaries" ON public.salaries; CREATE POLICY "Admins can manage salaries" ON public.salaries FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));`],
      // Fix ALL: packaging_submissions
      ["packaging_submissions ALL", `DROP POLICY IF EXISTS "Managers and admins can manage packaging submissions" ON public.packaging_submissions; CREATE POLICY "Managers and admins can manage packaging submissions" ON public.packaging_submissions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));`],
    ];

    for (const [name, query] of steps) {
      try {
        await sql.unsafe(query);
        results.push({ step: name, ok: true });
      } catch (e: any) {
        results.push({ step: name, ok: false, error: e.message });
      }
    }

    await sql.end();

    const successCount = results.filter(r => r.ok).length;
    return new Response(JSON.stringify({ success: successCount, total: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
