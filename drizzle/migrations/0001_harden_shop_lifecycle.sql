```sql
-- ============================================================
-- BIB — DURCISSEMENT DU CYCLE DE VIE DES BOUTIQUES
-- Migration 0001
--
-- Objectifs :
-- 1. Empêcher les transitions de statut non autorisées.
-- 2. Imposer une justification pour suspended / closed.
-- 3. Empêcher toute réactivation d'une boutique clôturée.
-- 4. Garantir la cohérence minimale des timestamps métier.
-- 5. Conserver le journal automatique existant.
--
-- Le trigger trg_shops_status_log de la migration 0000
-- reste l'unique mécanisme de journalisation automatique.
-- ============================================================


-- ============================================================
-- 1. Fonction de contrôle du cycle de vie
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_shop_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN

  -- ----------------------------------------------------------
  -- INSERT
  -- ----------------------------------------------------------
  IF TG_OP = 'INSERT' THEN

    -- Une nouvelle boutique doit commencer par une candidature.
    IF NEW.status <> 'application' THEN
      RAISE EXCEPTION
        'Une nouvelle boutique doit commencer avec le statut application';
    END IF;

    -- Cohérence de la période de test.
    IF NEW.test_ends_at IS NOT NULL
       AND NEW.test_started_at IS NULL THEN
      RAISE EXCEPTION
        'test_ends_at ne peut pas être renseigné sans test_started_at';
    END IF;

    IF NEW.test_started_at IS NOT NULL
       AND NEW.test_ends_at IS NOT NULL
       AND NEW.test_ends_at <= NEW.test_started_at THEN
      RAISE EXCEPTION
        'La date de fin de test doit être postérieure à la date de début';
    END IF;

    RETURN NEW;
  END IF;


  -- ----------------------------------------------------------
  -- UPDATE sans changement de statut
  -- ----------------------------------------------------------
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN

    -- Cohérence de la période de test.
    IF NEW.test_ends_at IS NOT NULL
       AND NEW.test_started_at IS NULL THEN
      RAISE EXCEPTION
        'test_ends_at ne peut pas être renseigné sans test_started_at';
    END IF;

    IF NEW.test_started_at IS NOT NULL
       AND NEW.test_ends_at IS NOT NULL
       AND NEW.test_ends_at <= NEW.test_started_at THEN
      RAISE EXCEPTION
        'La date de fin de test doit être postérieure à la date de début';
    END IF;

    RETURN NEW;
  END IF;


  -- ----------------------------------------------------------
  -- 2. Matrice officielle des transitions
  -- ----------------------------------------------------------

  IF NOT (
       (OLD.status = 'application' AND NEW.status IN ('review', 'closed'))
    OR (OLD.status = 'review'      AND NEW.status IN ('test', 'active', 'closed'))
    OR (OLD.status = 'test'        AND NEW.status IN ('active', 'suspended', 'closed'))
    OR (OLD.status = 'active'      AND NEW.status IN ('suspended', 'closed'))
    OR (OLD.status = 'suspended'   AND NEW.status IN ('active', 'closed'))
  ) THEN

    RAISE EXCEPTION
      'Transition de boutique interdite : % -> %',
      OLD.status,
      NEW.status;

  END IF;


  -- ----------------------------------------------------------
  -- 3. Justification obligatoire pour suspension / clôture
  -- ----------------------------------------------------------

  IF NEW.status IN ('suspended', 'closed') THEN

    IF NEW.suspension_reason IS NULL
       OR btrim(NEW.suspension_reason) = '' THEN

      RAISE EXCEPTION
        'Une justification est obligatoire pour passer une boutique en %',
        NEW.status;

    END IF;

  END IF;


  -- ----------------------------------------------------------
  -- 4. Passage en période de test
  -- ----------------------------------------------------------

  IF NEW.status = 'test' THEN

    IF NEW.test_started_at IS NULL THEN
      NEW.test_started_at := now();
    END IF;

    IF NEW.test_ends_at IS NULL THEN
      RAISE EXCEPTION
        'Une boutique en période de test doit avoir une date de fin de test';
    END IF;

    IF NEW.test_ends_at <= NEW.test_started_at THEN
      RAISE EXCEPTION
        'La date de fin de test doit être postérieure à la date de début';
    END IF;

  END IF;


  -- ----------------------------------------------------------
  -- 5. Activation
  -- ----------------------------------------------------------

  IF NEW.status = 'active' THEN

    IF NEW.activated_at IS NULL THEN
      NEW.activated_at := now();
    END IF;

    -- Une boutique redevenue active n'est plus suspendue.
    NEW.suspended_at := NULL;
    NEW.suspension_reason := NULL;

  END IF;


  -- ----------------------------------------------------------
  -- 6. Suspension
  -- ----------------------------------------------------------

  IF NEW.status = 'suspended' THEN

    IF NEW.suspended_at IS NULL THEN
      NEW.suspended_at := now();
    END IF;

  END IF;


  -- ----------------------------------------------------------
  -- 7. Clôture
  -- ----------------------------------------------------------

  IF NEW.status = 'closed' THEN

    IF NEW.closed_at IS NULL THEN
      NEW.closed_at := now();
    END IF;

  END IF;


  -- ----------------------------------------------------------
  -- 8. Cohérence finale des timestamps
  -- ----------------------------------------------------------

  IF NEW.test_started_at IS NOT NULL
     AND NEW.test_ends_at IS NOT NULL
     AND NEW.test_ends_at <= NEW.test_started_at THEN

    RAISE EXCEPTION
      'La période de test est incohérente : test_ends_at doit être postérieur à test_started_at';

  END IF;


  RETURN NEW;
END;
$$;


-- ============================================================
-- 9. Trigger de contrôle
-- ============================================================

DROP TRIGGER IF EXISTS trg_shops_lifecycle_validation
ON public.shops;

CREATE TRIGGER trg_shops_lifecycle_validation
BEFORE INSERT OR UPDATE ON public.shops
FOR EACH ROW
EXECUTE FUNCTION public.validate_shop_lifecycle();


-- ============================================================
-- 10. Sécurité supplémentaire sur le compteur de prolongations
-- ============================================================

ALTER TABLE public.shops
  DROP CONSTRAINT IF EXISTS shops_test_extensions_nonnegative;

ALTER TABLE public.shops
  ADD CONSTRAINT shops_test_extensions_nonnegative
  CHECK (test_extensions >= 0);


-- ============================================================
-- 11. Sécurité supplémentaire sur le taux de commission
-- ============================================================

ALTER TABLE public.shops
  DROP CONSTRAINT IF EXISTS shops_commission_rate_valid;

ALTER TABLE public.shops
  ADD CONSTRAINT shops_commission_rate_valid
  CHECK (commission_rate >= 0 AND commission_rate <= 100);


-- ============================================================
-- FIN
--
-- Le trigger trg_shops_status_log de 0000 reste actif.
-- Il journalise automatiquement chaque changement de statut.
--
-- Cette migration ne crée donc PAS de second trigger de journal.
-- ============================================================
```
