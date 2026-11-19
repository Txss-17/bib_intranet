# BIB Intranet — Mise en service des invitations RH (préproduction uniquement)

**Statut : BLOQUÉ / NO-GO** jusqu'aux preuves détaillées ci-dessous. 
**Périmètre :** Supabase `hjquaokkcpnwnvpdfmyj`, Vercel `bib-intranet-staging`, issue RH #91.
**Production Lovable, domaine public, DNS, Stripe : hors périmètre.**

## Diagnostic du 19/11/2026

- Fonction Edge `provision-employee-account` version 1 : **ACTIVE**, `verify_jwt=true`. Elle exige `BIB_INTRANET_PUBLIC_URL` configurée explicitement et présente dans la liste exacte d'origines admises, sinon HTTP 503 et **aucune invitation**.
- RPC `reserve_hr_onboarding_invitation` : `authenticated EXECUTE=true`, `anon=false` et vérifications RH dans la fonction serveur.
- Vercel : `ssoProtection.enabled=true`, `deploymentType=all_except_custom_domains`. Les URLs `*.vercel.app` Preview demandent une authentification Vercel et ne constituent donc **pas** une destination d'invitation accessible de manière autonome pour un nouvel employé extérieur à l'équipe Vercel.
- Origine de recette épinglée dans le code : `https://bib-intranet-staging-dxwa5e90e-txss-17.vercel.app` ; il s'agit d'un ancien déploiement Preview, pas d'une garantie d'adresse stable.
- Le domaine `https://workspace.brand-in-a-box.space` est présent dans la liste des origines serveur autorisées, mais son DNS, son certificat, son déploiement de destination et sa disponibilité publique n'ont **pas** été validés.
- Les réglages Supabase Auth URL Configuration, SMTP, et les secrets serveur ne sont pas accessibles en écriture par le connecteur actuel. Leur état n'est donc **pas confirmé**.
- Supabase indique qu'en l'absence de SMTP personnalisé, le serveur email par défaut est limité aux destinataires appartenant à l'équipe du projet. Il ne valide pas une recette d'invitation d'un nouveau collaborateur non membre.
- Aucun nouvel utilisateur Auth, aucune invitation et aucune clôture RH n'ont été provoqués lors de ce diagnostic.

## Décision d'architecture à respecter

Le backend **reste Supabase** et le frontend **reste Vercel**. Pas de nouvelle migration d'hébergement. Pour une recette externe, choisir **une adresse HTTPS stable**, sur laquelle une personne non membre de l'équipe Vercel peut atteindre l'écran `/reset-password` et, ensuite, la page de connexion. Les permissions applicatives Supabase restent obligatoires ; l'absence de protection Vercel sur cette seule entrée n'autorise pas l'accès aux données.

**Ne pas désactiver la protection Vercel de tous les aperçus** ni modifier le DNS de production pour faciliter artificiellement un test. Un domaine personnalisé indépendant et explicitement approuvé, ou un environnement accessible prévu pour l'activation, est préférable. Tout changement de protection doit être traité comme une modification de sécurité et faire l'objet d'une validation.

## Checklist de prérequis (responsable humain requis)

