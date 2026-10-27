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
