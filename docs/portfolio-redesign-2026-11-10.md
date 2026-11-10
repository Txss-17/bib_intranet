# Refonte des portefeuilles BIB — 10 novembre 2026

**Décision** : repartir de la création et de l'attribution plutôt que de présenter une liste pré-remplie de portefeuilles existants. Les données métier historiques ne doivent pas être supprimées sans inventaire, contrôle des dépendances et décision de purge légale.

## Trois registres distincts

| Pôle | Registre opérationnel canonique | Élément attribué | Opérations |
| --- | --- | --- | --- |
| Fournisseurs | `supplier_portfolios` + `portfolio_assignments` | Fournisseur validé et collaborateur fournisseur habilité | Créer, attribuer, changer responsable/backup, archiver s'il ne reste aucun lien |
| Marketplace | `merchant_portfolios` + `merchant_portfolio_assignments` | Marchand vérifié avec boutique | Créer, rattacher, transférer le portefeuille / les marchands, archiver sans lien actif |
| Marketplace clients / Opérations logistique / RH | `bib_case_portfolios` + `bib_case_portfolio_members` | Client disposant d'une commande / partenaire logistique réel / collaborateur RH | Créer, attribuer, transférer, archiver sans rattachement actif |

Les droits d'accès RH `access_business_portfolios` sont des **périmètres RBAC**, pas des portefeuilles opérationnels à effacer ni à recréer. Une nouvelle entité fiscale BIB n'est pas un portefeuille commercial.

## Parcours souhaité

1. **Créer** un portefeuille au sein du pôle exact, avec nom ou catégorie métier et responsable facultatif mais explicitement choisi. Ne pas créer de jeux de données fictifs.
2. **Attribuer** un dossier existant et éligible, selon la validation de son identité, son statut et le droit du collaborateur.
3. **Transférer** le dossier avec trace de l'attribution précédente ; ne pas confondre transfert de dossier et changement de propriétaire du portefeuille.
4. **Archiver** uniquement un portefeuille vide : toutes ses attributions doivent avoir été terminées ou transférées. Motif requis et événement d'historique conservé. Ne jamais supprimer en cascade le fournisseur, marchand, client, partenaire ou salarié.
5. **Actualiser** les vues après chaque action enregistrée grâce au système global de synchronisation PR #77, puis relire les droits au serveur.

## Changement d'interface

Les cartes de l'ancienne liste Fournisseurs sont retirées de l'onglet de création ; la sélection des anciens portefeuilles reste nécessaire pour réaffecter et archiver les éléments existants. Les vues Case/Marketplace se concentrent sur les formulaires de création et d'affectation plutôt que sur un inventaire complet.

La demande « supprimer la liste » est interprétée comme **supprimer la présentation de l'ancienne liste**, pas comme déclencher un `DELETE` sur des données professionnelles et leurs historiques. Les portefeuilles non archivés restent disponibles dans les sélecteurs pour les opérations nécessaires.

## Contrôles avant déploiement

- Exécuter migration `0101` uniquement sur staging après validation du schéma et des permissions existantes.
- Essais négatifs : création par pôle interdit ; responsable hors pôle ; transfert concurrent ; tentative d'archiver avec lien actif ; tentative d'attribuer à un portefeuille archivé ; retour d'un utilisateur révoqué.
- Séparer `test_account` et données réelles ; vérifier les historiques et journaux comptables ou d'audit conservés.
- Revoir toutes les pages historiques pouvant encore lister un portefeuille archivé (dossiers fournisseurs, interface RH d'accès, documents et rapports) : ne pas utiliser le statut archivé pour contredire l'existence historique d'une affectation.
- Ne pas activer la suppression physique avant définition d'une politique de conservation et de purge approuvée par Direction/Juridique.

**Statut : code proposé dans GitHub, aucune base distante modifiée.**
