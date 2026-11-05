# Flux marchand, fournisseur et BIB

Décisions du 5 novembre 2026, conversation « Cadre réglementaire commissionnaire ». Ce lot complète les lots audit et gouvernance juridique ; il ne déclare pas les 42 tâches du programme terminées.

## Modèle retenu

| Opération | Vendeur / émetteur | Acheteur | Rôle de BIB |
| --- | --- | --- | --- |
| Acquisition des marchandises | Fournisseur identifié dans le devis | Marchand identifié et boutique rattachée | Intermédiaire transparent selon mandat communiqué |
| Commission d’intermédiation | Opérateur BIB réel | Marchand | Prestataire de son service propre |
| Livraison facturée | Fournisseur ou BIB, selon la prestation effectivement contractée | Marchand | Organisation via partenaires, sans expédition fournisseur → client final |
| Vente au client final | Marchand | Client | Intermédiaire technique ; le compte connecté destinataire est celui du vendeur marchand |
| Boutique test propre | L’EI réelle est acheteur puis vendeur | Client final lors de la revente | Aucune commission ni facture BIB à cette même entité |

Le choix de commissionnaire à la vente a été écarté. Le choix « Destination charges » a été explicité dans l’échange, puis précisé par le coût d’acquisition global et l’identité fournisseur sur le devis. Ces décisions remplacent la mention « montage Connect à choisir » du diagnostic du 4 novembre ; elles ne prouvent pas qu’un compte PSP est déjà opérationnel.

Le catalogue présente un prix unitaire indicatif validé par Finance : produit, livraison et commission BIB compris. Le DTO public ne contient aucune identité fournisseur. Une ancienne valeur `base_price` sans composition approuvée n’est pas présentée comme un coût global : l’écran indique « À confirmer par devis ». La sélection d’un article reste distincte de l’achat et du transfert de propriété.

## Parcours livré

1. Le marchand authentifié choisit sa boutique et demande un devis pour une référence catalogue, un échantillon ou un approvisionnement à la demande. Le serveur retrouve lui-même son identité et la référence Intrabib. Une répétition de la même demande conserve sa clé ; changer sa portée avec la même clé est refusé.
2. Fournisseurs prépare le devis en s’appuyant sur une identité acheteuse publiée et l’opérateur BIB configuré. L’identité légale fournisseur et ses justificatifs communicables sont renseignés explicitement. Produit, livraison et commission ont des montants HT, taux et motifs fiscaux propres ; aucun taux ni tarif n’est inventé.
3. Un autre intervenant disposant des droits Finance vérifie les identités, montants, régimes fiscaux et références contractuelles. Fournisseurs communique ensuite la version approuvée. Réviser l’offre annule cette approbation et change version et empreinte.
4. Dans « Devis d’acquisition », le marchand consulte les parties et le détail, indique son signataire/habilitation et coche un accord initialement vide portant sur la version exacte. Un devis expiré ou une qualification retirée ne peut pas être accepté. Cette acceptation ne modifie aucun consentement marketing/cookies et ne marque rien payé.
5. Le paiement unique utilise le montant recalculé en centimes, une clé persistée par devis, le fournisseur comme destination et `on_behalf_of`, et le montant TTC des services BIB comme `application_fee_amount`. Une route vérifiée, les capacités du compte connecté et l’activation serveur sont indispensables. Aucun champ de prix, d’identité propriétaire ou de routage Stripe fourni par le navigateur n’est accepté.
6. Le webhook vérifié relit le PaymentIntent et sa dernière charge. Le montant, la devise, la destination et la retenue BIB doivent correspondre. Le retour du navigateur n’est jamais une preuve. Un remboursement ou litige déjà survenu avant le traitement du checkout est conservé comme blocage dès la première écriture.
7. Une file transactionnelle transmet les événements à Intrabib. Le portail privé accuse réception après écriture ; révisions, doublons, reprises et événements anciens sont contrôlés. Un échec de transmission ou d’accusé conserve la ligne en attente. Le worker doit être planifié et supervisé dans l’environnement autorisé.
8. Finance rattache les factures réellement émises, avec émetteur, débiteur, montant et référence documentaire. Une facture fournisseur ne peut pas inclure les services propres facturés par BIB. Ce registre ne produit pas lui-même une facture fiscale ou un avoir.
9. L’ordre fournisseur reprend l’acheteur, la référence et la quantité du devis accepté. Sa destination est un entrepôt/partenaire logistique BIB actif, jamais un client final. La production nécessite une couverture financière documentée, suffisante et encore valide. Le paiement PSP « réussi » ne remplace pas ce contrôle. Les remboursements et litiges rapprochés bloquent la production/expédition.

