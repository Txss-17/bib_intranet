-- ============================================================
-- BIB — Migration corrective
-- Onboarding RH — intégration collaborateur
--
-- Objectifs :
-- 1. Aligner employee_position avec les positions actuelles.
-- 2. Migrer les anciennes positions connues.
-- 3. Retirer la dépendance RH -> Tech dans les RLS.
-- 4. Permettre à RH + Direction de gérer les dossiers RH.
-- 5. Permettre à Direction / Product / Security de consulter
--    les dossiers validés afin d'assurer le provisionnement.
-- 6. Corriger les notifications du workflow RH.
--
-- IMPORTANT :
-- Cette migration ne modifie aucune migration historique.
-- Les anciennes valeurs d'enum restent temporairement présentes
-- afin d'éviter une rupture avec d'éventuelles données historiques.
-- ============================================================

-- ============================================================
-- Alignement de l'enum pole_id avec l'architecture BIB actuelle
-- ============================================================

ALTER TYPE public.pole_id
  ADD VALUE IF NOT EXISTS 'marketplace';

ALTER TYPE public.pole_id
  ADD VALUE IF NOT EXISTS 'support';

ALTER TYPE public.pole_id
  ADD VALUE IF NOT EXISTS 'product';

ALTER TYPE public.pole_id
  ADD VALUE IF NOT EXISTS 'data';

ALTER TYPE public.pole_id
  ADD VALUE IF NOT EXISTS 'security';

-- ============================================================
-- 1. Ajouter les positions actuelles à employee_position
-- ============================================================

ALTER TYPE public.employee_position
  ADD VALUE IF NOT EXISTS 'customer_success_manager';

ALTER TYPE public.employee_position
  ADD VALUE IF NOT EXISTS 'rse_impact_manager';

ALTER TYPE public.employee_position
  ADD VALUE IF NOT EXISTS 'product_engineering_manager';

ALTER TYPE public.employee_position
  ADD VALUE IF NOT EXISTS 'marketing_communication_manager';

ALTER TYPE public.employee_position
  ADD VALUE IF NOT EXISTS 'rh_manager';

ALTER TYPE public.employee_position
  ADD VALUE IF NOT EXISTS 'data_bi_manager';

ALTER TYPE public.employee_position
  ADD VALUE IF NOT EXISTS 'security_it_manager';


-- ============================================================
-- 2. Migrer les anciennes positions utilisées par les profils
-- ============================================================

UPDATE public.profiles
SET position = 'customer_success_manager'
WHERE position::text = 'user_success_manager';

UPDATE public.profiles
SET position = 'rse_impact_manager'
WHERE position::text = 'rse_packaging_manager';

UPDATE public.profiles
SET position = 'product_engineering_manager'
WHERE position::text = 'tech_platform_manager';


-- ============================================================
-- 3. Migrer les anciennes positions dans les dossiers RH
-- ============================================================

UPDATE public.hr_employee_requests
SET position = 'customer_success_manager'
WHERE position::text = 'user_success_manager';

UPDATE public.hr_employee_requests
SET position = 'rse_impact_manager'
WHERE position::text = 'rse_packaging_manager';

UPDATE public.hr_employee_requests
SET position = 'product_engineering_manager'
WHERE position::text = 'tech_platform_manager';


-- ============================================================
-- 4. Refonte des politiques RLS du workflow RH
-- ============================================================

DROP POLICY IF EXISTS "hr_requests_select"
ON public.hr_employee_requests;

DROP POLICY IF EXISTS "hr_requests_insert"
ON public.hr_employee_requests;

DROP POLICY IF EXISTS "hr_requests_update"
ON public.hr_employee_requests;

DROP POLICY IF EXISTS "hr_requests_delete"
ON public.hr_employee_requests;


-- ------------------------------------------------------------
-- Lecture
--
-- RH + Direction :
-- accès complet aux dossiers.
--
-- Product + Security :
-- accès uniquement aux dossiers validés par RH,
-- nécessaires au provisionnement.
-- ------------------------------------------------------------

CREATE POLICY "hr_requests_select"
ON public.hr_employee_requests
FOR SELECT
TO authenticated
USING (
  public.has_any_pole(
    auth.uid(),
    ARRAY['rh', 'direction']
  )
  OR (
    status = 'hr_validated'
    AND public.has_any_pole(
      auth.uid(),
      ARRAY['product', 'security']
    )
  )
  OR created_by = auth.uid()
);


-- ------------------------------------------------------------
-- Création
--
-- Seuls RH et Direction peuvent créer un dossier RH.
-- ------------------------------------------------------------

CREATE POLICY "hr_requests_insert"
ON public.hr_employee_requests
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.has_pole(auth.uid(), 'rh')
    OR public.is_leadership(auth.uid())
  )
);


-- ------------------------------------------------------------
-- Modification
--
-- RH + Direction pilotent le dossier.
--
-- Product / Security ne modifient pas directement le dossier :
-- le provisionnement est effectué par la fonction serveur.
-- ------------------------------------------------------------

