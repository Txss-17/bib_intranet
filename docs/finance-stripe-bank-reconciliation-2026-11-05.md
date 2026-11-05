# Intrabib Finance — sources Stripe et banque distinctes

Décision du 5 novembre 2026. Cette note décrit le travail restant ; aucun accès bancaire ou Stripe réel n'est activé par la présente modification.

## Source Stripe
Récupérer côté serveur avec des identifiants limités les paiements, charges, frais, application fees, transferts Connect, remboursements, litiges, balance transactions, payouts et statuts de rapprochement. Les webhooks doivent avoir une signature vérifiée, être idempotents et conserver les références de paiement, marchand et entité légale. Une charge, un transfert Connect et un versement payout sont des événements différents.

## Source banque BIB
Pour les prestations propres d'audit, contre-audit et abonnement : le fournisseur effectue un virement SEPA directement sur le compte professionnel de l'entité légale BIB qui facture. La banque BIB confirme le crédit. L'intranet peut recevoir des relevés bancaires officiels via import sécurisé ou une connexion bancaire autorisée. Ne pas utiliser un payout Stripe, un ordre de virement envoyé par fournisseur ou une capture d'écran comme confirmation bancaire indépendante.

## Rôles Finance
- Contrôler bénéficiaire légal EI/SASU, montant, devise, référence de devis/facture, date de crédit et référence unique du mouvement bancaire.
- Vérifier l'état non payé, partiel, payé, trop-perçu ou à examiner. Les correspondances ambiguës ou sans identifiant bancaire imposent une revue humaine.
- Rapprocher séparément les payouts Stripe vers la banque de BIB.
- Conserver la preuve du rapprochement et l'approbateur ; BIB Audit ne voit qu'un état autorisé, pas les données bancaires confidentielles.
- Journaliser les écritures par entité légale avec accès RBAC/RLS et contrôle des doublons.

## Implémentation de ce lot
- src/lib/financeFlowRules.ts : identité du payeur, vendeur et créancier.
- src/lib/financeReconciliation.ts : rapprochement de mouvements bancaires déjà vérifiés, sans accès API.
- Les tests couvrent la séparation Stripe/banque, crédits vérifiés, virements partiels, trop-perçus et imports en double.

## Intégrations à réaliser ultérieurement
1. Connexion API Stripe et webhooks signés, clés secrètes exclusivement côté serveur.
2. Choix de la banque professionnelle BIB ; import officiel contrôlé ou connecteur réglementaire conforme, à autoriser.
3. Politique de validation humaine Finance et exceptions ; journal immuable.
4. Statuts factures, TVA, avoirs, PA de facturation électronique ; isolation des fournisseurs et marchands.
5. Recette en préproduction isolée avant activation des paiements réels.

Documents : https://docs.google.com/document/d/1LwTHlbWGSjAIUbhMFSBFJKCuGpmeop3MGGwiiU2_a1o/edit
Documentation API : https://docs.stripe.com/api/balance_transactions et https://docs.stripe.com/api/payouts
