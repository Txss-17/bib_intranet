# BIB Security & IT — Contrôles Platform / Intranet

Relevé en lecture seule du 30 octobre 2026. Il ne certifie aucun parcours de bout en bout.

## Responsabilités

Security & IT couvre les identités et systèmes internes BIB ainsi que les frontières d'accès des marchands, clients finaux, fournisseurs et partenaires logistiques de BIB Platform. Les applications conservent des bases distinctes. L'ouverture d'une page de supervision ne confère aucun accès aux données personnelles Platform.

## Constats BIB Platform

- 45 tables publiques avec RLS activée, aucune table publique sans RLS, 97 politiques.
- Orders : 5 politiques ; boutiques : 5 ; boutique_members : 2 ; customer_profiles : 3 ; supplier_products : 1 ; partner_onboarding_submissions : 3 ; order_shipments : 1.
- Les tables order_refunds et order_shipping_addresses ont RLS activée et zéro politique directe. C'est un refus d'accès direct par défaut, non une preuve que les fonctions privilégiées sont sûres.
- L'insertion de commandes publiques et la lecture de produits fournisseurs actifs nécessitent des tests d'abus, de colonnes sensibles et de validation serveur.

## Matrice de recette en sandbox

| Profil | Test positif | Test négatif |
|---|---|---|
| Marchand A | Ses boutiques et commandes autorisées | Accès à Boutique B et commandes B refusé |
| Client A | Profil A, commandes liées A | Profil B et commandes B refusés |
| Fournisseur A | Dossiers et produits attribués | Données privées Fournisseur B refusées |
| Logistique A | Expéditions assignées et adresses minimales | Missions hors attribution refusées |
| Employé BIB | Seules opérations expressément autorisées | Simple rôle Intranet insuffisant pour l'admin Platform |
| Invité | Catalogue expressément public | Données clients, remboursements, paiements refusés |

Pour chaque test : environnement isolé, identité de recette, route, ressource, action, résultat attendu, résultat réel, preuve sans secrets et signature de validation.

## Conditions d'activation de la supervision

1. Auditer RLS, droits GRANT, fonctions SECURITY DEFINER, Edge Functions et utilisation de service_role.
2. Vérifier l'isolation sandbox/production (commandes, paiements, stocks et logistique).
3. Mettre en place un pont d'observation sécurisé, agrégé et journalisé, sans exposer les clés Platform au navigateur Intranet.
4. Séparer alertes, incidents, corrections et vérifications indépendantes ; ne jamais afficher un « contrôle réussi » sur la seule existence d'une politique.
5. Préserver la politique documentaire Google Workspace BIB : exports contrôlés, destinataires limités, journalisation et filigrane des rapports sensibles.

Security & IT qualifie et contrôle. Produit & Engineering développe les corrections et exécute les tests techniques. Les pôles métier approuvent les besoins d'accès. Qualité & Audit valide indépendamment les écarts critiques.
