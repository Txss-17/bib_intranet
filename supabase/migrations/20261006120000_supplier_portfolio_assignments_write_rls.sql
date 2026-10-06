-- ============================================================
-- BIB — Supplier portfolio assignments write RLS
-- ============================================================
--
-- Objectif :
--   Autoriser le pôle Fournisseurs à créer et modifier
--   les affectations fournisseur -> portefeuille.
--
-- Règle :
--   - Direction / leadership : autorisé
--   - Collaborateurs du pôle supplier : autorisés
--   - Autres pôles : lecture éventuelle selon leurs propres RLS,
--     mais aucune écriture ici.
--
-- Important :
--   Aucun DELETE n'est ajouté dans le MVP.
--   Une réaffectation modifie l'affectation existante.
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
  OR
  public.has_any_pole(
    auth.uid(),
    ARRAY['supplier']
  )
);


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
  OR
  public.has_any_pole(
    auth.uid(),
    ARRAY['supplier']
  )
)
WITH CHECK (
  public.is_leadership(auth.uid())
  OR
  public.has_any_pole(
    auth.uid(),
    ARRAY['supplier']
  )
);
