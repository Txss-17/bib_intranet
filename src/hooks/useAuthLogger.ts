import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAuthLogger = () => {
  const logged = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user && !logged.current) {
          logged.current = true;
          try {
            // Get approximate IP via public API
            let ip = 'unknown';
            try {
              const res = await fetch('https://api.ipify.org?format=json');
              const data = await res.json();
              ip = data.ip;
            } catch { /* fallback */ }

            await supabase.from('audit_logs').insert({
              user_id: session.user.id,
              user_name: `${session.user.user_metadata?.first_name || ''} ${session.user.user_metadata?.last_name || ''}`.trim() || session.user.email,
              action: 'login',
              resource: 'auth',
              resource_id: session.user.id,
              ip_address: ip,
              details: {
                email: session.user.email,
                provider: session.user.app_metadata?.provider || 'email',
                user_agent: navigator.userAgent,
              },
            });
          } catch (err) {
            console.error('Auth log error:', err);
          }
        }

        if (event === 'SIGNED_OUT') {
          logged.current = false;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
};
