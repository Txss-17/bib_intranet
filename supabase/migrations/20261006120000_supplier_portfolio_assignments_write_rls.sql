-- ============================================================
-- BIB INTRANET
-- Supplier portfolio assignments - write RLS
-- ============================================================
--
-- Objet :
-- Permettre au pôle Fournisseurs et aux profils de direction
-- d'enregistrer et de modifier les affectations opérationnelles
-- des fournisseurs.
--
-- Architecture :
--
-- suppliers
--     │
--     └── portfolio_assignments
--             ├── supplier_id
--             ├── portfolio_id
--             ├── assigned_to_id
--             ├── assigned_to_name
--             └── assigned_at
--
-- portfolio_assignments reste distinct de :
--
-- access_portfolio_assignments
--
-- qui contrôle l'accès d'un collaborateur à un portefeuille.
-- ============================================================


-- ============================================================
-- 1. INSERT
-- ============================================================

DROP POLICY IF EXISTS
  "portfolio_assignments_insert_business"
ON public.portfolio_assignments;

CREATE POLICY
  "portfolio_assignments_insert_business"
ON public.portfolio_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['supplier']
  )
);


-- ============================================================
-- 2. UPDATE
-- ============================================================

DROP POLICY IF EXISTS
  "portfolio_assignments_update_business"
ON public.portfolio_assignments;

CREATE POLICY
  "portfolio_assignments_update_business"
ON public.portfolio_assignments
FOR UPDATE
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['supplier']
  )
)
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['supplier']
  )
);


-- ============================================================
-- 3. DELETE
-- ============================================================
--
-- Pas de suppression opérationnelle depuis le MVP.
--
-- Une réassignation doit conserver la trace de l'affectation
-- existante et modifier l'affectation courante.
--
-- Le DELETE reste donc volontairement non autorisé ici.
-- ============================================================


-- ============================================================
-- 4. Documentation
-- ============================================================

COMMENT ON POLICY
  "portfolio_assignments_insert_business"
ON public.portfolio_assignments
IS
  'Permet au pôle Fournisseurs et à la direction de créer une affectation fournisseur-portefeuille.';


COMMENT ON POLICY
  "portfolio_assignments_update_business"
ON public.portfolio_assignments
IS
  'Permet au pôle Fournisseurs et à la direction de modifier une affectation fournisseur-portefeuille.';
