# Cookies et stockage d'Intrabib — 5 novembre 2026

Le bouton **Cookies et confidentialité** ouvre une information accessible sur les routes connectées comme sur la connexion. Le code actuel n'intègre pas de statistiques facultatives de navigation, de pixel publicitaire ou d'iframe tiers. Il ne présente donc pas de faux boutons de consentement pour des usages absents.

| Stockage | Fonction et durée |
| --- | --- |
| Session Supabase | Maintien de la connexion demandée; expiration/rotation gérée par l'authentification, suppression lors de la déconnexion normale |
| `sidebar_state` | État du menu après action utilisateur, sept jours |
| `bib:legacy-browser-cleanup:v2` | Marqueur du nettoyage historique; reste jusqu'à suppression du stockage du site |

Ces choix ne sont ni récupérés du gestionnaire public Platform ni confondus avec les consentements CGV/CGU ou marketing. Le thème reste en mémoire. Le nettoyage initial tolère également les navigateurs qui interdisent l'accès aux propriétés `localStorage`/`sessionStorage`.

Validation : TypeScript, compilation et lint des fichiers modifiés. La recette Chromium de Platform peut inclure l'écran Intrabib avec `BIB_INTRABIB_ROOT=../bib_intranet`; toutes les requêtes de services distants sont interceptées.

Si une finalité facultative apparaît, ajouter le recueil préalable, le refus aussi simple que l'acceptation, la personnalisation, le retrait permanent et le blocage technique avant de l'activer. L'inventaire du code ne garantit pas l'absence d'injection par l'hébergeur : contrôler également le site publié. Référence : [CNIL — cookies et traceurs](https://cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi).
