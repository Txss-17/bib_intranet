# BIB Intranet — dépendances Lovable et autonomie

Statut : **audit du code et préparation** ; ne pas modifier les fonctions Auth actives ni les destinataires RH.

| Priorité | Zone | Dépendance | Remplacement et tests nécessaires |
|---|---|---|---|
| P0 | `supabase/functions/auth-email-hook/index.ts` | `@lovable.dev/email-js` et `@lovable.dev/webhooks-js` | Auth mail indépendante via Supabase Auth / fournisseur SMTP autorisé ; protocole de signature interne revu ; tests invitation, magic link, récupération, changement d'email et MFA |
| P0 | `supabase/functions/handle-email-suppression/index.ts` | `@lovable.dev/webhooks-js` et `LOVABLE_API_KEY` | Endpoint webhooks authentifié par le fournisseur email direct ; idempotence, suppression pérenne, rebonds et plaintes |
| P1 | `src/pages/modules/security/SecurityPlatform.tsx` | Lien d'administration vers `lovable.dev/projects/...` | Remplacer par console Supabase BIB ou page d'administration autorisée après recette |
| P1 | `README.md` | Documentation déploiement Lovable | Instructions déploiement GitHub/hébergeur indépendant et environnement Supabase cible |

## Points de contrôle
- 116 identités Auth source (comptage initial) ; aucune identité exportée ou restaurée.
- 1 046 politiques RLS public, 236 fonctions SECURITY DEFINER, 3 buckets Storage ; revue sécurité prioritaire.
- Staging indépendant créé : `bib-intranet-staging` (`hjquaokkcpnwnvpdfmyj`, Paris), initialement vide.
- Parcours CEO et Manager RH : tests de toutes les étapes de l'onboarding avec habilitations, mail de confirmation et restauration d'accès.
- Conserver les données RH strictement privées. Ne pas envoyer de véritables emails d'invitation ou de récupération depuis staging.
- Ne pas supposer que la désactivation des NS de `notify.brand-in-a-box.space` est sans conséquence.
- Les bridges Platform/ Audit exigent une stratégie d'authentification mutuelle et ne doivent jamais exposer les clés service_role.

Dossier maître : https://docs.google.com/document/d/18lpUzk5j6jTKMw9m_s2XAPsALxdeP4OVkkqpbr-iv9M/edit .
Issue de suivi : https://github.com/Txss-17/bib_intranet/issues/89 .
