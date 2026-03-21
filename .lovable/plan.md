

## Plan: Transmission des produits validés vers le pôle Tech

### Contexte

Les produits validés par le pôle Supplier (`ValidatedProducts.tsx`) n'ont actuellement aucun mécanisme de transmission vers le pôle Tech. Le catalogue Tech (`Catalog.tsx`) contient uniquement des services techniques, sans section pour les produits reçus des fournisseurs.

### Ce qui sera construit

**1. Ajout d'un bouton "Transmettre au Tech" sur chaque produit validé** (`ValidatedProducts.tsx`)
- Ajout d'un champ `techStatus` sur chaque produit (état local) : `not_sent` | `sent` | `confirmed`
- Nouveau bouton "Transmettre au Tech" dans le dropdown actions (icône `Send`)
- Badge visuel indiquant le statut de transmission (Non transmis / Transmis / Confirmé)
- Action en masse "Transmettre la sélection" via un bouton global pour envoyer un batch
- Toast de confirmation à chaque transmission
- KPI supplémentaire : nombre de produits transmis au Tech

**2. Nouvelle page "Produits reçus" côté Tech** (`src/pages/modules/tech/ReceivedProducts.tsx`)
- Table dédiée listant les produits transmis par le pôle Supplier
- Colonnes : Nom, SKU, Fournisseur, Catégorie, Prix unitaire, MOQ, Transmis le, Transmis par, Statut (En attente / Intégré / Rejeté)
- Boutons d'action : "Intégrer au catalogue", "Rejeter", "Demander info"
- Filtres : statut d'intégration, catégorie, fournisseur
- KPIs : total reçus, en attente, intégrés, rejetés
- Données mock réalistes correspondant aux produits validés du Supplier

**3. Route et navigation** (`App.tsx`)
- Ajout de la route `/modules/tech/received-products` pointant vers `ReceivedProducts`

### Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/pages/modules/supplier/ValidatedProducts.tsx` | Éditer — ajout techStatus, bouton Transmettre, badge, KPI |
| `src/pages/modules/tech/ReceivedProducts.tsx` | Créer — page de réception avec table, actions, KPIs |
| `src/App.tsx` | Éditer — ajout import + route |

### Détails techniques

- Le flux utilise l'état local (mock) conformément à l'architecture existante — pas de base de données pour l'instant
- Les données mock de `ReceivedProducts` reprennent les mêmes produits que `ValidatedProducts` pour simuler la cohérence du flux
- Les actions "Intégrer" et "Rejeter" côté Tech mettent à jour l'état local et affichent un toast
- Pattern identique aux actions Gateway (Approuver/Rejeter) déjà implémentées

