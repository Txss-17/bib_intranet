# BIB — Portail de vérification préproduction, lecture seule

Ce processus garantit un **contrôle limité du schéma et des permissions essentielles** dans les deux **bases de préproduction**. Il n'effectue **aucune migration**, ne restaure aucun compte, ne déploie pas de fonctions, ne publie pas et ne déclenche pas de tâche planifiée.

## Préparer et exécuter

1. Créer deux bases **de préproduction isolées**, avec un jeu de données anonymisé, en préservant la séparation Platform / Intranet. Ne jamais substituer la base utilisée par les collaborateurs.
2. Appliquer et tester dans l'ordre les migrations versionnées après sauvegarde restaurable. La base Lovable observée au 30 octobre ne possède pas les tables clés des migrations récentes. Voir `docs/release-verification-2026-10-30.md`.
3. Créer dans les secrets du dépôt `bib_intranet` deux connexions dédiées à la **préproduction uniquement** : `BIB_STAGING_PLATFORM_DATABASE_URL` et `BIB_STAGING_INTRANET_DATABASE_URL`. Préférer un rôle SQL **lecture seule**, autorisé à inspecter catalogue, définitions de fonctions et politiques, sans données personnelles.
4. Ouvrir Actions → **BIB Staging - Read-only deployment preflight** → Run workflow. Ce workflow n'est **pas** déclenché automatiquement lors de push, pull request ou horaire.
5. La réussite atteste uniquement l'existence physique des tables, fonctions métier, protections RLS et absence d'exécution anonyme des RPC sensibles. Une requête manquante provoque un échec explicite `BIB_PLATFORM_STAGING_NOT_READY` ou `BIB_INTRANET_STAGING_NOT_READY`.
6. Compléter par les tests end-to-end documentés dans `docs/release-verification-2026-10-30.md` : sessions CEO/RH, refus des rôles interdits, Google Drive/Gateway, webhooks Stripe en mode test, assureur, 48h, idempotence, notifications, logistique, réplications et reprise sur panne.

## Contraintes de sécurité

- Les scripts `ops/release/platform-preflight.sql` et `ops/release/intranet-preflight.sql` contiennent `BEGIN READ ONLY` et `ROLLBACK`. Le workflow force également `default_transaction_read_only=on`.
- Ils ne recherchent ni ne consignent d'adresses e-mail, ni de mots de passe, ni de clés Stripe.
- Une « CI verte » sur le dépôt reste distincte d'une « vérification de préproduction verte » qui reste elle-même distincte de la « recette métier complète ».
- En cas d'erreur, **corriger le schéma de préproduction**, analyser les risques et effectuer les répétitions. Ne pas rendre l'export permissif pour contourner une source manquante.
- Le déploiement et le cron nécessiteront une validation finale du responsable du projet après présentation des résultats.

**Ne pas interpréter la réussite de ce préflight comme une permission de lancer automatiquement la production.**
