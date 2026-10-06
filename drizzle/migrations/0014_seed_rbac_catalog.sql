-- ============================================================
-- BIB INTRANET — SEED DU CATALOGUE RBAC
--
-- Source actuelle :
--   src/data/jobRoles.ts
--   src/data/permissionMatrix.ts
--
-- Cette migration est idempotente.
-- Elle peut être rejouée sans créer de doublons.
-- ============================================================


-- ============================================================
-- 1. ACTIONS
-- ============================================================

INSERT INTO public.access_actions (
  action_key,
  label,
  description
)
VALUES
  (
    'read',
    'Lire',
    'Consulter une interface ou une donnée'
  ),
  (
    'create',
    'Créer',
    'Créer une nouvelle donnée ou ressource'
  ),
  (
    'update',
    'Modifier',
    'Modifier une donnée ou une ressource existante'
  ),
  (
    'delete',
    'Supprimer',
    'Supprimer une donnée ou une ressource'
  ),
  (
    'publish',
    'Publier',
    'Publier une ressource ou un contenu'
  ),
  (
    'validate',
    'Valider',
    'Valider une donnée, une opération ou un workflow'
  ),
  (
    'administer',
    'Administrer',
    'Administrer les paramètres et droits d''une interface'
  )
ON CONFLICT (action_key)
DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description;


-- ============================================================
-- 2. PÉRIMÈTRES DE BASE
-- ============================================================

INSERT INTO public.access_scopes (
  scope_key,
  label,
  scope_type,
  description
)
VALUES
  (
    'global',
    'Global',
    'global',
    'Accès à l''ensemble des données autorisées'
  ),
  (
    'own_records',
    'Mes enregistrements',
    'record',
    'Accès limité aux enregistrements appartenant au collaborateur'
  ),
  (
    'pole',
    'Pôle',
    'pole',
    'Accès limité au périmètre fonctionnel d''un pôle'
  ),
  (
    'portfolio',
    'Portefeuille',
    'portfolio',
    'Accès limité au portefeuille attribué au collaborateur'
  ),
  (
    'region_fr',
    'France',
    'region',
    'Périmètre régional France'
  ),
  (
    'region_de',
    'Allemagne',
    'region',
    'Périmètre régional Allemagne'
  ),
  (
    'region_es',
    'Espagne',
    'region',
    'Périmètre régional Espagne'
  ),
  (
    'region_it',
    'Italie',
    'region',
    'Périmètre régional Italie'
  )
ON CONFLICT (scope_key)
DO UPDATE SET
  label = EXCLUDED.label,
  scope_type = EXCLUDED.scope_type,
  description = EXCLUDED.description;


-- ============================================================
-- 3. RÔLES MÉTIER
--
-- business_pole correspond au pôle métier principal.
--
-- owner_type :
--   direction        = Direction temporairement propriétaire
--   pole_responsible = responsable du pôle propriétaire
-- ============================================================

INSERT INTO public.access_roles (
  role_key,
  label,
  department,
  business_pole,
  owner_type,
  status
)
VALUES

-- ------------------------------------------------------------
-- DIRECTION
-- ------------------------------------------------------------

(
  'ceo',
  'CEO',
  'direction',
  'direction',
  'direction',
  'active'
),
(
  'coo',
  'COO — Directeur des opérations',
  'direction',
  'ops',
  'direction',
  'active'
),
(
  'cto',
  'CTO — Directeur technique',
  'direction',
  'product',
  'direction',
  'active'
),
(
  'cfo',
  'CFO — Directeur financier',
  'direction',
  'finance',
  'direction',
  'active'
),
(
  'cdo',
  'CDO — Chief Data Officer',
  'direction',
  'data',
  'direction',
  'active'
),
(
  'directeur_rh',
  'Directeur RH',
  'direction',
  'rh',
  'direction',
  'active'
),
(
  'directeur_qualite',
  'Directeur Qualité',
  'direction',
  'audit',
  'direction',
  'active'
),
(
  'directeur_marketplace',
  'Directeur Marketplace',
  'direction',
  'marketplace',
  'direction',
  'active'
),

-- ------------------------------------------------------------
-- FINANCE
-- ------------------------------------------------------------

