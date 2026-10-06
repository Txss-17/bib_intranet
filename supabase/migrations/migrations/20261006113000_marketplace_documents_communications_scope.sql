-- ============================================================
-- BIB INTRANET
-- MARKETPLACE — PÉRIMÈTRE DOCUMENTAIRE & COMMUNICATIONS
--
-- OBJECTIF
--
-- Les documents et communications Marketplace doivent suivre
-- exactement le périmètre métier du collaborateur.
--
-- Chaîne :
--
-- Collaborateur
--      ↓
-- Portefeuille Marketplace
--      ↓
-- Marchand
--      ↓
-- Boutique
--      ↓
-- Documents / communications
--
-- IMPORTANT :
--
-- Google Drive reste le stockage documentaire professionnel.
-- bib_documents constitue l'index métier BIB.
--
-- ============================================================


-- ============================================================
-- 1. FONCTION :
--    LE COLLABORATEUR PEUT-IL ACCÉDER À UN DOCUMENT MARCHAND ?
-- ============================================================
--
-- Cas possibles :
--
-- 1. Document directement rattaché à un marchand
-- 2. Document directement rattaché à une boutique
-- 3. Document Marketplace sans merchant_id mais avec
--    related_entity_id
--
-- Pour le périmètre Marketplace, seuls les documents
-- explicitement rattachables à un marchand ou une boutique
-- sont considérés comme accessibles.
--
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_has_marketplace_document(
  p_user_id UUID,
  p_document_id UUID
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

      FROM public.bib_documents d

      WHERE d.id = p_document_id

        AND (
          (
            d.merchant_id IS NOT NULL

            AND public.user_has_marketplace_merchant(
              p_user_id,
              d.merchant_id
            )
          )

          OR

          (
            d.shop_id IS NOT NULL

            AND EXISTS (
              SELECT 1
              FROM public.shops s
              WHERE s.id = d.shop_id
                AND s.merchant_id IS NOT NULL
                AND public.user_has_marketplace_merchant(
                  p_user_id,
                  s.merchant_id
                )
            )
          )
        )
    );
$$;


-- ============================================================
-- 2. SÉCURISATION
-- ============================================================

REVOKE ALL
ON FUNCTION public.user_has_marketplace_document(
  UUID,
  UUID
)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.user_has_marketplace_document(
  UUID,
  UUID
)
FROM anon;

GRANT EXECUTE
ON FUNCTION public.user_has_marketplace_document(
  UUID,
  UUID
)
TO authenticated;


COMMENT ON FUNCTION public.user_has_marketplace_document(
  UUID,
  UUID
)
IS
'Vérifie qu’un collaborateur Marketplace possède un périmètre actif donnant accès au marchand ou à la boutique liés au document.';


-- ============================================================
-- 3. FONCTION :
--    LE COLLABORATEUR PEUT-IL ACCÉDER À UNE COMMUNICATION ?
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_has_marketplace_communication(
  p_user_id UUID,
  p_communication_id UUID
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

      FROM public.merchant_communications mc

      WHERE mc.id = p_communication_id

        AND public.user_has_marketplace_merchant(
          p_user_id,
          mc.merchant_id
        )
    );
$$;


-- ============================================================
-- 4. SÉCURISATION
-- ============================================================

REVOKE ALL
ON FUNCTION public.user_has_marketplace_communication(
  UUID,
  UUID
)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.user_has_marketplace_communication(
  UUID,
  UUID
)
FROM anon;

GRANT EXECUTE
ON FUNCTION public.user_has_marketplace_communication(
  UUID,
  UUID
)
TO authenticated;


COMMENT ON FUNCTION public.user_has_marketplace_communication(
  UUID,
  UUID
)
IS
'Vérifie qu’un collaborateur Marketplace possède un périmètre actif donnant accès au marchand lié à la communication.';


-- ============================================================
-- 5. INDEX DOCUMENTAIRE
-- ============================================================

CREATE INDEX IF NOT EXISTS
  idx_bib_documents_marketplace_merchant_shop
ON public.bib_documents(
  merchant_id,
  shop_id
);


CREATE INDEX IF NOT EXISTS
  idx_merchant_communications_marketplace_scope
ON public.merchant_communications(
  merchant_id,
  portfolio_id,
  shop_id
);


-- ============================================================
-- 6. DOCUMENTS BIB
-- ============================================================

ALTER TABLE public.bib_documents
  ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- Suppression de l'ancienne politique trop large
-- ------------------------------------------------------------

