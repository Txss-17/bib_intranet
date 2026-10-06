-- ============================================================
-- BIB INTRANET
-- MARKETPLACE — PÉRIMÈTRE OPÉRATIONNEL
--
-- OBJECTIF
--
-- Les données opérationnelles consultables depuis Marketplace
-- doivent suivre le portefeuille marchand.
--
-- Tables concernées :
--
--   1. orders
--   2. order_lifecycle_events
--   3. shop_activity_documents
--
-- Principe :
--
-- Collaborateur Marketplace
--        ↓
-- Portefeuille
--        ↓
-- Marchand
--        ↓
-- Boutique
--        ↓
-- Commandes / justificatifs / événements
--
-- IMPORTANT
--
-- Ops reste le pôle opérationnel des commandes.
--
-- Cette migration n'accorde PAS à Marketplace le droit de
-- modifier le traitement opérationnel d'une commande.
--
-- Marketplace peut consulter les commandes de ses marchands
-- lorsqu'un écran Marketplace en a besoin pour le suivi et
-- les indicateurs.
--
-- ============================================================


-- ============================================================
-- 1. FONCTION :
--    ACCÈS MARKETPLACE À UNE BOUTIQUE
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_has_marketplace_shop(
  p_user_id UUID,
  p_shop_id UUID
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

      FROM public.shops s

      WHERE s.id = p_shop_id

        AND s.merchant_id IS NOT NULL

        AND public.user_has_marketplace_merchant(
          p_user_id,
          s.merchant_id
        )
    );
$$;


-- ============================================================
-- 2. SÉCURISATION
-- ============================================================

REVOKE ALL
ON FUNCTION public.user_has_marketplace_shop(
  UUID,
  UUID
)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.user_has_marketplace_shop(
  UUID,
  UUID
)
FROM anon;

GRANT EXECUTE
ON FUNCTION public.user_has_marketplace_shop(
  UUID,
  UUID
)
TO authenticated;


COMMENT ON FUNCTION public.user_has_marketplace_shop(
  UUID,
  UUID
)
IS
'Vérifie qu’un collaborateur Marketplace possède un portefeuille actif couvrant la boutique demandée.';


-- ============================================================
-- 3. INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS
  idx_orders_marketplace_shop
ON public.orders(shop_id);


CREATE INDEX IF NOT EXISTS
  idx_order_lifecycle_events_order
ON public.order_lifecycle_events(order_id);


CREATE INDEX IF NOT EXISTS
  idx_shop_activity_documents_marketplace_shop
ON public.shop_activity_documents(shop_id);


-- ============================================================
-- 4. COMMANDES
-- ============================================================
--
-- L'ancienne politique permettait aux pôles entiers de lire
-- toutes les commandes.
--
-- On conserve l'accès métier :
--
--   Direction/Admin : toutes les commandes
--   Ops             : toutes les commandes
--   Supplier        : toutes les commandes selon politique
--   Finance         : toutes les commandes selon politique
--   Lifecycle       : toutes les commandes selon politique
--
-- Marketplace :
--   uniquement les commandes des boutiques de son portefeuille.
--
-- ============================================================

ALTER TABLE public.orders
  ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS
  "Authenticated users can view orders"
ON public.orders;


DROP POLICY IF EXISTS
  "orders_read_business"
ON public.orders;


CREATE POLICY
  "orders_read_business"
ON public.orders

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

  OR (
    orders.shop_id IS NOT NULL

    AND public.user_has_marketplace_shop(
      auth.uid(),
      orders.shop_id
    )
  )

);


-- ============================================================
-- 5. COMMANDES — MARKETPLACE NE MODIFIE PAS L'OPÉRATIONNEL
-- ============================================================
--
-- Marketplace n'obtient volontairement :
--
--   - aucun INSERT
--   - aucun UPDATE
--   - aucun DELETE
--
-- via cette migration.
--
-- Les opérations restent du ressort d'Ops / backend.
--
-- ============================================================


-- ============================================================
-- 6. ÉVÉNEMENTS DE CYCLE DE VIE DES COMMANDES
-- ============================================================
--
-- Un événement est rattaché à une commande.
-- On remonte donc :
--
-- event
--   ↓
-- order
--   ↓
-- shop
--   ↓
-- merchant
--   ↓
-- portfolio
--
-- ============================================================

ALTER TABLE public.order_lifecycle_events
  ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS
  "Authenticated can view order events"
ON public.order_lifecycle_events;


DROP POLICY IF EXISTS
  "order_events_read_business"
ON public.order_lifecycle_events;


CREATE POLICY
  "order_events_read_business"
ON public.order_lifecycle_events

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
      'lifecycle'
    ]
  )

  OR (
    EXISTS (

      SELECT 1

      FROM public.orders o

      WHERE o.id = order_lifecycle_events.order_id

        AND o.shop_id IS NOT NULL

        AND public.user_has_marketplace_shop(
          auth.uid(),
          o.shop_id
        )
    )
  )

);


-- ------------------------------------------------------------
-- Marketplace ne crée pas les événements opérationnels.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS
  "Authenticated can insert order events"
ON public.order_lifecycle_events;


-- ============================================================
-- 7. JUSTIFICATIFS D'ACTIVITÉ DES BOUTIQUES
-- ============================================================
--
-- Règle métier BIB :
--
-- Marketplace gère les justificatifs liés à l'activité
-- déclarée de la boutique.
--
-- Ops ne valide plus ces justificatifs.
--
-- Audit / Compliance conservent leur rôle indépendant.
--
-- Mais Marketplace ne doit voir que les boutiques de son
-- portefeuille.
--
-- ============================================================

