import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeNotification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'critical';
  pole_id: string | null;
  read: boolean;
  action_url: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface InterPoleMessage {
  id: string;
  from_pole: string;
  to_pole: string;
  from_user_id: string | null;
  subject: string;
  content: string;
  priority: string;
  read: boolean;
  created_at: string;
}

export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [interPoleMessages, setInterPoleMessages] = useState<InterPoleMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const fetchInitialData = useCallback(async () => {
    try {
      // Fetch notifications
      const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (notifError) {
        console.error('Error fetching notifications:', notifError);
      } else if (notifData) {
        setNotifications(notifData as RealtimeNotification[]);
        setUnreadCount(notifData.filter(n => !n.read).length);
      }

      // Fetch inter-pole messages
      const { data: msgData, error: msgError } = await supabase
        .from('inter_pole_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (msgError) {
        console.error('Error fetching inter-pole messages:', msgError);
      } else if (msgData) {
        setInterPoleMessages(msgData as InterPoleMessage[]);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  }, []);

  useEffect(() => {
    let notificationChannel: RealtimeChannel;
    let messageChannel: RealtimeChannel;

    const setupRealtimeSubscriptions = async () => {
      // Subscribe to notifications
      notificationChannel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications'
          },
          (payload) => {
            console.log('New notification received:', payload);
            const newNotification = payload.new as RealtimeNotification;
            setNotifications(prev => [newNotification, ...prev]);
            if (!newNotification.read) {
              setUnreadCount(prev => prev + 1);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications'
          },
          (payload) => {
            const updatedNotification = payload.new as RealtimeNotification;
            setNotifications(prev =>
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            );
            // Recalculate unread count
            setNotifications(prev => {
              setUnreadCount(prev.filter(n => !n.read).length);
              return prev;
            });
          }
        )
        .subscribe((status) => {
          console.log('Notification channel status:', status);
          setIsConnected(status === 'SUBSCRIBED');
        });

      // Subscribe to inter-pole messages
      messageChannel = supabase
        .channel('inter-pole-messages-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'inter_pole_messages'
          },
          (payload) => {
            console.log('New inter-pole message received:', payload);
            const newMessage = payload.new as InterPoleMessage;
            setInterPoleMessages(prev => [newMessage, ...prev]);
          }
        )
        .subscribe();

      await fetchInitialData();
    };

    setupRealtimeSubscriptions();

    return () => {
      if (notificationChannel) {
        supabase.removeChannel(notificationChannel);
      }
      if (messageChannel) {
        supabase.removeChannel(messageChannel);
      }
    };
  }, [fetchInitialData]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const sendInterPoleMessage = async (
    fromPole: 'direction' | 'finance' | 'ops' | 'tech' | 'rh' | 'supplier' | 'audit' | 'compliance' | 'rse' | 'marketing' | 'risk' | 'lifecycle',
    toPole: 'direction' | 'finance' | 'ops' | 'tech' | 'rh' | 'supplier' | 'audit' | 'compliance' | 'rse' | 'marketing' | 'risk' | 'lifecycle',
    subject: string,
    content: string,
    priority: string = 'normal'
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('inter_pole_messages')
      .insert({
        from_pole: fromPole,
        to_pole: toPole,
        from_user_id: user?.id,
        subject,
        content,
        priority
      });

    if (error) {
      console.error('Error sending inter-pole message:', error);
      throw error;
    }
  };

  return {
    notifications,
    interPoleMessages,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    sendInterPoleMessage,
    refetch: fetchInitialData
  };
}
