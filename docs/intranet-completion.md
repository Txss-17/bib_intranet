# BIB Intranet — pôles et transversal

## Périmètre livré

Le registre `src/data/intranetRegistry.json` décrit 177 pages canoniques, leurs routes, champs métier et niveaux de validation. `src/data/intranetRouteAliases.json` conserve les anciennes URL et les écrans de détail. L’inventaire reproductible est généré par `node scripts/inventory-intranet.cjs`.

Les 14 pôles sont Direction, Finance, Opérations, Fournisseurs, Marketplace, Support, Marketing, RH, Qualité/Audit, Conformité, RSE, Produit/Engineering, Data et Sécurité. Les huit ensembles transversaux de navigation sont Travail, Notifications, Gateway, Documents, Fil interne, Éthique, Audit indépendant et Permissions.

| Ensemble | Comportement |
| --- | --- |
| Écrans métier déjà connectés | Conservation des tables et des politiques de ligne existantes ; ajout de contrôles de droits et d’un journal métier sur les tables recensées. |
| Écrans auparavant de démonstration | Dossiers persistants avec schéma adapté au module, responsable, échéance, priorité, confidentialité, pièces Drive, recherche, commentaires et historique. |
| Validation des dossiers | Brouillon → soumis → validé ; première revue puis seconde validation distincte pour Direction, Finance, Audit, Conformité et Sécurité. Auteur et responsable ne s’auto-valident pas. Refus et réouverture motivés, contrôle de révision et archivage conservant l’historique. |
| Pilotage | Suppression des séries financières et techniques fabriquées. Totaux de trésorerie séparés par devise ; les vues Direction précisent leur fenêtre EUR. Une absence de données ne produit plus un score de performance fictif. |
| Travail et notifications | Conservation des tâches collaboratives de la migration 0038, vues personnelle/pôle/multi-pôles/générale ; notifications consultables et marquage de lecture. |
| Documents | Import Google Drive BIB, aperçu PDF filigrané, exports PDF/CSV/XLSX vers Drive, diffusion externe de PDF après validation distincte et journalisation. |
| Éthique | Enregistrement serveur du signalement, chiffrement AES-GCM du contenu, exclusion des coordonnées en mode anonyme, reçu après confirmation, attribution, investigation, résolution, clôture et historique. |
| Gateway | Destinataires et texte figés à la soumission, approbation distincte, mise en file atomique par destinataire, confirmation Gmail et rapprochement des retours incertains. |

Les dossiers de suivi sont des opérations manuelles : leur approbation n’exécute pas un virement, un déploiement, une commande fournisseur ou une action d’infrastructure. Les intégrations métier existantes conservent leur propre parcours et leurs contrôles. La qualification des anomalies reste manuelle.

## Autorisation

`can_intranet_action` contrôle une identité Connect active, les affectations en cours et les droits `access_permissions`. Un paramétrage canonique prime sur un ancien alias. La matrice de code n’est utilisée qu’en absence de permissions enregistrées. Une affectation révoquée ou expirée ne réactive pas le rôle historique. Les rôles en lecture seule restent sans droit de mutation.

`RouteAccessGate` protège les routes et refuse les chemins inconnus. Les mutations sensibles sont aussi contrôlées côté serveur ; masquer un bouton n’est pas une autorisation. Les mécanismes RH de provisionnement/publication et le workflow des tâches conservent leurs RPC dédiées.

La migration 0042 ajoute des politiques **restrictives** aux tables métier recensées : elle ne remplace pas les règles existantes de portefeuille, d’appartenance ou de propriétaire. Les tables commerciales partagées gardent les politiques Platform pour leurs utilisateurs Platform. Le journal métier est append-only et sa consultation passe par la politique de ligne actuelle de l’enregistrement source. Un administrateur technique actif peut également consulter les événements des enregistrements supprimés.

## Documents Google Workspace

Secrets serveur requis :

| Secret | Valeur attendue |
| --- | --- |
| `BIB_WORKSPACE_DOMAIN` | Domaine Workspace professionnel BIB. |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Compte de service Google avec délégation autorisée. |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Clé privée du compte de service ; conserver dans le gestionnaire de secrets. |
| `BIB_DRIVE_CUSTODIAN` | Compte Workspace de conservation propriétaire des copies protégées. |
| `BIB_DRIVE_MANAGED_FOLDER_ID` | Dossier privé dont les permissions sont réservées au compte de conservation. |
| `BIB_APP_ORIGIN` | Origine HTTPS exacte de l’intranet, sans chemin ni slash final. |
| `BIB_ETHICS_ENCRYPTION_KEY` | Clé AES de 32 octets encodée en base64, sauvegardée séparément des données. |
| `GOOGLE_WORKSPACE_IMPERSONATED_USER` | Boîte Gmail BIB déléguée, utilisée par le worker existant. |

Autoriser la délégation Drive pour les utilisateurs BIB concernés et Gmail pour la boîte de transport. Ne jamais exposer ces secrets dans les variables `VITE_*`. Les secrets Supabase URL/anon/service role sont fournis par l’environnement Edge.