(
  'comptable',
  'Comptable',
  'finance',
  'finance',
  'pole_responsible',
  'active'
),
(
  'controleur_gestion',
  'Contrôleur de gestion',
  'finance',
  'finance',
  'pole_responsible',
  'active'
),
(
  'analyste_financier',
  'Analyste financier',
  'finance',
  'finance',
  'pole_responsible',
  'active'
),
(
  'tresorier',
  'Trésorier',
  'finance',
  'finance',
  'pole_responsible',
  'active'
),
(
  'gestionnaire_facturation',
  'Gestionnaire de facturation',
  'finance',
  'finance',
  'pole_responsible',
  'active'
),
(
  'gestionnaire_remboursements',
  'Gestionnaire des remboursements',
  'finance',
  'finance',
  'pole_responsible',
  'active'
),
(
  'gestionnaire_paiements',
  'Gestionnaire Stripe / Paiements',
  'finance',
  'finance',
  'pole_responsible',
  'active'
),

-- ------------------------------------------------------------
-- RH
-- ------------------------------------------------------------

(
  'responsable_rh',
  'Responsable RH',
  'rh',
  'rh',
  'pole_responsible',
  'active'
),
(
  'charge_recrutement',
  'Chargé de recrutement',
  'rh',
  'rh',
  'pole_responsible',
  'active'
),
(
  'gestionnaire_paie',
  'Gestionnaire paie',
  'rh',
  'rh',
  'pole_responsible',
  'active'
),
(
  'gestionnaire_admin_rh',
  'Gestionnaire administratif RH',
  'rh',
  'rh',
  'pole_responsible',
  'active'
),
(
  'responsable_formation',
  'Responsable formation',
  'rh',
  'rh',
  'pole_responsible',
  'active'
),

-- ------------------------------------------------------------
-- SUPPLIER
-- ------------------------------------------------------------

(
  'responsable_fournisseurs',
  'Responsable fournisseurs',
  'supplier',
  'supplier',
  'pole_responsible',
  'active'
),
(
  'gestionnaire_fournisseurs',
  'Gestionnaire fournisseurs',
  'supplier',
  'supplier',
  'pole_responsible',
  'active'
),
(
  'responsable_catalogue',
  'Responsable catalogue produits',
  'supplier',
  'supplier',
  'pole_responsible',
  'active'
),
(
  'gestionnaire_catalogue',
  'Gestionnaire catalogue',
  'supplier',
  'supplier',
  'pole_responsible',
  'active'
),
(
  'conformite_fournisseurs',
  'Responsable conformité fournisseurs',
  'supplier',
  'supplier',
  'pole_responsible',
  'active'
),
(
  'acheteur',
  'Acheteur',
  'supplier',
  'supplier',
  'pole_responsible',
  'active'
),

-- ------------------------------------------------------------
-- MARKETPLACE
-- ------------------------------------------------------------

(
  'responsable_marketplace',
  'Responsable marketplace',
  'marketplace',
  'marketplace',
  'pole_responsible',
  'active'
),
(
  'gestionnaire_boutiques',
  'Gestionnaire boutiques',
  'marketplace',
  'marketplace',
  'pole_responsible',
  'active'
),
(
  'gestionnaire_vendeurs',
  'Gestionnaire vendeurs',
  'marketplace',
  'marketplace',
  'pole_responsible',
  'active'
),
(
  'gestionnaire_commandes',
  'Gestionnaire commandes',
  'marketplace',
  'marketplace',
  'pole_responsible',
  'active'
),
(
  'gestionnaire_litiges',
  'Gestionnaire litiges',
  'marketplace',
  'marketplace',
  'pole_responsible',
  'active'
),
(
  'gestionnaire_avis',
  'Gestionnaire avis',
  'marketplace',
  'marketplace',
  'pole_responsible',
  'active'
),

-- ------------------------------------------------------------
-- AUDIT / QUALITÉ
-- ------------------------------------------------------------

(
  'responsable_qualite',
  'Responsable qualité',
  'quality',
  'audit',
  'pole_responsible',
  'active'
),
(
  'auditeur_qualite',
  'Auditeur qualité',
  'quality',
  'audit',
  'pole_responsible',
  'active'
),
(
  'auditeur_terrain',
  'Auditeur terrain',
  'quality',
  'audit',
  'pole_responsible',
  'active'
),
(
  'responsable_conformite',
  'Responsable conformité',
  'quality',
  'compliance',
  'pole_responsible',
  'active'
),
(
  'gestionnaire_nc',
  'Gestionnaire non-conformités',
  'quality',
  'audit',
  'pole_responsible',
  'active'
),
(
  'gestionnaire_certifications',
  'Gestionnaire certifications',
  'quality',
  'audit',
  'pole_responsible',
  'active'
),

-- ------------------------------------------------------------
-- OPS
-- ------------------------------------------------------------

