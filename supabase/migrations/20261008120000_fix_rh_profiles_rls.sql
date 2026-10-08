-- ============================================================
-- BIB INTRANET
-- RH — CORRECTION RLS DU RÉFÉRENTIEL COLLABORATEURS
--
-- Objectif :
--   - supprimer la récursion RLS sur public.profiles
--   - permettre au RH de lire le référentiel collaborateurs
--   - conserver l'accès Direction / Admin
--   - conserver l'accès à son propre profil
--   - ne jamais ouvrir profiles à tous les utilisateurs
--
-- Cause corrigée :
--   La policy de profiles appelait has_any_pole()
--   / is_leadership(), qui peuvent eux-mêmes consulter profiles
--   avec SECURITY INVOKER.
--
-- Solution :
--   Une fonction SECURITY DEFINER dédiée vérifie les droits
--   sans repasser par la policy RLS de profiles.
-- ============================================================


-- ============================================================
-- 1. FONCTION DE CONTRÔLE D'ACCÈS AU RÉFÉRENTIEL
-- ============================================================

CREATE OR REPLACE FUNCTION public.can_access_rh_profiles(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE
      p.id = p_user_id
      AND (
        -- ----------------------------------------------------
        -- Pôle RH
        -- ----------------------------------------------------
        'rh' = ANY(
          COALESCE(
            p.poles::TEXT[],
            ARRAY[]::TEXT[]
          )
        )

        -- ----------------------------------------------------
        -- Direction
        -- ----------------------------------------------------
        OR 'direction' = ANY(
          COALESCE(
            p.poles::TEXT[],
            ARRAY[]::TEXT[]
          )
        )

        -- ----------------------------------------------------
        -- Rôles techniques / direction
        -- ----------------------------------------------------
        OR EXISTS (
          SELECT 1
          FROM public.user_roles ur
          WHERE
            ur.user_id = p_user_id
            AND ur.role::TEXT IN (
              'admin',
              'executive'
            )
        )
      )
  );
$$;


-- ============================================================
-- 2. SÉCURISER LA FONCTION
-- ============================================================

REVOKE ALL
ON FUNCTION public.can_access_rh_profiles(UUID)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.can_access_rh_profiles(UUID)
TO authenticated;


-- ============================================================
-- 3. RLS — LECTURE DES PROFILS
-- ============================================================
--
-- Important :
-- On ne fait plus appel à has_any_pole() ou is_leadership()
-- directement depuis cette policy.
--
-- La fonction SECURITY DEFINER ci-dessus effectue le contrôle
-- sans déclencher de récursion sur profiles.
-- ============================================================

DROP POLICY IF EXISTS
  "RH can view all collaborator profiles"
ON public.profiles;


DROP POLICY IF EXISTS
  "Users view own profile; admins view all"
ON public.profiles;


CREATE POLICY
  "RH can view all collaborator profiles"
ON public.profiles

FOR SELECT

TO authenticated

USING (
  id = auth.uid()
  OR public.can_access_rh_profiles(auth.uid())
);


-- ============================================================
-- 4. RLS — MODIFICATION DES PROFILS PAR RH
-- ============================================================

DROP POLICY IF EXISTS
  "RH can update collaborator profiles"
ON public.profiles;


CREATE POLICY
  "RH can update collaborator profiles"
ON public.profiles

FOR UPDATE

TO authenticated

USING (
  id = auth.uid()
  OR public.can_access_rh_profiles(auth.uid())
)

WITH CHECK (
  id = auth.uid()
  OR public.can_access_rh_profiles(auth.uid())
);


-- ============================================================
-- 5. INDEX POUR LE CONTRÔLE RH
-- ============================================================

CREATE INDEX IF NOT EXISTS
  idx_profiles_poles_rh_rls
ON public.profiles
USING GIN (poles);


-- ============================================================
-- 6. DOCUMENTATION
-- ============================================================

COMMENT ON FUNCTION public.can_access_rh_profiles(UUID)
IS
'Contrôle SECURITY DEFINER de l’accès au référentiel collaborateurs RH. Évite la récursion RLS sur public.profiles.';


-- ============================================================
-- FIN
-- ============================================================
