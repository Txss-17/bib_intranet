# Qualité fournisseurs et missions Audit

Les migrations `0048_quality_alert_workflow.sql` et `0049_audit_mission_authority.sql` prolongent le parcours Support livré en `0047`. Elles complètent les tables existantes `quality_alerts` et `field_audits`. Les anciennes URL restent utilisables ; `?alert=<id>` et `?mission=<id>` ouvrent la bonne fiche, indépendamment des filtres de liste.

## Alertes et non-conformités

Les pages Fournisseurs → Alertes qualité et Audit → Non-conformités utilisent le même dossier, ses pièces et son historique. Les aperçus Ops, Conformité et les alertes globales ouvrent la fiche correspondante et excluent les archives. Une absence de droit de lecture est distinguée d’une liste vide. La page Audit affiche initialement les non-conformités formelles. Le filtre permet de distinguer ces constats des alertes ordinaires.

Le parcours est : ouverture, attribution à un collaborateur actif habilité, traitement, proposition de correction et validation indépendante. Une non-conformité formelle exige une action corrective et une preuve écrite ou un document avant sa soumission. Une alerte ordinaire demande une validation ; la règle du registre Audit en demande deux pour les non-conformités. La règle enregistrée est relue avant la décision et le nombre de validations ne peut pas diminuer sur une fiche existante.

Le déclarant, le responsable et l’auteur de la correction ne peuvent pas valider leur propre travail. Les deux validations formelles viennent de personnes différentes ; elles exigent le droit Audit de validation. Un validateur peut demander une reprise motivée. La correction revient en traitement et les signatures courantes sont effacées, tandis que les décisions précédentes restent dans le journal. Une réouverture après clôture demande un responsable habilité et un motif. Seule une fiche clôturée peut être archivée ; l’archivage conserve le dossier, les commentaires et les décisions.

Le contenu soumis reste verrouillé pendant la validation. Les écritures portent la révision lue à l’ouverture du formulaire ou au début de la décision ; une version périmée est refusée, même après une actualisation des données en arrière-plan. Une création réessayée après une réponse réseau incertaine réutilise sa clé. Les acteurs et les dates sont liés côté serveur, y compris pour les écritures directes authentifiées.

Les commentaires sont internes, horodatés côté serveur et non modifiables. Le journal et la liste sont paginés par 50 éléments. L’export porte sur la page affichée, ce que l’écran précise. Les indicateurs portent sur tout le type sélectionné, hors archives, indépendamment de la recherche.

## Références et pièces

Un nouveau rattachement fournisseur ou produit respecte les politiques de portefeuille existantes ; il ne donne aucun droit de modification commerciale. Le produit doit appartenir au fournisseur choisi. Une référence historique inchangée ne bloque pas un agent qui ne peut plus consulter cette entité.

L’ajout d’une pièce exige un document appartenant au collaborateur, lisible par lui et dans le même environnement. Un document seulement lisible ne peut pas être repartagé en le rattachant à une fiche. Les lecteurs autorisés du dossier peuvent ensuite consulter ses pièces dans Drive BIB, avec leur accès Documents. Le formulaire annonce ce partage. Un changement de droits ou d’environnement retire l’accès correspondant. Les autres dossiers et documents gardent leurs règles existantes.

Les anciens constats sont repris comme non-conformités à deux validations. Une clôture historique ne reçoit aucune signature inventée et l’écran la signale comme non documentée. Ces anciennes clôtures sans validateur connu restent exclues du délai moyen de correction. Les données de test historiques sont identifiées à partir du déclarant, puis du responsable s’il n’existe plus.

## Missions d’audit

La planification et le bouton Voir des audits terrain ouvrent une mission précise. Un lecteur Audits terrain sans accès Missions peut consulter une fiche en lecture dans son écran. Les types Qualité, Conformité, RSE et Logistique restent visibles, ainsi que les types historiques Initial, Surveillance et Périodique.

Le serveur impose les étapes déjà exposées par le suivi des missions : mission, planification, attribution, terrain, synchronisation, analyse, décision, action corrective éventuelle et clôture. Une affectation nécessite une date et un auditeur actif habilité dans le même environnement. Les constats, recommandations et scores peuvent être renseignés pendant le terrain ou l’analyse ; un score renseigné doit être compris entre 0 et 100.

Une décision de conformité ou de non-conformité exige un constat et un motif. Une clôture exige un compte rendu ; après une action corrective, elle exige aussi une preuve enregistrée. Ces décisions utilisent le droit de validation, sans accorder un droit général de modification. Le validateur est distinct du créateur et de l’auditeur terrain. Les décisions et les résultats restent verrouillés ensuite. Les missions clôturées et leur journal ne peuvent pas être supprimés par le client.

Les créations et mises à jour utilisent des appels dédiés avec clé de reprise et révision. Les protections s’appliquent également aux écritures directes authentifiées. Les événements sont uniquement produits par le serveur et leur lecture suit celle de la mission, y compris dans l’environnement de test. Les notifications ciblent un collaborateur habilité et ouvrent directement la mission.

L’ingestion privilégiée Audit Hub conserve son adaptation existante : une mission reçue de cette origine peut commencer synchronisée. Une décision réelle de non-conformité conserve la création automatique d’une anomalie Ops. Cette insertion imbriquée est limitée à la mission concernée ; elle ne donne aucun droit de création Ops général au validateur. Une mission de test ne crée pas d’anomalie Ops réelle ni sa notification de pôle.

## Indicateurs

Le compteur des non-conformités du tableau de bord Audit porte sur tous les dossiers actifs de l’environnement. Les aperçus de cinq fiches ne servent pas à calculer ce total. Le détail nécessite les droits de la page correspondante ; l’accès au tableau de bord donne uniquement ses agrégats.

Les scores moyens Audit utilisent les audits terminés ayant une valeur renseignée entre 0 et 100, avec leur nombre d’observations. Les fournisseurs sans note ne reçoivent ni note fictive ni zéro ; le classement ne contient que des fournisseurs actifs évalués. Les listes utilisées pour les totaux parcourent toutes les pages autorisées, au-delà de 1 000 lignes. Une erreur n’est pas présentée comme une liste vide ou un total confirmé à zéro. Les cartes indiquent leur périmètre et affichent un tiret en l’absence de mesure ou de droit de lecture.

Le délai de correction mesure l’intervalle entre déclaration et correction sur les cas clôturés avec un validateur connu. Il n’inclut ni le temps de revue ultérieur ni les cas actifs. Les dates manquantes, inversées ou futures restent exclues ; le nombre de mesures est affiché.

## Vérification

`tests/quality/workflow.sql` utilise une transaction locale puis un rollback. Il couvre les droits enregistrés, la séparation modification/validation, les acteurs distincts, les décisions directes, les étapes, les preuves, les pièces privées et les portefeuilles, les reprises de création, les conflits de révision, les commentaires et événements immuables, la pagination, les reprises et clôtures historiques, les frontières réel/test et l’intégration privilégiée Audit Hub/Ops. Le scénario utilise PostgreSQL 17 en CI et peut aussi être exécuté avec PGlite.

`tests/intranet/quality-workflow-client.test.mjs` exerce les décisions, les formulaires, les clés de reprise, les révisions transmises, les caches, les pages de résultats et le calcul des moyennes. Ces tests ne contactent aucun service externe.

Ces changements préparent le code et les migrations. Ils n’exécutent aucun déploiement, aucune migration publiée et aucun envoi externe.
