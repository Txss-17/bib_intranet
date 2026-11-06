# Vérification du flux d’acquisition avant préproduction

Contrôle du 6 novembre 2026. Cette note complète le [modèle de flux](merchant-supplier-flow-2026-11-05.md) et l’[issue de préproduction isolée](https://github.com/Txss-17/bib_intranet/issues/32).

## Défauts corrigés

Le portail Intrabib supprimait `acceptance.actor_id` dans la projection du devis, alors que la réservation Platform exige cet identifiant pour vérifier l’acceptation par le marchand. La preuve transmise conserve maintenant l’identité du marchand qui a accepté. Les identifiants des valideurs, la couverture bancaire, les commandes internes et les détails PSP restent privés.

Les devis sandbox s’appuient sur les données de test. La publication du catalogue, qui refusait auparavant tout produit de test, dispose désormais d’un parcours sandbox explicite : audit, produit et prix approuvé du même mode. L’ancien appel de publication à un argument reste réservé aux données réelles ; la nouvelle surcharge privée à deux arguments exige le mode demandé. Elle est ajoutée par la migration Intrabib `0087_catalog_sandbox_isolation`, sans modifier les migrations déjà enregistrées.

Un émetteur sandbox demande d’abord au récepteur de confirmer son environnement et sa version de protocole. Un ancien récepteur, une réponse incomplète ou une destination réelle empêchent l’envoi des données de test. Chaque import est ensuite contrôlé par le récepteur contre son environnement serveur et sa référence de projet. Un import ancien sans étiquette est traité comme réel et n’est pas accepté implicitement en sandbox. L’étiquette de transport n’est pas écrite dans les colonnes du catalogue public.

## Recette isolée exécutée

Deux scénarios font communiquer deux bases PostgreSQL PGlite distinctes, en mode logique réel puis sandbox. Toutes les identités, factures, références et opérations PSP sont fictives ; aucun service de paiement ou de messagerie n’est appelé.

1. Prix proposé par Fournisseurs puis approuvé par une autre personne disposant des droits Finance ; contrôle d’admission et création du DTO public sans identité fournisseur.
2. Preuve d’échantillon payé et contrôlé physiquement, demande marchand privée et reprise de sa clé sans doublon.
3. Devis préparé, revu, communiqué et accepté sur son empreinte/version exacte ; consultation privée avec fournisseur identifié.
4. Transmission de la preuve d’acceptation jusqu’à la réservation Platform. Une preuve amputée de l’identité du marchand est refusée.
5. Enregistrement d’un reçu PSP synthétique avec montant, devise, destination et retenue BIB contrôlés ; répétition sans double règlement ni double événement.
6. Transmission de la file Platform vers Intrabib et reprise idempotente. Un paiement enregistré ne permet pas, à lui seul, de démarrer la production.
7. Revue de couverture par Finance, puis démarrage autorisé vers le partenaire logistique BIB ; rattachement des pièces fictives fournisseur et BIB avec leurs émetteurs et montants propres, sans divulguer l’identité du valideur.
8. Remboursement partiel, rapprochement et blocage de l’expédition malgré la couverture antérieure ; un ancien message de paiement ne supprime pas ce blocage.
9. Aucun crédit de stock physique n’est déduit de ces opérations ; un autre marchand ne peut pas consulter le règlement.

La suite dédiée `npm run test:supply:integration` et le job CI **Merchant supply cross-app integration** exercent ces scénarios et les types des échanges. Les suites métier, les contrôles d’import et les compilations restent complémentaires. Les échecs généraux préexistants du bridge demeurent visibles ; ils ne sont pas ignorés par cette suite dédiée.

## État des connexions disponibles

| Application raccordée | Statut de la base annoncé | Contrôle de lecture | Conclusion limitée |
| --- | --- | --- | --- |
| B.I.B Platform | Base Supabase activée | Requête de catalogue puis `SELECT 1` indisponibles | Schéma actuel non vérifiable par cette connexion |
| B.I.B intranet | Base Supabase activée | Requête de catalogue puis `SELECT 1` indisponibles | Schéma actuel non vérifiable par cette connexion |

Les projets accessibles n’identifient pas un couple distinct de préproduction. Cette observation ne prouve pas qu’aucune autre instance n’existe. La présence des secrets GitHub réservés à staging n’a pas pu être vérifiée. L’historique consulté ne montre pas d’exécution du workflow de précontrôle staging ; une ancienne CI générale réussie ne constitue pas cette preuve.

Aucune migration distante, activation de paiement, création de base, modification de secret, planification ou publication n’a été effectuée pendant ce contrôle. Les contrôles dans PGlite ne constituent ni une recette Stripe connectée, ni un test de restauration, ni une attestation de disponibilité des fonds.

## Suite opérationnelle

Identifier les deux instances de préproduction et rétablir leur accès, vérifier leur isolation et la restauration d’une sauvegarde, puis rapprocher leurs schémas avec les journaux Drizzle. Conserver les comptes collaborateurs existants et ne pas réutiliser une base de travail comme staging par déduction.

Déployer d’abord le récepteur Platform qui contrôle l’environnement, puis les fonctions Intrabib correspondantes. Appliquer la migration `0087` sur la seule préproduction validée avant d’utiliser le nouveau lecteur de prix. Configurer les références de projets, les secrets de liaison et les identités réelles dans les emplacements prévus, sans transmettre de valeurs secrètes dans les échanges de projet.

Exécuter ensuite le précontrôle en lecture seule et la recette connectée avec Stripe sandbox : retour du navigateur, signature de webhook, capacités Connect, remboursements/litiges, reprise de la file, disponibilité des fonds et réception physique. Les flags de paiement et d’échantillon restent désactivés jusqu’au go/no-go documenté. L’issue #32 reste ouverte.
