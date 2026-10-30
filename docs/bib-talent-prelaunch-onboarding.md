# BIB Talent — procédure opérationnelle de pré-lancement (30 octobre 2026)

## Canaux autorisés
- **Page publique Talent** : https://bib-talent.lovable.app/carrieres/talent. Le lien est renvoyé par la publication Lovable et `is_published=true`, audience `public`. La disponibilité HTTP publique et les pièces jointes (vidéo, formulaire Google) sont à vérifier manuellement depuis un appareil hors session propriétaire.
- **Formulaire de candidature** : le Google Forms déjà référencé par `bib_platform/src/pages/BibTalent.tsx`. La connexion automatique entre ce formulaire et l'Intranet **n'est pas déployée**.
- **CRM de réception existant** : https://docs.google.com/spreadsheets/d/1-9SEhNpSKduFxMUuhqGXFL-Jy0tn8eR0D-LmOg_4Swc/edit, onglet « Réponses au formulaire 1 », colonnes candidatures et disponibilité. Une ligne de réponse était présente lors de l'inspection du 30 octobre, sans vérification de sa nature réelle ou de test. Ce document n'était pas partagé (`shared=false`) selon Drive : son accès doit être accordé **nominativement** au RH habilité, ou migré dans le Drive Workspace BIB restreint, jamais exposé par un lien public.
- **Intranet** : https://bib-intranet.lovable.app/login, déploiement Lovable demandé. L'audience Lovable demeure `custom` ; vérifier que chaque nouvel invité peut atteindre le login sans exposer les données privées. Aucun lien d'inscription publique.
- **RH** : `/pole/rh/recruitment` (ou l'onglet Recrutement du pôle RH) ; table `hr_candidates`, statut de candidat et étapes.
- **Intégration RH** : `/pole/rh/onboarding`. **Ne pas considérer la création des comptes comme validée** tant que les fonctions d'onboarding présentes dans le dépôt ne sont pas réellement appliquées et testées en base.

## Recrutement pilote par étapes

1. **Attirer** : partager uniquement la page BIB Talent et le Google Forms. L'audience est d'abord francophone et les missions sont orientées recherche produit / parcours utilisateur, communication, fournisseurs, qualité/audit et marketplace. Ne pas promettre de salaire, d'emploi ou de participation en l'absence de conditions validées.
2. **Recevoir et informer** : accès Google Forms limité aux personnes RH compétentes ; information RGPD sur finalités, durée de conservation, droits et sous-traitant Google. Éviter de collecter pièces d'identité, coordonnées bancaires, données sensibles ou CV systématiques avant justification. Les durées de conservation doivent être fixées et appliquées.
3. **Qualifier** : le/la RH crée ou rapproche manuellement une ligne dans `hr_candidates` (lien avec le dossier source conservé dans l'espace RH, pas dans un dossier partagé de tous les pôles). Pipeline : nouveau → présélection → entretien → validation → proposition → accepté ou refusé. Éviter les doublons par adresse e-mail et candidature ; l'import externe est actuellement manuel.
4. **Contractualiser** : définir statut légal, missions, dates, encadrement, confidentialité, propriété intellectuelle, traitement des données et rémunération selon le cas, avant toute prestation opérationnelle. **Une société commerciale ne peut en principe pas utiliser le bénévolat pour faire fonctionner son activité** ; les stages exigent leur cadre légal.
5. **Préparer l'identité** : sélectionner l'adresse professionnelle BIB/Google Workspace si possible ; sinon, l'adresse personnelle d'invitation est acceptée par le login mais **ne donne aucun droit** sans compte Auth, profil `app_origin='connect'`, statut RH actif et affectation métier autorisée. Préparer dossier d'onboarding et justificatifs sans les publier dans Talent.
6. **Attribuer le moindre privilège** : un premier collaborateur junior n'obtient jamais des droits de responsable, Direction, Finance, admin, publication ou export sensible par défaut. Rôles métiers existants potentiels : `testeur_logiciel`, `social_media_manager`, `gestionnaire_catalogue`, `gestionnaire_avis`, `gestionnaire_nc`, selon mission, validation RH et permission réellement vérifiée. Vérifier les `access_assignments`, leurs dates et l'environnement de test.
7. **Valider l'accès** : seul le service RH habilité provisionne Auth, applique rôle et dossier (jamais via INSERT manuel dans `auth.users`). Vérifier d'abord migrations RH et fonction `provision-employee-account`, session réelle, lecture du pôle autorisé et refus des autres. Le marqueur `app_origin` doit être attribué côté serveur, pas par l'utilisateur.
8. **Démarrer le travail** : donner accès aux tâches du seul pôle et au Google Drive professionnel ; documenter une mission courte, livrables, échéance et responsable, journaliser les exports et restrictions de confidentialité, permettre la révocation immédiate. Éviter les secrets et documents sensibles dans le parcours d'accueil.
9. **Évaluer et révoquer** : revues des premières missions et décisions de poursuite documentées. En fin de mission : suspendre droits, retirer accès Drive, sessions et tokens selon processus, conserver seulement les preuves nécessaires.

## Préparer l'invitation nominative (avant la première embauche)

- Sur la fonction serveur `provision-employee-account`, définir si nécessaire le secret `BIB_INTRANET_PUBLIC_URL` à `https://bib-intranet.lovable.app` ou `https://workspace.brand-in-a-box.space`. Toute autre origine sera refusée jusqu'à validation et modification explicite du code.
- Dans Supabase Auth, autoriser précisément l'URL `https://bib-intranet.lovable.app/reset-password` dans les URL de redirection. Vérifier la version effectivement déployée de la fonction serveur et les migrations de preuve d'invitation, dont `hr_account_email_exists` et `reserve_hr_onboarding_invitation` : tant qu'elles sont absentes, **ne pas tenter de provisionner**.
- Le lien d'invitation authentifie via Supabase ; la page `/reset-password` n'affiche la création de mot de passe qu'après session Supabase vérifiée. Un simple paramètre `type=invite` ou `type=recovery` ne suffit pas.
- Le service serveur doit marquer `app_origin='connect'` uniquement après vérification du nonce RH, puis attribuer les droits issus du dossier approuvé. Une première connexion de recette avec un compte réellement invité est obligatoire ; aucun compte de démonstration ne remplace cette preuve.

## Points bloquants à lever

- Le schéma Intranet vérifié avant lancement ne comportait pas les RPC `get_hr_onboarding_permissions()`, `list_hr_mutation_targets(...)` ou les modules génériques récents. La connexion CEO/RH fonctionne, **mais aucun nouvel invité n'a été prouvé de bout en bout**.
- La publication Intranet conserve un périmètre d'audience Lovable `custom`, même si les routes privées sont en plus protégées par AuthGuard et RLS ; vérifier les restrictions d'accès dans le tableau Lovable.
- Le formulaire Google Forms n'est pas lié au pipeline RH et sa disponibilité n'a pas été confirmée par une requête publique réussie dans cet environnement.
- La phase commerciale Platform reste hors pré-lancement public ; la gate React réduit la navigation mais n'est pas une mesure de sécurité pour les API et ne remplace pas le déploiement des migrations, RLS, paiements ni les contrôles marchands.

## Critères de premier onboarding réellement terminé

Pour chaque collaborateur accueilli, conserver la preuve vérifiable de la candidature, décision RH, accord contractuel, identité professionnelle, invitation envoyée, premier login, permission effective sur son pôle, interdiction sur les autres pôles, accès Drive/tâches, puis moyen documenté de révoquer.

Ne jamais créer de compte test ou fictif pour faire apparaître des recrutements réels et ne jamais attribuer de privilèges de production sans validation.
