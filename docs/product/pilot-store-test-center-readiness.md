# BIB — Centre de tests & boutiques pilotes

Date du cadrage : 31 octobre 2026.

## Statut

Page de préparation des protocoles ajoutée : /pole/product/testing.
Ce n'est PAS un outil d'exécution des tests Platform, un environnement sandbox réel ou un substitut au contrôle des preuves CI/CD.

La page est soumise au droit existant product.engineering. Le lien n'accorde aucun droit supplémentaire côté base.

## Parcours inclus

1. Boutique pilote marchande : compte, rôles, catalogue, publication et accès tiers.
2. Commande et paiement test : panier, Stripe sandbox, rejets, expiration, webhook et idempotence.
3. Fournisseurs : candidature, qualification, catalogue, publication et isolation entre fournisseurs.
4. Opérations & Logistique : mission assignée, événements, livraison et stock sans partenaire réel.
5. SAV & Finance : traitement marchand, escalade 48 h conditionnelle, remboursement partiel/total.
6. Sécurité : RLS multi-tenant, profils clients, boutiques, fournisseurs, partenaires logistiques et pont Intranet.

## Livrables requis à chaque recette

- Identifiant non personnel du scénario et jeu de données fictives.
- Application, commit, version, environnement et identifiants de boutiques de recette.
- Compte de test et rôle (sans secrets).
- Objectif, action, résultat attendu et résultat observé.
- Statut réel : non exécuté / réussite attestée / échec attesté / bloqué.
- Référence de preuve (rapport CI, capture expurgée, logs corrélés).
- Analyse d'anomalie, ticket associé, responsable et décision.
- Validation indépendante avant passage en production.

## Activation ultérieure

### Gate 1 — isolation de sécurité

- Une base Platform de recette physiquement distincte de la production, avec configuration de test serveur vérifiée.
- Stripe en mode test et secret de webhook propres au projet ; interdiction des paiements live.
- Sorties email, logistique, remboursements et synchronisations isolées ou remplacées par simulateurs contrôlés.
- Comptes, produits, adresses et commandes fictifs, sans données réelles et avec RLS en place.
- Vérification que les commandes sandbox ne peuvent jamais déclencher de véritable expédition.

### Gate 2 — exécution instrumentée

- Runner e2e authentifié à l'environnement de recette (navigateur/Playwright ou équivalent), sans clés privilégiées côté frontend.
- API de lancement et suivi de campagne dédiée à l'environnement staging et protégée par rôles.
- Identifiants d'exécution et journaux corrélés par scénario, produit, boutique et campagne.
- Tests positifs et tests négatifs de propriété des données et de séparation multi-tenant.
- Rejeu des webhooks, échecs réseau et délais de propagation Platform -> Intranet.
- Écriture serveur uniquement des résultats observés, jamais d'un succès supposé.

### Gate 3 — décision

- Associer la campagne à une demande tech_requests, à une fiche product_work_records et à product_release_tracking.
- Rapport de recette avec preuves horodatées et validation qualité/sécurité.
- Avant mise en production, revue distincte du code, statut CI, rollback, RLS, migrations et secrets.
- Ne jamais publier automatiquement une version depuis la validation d'une fiche.

## Hors périmètre du correctif préparatoire

- Création effective de boutiques, commandes ou profils dans Platform.
- Déploiement des migrations manquantes et régénération des types Supabase.
- Mise en place des véritables comptes de test, de Stripe test et des runners.
- Attestation de conformité/recette sans exécution.

**Le bouton « Copier le protocole » ne transporte que le texte des cas de test. Il ne lance aucune requête inter-projets.**
