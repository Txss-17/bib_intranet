# Mutation RH d’un compte existant

L’onboarding distingue la création d’un nouveau compte et la mutation d’un collaborateur déjà présent. La mutation sélectionne une identité UUID réelle ; l’email et le nom restent en lecture seule et ne servent jamais à rattacher un autre compte.

Le formulaire utilise les postes, pôles et rôles réels du catalogue. Il affiche les affectations actuelles avec leurs identifiants, demande de cocher celles à remplacer et présente les accès conservés. Les privilèges techniques user_roles restent inchangés. Les comptes administrateurs techniques sont exclus du parcours standard. Un RH sans privilège administrateur ne peut pas attribuer le pôle direction ni muter un titulaire de cette autorité.

## Parcours

1. Sélectionner le compte actuel et vérifier la fiche, les rôles et les documents.
2. Préparer la classification et la date d’effet, choisir un référent RH, cocher les affectations à remplacer puis confirmer cette revue.
3. Soumettre le dossier ; les accès actuels restent effectifs.
4. Un RH disposant du droit validate examine la décision et les identifiants exacts des affectations. Un refus exige un motif.
5. Un RH disposant de validate et update applique la mutation à partir de sa date d’effet. Aucun nouveau compte ni aucune invitation ne sont créés.

Les droits enregistrés de rh.onboarding sont contrôlés par le serveur à chaque action, avec la matrice de séniorité RH comme recours seulement quand aucune permission de page n’est enregistrée. La simulation ne peut que restreindre les droits réels. Une auto-mutation est interdite, y compris pour un administrateur.

## Intégrité

La sélection conserve la révision d’origine. Un changement de profil, document ou affectation avant la soumission exige une nouvelle sélection. Le dossier garde ensuite l’instantané du profil, des affectations, des privilèges techniques et du rôle demandé. L’application verrouille les données et refuse tout instantané devenu obsolète ; un refus motivé permet de fermer un dossier périmé et d’en préparer un autre.

Le retrait des seules affectations cochées, la nouvelle affectation, le profil, les documents, l’historique et l’état terminé sont enregistrés dans une transaction. Une erreur annule l’ensemble. Les affectations non cochées restent intactes, y compris celles dont le rôle a été supprimé. Une reprise identique ne multiplie ni les dossiers ni les droits.

Les documents d’onboarding omis de la nouvelle liste sont archivés ; les pièces manuelles restent conservées. Les informations professionnelles dans Settings sont lues depuis le profil RH et le dernier dossier terminé, par un service limité au compte connecté. Les notes privées RH ne sont pas retournées. Les noms, contacts et avatars personnels gardent leur parcours existant.

La création d’un nouveau compte exige aussi une preuve privée à usage unique, valable cinq minutes et liée au dossier validé ainsi qu’à l’email. Le déclencheur Auth la consomme pendant l’insertion du compte, avant que GoTrue renseigne invited_at ; les métadonnées seules ne permettent aucune inscription autonome. La fonction vérifie aussi les identités Auth existantes, y compris non confirmées, avant l’invitation. Une réponse d’invitation doit porter le dossier exact et le nonce frais de cette tentative avant toute écriture de profil ou d’accès. Un compte déjà présent doit passer par sa sélection UUID dans la mutation.

## Intégration et contrôles

Le code serveur 0034 a déjà été intégré séparément ; il reste à l’inscrire dans l’historique Drizzle et à intégrer les réparations suivantes 0035 et 0036. Ne pas modifier ou rejouer les anciennes migrations déjà appliquées. Vérifier les prérequis Supabase existants : catalogue des postes et position_key, clé access_assignments.employee_id vers profiles.id, colonne assigned_by, documents RH et garde du profil 0032. Appliquer dans l’ordre les seules migrations absentes 0034, 0035 et 0036, puis déployer provision-employee-account et le frontend.

Une correction syntaxique minimale de 0034 permet son installation neuve ; la fonction corrigée est aussi répétée dans 0035 pour les installations partielles. La réparation 0035 prend en charge les tableaux de pôles enum, les affectations orphelines et les rejets de dossiers obsolètes. Les tests utilisent ces types et ces contraintes, puis les migrations 0032, 0034 et 0035. La fixture d’invitation vérifie aussi 0036 et l’insertion Auth avant invited_at. La CI exécute les tests du contrat, le vrai handler de provisionnement avec des clients simulés, le parcours PostgreSQL et ses annulations, le typage de la frontière serveur et de l’application, puis la compilation.

Si le frontend ou la fonction Edge sont publiés avant les nouveaux services SQL, le parcours échoue avant l’invitation plutôt que de contourner les droits.

Cette modification ne déploie aucune fonction et ne modifie pas la base publiée. La recette avec un vrai compte RH et un collaborateur reste à effectuer après intégration et déploiement.
