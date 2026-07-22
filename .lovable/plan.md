# Plan — Workflows d'approbation + Module BI complet

Deux chantiers distincts livrés dans le même cycle.

## Chantier 1 — Workflows d'approbation (Déplacements pro & Carte entreprise)

### Backend
- **`business_trips`** : ajouter colonnes `submitted_at`, `approved_at`, `approved_by`, `rejected_at`, `rejected_by`, `rejection_reason`. Étendre `status` : `draft → submitted → approved | rejected → completed`.
- **`corporate_card_transactions`** : ajouter `approval_status` (`pending | approved | rejected`), `approved_by`, `approved_at`, `rejection_reason`, `submitted_at`.
- Politiques RLS : le collaborateur soumet et voit son propre historique ; manager N+1, RH, Direction, Finance valident/rejettent.
- Table `approval_history` (polymorphe : `entity_type`, `entity_id`, `action`, `actor_id`, `comment`, `created_at`) pour traçabilité.

### UI
- **Déplacements pro** (`BusinessTrips.tsx`) : filtres par statut, boutons "Soumettre", "Approuver", "Rejeter (motif)", timeline de statut, badge coloré.
- **Carte entreprise** (`CorporateCards.tsx`) : file d'attente des transactions en attente, actions Approuver/Rejeter, motif obligatoire au rejet, journal d'approbation.
- Toast + notification intranet à chaque transition.

## Chantier 2 — Module BI

### Nouvelles tables
- `bi_dashboards` (name, pole_id, status: `draft|validation|published|archived`, version, owner_id, template_id, publish_at, archive_at, target_filiale, target_pole, target_role, target_users[]).
- `bi_dashboard_widgets` (dashboard_id, type, config JSONB, x/y/w/h grid position, kpi_id nullable, data_source).
- `bi_dashboard_versions` (dashboard_id, version, snapshot JSONB, author_id, kpis_added, kpis_removed, created_at).
- `bi_templates` (name, pole_id, preset JSONB).
- `bi_data_sources` (name, type: `kpi|sql_view|api|dataset|export|custom`, config JSONB).

### Pages (`src/pages/modules/data/bi/`)
1. **`BIOverview.tsx`** — Cartes : publiés / brouillons / en validation / archivés / widgets perso / déploiements planifiés + accès rapides.
2. **`BIDashboardsList.tsx`** — Mes tableaux de bord (table Nom/Pôle/Version/Statut/Dernière modif + actions Ouvrir, Dupliquer, Archiver, Historique, Publier).
3. **`BIDesigner.tsx`** ⭐ — Éditeur 3 colonnes :
   - Gauche : bibliothèque composants (KPI Card, Graphiques, Tableau, Jauge, Carte, Heatmap, Timeline, Texte, Image, Séparateur, Filtre, Bouton) + sources de données.
   - Centre : canevas grille responsive drag & drop (react-grid-layout), onglets multi-pages.
   - Droite : panneau propriétés du widget sélectionné (titre, KPI source, couleur, taille, icône, format, sparkline…).
   - Toolbar haute : Aperçu, Mode responsive (Desktop/Tablette/Mobile), Undo/Redo, Enregistrer, Envoyer en publication.
   - Barre basse : stepper workflow (Brouillon → Validation Data → En dev → Test → Planifié → Publié).
4. **`BIWidgetLibrary.tsx`** — Catalogue widgets disponibles avec preview.
5. **`BIDataSources.tsx`** — Gestion des sources (KPI catalog / Vues SQL / API / Dataset / Export / Calcul).
6. **`BITemplates.tsx`** — Templates (Direction, Finance, Audit, Supplier, Marketplace, RH) → "Utiliser ce template".
7. **`BIPreview.tsx`** — Prévisualisation Desktop/Tablette/Mobile avant publication.
8. **`BIAssignment.tsx`** — Modal d'affectation (Filiale/Pôle/Rôle/Manager/Utilisateur).
9. **`BIPublication.tsx`** — Actions : Enregistrer, Envoyer en validation, Publier, Planifier publication, Programmer archivage.
10. **`BIHistory.tsx`** — Historique versions : KPI ajoutés/supprimés, auteur, date, diff.

### Hooks
`src/hooks/useBI.ts` : `useDashboards`, `useDashboard`, `useCreateDashboard`, `useUpdateDashboard`, `useDashboardWidgets`, `useDashboardVersions`, `useTemplates`, `useDataSources`, `usePublishDashboard`, `useDuplicateDashboard`, `useArchiveDashboard`.

### Intégration
- Router : `/pole/data/bi`, `/pole/data/bi/dashboards`, `/pole/data/bi/designer/:id`, `/pole/data/bi/templates`, `/pole/data/bi/library`, `/pole/data/bi/sources`, `/pole/data/bi/history/:id`.
- Sidebar Data : ajouter entrée "BI" avec icône `LayoutDashboard`.
- Envoi en publication → crée une `publication_requests` liée au dashboard → alimente le Backlog Tech existant.

### Flux
```text
Catalogue KPI → Sélection KPI → BI Designer → Prévisualisation
→ Validation → Demande de publication → Backlog Tech → Déploiement
```

## Détails techniques

- Drag & drop grille : `react-grid-layout` (léger, mature).
- Charts : `recharts` (déjà présent).
- Snapshot version stocké en JSONB (config widgets + layout).
- Le stepper workflow réutilise les statuts existants de `publication_requests` pour cohérence avec le Backlog Tech.
- Toutes tables `public.*` avec GRANT authenticated/service_role + RLS auth.uid() ou has_role.
- Auto-notification intranet à chaque transition (soumission, validation, publication).

## Ordre de livraison

1. Migration Chantier 1 (workflows trips/cards).
2. UI Chantier 1 (BusinessTrips + CorporateCards).
3. Migration Chantier 2 (tables BI).
4. Hook `useBI` + pages Overview / List / Templates / Sources / Library.
5. BI Designer (drag & drop + panneau propriétés).
6. Preview / Publication / Assignment / History.
7. Routes + sidebar + intégration Publication Requests.
