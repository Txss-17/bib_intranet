# BIB Intranet — gouvernance fiscale multi-entités et vues par pôles

Décision fonctionnelle de cadrage — 10 novembre 2026. **Cible à implémenter ; pas une fonctionnalité déclarée active.**

## Principe

Le module « Fiscalité & flux » est un cockpit de gouvernance sous responsabilité de la **Direction / CEO**. Il ne doit être ni limité à l'entreprise individuelle actuelle, ni automatiquement ouvert à tous les pôles. Les pôles contribuent aux dossiers qu'ils gèrent, mais les permissions ne leur donnent pas un accès transversal à toutes les entités.

- **EI actuelle** : entité réelle existante, statut administratif et fiscal à vérifier, suivie séparément des boutiques tests (qui sont des axes analytiques, pas des personnes juridiques distinctes).
- **SASU envisagée** : objet de projet sans identité juridique opérationnelle ni déclaration activée tant que sa constitution et ses références ne sont pas vérifiées.
- **Autres entités futures** : le CEO peut créer, configurer, suspendre et archiver leur dossier selon un cycle de vie contrôlé. Ne pas créer de personnalité juridique à partir d'un simple nom affiché.
- **Marchands tiers et fournisseurs** : des contreparties ; ne pas les transformer silencieusement en filiales ou entités BIB. Les flux les référencent par identifiants économiques exacts.
- **BIB « intermédiation »** : un modèle d'activité, non une personne morale supplémentaire par défaut. Rattacher chaque facture et obligation à l'émetteur légal effectif.
- **Holding, Café-Lab** : scénarios/projets, pas structures activées ou déclarations présumées.

## Fonctionnalités cible du cockpit CEO

1. **Registre des entités** : identifiant immuable, nom légal/enseigne, pays, forme juridique, état (projet / à vérifier / active / suspendue / archivée), SIREN/SIRET seulement si existants et vérifiés, régime TVA/fiscal daté, activités, établissements, propriétaire, dates d'effet, preuves et historique.
2. **Vues configurables** : par entité, groupe, boutique analytique, flux, pôle, période, obligation, niveau de risque, échéance ; une vue enregistrée ne peut jamais élargir les droits serveur du lecteur.
3. **Matrice d'accès** : CEO gouverne les habilitations par identité réelle, entité, domaine, capacité (lire / contribuer / préparer / proposer validation / valider / exporter) et durée. Les changements sensibles requièrent journal de décision, justification et, si pertinent, contrôle indépendant. Ne pas accorder toutes les entités aux responsables de pôle par défaut.
4. **Notifications** : uniquement propriétaires/validateurs désignés, échéances applicables, changement de réglementation, anomalies ou pièces bloquantes ; aucune diffusion globale de détails fiscaux sensibles.
5. **Consolidation** : synthèses Direction calculées à partir de registres autorisés ; distinguer GMV, CA propre de chaque entité, fonds de tiers, achats, TVA, transferts et contreparties. Une consolidation analytique ne vaut pas consolidation fiscale légale.
6. **Transition EI → SASU** : conserver les émetteurs, contrats, factures, décisions et obligations historiques ; aucun remplacement rétroactif d'identité.

## Matrice des responsabilités recommandée

| Action | CEO | Finance | Juridique/Conformité | Autres pôles |
| --- | --- | --- | --- | --- |
| Créer/activer une entité | Responsable décision, avec vérification indépendante | Vérifie les identités financières | Vérifie existence et habilitation | Aucun droit par défaut |
| Configurer vues et autorisations | Oui, avec journal | Proposition dans son périmètre | Contrôle des autorisations sensibles | Aucun droit global |
| Préparer obligations et calculs fiscaux | Supervision | Opérateur principal | Revue conformité si nécessaire | Pièces sur dossier attribué |
| Valider fiscalité/document | Ne remplace pas l'avis technique | Visa Finance indépendant selon action | Visa juridique si requis | Non |
| Consulter tout le groupe | Oui, sous identité CEO effective | Non par défaut | Non par défaut | Non |
| Exporter documents | Selon classification | Selon périmètre et motif | Selon périmètre et motif | Attribution ponctuelle seulement |

## Contrôles serveur obligatoires

- Les données métier de `bib_fiscal_records` sont aujourd'hui indexées par `record_id,test_account` et la RPC s'appuie sur `can_intranet_action('finance.fiscal', ...)` ; **cela ne garantit pas la limitation par entité**. Le filtrage de `FiscalHub.tsx` est seulement une commodité d'interface.
- Introduire un référentiel `bib_legal_entities`, une relation de rattachement explicite des dossiers/événements aux `entity_id` et des grants par utilisateur/entité/périmètre. Migration additive, reprise et tests de non-régression.
- Faire respecter les grants par les **RPC SECURITY DEFINER, RLS, journaux, recherche, exports et résolutions des dépendances**. Aucune URL manipulée, requête direct client ou paramètre de filtre ne doit élargir l'accès.
- La Direction doit conserver une procédure de délégation/reprise d'accès auditable pour continuité, sans ajouter de comptes CEO fictifs.
- **Ordre de déploiement** : schéma/additif → backfill manuel vérifié → permissions serveur en refus par défaut → UI → tests de rôles et cross-entity → préproduction → décision Go/No-Go. Aucun changement de droits réels sans recette.

## Critères d'acceptation

1. Le CEO authentifié peut déclarer une entité **projet** et la configurer sans créer d'obligation fiscale fictive.
2. Une entité ne devient **active** qu'après pièce juridique requise, identité fiscale applicable vérifiée et validation tracée.
3. Finance limité à l'EI ne peut ni consulter ni exporter la SASU ; un autre responsable de pôle ne voit que son dossier attribué.
4. Les espaces pôles ne révèlent ni autre entité, ni nom/compteur/événement sur les entités non autorisées.
5. Un accès retiré est immédiatement refusé par RPC, lecture, historique, export et pièces Drive.
6. Les données d'essai restent isolées et ne deviennent pas une source de déclaration.
7. Les flux communs (mandat marchand, audit fournisseur, Stripe, logistique) affichent **l'entité BIB émettrice réelle**, les autres acteurs et les documents, sans duplications ni réécriture historique.
8. Tests positifs et négatifs réels sur PostgreSQL et utilisateur connecté ; journaux, restauration, rollback, décision Direction.

## État actuel — 10/11/2026

`src/components/finance/fiscal/data.ts` déclare une liste statique de cinq catégories d'entités dont plusieurs ne sont **pas des entités légales BIB**. `FiscalHub.tsx` offre un filtre par entité et une vue transversale, mais pas une console de création d'entités juridiques. La migration 0088 expose un seul niveau de permissions `finance.fiscal` ; ses listes/RPC ne sont pas cloisonnées par entité juridique. La dernière mise à jour visuelle PR #64 ne change pas cette logique.

**Statut : cadrage prêt ; implémentation multi-entités et permissions fines non livrées, aucun droit ni migration distante modifié par cette note.**
