

# Plan: Interactions dynamiques sur tous les dashboards

## Objectif
Ajouter recherche en temps réel, filtres par statut/type, et tri par colonnes cliquables sur tous les tableaux des 6 dashboards enrichis.

## Approche technique

Creer un hook reutilisable `useTableInteractions` qui gere search, sort, et filters pour eviter la duplication dans chaque dashboard.

### Hook `src/hooks/useTableInteractions.ts`
- `searchQuery` + `setSearchQuery` : filtre texte sur champs configurables
- `sortColumn` + `sortDirection` : tri asc/desc par clic sur header
- `filters` : objet cle/valeur pour filtres select
- Fonction `processData(data)` qui applique search → filter → sort et retourne les donnees traitees

### Composant `src/components/ui/sortable-table-head.tsx`
- TableHead cliquable avec icone fleche (ChevronUp/ChevronDown/ChevronsUpDown)
- Indication visuelle de la colonne triee

### Dashboards a modifier (6 fichiers)

**1. Supplier Dashboard** (`SupplierDashboard.tsx`)
- Tableau "Commandes en Cours" : recherche par ID/fournisseur, tri par date/montant/articles, filtre par statut (production/shipped/delivered/quality_check)
- Tableau "Top Fournisseurs" : tri par rating/CA/commandes

**2. Executive Dashboard** (`ExecutiveDashboard.tsx`)
- Tableau "Alertes critiques" : filtre par severite (critical/high), filtre par pole
- Section "Rapports Commissaire" : filtre par type

**3. Finance Dashboard** (`FinanceDashboard.tsx`)
- Tableau "Factures & Salaires" : recherche par ID, tri par montant/echeance, filtre par type (Facture/Salaire/Fournisseur) et statut (pending/validated/overdue)

**4. Ops Dashboard** (`OpsDashboard.tsx`)
- Tableau "Commandes en Attente" : recherche par ID/client, tri par date/montant, filtre par statut
- Tableau "Support Clients" : recherche, filtre par statut (open/in_progress/resolved)

**5. Risk Dashboard** (`RiskDashboard.tsx`)
- 3 tableaux incidents (Supplier/Client/Internal) : recherche par ID/issue, tri par severite, filtre par statut (investigating/mitigating/resolved/monitoring/escalated)

**6. RSE Dashboard** (`RSEDashboard.tsx`)
- Tableau certifications : filtre par statut (active/renewal/pending)
- Tableau projets ONGs : filtre par statut (active/planning)

### Implementation par dashboard
Pour chaque tableau :
1. Ajouter barre de recherche `Input` avec icone `Search`
2. Ajouter `Select` filtres pertinents (statut, type, severite)
3. Rendre les `TableHead` cliquables avec indicateur de tri
4. Utiliser le hook `useTableInteractions` pour gerer l'etat

### PendingProducts
Deja complet avec filtres, recherche et pagination — aucune modification requise.

## Ordre d'execution
1. Creer `useTableInteractions` hook + `SortableTableHead` composant
2. Modifier les 6 dashboards en parallele

