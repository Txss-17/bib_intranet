-- ============================================================
-- BOUTIQUES & MARCHANDS : registre, cycle de vie, étanchéité des commandes
-- ============================================================

CREATE TABLE public.shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_code text NOT NULL UNIQUE,
  name text NOT NULL,
  slug text,
  merchant_name text,
  merchant_email text,
  merchant_phone text,
  country text,
  category text,
  status text NOT NULL DEFAULT 'application',
  subscription_plan text,
  commission_rate numeric DEFAULT 0,
  contract_status text DEFAULT 'pending',
  contract_signed_at timestamptz,
  test_started_at timestamptz,
  test_ends_at timestamptz,
  test_extensions integer NOT NULL DEFAULT 0,
  activated_at timestamptz,
  suspended_at timestamptz,
  closed_at timestamptz,
  suspension_reason text,
  notes text,
  app_origin text NOT NULL DEFAULT 'connect',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shops_status_check CHECK (status IN ('application','review','test','active','suspended','closed'))
);

CREATE INDEX idx_shops_status ON public.shops(status);
CREATE INDEX idx_shops_origin ON public.shops(app_origin);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shops TO authenticated;
GRANT ALL ON public.shops TO service_role;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop supervision staff can view shops"
ON public.shops FOR SELECT TO authenticated
USING (
  is_leadership(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_any_pole(auth.uid(), ARRAY['ops','lifecycle','finance','audit','compliance'])
);

CREATE POLICY "Ops and leadership can create shops"
ON public.shops FOR INSERT TO authenticated
WITH CHECK (
  is_leadership(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_any_pole(auth.uid(), ARRAY['ops','lifecycle'])
);

CREATE POLICY "Ops and leadership can update shops"
ON public.shops FOR UPDATE TO authenticated
USING (
  is_leadership(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_any_pole(auth.uid(), ARRAY['ops','lifecycle'])
);

CREATE POLICY "Leadership can delete shops"
ON public.shops FOR DELETE TO authenticated
USING (is_leadership(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_shops_updated
BEFORE UPDATE ON public.shops
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- Journal des décisions de cycle de vie (traçabilité humaine)
-- ============================================================

CREATE TABLE public.shop_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  action text,
  reason text,
  performed_by uuid,
  performed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_shop_events_shop ON public.shop_status_events(shop_id);

GRANT SELECT, INSERT ON public.shop_status_events TO authenticated;
GRANT ALL ON public.shop_status_events TO service_role;
ALTER TABLE public.shop_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop supervision staff can view shop events"
ON public.shop_status_events FOR SELECT TO authenticated
USING (
  is_leadership(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_any_pole(auth.uid(), ARRAY['ops','lifecycle','finance','audit','compliance'])
);

CREATE POLICY "Ops and leadership can log shop events"
ON public.shop_status_events FOR INSERT TO authenticated
WITH CHECK (
  is_leadership(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_any_pole(auth.uid(), ARRAY['ops','lifecycle'])
);

-- Journalise automatiquement tout changement de statut
CREATE OR REPLACE FUNCTION public.log_shop_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.shop_status_events (shop_id, from_status, to_status, action, reason, performed_by)
    VALUES (NEW.id, NULL, NEW.status, 'created', NEW.notes, COALESCE(NEW.created_by, auth.uid()));
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.shop_status_events (shop_id, from_status, to_status, action, reason, performed_by)
    VALUES (NEW.id, OLD.status, NEW.status, 'status_change', NEW.suspension_reason, auth.uid());

    INSERT INTO public.notifications (title, message, type, pole_id, action_url)
    VALUES (
      'Boutique ' || NEW.name || ' — ' || NEW.status,
      'Statut passé de ' || COALESCE(OLD.status, '—') || ' à ' || NEW.status,
      CASE WHEN NEW.status IN ('suspended','closed') THEN 'warning'
           WHEN NEW.status = 'active' THEN 'success' ELSE 'info' END,
      'ops',
      '/pole/ops/shops'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_shops_status_log
AFTER INSERT OR UPDATE ON public.shops
FOR EACH ROW EXECUTE FUNCTION public.log_shop_status_change();

-- ============================================================
-- RÈGLE ABSOLUE : une commande appartient à une seule boutique
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN shop_id uuid REFERENCES public.shops(id) ON DELETE SET NULL;

CREATE INDEX idx_orders_shop ON public.orders(shop_id);

-- Une commande ne peut jamais changer de boutique après création,
-- et ne peut être rattachée qu'à une boutique en test ou active.
CREATE OR REPLACE FUNCTION public.enforce_order_single_shop()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_status text;
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.shop_id IS NOT NULL
     AND NEW.shop_id IS DISTINCT FROM OLD.shop_id THEN
    RAISE EXCEPTION 'Une commande ne peut pas être transférée vers une autre boutique (règle d''étanchéité BIB)';
  END IF;

  IF NEW.shop_id IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.shop_id IS DISTINCT FROM OLD.shop_id) THEN
    SELECT status INTO v_status FROM public.shops WHERE id = NEW.shop_id;
    IF v_status IS NULL THEN
      RAISE EXCEPTION 'Boutique inconnue';
    END IF;
    IF v_status NOT IN ('test','active') THEN
      RAISE EXCEPTION 'La boutique doit être en test ou active pour recevoir des commandes (statut: %)', v_status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_single_shop
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_order_single_shop();