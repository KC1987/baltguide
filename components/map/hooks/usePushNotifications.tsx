"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSmartFilters } from './useSmartFilters';

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface NotificationTemplate {
  id: string;
  type: 'location_recommendation' | 'weather_alert' | 'nearby_event' | 'price_drop' | 'new_location' | 'reminder';
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  actions?: NotificationAction[];
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
}

interface LocationRecommendation {
  locationId: string;
  name: string;
  category: string;
  distance: number;
  reason: string;
  confidence: number;
  coordinates: { lat: number; lng: number };
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationSchedule {
  id: string;
  type: string;
  scheduledFor: number;
  data: any;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    days?: number[]; // 0-6, Sunday-Saturday
    time?: string; // HH:MM format
  };
}

interface NotificationSettings {
  enabled: boolean;
  types: {
    recommendations: boolean;
    weather: boolean;
    events: boolean;
    priceDrops: boolean;
    reminders: boolean;
  };
  schedule: {
    quiet_hours: {
      enabled: boolean;
      start: string; // HH:MM
      end: string; // HH:MM
    };
    frequency: 'immediate' | 'batched' | 'daily_digest';
    max_per_day: number;
  };
  location_based: {
    enabled: boolean;
    radius: number; // in km
    only_when_nearby: boolean;
  };
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  types: {
    recommendations: true,
    weather: true,
    events: true,
    priceDrops: false,
    reminders: true
  },
  schedule: {
    quiet_hours: {
      enabled: true,
      start: '22:00',
      end: '08:00'
    },
    frequency: 'batched',
    max_per_day: 3
  },
  location_based: {
    enabled: false,
    radius: 5,
    only_when_nearby: false
  }
};

