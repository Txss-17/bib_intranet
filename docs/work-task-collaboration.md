# Tâches et contrôle des sessions

Le module `/work/tasks` propose les vues Mes tâches (responsable connecté), Général (aucun pôle), Mes pôles, Multi-pôles et Toutes les tâches accessibles. Un filtre de pôle s'applique à chaque vue. Les objectifs, descriptions, priorités, responsables et échéances sont persistés. Les commentaires sont attribués au compte connecté. L'historique conserve les états avant/après et l'acteur côté serveur. L'archivage remplace la suppression physique. Une nouvelle attribution à un collègue crée une notification interne dans la même transaction ; son lien ouvre directement la tâche.

Les droits enregistrés de `work.tasks` sont prioritaires. Les affectations révoquées ou expirées ne donnent aucun accès de secours. La matrice de séniorité sert uniquement en l'absence de configuration enregistrée. La navigation utilise les droits du serveur, y compris pour un poste personnalisé ; la simulation peut seulement les réduire. Les lecteurs de tâches sont limités à leur environnement réel/test et à leur périmètre : auteur, responsable, pôle concerné, tâche générale ou direction. La modification exige en plus le droit de modifier et la qualité d'auteur, responsable ou direction. Les commentaires exigent le droit de modifier et une tâche visible non archivée. Un auteur ordinaire ne peut cibler que ses propres pôles ; une collaboration entre d'autres pôles doit être créée par la direction.

Les mises à jour et l'archivage utilisent `updated_at` comme révision attendue. Une réponse sans ligne modifiée produit une erreur, sans succès trompeur. La base calcule les dates de fin, de modification et des commentaires. Les clients ne peuvent modifier ni l'identité de création ni l'historique.

L'accès aux pages protégées attend un profil correspondant à l'utilisateur, d'origine `connect` et actif. Un échec de chargement offre une reprise et laisse les pages fermées. Les réponses tardives après un changement de compte sont ignorées ; les requêtes et leur cache sont purgés au changement d'identité et à la déconnexion.

## Déploiement

1. Vérifier les migrations déjà appliquées et les prérequis existants : `work_tasks` et sa FK `work_tasks_assignee_id_fkey`, profils avec `app_origin`, `hr_status`, `test_account`, `notifications`, catalogue RBAC, fonctions de rôle et `legacy_hr_publication_role` (0033).
2. Appliquer uniquement la nouvelle migration Drizzle 0038 enregistrée dans `_journal.json`, avant le frontend. La base existante est attendue ; le dépôt ne fournit pas une installation complète de toutes les anciennes tables.
3. Publier le frontend, puis tester avec un vrai collaborateur et un responsable : création, affectation, commentaires, refus entre pôles, conflit de modification, archivage, déconnexion et changement de compte.

Les fichiers de tests n'utilisent aucune base publiée. La CI exécute les tests Node et le scénario PostgreSQL avec des politiques historiques volontairement permissives pour vérifier que les nouvelles frontières les bloquent.

## Limites de la recette globale

Ce lot ne suffit pas à déclarer tout l'intranet prêt pour la production. La politique documentaire Google Workspace reste à implémenter et à vérifier : `src/pages/Documents.tsx` propose encore un upload dans `product-assets` et un téléchargement local ; `src/lib/exportUtils.ts` sauvegarde encore des PDF localement. Il faut un service Drive côté serveur avec droits, journalisation, destination BIB et filigrane, puis retirer les parcours incompatibles dans tous les pôles. Retirer un bouton seul ne protégerait pas un fichier déjà accessible par URL.

Les pages Produit ont encore des jeux de démonstration de secours dans `useRDData.ts`. La recette réelle des contrats Bridge, des restrictions de stockage et des workflows de chaque pôle reste nécessaire. Aucun déploiement de migration, de fonction Edge, de configuration Google ou de frontend publié n'est effectué par cette modification.
