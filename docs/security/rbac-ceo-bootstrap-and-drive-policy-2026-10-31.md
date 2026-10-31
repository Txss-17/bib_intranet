# BIB Intranet — CEO, périmètres, rôles et documentaire Drive
Date : 31 octobre 2026 · Préparation uniquement, sans migration ni mise en production.

## Constat sur la base active

- 115 rôles, 155 interfaces actives, 7 actions, 23 262 lignes de permissions.
- Le rôle canonique `ceo` est actif, non « lecture seule », possède 1 085 autorisations sur 1 085 combinaisons interface/action et un périmètre global.
- Une affectation `ceo` active ; le titulaire de cette affectation possède également le rôle technique `admin`.
- Le rôle historique `cei` est inactif. Il ne doit pas être réattribué.
- Le catalogue connaît `subsidiary`, mais aucune séparation multi-filiales opérationnelle ne peut être déduite de cette seule présence.
- Les fonctions d'archivage/documentation et plusieurs migrations Intranet manquent dans la base réelle ; le simple accès CEO ne les rend pas disponibles.

## Correctifs code préparés

1. La page Rôles & Permissions privilégie le CEO actif à l'ouverture et propose « Sélectionner le CEO ».
2. Les lignes `access_permissions` sont chargées uniquement pour le rôle choisi, en pages de 1 000, au lieu de bloquer sur toutes les permissions de tous les rôles.
3. L'éditeur refuse toute sauvegarde si la matrice du rôle sélectionné n'a pas été entièrement chargée ; affichage d'une erreur de chargement et option Réessayer.
4. Le contrôle du rôle technique `admin` n'est plus transformé silencieusement en absence de droits en cas d'erreur de lecture. La page affiche une indication de vérification ou de désactivation du mode « Visualiser comme ».
5. L'indicateur de couverture permet d'observer les droits enregistrés pour un rôle, et distingue le CEO des rôles ordinaires.

Aucun de ces correctifs n'accorde des permissions directement. Les sauvegardes restent contrôlées par le backend et les politiques RLS. Le statut métier CEO n'est jamais un jeton service_role ni un accès super-utilisateur PostgreSQL.

## Politique CEO durant la phase sans équipe

Le CEO peut être configuré sur toutes les interfaces et tous les pôles. La consultation, la création et la gestion des dossiers restent soumises aux contrôles serveur et à l'appartenance aux entités autorisées. L'ensemble des actions du catalogue ne remplace pas les fonctions SQL non déployées.

Les actes exigeant une séparation des fonctions — auto-approbation de dossiers sensibles, changements de permissions hautement privilégiés, paiements, revue sécurité — gardent leur exigence d'approbation indépendante. La phase sans équipe ne justifie pas un contournement de ces garde-fous. Prévoir un approbateur indépendant ou reporter l'acte lorsque celui-ci est juridiquement/opérationnellement nécessaire.

## Modèle d'accès à conserver pour chaque rôle

- Identité du rôle, statut, ancienneté, pôle(s), description métier et caractère externe.
- Matrice des actions : lire, créer, modifier, supprimer/archiver, publier, valider, administrer.
- Périmètre : global OU combinaison contrôlée de filiale, pôle, région, portefeuille et propriétaire.
- Restriction des données sensibles et test_account ; accès à une interface ne garantit pas l'accès à ses lignes de données.
- Différenciation entre rôle catalogue, affectation à un collaborateur, privilège technique admin et privilèges de services.
- Historique et justification de toute mutation. Prévoir une mutation de matrice transactionnelle en RPC : les mises à jour directes par lots ne sont pas atomiques au niveau d'une décision de rôle.

## Drive BIB : règle transverse

- Import depuis Google Drive BIB via `FileUploadZone` / `intranet-drive`.
- Les dossiers standard utilisent `RecordAttachments`; le formulaire Contrats est maintenant raccordé à l'import Drive.
- Export via `ExportButtons` / `exportUtils` vers Drive BIB ; aucune invitation par défaut au téléchargement local.
- Aucun envoi extérieur sans workflow et journal. Documents sensibles soumis aux habilitations et, quand effectif, filigrane dynamique.
- La Sandbox Security & IT n'offre plus de téléchargement local de journal : elle requiert un Workspace de test séparé pour tout export autorisé.
- Le backend documentaire n'est PAS prêt : la table `intranet_drive_documents` et certaines fonctions de registre ne sont pas installées dans la base inspectée. Ne pas présenter la présence du bouton comme preuve d'import/export opérationnel.
- Certains écrans spécialisés ne présentent pas encore le composant documentaire commun ; un audit d'intégration de tous les pôles est nécessaire avant d'affirmer une couverture universelle.
- Des liens hérités restent consultables en mode historique selon les règles existantes ; leur conversion en documents gérés devra respecter les traces et restrictions.

## Activation après rechargement des crédits

1. Contrôler le schéma avec `ops/release/schema-drift-preflight.sql` et `ops/release/rbac-ceo-drive-preflight.sql`.
2. Résoudre les migrations manquantes dans l'ordre, sans rejouer des scripts partiellement appliqués ni relâcher RLS.
3. Vérifier les droits CEO effectifs avec la session réelle, hors mode « Visualiser comme », puis les comptes tests de chaque pôle ; conserver les refus d'accès entre rôles.
4. Régénérer les types Supabase à partir du schéma réellement déployé ; lancer `npx tsc --noEmit -p tsconfig.app.json`, tests Intranet, build et recette navigateur.
5. Vérifier l'import et l'export avec un vrai compte Workspace BIB autorisé, puis tester les refus d'accès et les journaux.
6. Préparer le modèle multi-entités group/filiales avec des identifiants et RLS serveur ; ne pas confondre filiales, marchands et prestataires.

**Aucune migration ni publication effectuée lors de cette préparation.**
