

# Plan: Enrichir les dashboards et modules selon les maquettes de référence

## Analyse des écarts

Comparaison entre l'existant et les 8 maquettes fournies. Voici les fonctionnalités manquantes par module.

### 1. Direction (Executive Dashboard)
**Existant**: KPIs basiques, alertes, performance pôles, décisions.
**Manquant par rapport à la maquette**:
- Section "Performance Générale" avec évolution CA & EBITDA (LineChart)
- Section "Résultats Commerciaux" (ventes par marché, graphiques)
- Section "Activités Stratégiques" (IA Produit, initiatives)
- Section "Opportunités & Risques"
- Section "Rapports & Suivi Commissaire" avec alertes remontées
- KPIs reformulés: Revenu Annuel (2,85 M€), Croissance (+18%), EBITDA (450 K€), Rétention Clients (86%)
- Segmentation National/Global/EU&US

### 2. Finance Dashboard
**Existant**: KPIs Solde/BurnRate/Runway/MRR, graphique cashflow, alertes, transactions récentes.
**Manquant**:
- Section "Trésorerie" avec graphique Solde de trésorerie (3 mois) plus détaillé
- Section "Entrées du Mois" avec PieChart (Abonnements, Ventes Produits, Traditionnels)
- Section "Objectifs de financement" (Levée Série A, Fonds Garantie Fournisseurs avec Progress bars)
- Section "Factures & Salaires" avec tableau ID/Type/Pôle/Montant/Échéance/Statut
- Section "Budget & Primes" (Budget Mensuel, Surplus, Prime Teams)
- KPIs reformulés: Solde Actuel, Entrées, Sorties, Budget Mensuel

### 3. Ops Dashboard
**Existant**: KPIs commandes/expéditions/taux livraison/incidents, charts, quick access.
**Manquant**:
- Section "Commandes en Attente" avec tableau (ID, Client, Date, Montant)
- Section "Livraison & Tracking" avec carte visuelle et suivi colis
- Section "Support Clients" avec Demandes Ouvertes + Satisfaction Client (donut)
- Section "Productivité Warehouse" (85K Produits Expédiés)
- Section "Performances Ops" (Satisfaction, Retour Produit, Pedisize, Tickets Résolus)
- Section "Support Clients" tableau en bas (ID, Pôle, Montant, Échéance, Statut)
- KPIs reformulés: Commandes en Attente, En Cours de Livraison, Taux Intervention, Stock Utilisable

### 4. RSE Dashboard
**Existant**: KPIs CO2/packaging/recyclage/points, charts CO2 évolution + répartition, objectifs.
**Manquant**:
- Section "Impact Environnemental" avec score ESG circulaire (82) + barres détaillées (Taux Recyclage, Empreinte CO₂, Énergie Renouvelable)
- Section "Engagement Social" (Projets ONGs avec liste détaillée)
- Section "Initiative & Certifications" (Amfori BSCI, Global Recycled Standard, Norme ISO 14001)
- Section "Témoignages Client" (PoissonVert, GreenCampaign, TerroirBio avec scores)
- Section "Emballages Recyclés" avec barres horizontales détaillées
- Section "Jaincités & ESC" (Recyclage, Combien CO2/1K, Points Fidélité Final)
- Section "RSE Rapport" (Recyclage 321KT, Gens impactés, Budget Annuel)
- KPIs reformulés: Score ESG (82), Taux Recyclage (76%), Points Fidélité (880K), Local Inclusive (4 Projets ONGs)

### 5. Risk & Incidents Dashboard
**Existant**: KPIs incidents/risques/score/temps résolution, charts bar+radar+line, incidents récents.
**Manquant**:
- Bannière colorée en haut: Critical P1 Cases (rouge), Open Incidents (orange), Escalations (gris-bleu)
- Section "Incident Overview" PieChart (P1/P2/P3/P4 avec pourcentages)
- Section "Incident Timeline" LineChart multi-séries (P1-P4 sur mois)
- Tableaux séparés: "Supplier Incidents", "Client Incidents", "Internal Incidents" avec colonnes ID/Issue/Severity/Status/Action
- Boutons d'action par incident: Details, Assign, Escalate, Resolved
- Badge sévérité P1/P2/P3 colorés