DROP POLICY IF EXISTS
  "BIB documents read"
ON public.bib_documents;


DROP POLICY IF EXISTS
  "BIB documents manage"
ON public.bib_documents;


-- ------------------------------------------------------------
-- LECTURE
--
-- Marketplace :
--   uniquement les documents de ses marchands/boutiques.
--
-- Les autres pôles conservent leur accès métier via leurs
-- propres politiques si elles existent.
--
-- ------------------------------------------------------------

CREATE POLICY
  "Marketplace users can view assigned documents"
ON public.bib_documents

FOR SELECT

TO authenticated

USING (

  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )

  OR (
    related_pole = 'marketplace'

    AND public.user_has_marketplace_document(
      auth.uid(),
      bib_documents.id
    )
  )

);


-- ------------------------------------------------------------
-- INSERT
--
-- Un collaborateur Marketplace peut indexer un document
-- concernant un marchand de son portefeuille.
--
-- Le fichier physique reste dans Google Drive.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS
  "Marketplace users can create assigned documents"
ON public.bib_documents;


CREATE POLICY
  "Marketplace users can create assigned documents"
ON public.bib_documents

FOR INSERT

TO authenticated

WITH CHECK (

  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )

  OR (
    related_pole = 'marketplace'

    AND merchant_id IS NOT NULL

    AND public.user_has_marketplace_merchant(
      auth.uid(),
      merchant_id
    )
  )

);


-- ------------------------------------------------------------
-- UPDATE
--
-- Le collaborateur ne peut modifier que les documents de son
-- propre périmètre.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS
  "Marketplace users can update assigned documents"
ON public.bib_documents;


CREATE POLICY
  "Marketplace users can update assigned documents"
ON public.bib_documents

FOR UPDATE

TO authenticated

USING (

  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )

  OR (
    related_pole = 'marketplace'

    AND public.user_has_marketplace_document(
      auth.uid(),
      bib_documents.id
    )
  )

)

WITH CHECK (

  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )

  OR (
    related_pole = 'marketplace'

    AND (
      merchant_id IS NOT NULL
      AND public.user_has_marketplace_merchant(
        auth.uid(),
        merchant_id
      )
    )
  )

);


-- ------------------------------------------------------------
-- DELETE
--
-- Pas de suppression physique par Marketplace.
-- Les documents sont archivés via leur statut.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS
  "Marketplace users can delete documents"
ON public.bib_documents;


-- ============================================================
-- 7. JOURNAL DES ÉCHANGES DOCUMENTAIRES
-- ============================================================
--
-- Le journal peut contenir :
--
--   import_drive
--   export_drive
--   external_send
--   download
--   print
--   copy
--
-- Le collaborateur Marketplace ne doit voir que les journaux
-- concernant ses documents.
--
-- ============================================================

ALTER TABLE public.bib_document_exchange_log
  ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS
  "BIB document exchange log read"
ON public.bib_document_exchange_log;


CREATE POLICY
  "Marketplace users can view assigned document exchanges"
ON public.bib_document_exchange_log

FOR SELECT

TO authenticated

USING (

  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )

  OR (
    public.user_has_marketplace_document(
      auth.uid(),
      bib_document_exchange_log.document_id
    )
  )

);


-- ------------------------------------------------------------
-- Écriture du journal
--
-- L'utilisateur peut journaliser une action uniquement sur
-- un document de son portefeuille.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS
  "BIB document exchange log insert"
ON public.bib_document_exchange_log;


CREATE POLICY
  "Marketplace users can log assigned document exchanges"
ON public.bib_document_exchange_log

FOR INSERT

TO authenticated

WITH CHECK (

  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )

  OR (
    public.user_has_marketplace_document(
      auth.uid(),
      document_id
    )
  )

);


-- ------------------------------------------------------------
-- Pas de modification/suppression du journal.
-- ------------------------------------------------------------


-- ============================================================
-- 8. COMMUNICATIONS MARCHANDS
-- ============================================================
--
-- Une communication appartient obligatoirement à un marchand.
--
-- Le périmètre est donc déterminé par :
--
--   merchant_communications.merchant_id
--              ↓
--   user_has_marketplace_merchant()
--
-- ============================================================

ALTER TABLE public.merchant_communications
  ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS
  "Merchant communications read"
ON public.merchant_communications;


DROP POLICY IF EXISTS
  "Merchant communications create"
ON public.merchant_communications;


DROP POLICY IF EXISTS
  "Merchant communications update"
