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
    const channel = supabase
      .channel('critical-notifications-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        qc.invalidateQueries({ queryKey: ['critical_notifications'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  // Also fetch from other sources: quality_alerts, logistics_incidents, supplier_audits
  const { data: qualityAlerts = [] } = useQuery({
    queryKey: ['critical_quality_alerts', user?.id, profile?.test_account === true, qualityPage],
    enabled: !!user && !!profile && can(qualityPage, 'read'),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quality_alerts')
        .select('*')
        .in('status', ['open', 'investigating', 'resolved', 'reviewed'])
        .is('archived_at', null)
        .in('severity', ['critical', 'high'])
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  const { data: logisticsIncidents = [] } = useQuery({
    queryKey: ['critical_logistics', user?.id, profile?.test_account === true],
    enabled: !!user && !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logistics_incidents')
        .select('*')
        .in('status', ['open', 'investigating'])
        .in('severity', ['critical', 'high'])
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  // Merge all sources into alerts
  const alerts: CriticalAlert[] = (() => {
    const fromDb: CriticalAlert[] = dbNotifications
      .map(mapNotificationToAlert)
      .filter((a): a is CriticalAlert => a !== null);

    const fromQuality: CriticalAlert[] = qualityAlerts.map((qa) => ({
      id: `qa-${qa.id}`,
      module: 'supplier' as AlertModule,
      severity: qa.severity === 'critical' ? 'critical' as AlertSeverity : 'high' as AlertSeverity,
      title: `Alerte qualité: ${qa.title}`,
      description: qa.description,
      timestamp: qa.created_at,
      read: qa.status === 'resolved',
      actionUrl: `${qualityPage === 'supplier.alerts' ? '/pole/supplier/alerts' : '/pole/audit/nonconformities'}?alert=${qa.id}`,
    }));

    const fromLogistics: CriticalAlert[] = logisticsIncidents.map((li) => ({
      id: `li-${li.id}`,
      module: 'performance' as AlertModule,
      severity: li.severity === 'critical' ? 'critical' as AlertSeverity : 'high' as AlertSeverity,
      title: `Incident logistique: ${li.incident_type}`,
      description: li.description,
      timestamp: li.created_at,
      read: false,
      actionUrl: '/pole/ops/incidents',
    }));

    const merged = [...fromDb, ...fromQuality, ...fromLogistics, ...localAlerts];
    
    // If no real data, use fallbacks
    if (merged.length === 0) return [];

    // Sort by timestamp desc
    return merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  })();

  const markAsRead = useCallback((id: string) => {
    // If it's a DB notification, update in DB
    if (!id.startsWith('ca-') && !id.startsWith('qa-') && !id.startsWith('li-')) {
      supabase.from('notifications').update({ read: true }).eq('id', id).then(() => {
        qc.invalidateQueries({ queryKey: ['critical_notifications'] });
      });
    }
    setLocalAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  }, [qc]);

  const markAllAsRead = useCallback(() => {
    // Mark all DB notifications as read
    supabase.from('notifications')
      .update({ read: true })
      .in('type', ['critical', 'warning'])
      .eq('read', false)
      .then(() => {
        qc.invalidateQueries({ queryKey: ['critical_notifications'] });
      });
    setLocalAlerts(prev => prev.map(a => ({ ...a, read: true })));
  }, [qc]);

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
