
# Plan : Corriger la navigation horizontale pour tous les modules

## Probleme identifie

La navigation horizontale (OX) ne s'affiche pas pour les modules **Ops**, **Finance**, **Direction**, **Supplier**, **Lifecycle** car :

1. Les routes sont definies de maniere statique dans `App.tsx` (ex: `/pole/ops`, `/pole/finance`)
2. Le `MainLayout` utilise `useParams()` pour extraire le `poleId`
3. Comme ces routes ne contiennent pas le parametre dynamique `:poleId`, `useParams()` retourne `undefined`
4. Le `ModuleNavigation` recoit `poleId={undefined}` et n'affiche rien

## Solution

Modifier `MainLayout.tsx` pour extraire le `poleId` directement depuis `location.pathname` au lieu de se fier a `useParams()`.

## Changements a effectuer

### 1. Modifier `src/components/layout/MainLayout.tsx`

Remplacer l'extraction du `poleId` via `useParams()` par une extraction depuis le pathname :

```typescript
// Avant (ne fonctionne pas pour les routes statiques)
const { poleId, subSection } = useParams<{ poleId?: string; subSection?: string }>();

// Apres (fonctionne pour toutes les routes /pole/xxx)
const poleIdMatch = location.pathname.match(/^\/pole\/([^/]+)/);
const extractedPoleId = poleIdMatch?.[1] as PoleId | undefined;
```

Ensuite, utiliser `extractedPoleId` a la place de `poleId` pour :
- Passer au composant `TopBar` via `activePoleId`
- Passer au composant `ModuleNavigation` via `poleId`

### 2. Verification

Apres ce changement, tous les modules auront la navigation horizontale :
- `/pole/ops` -> Navigation: Dashboard, Commandes, Expeditions, Incidents, Partenaires
- `/pole/finance` -> Navigation: Dashboard, Cashflow, Transactions, etc.
- `/pole/direction` -> Navigation: Vue globale, KPI strategiques, etc.
- `/pole/supplier` -> Navigation: Vue globale, Produits en attente, etc.
- `/pole/lifecycle` -> Navigation: Vue globale, Onboarding, Suivi activite, etc.

---

## Details techniques

Le fichier `MainLayout.tsx` sera modifie comme suit :

```text
Ligne 13: Supprimer useParams ou ne garder que subSection si necessaire
Lignes 23-32: Ajouter l'extraction du poleId depuis le pathname
Ligne 42: Utiliser extractedPoleId au lieu de poleId
Ligne 46: Utiliser extractedPoleId au lieu de poleId
```

Aucun autre fichier n'a besoin d'etre modifie. La configuration de navigation dans `moduleNavigations.ts` est deja correcte pour tous les modules.
