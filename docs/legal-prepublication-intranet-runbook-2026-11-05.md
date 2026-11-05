# BIB / Intrabib — intégration des modèles légaux v2.1 (préparation, 5 novembre 2026)

**STATUT : PROJET — AUCUNE VALIDATION, PUBLICATION, MIGRATION OU TRANSMISSION RÉELLE.** Les trois documents source Word JUR-B01/B02/B03 v2.0 contenaient des champs non reconnus par les migrations SQL `Platform/0025` et `Intrabib/0084`. Des v2.1 ont été créées dans le Drive BIB, avec extraction du corps en texte brut.

## Source contractuelle unique
- Les documents de référence BIB-00 v1.6 et BIB-00bis v1.3 restent inchangés.
- Modèles **pour diffusion boutique uniquement** : JUR-B01 (CGV vendeur), JUR-B02 (CGU vitrine) et JUR-B03 (mentions boutique).
- JUR-M01/M02, JUR-C01/C02, mentions de plateforme, confidentialité, cookies et fournisseurs restent des familles **hors miroir des boutiques** : les fonctions SQL actuelles n'acceptent pas leur `model_key`.
- Le manifeste `docs/legal-model-prepublication-contract-2026-11-05.json` interdit l'import sans revue et ne spécifie aucune date d'effet.

## Étapes opérateur Intrabib (à réaliser uniquement après validation juridique)
1. Vérifier l'exploitant individuel et le vendeur réel de la boutique, leurs identifiants et l'existence de leurs obligations légales. Ne pas considérer la future SASU comme constituée.
2. Dans Conformité → Politiques / Direction → Gouvernance, préparer la saisie `model_key`, `version`, `title`, `body`, `effective_at` ISO 8601 avec fuseau et `locale=fr`. Le corps doit être du texte clair : **pas le DOCX, ses notes ou sa couverture**.
3. Comparer la liste blanche de `{{PLACEHOLDER}}` au SQL, la nécessité de `TVA_ID` pour l'EI selon sa situation réelle, et les 3 listes de champs requises. Aucune valeur d'identité ni médiateur fictif.
4. Workflow validant : brouillon → soumis → revue juridique par un intervenant distinct → validation Direction par un troisième intervenant distinct → publication registre. Les preuves d'auteur, les versions, la date d'effet et les justificatifs doivent être conservés.
5. En préproduction isolée : contrôler sauvegarde + restauration, journaux de migration Drizzle et dépendances; ne pas rejouer des migrations anciennes en masse. Appliquer les composants `0084` et `0025` en environnement préparé et déployer conjointement les fonctions privées Intrabib et Platform avec la nouvelle version de checkout.
6. Configurer `BIB_PLATFORM_BRIDGE_SECRET` secret de forte entropie et `BIB_PLATFORM_FUNCTIONS_URL` côté serveur, `BIB_PUBLIC_SITE_ORIGIN` côté Platform, modes sandbox/live concordants; ne jamais exposer le secret dans `VITE_*`.
7. Vérifier transmission persistante et accusé de réception distant de la séquence exacte; « publié dans le registre » n'implique pas « reçu par Platform ».
8. Recette E2E avec vendeur EI boutique propre et vendeur tiers : revue d'identité, avis et conditions disponibles, publication refusée si incomplets, checkout avec accord explicite, snapshot lié à la commande, rétractation, retours, changements de version et retrait.
9. Vérifier PSP Stripe/Connect séparément, RGPD, cookies, formulaires BIB Talent et médiation; ne pas ouvrir les ventes sur la seule preuve du code.

## Gates de décision
- `G0` Compatibilité technique de placeholders : **vérifiée sur brouillons v2.1**.
- `G1` Texte légal / identité réelle : **en attente**.
- `G2` Préproduction SQL/API/checkout et tests : **en attente**.
- `G3` Validation Direction / déploiement : **non autorisés à ce stade**.

Voir `docs/store-legal-governance-2026-11-04.md` dans les deux dépôts et PR #22 de BIB Platform. Ce document ne crée aucune tâche automatisée ni ne prouve un déploiement.
