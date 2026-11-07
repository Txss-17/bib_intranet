# BIB — Invitation et habilitation des accès partenaires après contrat
Date : 7 novembre 2026. Branche de travail : PR #58.

## Décision
Fournisseurs et logisticiens ne reçoivent leurs instructions de connexion qu'après la validation du contrat dans Intrabib. Pour la logistique, l'accord opérationnel sur les besoins est **distinct** de la réception du contrat proposé par le prestataire, de sa revue Juridique/Finance et de sa signature. Aucune invitation ne doit être possible tant que ces étapes ne sont pas attestées côté serveur (suivi : issue #60). L'accès au portail ne signifie pas l'activation opérationnelle du partenaire. La capacité opérationnelle et les sélections par vagues demeurent gouvernées séparément (PR #56).

## Parcours implémenté dans la PR #58
1. `bib_partner_onboarding_cases.stage='contract_signed'` constitue le préalable serveur.
2. Un collaborateur habilité au dossier et à Gateway crée une demande via `bib_prepare_partner_access_invitation`. Le destinataire est lu par le serveur depuis la candidature fournisseur ou le dossier logistique canonique ; il ne peut pas être modifié librement dans l'UI.
3. `submit_intranet_outbox` enregistre une communication idempotente, associée à l'identifiant du dossier. Aucun envoi n'est réalisé à ce stade ; le circuit Gateway préexistant exige qu'une deuxième personne valide le contenu et l'expédition.
4. Le message contient une adresse publique de connexion : `https://brand-in-a-box.space/suppliers/resume?portal=suppliers` ou `https://brand-in-a-box.space/ops/resume?portal=ops`. Pas de mot de passe ni de lien vers `/portal/:token`.
5. Le collaborateur habilité passe par **Gateway → Validation** pour approuver, mettre en file et, si nécessaire, rapprocher la remise avec Gmail. Le backend `bib_confirm_partner_access_delivery` ne valide la remise réelle que lorsque l'outbox indique `sent`, avec approbateur différent de l'auteur, destinataire identique et environnement non test.
6. Pour un compte sandbox, un statut `simulated` est autorisé uniquement après approbation Gateway sans expédition externe. La simulation est distinguée du transport réel.
7. La progression vers `portal_access_recorded` est refusée si la preuve n'est ni `confirmed` (réelle), ni `simulated` dans l'environnement d'essai.

## Sécurité et restrictions
- RLS et table sans droits directs d'écriture des utilisateurs. Les RPC contrôlent pôle, droits Gateway, identité, destinataire, environnement et étape contractuelle.
- Envoi d'instructions de connexion publiques ; les codes OTP sont générés et vérifiés séparément par Platform. Pas de secret conservé dans le registre.
- Gateway dispose de sa propre double validation et du traitement idempotent des e-mails, évitant le contournement par un simple clic de validation dans le dossier.
- Le courrier ou sa préparation ne crée pas automatiquement de session, ne fixe pas le statut Platform `approved`, n'active pas les partenaires pilotes ni les permissions de commandes live.
- Le statut `approved` existant de Platform et les liens `/portal/:token` requièrent une revue de découplage avec le contrat et la sélection pilote ; suivi dans https://github.com/Txss-17/bib_platform/issues/41.
- Le portefeuille partenaires conserve un recrutement et une contractualisation sans plafond ; les flux actifs de la première vague portent sur deux fournisseurs et un logisticien.

## Dépendances et recette avant préproduction
- Migration additive `0091_partner_access_handoff.sql` sur un schéma Intrabib contenant `0090_partner_postapplication_workflows.sql` et Gateway Outbox.
- Rapprocher l'historique des migrations, notamment la PR #56/0089 encore non fusionnée ; aucune migration distante exécutée par cette PR.
- Tester avec profils réels de préproduction : contrat absent, droits de pôle absents, auteur = approbateur, destinataire invalidé, e-mail non envoyé, approbation Gateway manquante, doublon de demande, sandbox, session/permissions Platform, suspension, rollback.
- Confirmer la configuration des services e-mail/OTP et des URL publiques. L'intégration bout en bout des habilitations de Platform n'est pas prouvée par les seuls tests statiques.
- Aucune invitation réelle n'a été envoyée et aucun déploiement n'a été déclenché par ce lot.
