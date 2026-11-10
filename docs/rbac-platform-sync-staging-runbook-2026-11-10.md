# Préproduction — périmètres RBAC et liaison BIB Platform (10 novembre 2026)

## Constat sur les bases connectées (lecture seule)
Au contrôle du 10 novembre, l'Intranet contient 3 portefeuilles de catalogue RBAC, mais **0 lien actif** dans `access_scope_portfolios`. Il existe aussi 1 portefeuille opérationnel fournisseur, 1 marchand et 1 portefeuille transversal : **ce ne sont pas les mêmes objets**. Ne pas transformer automatiquement un objet métier en permission.

L'Intranet référence un dernier import Platform réussi le **12 octobre 2026** ; les tentatives du **24 et 27 octobre** ont échoué avec l'erreur `customer_product_favorites`. Au contrôle actuel, cette table existe **dans la base BIB Platform**. Cela ne prouve ni que l'Edge Function déployée consulte cette base ni que la liaison entre environnements est correctement configurée. Il serait incorrect de créer `customer_product_favorites` dans l'Intranet pour masquer l'erreur.

## Périmètres effectifs et futurs
- `access_role_scopes` : périmètres RBAC existants affectés à des rôles ; le rôle CEO possède `global`. Le périmètre RH Work Tasks reste désactivé selon décision CEO : ne pas rouvrir par défaut.
- `access_business_portfolios` : catalogue des objets de droit d'accès ; `access_scope_portfolios` : correspondance vérifiée entité + pôle + portefeuille RBAC. Cette correspondance n'accorde pas un rôle à un collaborateur.
- `supplier_portfolios`, `merchant_portfolios`, `bib_case_portfolios` : portefeuilles opérationnels avec leurs propres dossiers et affectations, distincts du catalogue RBAC.
- `access_role_scope_policy_drafts` : **brouillons non actifs**. Les cases « Global », « pôle », « région », « portefeuille » et « mes dossiers » dans l'éditeur hiérarchique ne garantissent pas un filtrage des RPC métier jusqu'à application serveur vérifiée.
- Pour un CEO « global configurable » : conserver une habilitation canonique CEO et concevoir des **restrictions explicites** par ressource, avec contrôle RLS/RPC sur les dossiers, exports, événements et pièces. Ne pas convertir un brouillon d'écran en droit effectif.

## Ordre sûr demain
1. Identifier les projets Supabase réellement ciblés par les secrets d'export Platform et de bridge Intranet, sans exposer les secrets. Vérifier les Edge Functions effectivement déployées.
2. Exécuter en lecture seule `ops/release/intranet-export-source-readiness-2026-11-10.sql` dans Platform et `ops/release/scope-platform-bridge-readiness-2026-11-10.sql` dans Intranet. Comparer les tables, versions et journaux.
3. Reprendre et tester les migrations en attente **sur staging distinct**, avec sauvegarde, plan de retour et validation des propriétaires des données ; ne pas lancer les fichiers SQL historiques en bloc.
4. Exécuter un import `pull` **autorisé** après réparation de la source, puis contrôler `platform_sync_runs`: `success`, date récente, nombre d'éléments et absence d'erreurs. Valider les ID exacts marchands → boutiques → portefeuille et les données logistiques dans les deux sens.
5. Définir les liens RBAC entité + pôle + portefeuille existant uniquement avec preuves ; aucun lien automatique du catalogue vers les portefeuilles métier. Tester CEO global, responsable de pôle, collaborateur limité, compte sans portefeuille et compte révoqué.
6. Valider refus d'accès direct via API, exports, historique et pièces, pas seulement disparition de lignes dans le navigateur.

**Critère de sortie :** aucune donnée non autorisée visible ; chaque dossier opérationnel a une autorité de données, un propriétaire, un pôle et une date de synchronisation traçables ; contrôle qualité du bridge et RLS connectés passés avant déclaration Go.

Aucun import réel, aucun changement d'habilitation ni migration distante effectué dans ce lot.