const NOTIFICATION_STORAGE_KEY = 'baltguide_notification_settings';
const SUBSCRIPTION_STORAGE_KEY = 'baltguide_push_subscription';
const SCHEDULE_STORAGE_KEY = 'baltguide_notification_schedule';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [scheduledNotifications, setScheduledNotifications] = useState<NotificationSchedule[]>([]);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const { contextualData, userPreferences } = useSmartFilters();

  // Initialize notification system
  useEffect(() => {
    const initializeNotifications = async () => {
      // Check support
      const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);

      if (!supported) return;

      // Load settings
      const savedSettings = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      }

      // Load scheduled notifications
      const savedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (savedSchedule) {
        setScheduledNotifications(JSON.parse(savedSchedule));
      }

      // Get current permission
      setPermission(Notification.permission);

      // Get service worker registration
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          registrationRef.current = registration;

          // Check existing subscription
          const existingSubscription = await registration.pushManager.getSubscription();
          if (existingSubscription) {
            setSubscription({
              endpoint: existingSubscription.endpoint,
              keys: {
                p256dh: arrayBufferToBase64(existingSubscription.getKey('p256dh')!),
                auth: arrayBufferToBase64(existingSubscription.getKey('auth')!)
              }
            });
          }
        } catch (error) {
          console.error('[Push] Error initializing service worker:', error);
        }
      }
    };

    initializeNotifications();
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('[Push] Error requesting permission:', error);
      return 'denied';
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !registrationRef.current) {
      return false;
    }

    if (permission !== 'granted') {
      const newPermission = await requestPermission();
      if (newPermission !== 'granted') {
        return false;
      }
    }

    try {
      setIsSubscribing(true);

      // Generate VAPID key (in production, this should come from your server)
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
        'BGjlPX8L8w0lv_s7KYjFQhP-dK5zWzRXjvS-Hs0yEZF3YcJt8YvmMRJLgklHRGk6fYwJ4z8MNp7xQVKbG5c9NWw';

      const subscription = await registrationRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      setSubscription(subscriptionData);
      localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscriptionData));

      // TODO: Send subscription to server
      await sendSubscriptionToServer(subscriptionData);

      return true;
    } catch (error) {
      console.error('[Push] Error subscribing:', error);
      return false;
    } finally {
      setIsSubscribing(false);
    }
  }, [isSupported, permission, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!registrationRef.current) {
      return false;
    }

    try {
      const subscription = await registrationRef.current.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        
        // TODO: Remove subscription from server
        const currentSubscription = subscription;
        if (currentSubscription) {
          await removeSubscriptionFromServer({
            endpoint: currentSubscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(currentSubscription.getKey('p256dh')!),
              auth: arrayBufferToBase64(currentSubscription.getKey('auth')!)
            }
          });
        }
      }

      setSubscription(null);
      localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
      
      return true;
    } catch (error) {
      console.error('[Push] Error unsubscribing:', error);
      return false;
    }
  }, []);

  // Update notification settings
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updatedSettings));
  }, [settings]);

  // Generate location-based recommendations
  const generateLocationRecommendations = useCallback(async (
    userLocation: { lat: number; lng: number }
  ): Promise<LocationRecommendation[]> => {
    // This would typically make an API call to get nearby recommendations
    // For now, return mock data based on user preferences
    
    const mockRecommendations: LocationRecommendation[] = [];
    
    if (userPreferences.categories?.length) {
      userPreferences.categories.forEach(category => {
        mockRecommendations.push({
          locationId: `rec_${Date.now()}_${Math.random()}`,
          name: `${category.replace('-', ' ')} attraction nearby`,
          category,
          distance: Math.random() * 2 + 0.5, // 0.5-2.5 km
          reason: `Based on your interest in ${category.replace('-', ' ')}`,
          confidence: 0.8 + Math.random() * 0.2,
          coordinates: {
            lat: userLocation.lat + (Math.random() - 0.5) * 0.01,
            lng: userLocation.lng + (Math.random() - 0.5) * 0.01
          }
        });
      });
    }

    return mockRecommendations.slice(0, 3);
  }, [userPreferences]);

  // Schedule a notification
  const scheduleNotification = useCallback((schedule: Omit<NotificationSchedule, 'id'>) => {
    const newSchedule: NotificationSchedule = {
      ...schedule,
      id: `schedule_${Date.now()}_${Math.random()}`
    };

    setScheduledNotifications(prev => {
      const updated = [...prev, newSchedule];
      localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    return newSchedule.id;
  }, []);

  // Cancel scheduled notification
  const cancelScheduledNotification = useCallback((scheduleId: string) => {
    setScheduledNotifications(prev => {
      const updated = prev.filter(s => s.id !== scheduleId);
      localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Send immediate notification
  const sendNotification = useCallback(async (template: NotificationTemplate): Promise<boolean> => {
    if (!settings.enabled || permission !== 'granted') {
      return false;
    }

    // Check quiet hours
    if (settings.schedule.quiet_hours.enabled && isInQuietHours()) {
      // Schedule for later instead
      const nextAllowedTime = getNextAllowedTime();
      scheduleNotification({
        type: template.type,
        scheduledFor: nextAllowedTime,
        data: template
      });
      return true;
    }

    // Check daily limit
    if (notificationCount >= settings.schedule.max_per_day) {
      return false;
    }

    try {
      if (registrationRef.current) {
        await registrationRef.current.showNotification(template.title, {
          body: template.body,
          icon: template.icon || '/icon-192x192.png',
          badge: template.badge || '/badge-72x72.png',
          actions: template.actions,
          data: template.data,
          requireInteraction: template.requireInteraction,
          silent: template.silent,
          tag: template.type
        });

        setNotificationCount(prev => prev + 1);
        return true;
      }
    } catch (error) {
      console.error('[Push] Error sending notification:', error);
    }

    return false;
  }, [settings, permission, notificationCount, scheduleNotification]);

  // Send location recommendation
  const sendLocationRecommendation = useCallback(async (
    recommendation: LocationRecommendation
  ): Promise<boolean> => {
    if (!settings.types.recommendations) {
      return false;
    }

    const template: NotificationTemplate = {
      id: `rec_${Date.now()}`,
      type: 'location_recommendation',
      title: `📍 ${recommendation.name}`,
      body: `${recommendation.reason} • ${recommendation.distance.toFixed(1)}km away`,
      data: {
        locationId: recommendation.locationId,
        coordinates: recommendation.coordinates,
        url: `/location/${recommendation.locationId}`
      },
      actions: [
        {
          action: 'view',
          title: 'View Details',
          icon: '/action-view.png'
        },
        {
          action: 'directions',
          title: 'Get Directions',
          icon: '/action-directions.png'
        }
      ]
    };

    return await sendNotification(template);
  }, [settings.types.recommendations, sendNotification]);

  // Process scheduled notifications
  const processScheduledNotifications = useCallback(async () => {
    const now = Date.now();
    const dueNotifications = scheduledNotifications.filter(s => s.scheduledFor <= now);

    for (const notification of dueNotifications) {
      await sendNotification(notification.data);
      
      // Handle recurring notifications
      if (notification.recurring) {
        const nextTime = calculateNextRecurrence(notification);
        if (nextTime) {
          scheduleNotification({
            type: notification.type,
            scheduledFor: nextTime,
            data: notification.data,
            recurring: notification.recurring
          });
        }
      }

      // Remove processed notification
      cancelScheduledNotification(notification.id);
    }
  }, [scheduledNotifications, sendNotification, scheduleNotification, cancelScheduledNotification]);

  // Process scheduled notifications periodically
  useEffect(() => {
    if (!settings.enabled) return;

    const interval = setInterval(processScheduledNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [settings.enabled, processScheduledNotifications]);

  // Reset daily notification count at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timeout = setTimeout(() => {
      setNotificationCount(0);
      
      // Set up daily reset
      const dailyReset = setInterval(() => {
        setNotificationCount(0);
      }, 24 * 60 * 60 * 1000);

      return () => clearInterval(dailyReset);
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, []);

  // Utility functions
  const isInQuietHours = useCallback((): boolean => {
    if (!settings.schedule.quiet_hours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = settings.schedule.quiet_hours.start.split(':').map(Number);
    const [endHour, endMin] = settings.schedule.quiet_hours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }, [settings.schedule.quiet_hours]);

  const getNextAllowedTime = useCallback((): number => {
    const now = new Date();
    const [endHour, endMin] = settings.schedule.quiet_hours.end.split(':').map(Number);
    
    const nextAllowed = new Date(now);
    nextAllowed.setHours(endHour, endMin, 0, 0);
    
    if (nextAllowed <= now) {
      nextAllowed.setDate(nextAllowed.getDate() + 1);
    }
    
    return nextAllowed.getTime();
  }, [settings.schedule.quiet_hours.end]);

  const calculateNextRecurrence = useCallback((schedule: NotificationSchedule): number | null => {
    if (!schedule.recurring) return null;

    const now = new Date();
    const next = new Date(now);

    switch (schedule.recurring.frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
    }

    if (schedule.recurring.time) {
      const [hour, minute] = schedule.recurring.time.split(':').map(Number);
      next.setHours(hour, minute, 0, 0);
    }

    return next.getTime();
  }, []);

  // Helper functions for push subscription
  const sendSubscriptionToServer = async (subscription: PushSubscription): Promise<void> => {
    // TODO: Implement server endpoint to store subscription
    console.log('[Push] Subscription to send to server:', subscription);
  };

  const removeSubscriptionFromServer = async (subscription: PushSubscription): Promise<void> => {
    // TODO: Implement server endpoint to remove subscription
    console.log('[Push] Subscription to remove from server:', subscription);
  };

  return {
    // State
    isSupported,
    permission,
    subscription,
    settings,
    scheduledNotifications,
    isSubscribing,
    notificationCount,

    // Actions
    requestPermission,
    subscribe,
    unsubscribe,
    updateSettings,
    sendNotification,
    sendLocationRecommendation,
    scheduleNotification,
    cancelScheduledNotification,
    generateLocationRecommendations,

    // Utilities
    isSubscribed: !!subscription,
    canSendNotifications: permission === 'granted' && settings.enabled,
    dailyLimitReached: notificationCount >= settings.schedule.max_per_day,
    isInQuietHours: isInQuietHours()
  };
}

// Utility functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type { NotificationTemplate, LocationRecommendation, NotificationSettings };