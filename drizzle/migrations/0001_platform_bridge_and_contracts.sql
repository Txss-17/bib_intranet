ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS platform_id uuid UNIQUE, ADD COLUMN IF NOT EXISTS platform_synced_at timestamptz;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS platform_id uuid UNIQUE, ADD COLUMN IF NOT EXISTS platform_synced_at timestamptz, ADD COLUMN IF NOT EXISTS platform_publish_status text DEFAULT 'not_published';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_id uuid UNIQUE, ADD COLUMN IF NOT EXISTS platform_synced_at timestamptz;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS platform_id uuid UNIQUE, ADD COLUMN IF NOT EXISTS platform_synced_at timestamptz;

CREATE TABLE public.platform_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL CHECK (direction IN ('pull','push')),
  action text NOT NULL,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','partial','error')),
  items_count integer NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  details jsonb,
  triggered_by uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
GRANT SELECT ON public.platform_sync_runs TO authenticated;
GRANT ALL ON public.platform_sync_runs TO service_role;
ALTER TABLE public.platform_sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tech/leadership view sync runs" ON public.platform_sync_runs FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['tech','ops']));

CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number text NOT NULL UNIQUE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'merchant',
  shop_id uuid REFERENCES public.shops(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  party text,
  start_date date,
  end_date date,
  value text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','signed','active','expiring','expired','terminated')),
  signed_at timestamptz,
  document_url text,
  notes text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_contracts_shop ON public.contracts(shop_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT ALL ON public.contracts TO service_role;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Contracts read" ON public.contracts FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['compliance','ops','lifecycle','finance']));
CREATE POLICY "Contracts insert" ON public.contracts FOR INSERT TO authenticated
WITH CHECK (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['compliance','ops','lifecycle']));
CREATE POLICY "Contracts update" ON public.contracts FOR UPDATE TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['compliance','ops','lifecycle']));
CREATE POLICY "Contracts delete" ON public.contracts FOR DELETE TO authenticated
USING (public.is_leadership(auth.uid()));
CREATE TRIGGER trg_contracts_updated BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.sync_shop_contract_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_shop uuid := COALESCE(NEW.shop_id, OLD.shop_id);
BEGIN
  IF v_shop IS NOT NULL THEN
    UPDATE public.shops s SET
      contract_status = COALESCE((SELECT c.status FROM public.contracts c WHERE c.shop_id = v_shop
        ORDER BY (c.status IN ('signed','active')) DESC, c.updated_at DESC LIMIT 1), 'none'),
      contract_signed_at = (SELECT max(c.signed_at) FROM public.contracts c WHERE c.shop_id = v_shop AND c.status IN ('signed','active'))
    WHERE s.id = v_shop;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.shop_id IS DISTINCT FROM NEW.shop_id AND OLD.shop_id IS NOT NULL THEN
    UPDATE public.shops SET contract_status = COALESCE((SELECT c.status FROM public.contracts c WHERE c.shop_id = OLD.shop_id ORDER BY c.updated_at DESC LIMIT 1), 'none') WHERE id = OLD.shop_id;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_contracts_shop_status AFTER INSERT OR UPDATE OR DELETE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.sync_shop_contract_status();

CREATE OR REPLACE FUNCTION public.require_signed_contract_for_active()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'active' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active') THEN
    IF NOT EXISTS (SELECT 1 FROM public.contracts c WHERE c.shop_id = NEW.id AND c.status IN ('signed','active')) THEN
      RAISE EXCEPTION 'Contrat signé requis avant activation de la boutique';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_shops_require_contract BEFORE INSERT OR UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.require_signed_contract_for_active();