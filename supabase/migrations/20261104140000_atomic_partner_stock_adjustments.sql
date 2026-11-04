-- Authorized physical inventory adjustments, with atomic movement trail.
-- This procedure does NOT represent or modify supplier-owned inventory.
CREATE OR REPLACE FUNCTION public.adjust_partner_stock(
  p_stock_id uuid,
  p_expected_quantity integer,
  p_new_quantity integer,
  p_reason text,
  p_reference text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_stock public.partner_stocks%ROWTYPE;
  v_delta integer;
BEGIN
  IF v_actor IS NULL OR NOT (
    COALESCE(public.is_leadership(v_actor), false)
    OR (
      COALESCE(public.has_any_pole(v_actor, ARRAY['ops']), false)
      AND (
        COALESCE(public.has_role(v_actor, 'admin'::public.app_role), false)
        OR COALESCE(public.has_role(v_actor, 'manager'::public.app_role), false)
      )
    )
  ) THEN
    RAISE EXCEPTION 'Autorisation de correction de stock refusée.'
      USING ERRCODE = '42501';
  END IF;

  IF p_expected_quantity IS NULL OR p_new_quantity IS NULL
     OR p_new_quantity < 0 OR p_expected_quantity < 0
     OR NULLIF(btrim(p_reason), '') IS NULL OR length(p_reason) > 1000
     OR NULLIF(btrim(p_reference), '') IS NULL OR length(p_reference) > 150
  THEN
    RAISE EXCEPTION 'Quantité, motif et référence de contrôle obligatoires.'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_stock
  FROM public.partner_stocks
  WHERE id = p_stock_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock partenaire introuvable.'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_stock.quantity <> p_expected_quantity THEN
    RAISE EXCEPTION 'Le stock a changé : actualiser avant de corriger.'
      USING ERRCODE = '40001';
  END IF;

  IF p_new_quantity < v_stock.reserved_quantity THEN
    RAISE EXCEPTION 'Le stock corrigé ne peut pas être inférieur aux réservations actives.'
      USING ERRCODE = '23514';
  END IF;

  v_delta := p_new_quantity - v_stock.quantity;
  IF v_delta = 0 THEN
    RAISE EXCEPTION 'Aucun ajustement de quantité à enregistrer.'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.partner_stocks
    SET quantity = p_new_quantity, last_inventory_at = now()
    WHERE id = p_stock_id;

  INSERT INTO public.stock_movements (
    catalog_id, movement_type, quantity,
    source_partner_id, target_partner_id,
    reason, reference, performed_by
  ) VALUES (
    v_stock.catalog_id, 'adjustment', v_delta,
    v_stock.partner_id, v_stock.partner_id,
    btrim(p_reason), btrim(p_reference), v_actor
  );

  RETURN p_stock_id;
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_partner_stock(uuid,integer,integer,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_partner_stock(uuid,integer,integer,text,text) TO authenticated;