Les fichiers restent propriété du compte de conservation. L’export crée un raccourci dans le Drive du collaborateur et un accès lecteur au fichier cible ; il ne transfère pas sa propriété. Le service vérifie les restrictions effectives de téléchargement pour lecteurs et rédacteurs. Les aperçus PDF portent l’identité, l’horodatage et une référence ; les tableurs exportés portent une feuille de traçabilité, les CSV un en-tête de traçabilité. L’interface ne propose pas de téléchargement local.

Les PDF destinés à l’extérieur sont produits après validation par une autre personne, filigranés pour le destinataire, puis partagés en lecture pour sept jours. Le demandeur exécute la diffusion ; les reprises gardent le même identifiant de fichier et la même référence. Les comptes de test n’exécutent pas de diffusion externe. Pour diffuser un tableau CSV/XLSX, produire la version PDF correspondante. Le propriétaire peut ouvrir son export tableur dans son Drive protégé.

Les photos de catalogue choisies explicitement sont des visuels destinés à la publication. Elles suivent un chemin d’actifs publics distinct du document confidentiel.

Les anciens liens Storage/publics n’ont pas été convertis automatiquement. Avant la mise en service, importer les documents historiques nécessaires dans Drive BIB, remplacer leurs références, puis contrôler et retirer les anciens accès publics selon la politique de conservation. Un document RH attribué au collaborateur reste consultable par celui-ci via la référence documentaire gérée. Les restrictions réduisent les copies directes ; elles ne constituent pas une protection contre toute capture ou recopie manuelle.

## Gateway et reprise

Le navigateur soumet une demande via `submit_intranet_outbox`. Le service `gateway-dispatch` relit son autorisation et son approbation avant d’appeler le service d’envoi. Le service d’envoi et le worker exigent la véritable clé de service ; une simple valeur `role: service_role` dans un JWT forgé est refusée.

Les références de message sont stables. L’insertion du registre de dispatch et celle de la file sont dans une transaction SQL. Après prise en charge par le worker, un résultat incertain devient « À rapprocher » : il n’est pas renvoyé automatiquement. Le rapprochement cherche le `Message-ID` exact dans les messages envoyés de la boîte Gmail et n’enregistre une confirmation que pour un résultat unique. Les refus de transport explicitement certains peuvent reprendre la même entrée de file. Les plafonds et délais du worker existant restent appliqués.

Le statut « Transport confirmé » signifie que Gmail a accepté le message, sans prétendre que le destinataire l’a lu. Aucun envoi réel n’a été effectué pendant les tests de cette livraison.

## Déploiement

La PR précédente a ajouté 0038 et a été fusionnée. Cette livraison ajoute, dans cet ordre :

1. `0039_intranet_modules.sql` : registre, permissions serveur, dossiers et journal.
2. `0040_intranet_drive.sql` : réservations idempotentes, fichiers gérés, partage et traçabilité.
3. `0041_intranet_ethics.sql` : canal confidentiel et workflow de traitement.
4. `0042_intranet_business_boundaries.sql` : contrôles additionnels des tables métier et journal.
5. `0043_intranet_gateway_outbox.sql` : soumission, approbation, file et confirmations de transport.

Appliquer les migrations avec la procédure Drizzle habituelle après sauvegarde et revue sur une copie de préproduction. Ne pas les dupliquer dans le répertoire des anciennes migrations Supabase. Publier ensuite `intranet-drive`, `intranet-ethics`, `gateway-dispatch`, les versions mises à jour de `send-transactional-email` et `process-email-queue`, ainsi que `anomaly-triage` qui refuse désormais la qualification automatique. Publier le frontend seulement après disponibilité des RPC.

Configurer les secrets Workspace/Éthique, la délégation et le dossier privé. Le scheduler du worker Gmail doit continuer à utiliser l’identité de service. Prévoir la conservation de l’ancienne clé Éthique lors d’une rotation et une migration explicite si des signalements historiques utilisent un autre format de chiffrement.

Les migrations et fonctions n’ont pas été appliquées à la base publiée depuis cette session. La recette avec les véritables comptes BIB, Drive et Gmail reste une étape d’activation, après configuration.

## Validation

La CI exécute les contrats Node des tâches, RH, restock et intranet ; les scénarios PostgreSQL 17 ; le typage du frontend et des fonctions Edge contrôlées ; et le build Vite. Les nouveaux scénarios vérifient notamment les refus d’auto-validation, les révisions périmées, les droits personnalisés et anciens alias, le cloisonnement réel/test, le verrouillage des transactions approuvées, le stockage anonyme, les réservations documentaires et la reprise d’un transport incertain.

Recette de préproduction : utiliser un auteur, deux validateurs distincts pour les modules à double validation, un employé sans droit au pôle et un compte de test. Vérifier l’import Drive, les restrictions du fichier cible, le filigrane, l’accès du destinataire RH, le refus d’un partage non approuvé et la révocation des permissions. Pour Gateway, utiliser uniquement des adresses de test autorisées et rapprocher un envoi interrompu avant toute reprise manuelle.
