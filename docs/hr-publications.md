# Publications internes RH

La page Ressources Humaines → Publications internes utilise les lignes type hr de la table publications existante. Les exemples et compteurs de vues ont été retirés. Elle permet de lire le texte intégral, rechercher et filtrer, enregistrer un brouillon, modifier une publication, publier et archiver. Les compteurs portent sur les 200 communications les plus récemment modifiées. Les erreurs conservent le formulaire et permettent la reprise.

## Droits et diffusion

La navigation et le catalogue des permissions utilisent rh.publications. Les droits sont calculés par le serveur et utilisés dans l’interface : permissions sauvegardées des rôles affectés actifs ; sans affectation, rôle historique dont le poste et les pôles sont compatibles avec le catalogue ; puis matrice de séniorité RH seulement en l’absence de droits sauvegardés. Une action absente d’une page sauvegardée est refusée. Les affectations révoquées ou expirées ne permettent pas de revenir à la matrice. L’administrateur technique conserve son accès complet. La simulation peut seulement restreindre les droits réels.

Créer/modifier un brouillon exige create/update. Modifier tout contenu déjà publié, programmé ou archivé et effectuer toute transition hors brouillon exige aussi publish. Les écritures directes client de type hr sont bloquées ; le service de sauvegarde impose le type et l’auteur et ne permet aucun changement vers une autre catégorie de données.

Une politique restrictive protège les brouillons, archives et dates futures des lecteurs ordinaires même si les anciennes politiques générales sont permissives. Une publication libérée respecte son audience. Les nouvelles communications proposent tous les collaborateurs ou des pôles choisis dans le catalogue actuel ; les anciennes audiences user, subsidiary et role conservent leur contrôle de lecture. Une audience historique non prise en charge par le formulaire doit être explicitement remplacée avant sauvegarde.

Le feed commun filtre les contenus réellement publiés et disponibles, y compris pour un lecteur RH disposant des droits de gestion. Il permet de développer le corps du texte et expose une erreur de chargement. Les données de publications sont mises en cache par utilisateur.

## Concurrence et reprise

La modification verrouille la ligne et exige son updated_at original. Le timestamp des seules communications RH est monotone même avec l’ancien déclencheur générique. Une saisie obsolète est refusée sans écrasement. La création porte une clé stable conservée pendant les reprises : une confirmation réseau perdue ne crée pas de doublon. Une autre saisie avec la même clé est un conflit.

Le texte est affiché comme texte simple. Les limites sont titre 255, résumé 1000 et corps 20000 caractères. Le contenu est obligatoire à la publication. Aucune nouvelle programmation automatique ni notification de livraison n’est annoncée ; les anciennes lignes programmées restent consultables par les RH et exigent un choix explicite pour publier maintenant, revenir au brouillon ou archiver.

## Intégration et validation

Appliquer les migrations drizzle/migrations/0031_hr_publications.sql et 0032_protect_profile_authorization_fields.sql puis 0033_hr_publication_access_repair.sql après vérification de l’historique, puis publier le frontend. Elle dépend du schéma publications existant, des profils et du catalogue RBAC. Elle n’insère aucune communication de démonstration. Cette PR ne modifie pas la base publiée.

GitHub Actions exécute les tests de validation et des dates du feed, le contrôle du rôle historique par rapport au catalogue, les tests PostgreSQL des permissions et audiences, les protections d’écriture, les conflits et la reprise, puis le typage et la compilation. La fixture SQL exige une base de test vide et annule sa transaction.

La migration 0032 protège les champs qui déterminent les droits du profil : un collaborateur ne peut pas changer ses propres pôles, poste ou séniorité par une écriture directe. Les informations personnelles ordinaires restent modifiables selon les règles RLS existantes ; les RH continuent d’administrer les collègues, et les administrateurs et le service de provisioning conservent leurs droits.

La migration 0033 est un correctif en avant pour un environnement qui aurait déjà enregistré une première version de 0031 : elle rétablit le contrôle du rôle historique et l’accès des destinataires autorisés sans rejouer les anciennes migrations. Les tests simulent aussi cet état initial.
