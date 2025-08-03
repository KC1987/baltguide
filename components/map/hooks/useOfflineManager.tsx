"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useServiceWorker } from '../utils/serviceWorker';

interface OfflineLocation {
  id: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  categories: string[];
  cachedAt: number;
  lastUpdated: number;
  photos?: string[];
  description?: string;
  rating?: number;
}

interface OfflineArea {
  id: string;
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zoomLevels: number[];
  locations: OfflineLocation[];
  cachedAt: number;
  estimatedSize: number;
  tileCount: number;
}

interface OfflineQueueItem {
  id: string;
  type: 'location' | 'area' | 'search' | 'favorites';
  data: any;
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
  lastAttempt: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

interface OfflineSettings {
  autoDownload: boolean;
  wifiOnly: boolean;
  maxCacheSize: number; // in MB
  cacheExpiry: number; // in days
  syncOnStartup: boolean;
  backgroundSync: boolean;
}

const OFFLINE_AREAS_KEY = 'baltguide_offline_areas';
const OFFLINE_LOCATIONS_KEY = 'baltguide_offline_locations';
const OFFLINE_QUEUE_KEY = 'baltguide_offline_queue';
const OFFLINE_SETTINGS_KEY = 'baltguide_offline_settings';

const DEFAULT_SETTINGS: OfflineSettings = {
  autoDownload: true,
  wifiOnly: true,
  maxCacheSize: 100, // 100MB
  cacheExpiry: 7, // 7 days
  syncOnStartup: true,
  backgroundSync: true
};

export function useOfflineManager() {
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineAreas, setOfflineAreas] = useState<OfflineArea[]>([]);
  const [offlineLocations, setOfflineLocations] = useState<OfflineLocation[]>([]);
  const [syncQueue, setSyncQueue] = useState<OfflineQueueItem[]>([]);
  const [settings, setSettings] = useState<OfflineSettings>(DEFAULT_SETTINGS);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'error'>('idle');

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const downloadAbortController = useRef<AbortController | null>(null);

  const { isOnline, cacheMapArea, cacheInfo } = useServiceWorker();

  // Load persisted data on mount
  useEffect(() => {
    loadPersistedData();
    initializeSettings();
  }, []);

  // Monitor online status
  useEffect(() => {
    setIsOfflineMode(!isOnline);
    
    if (isOnline && settings.syncOnStartup) {
      scheduleSyncQueue();
    }
  }, [isOnline, settings.syncOnStartup]);

