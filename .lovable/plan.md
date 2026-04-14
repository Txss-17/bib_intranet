

# Analyse des fonctionnalités non finalisées — Intranet Linksy

---

## A. Données encore en mock (pas persistées en base)

Ces pages utilisent des données statiques codées en dur au lieu de lire depuis la base de données.

| Page | Fichier | Données mock |
|------|---------|-------------|
| **Dashboard principal** | `Dashboard.tsx` | `recentIncidents`, `recentAuditLogs` importés de `mockData.ts` |
| **TopBar** (notifications/tâches) | `TopBar.tsx` | `notifications`, `tasks` importés de `mockData.ts` |
| **Feed interne** | `InternalFeed.tsx` | `feedItems` importé de `mockData.ts` |
| **Documents** | `Documents.tsx` | `documents` importé de `mockData.ts` |
| **Fiches fournisseurs** | `SupplierFiles.tsx` | `mockSuppliers` en dur (la table `suppliers` existe en DB mais n'est pas lue) |
| **Certifications** | `Certifications.tsx` | `mockCertifications` (la table `certifications` existe en DB) |
| **Historique décisions** | `DecisionHistory.tsx` | `mockDecisions` (la table `product_decisions` existe en DB) |
| **Alertes qualité** | `QualityAlerts.tsx` | `mockAlerts` (la table `quality_alerts` existe en DB) |
| **Ethics fermés** | `EthicsClosed.tsx` | `mockClosed` en dur |
| **Executive Dashboard** | `ExecutiveDashboard.tsx` | KPIs, graphiques CA/EBITDA, alertes critiques — tout en dur |

---

## B. Plan v2 — 7 chantiers non commencés

Aucune des 7 phases du plan `.lovable/plan.md` n'a été implémentée :

1. **Liaison Audit ↔ Fournisseur** — Pas de section audit dans les fiches fournisseurs, pas d'actions automatiques post-audit, pas de colonnes `audit_status`/`quality_score` sur la table `suppliers`

2. **Portefeuilles par catégorie** — La page `SupplierPortfolios.tsx` existe mais fonctionne avec des données locales. Tables `supplier_portfolios` et `portfolio_assignments` non créées en DB

3. **Assignation intelligente** — Le composant `AssignmentSuggestion.tsx` existe en UI mais sans logique métier connectée à la DB

4. **Audit 3 niveaux** — Pas de distinction initial/continu/périodique dans les audits. Le champ `audit_type` dans `field_audits` n'est pas exploité pour cette logique

5. **Notifications multi-sources** — `useCriticalAlerts` ne couvre que Ethics/Gateway. Audit, supplier, risk, performance ne génèrent pas de notifications

6. **KPI stratégiques internes** — Executive Dashboard entièrement statique, aucun onglet "Intelligence", pas de données réelles

7. **Organisation pôle fournisseur** — `SupplierOrgChart.tsx` existe en composant mais pas intégré dans un workflow réel avec RBAC

---

## C. Fonctionnalités transverses incomplètes

| Fonctionnalité | Statut |
|---------------|--------|
| **Notifications temps réel** | Fonctionne pour Ethics/Gateway uniquement. TopBar lit encore `mockData.ts` |
| **Export PDF** | Logo Linksy en en-tête demandé mais non vérifié sur tous les modules |
| **Réinitialisation mot de passe** | Pas de page "Mot de passe oublié" sur le login |
| **Changement mot de passe** | Page Settings a une section Sécurité mais non fonctionnelle avec Supabase |
| **RLS policies** | Tables existantes ont probablement des policies mais non vérifiable ici — à auditer |
| **Rôles manquants** | L'enum `employee_position` ne couvre que 8 postes (sur les 12 prévus en Phase 1 RBAC). Manquent : `marketing_manager`, `rh_manager`, `risk_manager`, `rd_manager` |
| **Feed interne** | Aucune table DB pour les publications internes |
| **Documents** | Aucune table DB pour le coffre-fort documentaire par pôle |

---

## D. Résumé priorisé

```text
PRIORITÉ HAUTE (fondations)
├── Remplacer les mock par les tables DB existantes (suppliers, certifications, quality_alerts, product_decisions)
├── Connecter TopBar aux notifications DB (table `notifications` existe)
├── Ajouter les 4 positions manquantes à l'enum employee_position
└── Implémenter reset/change password

PRIORITÉ MOYENNE (plan v2)
├── Phase 1 : Liaison Audit ↔ Fournisseur
├── Phase 4 : Audit 3 niveaux
├── Phase 5 : Notifications multi-sources
└── Phase 6 : KPI stratégiques (Executive Dashboard connecté aux vraies données)

PRIORITÉ BASSE (enrichissement)
├── Phase 2 : Portefeuilles catégorie (tables DB)
├── Phase 3 : Assignation intelligente
├── Phase 7 : Organigramme fournisseur
├── Feed interne persisté en DB
└── Documents/coffre-fort par pôle
```

---

Souhaitez-vous que je commence l'implémentation par les priorités hautes (remplacement des mocks + mots de passe + rôles manquants) ?

