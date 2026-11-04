# Documents juridiques des boutiques et preuves de commande — 4 novembre 2026

Ce lot ajoute la gouvernance et les contrôles techniques des modèles JUR-B01, JUR-B02 et JUR-B03. Il ne publie aucun texte, ne certifie aucune identité et n’active aucune vente. Les migrations et fonctions sont préparées et testées localement ; aucune base existante n’a été migrée et aucun secret distant n’a été modifié.

## Fonctionnement livré

### Intrabib

Le registre apparaît dans Conformité → Politiques et Direction → Gouvernance. Un modèle français contient sa référence, sa version unique, son titre, le texte complet et une date d’effet ISO avec fuseau. Les champs {{…}} sont limités à une liste contrôlée issue des modèles documentaires. Les paramètres nécessaires à chaque famille sont obligatoires. Le texte reste en clair structuré, jamais interprété comme du HTML.

Le cycle est : brouillon → soumis → revue juridique → validation Direction → publication au registre → retrait éventuel. L’auteur, le relecteur juridique et le valideur Direction sont trois personnes distinctes, avec permissions enregistrées et références de justificatifs. La publication ne remplace pas l’examen juridique compétent. Une correction avant publication repasse par une nouvelle revue ; après publication, le contenu est verrouillé et une nouvelle version est nécessaire.

Conformité → Contrats permet de préparer une vérification d’identité à partir de l’identifiant exact d’une boutique Platform. Le serveur relit propriétaire et champs de base, conserve une empreinte et refuse la création si ces données ont changé depuis leur présentation. Le navigateur ne remplace ni propriétaire, ni identité, ni coordonnées de base. Forme juridique, médiateur réellement désigné, TVA applicable, exploitant BIB et hébergeur contractuel sont renseignés par les personnes habilitées avec les preuves requises. Aucun nom, régime fiscal ou prestataire n’est inventé par le code.

L’identité française est relue indépendamment de son auteur, puis publiée au registre. L’identifiant technique d’entité est partagé par les boutiques portant le même SIREN, y compris si des SIRET d’établissement diffèrent. Des boutiques EI distinctes n’acquièrent donc pas chacune une fausse identité juridique. Le contrôle de format ne prouve pas l’immatriculation : la vérification humaine et son justificatif restent requis. D’autres juridictions nécessiteront un contrat de données adapté.

Chaque action conserve acteur, révision, motif, justificatifs et états précédents. Les permissions enregistrées et le mode test/réel restent applicables aux RPC et aux écritures directes. Les validations sensibles exigent les personnes distinctes prévues, même si une personne possède plusieurs rôles.

### Transmission entre les applications

La publication ou le retrait crée une entrée de transmission persistante. L’interface tente l’envoi ; un échec laisse un état en attente, consultable et reprenable. L’endpoint Intrabib vérifie le JWT et les permissions réelles, exporte uniquement le dossier courant autorisé et contacte l’endpoint privé Platform avec le secret partagé. Le navigateur ne fournit pas un modèle prétendument approuvé.

Platform vérifie secret, environnement et enveloppe avant de modifier son miroir. Une même transmission se rejoue sans doublon ; un ancien message ne rétablit pas un contenu retiré. Une version publiée n’est pas réécrite sous le même identifiant. L’accusé de réception est enregistré uniquement par le serveur après confirmation distante de la séquence exacte. Les notes et justificatifs internes ne sont pas publiés avec les documents clients.

La réplication dépend de la réception distante. Un retrait en attente ne bloque pas instantanément l’ancienne copie sur Platform : reprendre immédiatement sa transmission et, si nécessaire, suspendre la boutique avec la procédure opérationnelle autorisée. Ce lot ne déploie pas de worker planifié de reprise. Le statut « publié dans le registre » ne signifie pas « transmission confirmée ».

### Platform

Les pages CGV, CGU et mentions lisent un assemblage serveur composé des trois modèles approuvés et applicables, de l’identité vérifiée du vendeur actuel et des seuls champs autorisés. Les textes libres du thème ne servent pas de clauses. Les textes juridiques français ne sont pas traduits automatiquement ; les libellés d’interface restent réactifs en FR/EN.