  // Auto cleanup expired data
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      cleanupExpiredData();
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(cleanupInterval);
  }, [settings.cacheExpiry]);

  const loadPersistedData = () => {
    try {
      const savedAreas = localStorage.getItem(OFFLINE_AREAS_KEY);
      if (savedAreas) {
        setOfflineAreas(JSON.parse(savedAreas));
      }

      const savedLocations = localStorage.getItem(OFFLINE_LOCATIONS_KEY);
      if (savedLocations) {
        setOfflineLocations(JSON.parse(savedLocations));
      }

      const savedQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (savedQueue) {
        setSyncQueue(JSON.parse(savedQueue));
      }

      const savedSettings = localStorage.getItem(OFFLINE_SETTINGS_KEY);
      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  };

  const initializeSettings = () => {
    // Check if device is on WiFi (approximation)
    const connection = (navigator as any).connection;
    if (connection && connection.type === 'cellular') {
      setSettings(prev => ({ ...prev, wifiOnly: true }));
    }
  };

  const persistData = useCallback(() => {
    try {
      localStorage.setItem(OFFLINE_AREAS_KEY, JSON.stringify(offlineAreas));
      localStorage.setItem(OFFLINE_LOCATIONS_KEY, JSON.stringify(offlineLocations));
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(syncQueue));
      localStorage.setItem(OFFLINE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error persisting offline data:', error);
    }
  }, [offlineAreas, offlineLocations, syncQueue, settings]);

  // Persist data when state changes
  useEffect(() => {
    persistData();
  }, [persistData]);

  // Download area for offline use
  const downloadAreaForOffline = useCallback(async (
    bounds: OfflineArea['bounds'],
    name: string,
    zoomLevels: number[] = [8, 9, 10, 11, 12, 13, 14]
  ): Promise<boolean> => {
    if (isDownloading) {
      console.warn('Download already in progress');
      return false;
    }

    // Check if WiFi-only setting is enabled
    if (settings.wifiOnly && !isOnWiFi()) {
      throw new Error('WiFi required for downloading offline content');
    }

    // Estimate download size
    const estimatedSize = estimateAreaSize(bounds, zoomLevels);
    const currentUsage = cacheInfo.usage / (1024 * 1024); // Convert to MB
    
    if (currentUsage + estimatedSize > settings.maxCacheSize) {
      throw new Error(`Download would exceed cache limit (${settings.maxCacheSize}MB)`);
    }

    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      downloadAbortController.current = new AbortController();

      // Calculate total tiles to track progress
      const totalTiles = zoomLevels.reduce((total, zoom) => {
        return total + getTileCount(bounds, zoom);
      }, 0);

      // Cache map tiles with progress tracking
      const success = await cacheMapArea({ bounds, zoomLevels });
      
      if (success) {
        // Fetch and cache location data for the area
        const locations = await fetchLocationsInArea(bounds);
        
        const newArea: OfflineArea = {
          id: `area_${Date.now()}`,
          name,
          bounds,
          zoomLevels,
          locations,
          cachedAt: Date.now(),
          estimatedSize,
          tileCount: totalTiles
        };

        setOfflineAreas(prev => [...prev, newArea]);
        setDownloadProgress(100);
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error downloading area:', error);
      throw error;
    } finally {
      setIsDownloading(false);
      downloadAbortController.current = null;
    }
  }, [isDownloading, settings, cacheInfo, cacheMapArea]);

  // Cancel ongoing download
  const cancelDownload = useCallback(() => {
    if (downloadAbortController.current) {
      downloadAbortController.current.abort();
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  }, []);

  // Get offline locations
  const getOfflineLocations = useCallback((searchText?: string, filters?: any): OfflineLocation[] => {
    let results = [...offlineLocations];

    // Apply search text filter
    if (searchText) {
      const query = searchText.toLowerCase();
      results = results.filter(location => 
        location.name.toLowerCase().includes(query) ||
        location.city.toLowerCase().includes(query) ||
        location.description?.toLowerCase().includes(query)
      );
    }

    // Apply category filters
    if (filters?.categories?.length > 0) {
      results = results.filter(location =>
        filters.categories.some((cat: string) => location.categories.includes(cat))
      );
    }

    // Apply other filters
    if (filters?.family_friendly) {
      results = results.filter(location => 
        location.categories.some(cat => 
          ['amusement-theme-parks', 'educational-interactive', 'parks-nature'].includes(cat)
        )
      );
    }

    return results.sort((a, b) => b.lastUpdated - a.lastUpdated);
  }, [offlineLocations]);

  // Add to sync queue
  const addToSyncQueue = useCallback((item: Omit<OfflineQueueItem, 'id' | 'retryCount' | 'lastAttempt' | 'status'>) => {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random()}`,
      retryCount: 0,
      lastAttempt: 0,
      status: 'pending'
    };

    setSyncQueue(prev => [...prev, queueItem]);
  }, []);

  // Process sync queue
  const processSyncQueue = useCallback(async () => {
    if (!isOnline || syncQueue.length === 0) return;

    setSyncStatus('syncing');
    const pendingItems = syncQueue.filter(item => 
      item.status === 'pending' || 
      (item.status === 'failed' && item.retryCount < 3)
    );

    const updatedQueue = [...syncQueue];

    for (const item of pendingItems) {
      try {
        const index = updatedQueue.findIndex(q => q.id === item.id);
        if (index === -1) continue;

        updatedQueue[index] = { ...item, status: 'syncing', lastAttempt: Date.now() };
        setSyncQueue([...updatedQueue]);

        // Process different sync types
        let success = false;
        switch (item.type) {
          case 'location':
            success = await syncLocationData(item.data);
            break;
          case 'search':
            success = await syncSearchData(item.data);
            break;
          case 'favorites':
            success = await syncFavoritesData(item.data);
            break;
          default:
            success = false;
        }

        if (success) {
          updatedQueue[index] = { ...updatedQueue[index], status: 'completed' };
        } else {
          updatedQueue[index] = { 
            ...updatedQueue[index], 
            status: 'failed', 
            retryCount: item.retryCount + 1 
          };
        }
      } catch (error) {
        console.error('Sync error:', error);
        const index = updatedQueue.findIndex(q => q.id === item.id);
        if (index !== -1) {
          updatedQueue[index] = { 
            ...updatedQueue[index], 
            status: 'failed', 
            retryCount: item.retryCount + 1 
          };
        }
      }
    }

    setSyncQueue(updatedQueue);
    setSyncStatus('completed');

    // Clean up completed items after 5 minutes
    setTimeout(() => {
      setSyncQueue(prev => prev.filter(item => item.status !== 'completed'));
    }, 5 * 60 * 1000);
  }, [isOnline, syncQueue]);

  // Schedule sync queue processing
  const scheduleSyncQueue = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      processSyncQueue();
    }, 2000); // 2 second delay
  }, [processSyncQueue]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<OfflineSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Clean up expired data
  const cleanupExpiredData = useCallback(() => {
    const now = Date.now();
    const expiryTime = settings.cacheExpiry * 24 * 60 * 60 * 1000;

    // Clean expired areas
    setOfflineAreas(prev => prev.filter(area => 
      now - area.cachedAt < expiryTime
    ));

    // Clean expired locations
    setOfflineLocations(prev => prev.filter(location => 
      now - location.cachedAt < expiryTime
    ));

    // Clean old sync queue items
    setSyncQueue(prev => prev.filter(item => 
      item.status === 'pending' || item.status === 'syncing' ||
      now - item.lastAttempt < 24 * 60 * 60 * 1000 // Keep failed items for 24h
    ));
  }, [settings.cacheExpiry]);

  // Delete offline area
  const deleteOfflineArea = useCallback((areaId: string) => {
    setOfflineAreas(prev => prev.filter(area => area.id !== areaId));
    // Note: This doesn't clear the actual cached tiles, just the reference
    // The service worker will handle cache cleanup based on usage
  }, []);

  // Get cache usage statistics
  const getCacheStats = useCallback(() => {
    const totalAreas = offlineAreas.length;
    const totalLocations = offlineLocations.length;
    const estimatedSize = offlineAreas.reduce((total, area) => total + area.estimatedSize, 0);
    const queueSize = syncQueue.filter(item => item.status === 'pending').length;

    return {
      totalAreas,
      totalLocations,
      estimatedSize,
      queueSize,
      cacheUsage: cacheInfo.percentUsed
    };
  }, [offlineAreas, offlineLocations, syncQueue, cacheInfo]);

  // Helper functions
  const isOnWiFi = (): boolean => {
    const connection = (navigator as any).connection;
    return !connection || connection.type === 'wifi' || connection.effectiveType === '4g';
  };

  const estimateAreaSize = (bounds: OfflineArea['bounds'], zoomLevels: number[]): number => {
    // Rough estimation: average tile size ~20KB
    const totalTiles = zoomLevels.reduce((total, zoom) => {
      return total + getTileCount(bounds, zoom);
    }, 0);
    
    return (totalTiles * 20) / 1024; // Size in MB
  };

  const getTileCount = (bounds: OfflineArea['bounds'], zoom: number): number => {
    const minTile = { 
      x: Math.floor((bounds.west + 180) / 360 * Math.pow(2, zoom)),
      y: Math.floor((1 - Math.log(Math.tan(bounds.north * Math.PI / 180) + 1 / Math.cos(bounds.north * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))
    };
    const maxTile = {
      x: Math.floor((bounds.east + 180) / 360 * Math.pow(2, zoom)),
      y: Math.floor((1 - Math.log(Math.tan(bounds.south * Math.PI / 180) + 1 / Math.cos(bounds.south * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))
    };
    
    return (maxTile.x - minTile.x + 1) * (maxTile.y - minTile.y + 1);
  };

  const fetchLocationsInArea = async (bounds: OfflineArea['bounds']): Promise<OfflineLocation[]> => {
    // This would typically make an API call to fetch locations
    // For now, return empty array - implement based on your API
    return [];
  };

  const syncLocationData = async (data: any): Promise<boolean> => {
    // Implement location data sync
    return true;
  };

  const syncSearchData = async (data: any): Promise<boolean> => {
    // Implement search data sync
    return true;
  };

  const syncFavoritesData = async (data: any): Promise<boolean> => {
    // Implement favorites sync
    return true;
  };

  return {
    // State
    isOfflineMode,
    offlineAreas,
    offlineLocations,
    syncQueue,
    settings,
    isDownloading,
    downloadProgress,
    syncStatus,

    // Actions
    downloadAreaForOffline,
    cancelDownload,
    getOfflineLocations,
    addToSyncQueue,
    processSyncQueue,
    updateSettings,
    deleteOfflineArea,
    cleanupExpiredData,

    // Utilities
    getCacheStats,
    isOnline
  };
}

export type { OfflineArea, OfflineLocation, OfflineSettings, OfflineQueueItem };