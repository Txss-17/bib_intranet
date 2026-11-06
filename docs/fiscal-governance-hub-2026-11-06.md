# Pilotage fiscal et réglementaire BIB

Le module `finance.fiscal` centralise les fiches par flux, le sous-registre des risques fiscaux, les révisions documentaires et le suivi déclaratif. Les décisions du 5/6 novembre 2026 restent la référence métier : marchand acheteur fournisseur et vendeur client ; BIB mandataire transparent ; boutiques propres de l’EI traitées en principal. Le registre prépare les dossiers ; il n’émet pas de facture, n’effectue pas de dépôt fiscal et n’exécute pas de paiement.

## Accès par pôle

| Pôle | Route contextualisée |
| --- | --- |
| Finance | `/pole/finance/fiscal` |
| Conformité & Juridique | `/pole/compliance/fiscal` |
| Fournisseurs & Produits | `/pole/supplier/fiscal` |
| Opérations & Logistique | `/pole/ops/fiscal` |
| Marketplace | `/pole/marketplace/fiscal` |
| Support & Customer Success | `/pole/support/fiscal` |
| Produit & Engineering | `/pole/product/fiscal` |
| Security & IT | `/pole/security/fiscal` |
| Direction | `/pole/direction/fiscal` |

Toutes ces routes résolvent le même module canonique et les mêmes dossiers. Chaque pôle voit son périmètre initial ; le filtre comprend les fiches qu’il pilote et celles auxquelles il contribue. Les vues restent filtrables par entité, activité, flux, pôle, niveau de risque et qualification. Les noms des responsables restent à affecter, sans faux collaborateurs ni validations présumées.

Les `access_permissions` enregistrées restent prioritaires via le moteur existant. Les lectures/écritures et la validation sont contrôlées côté serveur. Les comptes d’essai sont séparés des données réelles. Le registre général Conformité conserve ses dossiers et pointe vers le sous-registre fiscal.

## Contenu initial

- 8 flux : approvisionnement, vente client, services BIB, logistique, Stripe, boutiques tests EI, retours/avoirs et passage EI–SASU.
- 10 risques évalués initialement : séparation des revenus, responsabilité PSP, requalification, propriété des stocks, TVA, PA, DAC7, historique EI, régularisations et accès aux pièces. Les scores bruts sont des évaluations initiales à revoir ; aucune maîtrise résiduelle n’est présumée.
- 8 fiches documentaires de révision, dont BIB-30/31/32/33, contrats, conditions partenaires et gouvernance PA.
- 10 obligations/prérequis ; dates légales, objectifs internes et dates à déterminer restent distincts.
- 4 scénarios pédagogiques de première déclaration et exemples chiffrés modifiables, sans simulation automatique de taux de cotisations.

Chaque flux décrit les parties et rôles, le propriétaire des biens, le payeur, la facture, la TVA et les déclarations. « Confirmé » signifie décision sourcée, pas intégration opérationnelle ou validation fiscale générale. Les échéances dépendant du début d’activité ou de la clôture ne sont pas inventées. Le cas de l’EI existante n’est pas assimilé à une nouvelle création après la première vente.

## Pièces et exports

L’intranet utilise `intranet-drive`, l’import des documents depuis Drive BIB et les exports CSV/PDF existants. Les liens externes restent soumis aux droits du document d’origine. La fiche de révision ne réécrit pas un document source et ne lui attribue pas une version fictive. Les sources officielles consultées le 6 novembre 2026 figurent dans les fiches ; elles doivent être recontrôlées à la date de l’opération.

## Enregistrement et validation

La migration `0088_fiscal_governance_hub` ajoute un catalogue de référence daté, les suivis par environnement et un journal inaccessible en écriture directe aux utilisateurs. La révision attendue et un verrou transactionnel protègent les mises à jour concurrentes. Les dépendances inconnues, sur soi-même ou circulaires sont rejetées.

Pour passer à « Validé » dans l’intranet : responsable nominatif, tous les contrôles effectués, justificatif et dépendances validées. Une fiche enregistrée « En revue » doit être validée par une autre personne habilitée ; le valideur ne peut pas changer le contenu de fond et l’approuver en même temps. Le suivi autonome privé publié pour consultation utilise son propre registre et ne se synchronise pas implicitement avec la base Intrabib.

## Vérification et mise en service

Le composant partagé est construit et vérifié par TypeScript dans la publication privée. Les API du suivi autonome sont testées en isolation avec SQLite et stockage simulé : persistance, révision concurrente, prérequis, dépendances, CSRF, séparation des utilisateurs, pièces et journal. Le test PostgreSQL `tests/intranet/fiscal-governance-hub.test.mjs` exécute la vraie migration et les RPC avec PGlite : droits, isolation des essais, conflits, validation indépendante, journal et dépendances. La revue des écrans vérifie les filtres par pôle, les rôles et les scénarios.

La présence du code dans `main` ne prouve pas l’application de la migration ou la disponibilité de la base raccordée. Appliquer uniquement la nouvelle migration sur une préproduction identifiée et sauvegardée, contrôler les droits enregistrés, l’accès Drive et les parcours à deux personnes, puis suivre le processus de mise en service existant. Ne pas rejouer les anciennes migrations Supabase. Aucune migration distante ni transaction financière n’a été exécutée pour ce lot.
