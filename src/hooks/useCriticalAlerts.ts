import { useState, useEffect, useCallback } from 'react';
import { playCriticalAlertSound, playHighAlertSound } from '@/lib/alertSounds';

export type AlertSeverity = 'critical' | 'high' | 'medium';
export type AlertModule = 'ethics' | 'gateway';

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

const INITIAL_ALERTS: CriticalAlert[] = [
  {
    id: 'ca-1',
    module: 'ethics',
    severity: 'critical',
    title: 'Signalement prioritaire P1',
    description: 'Nouveau signalement anonyme de harcèlement — traitement sous 24h requis.',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    read: false,
    actionUrl: '/modules/ethics/received',
  },
  {
    id: 'ca-2',
    module: 'gateway',
    severity: 'critical',
    title: 'Message DGCCRF non traité',
    description: 'Courrier de la DGCCRF en attente de validation depuis 48h — délai réglementaire dépassé.',
    timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
    read: false,
    actionUrl: '/modules/gateway/validation',
  },
  {
    id: 'ca-3',
    module: 'ethics',
    severity: 'high',
    title: 'Dossier en cours sans assignation',
    description: 'Le dossier ETH-2026-042 est ouvert depuis 5 jours sans investigateur assigné.',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    read: false,
    actionUrl: '/modules/ethics/ongoing',
  },
  {
    id: 'ca-4',
    module: 'gateway',
    severity: 'high',
    title: 'Routage bloqué — pôle Finance',
    description: '3 messages validés en attente de routage vers le pôle Finance depuis 72h.',
    timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
    read: true,
    actionUrl: '/modules/gateway/routing',
  },
  {
    id: 'ca-5',
    module: 'gateway',
    severity: 'medium',
    title: 'Réponse en brouillon expirée',
    description: 'La réponse à la réclamation GW-2026-018 est en brouillon depuis 7 jours.',
    timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
    read: true,
    actionUrl: '/modules/gateway/responses',
  },
  {
    id: 'ca-6',
    module: 'ethics',
    severity: 'medium',
    title: 'Taux de résolution en baisse',
    description: 'Le taux de résolution Ethics est passé sous 70% ce mois — tendance négative.',
    timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
    read: true,
    actionUrl: '/modules/ethics/stats',
  },
];

const SIMULATED_ALERTS: Omit<CriticalAlert, 'id' | 'timestamp' | 'read'>[] = [
  {
    module: 'ethics',
    severity: 'critical',
    title: 'Escalade automatique déclenchée',
    description: 'Le dossier ETH-2026-051 a été automatiquement escaladé après 48h sans réponse.',
    actionUrl: '/modules/ethics/ongoing',
  },
  {
    module: 'gateway',
    severity: 'critical',
    title: 'Doublon détecté — courrier entrant',
    description: 'Message GW-2026-089 identifié comme doublon potentiel d\'un courrier ACPR.',
    actionUrl: '/modules/gateway/inbox',
  },
  {
    module: 'ethics',
    severity: 'high',
    title: 'Nouveau signalement sensible',
    description: 'Signalement identifié concernant un membre de la direction — protocole spécial requis.',
    actionUrl: '/modules/ethics/received',
  },
  {
    module: 'gateway',
    severity: 'high',
    title: 'SLA dépassé — validation',
    description: '2 messages en validation dépassent le SLA de 24h — action immédiate requise.',
    actionUrl: '/modules/gateway/validation',
  },
];

let nextId = 7;

export function useCriticalAlerts() {
  const [alerts, setAlerts] = useState<CriticalAlert[]>(INITIAL_ALERTS);
  const [lastAlert, setLastAlert] = useState<CriticalAlert | null>(null);

  // Simulate incoming alerts every 45-90 seconds
  useEffect(() => {
    const scheduleNext = () => {
      const delay = 45000 + Math.random() * 45000;
      return setTimeout(() => {
        const template = SIMULATED_ALERTS[Math.floor(Math.random() * SIMULATED_ALERTS.length)];
        const newAlert: CriticalAlert = {
          ...template,
          id: `ca-${nextId++}`,
          timestamp: new Date().toISOString(),
          read: false,
        };
        setAlerts(prev => [newAlert, ...prev]);
        setLastAlert(newAlert);
        if (newAlert.severity === 'critical') {
          playCriticalAlertSound();
        } else {
          playHighAlertSound();
        }
        timerId = scheduleNext();
      }, delay);
    };
    let timerId = scheduleNext();
    return () => clearTimeout(timerId);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  }, []);

  const markAllAsRead = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  }, []);

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
