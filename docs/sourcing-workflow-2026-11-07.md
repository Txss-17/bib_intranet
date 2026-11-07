# Intrabib — Missions de sourcing Fournisseurs et Logistique
Date : 7 novembre 2026

## Décision métier
Le sourcing est une activité permanente, indépendante du nombre de partenaires déjà référencés : prospection proactive, recherche à la demande d'un marchand et recherche de substitution en cas de défaillance. Aucun plafond de candidatures ou de partenariats. La sélection pour exploitation réelle reste régie par les vagues opérationnelles, à part.

## Fonctionnalités dans la PR
- Migration 0092 : `bib_sourcing_missions` et `bib_sourcing_candidates`, avec statut, responsable, priorité, référence marchand, observations, comparaison, preuves et isolation de l'environnement test.
- Gestion par les permissions du pôle : Fournisseurs (`supplier.applications`) et Logistique (`ops.partners`).
- UI `SourcingWorkspace` ajoutée aux vues Fournisseurs → Candidatures et Logistique → Partenaires.
- Création de mission et de prospect, décision de comparaison avec référence justificative obligatoire pour « présélectionné » ou « non retenu ».
- Aucun changement automatique de statut fournisseur/logisticien, contrat, produit, audit, transaction, commande ou activation pilote.

## Étapes suivantes
1. Intégrer le sourcing depuis les demandes marchands avec liens d'identifiants métiers, sans utiliser le seul nom de produit/partenaire.
2. Ajouter outils de comparaison chiffrée (MOQ, prix total livré, zone, SLA, capacité) et workflows de relance avec calendrier/notifications.
3. Convertir un prospect présélectionné en dossier de candidature par une action explicite et auditée, avec contrôle anti-doublon.
4. Mesurer la qualité : temps de recherche, délai de réponse, taux de partenaires qualifiés, coût moyen, substitution réussie.
5. Compléter les contrôles SQL/RLS, les tests de concurrence, les reprises et les preuves de rollback sur base de préproduction isolée.

## Dépendances de livraison
Migration 0092 sur main après réconciliation du registre 0089 (PR #56) et 0091 (PR #58) encore ouverts. Ces deux migrations manquantes dans le journal actuel doivent être ordonnées avant exécution ; ne pas déployer 0092 isolément. Aucun secret activé, aucune migration distante ni déploiement production dans ce lot.