ON public.merchant_communications;


-- ------------------------------------------------------------
-- LECTURE
-- ------------------------------------------------------------

CREATE POLICY
  "Marketplace users can view assigned communications"
ON public.merchant_communications

FOR SELECT

TO authenticated

USING (

  public.user_has_marketplace_communication(
    auth.uid(),
    merchant_communications.id
  )

);


-- ------------------------------------------------------------
-- CRÉATION
--
-- Une communication ne peut être créée que pour un marchand
-- du portefeuille actif du collaborateur.
-- ------------------------------------------------------------

CREATE POLICY
  "Marketplace users can create assigned communications"
ON public.merchant_communications

FOR INSERT

TO authenticated

WITH CHECK (

  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )

  OR (
    public.has_any_pole(
      auth.uid(),
      ARRAY['marketplace']
    )

    AND public.user_has_marketplace_merchant(
      auth.uid(),
      merchant_id
    )
  )

);


-- ------------------------------------------------------------
-- MODIFICATION
--
-- Les brouillons peuvent être modifiés.
-- Les communications restent dans le périmètre du marchand.
-- ------------------------------------------------------------

CREATE POLICY
  "Marketplace users can update assigned communications"
ON public.merchant_communications

FOR UPDATE

TO authenticated

USING (

  public.user_has_marketplace_communication(
    auth.uid(),
    merchant_communications.id
  )

)

WITH CHECK (

  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )

  OR (
    public.has_any_pole(
      auth.uid(),
      ARRAY['marketplace']
    )

    AND public.user_has_marketplace_merchant(
      auth.uid(),
      merchant_id
    )
  )

);


-- ------------------------------------------------------------
-- DELETE
--
-- Pas de suppression physique.
-- Une communication peut être cancelled.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS
  "Marketplace users can delete communications"
ON public.merchant_communications;


-- ============================================================
-- 9. COHÉRENCE MARCHAND / PORTEFEUILLE
-- ============================================================
--
-- Lorsqu'une communication contient portfolio_id, celui-ci doit
-- correspondre au portefeuille auquel le marchand est
-- actuellement affecté.
--
-- On ne force pas portfolio_id à être NOT NULL afin de conserver
-- l'historique et les communications existantes.
--
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_marketplace_communication_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

  IF NEW.merchant_id IS NULL THEN
    RAISE EXCEPTION
      'Une communication Marketplace doit être rattachée à un marchand.';
  END IF;


  IF NEW.shop_id IS NOT NULL THEN

    IF NOT EXISTS (
      SELECT 1
      FROM public.shops s
      WHERE s.id = NEW.shop_id
        AND s.merchant_id = NEW.merchant_id
    ) THEN

      RAISE EXCEPTION
        'La boutique sélectionnée n''appartient pas au marchand de la communication.';

    END IF;

  END IF;


  IF NEW.portfolio_id IS NOT NULL THEN

    IF NOT EXISTS (
      SELECT 1
      FROM public.merchant_portfolio_assignments mpa
      WHERE mpa.merchant_id = NEW.merchant_id
        AND mpa.portfolio_id = NEW.portfolio_id
        AND mpa.ended_at IS NULL
    ) THEN

      RAISE EXCEPTION
        'Le portefeuille indiqué ne correspond pas au portefeuille actif du marchand.';

    END IF;

  END IF;


  RETURN NEW;

END;
$$;


DROP TRIGGER IF EXISTS
  trg_validate_marketplace_communication_scope
ON public.merchant_communications;


CREATE TRIGGER
  trg_validate_marketplace_communication_scope

BEFORE INSERT OR UPDATE
ON public.merchant_communications

FOR EACH ROW

EXECUTE FUNCTION
  public.validate_marketplace_communication_scope();


-- ============================================================
-- 10. DOCUMENTATION
-- ============================================================

COMMENT ON POLICY
  "Marketplace users can view assigned documents"
ON public.bib_documents
IS
'Marketplace ne consulte que les documents rattachés à un marchand ou une boutique appartenant à son portefeuille actif.';


COMMENT ON POLICY
  "Marketplace users can view assigned communications"
ON public.merchant_communications
IS
'Marketplace ne consulte que les communications concernant les marchands de son portefeuille actif.';


COMMENT ON POLICY
  "Marketplace users can create assigned communications"
ON public.merchant_communications
IS
'Une communication Marketplace ne peut être créée que pour un marchand appartenant au portefeuille actif du collaborateur.';


-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
