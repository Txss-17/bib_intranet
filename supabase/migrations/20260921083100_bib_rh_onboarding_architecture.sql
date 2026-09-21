-- ============================================================
-- BIB — Architecture RH / Onboarding collaborateur
-- Migration 2/2
--
-- Prérequis :
--   20260921083000_bib_rh_onboarding_architecture.sql
--   doit avoir été appliquée avant cette migration.
--
-- Objectifs :
--   1. Migrer les anciens EmployeePosition vers la nouvelle
--      architecture des pôles.
--   2. Mettre à jour les accès RLS de l'Onboarding RH.
--   3. Séparer clairement RH / Direction / Product / Security.
--   4. Mettre à jour les notifications de provisionnement.
--   5. Sécuriser l'accès aux événements RH.
--
-- Onboarding concerné :
--   Onboarding RH — intégration collaborateur
-- ============================================================


-- ============================================================
-- 1. MIGRATION DES ANCIENS POSTES
-- ============================================================

UPDATE public.profiles
SET position = 'customer_success_manager'
WHERE position = 'user_success_manager';

UPDATE public.profiles
SET position = 'rse_impact_manager'
WHERE position = 'rse_packaging_manager';

UPDATE public.profiles
SET position = 'product_engineering_manager'
WHERE position = 'tech_platform_manager';

UPDATE public.profiles
SET position = 'marketing_communication_manager'
WHERE position = 'marketing_manager';

UPDATE public.profiles
SET position = 'product_engineering_manager'
WHERE position = 'rd_manager';

UPDATE public.profiles
SET position = 'security_it_manager'
WHERE position = 'risk_manager';


UPDATE public.hr_employee_requests
SET position = 'customer_success_manager'
WHERE position = 'user_success_manager';

UPDATE public.hr_employee_requests
SET position = 'rse_impact_manager'
WHERE position = 'rse_packaging_manager';

UPDATE public.hr_employee_requests
SET position = 'product_engineering_manager'
WHERE position = 'tech_platform_manager';

UPDATE public.hr_employee_requests
SET position = 'marketing_communication_manager'
WHERE position = 'marketing_manager';

UPDATE public.hr_employee_requests
SET position = 'product_engineering_manager'
WHERE position = 'rd_manager';

UPDATE public.hr_employee_requests
SET position = 'security_it_manager'
WHERE position = 'risk_manager';


-- ============================================================
-- 2. NORMALISATION DES PÔLES DES DEMANDES RH
--
-- Les anciennes demandes peuvent encore contenir les pôles
-- historiques. On remplace uniquement les identifiants devenus
-- obsolètes.
-- ============================================================

UPDATE public.hr_employee_requests
SET poles = ARRAY(
  SELECT DISTINCT
    CASE pole
      WHEN 'tech' THEN 'product'
      WHEN 'lifecycle' THEN 'marketplace'
      WHEN 'risk' THEN 'security'
      ELSE pole
    END
  FROM unnest(COALESCE(poles, ARRAY[]::text[])) AS pole
)
WHERE poles IS NOT NULL
  AND (
    'tech' = ANY(poles)
    OR 'lifecycle' = ANY(poles)
    OR 'risk' = ANY(poles)
  );


-- ============================================================
-- 3. RLS — hr_employee_requests
--
-- RH :
--   accès complet au workflow RH.
--
-- Direction :
--   accès complet au workflow RH.
--
-- Product / Security :
--   accès aux demandes validées par RH uniquement.
--   Leur rôle est le provisionnement technique et sécurité.
--
-- Créateur :
--   peut consulter sa propre demande.
-- ============================================================

ALTER TABLE public.hr_employee_requests ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "hr_employee_requests_select" ON public.hr_employee_requests;
DROP POLICY IF EXISTS "hr_employee_requests_insert" ON public.hr_employee_requests;
DROP POLICY IF EXISTS "hr_employee_requests_update" ON public.hr_employee_requests;
DROP POLICY IF EXISTS "hr_employee_requests_delete" ON public.hr_employee_requests;


CREATE POLICY "hr_employee_requests_select"
ON public.hr_employee_requests
FOR SELECT
TO authenticated
USING (
  public.has_any_pole(
    auth.uid(),
    ARRAY['rh', 'direction']::public.pole_id[]
  )
  OR (
    status = 'hr_validated'
    AND public.has_any_pole(
      auth.uid(),
      ARRAY['product', 'security']::public.pole_id[]
    )
  )
  OR created_by = auth.uid()
);


CREATE POLICY "hr_employee_requests_insert"
ON public.hr_employee_requests
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND public.has_any_pole(
    auth.uid(),
    ARRAY['rh', 'direction']::public.pole_id[]
  )
);


CREATE POLICY "hr_employee_requests_update"
ON public.hr_employee_requests
FOR UPDATE
TO authenticated
USING (
  public.has_any_pole(
    auth.uid(),
    ARRAY['rh', 'direction']::public.pole_id[]
  )
)
WITH CHECK (
  public.has_any_pole(
    auth.uid(),
    ARRAY['rh', 'direction']::public.pole_id[]
  )
);


CREATE POLICY "hr_employee_requests_delete"
ON public.hr_employee_requests
FOR DELETE
TO authenticated
USING (
  public.has_any_pole(
    auth.uid(),
    ARRAY['direction']::public.pole_id[]
  )
);


-- ============================================================
-- 4. RLS — hr_employee_request_events
--
-- Un utilisateur peut voir les événements d'une demande à
-- laquelle il a lui-même accès.
--
-- Les événements restent donc protégés par la même logique
-- métier que la demande RH.
-- ============================================================

ALTER TABLE public.hr_employee_request_events
ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "hr_employee_request_events_select"
ON public.hr_employee_request_events;


