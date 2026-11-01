# BIB Intranet — réconciliation des migrations et du bridge (2026-11-01)

## Portée
Audit **en lecture seule** des deux bases Lovable/Supabase B.I.B Intranet et B.I.B Platform. Aucun déploiement, migration ni modification de données de production effectués. Ne pas confondre état des sources GitHub et état effectif des bases.

## Résultat Intranet
- 176 tables physiques publiques, toutes avec RLS activée, 244 fonctions publiques, 269 déclencheurs métier (hors internes), 1 014 politiques sur 169 tables et 177 modules enregistrés.
- Le catalogue `intranet_business_tables` référence 129 noms, dont **36 sans table physique actuelle**. Le code de `0042_intranet_business_boundaries.sql` ignore intentionnellement les tables absentes lorsqu'il crée les politiques/déclencheurs ; ces entrées ne prouvent donc ni une migration échouée ni une panne de chaque pôle. Ne pas créer de tables fictives ni supprimer leurs références sans examen du modèle métier.
- Sept tables ont RLS activée sans politique explicite : `intranet_document_events`, `intranet_document_jobs`, `intranet_email_dispatch`, `intranet_ethics_events`, `intranet_legacy_access_repairs`, `intranet_outbox_events`, `intranet_share_requests`. Elles sont fermées par défaut aux rôles clients ; valider les accès de leurs fonctions SECURITY DEFINER plutôt que leur ouvrir une politique générale.
- Les dépendances principales (RH onboarding, documents, SAV, modules, commandes, finance) et les gardes des migrations Finance 0078/0079 sont présentes. Les 0 écritures de `cashflows` et 0 factures dans `finance_invoice_register` ne constituent pas une preuve de bon fonctionnement.
- Journal `supabase_migrations.schema_migrations` : 23 versions, dernière `20260906042608`. Journal Drizzle du dépôt : 82 entrées jusqu'à `0081_sync_pending_migrations`. Ce sont **deux mécanismes de suivi distincts** ; le journal Drizzle décrit les fichiers à exécuter, pas leur application. La migration 0081 contient uniquement un COMMENT sur le schéma et n'enregistre pas rétroactivement les changements appliqués.
- Le suivi des modifications réellement appliquées doit être reconstruit à partir des objets, des vérifications de colonnes/contraintes/politiques et, si disponible, du registre de déploiement ou journal du runner. **Ne pas ajouter artificiellement toutes les versions Drizzle dans `supabase_migrations.schema_migrations`.**

## Incident bloquant Platform → Intranet
Trois derniers `platform_sync_runs` connus (24/27 octobre 2026) : `error`, `items_count=0`, message `Could not find the table 'public.customer_product_favorites' in the schema cache`. Dernière exécution marquée réussie observée : 12 octobre 2026.
Lecture de la base B.I.B Platform :
| Dépendance nécessaire à `intranet-export` | Présence |
| --- | --- |
| `customer_product_favorites` | NON |
| `customer_boutique_favorites` | NON |
| `product_customization_dossiers` | NON |
| `stock_restock_requests` | NON |
| `sav_escalation_events` | NON |
| `order_refunds`, `partner_onboarding_submissions`, `orders`, `subscriptions`, `payments`, `products`, `boutiques` | OUI |

Les migrations correspondantes existent déjà dans le dépôt Platform (`0015` dossiers de personnalisation, `0017` réassort, `0021` favoris, `0024` SAV). La synchronisation ne doit **pas** contourner les erreurs en interprétant une table manquante comme une liste vide : les favoris sont exportés par snapshot complet et un faux vide supprimerait les favoris de la cible.

## Action réalisée sur les sources
Renforcement de `ops/release/intranet-preflight.sql` : test de présence des registres Finance, fonctions de protection, activation des déclencheurs, autorisation RH et RLS. La barrière `ops/release/platform-preflight.sql` existante vérifie déjà les cinq tables Platform absentes. Aucune migration de production déclenchée.

## Remédiation ordonnée
1. Obtenir une **base de préproduction isolée** (Platform et Intranet), sauvegarder les schémas et relever les identifiants de déploiement.
2. Déterminer pourquoi les migrations Platform `0015`, `0017`, `0021`, `0024` ne sont pas appliquées : état des dépendances, conflits de schéma, permissions et journal du runner. Corriger d'abord Platform sur la préproduction, sans rejouer toutes les migrations.
3. Exécuter `ops/release/platform-preflight.sql` et `ops/release/intranet-preflight.sql` en lecture seule. Rechercher les divergences au niveau des tables, colonnes, RPC, politiques et triggers ; résoudre seulement les incompatibilités démontrées.
4. Tester `intranet-export` puis `platform-bridge pull` en préproduction, avec un favori, un remboursement partiel réussi, un retour de statut et une répétition idempotente. Vérifier `platform_sync_runs.status='success'` et les comptes sans fuite de données.
5. Tester RH, Finance (saisie manuelle et factures) et les 14 pôles avec utilisateurs autorisés, refus d'accès, conflits et cas de test.
6. Après sauvegarde et autorisation de déploiement, appliquer les **différences validées** à la production. Vérifier schéma, app publiée, webhooks, secrets, RLS, logs et reprise de synchronisation. Actualiser les journaux *de leur runner respectif* ; ne pas inventer des versions appliquées.

**Décision de livraison : BLOQUÉE**, tant que les cinq dépendances Platform ne sont pas présentes et qu'aucun `pull` complet récent n'est prouvé.