Le choix du modèle utilise sa date d’effet puis son ordre d’activation. Un modèle futur ne remplace pas immédiatement la version applicable. Le retrait de la version qui serait sélectionnée bloque l’assemblage au lieu de réactiver silencieusement un ancien texte. Une version future retirée doit donc être examinée avant sa date prévue si l’on souhaite assurer la continuité documentaire.

La publication commerciale exige identité complète, correspondance avec la vérification et présence des trois modèles applicables. Le contrôle SQL empêche le contournement de l’écran Studio. Les validations existantes des scènes, du catalogue et des métadonnées restent en place. Modifier le propriétaire ou les champs de base du vendeur replace la boutique en brouillon. Les réglages expliquent cette conséquence et le serveur refuse la reprise tant que la nouvelle identité ne correspond pas à une vérification publiée.

Le paiement exige une action d’accord explicite sur les textes présentés. Un remplacement de version remet la case d’accord à zéro. Le serveur compare l’empreinte présentée à l’assemblage actuel puis crée, dans la même transaction, l’instantané et les commandes. Une erreur annule l’ensemble. La vérification s’effectue avant la réservation de stock et la création de session de paiement. Une reprise ne contourne pas un retrait ou un changement de version.

La clé de checkout est conservée par le composant pendant ses appels et utilisée pour l’idempotence des commandes et de la session Stripe. Une clé réutilisée avec un autre contrat est refusée. Cela ne valide ni n’active le montage Stripe/Connect et ne remplace pas sa recette financière.

L’instantané conserve textes exacts, modèles et versions, vendeur/entité, paramètres, empreintes, date de l’accord et canal. Il est protégé contre la modification, et les champs contractuels de la commande ne peuvent pas être réaffectés après sa création. Les commandes historiques sans preuve ne reçoivent aucun accord fabriqué. Le suivi client donne accès à la version conservée et à un téléchargement texte, via le même couple numéro de commande/email que le suivi existant. L’accès direct aux tables privées reste interdit.

Les accords CGV/CGU, l’information de confidentialité, le marketing et les cookies restent distincts. Aucune préférence facultative n’est créée par l’achat. Le déclencheur d’onboarding est aligné sur les versions déjà présentées par les fichiers TS et JS, notamment confidentialité 2026-11-02. Les anciennes preuves restent inchangées et l’autoinscription marchande n’est pas rouverte.

## Mise en service : préproduction isolée uniquement