ALTER TABLE public.shop_activity_documents
  ENABLE ROW LEVEL SECURITY;


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
    'admin'::public.app_role
  )

  OR public.has_any_pole(
    auth.uid(),
    ARRAY[
      'audit',
      'compliance'
    ]
  )

  OR (
    public.has_any_pole(
      auth.uid(),
      ARRAY['marketplace']
    )

    AND public.user_has_marketplace_shop(
      auth.uid(),
      shop_activity_documents.shop_id
    )
  )

);


-- ============================================================
-- 8. VÉRIFICATION DES JUSTIFICATIFS
-- ============================================================
--
-- Marketplace peut modifier les justificatifs des boutiques
-- de son portefeuille.
--
-- Audit / Compliance gardent leur accès transversal.
--
-- ============================================================

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
    'admin'::public.app_role
  )

  OR public.has_any_pole(
    auth.uid(),
    ARRAY[
      'audit',
      'compliance'
    ]
  )

  OR (
    public.has_any_pole(
      auth.uid(),
      ARRAY['marketplace']
    )

    AND public.user_has_marketplace_shop(
      auth.uid(),
      shop_activity_documents.shop_id
    )
  )

)

WITH CHECK (

  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )

  OR public.has_any_pole(
    auth.uid(),
    ARRAY[
      'audit',
      'compliance'
    ]
  )

  OR (
    public.has_any_pole(
      auth.uid(),
      ARRAY['marketplace']
    )

    AND public.user_has_marketplace_shop(
      auth.uid(),
      shop_activity_documents.shop_id
    )
  )

);


-- ============================================================
-- 9. PAS DE CRÉATION DE JUSTIFICATIF PAR MARKETPLACE
-- ============================================================
--
-- Le document justificatif est fourni/importé dans le workflow
-- documentaire prévu.
--
-- Marketplace peut ensuite le vérifier et modifier son statut.
--
-- ============================================================


-- ============================================================
-- 10. GARDE-FOU :
--     UNE COMMANDE MARKETPLACE DOIT AVOIR UNE BOUTIQUE
--     RATTACHÉE À UN MARCHAND
-- ============================================================
--
-- Les commandes historiques peuvent éventuellement avoir
-- shop_id NULL.
--
-- On ne casse donc pas les données historiques.
--
-- En revanche, toute nouvelle commande avec shop_id doit
-- pointer vers une boutique réellement rattachée à un marchand.
--
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_order_marketplace_shop_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

  IF NEW.shop_id IS NOT NULL THEN

    IF NOT EXISTS (
      SELECT 1

      FROM public.shops s

      WHERE s.id = NEW.shop_id

        AND s.merchant_id IS NOT NULL
    ) THEN

      RAISE EXCEPTION
        'La commande doit être rattachée à une boutique appartenant à un marchand.';

    END IF;

  END IF;

  RETURN NEW;

END;
$$;


DROP TRIGGER IF EXISTS
  trg_validate_order_marketplace_shop_scope
ON public.orders;


CREATE TRIGGER
  trg_validate_order_marketplace_shop_scope

BEFORE INSERT OR UPDATE OF shop_id

ON public.orders

FOR EACH ROW

EXECUTE FUNCTION
  public.validate_order_marketplace_shop_scope();


-- ============================================================
-- 11. GARDE-FOU :
--     UN JUSTIFICATIF D'ACTIVITÉ DOIT ÊTRE RATTACHÉ À UNE
--     BOUTIQUE EXISTANTE
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_shop_activity_document_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

  IF NEW.shop_id IS NULL THEN

    RAISE EXCEPTION
      'Un justificatif d''activité doit être rattaché à une boutique.';

  END IF;


  IF NOT EXISTS (
    SELECT 1

    FROM public.shops s

    WHERE s.id = NEW.shop_id
  ) THEN

    RAISE EXCEPTION
      'La boutique du justificatif est introuvable.';

  END IF;


  RETURN NEW;

END;
$$;


DROP TRIGGER IF EXISTS
  trg_validate_shop_activity_document_scope
ON public.shop_activity_documents;


CREATE TRIGGER
  trg_validate_shop_activity_document_scope

BEFORE INSERT OR UPDATE OF shop_id

ON public.shop_activity_documents

FOR EACH ROW

EXECUTE FUNCTION
  public.validate_shop_activity_document_scope();


-- ============================================================
-- 12. DOCUMENTATION
-- ============================================================

COMMENT ON POLICY
  "orders_read_business"
ON public.orders
IS
'Marketplace consulte uniquement les commandes des boutiques appartenant à ses marchands affectés. Ops, Finance, Supplier et Lifecycle conservent leur périmètre métier transversal.';


COMMENT ON POLICY
  "order_events_read_business"
ON public.order_lifecycle_events
IS
'Marketplace consulte les événements des commandes appartenant aux boutiques de son portefeuille.';


COMMENT ON POLICY
  "Shop activity documents staff can view"
ON public.shop_activity_documents
IS
'Marketplace consulte uniquement les justificatifs d’activité des boutiques appartenant à son portefeuille.';


COMMENT ON POLICY
  "Shop activity documents staff can review"
ON public.shop_activity_documents
IS
'Marketplace peut vérifier les justificatifs d’activité des boutiques de son portefeuille. Audit et Compliance conservent leur accès indépendant.';


-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
