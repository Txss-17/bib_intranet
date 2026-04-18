import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const getIp = async (): Promise<string> => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch { return 'unknown'; }
};

export const useAuthLogger = () => {
  const logged = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user && !logged.current) {
          logged.current = true;
          const ip = await getIp();
          const userName = `${session.user.user_metadata?.first_name || ''} ${session.user.user_metadata?.last_name || ''}`.trim() || session.user.email;

          // Legacy audit_logs (business actions)
          supabase.from('audit_logs').insert({
            user_id: session.user.id,
            user_name: userName,
            action: 'login',
            resource: 'auth',
            resource_id: session.user.id,
            ip_address: ip,
            details: {
              email: session.user.email,
              provider: session.user.app_metadata?.provider || 'email',
              user_agent: navigator.userAgent,
            },
          }).then(() => {}, (e) => console.error('audit_logs error:', e));

          // New auth_logs (Tech pole)
          (supabase as any).from('auth_logs').insert({
            user_id: session.user.id,
            user_email: session.user.email,
            event_type: 'login_success',
            ip_address: ip,
            user_agent: navigator.userAgent,
            app_origin: 'bos',
            metadata: { provider: session.user.app_metadata?.provider || 'email' },
          }).then(() => {}, (e: any) => console.error('auth_logs error:', e));
        }

        if (event === 'SIGNED_OUT') {
          if (logged.current) {
            const ip = await getIp();
            (supabase as any).from('auth_logs').insert({
              event_type: 'logout',
              ip_address: ip,
              user_agent: navigator.userAgent,
              app_origin: 'bos',
            }).then(() => {}, () => {});
          }
          logged.current = false;
        }

        if (event === 'PASSWORD_RECOVERY') {
          const ip = await getIp();
          (supabase as any).from('auth_logs').insert({
            event_type: 'password_reset',
            ip_address: ip,
            user_agent: navigator.userAgent,
            app_origin: 'bos',
          }).then(() => {}, () => {});
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
};
