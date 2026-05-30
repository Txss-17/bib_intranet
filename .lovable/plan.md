# Portail Candidatures Fournisseurs — Intégration BOS → Connect

## Objectif

Remplacer la réception par mail des candidatures (fournisseurs, fabricants, logisticiens) venant de la plateforme b.i.b (BOS) par un **système intégré au pôle Fournisseur de Connect** : ingestion automatique, calcul de score pondéré, attribution automatique à un gestionnaire, workflow de validation, dashboard et historique.

---

## 1. Flux global

```text
[BOS form submit] 
   → Edge function publique `supplier-application-intake`
   → INSERT supplier_applications (score calculé, priorité)
   → Auto-assignation gestionnaire (algorithme existant)
   → Notification gestionnaire
   → Dashboard pôle Fournisseur → Validation / Refus / Revue
   → Historique conservé (application_events)
```

---

## 2. Base de données (migration)

### `supplier_applications`
Champs clés : `id`, `type` (supplier/manufacturer/logistics), `company_name`, `contact_name`, `contact_email`, `contact_phone`, `country`, `category`, `lead_time_days`, `moq`, `audit_accepted` (bool), `certifications` (jsonb), `documents` (jsonb urls), `raw_payload` (jsonb), `score` (int), `priority` (high/standard/low), `status` (new/assigned/in_review/approved/rejected/on_hold), `blocking_criteria` (text[]), `assigned_to_id` (uuid), `assigned_to_name`, `assigned_at`, `decision_notes`, `decision_by`, `decision_at`, `source` (default 'bos_form'), `created_at`, `updated_at`.

Rejet automatique si `audit_accepted = false`.

### `supplier_application_events` (historique)
`id`, `application_id`, `event_type` (created/scored/assigned/status_changed/commented/decided), `from_status`, `to_status`, `notes`, `performed_by`, `metadata` jsonb, `created_at`.

### RLS
- SELECT : authenticated (toute la team Fournisseur voit).
- INSERT : `service_role` uniquement (edge function) + authenticated pour création manuelle.
- UPDATE : `admin`/`manager` OU `supplier_manager` via has_role + position check.
- Events : INSERT authenticated, SELECT authenticated.

### GRANTs explicites pour les deux tables.

---

## 3. Scoring (server-side, dans l'edge function et fonction SQL)

Barème simple, pondéré :

| Critère | Règle | Points |
|---|---|---|
| Lead time UE | <5j / 5–10j / >10j | +20 / +10 / 0 |
| MOQ | <50 / 50–200 / >200 | +15 / +10 / +2 |
| Audit accepté | oui/non | +20 / **rejet auto** |
| Certifications | par cert valide | +5 (cap +15) |
| Origine FR/UE | FR / UE / autre | +10 / +5 / 0 |

**Priorité dérivée** :
- `high` : score ≥ 55 ET FR/UE ET audit ok
- `standard` : score ≥ 30
- `low` : sinon

---

## 4. Edge function `supplier-application-intake`

- Publique (verify_jwt=false), CORS ouvert.
- Auth simple via header `x-linksy-key` = `LINKSY_API_SECRET_KEY`.
- Zod validation du payload.
- Calcule score + priorité.
- Si `audit_accepted=false` → insert avec status=`rejected`, blocking_criteria=['audit_refused'].
- Sinon → status=`new`, puis appelle l'algo d'auto-assignation (réutilise la logique de `AssignmentSuggestion`) → assigne au meilleur candidat dispo et passe status=`assigned`.
- Crée notification + event historique.
- Renvoie `{ id, score, priority, status, assigned_to }`.

---

## 5. UI Connect — Pôle Fournisseur

### Nouvelle sous-page : `supplier.applications` → `/modules/supplier/applications`

**Liste** (table) :
- Colonnes : Société, Type, Pays, Catégorie, Score (badge couleur), Priorité (🔥🟡⚪), Statut, Gestionnaire, Reçue le, Action.
- Filtres : statut, priorité, type, gestionnaire, date, score min.
- Recherche temps réel (titre, email, société).
- Export CSV/PDF (ExportButtons existant).

### Fiche candidature : `/modules/supplier/applications/:id`
Onglets :
1. **Vue d'ensemble** — score décomposé, critères bloquants, priorité, contact, payload brut formaté.
2. **Documents** — liens vers certifs/fichiers uploadés.
3. **Décision** — boutons Approuver / Refuser / Mettre en revue / Réassigner, commentaire requis. Création d'un fournisseur (suppliers) si approuvé.
4. **Historique** — timeline `supplier_application_events`.

### Dashboard widget
Sur `SupplierDashboard` : compteur "Nouvelles candidatures" + "À traiter" (status in new/assigned/in_review).

---

## 6. RBAC

- `supplier.applications` ajouté dans `positionAccess.ts` pour `supplier_manager` et `ceo`.
- Actions de décision : guard `isAdmin || isManager || position==='supplier_manager'`.
- Wrapping `<ProtectedScreen screenId="supplier.applications">`.

---

## 7. Hook `useSupplierApplications`

- `useSupplierApplications(filters)` — liste avec react-query.
- `useSupplierApplication(id)` — détail + events.
- `useUpdateApplicationStatus()` — change statut + crée event.
- `useReassignApplication()` — change gestionnaire + event.
- `useApproveApplication()` — crée ligne dans `suppliers` puis status=approved.

---

## 8. Navigation

- `moduleNavigations.ts` : ajouter "Candidatures" sous le pôle Fournisseur (entre Inbox catalogues et Fiche fournisseur).
- Route dans `App.tsx`.

---

## 9. Hors-scope (volontaire — KISS)

- Pas d'IA / scoring prédictif.
- Pas d'intégration mail entrante (uniquement webhook signé).
- Réassignation manuelle = MVP (pas de rebalance auto).

---

## Fichiers créés

- `supabase/migrations/<ts>_supplier_applications.sql`
- `supabase/functions/supplier-application-intake/index.ts`
- `src/hooks/useSupplierApplications.ts`
- `src/pages/modules/supplier/SupplierApplications.tsx`
- `src/pages/modules/supplier/SupplierApplicationDetail.tsx`

## Fichiers modifiés

- `src/App.tsx` (routes)
- `src/data/moduleNavigations.ts` (nav)
- `src/data/positionAccess.ts` (RBAC)
- `src/pages/modules/supplier/SupplierDashboard.tsx` (widget)
