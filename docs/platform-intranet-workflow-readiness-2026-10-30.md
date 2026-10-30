# BIB — Contrôle des workflows Platform ↔ Intranet
État de revue du code : 30 octobre 2026. Les statuts ci-dessous concernent **les dépôts**, pas les services publiés.

## Principes de contrôle
- Platform et Intranet utilisent deux bases Supabase distinctes. Les identifiants UUID canoniques sont préservés ; ne pas rapprocher les marchands par nom ou email.
- Platform reste source des marchands, boutiques, commandes et dossiers de personnalisation marchands. L'Intranet reste source des décisions de validation et des données internes.
- Les opérations privilégiées passent par les fonctions privées `intranet-export`, `intranet-import` et `platform-bridge`. Le navigateur n'accède pas directement aux tables privilégiées de l'autre application.
- Chaque flux doit gérer autorisation, version, répétition sans doublon, échec partiel, statut consultable et journal de décision. Un succès de transport n'est pas une exécution métier présumée.
- La livraison doit être organisée par BIB et ses partenaires. Le marchand reste responsable juridique de la vente, des garanties et du remboursement selon les règles applicables.

## Matrice des flux vérifiés dans les sources

| Flux | Source autoritative | Code identifié | Vérification avant mise en production |
| --- | --- | --- | --- |
| Identité marchand / boutique | Platform | Export complet ; rapprochement intranet par UUID, snapshots horodatés | Boutique test et propriétaire corrects, relecture, concurrence |
| Candidature fournisseur | Platform (onboarding) | Export `supplier_applications` | Création → qualification Fournisseurs → retour au partenaire |
| Catalogue produit fournisseur | Intranet | `push_product` vers Platform, conditions et statut distincts | Produit actif, scope fournisseur, droits, rejets |
| Personnalisation marchande | Platform → Intranet → Platform | `customization_requests` et `review_customization` versionnés | Dossier modifié, demande de changement, refus, réponse versionnée |
| Réassort marchand | Platform → Intranet → Platform | `restock_requests`, `review_restock` | MOQ, approbation/refus, reprise et aucun crédit stock implicite |
| Commande client | Platform | Export incrémental des commandes ; import `orders` Intranet | Nouvelle commande, statut, boutique, quantités, paiement différé |
| Affectation à partenaire logistique | Intranet → Platform | `assign_shipment` et fonction protégée d'affectation | Partenaire autorisé, commandes réelles, absence d'expédition directe |
| Stocks et réception | Parcours logistique protégé | `stock_receipt` et contrôles de stock côté Platform | Réception physique prouvée ; prévention des doubles crédits |
| Ticket de support | Platform | Export `tickets` et suivi Intranet | Attribution, communication, résolution, retour de statut |
| Litige / SAV et garantie | Marchand premier responsable ; coordination BIB | Dossiers internes Support/Conformité, suivi des litiges | **Vérifier l'implémentation effective de l'escalade 48 h et l'éligibilité assurance** ; ne pas présumer une substitution légale |
| Abonnements et droits | Platform | Export `subscriptions` ; droits liés aux webhooks Platform | Souscription, renouvellement, assurance, résiliation, état actif |
| Frais / commissions / paiements | Platform | Export financier vers `cashflows` (upsert stable) | Montants et devises, caractère acquis/estimé, doublons |
| Remboursements réels | Platform | PR Platform n°7 : source `order_refunds`, uniquement réussis | Préproduction : 1 remboursement partiel / total, une reprise, réconciliation Stripe |
| Versements marchands | Platform | Export `payouts` quand datés | Vérifier mode d'encaissement et Stripe Connect avant proclamation opérationnelle |
| Favoris clients | Platform | Export complet/snapshot avec remplacement idempotent | Suppression du favori, identifiants boutique/produit |
| Décision de statut boutique | Intranet → Platform | `push_shop_status` + RPC Platform | Validation/activation/suspension et permissions |
| Données documentaires | Intranet / Workspace BIB | Drive géré et approbations serveur | Délégation Workspace réelle, filigrane, partages, retrait d'accès |
| Envoi externe Gateway | Intranet | Outbox versionnée et travailleur Gmail | Dédoublonnage, approbation distincte, confirmation transport |
| Points Circular | Non actif | Suivi interne de préparation | Aucun crédit de points par dossier RSE ; produit à développer avant lancement |
| Supervision de la liaison | Intranet | `platform_sync_runs` et journal logistique distinct | Vérifier droits de lecture et erreurs de synchronisation réelles |

## Bloquants avant lancement
1. **Identités et accès collaborateurs** : PR Intranet n°20 toujours non fusionnée à la date de revue. Vérifier migrations et tests des deux comptes existants, ainsi que les révocations.
2. **Régression typage** : PR Intranet n°21 restaure les champs de schéma supprimés lors d'une régénération Lovable ; fusion contrôlée avant les autres branches.
3. **Spécialisation des pages** : PR Intranet n°22 introduit le premier lot de 14 définitions métier ; la correction doit préserver les dossiers historiques et la cohérence SQL.
4. **Remboursements** : PR Platform n°7, validation Stripe→Platform→Intranet sur sandbox avant production.
5. **Frontière sandbox/live Platform** : isolation côté serveur à confirmer ; aucun test ne doit pouvoir déclencher une opération logistique réelle.
6. **Cycle de commande et encaissement marchand** : vérifier modèle de commande par boutique, reversement et frais réels, et scénario d'annulation.
7. **Automatisation de synchronisation** : le flux `pull` est disponible à l'appel ; la programmation, les alertes et la reprise autonomes ne sont pas présumées en production.

## Recette terminale imposée
Pour chaque flux, conserver la preuve de :
- identité et rôle de l'acteur autorisé, puis refus du rôle non autorisé ;
- entrée source identifiée, idempotency key ou version et payload validé ;
- résultat dans la base cible, sans données internes non prévues ;
- duplication/rejeu et conflit, puis échec réseau et reprise ;
- retour du statut à l'interface concernée et audit horodaté ;
- séparation environnement test/réel ;
- vérification sur base isolée avant activation des véritables partenaires.

**Aucune preuve de déploiement effectif ne peut être inférée d'une migration versionnée, d'une CI verte ou d'une PR fusionnée.**
