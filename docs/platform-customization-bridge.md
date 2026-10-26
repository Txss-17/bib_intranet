# Capacités catalogue et dossiers Platform

La page **Fournisseurs → Produits validés** lit les produits réels et permet aux responsables autorisés de qualifier les capacités de personnalisation. Elle expose aussi les demandes marchandes importées par le bridge.

## Autorisations

Les contrôles d’affichage utilisent les permissions enregistrées de la page. L’enregistrement serveur exige un rôle de direction, administrateur ou manager, et le périmètre produit correspondant. Un responsable fournisseur ne peut intervenir que sur son portefeuille affecté. Les demandes visibles suivent une politique RLS ; les clients Platform ne peuvent appeler les fonctions de revue privilégiées.

## Données et synchronisation

- La migration `0029_product_customization_bridge.sql` ajoute les capacités et conditions aux produits ainsi que le miroir des demandes.
- La migration `0028_atomic_platform_favorites.sql`, incluse dans cette correction consolidée, distingue les produits de boutique des références catalogue et remplace les favoris par un instantané atomique.
- L’enregistrement de capacités ne publie pas automatiquement un produit. L’action **Transmettre à Platform** conserve le processus de publication existant.
- Les suppléments exigent une devise renseignée et sont transmis en centimes entiers. Un MOQ ou délai inconnu reste à confirmer.
- La synchronisation importe les demandes soumises ; elle n’est pas présentée comme un flux temps réel.
- Une décision appelle `customization_review` avec l’identifiant du produit de boutique et la version du dossier. Le retour autoritatif de Platform est enregistré pour résister aux synchronisations tardives.
- Un accord technique ne valide ni un échantillon physique, ni une fabrication. Toute modification marchande du dossier retire l’accord antérieur.

Les coûts internes, notes d’audit et documents privés ne font pas partie du contrat public. Les champs autorisés sont définis dans `supabase/functions/_shared/customization-contract.ts` et construits dans `platform-payloads.ts`.

## Ordre d’intégration

Intégrer les deux branches coordonnées, vérifier l’historique Drizzle, appliquer les seules migrations encore absentes, puis déployer les fonctions Edge et les frontends. Platform doit disposer de `0022_customization_workflow.sql` et des versions correspondantes de `intranet-import` et `intranet-export`. Ne pas rejouer l’ensemble des SQL historiques de `supabase/migrations`.

Les migrations sont préparées ; cette PR ne modifie pas la base publiée. Le secret du bridge reste exclusivement côté serveur.

## Vérifications

```sh
npm ci
npx tsc --noEmit -p tsconfig.app.json
npm run build
```

Les tests du contrat, du bridge et des droits sont livrés dans le dépôt Platform, sous `tests/bridge`. Avec les deux dépôts voisins, exécuter depuis Platform `npm run test:bridge` et `npm run check:bridge`.

Recette locale du 26 octobre : typage, compilation et lint des modules frontend modifiés réussis ; 83 tests de bridge, contrat et PostgreSQL réussis dans Platform. Le lint global Intranet contient des erreurs antérieures et ne constitue pas un contrôle global réussi.

Le thème Intranet utilise maintenant le fournisseur racine `next-themes` et la clé `bib-theme`. La préférence persiste après rechargement au lieu de revenir systématiquement au sombre. Le stockage reste propre au navigateur et à l’origine de cette application.
