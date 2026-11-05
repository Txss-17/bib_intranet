# Intrabib — recette PWA et accès collaborateurs

Cette modification ajoute un manifeste et des métadonnées d'installation, sans service worker ni cache hors ligne. Elle ne modifie pas Supabase Auth, les politiques RLS, les rôles ou les migrations.

## Vérifications obligatoires avant fusion

- Contrôler le manifeste servi avec le type MIME approprié et l'icône affichée sur Chrome/Edge/Android.
- Produire des icônes PNG 192×192, 512×512 et Apple touch 180×180 pour compatibilité maximale; l'icône SVG actuelle est une première base, pas une garantie de prise en charge sur tous les appareils.
- Vérifier l'installation sur Safari iOS et le comportement de « Ouvrir comme app web ».
- Vérifier que le mode standalone n'expose aucune page protégée à un utilisateur non authentifié.
- Vérifier refresh, nouvel onglet, retour de veille, récupération de compte, changement de rôle et déconnexion.
- Auditer MFA, révocation des sessions, RLS, journaux et onboarding RH séparément avant ouverture à de nouveaux collaborateurs.
- Aucun cache offline de données sensibles ne doit être ajouté sans étude de menace et test de déconnexion.

## Limites

L'absence de service worker est volontaire pour ne pas introduire de persistance locale supplémentaire de données internes. Le mode d'installation et les icônes varient selon navigateur et système.
