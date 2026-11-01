# BIB — Audit global de cohérence migrations / base (1 novembre 2026)

## Environnements inspectés
- Lovable « B.I.B intranet » — base PostgreSQL Supabase liée au projet.
- Lovable « B.I.B Platform » — base PostgreSQL Supabase distincte.
- Dépôts GitHub `Txss-17/bib_intranet` et `Txss-17/bib_platform`, branche `main`.
- Requêtes de diagnostic **SELECT uniquement**. Aucune DDL ou modification métier appliquée aux bases inspectées.

## Constat : Intranet
- `drizzle.__drizzle_migrations` : **82 entrées**.
- `drizzle/migrations/meta/_journal.json` : **82 entrées**.
- Les `created_at` du journal Drizzle et ceux de la base correspondent tous (aucun horodatage manquant ou supplémentaire).
- Le journal Supabase `supabase_migrations.schema_migrations` a **23 entrées** ; cette différence n'est pas, à elle seule, une anomalie, car il s'agit d'un autre mécanisme de migrations.
- **176 tables publiques**, toutes avec RLS activée ; **244 fonctions** ; **1 014 politiques RLS** ; **269 déclencheurs utilisateur** sur 99 tables ; **177 modules Intranet** distincts.
- Les tables Finance `cashflows`, `finance_invoice_register`, leurs déclencheurs de protection et les fonctions d'autorisation/onboarding contrôlées sont présents.
- Le catalogue `intranet_business_tables` contient 129 noms de tables, dont 36 absents physiquement. Ces références peuvent relever d'anciens modèles, de modules non matérialisés ou de migrations retirées. **Ne pas créer automatiquement les 36 tables.**
- 7 tables publiques avec RLS n'ont pas de politique explicite : `intranet_document_events`, `intranet_document_jobs`, `intranet_email_dispatch`, `intranet_ethics_events`, `intranet_legacy_access_repairs`, `intranet_outbox_events`, `intranet_share_requests`. Cette configuration est normalement restrictive pour les utilisateurs ordinaires ; vérifier que les processus serveur disposent des accès voulus.
- `0081_sync_pending_migrations.sql` contient uniquement un commentaire de schéma. Son enregistrement ne signifie pas qu'il a réparé des objets métier.

## Constat : Platform ↔ Intranet
- `platform_sync_runs` : 13 exécutions examinées.
- Les **3 dernières opérations pull (24 et 27 octobre 2026)** ont échoué avec : `Could not find the table 'public.customer_product_favorites' in the schema cache`.
- Base Platform : `customer_product_favorites` **absente**, `customer_boutique_favorites` **absente**, ainsi que `stock_restock_requests` et `sav_escalation_events` au moment du contrôle.
- La migration Platform `0021_platform_customer_favorites.sql` existe dans le dépôt, mais les objets attendus ne sont pas présents.
- Platform `drizzle.__drizzle_migrations` : 15 entrées ; journal GitHub : 24 entrées. Le rapprochement des horodatages trouve 10 tags absents, dont `0015` à `0023` et `0006` dont l'horodatage diffère légèrement. Vérifier le cas `0006` sans déduire qu'il manque à partir de la seule date.
- Certaines anciennes erreurs de push mentionnent une valeur `active` refusée pour le statut boutique (`draft|published`). Après réparation des tables export, tester aussi ce contrat.
- **Aucune opération financière n'est présente dans `cashflows` Intranet au moment de la lecture ; ceci ne suffit pas à conclure à une panne Stripe indépendante.**

## Corrections livrées dans les dépôts
- `ops/release/intranet-migration-audit.sql` : bilan non destructif et références du catalogue.
- `ops/release/intranet-preflight.sql` : vérifie également les deux registres Finance, leurs garde-fous et la RPC onboarding.
- `tests/intranet/migration-preflight-regression.test.mjs` : tests statiques du journal et des garde-fous.
- Platform : `ops/release/platform-export-schema-preflight.sql` : échoue volontairement si une table requise par l'export est absente.
- Platform : `tests/bridge/export-preflight.test.ts` : lien entre les tables référencées par l'export et le précontrôle.

## Procédure de réparation recommandée
1. Sur une **base Platform de préproduction** dérivée d'un schéma cohérent, comparer les migrations `0015` à `0023` et vérifier l'état réel de `0006`. Ne pas insérer manuellement de lignes dans `drizzle.__drizzle_migrations`.
2. Appliquer uniquement les migrations réellement manquantes, **dans l'ordre**, après revue des dépendances, sauvegarde et contrôle de l'impact sur les données existantes.
3. Exécuter `ops/release/platform-export-schema-preflight.sql`. Aucune erreur ne doit subsister.
4. Tester l'export des favoris, produits, abonnements, paiements, commandes, remboursements et dossiers SAV, puis l'import Intranet et les replays idempotents.
5. Exécuter `ops/release/intranet-preflight.sql` et `ops/release/intranet-migration-audit.sql` en préproduction. Confirmer les permissions par rôle, les permissions documentaires et les parcours RH.
6. Vérifier `npm run test:intranet`, le typecheck, le build Intranet et les tests bridge Platform. Conserver les résultats et journaux d'exécution.
7. Une fois la préproduction validée, planifier les déploiements et confirmer les premières synchronisations complètes en production.

**Limite de cet audit :** présence des objets et registres vérifiée ; pas de migration rejouée, pas de test transactionnel avec des données modifiées, pas de certification de la publication.
