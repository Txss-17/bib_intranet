import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  avatar_url: string | null;
  email: string;
  poles: string[] | null;
  seniority: string | null;
  work_mode: string | null;
  subsidiary: string | null;
  manager_id: string | null;
  app_origin: string | null;
  test_account: boolean;
  hr_status: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: ProfileData | null;
  loading: boolean;
  profileError: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  profileError: null,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const fetchProfile = async (userId: string): Promise<ProfileData | null> => {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error('profile_timeout'));
    }, 15_000);
  });
  try {
    const { data, error } = await Promise.race([supabase
      .from('profiles')
      .select('id, first_name, last_name, position, avatar_url, email, poles, seniority, work_mode, subsidiary, manager_id, app_origin, hr_status, test_account')
      .eq('id', userId)
      .abortSignal(controller.signal)
      .single(), timeout]);
    if (error) throw error;
    if (!data) return null;
    return { ...data, app_origin: data.app_origin ?? null, test_account: data.test_account === true };
  } finally {
    clearTimeout(timer!);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const [profileError, setProfileError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const generation = useRef(0);
  const currentUserId = useRef<string | null>(null);

  const loadProfile = useCallback(async (id: string, request: number) => {
    try {
      const next = await fetchProfile(id);
      if (request !== generation.current || id !== currentUserId.current) return;
      setProfile(next);
      setProfileError(next ? null : 'Aucun profil intranet associé à ce compte.');
    } catch {
      if (request !== generation.current || id !== currentUserId.current) return;
      setProfile(null);
      setProfileError('Impossible de vérifier votre profil. Réessayez.');
    } finally {
      if (request === generation.current && id === currentUserId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    let scheduled: ReturnType<typeof setTimeout> | undefined;
    // Supabase emits INITIAL_SESSION. A second getSession request can race with
    // a more recent sign-in/sign-out and must not overwrite that event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      clearTimeout(scheduled);
      const id = next?.user.id ?? null;
      const changed = id !== currentUserId.current;
      if (changed) {
        // Clear data and pending reads before rendering the next account.
        void queryClient.cancelQueries();
        queryClient.clear();
        setProfile(null);
      }
      currentUserId.current = id;
      const request = ++generation.current;
      setSession(next);
      setUser(next?.user ?? null);
      setProfileError(null);
      if (!id) {
        setProfile(null);
        setLoading(false);
        return;
      }
      if (changed || _event === 'INITIAL_SESSION') setLoading(true);
      // A microtask can run before Auth releases its exclusive lock. Wait for
      // the next event-loop task before a profile read asks Auth for a token.
      scheduled = setTimeout(() => {
        if (!disposed && request === generation.current) void loadProfile(id, request);
      }, 0);
    });
    return () => {
      disposed = true;
      clearTimeout(scheduled);
      // Invalidate pending requests; this ref is a request sequence, not a DOM ref.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
      subscription.unsubscribe();
    };
  }, [loadProfile, queryClient]);

  const signOut = useCallback(async () => {
    generation.current++;
    currentUserId.current = null;
    void queryClient.cancelQueries();
    queryClient.clear();
    setSession(null);
    setUser(null);
    setProfile(null);
    setProfileError(null);
    setLoading(false);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, [queryClient]);

  const refreshProfile = useCallback(async () => {
    const id = currentUserId.current;
    if (!id) return;
    setLoading(true);
    setProfileError(null);
    await loadProfile(id, ++generation.current);
  }, [loadProfile]);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, profileError, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

