import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const migrations = [
    // Fix user_accounts SELECT: public → authenticated
    `DROP POLICY IF EXISTS "Authenticated users can view user accounts" ON public.user_accounts`,
    `CREATE POLICY "Authenticated users can view user accounts" ON public.user_accounts FOR SELECT TO authenticated USING (true)`,
    
    // Fix orders SELECT: public → authenticated
    `DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.orders`,
    `CREATE POLICY "Authenticated users can view orders" ON public.orders FOR SELECT TO authenticated USING (true)`,
    
    // Fix cashflows SELECT: public → authenticated (restrict to managers/admins)
    `DROP POLICY IF EXISTS "Authenticated users can view cashflows" ON public.cashflows`,
    `CREATE POLICY "Authenticated users can view cashflows" ON public.cashflows FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))`,
    
    // Fix supplier_payments SELECT: public → authenticated
    `DROP POLICY IF EXISTS "Authenticated users can view supplier payments" ON public.supplier_payments`,
    `CREATE POLICY "Authenticated users can view supplier payments" ON public.supplier_payments FOR SELECT TO authenticated USING (true)`,
    
    // Fix guarantee_fund SELECT: public → authenticated
    `DROP POLICY IF EXISTS "Authenticated users can view guarantee fund" ON public.guarantee_fund`,
    `CREATE POLICY "Authenticated users can view guarantee fund" ON public.guarantee_fund FOR SELECT TO authenticated USING (true)`,
    
    // Fix fundraising_rounds SELECT: public → authenticated
    `DROP POLICY IF EXISTS "Authenticated users can view fundraising rounds" ON public.fundraising_rounds`,
    `CREATE POLICY "Authenticated users can view fundraising rounds" ON public.fundraising_rounds FOR SELECT TO authenticated USING (true)`,
    
    // Fix support_tickets SELECT: public → authenticated
    `DROP POLICY IF EXISTS "Authenticated users can view support tickets" ON public.support_tickets`,
    `CREATE POLICY "Authenticated users can view support tickets" ON public.support_tickets FOR SELECT TO authenticated USING (true)`,
    
    // Fix support_tickets INSERT: public → authenticated
    `DROP POLICY IF EXISTS "Authenticated users can create support tickets" ON public.support_tickets`,
    `CREATE POLICY "Authenticated users can create support tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (true)`,
    
    // Fix support_tickets UPDATE: public → authenticated
    `DROP POLICY IF EXISTS "Managers and admins can manage support tickets" ON public.support_tickets`,
    `CREATE POLICY "Managers and admins can manage support tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))`,
    
    // Fix logistics_partners SELECT: public → authenticated
    `DROP POLICY IF EXISTS "Authenticated users can view logistics partners" ON public.logistics_partners`,
    `CREATE POLICY "Authenticated users can view logistics partners" ON public.logistics_partners FOR SELECT TO authenticated USING (true)`,
    
    // Fix logistics_incidents SELECT/ALL: public → authenticated
    `DROP POLICY IF EXISTS "Authenticated users can view logistics incidents" ON public.logistics_incidents`,
    `CREATE POLICY "Authenticated users can view logistics incidents" ON public.logistics_incidents FOR SELECT TO authenticated USING (true)`,
    
    // Fix deployments SELECT: public → authenticated
    `DROP POLICY IF EXISTS "Authenticated users can view deployments" ON public.deployments`,
    `CREATE POLICY "Authenticated users can view deployments" ON public.deployments FOR SELECT TO authenticated USING (true)`,
    
    // Fix bugs SELECT/INSERT: public → authenticated
    `DROP POLICY IF EXISTS "Authenticated users can view bugs" ON public.bugs`,
    `CREATE POLICY "Authenticated users can view bugs" ON public.bugs FOR SELECT TO authenticated USING (true)`,
    `DROP POLICY IF EXISTS "Authenticated users can create bugs" ON public.bugs`,
    `CREATE POLICY "Authenticated users can create bugs" ON public.bugs FOR INSERT TO authenticated WITH CHECK (true)`,
    
    // Fix field_audits SELECT: public → authenticated
    `DROP POLICY IF EXISTS "Authenticated users can view field audits" ON public.field_audits`,
    `CREATE POLICY "Authenticated users can view field audits" ON public.field_audits FOR SELECT TO authenticated USING (true)`,
    
    // Fix salaries SELECT: public → authenticated
    `DROP POLICY IF EXISTS "Managers and admins can view salaries" ON public.salaries`,
    `CREATE POLICY "Managers and admins can view salaries" ON public.salaries FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))`,
    
    // Fix whistleblower_updates SELECT: restrict to admins/assigned auditors
    `DROP POLICY IF EXISTS "Auditors can view whistleblower updates" ON public.whistleblower_updates`,
    `CREATE POLICY "Auditors can view whistleblower updates" ON public.whistleblower_updates FOR SELECT TO authenticated USING (
      has_role(auth.uid(), 'admin'::app_role) OR EXISTS (
        SELECT 1 FROM public.whistleblower_submissions ws 
        WHERE ws.id = submission_id AND ws.assigned_auditor_id = auth.uid()
      )
    )`,

    // Fix packaging_submissions: public → authenticated
    `DROP POLICY IF EXISTS "Authenticated users can view packaging submissions" ON public.packaging_submissions`,
    `CREATE POLICY "Authenticated users can view packaging submissions" ON public.packaging_submissions FOR SELECT TO authenticated USING (true)`,

    // Fix user_accounts ALL: public → authenticated
    `DROP POLICY IF EXISTS "Managers and admins can manage user accounts" ON public.user_accounts`,
    `CREATE POLICY "Managers and admins can manage user accounts" ON public.user_accounts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))`,

    // Fix orders ALL: public → authenticated
    `DROP POLICY IF EXISTS "Managers and admins can manage orders" ON public.orders`,
    `CREATE POLICY "Managers and admins can manage orders" ON public.orders FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))`,

    // Fix cashflows ALL: public → authenticated
    `DROP POLICY IF EXISTS "Managers and admins can manage cashflows" ON public.cashflows`,
    `CREATE POLICY "Managers and admins can manage cashflows" ON public.cashflows FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))`,

    // Fix guarantee_fund ALL: public → authenticated
    `DROP POLICY IF EXISTS "Managers and admins can manage guarantee fund" ON public.guarantee_fund`,
    `CREATE POLICY "Managers and admins can manage guarantee fund" ON public.guarantee_fund FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))`,

    // Fix fundraising_rounds ALL: public → authenticated
    `DROP POLICY IF EXISTS "Admins can manage fundraising rounds" ON public.fundraising_rounds`,
    `CREATE POLICY "Admins can manage fundraising rounds" ON public.fundraising_rounds FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))`,

    // Fix supplier_payments ALL: public → authenticated
    `DROP POLICY IF EXISTS "Managers and admins can manage supplier payments" ON public.supplier_payments`,
    `CREATE POLICY "Managers and admins can manage supplier payments" ON public.supplier_payments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))`,

    // Fix logistics_partners ALL: public → authenticated
    `DROP POLICY IF EXISTS "Managers and admins can manage logistics partners" ON public.logistics_partners`,
    `CREATE POLICY "Managers and admins can manage logistics partners" ON public.logistics_partners FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))`,

    // Fix logistics_incidents ALL: public → authenticated
    `DROP POLICY IF EXISTS "Managers and admins can manage logistics incidents" ON public.logistics_incidents`,
    `CREATE POLICY "Managers and admins can manage logistics incidents" ON public.logistics_incidents FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))`,

    // Fix deployments ALL: public → authenticated
    `DROP POLICY IF EXISTS "Managers and admins can manage deployments" ON public.deployments`,
    `CREATE POLICY "Managers and admins can manage deployments" ON public.deployments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))`,

    // Fix bugs UPDATE: public → authenticated
    `DROP POLICY IF EXISTS "Managers and admins can manage bugs" ON public.bugs`,
    `CREATE POLICY "Managers and admins can manage bugs" ON public.bugs FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))`,

    // Fix field_audits ALL: public → authenticated
    `DROP POLICY IF EXISTS "Managers and admins can manage field audits" ON public.field_audits`,
    `CREATE POLICY "Managers and admins can manage field audits" ON public.field_audits FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))`,

    // Fix salaries ALL: public → authenticated
    `DROP POLICY IF EXISTS "Admins can manage salaries" ON public.salaries`,
    `CREATE POLICY "Admins can manage salaries" ON public.salaries FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))`,

    // Fix packaging_submissions ALL: public → authenticated
    `DROP POLICY IF EXISTS "Managers and admins can manage packaging submissions" ON public.packaging_submissions`,
    `CREATE POLICY "Managers and admins can manage packaging submissions" ON public.packaging_submissions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))`,
  ];

  const results: { sql: string; ok: boolean; error?: string }[] = [];

  for (const sql of migrations) {
    const { error } = await supabase.rpc('exec_sql', { sql_text: sql }).maybeSingle();
    if (error) {
      // Try direct approach via postgrest
      const res = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/exec_sql`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          },
          body: JSON.stringify({ sql_text: sql }),
        }
      );
      // Use direct SQL via pg
      const pgRes = await fetch(
        `${Deno.env.get("SUPABASE_DB_URL")}`,
        { method: "POST" }
      ).catch(() => null);

      results.push({ sql: sql.substring(0, 80), ok: false, error: error.message });
    } else {
      results.push({ sql: sql.substring(0, 80), ok: true });
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
