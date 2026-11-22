# Contrat de sécurité : lecture Drive BIB et restriction RH

**Date :** 22 novembre 2026  
**Application :** BIB Intranet  
**Statut :** contrat de non-régression du code, et non recette complète des octets ni des ACL externes

## Pourquoi ce contrôle existe

La fonction `rh_may_read_linked_drive_document(uuid)` est un **filtre restrictif additionnel** sur les fichiers ayant au moins une liaison RH dans `rh_drive_document_bindings`. Sa réponse positive pour un document **sans liaison RH** est intentionnelle : ce résultat signifie uniquement « aucune restriction RH additionnelle à appliquer ». Il ne signifie jamais que le demandeur est autorisé à lire un document.

Le véritable point de décision est `can_read_intranet_drive_document(p)`, qui cumule la permission `app.documents/read`, le périmètre, la correspondance du compte, les droits du document et le filtre RH. Le point d'entrée `get_intranet_document_access(p_id)` exige que le document existe ET que cette permission composite soit vraie. La fonction Edge `intranet-drive` utilise la RPC `get_intranet_document_access` avant l'accès au fichier. **Un booléen isolé retourné par le filtre RH ne doit jamais devenir une autorisation d'accès à un fichier.**

## Reproduction et interprétation

Sur la base de préproduction `hjquaokkcpnwnvpdfmyj`, un test sous un contexte JWT synthétique a confirmé `rh_may_read_linked_drive_document(uuid_inconnu)=true` pour un identifiant sans liaison RH. Il n'a créé ni document ni compte. La lecture du code et de la fonction déployée a confirmé que la RPC de lecture générique impose toujours l'existence de la ligne et le contrôle d'accès composé. Il ne faut **pas** remplacer naïvement ce résultat par false : cela risquerait de bloquer tous les documents BIB non RH.

## Limites et suite des tests

1. Exécuter un test navigateur E2E sur l'environnement isolé avec deux responsables RH de portefeuilles distincts, un collaborateur propriétaire et un compte non éligible.
2. Tester les octets d'un fichier de recette non sensible, les anciens liens, les permissions Google Drive externes et la perte d'accès après départ effectif.
3. Inventorier les appels directs à la fonction auxiliaire et ne jamais l'utiliser comme test d'autorisation complet. Maintenir des tests automatiques de composition des autorisations.
4. Le transfert des documents et l'ouverture du coffre RH privé restent soumis à validation de sécurité/RGPD. Ne pas déplacer, copier ni exposer de documents RH réels pour la recette.

## Preuves et références

- Migration : `supabase/migrations/20261121182000_rh_departure_revoke_bib_review_shares.sql`.
- Contrôle général : `ops/release/rh-linked-drive-document-authorization-20261121.sql`.
- RPC de lecture : `drizzle/migrations/0040_intranet_drive.sql`.
- Fonction Edge : `supabase/functions/intranet-drive/index.ts`.
- Contrôles GitHub : `tests/intranet/rh-document-authorization-composition.test.mjs`.
- Tickets de suivi : #111 (Drive, ACL externes), #121 (départ), #89 (migration).
