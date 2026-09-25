# Liaison Intranet ↔ B.I.B Platform + contrats rattachés aux boutiques

## Constat
- B.I.B Platform (marketplace) a **sa propre base**, séparée de l'intranet. Aucun lien n'existe aujourd'hui.
- Côté plateforme : `boutiques`, `supplier_products` (catalogue fournisseur), `products` (produits en boutique), `orders`, `payments`, `subscriptions`, `support_tickets`, `order_issues`.
- Côté intranet : `shops`, `products`, `suppliers`, `orders`, `support_tickets`… La page Contrats (Compliance) pointe vers une table `contracts` qui n'existe pas encore.
- Règle BIB respectée : la plateforme reste la source des boutiques/commandes ; l'intranet supervise, et publie uniquement ce qu'il valide (produits fournisseurs). Les infos internes fournisseurs (coûts, audits, notes) ne sont jamais envoyées.

## Flux prévus

```text
PLATEFORME  --(lecture)-->  INTRANET
  boutiques            -> shops (Boutiques & Marchands)
  orders / payments    -> orders (1 commande = 1 boutique)
  subscriptions        -> shops.subscription_plan
  support_tickets,
  order_issues         -> support_tickets

INTRANET  --(envoi)-->  PLATEFORME
  produit fournisseur validé -> supplier_products (catalogue)
  statut boutique (test/active/suspendue) -> boutiques.status
```

## Ce qui sera construit (intranet)
1. **Rattachement des données** : chaque boutique, produit, commande et ticket garde l'identifiant de son équivalent plateforme (pas de doublon, resynchronisation sûre).
2. **Journal de synchronisation** : chaque échange (date, sens, nb d'éléments, erreurs) est tracé et visible dans Tech → Intégrations, avec un bouton « Synchroniser maintenant ».
3. **Publication au catalogue** : bouton « Publier sur la plateforme » dans Fournisseurs → Produits validés (prix public, MOQ, marge max, visuel). Statut « Publié / À republier ».
4. **Contrats ↔ boutiques** : création de la table des contrats (numéro, type, boutique, fournisseur optionnel, dates, valeur, statut, document). 
   - Page Contrats : choix de la boutique, filtre par boutique.
   - Fiche boutique (Boutiques & Marchands) : onglet « Contrats », statut contractuel mis à jour automatiquement.
   - Blocage : une boutique ne peut passer « Active » sans contrat signé.
5. **Droits** : lecture/écriture des contrats limitées à Direction, Admin, Compliance, Ops, Lifecycle ; synchronisation limitée à Tech/Admin.

## Côté B.I.B Platform (à faire dans ce projet-là)
Je ne peux pas modifier l'autre projet depuis ici. Je vous fournirai un message prêt à coller dans B.I.B Platform pour y créer deux points d'accès sécurisés : « export vers l'intranet » et « réception depuis l'intranet ».

## Détails techniques
- Migration : colonnes `platform_id` (+ `platform_synced_at`) sur shops, products, orders, support_tickets ; tables `platform_sync_runs` et `contracts` (shop_id FK, supplier_id FK nullable) avec GRANT + RLS via `has_any_pole`/`is_leadership` ; trigger bloquant `active` sans contrat `signed` ; trigger qui met à jour `shops.contract_status`.
- Edge Function intranet `platform-bridge` (actions `pull`, `push_product`, `push_shop_status`), appelant les fonctions plateforme `intranet-export` / `intranet-import` avec un secret partagé `BIB_PLATFORM_BRIDGE_SECRET` (à saisir des deux côtés) et l'URL de la plateforme.
- Upsert idempotent par `platform_id`; commandes rejetées si boutique inconnue.
- Hooks : `usePlatformSync.ts`, `useContracts.ts` réécrit ; UI : TechIntegrations, ValidatedProducts, Contracts, ContractForm, ShopsSupervision.
