# BIB — Vérification de mise en service au 30 octobre 2026

## Références et périmètre

Ce document synthétise les **vérifications des bases Lovable accessibles** et des dépôts `Txss-17/bib_intranet`, `Txss-17/bib_platform`. Une compilation ou une PR fusionnée **ne constitue ni une migration appliquée, ni une recette de production**.

Les deux comptes existants CEO et Responsable RH accèdent maintenant à leurs espaces selon confirmation du responsable du projet. Leur réparation de profil/permissions en base est documentée dans `docs/incident-existing-staff-access-2026-10-30.md`. Aucun compte supplémentaire n'a été ouvert.

## État des schémas sur les projets Lovable accessibles

Vérification au 30/10/2026, **sans modification de ces schémas pendant cet audit** :

| Contrôle | Platform | Intranet |
|---|---|---|
| Tables commandes, litiges commerciaux et remboursements | Présentes, 0 commande et 0 remboursement lors du contrôle | Flux d'import à vérifier |
| Favoris produits/boutiques Platform | **Absents** (`customer_product_favorites`, `customer_boutique_favorites`) | Flux d'import non validable |
| Personnalisation marchande | **Table absente** (`product_customization_dossiers`) | Revue indisponible tant que la liaison est incomplète |
| Réassort marchand | **Table absente** (`stock_restock_requests`) | Revue indisponible tant que la liaison est incomplète |
| SAV assuré Platform | `sav_escalation_events` et deux RPC de la migration 0024 **absents** | `sav_escalation_queue`, RPC de prise en charge absents |
| Registre générique Intranet | Sans objet | `intranet_modules` et `intranet_records` **absents** |
| ACL canonique Intranet | Sans objet | `can_intranet_action(text,text)` **absent** ; RPC de compatibilité temporaire présente |
| Bridge et tickets | Export susceptible d'échouer sur les tables manquantes | `platform_sync_runs`, `support_tickets` présents |

Sur le journal `platform_sync_runs` Intranet : 13 exécutions, dont 7 réussies et 6 en erreur. Les trois derniers imports enregistrés, les 24 et 27 octobre, ont échoué avec absence de la table Platform `customer_product_favorites` ; **aucune synchronisation réussie récente n'est prouvée**. Les réussites d'octobre antérieures ne prouvent pas la compatibilité avec les exports actuels.

## Validation du code

Les dépôts ont une CI sur `main` verte après stabilisation des PR Intranet #27 et Platform #10. Platform #11 **ajoute la vraie exécution obligatoire des 12 scénarios PGlite SAV**, révèle puis répare une ambiguïté PL/pgSQL du travailleur. La page Ops/SyncFlows de cette branche signale maintenant les imports échoués, partiels et anciens sans afficher de métrique fictive de disponibilité.

## Ordre technique recommandé pour la recette et l'activation

1. **Sauvegarde et préproduction** : conserver un état restaurable des deux bases, des politiques RLS, des fonctions et secrets. Les deux bases sont indépendantes. Aucune migration substantielle ne doit être appliquée à l'aveugle sur le projet accessible : l'Intranet comporte plus de cent profils et des rôles déjà exploités.
2. **Inventaire exact des migrations** : confronter le schéma physique aux scripts, sans déduire l'application d'un numéro à partir du seul nom. Vérifier les dépendances et les procédures d'annulation.
3. **Platform d'abord** : sur la copie de recette, vérifier/appliquer dans l'ordre les migrations absentes depuis `0015` jusqu'à `0024`, notamment 0015 personnalisation, 0017 réassort, 0021 favoris, 0022/0023 workflows et 0024 SAV. Vérifier le comportement de 0018/0019/0020 et les fonctions de paiement avant l'application : éviter de rejouer sans revue des fonctions `CREATE OR REPLACE`.
4. **Intranet ensuite** : vérifier et appliquer les migrations manquantes, incluant 0039 modules/registre, 0044 droits et isolation, 0045–0051 workflows, 0052 accès historiques, 0053 définitions métier, 0054 réception SAV. Prendre en compte la RPC de compatibilité et le déclencheur de sécurité `app_origin` déjà présents en base ; ne pas laisser une migration les écraser sans comparaison.
5. **Fonctions Edge et secrets** : déployer `intranet-export` Platform et `platform-bridge` Intranet seulement quand leurs tables existent. Déployer `sav-escalation-worker` avec secret privé et environnement Stripe choisi. **Ne pas activer le cron** tant que les tests concurrentiels, l'idempotence et la file Support ne sont pas validés. L'absence de cron signifie absence d'escalade automatique.
6. **Recette fonctionnelle transverse** : côté Platform puis Intranet : propriétaires marchands/boutiques, favoris (ajout et suppression), personnalisation, réassort, commande et logistique BIB, tickets et litiges, remboursements Stripe réellement confirmés, assurance valide, réponse avant/après 48h, import et prise en charge Support, réitérations/erreurs réseau. Pour les 14 pôles, vérification rôle autorisé vs refus d'accès, action métier et audit.
7. **Documents et sécurité** : imports Google Drive BIB, exports par défaut vers Drive professionnel, approbation des envois externes, traçabilité des changements, restrictions et filigrane ; vérifier avec un vrai Google Workspace de recette. Les comptes tests doivent rester isolés des données réelles.
8. **Go/no-go** : ne publier que lorsque toutes les migrations attendues sont observées physiquement, que les Edge Functions sont testées de bout en bout, que les secrets et cron sont configurés, que la CI est verte et que les essais navigateur et métier ont une preuve. Prévoir un plan de retour arrière et un journal de décision.

## Requêtes non mutantes pour l'opérateur

Platform :
```sql
SELECT
 to_regclass('public.customer_product_favorites') IS NOT NULL AS customer_product_favorites,
 to_regclass('public.customer_boutique_favorites') IS NOT NULL AS customer_boutique_favorites,
 to_regclass('public.product_customization_dossiers') IS NOT NULL AS customization,
 to_regclass('public.stock_restock_requests') IS NOT NULL AS restock,
 to_regclass('public.sav_escalation_events') IS NOT NULL AS insured_sav,
 to_regprocedure('public.respond_to_order_issue(uuid,public.issue_action,text,public.issue_status)') IS NOT NULL AS seller_response_rpc;
```

Intranet :
```sql
SELECT
 to_regclass('public.intranet_modules') IS NOT NULL AS modules,
 to_regclass('public.intranet_records') IS NOT NULL AS records,
 to_regclass('public.sav_escalation_queue') IS NOT NULL AS sav_queue,
 to_regprocedure('public.can_intranet_action(text,text)') IS NOT NULL AS canonical_acl,
 to_regprocedure('public.acknowledge_sav_escalation(uuid)') IS NOT NULL AS sav_claim_rpc;
```

Les requêtes ci-dessus **ne réalisent aucun déploiement**. Elles diagnostiquent des dépendances indispensables mais ne remplacent pas la recette métier ou la vérification de toutes les tables.
