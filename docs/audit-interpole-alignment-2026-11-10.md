# BIB — Audit inter-pôles : alignement des décisions et périmètre de livraison
Date : 10 novembre 2026 — **code préparé ; migrations, publication et tests connectés non exécutés**.

## Références du Drive BIB
- [Procédure fournisseurs du 05/11, mise à jour du 07/11](https://docs.google.com/document/d/1AEFtOiACQivT6KTFd51QrqA2TWJRcmJ_nGfxCoDsfkQ/edit) : Fournisseurs qualifie, Audit analyse, Finance valide les montants et rapproche les virements ; préqualification n'est pas référencement.
- [Audit / Finance et contrôles, 07/11](https://docs.google.com/document/d/1hCMjzAzCViu6XlhDQr5oi1OIgbo18n-9vsx59Ha0iLY/edit) : pièces par SKU, findings, audit initial, contre-audit, contrôle site ; separation des visas.
- [Cahier fonctionnel Audit et rapprochement](https://docs.google.com/document/d/1LwTHlbWGSjAIUbhMFSBFJKCuGpmeop3MGGwiiU2_a1o/edit) : l'émission fiscale et la confirmation bancaire sont des actes distincts de la transmission interne.
- [Référentiel du 09/11](https://docs.google.com/document/d/1TaJmz_LqrhnenH2G2pY-AcLdI4fODbJepB_ktp1qYJ8/edit) : **la dernière décision (section 13) annule toute gratification individuelle d'audit**, après propositions historiques 25%, 20% et 14,5%. Aucune prime d'audit n'est activée par les PR #84-85.

## Flux techniques disponibles après migrations
1. **Fournisseurs :** `supplier_audit_cases` + `supplier_audit_handoffs` (migration 0102). Qualification préalable, nature initial/contre-audit, modalité, référence d'incident obligatoire pour contre-audit, auteur et date vérifiables. Les anciens dossiers sans transmission restent non transmis.
2. **Marchands :** `shops` → `audit_cross_pole_referrals` (migration 0103), depuis la liste Boutiques, uniquement en cas de visibilité de la boutique et droit Marketplace vérifié sur serveur.
3. **Logistique :** `logistics_incidents` → le même registre (migration 0103), depuis la page Incidents, si l'incident est encore ouvert et visible.
4. **Pôle Audit :** réception des demandes inter-pôles sur la page Missions et des dossiers fournisseurs dans la page Audits fournisseurs. Une demande ne crée aucune décision de conformité ni facture.
5. **BIB Audit Hub :** l'intégration existante de missions terrain et rapports via `field_audits`, `hub-field-missions` et `mirror-audit-intake` reste indépendante. Ne pas prétendre que les anciennes lignes Hub sont des transmissions `0103` ni qu'elles bénéficient de sa traçabilité sans recette spécifique.

## Contrôles de gouvernance
- Le pôle d'origine **demande** un audit ; Audit décide de sa modalité, de son instruction, de sa conclusion et de la revue indépendante. Des demandes peuvent être défavorables.
- Finance est seul compétent pour les devis/factures, le prix, la TVA et l'attestation des crédits bancaires ; Juridique valide les modèles/mandats ; Direction autorise les dérogations.
- L'identité de la source et son existence visible sous RLS sont vérifiées par la RPC invoker ; la transmission ne crée ni boutique, ni fournisseur, ni stock, ni mission.
- La preuve de réception est horodatée côté serveur et non destructrice. Aucune auto-approbation, publication, notification externe ni rémunération de l'auditeur.
- **La transmission interne ne vaut pas transmission légale au fournisseur.** Les PDFs finaux, empreintes, signatures, visas et envoi authentifié restent couverts par l'issue #62.

## Critères Go/No-Go après synchronisation manuelle
- Vérifier 0102 et **sa signature GRANT à quatre arguments** (PR #85 corrige une erreur qui empêchait la mise en service), puis 0103 et les dépendances en staging.
- Tester les appels de transmissions avec rôles Fournisseurs, Marchands, Logistique, Audit et personne non autorisée ; vérifier autorisation **côté serveur**, test-account et visibilité source RLS.
- Tester double transmission, source fermée/résolue, changement de statut, statut ancien, absence d'incident sur contre-audit, requêtes concurrentes, et lecture d'un autre pôle.
- Vérifier que les documents contractuels et rapports ne sont jamais émis automatiquement, et que les migrations en attente et le rollback fonctionnent.
- Vérifier séparément BIB Audit Hub, les justificatifs par SKU, les workflows de contrôle qualité, l'archivage et la fiabilité de la livraison.

**Statut :** ce document atteste une revue de code et d'alignement métier, **pas** une conformité réglementaire ni une recette réussie en production.
