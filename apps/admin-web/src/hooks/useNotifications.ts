import { useState, useEffect, useCallback } from 'react';
import { 
  notificationManager, 
  NotificationPreferences, 
  useNotificationPermission 
} from '@/utils/notifications';

export interface UseNotificationsReturn {
  preferences: NotificationPreferences;
  permission: ReturnType<typeof useNotificationPermission>;
  updatePreferences: (updates: Partial<NotificationPreferences>) => void;
  requestPermission: () => Promise<NotificationPermission>;
  enableDoNotDisturb: (duration?: number) => void;
  disableDoNotDisturb: () => void;
  showNewMessage: (conversationId: string, visitorName: string, message: string) => void;
  showNewConversation: (conversationId: string, visitorName: string, websiteName: string) => void;
  showUrgentMessage: (conversationId: string, visitorName: string, message: string) => void;
  showVisitorActivity: (websiteName: string, visitorCount: number) => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationManager.getPreferences()
  );
  
  const permission = useNotificationPermission();

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'notification-preferences') {
        setPreferences(notificationManager.getPreferences());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    notificationManager.updatePreferences(updates);
    setPreferences(notificationManager.getPreferences());
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await permission.requestPermission();
    setPreferences(notificationManager.getPreferences());
    return result;
  }, [permission]);

  const enableDoNotDisturb = useCallback((duration?: number) => {
    notificationManager.enableDoNotDisturb(duration);
    setPreferences(notificationManager.getPreferences());
  }, []);

  const disableDoNotDisturb = useCallback(() => {
    notificationManager.disableDoNotDisturb();
    setPreferences(notificationManager.getPreferences());
  }, []);

  const showNewMessage = useCallback((conversationId: string, visitorName: string, message: string) => {
    notificationManager.showNewMessageNotification(conversationId, visitorName, message);
  }, []);

  const showNewConversation = useCallback((conversationId: string, visitorName: string, websiteName: string) => {
    notificationManager.showNewConversationNotification(conversationId, visitorName, websiteName);
  }, []);

  const showUrgentMessage = useCallback((conversationId: string, visitorName: string, message: string) => {
    notificationManager.showUrgentMessageNotification(conversationId, visitorName, message);
  }, []);

  const showVisitorActivity = useCallback((websiteName: string, visitorCount: number) => {
    notificationManager.showVisitorJoinedNotification(websiteName, visitorCount);
  }, []);

  return {
    preferences,
    permission,
    updatePreferences,
    requestPermission,
    enableDoNotDisturb,
    disableDoNotDisturb,
    showNewMessage,
    showNewConversation,
    showUrgentMessage,
    showVisitorActivity,
  };
};

export const useNotificationEffects = () => {
  const notifications = useNotifications();

  useEffect(() => {
    if (notifications.permission.isSupported && !notifications.permission.isGranted && !notifications.permission.isDenied) {
      const timer = setTimeout(() => {
        if (notifications.permission.isPending) {
          console.log('Consider requesting notification permission for better user experience');
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notifications.permission]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && notifications.preferences.doNotDisturb) {
        console.log('Window became visible, notifications may resume');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [notifications.preferences.doNotDisturb]);

  return notifications;
};