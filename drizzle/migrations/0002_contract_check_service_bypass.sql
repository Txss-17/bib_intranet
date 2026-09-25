CREATE OR REPLACE FUNCTION public.require_signed_contract_for_active()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' THEN RETURN NEW; END IF;
  IF NEW.status = 'active' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active') THEN
    IF NOT EXISTS (SELECT 1 FROM public.contracts c WHERE c.shop_id = NEW.id AND c.status IN ('signed','active')) THEN
      RAISE EXCEPTION 'Contrat signé requis avant activation de la boutique';
    END IF;
  END IF;
  RETURN NEW;
END $$;