- [ ] **Hébergement :** retenir l'origine HTTPS stable de recette `ORIGIN` et ouvrir `ORIGIN/reset-password` dans une session privée **sans compte Vercel**. Vérifier certificat, redirection, chargement et absence de page Vercel Authentication.
- [ ] **Edge Functions (Supabase > Edge Functions > Secrets) :** définir `BIB_INTRANET_PUBLIC_URL=ORIGIN` dans **le projet staging exclusivement**. L'URL doit correspondre EXACTEMENT à une origine explicitement autorisée dans la fonction ; sinon créer, valider et fusionner un changement de code d'allowlist avant de déployer. Ne pas stocker de `service_role` dans Vercel ou dans le code frontend.
- [ ] **Authentication > URL Configuration (Supabase staging) :** ajouter `ORIGIN/reset-password` comme *Redirect URL* exacte, et choisir `Site URL` de préproduction cohérente. Ne pas introduire de wildcard `*` pour un domaine extérieur.
- [ ] **Authentication > SMTP Settings :** connecter un SMTP opérationnel d'un expéditeur approuvé, vérifier SPF/DKIM/DMARC, tester délivrabilité et expéditeur, sans divulguer d'identifiants.
- [ ] **Authentication > Email Templates :** vérifier que le modèle d'invitation mène à la création du mot de passe et utilise le paramètre `redirectTo` fourni au serveur.
- [ ] **Vercel > Settings > Environment Variables :** garder uniquement `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` dans le frontend Preview. Aucun secret Admin/SMTP.
- [ ] **Data / RBAC :** compte RH opérateur + second validateur RH distincts et habilités ; compte de recette `@brand-in-a-box.space` dont la boîte mail est effectivement accessible ; éviter de prendre un compte réel existant ou de le réinviter.
- [ ] **Identité synthétique :** choix explicite de son adresse et de sa purge après recette, avec empreinte du test dans le journal RH.

## Scénario E2E et preuves minimales

1. Créer un **dossier fictif** via l'interface RH staging. Vérifier le `request_kind=onboarding`, le poste du catalogue et le rôle demandé. Un membre RH distinct doit valider.
2. Appeler le provisionnement depuis le parcours RH. Confirmer une seule invitation, un seul utilisateur `auth.users`, profil `profiles`, affectation `access_assignments`, statut RH `account_created` (et **pas** `completed`).
3. Sur le compte mail d'essai, ouvrir l'invitation sans compte Vercel, arriver sur `ORIGIN/reset-password`, définir son mot de passe, se connecter. Conserver des preuves de réception et de destination, sans conserver les jetons d'invitation ou mots de passe.
4. Vérifier depuis l'application le pôle, les interfaces permises et les interfaces refusées. Tester les rôles sur un navigateur distinct, puis la révocation.
5. Faire relire les quatre preuves `hr_onboarding_activation_evidence`. Un second RH indépendant rédige le compte rendu et clôture via `complete_hr_employee_onboarding`. Vérifier l'enregistrement de la preuve et le journal.
6. Tests négatifs indispensables : JWT absent, rôle RH absent, email existant, invitation périmée, aucune origine d'invitation configurée, première connexion absente, approbation par l'auteur du dossier, rôle métier révoqué.
7. Relever les anomalies et leur correction dans l'issue RH #91 et le dossier maître Drive BIB. Nettoyer **uniquement** le compte synthétique identifié, après vérification de ses dépendances.

**Conditions de GO :** CI verte ; configuration Auth/SMTP validée ; lien utilisable hors compte Vercel ; test E2E positif et négatif complet ; preuves de rollback et sauvegarde ; revue humaine indépendante. Aucune des seules validations CI/SQL ne suffit à déclarer la recette fonctionnelle complète.

## Points de suivi supplémentaires

- Stockage Intranet : 5/6 objets restaurés. Le sixième est une ancienne archive distincte `.backup` de **24 034 185 octets** du bucket privé `database_export_19_07_26` ; source exacte non retrouvée parmi les fichiers Drive inspectés. Ne pas reconstituer artificiellement son contenu à partir de l'archive du 11/11/2026.
- Profils marqués `test_account=true` : **114/116**. Ne pas supprimer en masse ; restaurations, rôles, historiques et liens documentaires doivent être inventoriés avant toute action.
- Sécurité : Supabase signale des RPC `SECURITY DEFINER` exécutables par les utilisateurs authentifiés ; vérifier les autorisations propres à chaque fonction lors de la revue globale. Les fonctions RH de ce parcours exécutent des contrôles serveur d'habilitation ; l'avis ne doit pas être ignoré ni interprété comme une exploitation confirmée.

Sources d'exploitation :
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/auth/auth-smtp
- https://vercel.com/docs/deployment-protection
