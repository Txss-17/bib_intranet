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

## Extension de la PR #59 — qualification des besoins et des offres
- **Demandes marchands** : la mission `merchant_request` exige un identifiant de marchand présent dans `user_accounts` ; la référence libre reste facultative et ne constitue pas une identité de rattachement. La demande ne peut être créée par un agent qui n'a pas le droit de gérer le sourcing du pôle.
- **Comparaison des offres** : montant et devise de référence, MOQ, délai en jours, SLA et couverture ; saisie humaine, non calculée automatiquement à partir d'un devis contractuel. Comparer uniquement à périmètre homogène (produit/unité, frais logistiques, taxes, incoterms, services inclus).
- **Relances** : registre des actions et échéances de suivi, avec auteur, motif et statut. Le registre ne programme pas automatiquement de notification ni d'e-mail ; aucune communication externe n'est envoyée par le module.
- **Conversion en candidature fournisseur** : uniquement un prospect présélectionné, explicitement demandé et justifié, soumis au contrôle de doublons (même e-mail et même entreprise). Un brouillon `supplier_applications` est créé au statut `new`, `audit_accepted=false`, sans consentement présumé. L'identifiant créé est journalisé dans l'historique et relié au prospect. Conversion désactivée en sandbox car la table héritée ne distingue pas encore les comptes de test. Le parcours logistique continue par formulaire, échange et fiche des besoins ; il n'est pas converti automatiquement en partenaire actif.
- **Avant utilisation réelle** : vérifier l'autorisation du contact e-mail et la conformité RGPD/prospection B2B, les exigences de preuve de l'accord de mise en relation, ainsi que les permissions transversales de lecture des comptes marchands. Les opérations de sourcing n'ont aucun effet sur les achats, stocks, contrats, catalogues, sessions partenaires et paiements.
- **Limites restantes** : lien natif depuis le formulaire de demande marchand, notifications réelles de relance et journal immuable des changements d'évaluation doivent faire l'objet d'un développement et d'une recette spécifiques.

## Notifications automatiques de relance (PR #59)

Le registre ne se contente plus de stocker les dates de relance. La migration `0092_cross_pole_sourcing.sql` ajoute un traitement interne planifié `bib-sourcing-followup-reminders` toutes les **15 minutes** au moyen de `pg_cron`. Il recherche les échéances atteintes pour les prospects des missions actives et émet une **notification dans Intrabib à l'unique responsable de la mission** (`owner_id`). Les missions fournisseurs et logistiques suivent les mêmes règles.

- Le destinataire doit être un collaborateur Intrabib actif et de même environnement que la mission.
- Les missions clôturées/annulées, relances annulées ou remplacées, et comptes de collaborateurs inactifs sont exclus.
- La table `bib_sourcing_notification_receipts` assure une unique notification par identifiant de relance, y compris en cas de réexécution du job.
- Les notifications contiennent la mission, le prospect, l'échéance et les identifiants de traçabilité ; **aucun e-mail externe n'est envoyé automatiquement aux fournisseurs ou logisticiens**.
- La fréquence de 15 minutes décrit le scan, non une garantie d'exécution tant que le job n'a pas été déployé et exécuté sur l'environnement distant.
- La fonction de diffusion n'est pas exécutable par les utilisateurs anonymes ou authentifiés ; seul le rôle de la tâche planifiée peut l'exécuter. L'installation exige l'extension `pg_cron` ; elle échoue explicitement si elle est absente.
- Vérifier la compatibilité avec les politiques RLS des notifications, le statut des comptes, les permissions de lecture, les fuseaux des dates, les reprises après panne, la concurrence, les doublons, la séparation test/réel et la procédure de rollback.
- **État : implémenté sur une PR non fusionnée, migration distante non exécutée, job non actif en production.** Les rappels seront effectifs seulement après migrations, tests de préproduction et décision Go/No-Go.
