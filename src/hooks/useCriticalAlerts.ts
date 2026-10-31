import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useState, useEffect, useCallback } from 'react';
import { playCriticalAlertSound, playHighAlertSound } from '@/lib/alertSounds';
import { useAlertSoundSetting } from '@/hooks/useAlertSoundSetting';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export type AlertSeverity = 'critical' | 'high' | 'medium';
export type AlertModule = 'ethics' | 'gateway' | 'audit' | 'supplier' | 'performance' | 'risk';

export interface CriticalAlert {
  id: string;
  module: AlertModule;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// Map notification types to alert modules based on content/pole
function mapNotificationToAlert(n: Database['public']['Tables']['notifications']['Row']): CriticalAlert | null {
  const type = n.type as string;
  const severity: AlertSeverity = type === 'critical' ? 'critical' : type === 'warning' ? 'high' : 'medium';
  
  let module: AlertModule = 'performance';
  const poleId = n.pole_id as string | null;
  const title = (n.title || '').toLowerCase();
  
  if (poleId === 'audit' || title.includes('audit')) module = 'audit';
  else if (poleId === 'supplier' || title.includes('fournisseur') || title.includes('supplier')) module = 'supplier';
  else if (poleId === 'risk' || title.includes('risque') || title.includes('incident')) module = 'risk';
  else if (title.includes('ethics') || title.includes('signalement') || title.includes('éthique')) module = 'ethics';
  else if (title.includes('gateway') || title.includes('message') || title.includes('courrier')) module = 'gateway';
  else if (title.includes('livraison') || title.includes('performance') || title.includes('sla')) module = 'performance';

  return {
    id: n.id,
    module,
    severity,
    title: n.title,
    description: n.message,
    timestamp: n.created_at,
    read: n.read || false,
    actionUrl: n.action_url,
  };
}

// Fallback static alerts for when DB is empty
export function useCriticalAlerts() {
  const { user, profile } = useAuth();
  const { can } = usePermissions();
  const qualityPage = can('supplier.alerts', 'read') ? 'supplier.alerts' : 'audit.nonconformities';
  const [localAlerts, setLocalAlerts] = useState<CriticalAlert[]>([]);
  const [lastAlert, setLastAlert] = useState<CriticalAlert | null>(null);
  const { soundEnabled } = useAlertSoundSetting();
  const qc = useQueryClient();

  // Fetch critical/warning notifications from DB
  const { data: dbNotifications = [] } = useQuery({
    queryKey: ['critical_notifications', user?.id, profile?.test_account === true],
    enabled: !!user && !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .in('type', ['critical', 'warning'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Realtime subscription for notifications
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`critical-notifications-realtime-${user?.id || 'anonymous'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id}` }, () => {
        qc.invalidateQueries({ queryKey: ['critical_notifications'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc, user?.id]);

  // Operational quality/logistics incidents belong to their permissioned pole
  // dashboards. The personal critical-alert drawer only uses recipient-owned
  // notifications (plus ephemeral alerts created by this mounted session).
  const alerts: CriticalAlert[] = [
    ...dbNotifications.map(mapNotificationToAlert).filter((a): a is CriticalAlert => a !== null),
    ...localAlerts,
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const markAsRead = useCallback((id: string) => {
    if (!user?.id) return;
    // If it's a DB notification, update in DB
    if (!id.startsWith('ca-') && !id.startsWith('qa-') && !id.startsWith('li-')) {
      supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', user!.id).then(() => {
        qc.invalidateQueries({ queryKey: ['critical_notifications'] });
      });
    }
    setLocalAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  }, [qc, user?.id]);

  const markAllAsRead = useCallback(() => {
    if (!user?.id) return;
    // Mark all DB notifications as read
    supabase.from('notifications')
      .update({ read: true })
      .in('type', ['critical', 'warning'])
      .eq('read', false)
      .eq('user_id', user!.id)
      .then(() => {
        qc.invalidateQueries({ queryKey: ['critical_notifications'] });
      });
    setLocalAlerts(prev => prev.map(a => ({ ...a, read: true })));
  }, [qc, user?.id]);

  const dismissLastAlert = useCallback(() => {
    setLastAlert(null);
  }, []);

  const unreadCount = alerts.filter(a => !a.read).length;
  const criticalCount = alerts.filter(a => !a.read && a.severity === 'critical').length;

  return {
    alerts,
    unreadCount,
    criticalCount,
    lastAlert,
    markAsRead,
    markAllAsRead,
    dismissLastAlert,
  };
}
