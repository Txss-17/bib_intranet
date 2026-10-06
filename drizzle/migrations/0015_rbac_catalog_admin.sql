-- ============================================================
-- BIB INTRANET — ADMINISTRATION DU CATALOGUE RBAC
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_rbac_catalog_admin(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN
    public.is_leadership(p_user_id)
    OR public.has_role(
      p_user_id,
      'admin'
    )
    OR public.has_role(
      p_user_id,
      'manager'
    )
    OR public.has_role(
      p_user_id,
      'directeur_rh'
    )
    OR public.has_role(
      p_user_id,
      'responsable_rh'
    )
    OR public.has_role(
      p_user_id,
      'gestionnaire_admin_rh'
    )
    OR public.has_role(
      p_user_id,
      'rssi'
    )
    OR public.has_role(
      p_user_id,
      'admin_systeme'
    );
END;
$$;

REVOKE ALL
ON FUNCTION public.is_rbac_catalog_admin(UUID)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.is_rbac_catalog_admin(UUID)
TO authenticated;
