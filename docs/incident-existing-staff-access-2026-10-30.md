# Incident d'accès aux deux comptes historiques — 30 octobre 2026

## Portée et preuve

L'intranet Lovable (projet `577f0500-7de0-47ed-baf6-dfd8dd873217`) possède deux **comptes réels préexistants**, CEO et Responsable RH. Leurs identités Auth, e-mails confirmés, profils actifs, affectations non expirées et rôles `ceo` / `responsable_rh` ont été vérifiés sur la base accessible via Lovable. Aucun compte, mot de passe, e-mail ni rôle n'a été recréé, réinitialisé ou remplacé.

Le schéma connecté était **antérieur** aux migrations récentes : `profiles.app_origin`, `intranet_modules`, `get_intranet_permissions()` et `can_intranet_action()` y étaient absents. `useAuth.tsx` sélectionnait une colonne absente et `AuthGuard` exigeait une origine `connect` ; `permissionReadiness.ts` nécessitait une RPC absente. Ainsi, la présence de comptes valides ne suffisait pas à ouvrir l'application.

## Réparation de compatibilité réalisée sur la base Lovable

Interventions SQL transactionnelles, strictement limitées :
1. Ajout de `profiles.app_origin text NOT NULL DEFAULT 'bos'`, puis marquage `connect` **uniquement pour les deux comptes réels déjà identifiés**, après vérification de l'adresse Auth, e-mail confirmé, `test_account=false`, `hr_status=active` et rôle métier actif ; deux lignes vérifiées.
2. Installation temporaire de `get_intranet_permissions()` via les seules autorisations **déjà sauvegardées** (`access_permissions`, `access_assignments`, `access_roles`, `access_interfaces`, `access_actions`). Elle filtre les rôles expirés, révoqués, externes et inactifs, refuse explicitement les `allowed=false`, applique `read_only`, vérifie la session `auth.uid()`, l'origine `connect`, le statut actif et l'absence de marqueur test. Elle n'expose pas les données métier. `EXECUTE` autorisé uniquement à `authenticated` / `service_role`, pas à `anon`.
3. Installation d'un déclencheur `guard_intranet_origin_field` qui empêche les clients `authenticated` ou `anon` de se donner eux-mêmes l'origine `connect` (INSERT ou UPDATE). La configuration d'identité reste réservée aux opérations serveur administrées.
4. Rechargement du schéma PostgREST.

**Aucune publication/déploiement front-end et aucune écriture dans `auth.users`.** Aucune permission existante n'a été changée.

## Vérifications réussies

- Exactement deux profils réels `connect` et zéro compte test `connect`.
- Authentification et adresse confirmées pour chacun, ni suspension ni expiration d'affectation.
- Simulation de session SQL : `direction.overview.read=true` et `app.dashboard.read=true` pour le CEO.
- Simulation de session SQL : `rh.overview.read=true` pour Responsable RH ; `direction.overview.read=false` et `admin.roles.read=false`. `app.dashboard.read=false` pour RH, conformément à l'ACL existante.
- Session anonyme ou compte de test : carte de permissions vide.
- Permission RPC exécutable par `authenticated`, non par `anon` ; déclencheur de protection actif.

Les simulations SQL **ne remplacent pas un vrai essai navigateur** avec les sessions des deux collaborateurs. Aucun identifiant de connexion ni mot de passe n'a été utilisé.

## Travaux de consolidation requis

**Cette réparation n'est pas l'application complète des migrations Drizzle.** La base accessible ne contient toujours ni `intranet_modules`, ni la version canonique `can_intranet_action`, ni toutes les nouvelles tables/services (p.ex. `intranet_records`). La RPC de compatibilité répertorie les **155 interfaces existantes**, pas les 177 pages du registre actuel. Elle constitue une étape de rétablissement des accès de navigation et ne garantit pas le fonctionnement de chaque module.

Avant recette finale et publication coordonnée :
- Identifier le rattachement exact des projets Supabase pour les deux interfaces ; inventorier les migrations déjà appliquées.
- Préparer sauvegarde et préproduction, puis appliquer dans l'ordre les migrations absentes et leurs contrôles de sécurité (notamment 0039, 0044, 0052, 0053).
- Remplacer automatiquement la RPC de compatibilité par la version canonique prévue dans les migrations, sans élargir les droits et en préservant les révocations.
- Vérifier le déclencheur canonique `guard_profile_authorization_fields` et les politiques RLS. Le déclencheur d'urgence `guard_intranet_origin_field` peut être gardé comme défense supplémentaire ou retiré **après preuve** que la protection canonique est active ; ne pas supprimer la protection avant cette vérification.
- Tester en session réelle la connexion, `/pole/direction` et `/pole/rh`, l'accès refusé aux autres pôles, les opérations autorisées et les changements de session.
- La migration de données / fonctions serveur est indépendante de la publication du frontend : une CI verte seule ne garantit pas une base à jour.

Ce fichier documente un correctif réalisé directement dans l'environnement de base accessible via Lovable ; il **n'est pas** une migration à réexécuter automatiquement. Les adresses et identifiants des collaborateurs ne sont pas reproduits ici.