La qualification est recontrôlée lors de la revue, de la communication, de l’acceptation, de la réservation du paiement et des étapes opérationnelles. Le contrôle de paiement repose sur la consultation fraîche du portail Intrabib ; une révocation survenant ensuite impose une supervision/compensation, les deux bases ne formant pas une transaction distribuée.

## Montants et responsabilité PSP

Exemple fictif de recette : biens 36,00 € TTC, livraison 6,00 € TTC et commission 2,40 € TTC, soit 44,40 €. Le fournisseur reçoit une allocation de 36,00 €, BIB retient 8,40 € TTC pour ses prestations ; le produit HT de ces services est 7,00 €. Les 44,40 € ne sont pas le chiffre d’affaires BIB. Les frais PSP et ajustements restent à rapprocher ; ces allocations ne sont pas un solde bancaire disponible.

Une Destination charge n’a qu’une destination connectée. Si une livraison doit être facturée/encaissée pour un troisième bénéficiaire indépendant, le paiement de ce devis est bloqué. Modifier le contrat ou le montage PSP doit faire l’objet d’une revue ; aucun bénéficiaire supplémentaire n’est absorbé silencieusement par BIB.

Pour les ventes client, `on_behalf_of` et la destination désignent le marchand réel. Les boutiques propres utilisent une route explicite `own_ei_principal`, seulement si l’identité est celle de l’opérateur configuré. Il n’existe aucun repli automatique vers un encaissement BIB en principal. Le traitement technique des frais, remboursements et contestations sur le solde plateforme reste une responsabilité à traiter avec Stripe : `on_behalf_of` ne supprime pas ces obligations. La commission d’acquisition n’est pas facturée une seconde fois au checkout client.

## Autorité et limites

| Objet | Source faisant autorité | Limite |
| --- | --- | --- |
| Devis, revue, acceptation, factures, couverture | Intrabib | Droits enregistrés, validation indépendante, journaux immuables |
| Prix indicatif public | Prix Intrabib approuvé puis importé | Pas d’invention de composition pour le catalogue historique |
| Règlement PSP, remboursements et litiges | Stripe vérifié → registre Platform → file Intrabib | Pas de déduction de fonds disponibles ; retards de transmission à superviser |
| Identité marchand | Gouvernance juridique existante, publiée | Le navigateur ne peut pas remplacer l’acheteur ni le vendeur |
| Propriété et garde physique | Contrat accepté et documents logistiques | La présence chez un 3PL ne rend pas BIB propriétaire |
| Stock physique Platform | Réception protégée existante | Ni devis, paiement, ni statut « reçu » d’un ordre interne ne créditent le stock |

Le paiement d’un échantillon le rend seulement « commandé » ; les contrôles physiques, `mark_paid_sample_received`, `validate_paid_sample` et les protections de publication restent en place. L’ancien endpoint ne peut plus prélever directement un prix catalogue. Les ordres historiques sans devis ne reçoivent pas de fausse preuve : toute nouvelle transition nécessitant ce lien est bloquée jusqu’à reprise documentaire contrôlée.

Les parcours de capacité fournisseur, réservations de capacité, regroupements de précommandes, livraisons 3PL avec preuve de lot, avoirs et comptabilité consolidée restent des chantiers du backlog. Le choix « à la demande » qualifie la demande de devis ; il n’active pas automatiquement des précommandes client sans ces contrôles. Les preuves de virements des audits fournisseurs conservent le rapprochement Finance et l’attestation bancaire serveur ajoutés dans Intrabib #52. Le contrôle d’échantillon payé/inspecté ajouté dans Platform #29 est conservé et repris dans la migration Drizzle : les devis de stock partent d’une demande dont Platform a vérifié la preuve réelle, puis la preuve est relue avant acceptation et paiement. Les simples identifiants d’approbation saisis par le navigateur ne suffisent pas.

## Mise en service coordonnée

