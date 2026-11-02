# B.I.B Audit Hub — diagnostic structurel et contrat avec BIB Intranet
Date : 2 novembre 2026 · Analyse du code GitHub Intranet et du projet Lovable Audit Hub `5c9b32f0-6f75-479d-8354-3ef4a4d67f4b`.

## Constat actuel
- Deux bases Supabase distinctes : Audit Hub utilise `audit_missions`, `audit_reports`, `audit_anomalies`, `audit_responses`, `audit_templates`, `suppliers`, `products`. Intranet gère `field_audits` (workflow canonique terrain), `supplier_audits`, `ops_audits`, `audit_mission_events`, audits et actions correctives.
- Le Hub comporte actuellement cinq missions d'audit, trois produits et trois fournisseurs. Identifiants fournisseurs `11111111-...`, `22222222-...`, `33333333-...` et créations groupées de missions le 21 avril 2026 : **indices forts de jeu de démonstration**. Aucune suppression effectuée dans la base Audit à ce stade ; vérifier les dépendances et la provenance puis purger les entrées de démonstration en conservant les dossiers réels.
- Le Hub utilise `linksy-audit` IndexedDB/Dexie avec brouillons, réponses, photos Blob, chronomètres et file d'attente de synchronisation. Cette persistance sur appareil est **incompatible avec la décision BIB interdisant tout enregistrement local**. Le flux hors ligne doit donc être retiré ou entièrement repensé, pas simplement renommé.
- Audit Hub crée par défaut des comptes locaux Auth avec le rôle `auditor`, distinct de l'annuaire RH et des autorisations d'Intranet. L'identité est aujourd'hui rapprochée par **adresse email**, pas par un identifiant d'employé immuable.
- Deux chemins partiellement concurrents existent :
  1. `connect-field-missions` (Hub) → `hub-field-missions` (Intranet) pour lister, commencer et synchroniser les missions terrain `field_audits`. Accès via JWT Hub + secret partagé + email vérifié dans Intranet ; Intranet borne par `auditor_id`.
  2. `audit_missions` (base Hub) → `generate-audit-report` → `notify-linksy` → `mirror-audit-intake` (Intranet), qui insère directement dans `ops_audits`, `supplier_audits` ou `field_audits`.
- Le second canal insère sans clé d'idempotence vérifiée : rejouer une notification peut créer un doublon. Les identifiants Hub figurent dans des notes libres plutôt qu'un mapping UUID UNIQUE.
- La conversion `product → ops` dans `notify-linksy` perd la typologie produit et le lien structuré à une fiche produit. Les non-conformités / photos et preuves ne sont pas toutes transmises en objets structurés.
- L'export des rapports PDF et des preuves ne doit pas s'effectuer par téléchargement local sur un appareil professionnel BIB si le modèle documentaire interdit cet export.

## Modèle cible — autorité et responsabilités

| Domaine | Autorité de la donnée | B.I.B Audit Hub | BIB Platform |
|---|---|---|---|
| Annuaire et habilitations | RH/Sécurité Intranet | Identité SSO fédérée, lecture de sa mission, jamais provisionnement autonome | N/A |
| Missions, affectations et échéances | Pôle Audit Intranet | Exécution des seules missions attribuées | Aucun statut audit définitif depuis la boutique |
| Fournisseurs, produits et documents | Pôles Fournisseurs/Qualité Intranet | Lecture du dossier strictement nécessaire | Produit éligible seulement après décision et push autorisés |
| Réponses, photographies, anomalies terrain | Hub → Intranet via une transaction serveur | Capture en mémoire et transmission en ligne ; pas de cache navigateur durable | Aucune lecture des pièces sans autorisation |
| Validation de conformité | Pôle Audit/Qualité Intranet | Propose constats et score, pas de décision juridique autonome | Reçoit exclusivement état admissible et version validée |
| Correctifs et clôture | Intranet | Revue / preuves complémentaires autorisées | Mise à jour de l'éligibilité si nécessaire |

## Contrat serveur recommandé
1. Utiliser `field_audits.id` comme identifiant de mission canonique avec `revision` et `source` immuables. Éviter les créations parallèles de missions dans la base Hub.
2. SSO/OIDC par identité professionnelle BIB, liaison immuable `intranet_user_id` et contrôles de rôles vérifiés **côté Intranet** ; ne pas se reposer sur l'email seul.
3. Endpoints authentifiés `GET /audit/assigned`, `POST /audit/:id/start`, `PUT /audit/:id/draft`, `POST /audit/:id/submit`, `GET /audit/:id/status` (schéma contractuel, pas routes actuellement déployées).
4. Validation Zod des données, contraintes de statut et version optimiste, idempotency_key UNIQUE, checksum de preuves, horodatage serveur, journal des changements.
5. Stockage des photos dans un compartiment serveur privé rattaché à la mission et à l'auteur, avec liens signés à durée limitée ; aucune persistance locale dans IndexedDB, localStorage, sessionStorage ou Cache Storage.
6. Distinction entre `resultats_terrain`, `analyse_qualite`, `decision_audit`, `action_corrective` et `publication_catalogue`. Une note/score calculé automatiquement ne vaut pas approbation.
7. Une seule entrée vers Intranet (réconciliation vers `field_audits` + objets anomalies/rapports) ou un bridge explicite avec mapping unique, et journalisation de toutes les transitions.
8. Vérifier les conditions d'accès aux rapports PDF, la politique de conservation et l'interdiction de téléchargement hors flux documentaire autorisé.
9. Corriger les messages d'erreur qui retournent actuellement des détails d'exception distants et éviter toute donnée personnelle dans les journaux.
10. Mettre en place des tests de non-duplicata, isolation inter-auditeurs, rejet de faux scores, révocation des comptes, rejeu de webhook et changements d'affectation.

## Écarts de conformité bloquants
- Pas d'exécution sécurisée hors ligne possible sans aucune donnée locale : **le produit doit fonctionner uniquement connecté**, ou la politique BIB doit définir une exception explicite, ce qui n'est pas souhaité actuellement.
- Les dossiers Audit actuels ressemblent à des jeux initiaux ; audit de provenance et purge avec gardes de FK nécessaires.
- Pas de confirmation de déploiement des Edge functions, des secrets ni de recette complète Hub ↔ Intranet.
- La publication actuelle de Audit Hub est publique selon Lovable, tandis que l'application exige une authentification : revoir la publication et l'accès aux fonctionnalités non authentifiées.
- La séparation entre décision finale de conformité, recommandation de l'auditeur et publication produit doit être codifiée dans les deux bases.

## Ordre des prochaines corrections
A. Geler la synchronisation potentiellement duplicative et retirer les données de démonstration après contrôle.
B. Neutraliser IndexedDB et les fonctionnalités hors ligne avec une expérience d'erreur de connexion explicite.
C. Raccorder l'identité et les autorisations à BIB Intranet ; un seul dossier de mission.
D. Réunifier la collecte de preuves, les états et les décisions qualité.
E. Tester contrats, anonymisation, archivage, suppression, qualité et disponibilité avant activation.

Ce diagnostic ne constitue pas une validation de déploiement et n'autorise aucun transfert de données supplémentaire.
