# Module Travail

Les pages Projets, Processus, Validations et Escalades utilisent leurs tables métier existantes. Elles partagent maintenant les contrôles de cycle de vie de `0045_work_module_lifecycle.sql` et les composants `WorkModulePage` et `WorkHistoryCard`. La page Support → Escalades ouvre le même parcours sur le pôle Support.

| Parcours | Actions et règles |
| --- | --- |
| Projets | Créer en planification, attribuer un responsable, modifier le contenu et l’échéance, activer, suspendre, terminer ou annuler. L’annulation exige un motif. Une réouverture en planification exige le droit de validation et un motif. |
| Processus | Rédiger les étapes en brouillon, publier avec le droit `publish`, retirer ou repasser en brouillon avec un motif. Une procédure active exige au moins une étape ; son contenu publié reste verrouillé. Les procédures actives sans pôle sont lisibles par les collaborateurs autorisés, celles d’un pôle par son équipe. |
| Validations | Soumettre une demande à un validateur actif, habilité et distinct du demandeur. Le contenu soumis est figé ; le validateur peut être réaffecté avant décision. Seul le validateur désigné peut approuver ou rejeter. Le rejet exige un motif ; le serveur fixe la date et l’auteur de décision. |
| Escalades | Ouvrir un blocage, désigner un responsable, prendre en charge, puis résoudre avec un compte rendu. Le responsable désigné ou le responsable habilité du pôle prend en charge et résout. La réouverture exige un motif et conserve la résolution précédente dans l’historique. |
| Archivage | Le droit `delete` autorise l’archivage, qui conserve la fiche et ses événements. Les suppressions physiques depuis le navigateur sont refusées. Les archives restent consultables par filtre et par lien direct. |
| Activités | Événements réels des quatre parcours, historique des tâches et commentaires ; recherche, filtre par type et pagination de 50 événements. Les liens ouvrent directement la fiche correspondante. |

Les attributions et les décisions déclenchent des notifications dans l’intranet. Les mutations rafraîchissent les fiches, les journaux, le fil d’activité et les notifications. Les tâches archivées restent consultables sans formulaire de commentaire ni modification.

## Droits et intégrité

Les droits enregistrés dans Rôles & Permissions priment sur la matrice de secours. Ils sont relus au moment de chaque écriture. Les responsables disponibles à l’attribution doivent disposer des droits du parcours et appartenir au même environnement réel/test. La décision d’une validation passe par une RPC dédiée : un utilisateur disposant de `read` et `validate` peut décider sans recevoir un droit général de modification.

Chaque modification transmet la révision d’origine ; une révision périmée échoue sans écraser celle d’un collègue. Une création réessayée après une interruption conserve sa clé jusqu’à confirmation : elle retrouve la première fiche et refuse une charge utile différente sous la même clé. Les identités, horodatages de décision et dates de résolution sont contrôlés par le serveur.

Les événements sont append-only et ne sont lisibles que si la fiche source reste accessible. Les événements de tâches et commentaires respectent également la politique de ligne de leur tâche. Les fiches déjà présentes gagnent un événement explicite « État existant repris », sans reconstruction de décisions passées. Les anciennes fiches créées par un compte de test sont classées dans l’environnement de test.

## Comptes de test et identité documentaire

`0044_intranet_identity_and_test_isolation.sql` empêche un compte de test d’utiliser les anciennes fonctions RH et d’accéder aux tables réelles dépourvues de partition de test. Sur les tables partitionnées, les environnements sont distincts. Les champs d’autorité du profil, notamment l’adresse électronique et l’origine de l’application, ne sont pas modifiables librement par le titulaire.

Le provisionnement de test exige un administrateur Connect réel et actif. Les 114 spécifications sont fixées côté serveur et comparées au catalogue de rôles ; les champs d’identité envoyés par le navigateur sont ignorés. Une adresse réservée appartenant à une identité non vérifiée bloque tout le lot avant création. Réutiliser un compte de test ne réinitialise pas son mot de passe. La configuration du profil et du rôle est atomique, idempotente et journalisée ; les échecs ne sont pas annoncés comme des succès.

La délégation Drive utilise l’adresse confirmée dans Auth et exige sa correspondance avec le profil. Une adresse modifiée uniquement dans le profil ou dans les métadonnées du navigateur n’autorise pas la délégation d’un autre compte Workspace.

## Vérification

`tests/work-module/workflow.sql` vérifie les parcours complets, les motifs, le gel des contenus, les révisions périmées, la reprise des fiches existantes, les notifications, les permissions révoquées, la validation sans droit général de modification et le cloisonnement réel/test. `tests/intranet/identity.sql` vérifie les protections d’identité, les chemins RH et le provisionnement atomique. Les tests Node exécutent les gestionnaires de provisionnement et de Drive avec des doubles de services, ainsi que les reprises et appels du client Travail. Aucun service externe n’est appelé par ces tests.