1. Appliquer la démarche de rapprochement et de sauvegarde/restauration de l’issue [Intrabib #32](https://github.com/Txss-17/bib_intranet/issues/32). Les fixtures PGlite vérifient le nouveau contrat SQL sur un schéma minimal ; elles ne prouvent pas la compatibilité d’une base existante.
2. Examiner l’historique Drizzle avant les migrations : Intrabib `0084_legal_document_governance` ; Platform `0025_store_legal_governance_and_order_evidence`. Le journal Platform enregistre aussi `0024_sav_48h_atomic_escalation`, fichier déjà existant qui manquait au registre. Ne pas rejouer les anciennes migrations Supabase en bloc.
3. Déployer les fonctions privées `legal-governance-import` (Platform) et `legal-governance-bridge` (Intrabib), puis la version coordonnée de `create-storefront-checkout`. Une ancienne fonction de checkout ne peut plus insérer une nouvelle commande storefront sans preuve : la bascule doit être coordonnée. Les anciennes commandes et les ventes POS conservent leur parcours propre.
4. Configurer le même `BIB_PLATFORM_BRIDGE_SECRET` aléatoire d’au moins 32 caractères et l’URL serveur `BIB_PLATFORM_FUNCTIONS_URL` côté Intrabib. Les clients serveur utilisent les variables Supabase standard, jamais une clé service dans `VITE_*`.
5. Sur Platform, configurer `BIB_PUBLIC_SITE_ORIGIN` comme origine HTTPS canonique, sans chemin, identifiants, requête ni fragment. Le mode est déterminé par les variables serveur existantes `PAYMENTS_ENVIRONMENT`, `PAYMENTS_LIVE_PROJECT_REF`, éventuellement `PAYMENTS_SANDBOX_PROJECT_REF`, et l’URL du projet. Sandbox et réel requièrent des projets distincts. L’environnement et l’origine du miroir sont fixés lors de sa première livraison ; leur changement ultérieur nécessite une procédure de migration contrôlée.
6. Vérifier les permissions Conformité Politiques/Contrats et Direction Gouvernance, puis préparer les textes depuis les documents approuvés par les personnes compétentes. Renseigner les identités réelles, le médiateur, l’opérateur et l’hébergement sur justificatifs. Publier et transmettre les trois modèles et chaque vérification de vendeur. Aucune migration ne réalise ces validations métier.
7. Exécuter les préflights en lecture seule : ils vérifient aussi tables/RLS, fonctions privées et déclencheurs juridiques actifs. Ils continuent à refuser une base vide ou incomplète.
8. Réaliser la recette croisée : auteur ne pouvant s’approuver, rôle révoqué, accès test/réel, changement d’identité, modèle futur, retrait, transmission perdue puis reprise, devises/environnement, accord absent, version changée, même clé de checkout, échec de réservation et accès aux anciennes preuves. Vérifier les transactions réelles de la base de préproduction et la politique de conservation/archivage des preuves avant activation commerciale.

Les anciennes pages de travail restent consultables dans l’historique Git de Platform à `9f76d428`. Aucun document fiscal, signature électronique certifiée ou validation juridique automatique n’est revendiqué. L’export est du texte ; PDF, accusés automatiques et politiques de purge contrôlée nécessitent encore leur workflow dédié.

## Vérifications de développement

- Intrabib : 13 tests ciblés passent (huit SQL et cinq frontière HTTP), plus les trois tests existants du journal et des préflights.
- Platform : 16 tests ciblés passent (douze SQL et quatre frontière HTTP), huit tests du vrai handler de checkout avec dépendances simulées et un test d’interface imposant un nouvel accord après changement de version.
- Bridge : un essai supplémentaire exécute les deux migrations SQL, les validations distinctes, l’export/import réel de leurs enveloppes, une preuve de commande et le retrait sans effacement de l’historique. Il s’agit de deux bases PGlite isolées, pas des projets Supabase déployés.
- Total nouveau lot : 39 nouveaux tests ciblés réussis. Cinq contrôles documentaires existants passent aussi ; leurs anciennes assertions de routage statique ont été adaptées à l’assemblage serveur, avec les tests SQL ci-dessus pour le comportement réel.
- TypeScript applications et nouvelles frontières Edge, contrôle des types du bridge et builds passent. Le lint Platform conserve seulement son avertissement préexistant ; les nouveaux composants/hooks Intrabib passent leur lint ciblé.
- Suites générales comparées à main avant ce lot : Platform 251 tests réussis sur 261, avec les mêmes dix échecs et deux erreurs de chargement ; Intrabib 232/248, avec les mêmes seize échecs. Suite bridge : 185/192, avec les mêmes sept échecs préexistants. Aucun de ces échecs n’est masqué ou désactivé. La CI RH Intrabib possède également les neuf échecs préexistants documentés lors du lot précédent.

## Périmètre restant

Le registre concerne actuellement JUR-B01/B02/B03 en français. La gouvernance native des modèles BIB vers marchands/acheteurs JUR-M et JUR-C reste à étendre ; l’alignement d’onboarding n’est pas présenté comme leur refonte complète. Restent la recette de préproduction, la reprise automatique des transmissions, les variantes linguistiques juridiques, les PDF, le parcours de rétractation, les capacités et précommandes, l’échantillon/configuration, le montage PSP et la couverture financière avant production. La protection juridique livrée ne constitue pas l’éligibilité commerciale complète de tous ces lots.