### 6. Fournisseurs Dashboard (actuellement générique PoleDashboard)
**Existant**: Dashboard générique sans contenu spécifique.
**Manquant** (tout à créer):
- KPIs: Nb Fournisseurs (31), Commandes en Cours (14), Stock Réservé (120K), Incidents Signalés (2)
- Section "Top Fournisseurs" avec liste (nom, drapeau pays, rating étoiles, CA, commandes)
- Section "Stock Réservé & Dispo" (barres horizontales)
- Section "Stock par Catégorie" (PieChart: Mode, Accessoires, Maison)
- Section "Commandes en Cours" tableau (ID, Fournisseur, Articles, Status, Date, Montant)
- Section "Incidents & Litiges" (liste avec badges)
- Section "Métriques Logistiques" (MOQ Moyenne, Qualité Fournisseurs, Montant Moyen)

### 7. Supplier Product Review Board (PendingProducts amélioré)
**Existant**: Liste simple avec filtres et actions valider/refuser.
**Manquant**:
- Présentation tableau complet: ID Produit, Fournisseur, Catégorie, Prix Usine, MOQ, Délai Prod, Packaging, Marchés, Statut, Date Soumission
- Filtres avancés: Catégorie, Pays fournisseur, Score risque, Marché ciblé, Urgence
- Onglets "En attente" / "En revue" avec compteurs
- Pagination (1-10 de 56)
- Section "Projets Tech Actifs" en bas
- Section "Informations produits" 
- Section "Historique & traçabilité"

---

## Plan d'implémentation

### Etape 1: Supplier Dashboard (nouveau)
Créer `src/pages/modules/supplier/SupplierDashboard.tsx` avec KPIs, Top Fournisseurs, Stock, Commandes en cours, Incidents, Métriques. Mettre à jour la route `/pole/supplier` dans App.tsx.

### Etape 2: Direction Dashboard enrichi
Refactorer `ExecutiveDashboard.tsx` pour ajouter: Performance Générale (CA & EBITDA chart), Résultats Commerciaux, Activités Stratégiques, Opportunités & Risques, Rapports Commissaire. Reformuler les KPIs.

### Etape 3: Finance Dashboard enrichi
Ajouter à `FinanceDashboard.tsx`: Trésorerie détaillée, Entrées du Mois (PieChart), Objectifs de financement, Factures & Salaires tableau, Budget & Primes.

### Etape 4: Ops Dashboard enrichi
Ajouter à `OpsDashboard.tsx`: Commandes en Attente tableau, Livraison & Tracking, Support Clients (donut), Productivité Warehouse, Performances Ops.

### Etape 5: RSE Dashboard enrichi
Refactorer `RSEDashboard.tsx`: Score ESG circulaire, Engagement Social (ONGs), Certifications, Témoignages Client, Emballages Recyclés, RSE Rapport.

### Etape 6: Risk Dashboard enrichi
Refactorer `RiskDashboard.tsx`: Bannière P1/Open/Escalations, Incident Overview PieChart, Incident Timeline, tableaux Supplier/Client/Internal Incidents avec boutons d'action.

### Etape 7: PendingProducts enrichi
Refactorer `PendingProducts.tsx`: Tableau complet avec toutes les colonnes, filtres avancés, onglets, pagination, sections bas de page.

## Détails techniques

- Tous les dashboards utilisent des données mock enrichies (pas de nouvelles tables DB requises)
- Composants Recharts existants réutilisés (AreaChart, PieChart, BarChart, LineChart, RadarChart)
- Respect du design system existant (Card, Badge, Progress, Table)
- Style inspiré des maquettes: cards avec bordures subtiles, icônes bleues/vertes, badges de statut colorés
- Responsive grid layout (lg:grid-cols-3 pour les sections multi-colonnes)

