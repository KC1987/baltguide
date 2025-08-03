// Service Worker registration and management utilities
import { useState, useEffect, useCallback } from 'react';

export interface CacheMapAreaOptions {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zoomLevels: number[];
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isOnline = navigator.onLine;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnlineStatusChange(true));
    window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
  }

  async register(): Promise<boolean> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        
        console.log('[SW Manager] Service worker registered:', this.registration);

        // Listen for updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration?.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                this.notifyUpdate();
              }
            });
          }
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', this.handleMessage.bind(this));

        return true;
      } catch (error) {
        console.error('[SW Manager] Service worker registration failed:', error);
        return false;
      }
    }
    return false;
  }

  async update(): Promise<void> {
    if (this.registration) {
      await this.registration.update();
    }
  }

  async unregister(): Promise<boolean> {
    if (this.registration) {
      return await this.registration.unregister();
    }
    return false;
  }

  // Cache map area for offline use
  async cacheMapArea(options: CacheMapAreaOptions): Promise<boolean> {
    if (!this.registration || !this.registration.active) {
      console.warn('[SW Manager] Service worker not available for caching');
      return false;
    }

    try {
      // Pass MapBox token from environment
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      
      this.registration.active.postMessage({
        type: 'CACHE_MAP_AREA',
        payload: {
          ...options,
          mapboxToken
        }
      });
      
      return true;
    } catch (error) {
      console.error('[SW Manager] Failed to request map caching:', error);
      return false;
    }
  }

  // Check if content is available offline
  async isContentCached(url: string): Promise<boolean> {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const response = await cache.match(url);
          if (response) {
            return true;
          }
        }
      } catch (error) {
        console.error('[SW Manager] Error checking cache:', error);
      }
    }
    return false;
  }

  // Get cache storage info
  async getCacheInfo(): Promise<{
    usage: number;
    quota: number;
    percentUsed: number;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

        return { usage, quota, percentUsed };
      } catch (error) {
        console.error('[SW Manager] Error getting storage estimate:', error);
      }
    }

    return { usage: 0, quota: 0, percentUsed: 0 };
  }

  // Clear all caches
  async clearCache(): Promise<boolean> {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('[SW Manager] All caches cleared');
        return true;
      } catch (error) {
        console.error('[SW Manager] Error clearing caches:', error);
        return false;
      }
    }
    return false;
  }

  // Online status management
  get online(): boolean {
    return this.isOnline;
  }

  onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.listeners.add(callback);
    // Return unsubscribe function
    return () => this.listeners.delete(callback);
  }

  private handleOnlineStatusChange(isOnline: boolean): void {
    this.isOnline = isOnline;
    this.listeners.forEach(callback => callback(isOnline));
  }

  private handleMessage(event: MessageEvent): void {
    const { data } = event;
    
    if (data?.type === 'MAP_AREA_CACHED') {
      console.log('[SW Manager] Map area caching completed:', data.success);
      // Could dispatch custom event here for UI updates
      window.dispatchEvent(new CustomEvent('mapAreaCached', { 
        detail: { success: data.success } 
      }));
    }
  }

  private notifyUpdate(): void {
    // Notify about available update
    window.dispatchEvent(new CustomEvent('serviceWorkerUpdate'));
  }
}

// Singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// React hook for service worker functionality
export function useServiceWorker() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isOnline, setIsOnline] = useState(serviceWorkerManager.online);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [cacheInfo, setCacheInfo] = useState({ usage: 0, quota: 0, percentUsed: 0 });

  useEffect(() => {
    // Register service worker
    serviceWorkerManager.register().then(setIsRegistered);

    // Listen for online status changes
    const unsubscribe = serviceWorkerManager.onOnlineStatusChange(setIsOnline);

    // Listen for service worker updates
    const handleUpdate = () => setUpdateAvailable(true);
    window.addEventListener('serviceWorkerUpdate', handleUpdate);

    // Get initial cache info
    serviceWorkerManager.getCacheInfo().then(setCacheInfo);

    return () => {
      unsubscribe();
      window.removeEventListener('serviceWorkerUpdate', handleUpdate);
    };
  }, []);

  const cacheMapArea = useCallback(async (options: CacheMapAreaOptions) => {
    const success = await serviceWorkerManager.cacheMapArea(options);
    if (success) {
      // Refresh cache info
      const newCacheInfo = await serviceWorkerManager.getCacheInfo();
      setCacheInfo(newCacheInfo);
    }
    return success;
  }, []);

  const clearCache = useCallback(async () => {
    const success = await serviceWorkerManager.clearCache();
    if (success) {
      setCacheInfo({ usage: 0, quota: 0, percentUsed: 0 });
    }
    return success;
  }, []);

  const refreshApp = useCallback(() => {
    if (updateAvailable) {
      window.location.reload();
    }
  }, [updateAvailable]);

  return {
    isRegistered,
    isOnline,
    updateAvailable,
    cacheInfo,
    cacheMapArea,
    clearCache,
    refreshApp
  };
}

// Utility to format bytes
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}