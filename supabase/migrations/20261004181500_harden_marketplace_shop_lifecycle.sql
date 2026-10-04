-- ============================================================
-- BIB — CYCLE DE VIE BOUTIQUE
-- Marketplace = propriétaire du cycle
-- ============================================================


-- ============================================================
-- 1. MIGRATION DES ANCIENS STATUTS
-- ============================================================

UPDATE public.shops
SET status = 'review'
WHERE status = 'test';


UPDATE public.shops
SET status = 'review'
WHERE status = 'trial';


UPDATE public.shops
SET status = 'draft'
WHERE status IS NULL;


-- ============================================================
-- 2. NOUVELLE COLONNE INACTIVE
-- ============================================================

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS inactive_at timestamptz;


-- ============================================================
-- 3. DEFAULT
-- ============================================================

ALTER TABLE public.shops
  ALTER COLUMN status SET DEFAULT 'draft';


-- ============================================================
-- 4. CONTRAINTE STATUT
-- ============================================================

ALTER TABLE public.shops
  DROP CONSTRAINT IF EXISTS shops_status_check;


ALTER TABLE public.shops
  ADD CONSTRAINT shops_status_check
  CHECK (
    status IN (
      'draft',
      'application',
      'review',
      'active',
      'inactive',
      'suspended',
      'closed'
    )
  );


-- ============================================================
-- 5. SUPPRESSION DES COLONNES TEST/TRIAL
-- ============================================================
--
-- Elles ne font désormais plus partie du modèle métier.
--

ALTER TABLE public.shops
  DROP COLUMN IF EXISTS test_started_at;

ALTER TABLE public.shops
  DROP COLUMN IF EXISTS test_ends_at;

ALTER TABLE public.shops
  DROP COLUMN IF EXISTS test_extensions;


-- ============================================================
-- 6. TRANSITIONS AUTORISÉES
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_shop_lifecycle_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;


  IF NOT (
       (OLD.status = 'draft'
        AND NEW.status IN ('application', 'closed'))

    OR (OLD.status = 'application'
        AND NEW.status IN ('review', 'closed'))

    OR (OLD.status = 'review'
        AND NEW.status IN ('active', 'closed'))

    OR (OLD.status = 'active'
        AND NEW.status IN ('inactive', 'suspended', 'closed'))

    OR (OLD.status = 'inactive'
        AND NEW.status IN ('active', 'suspended', 'closed'))

    OR (OLD.status = 'suspended'
        AND NEW.status IN ('active', 'inactive', 'closed'))

  ) THEN

    RAISE EXCEPTION
      'Transition boutique interdite : % → %',
      OLD.status,
      NEW.status;

  END IF;


  IF NEW.status IN (
    'inactive',
    'suspended',
    'closed'
  )
  AND NULLIF(
    trim(COALESCE(NEW.suspension_reason, '')),
    ''
  ) IS NULL
  THEN

    RAISE EXCEPTION
      'Une justification est obligatoire pour passer une boutique à %.',
      NEW.status;

  END IF;


  IF NEW.status = 'active' THEN

    NEW.activated_at =
      COALESCE(
        NEW.activated_at,
        now()
      );

    NEW.inactive_at = NULL;

    NEW.suspended_at = NULL;

    NEW.suspension_reason = NULL;

  END IF;


  IF NEW.status = 'inactive' THEN

    NEW.inactive_at =
      COALESCE(
        NEW.inactive_at,
        now()
      );

  END IF;


  IF NEW.status = 'suspended' THEN

    NEW.suspended_at =
      COALESCE(
        NEW.suspended_at,
        now()
      );

  END IF;


  IF NEW.status = 'closed' THEN

    NEW.closed_at =
      COALESCE(
        NEW.closed_at,
        now()
      );

  END IF;


  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS trg_enforce_shop_lifecycle
ON public.shops;


CREATE TRIGGER trg_enforce_shop_lifecycle
BEFORE UPDATE OF status
ON public.shops
FOR EACH ROW
EXECUTE FUNCTION public.enforce_shop_lifecycle_transition();


-- ============================================================
-- 7. COMMANDES : UNIQUEMENT BOUTIQUES ACTIVES
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_order_single_shop()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  shop_status text;
BEGIN

  IF NEW.shop_id IS NULL THEN
    RETURN NEW;
  END IF;


  SELECT status
  INTO shop_status
  FROM public.shops
  WHERE id = NEW.shop_id;


  IF shop_status IS NULL THEN

    RAISE EXCEPTION
      'Boutique introuvable pour la commande.';

  END IF;


  IF shop_status <> 'active' THEN

    RAISE EXCEPTION
      'Une commande ne peut être associée qu''à une boutique active. Statut actuel : %',
      shop_status;

  END IF;


  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS trg_enforce_order_single_shop
ON public.orders;


CREATE TRIGGER trg_enforce_order_single_shop
BEFORE INSERT OR UPDATE OF shop_id
ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.enforce_order_single_shop();


-- ============================================================
-- 8. RLS DOCUMENTS D'ACTIVITÉ
-- ============================================================
--
-- Ops ne valide plus les justificatifs.
-- Marketplace prend la responsabilité métier de la boutique.
-- Audit / Compliance conservent leur rôle indépendant.
--

DROP POLICY IF EXISTS
  "Shop activity documents staff can view"
ON public.shop_activity_documents;


CREATE POLICY
  "Shop activity documents staff can view"
ON public.shop_activity_documents
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_role(
    auth.uid(),
    'admin'::app_role
  )
  OR public.has_any_pole(
    auth.uid(),
    ARRAY[
      'marketplace',
      'audit',
      'compliance'
    ]
  )
);


DROP POLICY IF EXISTS
  "Shop activity documents staff can review"
ON public.shop_activity_documents;


CREATE POLICY
  "Shop activity documents staff can review"
ON public.shop_activity_documents
FOR UPDATE
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_role(
    auth.uid(),
    'admin'::app_role
  )
  OR public.has_any_pole(
    auth.uid(),
    ARRAY[
      'marketplace',
      'audit',
      'compliance'
    ]
  )
)
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_role(
    auth.uid(),
    'admin'::app_role
  )
  OR public.has_any_pole(
    auth.uid(),
    ARRAY[
      'marketplace',
      'audit',
      'compliance'
    ]
  )
);


-- ============================================================
-- FIN
-- ============================================================
