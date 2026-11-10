# BIB Intranet — contrôle des parcours onboarding (10 novembre 2026)

> Revue statique et garde-fous d'interface. Aucune migration appliquée, aucune invitation envoyée et aucun droit réel accordé par cette livraison.

## Principes communs

Chaque dossier d'onboarding conserve un **identifiant métier canonique**, l'acteur, les étapes, les références de pièces, la décision et son horodatage. La sélection d'un partenaire pour un pilote ne vaut ni contrat signé, ni habilitation, ni admission produit, ni autorisation de commande. L'accès portail exige un circuit d'invitation sécurisé et un envoi approuvé indépendamment. Les secrets, OTP et mots de passe ne sont pas inscrits dans les notes.

| Population | Circuit attendu | Autorité métier | Écart/restant |
| --- | --- | --- | --- |
| Fournisseur | Candidature → catalogue précontractuel → présélection → contrat validé/signé → invitation Gateway + preuve → catalogue complet et pièces par SKU → audit documentaire et décision → admission SKU → publication/activation séparée | Fournisseurs, Juridique, Audit, Finance, Marketplace | Éligibilité documentaire ≠ audit effectué ni admission ; publication des SKU admis et recette de synchronisation Platform restent à vérifier (issue Platform #40). |
| Logisticien | Candidature → contact → cahier des besoins → acceptation → **réception du contrat/CGS/SLA du prestataire** → visa indépendant Juridique/Finance/Ops → signature → invitation Gateway → sélection pilote → activation après Go/No-Go | Ops, Juridique, Finance, Direction | PR #61 **en brouillon** ; garde-fou UI ajouté pour empêcher le saut entre besoins acceptés et signature tant que la correction serveur n'est pas fusionnée et éprouvée. Ne pas contourner via RPC direct. |
| Marchand | Vérification identité légale et KYC/Stripe Connect → mandat et contrat → boutique et textes légaux versionnés → acceptations → échantillons et stock → habilitation opérationnelle → vente sous conditions | Marketplace, Juridique, Finance, Direction | Distinguer boutiques tests EI de marchands tiers ; vérifier le vendeur légal et le paiement dans Platform. L'inscription libre ne remplace pas l'approbation. |
| Collaborateur RH | Dossier nominatif → position/pôle/référent/contrat/documentation → validation RH → provisionnement autorisé → accès rôle et périmètre → intégration → mutation/révocation | RH, responsable hiérarchique, Security, Direction | Ne préaffecter aucun pôle par défaut ; ne pas convertir la mention libre de « filiale » en entité juridique active. Les droits fiscaux par entité restent un **chantier distinct** (issue #66). |

## Garde-fous livrés dans ce lot

- L'écran `PartnerPostApplicationWorkflow` refuse localement l'étape « contrat signé » pour la logistique quand la revue indépendante du contrat n'est pas encore représentée par le parcours serveur de `main`. **Cette protection d'interface ne remplace pas une contrainte serveur**.
- Le bouton de passage à « accès portail enregistré » reste désactivé tant que le registre Gateway n'atteste pas un transport confirmé (simulation uniquement pour compte d'essai), et l'écran rappelle la nécessité de l'approbation indépendante. La RPC `bib_advance_partner_onboarding` de la migration 0096 possède déjà son contrôle propre de confirmation de remise.
- La création RH commence sans pôle sélectionné (ancien défaut implicite « ops » supprimé) et rappelle que le choix d'un pôle **n'ouvre pas automatiquement l'accès fiscal multi-entités**.
- Le champ libre RH « Filiale » a été renommé « Entité de rattachement déclarée (à vérifier) » pour éviter de faire passer une valeur saisie pour l'existence juridique vérifiée d'une société.

## Recettes obligatoires avant clôture

1. **RH** : demande incomplète refusée ; compte non créé avant approbation ; séparation du rédacteur et validateur selon règles serveur ; aucun accès fiscal implicite à l'ajout des pôles Finance/Conformité ; mutation concurrente ou auto-mutation rejetée ; départ avec révocation des accès et sessions, conservation de l'historique.
2. **Logistique** : un appel direct à la RPC ne doit pas pouvoir sauter le visa contractuel ; document prestataire et version présents, approbateur indépendant, cas historiques traité ; un statut `active` ou une sélection pilote ne suffit pas à affecter une commande sans Go/No-Go.
3. **Fournisseurs** : catalogue avant contrat ≠ admission ; les SKU refusés ou en examen ne passent jamais au portail des produits admis ; audit payé ≠ référencement ; aucun droit d'accès avant envoi Gateway confirmé.
4. **Gateway/OTP** : adresse exacte, test/réel séparés, doublons/idempotence, transport `sent`, contrôle indépendant, échec/reprise, révocation, aucun lien porteur de secret.
5. **Marchands/Platform** : identité canonique, documents signés versionnés, opt-in/cookies indépendants, capacité de stock, échantillons, couverture financière et paiement séparés.
6. **SQL** : réconcilier les migrations anciennes 0089/0091 et réintroduites 0095/0096 avec le journal Drizzle et les objets présents sur la base connectée, sans rejouer une migration historique ni déduire son application du nom du fichier.

**Limitation explicite** : les rôles RH et partenaires restent contrôlés par les procédures serveur existantes. Le nouveau périmètre fiscal par entité demandé à la Direction n'est pas mis en place par cette PR ; aucun droit/contrat/donnée de production n'est modifié.
