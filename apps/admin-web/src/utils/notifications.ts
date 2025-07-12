import { useState, useEffect } from 'react';

export type NotificationType = 'new_message' | 'new_conversation' | 'urgent_message' | 'visitor_joined';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  newMessages: boolean;
  newConversations: boolean;
  urgentMessages: boolean;
  visitorActivity: boolean;
  soundEnabled: boolean;
  doNotDisturb: boolean;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private preferences: NotificationPreferences;
  private audio: HTMLAudioElement | null = null;

  private constructor() {
    this.preferences = this.loadPreferences();
    this.initializeAudio();
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private loadPreferences(): NotificationPreferences {
    // Return default preferences during SSR
    if (typeof window === 'undefined') {
      return {
        enabled: false,
        newMessages: true,
        newConversations: true,
        urgentMessages: true,
        visitorActivity: false,
        soundEnabled: true,
        doNotDisturb: false,
      };
    }

    try {
      const stored = localStorage.getItem('notification-preferences');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load preferences from localStorage:', error);
    }
    
    return {
      enabled: false,
      newMessages: true,
      newConversations: true,
      urgentMessages: true,
      visitorActivity: false,
      soundEnabled: true,
      doNotDisturb: false,
    };
  }

  private savePreferences(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('notification-preferences', JSON.stringify(this.preferences));
      } catch (error) {
        console.warn('Failed to save preferences to localStorage:', error);
      }
    }
  }

  private initializeAudio(): void {
    // Defer audio initialization to avoid SSR issues
    if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
      try {
        this.audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmkcBDuG0fPSgCwGHm+57Ny3VA');
        this.audio.volume = 0.3;
      } catch (error) {
        console.warn('Failed to initialize audio:', error);
        this.audio = null;
      }
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Browser does not support notifications');
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.preferences.enabled = true;
        this.savePreferences();
      }
      return permission;
    }

    return Notification.permission;
  }

  getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  isNotificationAllowed(type: NotificationType): boolean {
    if (!this.preferences.enabled || this.preferences.doNotDisturb) {
      return false;
    }

    if (Notification.permission !== 'granted') {
      return false;
    }

    if (document.visibilityState === 'visible' && document.hasFocus()) {
      return false;
    }

    switch (type) {
      case 'new_message':
        return this.preferences.newMessages;
      case 'new_conversation':
        return this.preferences.newConversations;
      case 'urgent_message':
        return this.preferences.urgentMessages;
      case 'visitor_joined':
        return this.preferences.visitorActivity;
      default:
        return false;
    }
  }

  private playNotificationSound(): void {
    if (this.preferences.soundEnabled && this.audio) {
      this.audio.play().catch(console.warn);
    }
  }

  showNotification(type: NotificationType, options: NotificationOptions): Notification | null {
    console.log('showNotification called:', type, options)
    console.log('isNotificationAllowed:', this.isNotificationAllowed(type))
    console.log('Permission status:', Notification.permission)
    console.log('Preferences:', this.preferences)
    
    if (!this.isNotificationAllowed(type)) {
      console.log('Notification not allowed for type:', type)
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        ...options
      });

      if (!options.silent) {
        this.playNotificationSound();
      }

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        if (options.data?.conversationId) {
          window.location.href = `/conversations/${options.data.conversationId}`;
        } else if (options.data?.url) {
          window.location.href = options.data.url;
        }
        
        notification.close();
      };

      // Handle notification actions (only supported in some browsers)
      if ('showNotification' in navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(registration => {
          registration.addEventListener('notificationclick', (event) => {
            event.notification.close();
            
            if (event.action === 'reply') {
              // Open conversation page with reply focus
              const url = `/conversations/${options.data?.conversationId}#reply`;
              event.waitUntil(clients.openWindow(url));
            } else if (event.action === 'view' || event.action === 'accept') {
              // Open conversation page
              const url = `/conversations/${options.data?.conversationId}`;
              event.waitUntil(clients.openWindow(url));
            } else if (event.action === 'dismiss') {
              // Just close the notification
              return;
            } else {
              // Default action - open conversation
              const url = options.data?.url || `/conversations/${options.data?.conversationId}`;
              event.waitUntil(clients.openWindow(url));
            }
          });
        });
      }

      setTimeout(() => {
        notification.close();
      }, 8000);

      return notification;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return null;
    }
  }

  showNewMessageNotification(conversationId: string, visitorName: string, message: string): void {
    this.showNotification('new_message', {
      title: `New message from ${visitorName}`,
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      tag: `conversation-${conversationId}`,
      data: { conversationId, url: `/conversations/${conversationId}` },
      requireInteraction: false,
      actions: [
        {
          action: 'reply',
          title: 'Reply',
          icon: '/icons/reply.png'
        },
        {
          action: 'view',
          title: 'View',
          icon: '/icons/view.png'
        }
      ]
    });
  }

  showNewConversationNotification(conversationId: string, visitorName: string, websiteName: string): void {
    this.showNotification('new_conversation', {
      title: 'New conversation started',
      body: `${visitorName} started a conversation on ${websiteName}`,
      tag: `new-conversation-${conversationId}`,
      data: { conversationId, url: `/conversations/${conversationId}` },
      requireInteraction: true,
      actions: [
        {
          action: 'accept',
          title: 'Accept',
          icon: '/icons/accept.png'
        },
        {
          action: 'dismiss',
          title: 'Later',
          icon: '/icons/dismiss.png'
        }
      ]
    });
  }

  showUrgentMessageNotification(conversationId: string, visitorName: string, message: string): void {
    this.showNotification('urgent_message', {
      title: `Urgent message from ${visitorName}`,
      body: message,
      tag: `urgent-${conversationId}`,
      data: { conversationId, url: `/conversations/${conversationId}` },
      requireInteraction: true,
    });
  }

  showVisitorJoinedNotification(websiteName: string, visitorCount: number): void {
    this.showNotification('visitor_joined', {
      title: 'Visitor activity',
      body: `${visitorCount} visitor${visitorCount > 1 ? 's' : ''} currently on ${websiteName}`,
      tag: 'visitor-activity',
      data: { url: '/dashboard' },
      requireInteraction: false,
    });
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  updatePreferences(updates: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.savePreferences();
  }

  enableDoNotDisturb(duration?: number): void {
    this.preferences.doNotDisturb = true;
    this.savePreferences();

    if (duration) {
      setTimeout(() => {
        this.preferences.doNotDisturb = false;
        this.savePreferences();
      }, duration);
    }
  }

  disableDoNotDisturb(): void {
    this.preferences.doNotDisturb = false;
    this.savePreferences();
  }
}

export const notificationManager = NotificationManager.getInstance();

export const useNotificationPermission = () => {
  const [status, setStatus] = useState<NotificationPermission | 'unsupported'>('unsupported');
  
  useEffect(() => {
    // Only check permission status on client-side
    if (typeof window !== 'undefined') {
      setStatus(notificationManager.getPermissionStatus());
    }
  }, []);
  
  const requestPermission = async () => {
    try {
      const result = await notificationManager.requestPermission();
      setStatus(result);
      return result;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      const denied = 'denied' as NotificationPermission;
      setStatus(denied);
      return denied;
    }
  };

  return {
    status,
    requestPermission,
    isSupported: status !== 'unsupported',
    isGranted: status === 'granted',
    isDenied: status === 'denied',
    isPending: status === 'default',
  };
};