CREATE POLICY "hr_requests_update"
ON public.hr_employee_requests
FOR UPDATE
TO authenticated
USING (
  public.has_pole(auth.uid(), 'rh')
  OR public.is_leadership(auth.uid())
)
WITH CHECK (
  public.has_pole(auth.uid(), 'rh')
  OR public.is_leadership(auth.uid())
);


-- ------------------------------------------------------------
-- Suppression
--
-- Réservée à la Direction / administration.
-- ------------------------------------------------------------

CREATE POLICY "hr_requests_delete"
ON public.hr_employee_requests
FOR DELETE
TO authenticated
USING (
  public.is_leadership(auth.uid())
);


-- ============================================================
-- 5. Fonction de notification du workflow RH
-- ============================================================
--
-- Lorsqu'un dossier passe à hr_validated :
--   - RH reste informé du changement ;
--   - Direction reçoit une notification ;
--   - Product reçoit une notification ;
--   - Security reçoit une notification.
--
-- Les notifications sont volontairement séparées :
-- pole_id ne peut représenter qu'un seul pôle par notification.
--
-- Lorsqu'un dossier passe à completed :
--   - RH reçoit la confirmation du provisionnement.
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_hr_employee_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

  IF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN

    -- --------------------------------------------------------
    -- Validation RH
    -- --------------------------------------------------------
    IF NEW.status = 'hr_validated' THEN

      -- Direction
      INSERT INTO public.notifications (
        title,
        message,
        type,
        pole_id,
        action_url
      )
      VALUES (
        'Dossier collaborateur validé — ' || NEW.reference,
        NEW.first_name || ' ' || NEW.last_name ||
          ' est prêt pour le provisionnement.',
        'info',
        'direction',
        '/pole/rh/onboarding'
      );

      -- Product & Engineering
      INSERT INTO public.notifications (
        title,
        message,
        type,
        pole_id,
        action_url
      )
      VALUES (
        'Provisionnement collaborateur — ' || NEW.reference,
        NEW.first_name || ' ' || NEW.last_name ||
          ' — dossier validé par RH.',
        'info',
        'product',
        '/pole/rh/onboarding'
      );

      -- Security & IT
      INSERT INTO public.notifications (
        title,
        message,
        type,
        pole_id,
        action_url
      )
      VALUES (
        'Accès collaborateur à provisionner — ' || NEW.reference,
        NEW.first_name || ' ' || NEW.last_name ||
          ' — dossier validé par RH.',
        'info',
        'security',
        '/pole/rh/onboarding'
      );

    -- --------------------------------------------------------
    -- Rejet
    -- --------------------------------------------------------
    ELSIF NEW.status = 'rejected' THEN

      INSERT INTO public.notifications (
        title,
        message,
        type,
        pole_id,
        action_url
      )
      VALUES (
        'Dossier collaborateur rejeté — ' || NEW.reference,
        NEW.first_name || ' ' || NEW.last_name,
        'warning',
        'rh',
        '/pole/rh/onboarding'
      );

    -- --------------------------------------------------------
    -- Provisionnement terminé
    -- --------------------------------------------------------
    ELSIF NEW.status = 'completed' THEN

      INSERT INTO public.notifications (
        title,
        message,
        type,
        pole_id,
        action_url
      )
      VALUES (
        'Compte collaborateur créé — ' || NEW.reference,
        NEW.first_name || ' ' || NEW.last_name ||
          ' dispose maintenant de son compte et de ses accès.',
        'success',
        'rh',
        '/pole/rh/onboarding'
      );

    -- --------------------------------------------------------
    -- Autres changements de statut
    -- --------------------------------------------------------
    ELSE

      INSERT INTO public.notifications (
        title,
        message,
        type,
        pole_id,
        action_url
      )
      VALUES (
        'Dossier collaborateur — ' || NEW.reference,
        NEW.first_name || ' ' || NEW.last_name ||
          ' — statut : ' || NEW.status,
        'info',
        'rh',
        '/pole/rh/onboarding'
      );

    END IF;

  END IF;

  RETURN NEW;
END;
$$;


-- ============================================================
-- 6. Garantir le trigger RH
-- ============================================================

DROP TRIGGER IF EXISTS trg_hr_request_notify
ON public.hr_employee_requests;

CREATE TRIGGER trg_hr_request_notify
AFTER UPDATE ON public.hr_employee_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_hr_employee_request();


-- ============================================================
-- 7. Journal RH
--
-- La consultation reste déterminée par l'accès au dossier parent.
-- Les utilisateurs autorisés à consulter le dossier peuvent donc
-- consulter son historique.
-- ============================================================

DROP POLICY IF EXISTS "hr_request_events_select"
ON public.hr_employee_request_events;

CREATE POLICY "hr_request_events_select"
ON public.hr_employee_request_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.hr_employee_requests r
    WHERE r.id = request_id
  )
);


-- ============================================================
-- FIN
-- ============================================================
