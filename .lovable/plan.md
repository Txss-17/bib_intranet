# Portail Fournisseur Bidirectionnel — BOS ↔ Connect

Extension du portail candidatures (déjà livré côté Connect) pour couvrir tout le cycle de vie fournisseur, avec visibilité côté BOS (portail fournisseur) et actions côté Connect (pôle Fournisseur).

---

## 1. Statut candidature visible côté fournisseur

**But** : le candidat voit l'avancement de sa candidature en temps réel sur b.i.b platform.

- **Côté Connect** : statuts déjà gérés (`new → assigned → in_review → approved/rejected/on_hold`), événements dans `supplier_application_events`.
- **Nouveau** : Edge function publique `supplier-application-status` (GET, signée par `application_id + email` ou token) qui retourne `{ status, priority, last_event, public_timeline }`.
- **Timeline publique** : on filtre `supplier_application_events` (event_type, to_status, notes, created_at) — on n'expose JAMAIS les `decision_notes` internes ni le scoring détaillé.
- Champ ajouté `supplier_applications.public_token` (uuid, généré à l'insert) utilisé par BOS pour interroger sans auth.

---

## 2. Ordres de restock (MOQ par destination)

**But** : pour un fournisseur **validé** (lié à `suppliers`), le pôle envoie via le portail fournisseur des ordres : "produit X, MOQ Y, destination = partenaire logistique Z ou entrepôt W".

### Table `supplier_restock_orders`
- `id`, `supplier_id` (fk suppliers), `catalog_id` (fk product_catalog), `product_name` (snapshot)
- `quantity` (= MOQ demandé), `destination_type` ('warehouse' | 'logistics_partner'), `destination_id` (uuid), `destination_name`
- `customization_notes` (text, nullable — produits à personnaliser)
- `status` ('draft' | 'sent' | 'acknowledged' | 'in_production' | 'shipped' | 'received' | 'cancelled')
- `priority` ('high'|'standard'|'low'), `due_date`, `sent_at`, `acknowledged_at`, `received_at`
- `created_by`, `created_at`, `updated_at`
- RLS : SELECT/UPDATE authenticated avec rôle admin/manager ; lecture publique par supplier via edge function signée.

### UI Connect
- Sous-page `/pole/supplier/restock-orders` : table + filtres (fournisseur, statut, destination), création via dialog (catalog picker + destination picker = warehouses ou logistics_partners).
- Action "Envoyer" → status `sent` + event log + notification (futur : email).

### Côté BOS (lecture seule pour le fournisseur)
- Edge function `supplier-portal-orders` retourne la liste des ordres pour `supplier_id` (auth via token portail fournisseur).

---

## 3. Notifications audit programmé

**But** : quand le pôle Audit planifie un audit fournisseur, le fournisseur est notifié sur son portail.

- Table `field_audits` existe déjà (target_type='supplier', scheduled_date, status).
- Ajouter : trigger ou hook applicatif → quand `field_audits` insert avec `target_type='supplier'` et `status='scheduled'`, créer une entrée dans nouvelle table `supplier_portal_notifications`.

### Table `supplier_portal_notifications`
- `id`, `supplier_id`, `type` ('audit_scheduled' | 'restock_order' | 'catalog_review' | 'application_update' | 'generic')
- `title`, `body`, `reference_table`, `reference_id`, `read_at`, `created_at`
- Pas d'écriture côté fournisseur — uniquement READ via edge function du portail.
- RLS Connect : SELECT authenticated, INSERT authenticated (admins/managers Audit + Fournisseur), pas d'UPDATE/DELETE.

---

## 4. Réception nouveaux catalogues uploadés par le fournisseur

**But** : le fournisseur upload un nouveau catalogue depuis BOS → arrive dans une inbox côté pôle Fournisseur.

### Table `supplier_catalog_uploads`
- `id`, `supplier_id`, `submitted_by_email`, `file_name`, `file_url` (storage `product-assets/catalogs/{supplier_id}/...`), `file_size`, `mime_type`
- `version` (text), `notes` (text)
- `status` ('pending' | 'reviewing' | 'approved' | 'rejected'), `review_notes`, `reviewed_by`, `reviewed_at`
- `created_at`, `updated_at`
- RLS : SELECT/UPDATE authenticated (admin/manager), INSERT via edge function service_role.

### Edge function `supplier-catalog-upload` (publique, signée `x-linksy-key`)
- Reçoit `{ supplier_id, file_base64, file_name, mime_type, version, notes }`.
- Upload vers bucket `product-assets/catalogs/{supplier_id}/{uuid}-{filename}`.
- Insert ligne `pending` + notification au gestionnaire du fournisseur + event audit_log.

### UI Connect
- Sous-page `/pole/supplier/catalog-inbox` : table des uploads pending/reviewing avec preview du fichier + actions Approuver/Refuser (commentaire requis).
- Hook React Query `useSupplierCatalogUploads`.

---

## 5. Navigation & RBAC

Nouvelles entrées dans `moduleNavigations.ts` (pôle Supplier) :
- "Ordres de restock" → `supplier.restock_orders`
- "Inbox catalogues" → `supplier.catalog_inbox`

`positionAccess.ts` : ajout des screens pour `supplier_manager` + `ceo`.

`App.tsx` : 4 nouvelles routes (restock list, restock detail futur, catalog inbox, application detail déjà fait).

---

## 6. Hors-scope (KISS)

- Pas d'authentification fournisseur côté BOS dans ce sprint (on génère/réutilise des tokens signés ; auth complète = sprint séparé).
- Pas d'envoi email automatique pour restock/audit (notif in-app + champ pour futur trigger).
- Pas de versionning fin sur les catalogues (un upload = une ligne).
- Pas de regénération auto des MOQ depuis `replenishment_suggestions` (le manager choisit manuellement, MVP).

---

## 7. Fichiers

**Migration unique** `supabase/migrations/<ts>_supplier_portal_bidirectional.sql` :
- ALTER `supplier_applications` ADD `public_token uuid DEFAULT gen_random_uuid()`.
- CREATE `supplier_restock_orders`, `supplier_portal_notifications`, `supplier_catalog_uploads` (+ GRANTs + RLS + triggers updated_at).

**Edge functions** :
- `supabase/functions/supplier-application-status/index.ts` (GET public token-based)
- `supabase/functions/supplier-portal-orders/index.ts` (GET supplier_id + token)
- `supabase/functions/supplier-catalog-upload/index.ts` (POST signé)

**Hooks** :
- `src/hooks/useSupplierRestockOrders.ts`
- `src/hooks/useSupplierCatalogUploads.ts`
- `src/hooks/useSupplierPortalNotifications.ts`

**Pages** :
- `src/pages/modules/supplier/SupplierRestockOrders.tsx`
- `src/pages/modules/supplier/SupplierCatalogInbox.tsx`

**Edits** : `App.tsx`, `moduleNavigations.ts`, `positionAccess.ts`, `SupplierApplications.tsx` (badge "lien public"), `SupplierDashboard.tsx` (widgets restock + catalog inbox).
