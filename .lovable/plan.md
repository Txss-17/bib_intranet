

# Ce qui reste à implémenter — État actuel

## Déjà fait (depuis la dernière analyse)

- **Mocks éliminés** : `mockData.ts` supprimé, `Dashboard.tsx` et `EthicsClosed.tsx` connectés à Supabase
- **Phase 4 (Audit 3 niveaux)** : Filtrage par `audit_type` dans `FieldAudits.tsx`, stats par type dans `AuditDashboard.tsx`
- **Phases 2+3 (Portefeuilles + Assignation)** : Tables `supplier_portfolios` / `portfolio_assignments` créées, `SupplierPortfolios.tsx` connecté
- **Phase 6 (KPI stratégiques)** : `useExecutiveKPIs.ts` avec données réelles
- **Positions** : 4 nouvelles positions ajoutées à l'enum
- **RLS renforcé** sur 13+ tables

---

## Ce qui reste

### 1. Route R&D manager incorrecte
`Login.tsx` ligne 23 : `rd_manager: '/pole/supplier'` au lieu de `'/pole/rd'`.
`positionAccess.ts` : `rd_manager.poles` = `['supplier', 'lifecycle']` — manque `'rd'`.

**Action** : Corriger la route vers `/pole/rd` et ajouter `'rd'` aux poles accessibles.

### 2. AssignmentSuggestion — données en dur
`AssignmentSuggestion.tsx` utilise un tableau `candidates` statique (5 employés codés en dur) au lieu de lire depuis la base (profiles/portfolio_assignments).

**Action** : Requêter les profils avec position `supplier_manager` et les assignments existants pour calculer la charge réelle.

### 3. SupplierOrgChart — données en dur
`SupplierOrgChart.tsx` affiche un organigramme avec des données mock (noms, équipes, performances statiques).

**Action** : Connecter à `profiles` (filtrés par poles supplier) et `portfolio_assignments` pour refléter l'organisation réelle.

### 4. SupplierDashboard — statistiques en dur
`SupplierDashboard.tsx` ligne 16 : `stats` array codé en dur (31 fournisseurs actifs, etc.). Les graphiques (PieChart, BarChart) utilisent aussi des données statiques.

**Action** : Remplacer par des agrégats depuis `suppliers`, `products`, `quality_alerts`.

### 5. Realtime non activé sur notifications/feed
Les tables `notifications` et `feed_posts` ne sont pas dans la publication `supabase_realtime`. Seul `products` a du realtime (3 pages).

**Action** : `ALTER PUBLICATION supabase_realtime ADD TABLE notifications, feed_posts;` + abonnement dans les hooks concernés.

### 6. Types TypeScript — `as any` sur les tables portfolio
`SupplierPortfolios.tsx` utilise `from('supplier_portfolios' as any)` car les types Supabase auto-générés ne contiennent pas encore ces tables.

**Action** : Les types se régénèrent automatiquement après migration. Si toujours absent, typer manuellement les interfaces.

---

## Plan d'implémentation

### Étape 1 — Corrections rapides
- Corriger `rd_manager` route → `/pole/rd` dans `Login.tsx`
- Ajouter `'rd'` aux poles de `rd_manager` dans `positionAccess.ts`

### Étape 2 — Connecter AssignmentSuggestion à la DB
- Requêter `profiles` (position supplier-related) + `portfolio_assignments` pour calculer charge
- Remplacer le tableau `candidates` statique par des données réelles

### Étape 3 — Connecter SupplierOrgChart à la DB
- Requêter `profiles` filtrés par `poles @> '{supplier}'` 
- Agréger les assignments par personne pour afficher la charge et performance réelles

### Étape 4 — SupplierDashboard dynamique
- Remplacer les stats codées en dur par des count/agrégats sur `suppliers`, `products`, `quality_alerts`, `certifications`
- Connecter les graphiques aux données réelles

### Étape 5 — Activer Realtime
- Migration SQL : ajouter `notifications` et `feed_posts` à la publication realtime
- Ajouter des subscriptions dans `useCriticalAlerts` et la page Feed

### Détails techniques
- **Fichiers modifiés** : `Login.tsx`, `positionAccess.ts`, `AssignmentSuggestion.tsx`, `SupplierOrgChart.tsx`, `SupplierDashboard.tsx`, `useCriticalAlerts.ts`, `InternalFeed.tsx`
- **Migration SQL** : ALTER PUBLICATION pour realtime
- **Aucune nouvelle table** nécessaire

