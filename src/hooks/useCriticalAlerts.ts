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
function mapNotificationToAlert(n: any): CriticalAlert | null {
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
const FALLBACK_ALERTS: CriticalAlert[] = [
  {
    id: 'ca-1', module: 'ethics', severity: 'critical',
    title: 'Signalement prioritaire P1',
    description: 'Nouveau signalement anonyme de harcèlement — traitement sous 24h requis.',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(), read: false,
    actionUrl: '/modules/ethics/received',
  },
  {
    id: 'ca-2', module: 'gateway', severity: 'critical',
    title: 'Message DGCCRF non traité',
    description: 'Courrier de la DGCCRF en attente de validation depuis 48h.',
    timestamp: new Date(Date.now() - 35 * 60000).toISOString(), read: false,
    actionUrl: '/modules/gateway/validation',
  },
  {
    id: 'ca-3', module: 'audit', severity: 'critical',
    title: 'Audit fournisseur — score critique',
    description: 'BioCosmetics SAS a obtenu un score de 38% — suspension recommandée.',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(), read: false,
    actionUrl: '/pole/audit/supplier',
  },
  {
    id: 'ca-4', module: 'supplier', severity: 'high',
    title: 'Fournisseur suspendu automatiquement',
    description: 'OrganicWorld Ltd suspendu suite à un score audit < 50%.',
    timestamp: new Date(Date.now() - 1.5 * 3600000).toISOString(), read: false,
    actionUrl: '/pole/supplier/suppliers',
  },
  {
    id: 'ca-5', module: 'risk', severity: 'high',
    title: 'Incident cybersécurité détecté',
    description: 'Tentative d\'accès non autorisé sur l\'API partenaire.',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), read: false,
    actionUrl: '/pole/tech/security',
  },
  {
    id: 'ca-6', module: 'performance', severity: 'high',
    title: 'Taux de livraison en baisse',
    description: 'Le taux de livraison à temps est passé sous 85% — seuil d\'alerte franchi.',
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), read: true,
    actionUrl: '/pole/ops',
  },
  {
    id: 'ca-7', module: 'audit', severity: 'medium',
    title: '3 audits périodiques en retard',
    description: 'Les audits planifiés pour NaturaCare, GreenBeauty et AromaPlantes sont en retard.',
    timestamp: new Date(Date.now() - 8 * 3600000).toISOString(), read: true,
    actionUrl: '/pole/audit/supplier',
  },
  {
    id: 'ca-8', module: 'supplier', severity: 'medium',
    title: 'Certifications expirant bientôt',
    description: '4 certifications fournisseurs expirent dans les 30 prochains jours.',
    timestamp: new Date(Date.now() - 10 * 3600000).toISOString(), read: true,
    actionUrl: '/pole/supplier/certifications',
  },
];

export function useCriticalAlerts() {
  const [localAlerts, setLocalAlerts] = useState<CriticalAlert[]>([]);
  const [lastAlert, setLastAlert] = useState<CriticalAlert | null>(null);
  const { soundEnabled } = useAlertSoundSetting();
  const qc = useQueryClient();

  // Fetch critical/warning notifications from DB
  const { data: dbNotifications = [] } = useQuery({
    queryKey: ['critical_notifications'],
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
    refetchInterval: 30000, // Poll every 30s
  });

  // Also fetch from other sources: quality_alerts, logistics_incidents, supplier_audits
  const { data: qualityAlerts = [] } = useQuery({
    queryKey: ['critical_quality_alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quality_alerts')
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

  const { data: logisticsIncidents = [] } = useQuery({
    queryKey: ['critical_logistics'],
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

    const fromQuality: CriticalAlert[] = qualityAlerts.map((qa: any) => ({
      id: `qa-${qa.id}`,
      module: 'supplier' as AlertModule,
      severity: qa.severity === 'critical' ? 'critical' as AlertSeverity : 'high' as AlertSeverity,
      title: `Alerte qualité: ${qa.title}`,
      description: qa.description,
      timestamp: qa.created_at,
      read: qa.status === 'resolved',
      actionUrl: '/pole/supplier/alerts',
    }));

    const fromLogistics: CriticalAlert[] = logisticsIncidents.map((li: any) => ({
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
    if (merged.length === 0) return FALLBACK_ALERTS;

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
