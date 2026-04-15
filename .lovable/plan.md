

# Isolation authentification Business OS / Connect

## Contexte
Les deux apps partagent le même backend Lovable Cloud mais ne doivent pas partager l'authentification. On ajoute une colonne `app_origin` pour séparer logiquement les utilisateurs.

## Étape 1 — Migration SQL (automatique via l'outil migration)

```sql
-- Ajouter la colonne app_origin aux profils
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS app_origin text NOT NULL DEFAULT 'bos';

-- Mettre à jour le trigger handle_new_user pour lire app_origin depuis les metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, app_origin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'app_origin', 'bos')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer');
  RETURN NEW;
END;
$$;

-- Activer Realtime sur notifications et feed_posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts;
```

## Étape 2 — AuthGuard : vérification app_origin

Modifier `AuthGuard.tsx` pour :
1. Lire `profile.app_origin` depuis le hook `useAuth`
2. Si `app_origin !== 'bos'` → `signOut()` + redirect `/login` avec toast d'erreur

## Étape 3 — useAuth : exposer app_origin

Ajouter `app_origin` au type du profil et au `SELECT` dans `useAuth.tsx`.

## Étape 4 — Documentation pour LINKSY Connect

Fournir les instructions pour le second projet :
- Utiliser les mêmes `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`
- Au signup : `supabase.auth.signUp({ data: { app_origin: 'connect' } })`
- Au login : vérifier `profile.app_origin === 'connect'`

## Fichiers modifiés
- **Migration SQL** : 1 migration (app_origin + trigger + realtime)
- `src/hooks/useAuth.tsx` : ajouter `app_origin` au profil
- `src/components/AuthGuard.tsx` : vérifier `app_origin === 'bos'`

