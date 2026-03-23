

# Plan d'implémentation — Intranet Linksy v2

Analyse de l'existant vs la vision décrite, organisée en phases d'implémentation.

---

## Ce qui existe déjà

- Fiches fournisseurs avec statuts (validé/en attente/suspendu), score risque, certifications
- Audits fournisseurs et ops (CRUD via Supabase)
- Notifications temps réel (Ethics/Gateway uniquement)
- Dashboard exécutif avec KPIs globaux (CA, EBITDA, ESG)
- Dashboard pôle fournisseur avec stats de base

## Ce qui manque (7 chantiers)

---

### Phase 1 — Liaison Audit ↔ Fournisseur

**Objectif** : Connecter les résultats d'audit au statut fournisseur automatiquement.

1. **Section "Audit & Conformité" dans chaque fiche fournisseur** (`SupplierFiles.tsx`)
   - Ajouter un onglet/section dans la vue détaillée fournisseur affichant : statut audit, score qualité, date dernier audit, historique des audits
   - Lire les données depuis la table `supplier_audits` filtrées par nom fournisseur

2. **Actions automatiques post-audit** (`SupplierAudits.tsx` + nouveau hook)
   - Quand un audit passe à "completed" : mettre à jour le statut fournisseur (Validé si score ≥ 70, À surveiller si 50-69, Refusé/Suspendu si < 50)
   - Générer une notification au pôle fournisseur
   - Enregistrer dans un historique traçable

3. **Migration DB** : Ajouter colonnes `audit_status`, `last_audit_date`, `quality_score` à une table `suppliers` (ou créer cette table si elle n'existe pas encore en DB)

---

### Phase 2 — Module Portefeuille par catégorie

**Objectif** : Organiser les fournisseurs validés en portefeuilles assignés.

4. **Nouvelle page "Portefeuilles"** (`/pole/supplier/portfolios`)
   - Vue par catégorie (Mode, Accessoires, Maison, Hygiène, etc.)
   - Chaque portefeuille affiche : 1 responsable principal + 1 backup, liste fournisseurs validés, score moyen, alertes
   - Règle : seuls les fournisseurs validés apparaissent

5. **Dashboard employé fournisseur** (vue individuelle dans portefeuille)
   - Nombre fournisseurs gérés, score moyen portefeuille, alertes actives, audits à venir

6. **Vue Manager** (onglet dans SupplierDashboard)
   - Répartition charge par employé, détection surcharge, suggestions de rééquilibrage

7. **Migration DB** : Tables `supplier_portfolios` (category, responsible_id, backup_id) et `portfolio_assignments` (supplier_id, portfolio_id)

---

### Phase 3 — Assignation intelligente

**Objectif** : Après validation audit, suggérer automatiquement un employé pour le portefeuille.

8. **Logique d'assignation** (nouveau composant `AssignmentSuggestion`)
   - Détection catégorie du fournisseur
   - Calcul score candidat basé sur : charge actuelle, spécialisation catégorie, performance
   - Interface : suggestion avec