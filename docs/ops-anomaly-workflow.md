# Traitement des anomalies Ops

La migration `0050_ops_anomaly_workflow.sql` complète le registre existant `anomalies`, après les migrations Qualité/Audit `0048` et `0049`. L’écran reste à `/pole/ops/anomalies`. Le paramètre `?anomaly=<id>` ouvre une fiche précise, indépendamment de la recherche, des filtres et de la page de résultats.

## Traitement et décisions

Une anomalie commence ouverte. Le formulaire enregistre réellement l’équipe Ops, Qualité ou Finance, ainsi que la source, le responsable, les échéances, les vérifications, l’action corrective et les preuves. Il propose uniquement des collaborateurs Connect actifs, habilités à lire et modifier les anomalies dans le même environnement. Un collaborateur habilité peut se saisir d’une fiche non attribuée. Le déclarant peut modifier son constat actif ; le traitement revient au responsable attribué ou à un responsable disposant aussi du droit de modification.

Le parcours est : ouverture, investigation, éventuelle demande d’action, correction proposée et clôture validée. La correction exige un compte rendu, une action corrective, une preuve écrite ou une pièce Drive et toutes les vérifications prévues effectuées. Le contenu est verrouillé pendant la revue. La clôture nécessite le droit de validation et un acteur distinct du déclarant, du responsable et de l’auteur de la correction. Ce droit n’accorde pas un droit général de modification.

Un validateur peut demander une reprise motivée : les signatures courantes sont effacées, tandis que les précédentes décisions restent dans le journal. Une réouverture motivée après clôture est également possible avec le droit de validation. Un classement sans suite reste distinct d’une résolution : il exige un validateur indépendant et un motif, et n’entre pas dans le délai moyen de correction. Seule une fiche clôturée peut être archivée. La suppression physique par le client est refusée.

Les créations réessayées réutilisent leur clé. Les modifications et décisions portent la révision lue au début du formulaire ou de la décision. Une version périmée est refusée ; une actualisation en arrière-plan ne transforme pas silencieusement un ancien brouillon en nouvelle version. L’écran ne se ferme qu’après confirmation de réussite. Les auteurs, références et dates de décision sont liés côté serveur, y compris lors d’une écriture directe authentifiée.

## Preuves et historique

Les pièces ajoutées doivent appartenir au collaborateur et au même environnement. Un document simplement lisible ne peut pas être repartagé en le rattachant au dossier. Les lecteurs habilités du dossier, disposant aussi de l’accès Documents, peuvent consulter ses pièces dans Drive BIB. Le formulaire annonce ce partage. Les règles précédentes des documents RH, des dossiers génériques et de la Qualité sont conservées.

Les commentaires sont internes, horodatés côté serveur et non modifiables. Un client ne peut pas insérer une fausse transition, fabriquer un auteur, modifier un événement ou écrire dans le journal des notifications. Les événements de traitement contiennent les états avant et après ; les anciens événements sont conservés.

Les anciennes clôtures ne reçoivent pas de signature inventée. Une ancienne résolution sans auteur documenté doit revenir en traitement avant une nouvelle validation. Les anciennes qualifications IA restent conservées comme données historiques ; le nouveau formulaire suit une qualification manuelle et ne fabrique pas de décision IA.

Les listes de dossiers, d’événements et de notifications sont paginées par 50 éléments. Les anciens commentaires et les notifications au-delà des 200 premiers restent accessibles. L’export porte sur la page affichée et le précise.

## Rappels et cloisonnement

La migration remplace le traitement de rappels déjà défini dans `0007`, sans déclencher son exécution sur une base publiée. Ce traitement reste réservé au service privilégié et au propriétaire de la fonction ; un utilisateur authentifié ne peut pas lancer les rappels globaux.

