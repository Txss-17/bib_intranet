# Évolution Brand-in-a-Box → ERP interne

Ce chantier est très large (16 blocs fonctionnels). Je propose un découpage en 4 phases livrables indépendamment pour garder l'architecture modulaire et éviter la régression sur l'existant.

## Phase 1 — Fondations Data & Publications (prioritaire)

**Nouveau pôle Data & Analytics** (`data`)
- Ajout dans `positionAccess.ts`, sidebar, permissions matrix
- Postes : `data_analyst` (actif), `data_lead`, `bi_analyst`, `data_engineer` (préparés, désactivés)
- Pages : Dashboard Data, KPI Catalogue, Rapports, BI, Demandes publication, Historique versions

**Catalogue KPI** (table `kpi_catalog`)
- Champs : name, description, formula, source, frequency, owner_id, version, pole_access[], status
- CRUD + versioning (table `kpi_versions`)

**Workflow Data → Tech** (table `publication_requests`)
- États : draft → data_validated → tech_queued → in_dev → testing → deployed → archived
- Notifications à chaque transition

**Système de publications** (table `publications`)
- Types : `technical` (kpi/dashboard/feature/fix/maintenance), `news`, `hr`, `finance`, `legal`, `security`
- Visibilité : `visibility_scope` (all/subsidiary/pole/team/role/user) + `visibility_targets[]`
- Dates : `publish_at`, `available_at`, `archive_at`
- Journal historisé automatique

**Centre "What's New"** (`/whats-new`)
- Feed filtrable par catégorie
- Badge non-lu par utilisateur

## Phase 2 — Notifications & Gouvernance

- Notifications multi-canal : intranet (existe), email Workspace (via `auth-email-hook`), centre notifications
- Ciblage automatique selon `visibility_scope` de la publication
- Backlog Tech (table `tech_backlog`) : priorité, impact, échéance, complexité, responsable, statut
- Matrice gouvernance données (Data/Tech/Direction/Métiers) → documentée dans `PermissionsMatrix`

## Phase 3 — Paramètres compte étendus & RH

- Onglet **Professionnel** dans Settings : poste, pôle, filiale, manager, mode travail (remote/hybride/terrain/bureau)
- Onglet **Ressources** : matériel, licences, carte entreprise, documents RH (existe partiellement → à consolider)
- Onglet **Accès** : modules, permissions, groupes Workspace
- Champ `work_mode` ajouté à `profiles`

## Phase 4 — Modules métiers transverses

- **Déplacements pro** (table `business_trips`) : demande → validation manager → réservation → justificatifs → rapport mission
- **Carte entreprise** (table `corporate_cards`) : activation, plafond, catégories, historique transactions ; accès scindé salarié/finance/direction
- **Dashboard Direction global** (`/direction/global`) : agrège CA, marge, commandes, fournisseurs, audits, satisfaction, tickets, KPI par pôle (via `useDirectionKPIs` étendu)

## Détails techniques

- Migrations SQL : `kpi_catalog`, `kpi_versions`, `publications`, `publication_requests`, `publication_reads`, `tech_backlog`, `business_trips`, `corporate_cards`, `corporate_card_transactions` + ajout colonnes `work_mode`, `subsidiary`, `manager_id` sur `profiles`
- Toutes tables : RLS + GRANT authenticated/service_role, `has_role`/`has_pole_access` pour scope
- Edge function `notify-publication` : dispatch email + notification lors du déploiement
- Hook `usePublicationVisibility` centralise le filtrage
- Sidebar : nouveau groupe "Data & Analytics" + entrée transversale "What's New"

## Question avant d'attaquer

Ce périmètre = ~30 fichiers + 8 migrations. Je propose de **commencer par la Phase 1** (fondations Data + publications + What's New) qui débloque tout le reste, puis d'itérer.

**Veux-tu que je démarre directement la Phase 1**, ou préfères-tu qu'on livre autre chose en priorité (ex. Phase 4 Dashboard Direction global d'abord) ?