CREATE POLICY "hr_employee_request_events_select"
ON public.hr_employee_request_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.hr_employee_requests request
    WHERE request.id = hr_employee_request_events.request_id
      AND (
        public.has_any_pole(
          auth.uid(),
          ARRAY['rh', 'direction']::public.pole_id[]
        )
        OR (
          request.status = 'hr_validated'
          AND public.has_any_pole(
            auth.uid(),
            ARRAY['product', 'security']::public.pole_id[]
          )
        )
        OR request.created_by = auth.uid()
      )
  )
);


-- ============================================================
-- 5. NOTIFICATIONS RH
--
-- Workflow :
--
-- submitted
--   → RH
--
-- hr_validated
--   → Direction
--   → Product
--   → Security
--
-- rejected
--   → RH
--
-- completed
--   → RH
--
-- autres transitions
--   → RH
--
-- Product et Security ne reçoivent donc une notification
-- qu'après validation RH.
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_hr_employee_request_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_pole public.pole_id;
BEGIN

  IF NEW.status IS DISTINCT FROM OLD.status THEN

    -- --------------------------------------------------------
    -- Validation RH :
    -- transmettre aux équipes qui interviennent dans la
    -- création du compte et des accès.
    -- --------------------------------------------------------

    IF NEW.status = 'hr_validated' THEN

      INSERT INTO public.notifications (
        user_id,
        pole_id,
        type,
        title,
        message,
        link
      )
      SELECT
        p.id,
        'direction'::public.pole_id,
        'hr_onboarding',
        'Nouvelle intégration collaborateur',
        format(
          'La demande %s a été validée par les RH et nécessite un suivi Direction.',
          NEW.reference
        ),
        '/pole/rh/onboarding'
      FROM public.profiles p
      WHERE public.has_pole(p.id, 'direction'::public.pole_id);


      INSERT INTO public.notifications (
        user_id,
        pole_id,
        type,
        title,
        message,
        link
      )
      SELECT
        p.id,
        'product'::public.pole_id,
        'hr_onboarding',
        'Provisionnement collaborateur',
        format(
          'La demande %s est validée RH et nécessite la création du compte et des accès.',
          NEW.reference
        ),
        '/pole/rh/onboarding'
      FROM public.profiles p
      WHERE public.has_pole(p.id, 'product'::public.pole_id);


      INSERT INTO public.notifications (
        user_id,
        pole_id,
        type,
        title,
        message,
        link
      )
      SELECT
        p.id,
        'security'::public.pole_id,
        'hr_onboarding',
        'Contrôle des accès collaborateur',
        format(
          'La demande %s est validée RH et nécessite la préparation des accès.',
          NEW.reference
        ),
        '/pole/rh/onboarding'
      FROM public.profiles p
      WHERE public.has_pole(p.id, 'security'::public.pole_id);


    -- --------------------------------------------------------
    -- Rejet :
    -- retour aux RH.
    -- --------------------------------------------------------

    ELSIF NEW.status = 'rejected' THEN

      INSERT INTO public.notifications (
        user_id,
        pole_id,
        type,
        title,
        message,
        link
      )
      SELECT
        p.id,
        'rh'::public.pole_id,
        'hr_onboarding',
        'Demande RH rejetée',
        format(
          'La demande %s a été rejetée.',
          NEW.reference
        ),
        '/pole/rh/onboarding'
      FROM public.profiles p
      WHERE public.has_pole(p.id, 'rh'::public.pole_id);


    -- --------------------------------------------------------
    -- Intégration terminée :
    -- information RH.
    -- --------------------------------------------------------

    ELSIF NEW.status = 'completed' THEN

      INSERT INTO public.notifications (
        user_id,
        pole_id,
        type,
        title,
        message,
        link
      )
      SELECT
        p.id,
        'rh'::public.pole_id,
        'hr_onboarding',
        'Intégration collaborateur terminée',
        format(
          'La demande %s est maintenant terminée.',
          NEW.reference
        ),
        '/pole/rh/onboarding'
      FROM public.profiles p
      WHERE public.has_pole(p.id, 'rh'::public.pole_id);


    -- --------------------------------------------------------
    -- Toutes les autres transitions :
    -- RH reste informé du suivi.
    -- --------------------------------------------------------

    ELSE

      INSERT INTO public.notifications (
        user_id,
        pole_id,
        type,
        title,
        message,
        link
      )
      SELECT
        p.id,
        'rh'::public.pole_id,
        'hr_onboarding',
        'Mise à jour d'une demande RH',
        format(
          'La demande %s est passée au statut « %s ».',
          NEW.reference,
          NEW.status
        ),
        '/pole/rh/onboarding'
      FROM public.profiles p
      WHERE public.has_pole(p.id, 'rh'::public.pole_id);

    END IF;

  END IF;

  RETURN NEW;
END;
$$;


-- ============================================================
-- 6. REMPLACEMENT DU TRIGGER DE NOTIFICATION
-- ============================================================

DROP TRIGGER IF EXISTS trg_hr_request_notify
ON public.hr_employee_requests;


CREATE TRIGGER trg_hr_request_notify
AFTER UPDATE OF status
ON public.hr_employee_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_hr_employee_request_status();


-- ============================================================
-- 7. COMMENTAIRES DE DOCUMENTATION
-- ============================================================

COMMENT ON TABLE public.hr_employee_requests IS
'Workflow Onboarding RH — intégration collaborateur. La validation RH précède le provisionnement du compte et des accès.';

COMMENT ON TABLE public.hr_employee_request_events IS
'Historique auditable des transitions et actions liées à l''Onboarding RH — intégration collaborateur.';


-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
