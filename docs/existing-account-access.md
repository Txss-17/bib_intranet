# Accès des comptes existants

La migration `0052_restore_existing_account_access.sql` répare les identités historiques sans recréer de compte. Elle vient après 0051, sur le socle et les migrations RH déjà installés. Appliquer la migration avant le frontend correspondant, avec la procédure habituelle et la revue sur une copie de la base. Aucun changement n’a été appliqué à l’environnement publié pendant cette correction.

## Régressions corrigées

Le contrôle ajouté dans 0044 exige un profil actif d’origine `connect`. Des collaborateurs avaient conservé la valeur historique `bos`, créée par défaut dans l’ancien schéma. Leur rôle technique ou leur poste et leurs pôles permettaient auparavant de les reconnaître comme employés. La réparation change l’origine uniquement pour les profils présents au moment de la migration, actifs, portant ces preuves RH en base ou une affectation interne active et non expirée. Elle n’utilise pas les métadonnées modifiables d’un utilisateur Auth.

La reprise des champs protégés est une instruction atomique du propriétaire de migration, avec le verrou de table conservé jusqu’au commit et le garde d’autorisation rétabli dans la même instruction. Elle fonctionne aussi quand ce propriétaire n’est pas superutilisateur.

Les pôles manquants sont complétés uniquement à partir des rôles internes déjà attribués et actuellement valables. Les pôles renseignés restent conservés. Cela rétablit aussi les anciennes politiques de ligne qui lisent directement les pôles du profil. L’origine, le statut et les pôles avant/après sont consignés dans `intranet_legacy_access_repairs`, accessible en lecture au service d’administration de base uniquement.

La résolution des permissions reconnaît le `position_key` protégé enregistré par les RH avant l’inférence à partir de l’ancien poste. Un poste historique connu sans entrée correspondante dans le catalogue, notamment `rse_impact_manager`, conserve sa matrice de pôle et de séniorité. Les anciens pôles `tech`, `lifecycle` et `risk` restent compatibles avec les périmètres reconnus par `intranet_poles_match`. Un rôle attribué en cours reste utilisable sans poste connu ; ses permissions enregistrées priment et ses pôles servent de secours si ceux du profil sont absents.

Le rôle `directeur_marketplace`, omis des listes par défaut de huit pages de son propre pôle, y est reconnu. Un refus enregistré sur ce rôle reste prioritaire.

Les comptes suspendus ou inactifs, les affectations expirées, futures, révoquées ou en attente, les rôles désactivés et les comptes Platform sans preuve RH ne sont pas réactivés. Un profil sans poste historique reconnu ni rôle valable reste à qualifier par les RH. Une affectation existante mais révoquée ne retombe jamais sur l’ancien poste. Les restrictions de lecture seule, les refus explicites, les restrictions de page et le cloisonnement réel/test restent appliqués. Aucun mot de passe, adresse, utilisateur Auth, rôle technique ou permission enregistrée n’est changé.

## Connexion et chargement

La lecture du profil démarre dans une tâche d’événement distincte du rappel Auth. Une requête de profil ou de permissions qui reste bloquée est interrompue après quinze secondes et permet une reprise. Une réponse tardive d’un compte précédent ou d’une tentative expirée ne remplace pas le profil courant.

Les protections de route distinguent désormais le chargement, une erreur avec « Réessayer » et un refus explicite. Le serveur reste l’autorité ; aucune matrice locale ne remplace un appel en erreur. Les pages Travail et RH attendent leur propre service de permissions. Si les RPC du socle n’ont pas encore été installées, publier uniquement le frontend ne suffit pas : installer d’abord les migrations précédentes nécessaires et 0052.

## Vérification

`tests/intranet/existing-accounts.sql` reproduit les refus avant réparation puis vérifie les douze postes historiques, l’administrateur existant, un poste personnalisé avec rôle attribué, le poste précis RH, les anciennes appellations de pôles et la création effective d’un dossier RSE. Le scénario vérifie les révocations et refus enregistrés, le journal de réparation privé, les comptes étrangers ou suspendus, la lecture seule et la séparation des dossiers réels et de test. Toutes les données sont synthétiques et la transaction est annulée.

Les tests clients couvrent la restauration de session, les changements de compte, les requêtes expirées, les réponses tardives, les droits attribués avec un poste inconnu, les erreurs de RPC, la reprise et les refus de route. La CI exécute aussi le scénario SQL avec PostgreSQL 17.

Après application sur l’environnement choisi, vérifier un compte existant de chaque pôle et un administrateur, avec une reconnexion ou « Réessayer ». Contrôler le nombre de profils réparés via `SELECT reason,count(*) FROM public.intranet_legacy_access_repairs GROUP BY reason;`. Ce nombre dépend des données de cet environnement ; les tests locaux ne prétendent pas mesurer les comptes publiés.
