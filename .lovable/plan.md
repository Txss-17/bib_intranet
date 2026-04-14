

# Ce qui reste à implémenter — État des lieux

## FAIT (priorités hautes réalisées)
- SupplierFiles, Certifications, QualityAlerts, DecisionHistory → connectés à Supabase
- TopBar notifications → connectées à la table `notifications`
- Dashboard incidents + audit_logs → connectés à Supabase
- Feed interne → connecté à `feed_posts` (CRUD)
- Documents → connecté à la table `documents` (CRUD)
- Executive Dashboard → connecté via `useExecutiveKPIs` (KPIs réels)
- Mot de passe oublié (Login) + changement mot de passe (Settings) → fonctionnels
- 4 positions ajoutées à l'enum (`marketing_manager`, `rh_manager`, `risk_manager`, `rd_manager`)
- Liaison Audit ↔ Fournisseur (`audit_status`, `quality_score`, `last_audit_date` sur `suppliers`)
- Notifications multi-sources (Ethics, Gateway, quality_alerts, logistics_incidents)
- RLS renforcé sur 13+ tables

---

## RESTE À FAIRE

### 1. Mock résiduel sur le Dashboard principal
`Dashboard.tsx` importe encore `executiveMetrics` et `feedItems` de `mockData.ts` :
- Les **6 métriques** (CA, utilisateurs, commandes...) sont statiques
- Le **feed** dans l'onglet "Activité" lit le mock au lieu de `feed_posts`

**Action** : Remplacer `executiveMetrics` par des agrégats Supabase et `feedItems` par une requête sur `feed_posts`.

### 2. EthicsClosed — encore en mock
`EthicsClosed.tsx` utilise `mockClosed` en dur (10 cas fictifs).

**Action** : Lire les `whistleblower_submissions` avec `status = 'closed'` depuis Supabase.

### 3. Plan v2 — Phases non commencées

| Phase | Description | Statut |
|-------|-------------|--------|
| **2** | Portefeuilles par catégorie | Tables `supplier_portfolios` / `portfolio_assignments` non créées |
| **3** | Assignation intelligente | `AssignmentSuggestion.tsx` existe mais sans logique DB |
| **4** | Audit 3 niveaux (initial/continu/périodique) | Champ `audit_type` existe mais pas exploité côté UI |
| **7** | Organigramme fournisseur avec RBAC | `SupplierOrgChart.tsx` existe mais non intégré |

### 4. Fonctionnalités transverses

| Fonctionnalité | Détail |
|---------------|--------|
| **Export PDF** | Logo Linksy en en-tête non vérifié sur tous les modules |
| **Realtime** | Pas de Supabase Realtime activé (notifications, feed, incidents) |
| **R&D manager route** | Pointe vers `/pole/supplier` au lieu de `/pole/rd` |

---

## Plan d'implémentation proposé

### Étape 1 — Éliminer les derniers mocks (Dashboard + EthicsClosed)
- `Dashboard.tsx` : Requêtes Supabase pour les métriques (orders count, user_accounts count, cashflows sum) + feed depuis `feed_posts`
- `EthicsClosed.tsx` : Requête sur `whistleblower_submissions` filtrée par `status = 'closed'`
- Supprimer `mockData.ts` si plus aucun import

### Étape 2 — Phase 4 : Audit 3 niveaux
- Ajouter un filtre par `audit_type` (initial/continu/périodique) dans `FieldAudits.tsx`
- Afficher le type d'audit dans les cards et tableaux existants
- Ajouter des statistiques par type dans `AuditDashboard.tsx`

### Étape 3 — Phase 2+3 : Portefeuilles et assignation
- Migration SQL : créer `supplier_portfolios` et `portfolio_assignments`
- Connecter `SupplierPortfolios.tsx` à ces tables
- Implémenter la logique d'assignation dans `AssignmentSuggestion.tsx` basée sur `quality_score` et charge

### Étape 4 — Améliorations transverses
- Activer Supabase Realtime sur `notifications`, `feed_posts`
- Corriger la route R&D manager → `/pole/rd`
- Vérifier l'export PDF avec logo sur tous les modules

### Détails techniques
- Fichiers modifiés : `Dashboard.tsx`, `EthicsClosed.tsx`, `FieldAudits.tsx`, `AuditDashboard.tsx`, `SupplierPortfolios.tsx`, `AssignmentSuggestion.tsx`, `Login.tsx`
- Migration SQL pour les tables portefeuilles
- Suppression potentielle de `mockData.ts`

