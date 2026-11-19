# BIB Intranet

Application interne BIB : collaborateurs, pôles, fournisseurs, audits, Finance
et suivi des opérations. React, TypeScript, Vite et Supabase.

## Développement indépendant

Utiliser Node.js 22 et le verrou npm du dépôt :

```bash
npm ci
npm run dev
```

Renseigner les variables du projet Supabase de développement dans un fichier
local ignoré par Git :

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Les secrets serveur et les clés `service_role` ne doivent jamais porter le
préfixe `VITE_` ni être ajoutés au dépôt. Le projet ne nécessite pas l’éditeur
Lovable pour être compilé ou exécuté.

## Vérification et déploiement

La CI exécute les contrats, les tests PostgreSQL, le typage et la compilation.
`npm run test:intranet` exécute la suite transversale ; les tests PostgreSQL
utilisent les bases éphémères décrites dans `.github/workflows/ci.yml`.

Les migrations applicatives et leur journal canonique sont dans
`drizzle/migrations`. Drizzle lit la connexion serveur `BIB_DATABASE_URL`.
Comparer les schémas et les deux historiques de migrations avant d’appliquer
du SQL à une base restaurée ; ne pas rejouer en bloc les anciennes migrations
`supabase/migrations`, ni modifier artificiellement un journal.

Les fonctions Edge sont dans `supabase/functions`. Leur présence dans GitHub
ne prouve pas leur déploiement ni la configuration des fournisseurs externes.
Les réglages Auth, secrets, fournisseurs email/IA, fichiers Storage et parcours
connectés exigent une validation distincte de la compilation.

Le [dossier maître BIB](https://docs.google.com/document/d/18lpUzk5j6jTKMw9m_s2XAPsALxdeP4OVkkqpbr-iv9M)
centralise les preuves, blocages et décisions Go/No-Go. Les branches de
migration n’autorisent aucune bascule de production, DNS ou Stripe réel.
