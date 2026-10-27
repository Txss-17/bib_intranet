# Rattachement des boutiques aux marchands

Platform est la source du propriétaire d’une boutique : `boutiques.user_id` désigne le marchand `merchants.id`. L’Intranet traduit cette identité par `user_accounts.platform_id` vers `shops.merchant_id`. Les noms, adresses de courriel et noms d’entreprise ne servent jamais de clé de rapprochement.

## Correctif

L’export privé conserve désormais `user_id` sur chaque boutique et indique `merchants_complete: true` et `boutiques_complete: true`. Les deux listes sont complètes, même pour un appel incrémental. Une boutique dont le propriétaire n’a pas de profil marchand fait échouer l’export.

Avant toute écriture de marchand ou de boutique, l’Intranet exige ces indicateurs, les deux listes, un `snapshot_at` valide, des identifiants UUID uniques et un propriétaire présent dans la liste marchande pour chaque boutique.

L’index des propriétaires est construit à partir des résultats d’écriture réussis, sans lecture globale tronquée de la table des marchands. Une panne de lecture ne devient pas une création. Si la synchronisation d’un marchand échoue, ses boutiques sont ignorées dans cette tentative et gardent leur rattachement précédent. Le résultat signale une synchronisation partielle ; une nouvelle tentative peut réparer le lien.

Les lignes marchandes et boutiques utilisent l’horodatage du snapshot. Un snapshot plus ancien ou identique ne remplace pas une ligne déjà synchronisée. Les mises à jour utilisent aussi une condition sur l’horodatage lu : une modification concurrente fait échouer la ligne au lieu d’écraser un rattachement plus récent.

Après une synchronisation, les listes et fiches Marketplace sont invalidées pour afficher les rattachements à jour.

## Mise en service

1. Déployer Platform `intranet-export` et ses modules partagés en premier.
2. Déployer Intranet `platform-bridge` et le frontend qui actualise les données Marketplace.
3. Lancer une synchronisation complète depuis l’interface d’intégration. Les boutiques précédemment sans marchand sont réparées à partir de l’identité Platform.
4. Vérifier une boutique dans la fiche marchand et son portefeuille, puis répéter la synchronisation. Vérifier également le résultat partiel en cas d’indisponibilité.

Aucune nouvelle migration n’est nécessaire pour ce correctif. Les schémas et migrations antérieurs restent requis. Les tests automatisés et les PR ne prouvent pas le déploiement effectif des fonctions.

## Validation

La suite `tests/bridge` Platform exécute les handlers des deux applications avec des réponses contrôlées : export de l’identité propriétaire, profil manquant, snapshots incomplets, doublons, échecs de lecture/écriture, conservation des liens, reprise, plus de 1 000 marchands, identités distinctes partageant un courriel, snapshots anciens et modification concurrente. La CI vérifie également les types des fonctions et les compilations.
