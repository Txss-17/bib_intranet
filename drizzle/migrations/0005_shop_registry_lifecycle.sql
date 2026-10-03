```sql
-- ============================================================
-- BIB INTRANET — REGISTRE DES BOUTIQUES
-- Extension du cycle de vie et séparation du profil marchand
-- ============================================================

-- ------------------------------------------------------------
-- 1. Nouveaux statuts
--
-- draft       : boutique encore en brouillon sur BIB Platform
-- application : boutique soumise à BIB
-- review      : dossier en cours d'examen
-- test        : période de test
-- active      : boutique opérationnelle
-- inactive     : boutique désactivée sans suspension BIB
-- suspended   : boutique suspendue par BIB
-- closed      : boutique clôturée
-- ------------------------------------------------------------

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS inactive_at timestamptz;

-- Remplacement de l'ancien contrôle des statuts.
ALTER TABLE public.shops
  DROP CONSTRAINT IF EXISTS shops_status_check;

ALTER TABLE public.shops
  ADD CONSTRAINT shops_status_check
  CHECK (
    status IN (
      'draft',
      'application',
      'review',
      'test',
      'active',
      'inactive',
      'suspended',
      'closed'
    )
  );

CREATE INDEX IF NOT EXISTS idx_shops_status
  ON public.shops(status);

CREATE INDEX IF NOT EXISTS idx_shops_created_at
  ON public.shops(created_at DESC);

-- ------------------------------------------------------------
-- 2. L'intranet ne crée plus de boutiques
--
-- Les boutiques viennent de BIB Platform / du bridge.
-- L'intranet peut les consulter et gérer leur cycle de vie.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "Ops and leadership can create shops"
ON public.shops;

-- ------------------------------------------------------------
-- 3. Validation serveur du cycle de vie
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_shop_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- ----------------------------------------------------------
  -- INSERT
  -- Une boutique provenant du registre peut être importée
  -- dans l'un des statuts de départ autorisés.
  -- ----------------------------------------------------------
  IF TG_OP = 'INSERT' THEN

    IF NEW.status NOT IN (
      'draft',
      'application',
      'review',
      'test',
      'active'
    ) THEN
      RAISE EXCEPTION
        'Statut initial invalide pour une boutique: %',
        NEW.status;
    END IF;

    IF NEW.status = 'test' AND NEW.test_started_at IS NULL THEN
      NEW.test_started_at := now();
    END IF;

    IF NEW.status = 'active' AND NEW.activated_at IS NULL THEN
      NEW.activated_at := now();
    END IF;

    RETURN NEW;
  END IF;

  -- ----------------------------------------------------------
  -- UPDATE
  -- On ne laisse pas passer n'importe quelle transition.
  -- ----------------------------------------------------------
  IF NEW.status IS DISTINCT FROM OLD.status THEN

    IF OLD.status = 'draft'
       AND NEW.status NOT IN ('application', 'closed') THEN
      RAISE EXCEPTION
        'Transition interdite: draft → %',
        NEW.status;
    END IF;

    IF OLD.status = 'application'
       AND NEW.status NOT IN ('review', 'closed') THEN
      RAISE EXCEPTION
        'Transition interdite: application → %',
        NEW.status;
    END IF;

    IF OLD.status = 'review'
       AND NEW.status NOT IN ('test', 'active', 'closed') THEN
      RAISE EXCEPTION
        'Transition interdite: review → %',
        NEW.status;
    END IF;

    IF OLD.status = 'test'
       AND NEW.status NOT IN ('active', 'inactive', 'suspended', 'closed') THEN
      RAISE EXCEPTION
        'Transition interdite: test → %',
        NEW.status;
    END IF;

    IF OLD.status = 'active'
       AND NEW.status NOT IN ('inactive', 'suspended', 'closed') THEN
      RAISE EXCEPTION
        'Transition interdite: active → %',
        NEW.status;
    END IF;

    IF OLD.status = 'inactive'
       AND NEW.status NOT IN ('active', 'suspended', 'closed') THEN
      RAISE EXCEPTION
        'Transition interdite: inactive → %',
        NEW.status;
    END IF;

    IF OLD.status = 'suspended'
       AND NEW.status NOT IN ('active', 'inactive', 'closed') THEN
      RAISE EXCEPTION
        'Transition interdite: suspended → %',
        NEW.status;
    END IF;

    IF OLD.status = 'closed' THEN
      RAISE EXCEPTION
        'Une boutique clôturée ne peut plus changer de statut.';
    END IF;

    -- Une justification est obligatoire pour les décisions
    -- de désactivation, suspension ou clôture.
    IF NEW.status IN ('inactive', 'suspended', 'closed')
       AND NULLIF(trim(COALESCE(NEW.suspension_reason, '')), '') IS NULL THEN
      RAISE EXCEPTION
        'Une justification est obligatoire pour le statut %.',
        NEW.status;
    END IF;
  END IF;

  -- ----------------------------------------------------------
  -- Timestamps de cycle de vie
  -- ----------------------------------------------------------

  IF NEW.status = 'test'
     AND OLD.status IS DISTINCT FROM 'test'
     AND NEW.test_started_at IS NULL THEN
    NEW.test_started_at := now();
  END IF;

  IF NEW.status = 'active'
     AND OLD.status IS DISTINCT FROM 'active' THEN
    NEW.activated_at := COALESCE(
      NEW.activated_at,
      now()
    );
    NEW.inactive_at := NULL;
    NEW.suspended_at := NULL;
    NEW.suspension_reason := NULL;
  END IF;

  IF NEW.status = 'inactive'
     AND OLD.status IS DISTINCT FROM 'inactive' THEN
    NEW.inactive_at := now();
  END IF;

  IF NEW.status = 'suspended'
     AND OLD.status IS DISTINCT FROM 'suspended' THEN
    NEW.suspended_at := now();
  END IF;

  IF NEW.status = 'closed'
     AND OLD.status IS DISTINCT FROM 'closed' THEN
    NEW.closed_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shops_lifecycle_validation
ON public.shops;

CREATE TRIGGER trg_shops_lifecycle_validation
BEFORE INSERT OR UPDATE ON public.shops
FOR EACH ROW
EXECUTE FUNCTION public.validate_shop_lifecycle();

-- ------------------------------------------------------------
-- 4. La règle de commande reste la même :
-- seules les boutiques TEST ou ACTIVE peuvent recevoir
-- des commandes.
-- ------------------------------------------------------------

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
    RAISE EXCEPTION
      'Une commande ne peut pas être transférée vers une autre boutique (règle d''étanchéité BIB)';
  END IF;

  IF NEW.shop_id IS NOT NULL
     AND (
       TG_OP = 'INSERT'
       OR NEW.shop_id IS DISTINCT FROM OLD.shop_id
     ) THEN

    SELECT status
      INTO v_status
      FROM public.shops
     WHERE id = NEW.shop_id;

    IF v_status IS NULL THEN
      RAISE EXCEPTION 'Boutique inconnue';
    END IF;

    IF v_status NOT IN ('test', 'active') THEN
      RAISE EXCEPTION
        'La boutique doit être en test ou active pour recevoir des commandes (statut: %)',
        v_status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
```