Le code est destiné à `main`. Aucune migration, fonction distante, configuration de secret, planification ou transaction réelle n’a été exécutée pour ce lot. L’[issue de préproduction isolée](https://github.com/Txss-17/bib_intranet/issues/32) reste ouverte.

- Rapprocher les schémas réels et le journal Drizzle, sauvegarder et vérifier la restauration des deux instances de préproduction identifiées. Ne pas rejouer l’ensemble des anciens fichiers Supabase SQL. Les migrations ajoutées sont Platform `0027_merchant_supply_model` et Intrabib `0086_merchant_supply_model` ; les lots `0025`/`0084` et l’admission audit `0083` doivent être compatibles.
- La baseline Platform doit contenir les tables et gardes d’échantillons/réception existants avant tout paiement. Les vérifications SQL d’échantillon échouent avant appel Stripe si cette dépendance manque.
- Appliquer les migrations coordonnées sur staging uniquement, Platform avant Intrabib selon le plan existant, puis les fonctions et applications correspondantes. Ne pas publier le nouveau webhook sans son registre SQL. Un déploiement partiel reste indisponible ; aucun repli permissif n’est prévu.
- Configurer l’identité légale réelle dans `supply_operator_configuration` (Intrabib) et `supply_payment_configuration` (Platform), désactivées initialement. Faire vérifier les mandats, l’émetteur des prestations de livraison, les règles de TVA, la responsabilité fiscale et les comptes Connect de chaque fournisseur/marchand. Les routes privées exigent une preuve, une date de vérification et une approbation fiscale ; aucun compte `acct_` fictif n’est inséré par migration.
- Aligner `BIB_SUPPLY_ENVIRONMENT` sur l’isolation `PAYMENTS_ENVIRONMENT` et les références de projets existantes ; configurer le même secret privé `BIB_PLATFORM_BRIDGE_SECRET` (au moins 32 caractères) et l’URL HTTPS exacte `BIB_INTRANET_SUPPLY_URL` vers `merchant-supply-portal`. Ne jamais exposer ces valeurs dans Vite ou les documents publics.
- Garder `BIB_SUPPLY_CHECKOUT_READY` et `BIB_SAMPLE_FULFILLMENT_READY` désactivés jusqu’à recette. Configurer un `BIB_SUPPLY_WORKER_KEY` distinct (au moins 32 caractères), puis planifier/superviser `merchant-supply-sync` dans le seul projet autorisé. Tester les reprises avant activation des paiements.
- Exécuter la recette négative et le parcours complet en sandbox : propriétaire erroné, environnement erroné, même auteur/valideur, version obsolète, compte non opérationnel, taux/identité manquants, paiement concurrent, webhook retardé, remboursement, litige, interruption de bridge, reprise, couverture expirée, livraison interdite, réception physique et publication. Archiver le go/no-go et les responsabilités de rapprochement.

Le retour à une ancienne version de paiement permissive n’est pas un mécanisme de secours. En cas d’incident, désactiver les routes/flags concernés, conserver les journaux et traiter les commandes déjà engagées.

## Vérification du code

Les suites `npm run test:supply` exécutent des fonctions PostgreSQL réelles dans PGlite ainsi que les contrôles de portail, de passerelle et, côté Platform, d’interface, de checkout, de webhook et de reprise. `npm run test:supply:browser` exerce le composant réel à 320/390 px avec données fictives et interception de tous les services distants. Les builds et contrôles TypeScript font partie de la validation ; ces tests isolés ne constituent pas la recette connectée de préproduction.

## Sources de cadrage

- Décisions explicites de la conversation « Cadre réglementaire commissionnaire » du 5 novembre 2026 ; dossier d’adaptation v1.0 et registre des décisions v1.3 du 4 novembre pour les contraintes conservées.
- [BOFiP — intermédiaires transparents et opaques](https://bofip.impots.gouv.fr/bofip/323-PGP.html).
- [BOFiP — mandat de facturation](https://bofip.impots.gouv.fr/bofip/1525-PGP.html).
- [Stripe — Merchant of record](https://docs.stripe.com/connect/merchant-of-record), notamment Destination charges avec `on_behalf_of` pour le vendeur connecté.
- [Stripe — création d’une session Checkout](https://docs.stripe.com/api/checkout/sessions/create).

Ces références encadrent les contrôles techniques ; les contrats effectifs, régimes fiscaux et capacités du prestataire doivent correspondre à l’opération réelle.
