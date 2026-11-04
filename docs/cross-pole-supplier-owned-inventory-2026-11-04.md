# Intrabib — responsabilité transversale sur les produits et stocks

## Répartition des pôles
- **Fournisseurs** : identités et contrats, stocks/capacités conservés chez les fournisseurs, MOQ, disponibilité vérifiée, commande d'achat marchand et engagements du fournisseur. Validations produits et demandes anticipées sont indépendantes.
- **Produit / R&D** : référencement et conformité de la référence, options de personnalisation et conditions de production. Aucune création de stock par simple validation.
- **Opérations & Logistique** : stocks effectivement confiés aux partenaires, emplacements, réservations, entrées, sorties, transferts, retours, expéditions, preuves de réception, délais fournisseurs. Le stock partenaire n'est pas l'ensemble du stock fournisseur.
- **Qualité & Audit** : échantillons, vérifications produits, quarantaine ciblée, non-conformités et autorisation de remise en circulation. Une validation qualité n'est ni un achat ni une entrée de stock.
- **Finance** : rapprocher commande client, paiement Stripe, achat fournisseur par le marchand, prestations/commissions BIB, facture marchand, règlement fournisseur et reversement. Ne jamais comptabiliser un stock non acquis comme actif BIB.
- **Direction** : arbitrage des politiques de sourcing et de contrôle ; pas d'activation commerciale sans PSP et contrats réellement opérationnels.

## Invariants
1. Référencement ≠ stock acheté ; validé ≠ disponible ; approuvé en réapprovisionnement ≠ physiquement reçu.
2. Fournisseur propriétaire des unités avant transfert juridique contractuel ; marchand vendeur et acheteur juridique des unités à vendre ; BIB ne préachète pas en phase micro.
3. Toute disponibilité fournisseur doit avoir une source et un horodatage. Aucun stock fictif ou inventaire créé par défaut.
4. Ne jamais mélanger `partner_stocks` et la disponibilité fournisseur. Réservations à déduire pour signaler une rupture opérationnelle.
5. Une correction de stock partenaire exige une justification, une référence, le contrôle des quantités réservées et un événement atomique. La migration `20261104140000_atomic_partner_stock_adjustments.sql` doit être appliquée avant l'utilisation du nouvel écran.
6. Le flux de vente à la demande nécessite encore une liaison fournisseur fiable, une réservation de capacité et un achat marchand au déclenchement de la vente. La partie checkout Platform n'est pas encore opérationnelle pour cette modalité.

## Contrôles de recette
- Lecture selon RLS Supplier/Ops ; aucun accès élargi par les nouveaux tableaux.
- Ajout du produit marchand sans mouvement stock, réception contrôlée séparément, disponibilité fournisseur inconnue non présentée comme rupture ou disponible.
- Réservations déduites du stock partenaire ; seuils d'alerte corrects.
- Ajustement concurrent, quantité inférieure au réservé, absence de motif, acteur non autorisé : refus transactionnel et aucun mouvement écrit.
- Mouvement validé : quantité mise à jour une seule fois et journalisation en base.
- Synchronisation et traitement des commandes fournisseurs : à spécifier/tester avant activation d'achats à la demande réels.
