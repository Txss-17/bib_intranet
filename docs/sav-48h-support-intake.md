# Parcours SAV assuré — queue BIB Intranet (30 octobre 2026)

## Provenance et responsabilités

Une réclamation commence dans **BIB Platform** : le marchand en reste le vendeur responsable. Le module d'assurance BIB permet une **reprise de coordination** lorsque le marchand n'a pas répondu en 48 h, et seulement si l'abonnement assurance est actif. Ce n'est pas un transfert automatique de responsabilité légale, ni une garantie qu'un remboursement aura lieu.

La migration Platform `0024_sav_48h_atomic_escalation.sql` (PR Platform n°8) produit un événement append-only `sav_escalation_events` après l'expiration de l'échéance. L'export privé `intranet-export` transmet seulement les UUID de signalement, commande, boutique et vendeur, les dates, l'environnement et la raison ; **aucune adresse e-mail ni message client**.

Le `platform-bridge` Intranet valide la forme et la concordance vendeur-boutique ; l'import utilise l'identifiant canonique du signalement `issue_id` et une insertion `ignoreDuplicates`. L'import réitéré ne modifie donc ni le collaborateur attribué, ni la décision, ni le compte rendu. L'arrivée d'une nouvelle escalade génère une notification vers `/pole/support/escalations?issue=<uuid>`.

## Traitement Support

`src/pages/modules/support/SupportEscalations.tsx` devient une interface métier avec :
- file des escalades assurées, en attente / prises en charge / closes, ordonnée par date et explicitement limitée à 200 lignes ;
- référence canonique de commande et de boutique Platform sans information client nominative ;
- **Prendre en charge** : RPC `acknowledge_sav_escalation` atomique et idempotente pour l'agent déjà assigné ;
- **Clôturer** : RPC `close_sav_escalation` exige un compte rendu de 10 caractères minimum ; seul l'agent assigné peut clôturer ;
- journal serveur append-only des décisions, lecture soumise au même périmètre ;
- section distincte des escalades internes déjà existantes (Work).

L'accès est refusé sauf droit `support.escalations` enregistré, profil Connect habilité et séparation `sandbox/live` conforme au marqueur de compte test. Les écritures directes côté navigateur sont retirées au profit des RPC. Le service privé importe avec `service_role`. Aucun crédit, débit, remboursement ou transfert juridique ne s'exécute ici.

## Déploiement coordonné indispensable

1. Valider et appliquer les migrations Intranet de référence, **dans l'ordre**, dont `0039`, `0044`, `0052`, puis `0054_sav_escalation_intake.sql`, sur une copie de préproduction vérifiée. La base Lovable accessible au 30 octobre était encore antérieure à `0039` : ne **jamais** appliquer `0054` isolément.
2. Activer migration Platform `0024` et déployer le backend de réponse atomique en même temps que son frontend. Sans migration, l'ancien client ne doit pas être publié.
3. Déployer le travailleur SAV et configurer son ordonnanceur avec secrets serveur et environnement explicitement choisis ; **sans ordonnanceur, la détection ne s'exécute pas seule**.
4. Déployer l'export Platform et le bridge Intranet, puis seulement l'interface Intranet, dans un créneau contrôlé avec rollback.
5. Tester les mêmes identifiants et événements à chaque frontière : cas non assuré, assuré en retard, réponse au 47e heure, tentative en retard, deux travailleurs concurrents, un import redoublé, l'attribution et la clôture avec compte rendu, demande de remboursement distincte.
6. Vérifier la présence et le traitement de la notification Support, les journaux de synchronisation et les messages d'erreur.

## Tests de recette

`tests/sav-intake/workflow.sql` exerce les vraies fonctions et les policies de la file sur PostgreSQL 17 : lecture cloisonnée, reprise, rejouabilité, motif obligatoire, journal, absence d'écriture directe et refus d'un utilisateur non habilité.

**Cette PR ne lance aucune migration dans la base Lovable, n'active aucun cron, et ne publie aucune application.**