(
  'responsable_logistique',
  'Responsable logistique',
  'logistics',
  'ops',
  'pole_responsible',
  'active'
),
(
  'gestionnaire_transport',
  'Gestionnaire transport',
  'logistics',
  'ops',
  'pole_responsible',
  'active'
),
(
  'gestionnaire_entrepots',
  'Gestionnaire entrepôts',
  'logistics',
  'ops',
  'pole_responsible',
  'active'
),
(
  'gestionnaire_stocks',
  'Gestionnaire stocks',
  'logistics',
  'ops',
  'pole_responsible',
  'active'
),
(
  'coordinateur_expeditions',
  'Coordinateur expéditions',
  'logistics',
  'ops',
  'pole_responsible',
  'active'
),

-- ------------------------------------------------------------
-- SUPPORT
-- ------------------------------------------------------------

(
  'responsable_support',
  'Responsable support',
  'support',
  'support',
  'pole_responsible',
  'active'
),
(
  'technicien_support',
  'Technicien support',
  'support',
  'support',
  'pole_responsible',
  'active'
),
(
  'conseiller_client',
  'Conseiller client',
  'support',
  'support',
  'pole_responsible',
  'active'
),
(
  'gestionnaire_tickets',
  'Gestionnaire tickets',
  'support',
  'support',
  'pole_responsible',
  'active'
),
(
  'community_support',
  'Community Support',
  'support',
  'support',
  'pole_responsible',
  'active'
),

-- ------------------------------------------------------------
-- COMPLIANCE / JURIDIQUE
-- ------------------------------------------------------------

(
  'juriste',
  'Juriste',
  'legal',
  'compliance',
  'pole_responsible',
  'active'
),
(
  'conformite_juridique',
  'Responsable conformité juridique',
  'legal',
  'compliance',
  'pole_responsible',
  'active'
),
(
  'gestionnaire_contrats',
  'Gestionnaire contrats',
  'legal',
  'compliance',
  'pole_responsible',
  'active'
),
(
  'gestionnaire_docusign',
  'Gestionnaire DocuSign',
  'legal',
  'compliance',
  'pole_responsible',
  'active'
),

-- ------------------------------------------------------------
-- MARKETING
-- ------------------------------------------------------------

(
  'responsable_marketing',
  'Responsable marketing',
  'marketing',
  'marketing',
  'pole_responsible',
  'active'
),
(
  'growth_manager',
  'Growth Manager',
  'marketing',
  'marketing',
  'pole_responsible',
  'active'
),
(
  'content_manager',
  'Content Manager',
  'marketing',
  'marketing',
  'pole_responsible',
  'active'
),
(
  'seo_manager',
  'SEO Manager',
  'marketing',
  'marketing',
  'pole_responsible',
  'active'
),
(
  'social_media_manager',
  'Social Media Manager',
  'marketing',
  'marketing',
  'pole_responsible',
  'active'
),
(
  'crm_manager',
  'CRM Manager',
  'marketing',
  'marketing',
  'pole_responsible',
  'active'
),

-- ------------------------------------------------------------
-- COMMERCIAL / MARKETPLACE
-- ------------------------------------------------------------

(
  'responsable_commercial',
  'Responsable commercial',
  'sales',
  'marketplace',
  'pole_responsible',
  'active'
),
(
  'business_developer',
  'Business Developer',
  'sales',
  'marketplace',
  'pole_responsible',
  'active'
),
(
  'account_manager',
  'Account Manager',
  'sales',
  'marketplace',
  'pole_responsible',
  'active'
),
(
  'customer_success_manager',
  'Customer Success Manager',
  'sales',
  'support',
  'pole_responsible',
  'active'
),

-- ------------------------------------------------------------
-- PRODUCT / ENGINEERING
-- ------------------------------------------------------------

