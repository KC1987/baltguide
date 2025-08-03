"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallation {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
}

interface PWACapabilities {
  serviceWorker: boolean;
  pushNotifications: boolean;
  backgroundSync: boolean;
  storage: boolean;
  geolocation: boolean;
  camera: boolean;
  webShare: boolean;
  fileSystem: boolean;
}

interface PWANotificationPermission {
  state: 'default' | 'granted' | 'denied';
  supported: boolean;
}

export function usePWA() {
  const [installation, setInstallation] = useState<PWAInstallation>({
    canInstall: false,
    isInstalled: false,
    isStandalone: false,
    installPrompt: null,
    platform: 'unknown'
  });

  const [capabilities, setCapabilities] = useState<PWACapabilities>({
    serviceWorker: false,
    pushNotifications: false,
    backgroundSync: false,
    storage: false,
    geolocation: false,
    camera: false,
    webShare: false,
    fileSystem: false
  });

  const [notificationPermission, setNotificationPermission] = useState<PWANotificationPermission>({
    state: 'default',
    supported: false
  });

  const [isAppUpdateAvailable, setIsAppUpdateAvailable] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);

  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const installPromptShown = useRef(false);

  // Detect platform
  const detectPlatform = useCallback((): PWAInstallation['platform'] => {
    const userAgent = navigator.userAgent;
    
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return 'ios';
    } else if (/Android/.test(userAgent)) {
      return 'android';
    } else if (/Windows|Mac|Linux/.test(userAgent) && !/(Android|Mobile)/.test(userAgent)) {
      return 'desktop';
    }
    
    return 'unknown';
  }, []);

  // Check if app is installed/standalone
  const checkInstallationStatus = useCallback(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true ||
                        document.referrer.includes('android-app://');
    
    const isInstalled = isStandalone || 
                       localStorage.getItem('pwa-installed') === 'true';

    return { isStandalone, isInstalled };
  }, []);

  // Check PWA capabilities
  const checkCapabilities = useCallback((): PWACapabilities => {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      pushNotifications: 'PushManager' in window,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      storage: 'storage' in navigator && 'estimate' in navigator.storage,
      geolocation: 'geolocation' in navigator,
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      webShare: 'share' in navigator,
      fileSystem: 'showOpenFilePicker' in window
    };
  }, []);

  // Check notification permission
  const checkNotificationPermission = useCallback((): PWANotificationPermission => {
    if ('Notification' in window) {
      return {
        state: Notification.permission,
        supported: true
      };
    }
    
    return {
      state: 'denied',
      supported: false
    };
  }, []);

  // Initialize PWA state
  useEffect(() => {
    const platform = detectPlatform();
    const { isStandalone, isInstalled } = checkInstallationStatus();
    const caps = checkCapabilities();
    const notifPermission = checkNotificationPermission();

    setInstallation(prev => ({
      ...prev,
      platform,
      isStandalone,
      isInstalled
    }));

    setCapabilities(caps);
    setNotificationPermission(notifPermission);

    // Check if install was previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      if (dismissedTime > oneWeekAgo) {
        setInstallDismissed(true);
      } else {
        localStorage.removeItem('pwa-install-dismissed');
      }
    }
  }, [detectPlatform, checkInstallationStatus, checkCapabilities, checkNotificationPermission]);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      
      deferredPrompt.current = promptEvent;
      
      setInstallation(prev => ({
        ...prev,
        canInstall: true,
        installPrompt: promptEvent
      }));

      // Show install prompt after a delay if not dismissed
      if (!installDismissed && !installPromptShown.current) {
        setTimeout(() => {
          setShowInstallPrompt(true);
          installPromptShown.current = true;
        }, 30000); // Show after 30 seconds
      }
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App was installed');
      localStorage.setItem('pwa-installed', 'true');
      
      setInstallation(prev => ({
        ...prev,
        canInstall: false,
        isInstalled: true,
        installPrompt: null
      }));
      
      setShowInstallPrompt(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check for app updates when user returns to app
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            registration.update();
          });
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [installDismissed]);

  // Listen for service worker updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleServiceWorkerUpdate = () => {
        setIsAppUpdateAvailable(true);
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleServiceWorkerUpdate);
      window.addEventListener('serviceWorkerUpdate', handleServiceWorkerUpdate);

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleServiceWorkerUpdate);
        window.removeEventListener('serviceWorkerUpdate', handleServiceWorkerUpdate);
      };
    }
  }, []);

  // Install the PWA
  const installApp = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt.current) {
      return false;
    }

    try {
      // Show the install prompt
      await deferredPrompt.current.prompt();
      
      // Wait for user response
      const choiceResult = await deferredPrompt.current.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
        setShowInstallPrompt(false);
        return true;
      } else {
        console.log('[PWA] User dismissed the install prompt');
        handleInstallDismiss();
        return false;
      }
    } catch (error) {
      console.error('[PWA] Error showing install prompt:', error);
      return false;
    } finally {
      deferredPrompt.current = null;
      setInstallation(prev => ({
        ...prev,
        canInstall: false,
        installPrompt: null
      }));
    }
  }, []);

  // Handle install prompt dismissal
  const handleInstallDismiss = useCallback(() => {
    setShowInstallPrompt(false);
    setInstallDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<PWANotificationPermission['state']> => {
    if (!('Notification' in window)) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(prev => ({
        ...prev,
        state: permission
      }));
      return permission;
    } catch (error) {
      console.error('[PWA] Error requesting notification permission:', error);
      return 'denied';
    }
  }, []);

  // Show notification
  const showNotification = useCallback(async (
    title: string,
    options?: NotificationOptions
  ): Promise<boolean> => {
    if (notificationPermission.state !== 'granted') {
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        return false;
      }
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          ...options
        });
      } else {
        new Notification(title, {
          icon: '/icon-192x192.png',
          ...options
        });
      }
      return true;
    } catch (error) {
      console.error('[PWA] Error showing notification:', error);
      return false;
    }
  }, [notificationPermission.state, requestNotificationPermission]);

  // Update the app
  const updateApp = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        if (registration.waiting) {
          // Tell the waiting SW to skip waiting and become active
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          
          // Reload the page to activate the new service worker
          window.location.reload();
        }
      });
    }
  }, []);

  // Share content using Web Share API
  const shareContent = useCallback(async (shareData: ShareData): Promise<boolean> => {
    if (!capabilities.webShare) {
      return false;
    }

    try {
      await navigator.share(shareData);
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('[PWA] Error sharing content:', error);
      }
      return false;
    }
  }, [capabilities.webShare]);

  // Get install instructions based on platform
  const getInstallInstructions = useCallback(() => {
    switch (installation.platform) {
      case 'ios':
        return {
          title: 'Add to Home Screen',
          steps: [
            'Tap the Share button at the bottom of your screen',
            'Scroll down and tap "Add to Home Screen"',
            'Tap "Add" to confirm'
          ],
          icon: '📱'
        };
      
      case 'android':
        return {
          title: 'Install App',
          steps: [
            'Tap the menu button (⋮) in your browser',
            'Tap "Add to Home screen" or "Install app"',
            'Tap "Install" to confirm'
          ],
          icon: '📱'
        };
      
      case 'desktop':
        return {
          title: 'Install App',
          steps: [
            'Look for the install icon in your address bar',
            'Click "Install BaltGuide"',
            'The app will be added to your desktop'
          ],
          icon: '💻'
        };
      
      default:
        return {
          title: 'Install App',
          steps: [
            'Look for install options in your browser menu',
            'Select "Install" or "Add to Home Screen"',
            'Follow the prompts to install'
          ],
          icon: '📱'
        };
    }
  }, [installation.platform]);

  return {
    // Installation state
    installation,
    showInstallPrompt,
    isAppUpdateAvailable,
    
    // Capabilities
    capabilities,
    notificationPermission,
    
    // Actions
    installApp,
    handleInstallDismiss,
    requestNotificationPermission,
    showNotification,
    updateApp,
    shareContent,
    getInstallInstructions,
    
    // Utilities
    canInstall: installation.canInstall && !installDismissed,
    isInstallable: installation.canInstall || installation.platform === 'ios',
    supportsInstall: installation.platform !== 'unknown'
  };
}

export type { PWAInstallation, PWACapabilities, PWANotificationPermission };