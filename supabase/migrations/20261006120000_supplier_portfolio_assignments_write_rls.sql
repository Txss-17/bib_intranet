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

-- ============================================================
-- BIB — Écriture du registre transversal des portefeuilles
-- fournisseur
-- ============================================================

DROP POLICY IF EXISTS
  "access_business_portfolios_insert_supplier"
ON public.access_business_portfolios;

CREATE POLICY
  "access_business_portfolios_insert_supplier"
ON public.access_business_portfolios
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_leadership(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.access_portfolio_types apt
    WHERE apt.id = portfolio_type_id
      AND apt.portfolio_type_key = 'supplier'
      AND public.has_any_pole(
        auth.uid(),
        ARRAY['supplier']
      )
  )
);


DROP POLICY IF EXISTS
  "access_business_portfolios_update_supplier"
ON public.access_business_portfolios;

CREATE POLICY
  "access_business_portfolios_update_supplier"
ON public.access_business_portfolios
FOR UPDATE
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.access_portfolio_types apt
    WHERE apt.id = access_business_portfolios.portfolio_type_id
      AND apt.portfolio_type_key = 'supplier'
      AND public.has_any_pole(
        auth.uid(),
        ARRAY['supplier']
      )
  )
)
WITH CHECK (
  public.is_leadership(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.access_portfolio_types apt
    WHERE apt.id = access_business_portfolios.portfolio_type_id
      AND apt.portfolio_type_key = 'supplier'
      AND public.has_any_pole(
        auth.uid(),
        ARRAY['supplier']
      )
  )
);


DROP POLICY IF EXISTS
  "access_portfolio_assignments_insert_supplier"
ON public.access_portfolio_assignments;

CREATE POLICY
  "access_portfolio_assignments_insert_supplier"
ON public.access_portfolio_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_leadership(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.access_business_portfolios abp
    INNER JOIN public.access_portfolio_types apt
      ON apt.id = abp.portfolio_type_id
    WHERE abp.id = portfolio_id
      AND apt.portfolio_type_key = 'supplier'
      AND public.has_any_pole(
        auth.uid(),
        ARRAY['supplier']
      )
  )
);


DROP POLICY IF EXISTS
  "access_portfolio_assignments_update_supplier"
ON public.access_portfolio_assignments;

CREATE POLICY
  "access_portfolio_assignments_update_supplier"
ON public.access_portfolio_assignments
FOR UPDATE
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.access_business_portfolios abp
    INNER JOIN public.access_portfolio_types apt
      ON apt.id = abp.portfolio_type_id
    WHERE abp.id = access_portfolio_assignments.portfolio_id
      AND apt.portfolio_type_key = 'supplier'
      AND public.has_any_pole(
        auth.uid(),
        ARRAY['supplier']
      )
  )
)
WITH CHECK (
  public.is_leadership(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.access_business_portfolios abp
    INNER JOIN public.access_portfolio_types apt
      ON apt.id = abp.portfolio_type_id
    WHERE abp.id = access_portfolio_assignments.portfolio_id
      AND apt.portfolio_type_key = 'supplier'
      AND public.has_any_pole(
        auth.uid(),
        ARRAY['supplier']
      )
  )
);

-- ============================================================
-- SUPPLIER PORTFOLIOS — WRITE RLS
-- ============================================================
-- Allows the Supplier pole (and leadership) to create/update
-- supplier portfolios used by the Supplier Portfolios module.
-- Read access remains governed by supplier_portfolios_read_business.
-- No DELETE policy is introduced because the UI does not delete
-- portfolios; portfolio history must remain auditable.
-- ============================================================

DROP POLICY IF EXISTS
  "supplier_portfolios_insert_business"
ON public.supplier_portfolios;

CREATE POLICY
  "supplier_portfolios_insert_business"
ON public.supplier_portfolios
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['supplier']
  )
);

DROP POLICY IF EXISTS
  "supplier_portfolios_update_business"
ON public.supplier_portfolios;

CREATE POLICY
  "supplier_portfolios_update_business"
ON public.supplier_portfolios
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