(
  'responsable_tech',
  'Responsable Produit & Engineering',
  'tech',
  'product',
  'pole_responsible',
  'active'
),
(
  'product_manager',
  'Product Manager',
  'tech',
  'product',
  'pole_responsible',
  'active'
),
(
  'product_owner',
  'Product Owner',
  'tech',
  'product',
  'pole_responsible',
  'active'
),
(
  'scrum_master',
  'Scrum Master',
  'tech',
  'product',
  'pole_responsible',
  'active'
),
(
  'dev_frontend',
  'Développeur Front-end',
  'tech',
  'product',
  'pole_responsible',
  'active'
),
(
  'dev_backend',
  'Développeur Back-end',
  'tech',
  'product',
  'pole_responsible',
  'active'
),
(
  'dev_fullstack',
  'Développeur Full Stack',
  'tech',
  'product',
  'pole_responsible',
  'active'
),
(
  'dev_mobile',
  'Développeur Mobile',
  'tech',
  'product',
  'pole_responsible',
  'active'
),
(
  'ux_designer',
  'UX Designer',
  'tech',
  'product',
  'pole_responsible',
  'active'
),
(
  'ui_designer',
  'UI Designer',
  'tech',
  'product',
  'pole_responsible',
  'active'
),
(
  'product_designer',
  'Product Designer',
  'tech',
  'product',
  'pole_responsible',
  'active'
),
(
  'qa_engineer',
  'QA Engineer',
  'tech',
  'product',
  'pole_responsible',
  'active'
),
(
  'testeur_logiciel',
  'Testeur logiciel',
  'tech',
  'product',
  'pole_responsible',
  'active'
),
(
  'devops_engineer',
  'DevOps Engineer',
  'tech',
  'product',
  'pole_responsible',
  'active'
),
(
  'sre',
  'Site Reliability Engineer (SRE)',
  'tech',
  'product',
  'pole_responsible',
  'active'
),
(
  'admin_systeme',
  'Administrateur système',
  'tech',
  'security',
  'pole_responsible',
  'active'
),
(
  'dba',
  'Administrateur base de données (DBA)',
  'tech',
  'data',
  'pole_responsible',
  'active'
),
(
  'architecte_logiciel',
  'Architecte logiciel',
  'tech',
  'product',
  'pole_responsible',
  'active'
),
(
  'architecte_cloud',
  'Architecte cloud',
  'tech',
  'product',
  'pole_responsible',
  'active'
),
(
  'ingenieur_cybersecurite',
  'Ingénieur cybersécurité',
  'tech',
  'security',
  'pole_responsible',
  'active'
),

-- ------------------------------------------------------------
-- DATA
-- ------------------------------------------------------------

(
  'responsable_data',
  'Responsable Data',
  'data',
  'data',
  'pole_responsible',
  'active'
),
(
  'data_bi_manager',
  'Data Analyst',
  'data',
  'data',
  'pole_responsible',
  'active'
),
(
  'business_analyst',
  'Business Analyst',
  'data',
  'data',
  'pole_responsible',
  'active'
),
(
  'data_engineer',
  'Data Engineer',
  'data',
  'data',
  'pole_responsible',
  'active'
),
(
  'analytics_engineer',
  'Analytics Engineer',
  'data',
  'data',
  'pole_responsible',
  'active'
),
(
  'data_scientist',
  'Data Scientist',
  'data',
  'data',
  'pole_responsible',
  'active'
),
(
  'bi_developer',
  'BI Developer',
  'data',
  'data',
  'pole_responsible',
  'active'
),
(
  'data_steward',
  'Data Steward',
  'data',
  'data',
  'pole_responsible',
  'active'
),
(
  'data_quality_manager',
  'Data Quality Manager',
  'data',
  'data',
  'pole_responsible',
  'active'
),

-- ------------------------------------------------------------
-- SECURITY
-- ------------------------------------------------------------

(
  'rssi',
  'RSSI',
  'security',
  'security',
  'pole_responsible',
  'active'
),
(
  'analyste_cyber',
  'Analyste cybersécurité',
  'security',
  'security',
  'pole_responsible',
  'active'
),
(
  'gestionnaire_iam',
  'Gestionnaire IAM',
  'security',
  'security',
  'pole_responsible',
  'active'
),
(
  'analyste_rgpd',
  'Analyste conformité RGPD',
  'security',
  'compliance',
  'pole_responsible',
  'active'
),

-- ------------------------------------------------------------
-- ADMINISTRATION / COMMUNICATION / INNOVATION
-- ------------------------------------------------------------

(
  'office_manager',
  'Office Manager',
  'admin',
  'rh',
  'pole_responsible',
  'active'
),
(
  'assistant_administratif',
  'Assistant administratif',
  'admin',
  'rh',
  'pole_responsible',
  'active'
),
(
  'responsable_communication',
  'Responsable communication',
  'communication',
  'marketing',
  'pole_responsible',
  'active'
),
(
  'relations_presse',
  'Relations presse',
  'communication',
  'marketing',
  'pole_responsible',
  'active'
),
(
  'responsable_innovation',
  'Responsable innovation',
  'innovation',
  'product',
  'pole_responsible',
  'active'
),
(
  'chef_projet_innovation',
  'Chef de projet innovation',
  'innovation',
  'product',
  'pole_responsible',
  'active'
),

