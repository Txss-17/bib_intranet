import { supabase } from '@/integrations/supabase/client';

interface LogParams {
  section: string;          // e.g. "settings.audit_log", "settings.sensitive"
  action?: string;          // default: "view"
  allowed: boolean;
  reason?: string;
  details?: Record<string, unknown>;
}

export const logSensitiveAccess = async (params: LogParams) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;
    const userName = `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim()
      || user.email
      || 'unknown';

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      user_name: userName,
      action: params.action || 'view_sensitive_section',
      resource: params.section,
      resource_id: params.section,
      details: {
        allowed: params.allowed,
        reason: params.reason || null,
        user_agent: navigator.userAgent,
        ...params.details,
      },
    });
  } catch (e) {
    console.error('logSensitiveAccess error', e);
  }
};
