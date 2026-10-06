-- ============================================================
-- BIB INTRANET
-- MARKETPLACE — CLIENTS & FAVORIS
-- PÉRIMÈTRE PAR PORTEFEUILLE
-- ============================================================
--
-- PRINCIPES
--
-- 1. user_accounts contient plusieurs catégories de comptes :
--      - marchands
--      - clients
--
-- 2. Marketplace ne doit jamais recevoir tous les comptes.
--
-- 3. Un collaborateur Marketplace peut consulter :
--
--      A. les marchands de ses portefeuilles ;
--      B. les clients ayant une commande liée à une boutique
--         de ses portefeuilles.
--
-- 4. Les favoris clients suivent le même périmètre boutique.
--
-- 5. Ops / Finance / Lifecycle / etc. conservent leurs accès
--    métier existants.
--
-- ============================================================


-- ============================================================
-- 1. CLIENT MARKETPLACE
-- ============================================================
--
-- Un client est accessible si :
--
-- client
--   ↓
-- commande
--   ↓
-- boutique
--   ↓
-- marchand
--   ↓
-- portefeuille Marketplace du collaborateur
--
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_has_marketplace_customer(
  p_user_id UUID,
  p_customer_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    public.is_leadership(p_user_id)

    OR public.has_role(
      p_user_id,
      'admin'::public.app_role
    )

    OR EXISTS (

      SELECT 1

      FROM public.orders o

      WHERE o.user_account_id = p_customer_id

        AND o.shop_id IS NOT NULL

        AND public.user_has_marketplace_shop(
          p_user_id,
          o.shop_id
        )
    );
$$;


REVOKE ALL
ON FUNCTION public.user_has_marketplace_customer(
  UUID,
  UUID
)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.user_has_marketplace_customer(
  UUID,
  UUID
)
FROM anon;

GRANT EXECUTE
ON FUNCTION public.user_has_marketplace_customer(
  UUID,
  UUID
)
TO authenticated;


COMMENT ON FUNCTION public.user_has_marketplace_customer(
  UUID,
  UUID
)
IS
'Vérifie qu’un client possède au moins une commande liée à une boutique couverte par le portefeuille Marketplace du collaborateur.';


-- ============================================================
-- 2. USER_ACCOUNTS
-- ============================================================
--
-- IMPORTANT :
--
-- La table contient marchands ET clients.
--
-- On ne remplace donc pas l'accès métier existant par une
-- politique Marketplace-only.
--
-- On ajoute simplement la condition Marketplace :
--
--   marchand du portefeuille
--       OU
--   client d'une boutique du portefeuille
--
-- Les fonctions existantes user_has_marketplace_merchant()
-- et user_has_marketplace_customer() portent la logique.
--
-- ============================================================

ALTER TABLE public.user_accounts
  ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS
  "Authenticated users can view user accounts"
ON public.user_accounts;


CREATE POLICY
  "Authenticated users can view user accounts"
ON public.user_accounts

FOR SELECT

TO authenticated

USING (

  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )

  OR public.has_any_pole(
    auth.uid(),
    ARRAY[
      'ops',
      'supplier',
      'finance',
      'lifecycle'
    ]
  )

  OR public.user_has_marketplace_merchant(
    auth.uid(),
    user_accounts.id
  )

  OR public.user_has_marketplace_customer(
    auth.uid(),
    user_accounts.id
  )

);


-- ============================================================
-- 3. MODIFICATION DES COMPTES
-- ============================================================
--
-- Marketplace ne doit pas pouvoir modifier les comptes clients.
--
-- Les règles existantes d'administration des comptes restent
-- réservées aux rôles administratifs/manageriaux.
--
-- On conserve donc la politique historique de gestion si elle
-- existe.
--
-- ============================================================

DROP POLICY IF EXISTS
  "Managers and admins can manage user accounts"
ON public.user_accounts;


CREATE POLICY
  "Managers and admins can manage user accounts"
ON public.user_accounts

FOR ALL

TO authenticated

USING (
  public.is_leadership(auth.uid())
  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )
  OR public.has_role(
    auth.uid(),
    'manager'::public.app_role
  )
)

WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )
  OR public.has_role(
    auth.uid(),
    'manager'::public.app_role
  )
);


-- ============================================================
-- 4. FAVORIS CLIENTS
-- ============================================================
--
-- Un favori peut être :
--
--   - produit
--   - boutique
--
-- Le snapshot possède shop_id lorsqu'une résolution vers une
-- boutique Intranet a été effectuée.
--
-- Pour un collaborateur Marketplace non privilégié :
--
--   shop_id couvert par son portefeuille = visible
--
-- Un favori sans shop_id n'est PAS exposé au collaborateur,
-- car son rattachement métier ne peut pas être déterminé de
-- manière suffisamment sûre.
--
-- ============================================================

ALTER TABLE public.marketplace_customer_favorites
  ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS
  "Marketplace favorites staff can view"
ON public.marketplace_customer_favorites;


CREATE POLICY
  "Marketplace favorites staff can view"
ON public.marketplace_customer_favorites

FOR SELECT

TO authenticated

USING (

  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )

  OR (
    public.has_any_pole(
      auth.uid(),
      ARRAY[
        'support',
        'tech'
      ]
    )

    AND marketplace_customer_favorites.shop_id IS NOT NULL
  )

  OR (
    public.has_any_pole(
      auth.uid(),
      ARRAY[
        'marketplace'
      ]
    )

    AND marketplace_customer_favorites.shop_id IS NOT NULL

    AND public.user_has_marketplace_shop(
      auth.uid(),
      marketplace_customer_favorites.shop_id
    )
  )

);


-- ============================================================
-- 5. FAVORIS — SNAPSHOT PLATFORM
-- ============================================================
--
-- Les collaborateurs ne créent/modifient pas les snapshots.
-- BIB Platform reste la source de vérité.
--
-- ============================================================

REVOKE INSERT, UPDATE, DELETE
ON public.marketplace_customer_favorites
FROM authenticated;


GRANT SELECT
ON public.marketplace_customer_favorites
TO authenticated;


GRANT ALL
ON public.marketplace_customer_favorites
TO service_role;


-- ============================================================
-- 6. INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS
  idx_orders_customer_shop
ON public.orders(
  user_account_id,
  shop_id
);


CREATE INDEX IF NOT EXISTS
  idx_marketplace_favorites_shop_user
ON public.marketplace_customer_favorites(
  shop_id,
  platform_user_id
);


-- ============================================================
-- 7. DOCUMENTATION
-- ============================================================

COMMENT ON POLICY
  "Authenticated users can view user accounts"
ON public.user_accounts
IS
'Les collaborateurs Marketplace ne voient que les marchands de leurs portefeuilles et les clients ayant une commande liée à une boutique de ces portefeuilles. Les autres pôles conservent leur périmètre métier.';


COMMENT ON POLICY
  "Marketplace favorites staff can view"
ON public.marketplace_customer_favorites
IS
'Les favoris sont visibles par Marketplace uniquement lorsqu’ils sont rattachés à une boutique couverte par son portefeuille. Les snapshots sans boutique résolue ne sont pas exposés aux collaborateurs non privilégiés.';


-- ============================================================
-- FIN
-- ============================================================
