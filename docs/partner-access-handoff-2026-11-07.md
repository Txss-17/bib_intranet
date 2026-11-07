# Accès fournisseur et logisticien après signature — 7 novembre 2026

## Décision opérationnelle
La validation ou signature du contrat intervient avant toute remise des informations d'accès. Le processus sépare (1) l'approbation du contrat, (2) la préparation de l'invitation, (3) la vérification indépendante de la transmission, (4) l'ouverture d'une session partenaire, (5) l'autorisation des opérations actives. La préparation et la remise des accès n'autorisent pas les commandes live.

## Code de cette PR
- Migration **0091**, additive, après la 0090 : table privée `bib_partner_access_handoffs`, destinataire professionnel, référence d'invitation, canal, statut et référence de preuve de livraison ; aucune donnée d'authentification stockée. RLS par environnement et pôle.
- RPC `bib_record_partner_access_handoff` : peut préparer seulement après `contract_signed`, confirme uniquement avec une personne différente, et valide la correspondance entre le destinataire et le dossier correspondant.
- La fonction `bib_advance_partner_onboarding` refuse de passer de `contract_signed` à `portal_access_recorded` sans remise confirmée et référencée.
- `PartnerPostApplicationWorkflow` : affiche les points d'entrée publics de reprise de connexion et le formulaire de preuve. **Ce formulaire n'envoie aucun e-mail et n'affiche aucun jeton.**

## Accès partenaire via Platform
- Fournisseur : `https://brand-in-a-box.space/suppliers/resume?portal=suppliers`.
- Logistique : `https://brand-in-a-box.space/ops/resume?portal=ops`.
- Ces pages utilisent le processus OTP existant ; un e-mail d'invitation ne doit contenir que l'URL publique et les instructions, ni code OTP, ni mot de passe, ni `access_token` de dossier.
- La fonction Platform `partner_load_operational_portal` utilise actuellement une vérification de statut `approved` et des jetons de dossier. Elle n'est pas liée au contrat signé ni au statut de sélection pilote Intrabib dans cette PR. La refonte de l'accès réellement révocable et borné est suivie par l'issue https://github.com/Txss-17/bib_platform/issues/41.

## Préproduction / garde-fous
- Vérifier les migrations 0089, 0090 et 0091 ainsi que le journal des migrations et les bases réelles avant toute application.
- Tester deux personnes habilitées distinctes, mauvaise adresse, refus du statut sans preuve, mauvais pôle, sandbox vs live, double action et révocation.
- Tester la livraison via Gateway et le retour d'une preuve de file/livraison avant automatisation : pas de confirmation sur simple tentative d'envoi.
- Ne pas transmettre de secret dans les notes Intrabib.
- Aucune invitation réelle, migration distante ni autorisation opérationnelle n'est déclenchée par cette PR.