-- ------------------------------------------------------------
-- COMPTES EXTERNES
-- ------------------------------------------------------------

(
  'ext_fournisseur',
  'Fournisseur (externe)',
  'external',
  'supplier',
  'pole_responsible',
  'active'
),
(
  'ext_vendeur',
  'Vendeur Marketplace (externe)',
  'external',
  'marketplace',
  'pole_responsible',
  'active'
),
(
  'ext_client_entreprise',
  'Client entreprise',
  'external',
  'marketplace',
  'pole_responsible',
  'active'
),
(
  'ext_client_particulier',
  'Client particulier',
  'external',
  'marketplace',
  'pole_responsible',
  'active'
),
(
  'ext_auditeur',
  'Auditeur externe',
  'external',
  'audit',
  'pole_responsible',
  'active'
),
(
  'ext_prestataire',
  'Prestataire',
  'external',
  'ops',
  'pole_responsible',
  'active'
),
(
  'ext_investisseur',
  'Investisseur (lecture seule)',
  'external',
  'direction',
  'direction',
  'active'
),

-- ------------------------------------------------------------
-- COMPTES TECHNIQUES
-- ------------------------------------------------------------

(
  'svc_api',
  'Compte API',
  'technical',
  'product',
  'direction',
  'active'
),
(
  'svc_webhook',
  'Compte Webhook',
  'technical',
  'product',
  'direction',
  'active'
),
(
  'svc_robot',
  'Robot d’automatisation',
  'technical',
  'ops',
  'direction',
  'active'
),
(
  'svc_stripe',
  'Connecteur Stripe',
  'technical',
  'finance',
  'direction',
  'active'
),
(
  'svc_google',
  'Connecteur Google Workspace',
  'technical',
  'security',
  'direction',
  'active'
),
(
  'svc_supabase',
  'Connecteur Supabase',
  'technical',
  'security',
  'direction',
  'active'
)

ON CONFLICT (role_key)
DO UPDATE SET
  label = EXCLUDED.label,
  department = EXCLUDED.department,
  business_pole = EXCLUDED.business_pole,
  owner_type = EXCLUDED.owner_type,
  status = EXCLUDED.status,
  updated_at = now();


-- ============================================================
-- 4. PÉRIMÈTRES PARTICULIERS DES RÔLES
-- ============================================================

INSERT INTO public.access_role_scopes (
  role_id,
  scope_id,
  scope_value
)
SELECT
  role.id,
  scope.id,
  NULL
FROM public.access_roles role
JOIN public.access_scopes scope
  ON scope.scope_key = 'own_records'
WHERE role.role_key IN (
  'account_manager',
  'business_developer',
  'ext_fournisseur',
  'ext_vendeur',
  'ext_client_entreprise',
  'ext_client_particulier',
  'ext_prestataire',
  'ext_auditeur'
)
ON CONFLICT DO NOTHING;


INSERT INTO public.access_role_scopes (
  role_id,
  scope_id,
  scope_value
)
SELECT
  role.id,
  scope.id,
  'FR'
FROM public.access_roles role
JOIN public.access_scopes scope
  ON scope.scope_key = 'region_fr'
WHERE role.role_key = 'gestionnaire_fournisseurs'
ON CONFLICT DO NOTHING;


INSERT INTO public.access_role_scopes (
  role_id,
  scope_id,
  scope_value
)
SELECT
  role.id,
  scope.id,
  scope.scope_value
FROM public.access_roles role
CROSS JOIN (
  SELECT
    'region_fr'::text AS scope_key,
    'FR'::text AS scope_value

  UNION ALL

  SELECT
    'region_de',
    'DE'

  UNION ALL

  SELECT
    'region_es',
    'ES'

  UNION ALL

  SELECT
    'region_it',
    'IT'
) regions
JOIN public.access_scopes scope
  ON scope.scope_key = regions.scope_key
WHERE role.role_key = 'acheteur'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 5. VÉRIFICATION DU CATALOGUE
-- ============================================================

DO $$
DECLARE
  role_count INTEGER;
  action_count INTEGER;
  scope_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO role_count
  FROM public.access_roles;

  SELECT COUNT(*)
  INTO action_count
  FROM public.access_actions;

  SELECT COUNT(*)
  INTO scope_count
  FROM public.access_scopes;

  RAISE NOTICE
    'RBAC catalog seeded: % roles, % actions, % scopes',
    role_count,
    action_count,
    scope_count;
END $$;