Un rappel concerne uniquement un dossier non archivé, encore à traiter, avec une échéance finie et un responsable actif autorisé à le lire dans le même environnement. Le rappel personnalisé doit précéder ou coïncider avec l’échéance. Sans date personnalisée, le traitement utilise les 24 heures précédant l’échéance. En retard, il peut émettre un nouveau rappel après un intervalle minimal de 20 heures.

Les lots verrouillent les lignes et ignorent les lignes déjà verrouillées. Une reprise immédiate n’émet pas le même rappel une deuxième fois. Si un droit est retiré pendant le lot, le contrôle précédant l’envoi empêche les livraisons suivantes ; un rappel non livré n’est ni compté ni marqué comme effectué. Les notifications et leur journal sont enregistrés ensemble dans la transaction. Une modification d’échéance, de rappel ou de responsable réinitialise le cycle côté serveur. Le traitement du seul horodatage de rappel ne change pas la révision de travail et ne produit pas un faux événement de modification.

Les notifications ciblent des comptes habilités et ouvrent la fiche précise. Les anomalies importantes sont signalées aux validateurs habilités de leur environnement. Les anciens messages généraux de pôle sont remplacés pour ce registre par ces notifications ciblées. Les données, pièces, responsables, journaux et notifications sont séparés entre réel et test. La classification historique utilise d’abord le déclarant, puis le responsable ; le journal enfant suit le dossier parent. Les anciens journaux génériques de notification sont reclassés d’après leur parent lorsque celui-ci est connu.

L’écran présente uniquement les rappels effectivement consignés, sans annoncer qu’un traitement de production a été activé.

## Liaison Audit et pilotage

Une mission Audit peut toujours créer son anomalie Ops lors d’une décision réelle de non-conformité. Cette exception reste limitée à l’insertion imbriquée de la mission : elle n’accorde aucun accès Ops général au validateur Audit. L’origine est conservée, l’équipe Qualité est enregistrée et le lien de provenance d’une mission associée ne peut pas être réécrit. Les écrans Audit et Ops ouvrent la fiche correspondante lorsque le collaborateur peut la consulter. Les missions de test conservent la règle de `0049` : elles ne créent pas d’anomalie Ops réelle.

Les indicateurs Ops et Direction comptent tous les dossiers de l’environnement, hors archives, indépendamment des filtres et des premières lignes affichées. Une correction proposée reste active jusqu’à validation et dispose d’un compteur de revue. Le retard concerne le traitement de la correction ; une proposition déjà résolue n’est plus comptée en retard. Les vues générales donnent uniquement leurs agrégats et ne contournent pas un refus de lecture des dossiers.

Le délai moyen couvre les corrections clôturées avec un validateur documenté, entre la déclaration et la résolution proposée. Il exclut les classements sans suite, les clôtures non documentées, les dates inversées ou futures et les archives. L’écran affiche le nombre de mesures. Les données absentes ou en erreur ne sont pas présentées comme une mesure confirmée à zéro dans les nouveaux indicateurs.

## Validation

`tests/ops/workflow.sql` utilise des données synthétiques dans une transaction terminée par un rollback. Il couvre les droits enregistrés, les décisions directes, les étapes, les acteurs distincts, les vérifications et preuves, les dates serveur, les pièces privées, les reprises de création et de correction, les conflits de révision, les anciens dossiers, l’archivage, les commentaires et notifications non falsifiables, les rappels et leur reprise, les responsables inactifs ou révoqués, les frontières réel/test, la pagination et la liaison Audit–Ops.

Le scénario s’exécute dans la CI PostgreSQL 17 et peut être exécuté localement avec PGlite. Le cron de la fixture est une fonction inerte qui ne planifie aucun traitement.

`tests/intranet/ops-anomaly-client.test.mjs` exerce le formulaire, la persistance de l’équipe, les dates locales et la conservation des échéances inchangées, les preuves, les décisions, les reprises, les révisions transmises, les filtres, les pages et les caches séparés.

Aucun déploiement, aucune migration publiée et aucun envoi externe ne sont exécutés par ce travail.
