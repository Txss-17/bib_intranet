# BIB — Runbook de contrôle et restauration de test hors Lovable

**Statut : préparation (lecture seule) | Décision Go/No-Go NON prise**
Documentation de référence : https://docs.google.com/document/d/18lpUzk5j6jTKMw9m_s2XAPsALxdeP4OVkkqpbr-iv9M/edit

## 1. Export source Lovable Cloud
1. Depuis le tableau de bord Lovable, déclencher un export de données pour CE projet. Éviter de lancer d'autres actions Lovable payantes non nécessaires.
2. Télécharger l'archive sur un poste de confiance ; ne pas la placer dans GitHub, un stockage public, les logs CI, un ticket, un chat ou une pièce jointe non chiffrée.
3. Chiffrer l'archive et conserver l'original immuable dans un emplacement de sauvegarde contrôlé par BIB ; accès limité aux personnes habilitées.
4. Installer les outils PostgreSQL compatibles sur le poste d'analyse puis exécuter la validation **locale et en lecture seule** :
   ```bash
   bash scripts/migration/verify-backup.sh /chemin/prive/archive.backup
   ```
5. Répertorier dans un journal sécurisé le nom logique du projet, date de capture, taille, SHA-256, inventaire de la table des matières et l'identité du vérificateur. Seuls les totaux et les empreintes peuvent être reportés dans GitHub ; jamais le contenu du dump.

Le script prend en charge un dump PostgreSQL au format custom, éventuellement encapsulé dans gzip. Si le format est différent, il s'arrête sans restaurer. Examiner alors le type du fichier et la procédure adaptée ; ne pas forcer `pg_restore` sur un fichier SQL ou inconnu.

## 2. Vérifications de complétude
- Schémas : tables, vues, types, séquences, index, contraintes, clés étrangères, fonctions, triggers, policies RLS, propriétaires et grants.
- Extensions : versions source et destination ; `pg_cron`, `pg_net`, `pgmq` et `supabase_vault` lorsqu'applicables.
- Migration history : `supabase_migrations.schema_migrations` ; pour Platform/Intranet également `drizzle.__drizzle_migrations`. Ne jamais empiler sans contrôle « ancien SQL de migrations » et restauration complète.
- Identités : `auth.users`, `auth.identities`, rôles/mappings internes ; contrôler les méthodes d'authentification et le maintien possible des empreintes de mots de passe.
- Storage : l'archive PostgreSQL peut contenir des **métadonnées**, pas les binaires. Restaurer les objets via un chemin sécurisé, puis comparer noms, tailles, contenu/hashes et ACL.
- Fonctionnement serveur : déploiement séparé des Edge Functions, secrets, planificateurs, webhook signatures, SMTP, API externes, URL Auth et redirections.
- Données locales navigateur ou PWA : inventorier et synchroniser avant changement d'origine ; les données IndexedDB/localStorage ne se transfèrent pas automatiquement vers un nouveau domaine.

## 3. Projet Supabase indépendant — staging uniquement
**Ne pas écrire sur un projet partagé ou de production.** Provisionner un projet Supabase BIB indépendant, vide de données métier, avec une facturation et une région validées.
- Activer MFA administrateur, restrictions d'accès et journalisation. Aucun secret n'est copié dans Git.
- Évaluer la compatibilité du dump avec les schémas Supabase gérés `auth`, `storage`, `realtime`, `vault` et les rôles système. Une restauration intégrale aveugle peut entrer en conflit avec les objets préexistants de Supabase.
- Choisir une stratégie de restauration **révisée par un administrateur PostgreSQL**, s'appuyant sur la documentation Supabase relative au type exact d'archive. Le script livré ici ne restaure rien.
- Prévoir la gestion de la racine de chiffrement Vault : une restauration manuelle n'implique pas la copie de la clé maître du projet source. Reprovisionner les secrets si besoin.
- Conserver le projet source intact et préserver l'origine des données.

## 4. Critères de recette
- Contrôle des totaux source/cible, intégrité relationnelle, séquences, permissions, RLS positives ET négatives, schémas et fonctions `SECURITY DEFINER`.
- Connexion test et récupération de compte, réauthentification après changement de JWT/domaine, callback URL et MFA si applicable.
- Épreuves E2E propres à l'application (voir section dédiée).
- Tester une deuxième restauration pour vérifier la reproductibilité et conserver des preuves anonymisées de résultat.
- Simulation de rollback incluant les **écritures intervenues APRÈS bascule**, sans perte des transactions ni des événements d'audit.

## 5. Go/No-Go et protection production
NO-GO tant que : export non vérifié, restauration non testée, isolation RLS insuffisante, défaut Stripe/email/notify, divergences d'identités, perte de données offline, ou rollback non prouvé.
Aucune modification DNS, aucun transfert de registrar, aucune rotation de secret live et aucune résiliation de Lovable tant que les portes précédentes ne sont pas validées.

Références : https://supabase.com/docs/guides/platform/migrating-within-supabase ; https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore ; https://supabase.com/docs/guides/platform/migrating-within-supabase/dashboard-restore

## 6. Recette spécifique Intranet
- Préserver l'identité et les autorisations des 116 comptes email ; onboarding CEO et Manager RH complet ; tests d'accès stricts entre pôles.
- Inventorier les 236 fonctions `SECURITY DEFINER` et les 1 046 policies RLS public, en priorité RH/finance/juridique.
- Les buckets `governance-documents` et `database_export_19_07_26` sont privés ; confirmer usage réel et récupération protégée.
- Vérifier toutes les communications inter-projets Platform et Audit, absence de fuite de données des audits et stabilité des logs.
- Référence source (11/11/2026) : 207 tables public, 116 identités email, 23 migrations Supabase, 6 objets Storage ; valeurs susceptibles de varier.
