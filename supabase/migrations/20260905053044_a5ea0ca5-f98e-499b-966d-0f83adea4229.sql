-- ============ LOGISTIQUE & COMMANDES ============
DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.orders;
CREATE POLICY "orders_read_business" ON public.orders FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['ops','supplier','finance','lifecycle']));

DROP POLICY IF EXISTS "Authenticated can view order events" ON public.order_lifecycle_events;
CREATE POLICY "order_events_read_business" ON public.order_lifecycle_events FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['ops','supplier','lifecycle']));

DROP POLICY IF EXISTS "Authenticated can view partner stocks" ON public.partner_stocks;
CREATE POLICY "partner_stocks_read_business" ON public.partner_stocks FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['ops','supplier']));

DROP POLICY IF EXISTS "Authenticated can view stock movements" ON public.stock_movements;
CREATE POLICY "stock_movements_read_business" ON public.stock_movements FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['ops','supplier']));

DROP POLICY IF EXISTS "Authenticated can view replenishment" ON public.replenishment_suggestions;
CREATE POLICY "replenishment_read_business" ON public.replenishment_suggestions FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['ops','supplier']));

DROP POLICY IF EXISTS "Authenticated can view demand forecasts" ON public.demand_forecasts;
CREATE POLICY "demand_forecasts_read_business" ON public.demand_forecasts FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['ops','supplier','finance']));

DROP POLICY IF EXISTS "Authenticated users can view logistics incidents" ON public.logistics_incidents;
CREATE POLICY "logistics_incidents_read_business" ON public.logistics_incidents FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['ops','supplier','risk','audit']));

DROP POLICY IF EXISTS "Authenticated users can view logistics partners" ON public.logistics_partners;
CREATE POLICY "logistics_partners_read_business" ON public.logistics_partners FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['ops','supplier']));

DROP POLICY IF EXISTS "Authenticated can view sync events" ON public.partner_sync_events;
CREATE POLICY "partner_sync_read_business" ON public.partner_sync_events FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['ops','supplier','tech']));

-- ============ PRODUITS & QUALITE ============
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
CREATE POLICY "products_read_business" ON public.products FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['supplier','ops','rse','audit','rd','marketing']));

DROP POLICY IF EXISTS "Authenticated can view product catalog (no internal_sku)" ON public.product_catalog;
CREATE POLICY "product_catalog_read_business" ON public.product_catalog FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['supplier','ops','rse','audit','rd','marketing']));

DROP POLICY IF EXISTS "Authenticated users can view decisions" ON public.product_decisions;
CREATE POLICY "product_decisions_read_business" ON public.product_decisions FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['supplier','ops','rse','audit','rd']));

DROP POLICY IF EXISTS "Authenticated users can view certifications" ON public.certifications;
CREATE POLICY "certifications_read_business" ON public.certifications FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['supplier','audit','compliance','rse','ops']));

DROP POLICY IF EXISTS "Authenticated users can view packaging submissions" ON public.packaging_submissions;
CREATE POLICY "packaging_read_business" ON public.packaging_submissions FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['rse','supplier','ops','audit']));

DROP POLICY IF EXISTS "Authenticated users can view quality alerts" ON public.quality_alerts;
CREATE POLICY "quality_alerts_read_business" ON public.quality_alerts FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['supplier','ops','audit','risk','rse']));

DROP POLICY IF EXISTS "Authenticated can view supplier lead times" ON public.supplier_lead_times;
CREATE POLICY "supplier_lead_times_read_business" ON public.supplier_lead_times FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['supplier','ops']));

DROP POLICY IF EXISTS "Authenticated users can view portfolios" ON public.supplier_portfolios;
CREATE POLICY "supplier_portfolios_read_business" ON public.supplier_portfolios FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['supplier','audit']));

DROP POLICY IF EXISTS "Authenticated users can view assignments" ON public.portfolio_assignments;
CREATE POLICY "portfolio_assignments_read_business" ON public.portfolio_assignments FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['supplier','audit']));

-- ============ SUPPORT & LIFECYCLE ============
DROP POLICY IF EXISTS "Authenticated users can view support tickets" ON public.support_tickets;
CREATE POLICY "support_tickets_read_business" ON public.support_tickets FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['lifecycle','tech','ops']));

DROP POLICY IF EXISTS "view email campaigns" ON public.lifecycle_email_campaigns;
CREATE POLICY "lifecycle_campaigns_read_business" ON public.lifecycle_email_campaigns FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['lifecycle','marketing']));

DROP POLICY IF EXISTS "view risk alerts" ON public.lifecycle_risk_alerts;
CREATE POLICY "lifecycle_risk_read_business" ON public.lifecycle_risk_alerts FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['lifecycle','risk','marketing']));

-- ============ R&D ============
DROP POLICY IF EXISTS "view rd reports" ON public.rd_reports;
CREATE POLICY "rd_reports_read_business" ON public.rd_reports FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['rd','supplier','ops']));

DROP POLICY IF EXISTS "view rd recos" ON public.rd_recommendations;
CREATE POLICY "rd_recos_read_business" ON public.rd_recommendations FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['rd','supplier','ops']));

-- ============ DATA / BI ============
DROP POLICY IF EXISTS "kpi_catalog readable authenticated" ON public.kpi_catalog;
CREATE POLICY "kpi_catalog_read_business" ON public.kpi_catalog FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['tech','finance','marketing','data']));

DROP POLICY IF EXISTS "kpi_versions readable auth" ON public.kpi_versions;
CREATE POLICY "kpi_versions_read_business" ON public.kpi_versions FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['tech','finance','marketing','data']));

DROP POLICY IF EXISTS "bi_dashboards_read" ON public.bi_dashboards;
CREATE POLICY "bi_dashboards_read_business" ON public.bi_dashboards FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['tech','finance','marketing','data']));

DROP POLICY IF EXISTS "bi_widgets_read" ON public.bi_dashboard_widgets;
CREATE POLICY "bi_widgets_read_business" ON public.bi_dashboard_widgets FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['tech','finance','marketing','data']));

DROP POLICY IF EXISTS "bi_versions_read" ON public.bi_dashboard_versions;
CREATE POLICY "bi_versions_read_business" ON public.bi_dashboard_versions FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['tech','finance','marketing','data']));

DROP POLICY IF EXISTS "bi_sources_read" ON public.bi_data_sources;
CREATE POLICY "bi_sources_read_business" ON public.bi_data_sources FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['tech','finance','marketing','data']));

DROP POLICY IF EXISTS "bi_templates_read" ON public.bi_templates;
CREATE POLICY "bi_templates_read_business" ON public.bi_templates FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['tech','finance','marketing','data']));

-- ============ DIRECTION ============
DROP POLICY IF EXISTS "view board reports" ON public.direction_board_reports;
CREATE POLICY "board_reports_read_leadership" ON public.direction_board_reports FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()));