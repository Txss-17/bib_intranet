# Litiges du pôle Conformité

La migration `0051_compliance_dispute_workflow.sql` rattache la page Litiges aux dossiers canoniques `intranet_records` et à leur journal existant. Le schéma versionné ne déclare pas de table `disputes` ; la page n’utilise plus cette requête non typée, ni les anciens champs incompatibles `title/plaintiff` et `subject/party`.

## Un seul registre

Les dossiers existants de la page `compliance.disputes` sont conservés. Leurs champs historiques `entity`, `requirement` et `mitigation` alimentent respectivement la partie, le constat et la proposition. Les anciennes valeurs restent dans le contenu du dossier et le journal antérieur reste intact. Le registre reçoit une référence serveur et une date d’enregistrement issue de sa date de création connue. Il ne reçoit aucune signature ou date de validation inventée.

Une ancienne proposition en cours de revue sans auteur de soumission documenté doit revenir en traitement avant de recevoir une nouvelle validation. Une validation historique déjà enregistrée reste lisible comme telle. Les archives conservent les pièces et les événements. Aucune autre table distante n’est supprimée ou importée automatiquement.

La définition des champs est identique dans la migration et le registre frontend. Le test de concordance applique la définition initiale puis cette évolution ; l’ancienne migration n’est pas réécrite.

## Parcours

Un dossier en traitement contient un sujet, une partie et un constat. Il peut ensuite passer en analyse, puis en négociation lorsque l’analyse interne est renseignée. Le formulaire conserve les données lors d’une modification, enregistre un responsable effectivement habilité et se ferme après confirmation de réussite.

La proposition de traitement exige une analyse, une proposition rédigée, une justification écrite ou des pièces, et un compte rendu de soumission. L’issue proposée distingue une résolution d’un classement sans suite. Il s’agit de décisions internes enregistrées dans l’intranet : aucun paiement, signature externe ou message à une partie n’est déclenché.

Le contenu est verrouillé pendant la revue. Le registre prévoit deux validations pour ce module. Chaque validateur doit être distinct du déclarant, du responsable et de l’auteur réel de la soumission, y compris lorsqu’un responsable a soumis le dossier d’un autre collaborateur. Les deux validations viennent de personnes différentes et demandent un motif. Un validateur peut décider et commenter sans recevoir de droit général de modification.

Les droits enregistrés sont relus pour chaque opération. Les écritures passent par des appels dédiés, et un garde sur les dossiers empêche de contourner les règles avec les appels génériques : pas de clôture sans les revues requises, d’archivage d’un dossier actif ou de modification du contenu soumis. Les métadonnées d’identité et de décision ne sont pas fournies par le formulaire.

Une reprise motivée efface les signatures courantes et conserve les événements précédents. Une réouverture motivée après validation permet de reprendre le travail. Seul un dossier approuvé peut être archivé, avec le droit de suppression et un motif ; la suppression physique n’est pas accordée aux clients.

Le nombre de validations d’un dossier actif ne diminue pas si la configuration change. Une archive conserve le niveau qui s’appliquait à la clôture ; une réouverture peut appliquer un nouveau niveau supérieur.

Les créations réessayées après une réponse réseau incertaine réutilisent leur clé. Les formulaires et les décisions portent la révision lue au début de la modification ; une actualisation en arrière-plan n’autorise pas silencieusement l’envoi d’un ancien brouillon.

## Confidentialité et pièces

Le formulaire crée par défaut un dossier restreint au déclarant, au responsable et aux validateurs habilités. Le partage à l’équipe reste soumis au droit de lecture Conformité. Les listes, détails, compteurs et journaux suivent les mêmes règles de visibilité, ainsi que le cloisonnement réel/test.

Un nouveau responsable doit être un collaborateur Connect actif, capable de lire et modifier les litiges, dans le même environnement. Le choix n’accorde pas de droits au compte choisi. Un responsable peut transférer un dossier restreint à un autre collaborateur habilité : le transfert reste consigné, puis l’ancien responsable perd son accès s’il n’est ni déclarant ni validateur. La fiche se ferme dans ce cas. Les notifications de revue et de décision ciblent des collaborateurs habilités et ouvrent le bon dossier.

Une pièce nouvellement rattachée doit appartenir à son auteur, être lisible par lui et appartenir au même environnement. Une pièce seulement consultable ne peut pas être repartagée. Les pièces déjà attachées restent conservables par un collaborateur reprenant le dossier. Le formulaire annonce que les lecteurs autorisés du dossier pourront les consulter dans Drive BIB avec leur accès Documents. La politique documentaire existante s’applique ; les exports utilisent les outils BIB.

Les commentaires et décisions portent un auteur et un horodatage serveur. Les clients n’ont pas de droit direct d’écriture ou de suppression du journal. Une clôture exige une réouverture avant de nouveaux commentaires. Les événements sont consultables par pages de 50 et les anciens événements restent accessibles.

## Montants et pilotage

Le montant contesté est facultatif, positif ou nul, conservé sous forme décimale exacte avec deux décimales au maximum et une devise explicite. Le formulaire accepte les espaces et la virgule française, sans accepter une notation exponentielle, un signe négatif ou un texte monétaire ambigu. Zéro reste une valeur connue.

Les anciens montants non structurés restent visibles comme texte historique, sans devise supposée et sans entrer dans les sommes. Les sommes sont groupées par leur devise déclarée ; aucune conversion n’est réalisée. Les agrégats et leur affichage conservent leurs chaînes décimales exactes, même lorsque la somme dépasse la précision entière de JavaScript.

Les compteurs portent sur tous les dossiers accessibles, hors archives, indépendamment des filtres et de la première page. Ils distinguent les dossiers actifs, ceux à valider, les clôtures et les échéances internes dépassées. Un lecteur ne reçoit pas de compteur révélant des dossiers restreints auxquels il n’a pas accès. Les erreurs ne deviennent pas des zéros confirmés.

Le bouton Voir ouvre une fiche réelle via `?record=<id>`. Les listes de dossiers et d’événements sont paginées par 50. L’export porte sur la page affichée et le précise.

## Vérification

`tests/disputes/workflow.sql` utilise une transaction locale suivie d’un rollback. Il couvre la conservation du registre et des anciennes valeurs, les créations réessayées, les versions périmées, les pièces privées, les responsables, les restrictions de visibilité, les frontières réel/test, les propositions incomplètes, les validateurs distincts, le contournement par les appels génériques, les motifs, les reprises, les archives, les niveaux de revue conservés, les montants exacts, la séparation des devises, la pagination et la révocation des droits.

`tests/intranet/dispute-client.test.mjs` exerce les formulaires, les montants, l’historique, les décisions, les clés de reprise, les révisions transmises, les filtres, les pages et les caches. Il vérifie aussi qu’un déclarant possédant uniquement le droit d’archiver peut saisir son motif sans droit de validation.

La CI exécute les scénarios SQL sur PostgreSQL 17. Le scénario local peut aussi utiliser PGlite. Aucun déploiement, aucune migration publiée et aucun envoi externe ne sont effectués par ce travail.
