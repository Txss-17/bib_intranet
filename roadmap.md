# Roadmap

## Rattachement marchand des boutiques Platform — 27 octobre 2026

- [x] Conserver les identités propriétaires de Platform et valider la complétude du snapshot.
- [x] Préserver les rattachements en cas d’erreur et refuser les snapshots anciens ou les modifications concurrentes.
- [x] Actualiser les listes et fiches Marketplace après synchronisation.
- [ ] Déployer l’export Platform puis le bridge Intranet et vérifier la réparation par synchronisation complète.
- Détails : `docs/merchant-shop-sync.md`.

- [ ] Restrict collaborator creation and account invitations to HR, and disable public signup.
- [ ] Update the CEO name and verify persisted changes and application status.
- [ ] All account settings (identity, post, poles, manager, subsidiary, work mode, contract type) come from HR onboarding; Settings shows them read-only.
- [x] HR-attached documents (contracts, charters, policies) shown in account Settings > Ressources from real data.
- [x] Permissions page saves now control access. [ ] Remove fake data in RH (Publications), Security, Product poles; browser check per role; remove fake data in RH (Publications), Security, Product poles.
- [ ] Allow an existing account to go through onboarding again when changing role or pole (mutation), updating settings and documents.
- [ ] Sign in as RH, submit a complete collaborator file (subsidiary, work mode, charters), verify account settings and documents appear.

## Publications RH

- [x] Remplacer les publications fictives et les actions sans effet par les publications RH persistées : lecture complète, brouillon, modification, publication et archivage.
- [x] Appliquer les permissions sauvegardées côté serveur, protéger les contenus non publiés et les audiences, gérer les conflits et les reprises de création.
- [ ] Appliquer la migration 0031_hr_publications.sql puis vérifier le parcours RH dans l’application publiée.

## Mutation des collaborateurs existants — 28 octobre 2026

- [x] Ouvrir un dossier depuis une identité réelle, avec sélection explicite des affectations à remplacer et conservation des autres accès.
- [x] Autoriser séparément création, validation et application depuis les droits enregistrés ; appliquer profil, accès et documents ensemble, sans invitation.
- [x] Détecter les fiches et droits devenus obsolètes, refuser les auto-mutations et protéger les privilèges techniques.
- [x] Afficher les informations professionnelles RH en lecture seule dans Settings.
- [ ] Appliquer les migrations 0034 puis 0035, déployer la fonction et vérifier un parcours RH complet dans l’application publiée.
