# BIB Intranet — spécialisation des espaces métier, lot 1

Date : 30 octobre 2026. Branche : `codex/specialize-intranet-workspaces-20261030`.

## Objectif

Les registres de dossiers demeurent mutualisés pour l'authentification, la journalisation,
les pièces gérées, les droits et le cycle de validation, **mais chaque page doit avoir un
périmètre, un vocabulaire et des champs distincts**. Ce lot cible 28 pages dont les
formulaires partageaient une définition de pôle malgré des usages différents.

| Pôle | Pages revues | Règles spécifiques |
| --- | --- | --- |
| RSE | Recyclage, Emballages, Impact CO₂, ESG, Points clients | Sources de mesure, méthode, preuve ; le programme de points reste non activé |
| Marketing | Contenus, Podcasts, Analytics | Droits des médias, validation éditoriale, diffusion prouvée, attribution des chiffres |
| Sécurité | VPN, Environnements, Infrastructure, Documentation, Code, Console | Justification des accès, preuves techniques, changements autorisés, revues et rollback |
| Produit | Intégrations, Studio, Innovation, Documentation | Contrat API, conception, essais, recherche et contrôle des sources documentaires |
| Support | Onboarding, Conformité | Références Platform/Conformité, suivi client et transmission au pôle compétent |
| Audit | Rapports, Sanctions | Périmètre, preuves, propositions proportionnées, décision séparée |
| Finance | Facturation, Transactions, Abonnements, Fonds de garantie | Montants et justificatifs, aucune émission ni virement automatique |
| Conformité | Politiques, Registre des risques | Référentiels, version de politique, exposition et contrôles de risques |

## Compatibilité

- Les champs existants (clés, types et obligations) sont **conservés** : aucune suppression
  ou réécriture des dossiers antérieurs.
- Chaque page reçoit quatre champs additionnels, facultatifs, adaptés à son objet.
- L'interface affiche explicitement si la validation d'un dossier est **seulement administrative** :
  elle n'opère pas de crédit de points, publication, provisionnement VPN, déploiement,
  création de compte, activation du bridge ou clôture automatique des non-conformités.
- L'application et la base doivent disposer **des mêmes champs autorisés** : le
  serveur rejette les clés de payload inconnues. Ne pas publier seulement le frontend.

## Déploiement différé

Appliquer sur la base de **préproduction** après les migrations existantes, dont
`0052_restore_existing_account_access.sql`, la migration
`0053_specialize_intranet_workspaces.sql`. Tester les anciens dossiers et les
nouveaux champs, puis déployer le frontend lorsque l'ensemble des modules et flux
Platform est stabilisé. Aucune migration, fonction, ni permission n'est modifiée
sur l'environnement publié par ce lot.

## Tests

`npm run test:intranet` vérifie les 28 contrats et la concordance entre le registre
frontend et la migration ; la CI exécute typage et build. La recette manuelle doit
encore vérifier un vrai dossier par page, deux profils de droits différents,
les validations, documents et cas d'erreur sur base de préproduction.

## Prochaines étapes

1. Vérifier les autres pages spécifiques et les navigations transversales : chaque bouton doit agir sur une ressource persistante ou annoncer clairement une limitation.
2. Éliminer les actions non fonctionnelles et raccorder les indicateurs aux sources autoritatives.
3. Flows Platform → Intranet → Platform : événement, provenance, ID canonique,
   contrôle d'accès, statut, reprise, idempotence, alertes.
4. Tester comptes CEO/RH et sessions réelles après correction de l'accès
   (PR n°20) sans réactiver les comptes révoqués.
