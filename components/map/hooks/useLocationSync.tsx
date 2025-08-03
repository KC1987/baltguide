"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useOfflineManager } from './useOfflineManager';

interface LocationUpdateConfig {
  enabledTypes: {
    attractions: boolean;
    restaurants: boolean;
    hotels: boolean;
    events: boolean;
    weather: boolean;
  };
  updateFrequency: {
    nearbyRange: number; // km
    checkInterval: number; // minutes
    backgroundSync: boolean;
    wifiOnly: boolean;
  };
  geofencing: {
    enabled: boolean;
    regions: GeofenceRegion[];
    entryActions: string[];
    exitActions: string[];
  };
}

interface GeofenceRegion {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  radius: number; // meters
  priority: 'high' | 'medium' | 'low';
  triggers: {
    entry: boolean;
    exit: boolean;
    dwell: { enabled: boolean; duration: number }; // minutes
  };
  syncActions: {
    preloadContent: boolean;
    updatePrices: boolean;
    fetchEvents: boolean;
    downloadMaps: boolean;
  };
}

interface LocationContext {
  currentLocation: { lat: number; lng: number } | null;
  lastKnownLocation: { lat: number; lng: number } | null;
  locationAccuracy: number;
  movementSpeed: number; // km/h
  isStationary: boolean;
  currentRegion: GeofenceRegion | null;
  nearbyRegions: GeofenceRegion[];
}

interface SyncStatus {
  isActive: boolean;
  lastSync: number;
  nextSync: number;
  syncProgress: {
    total: number;
    completed: number;
    current: string;
    errors: string[];
  };
  backgroundSyncSupported: boolean;
  currentOperation: string | null;
}

const DEFAULT_CONFIG: LocationUpdateConfig = {
  enabledTypes: {
    attractions: true,
    restaurants: true,
    hotels: false,
    events: true,
    weather: true
  },
  updateFrequency: {
    nearbyRange: 5, // 5km radius
    checkInterval: 15, // every 15 minutes
    backgroundSync: true,
    wifiOnly: false
  },
  geofencing: {
    enabled: true,
    regions: [],
    entryActions: ['preload-content', 'update-weather'],
    exitActions: ['cleanup-cache']
  }
};

const CONFIG_STORAGE_KEY = 'baltguide_location_sync_config';
const SYNC_DATA_STORAGE_KEY = 'baltguide_sync_status';
const GEOFENCE_STORAGE_KEY = 'baltguide_geofence_regions';

export function useLocationSync() {
  const [config, setConfig] = useState<LocationUpdateConfig>(DEFAULT_CONFIG);
  const [locationContext, setLocationContext] = useState<LocationContext>({
    currentLocation: null,
    lastKnownLocation: null,
    locationAccuracy: 0,
    movementSpeed: 0,
    isStationary: true,
    currentRegion: null,
    nearbyRegions: []
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isActive: false,
    lastSync: 0,
    nextSync: 0,
    syncProgress: {
      total: 0,
      completed: 0,
      current: '',
      errors: []
    },
    backgroundSyncSupported: false,
    currentOperation: null
  });

  const watchIdRef = useRef<number | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationHistoryRef = useRef<Array<{ position: { lat: number; lng: number }; timestamp: number }>>([]);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const { downloadAreaForOffline, isOfflineMode } = useOfflineManager();

  // Initialize location sync system
  useEffect(() => {
    const initializeLocationSync = async () => {
      // Load saved configuration
      const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (savedConfig) {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) });
      }

      // Load geofence regions
      const savedRegions = localStorage.getItem(GEOFENCE_STORAGE_KEY);
      if (savedRegions) {
        const regions = JSON.parse(savedRegions);
        setConfig(prev => ({
          ...prev,
          geofencing: { ...prev.geofencing, regions }
        }));
      }

      // Check service worker support for background sync
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          registrationRef.current = registration;
          
          const backgroundSyncSupported = 'sync' in registration;
          setSyncStatus(prev => ({
            ...prev,
            backgroundSyncSupported
          }));

          console.log('[LocationSync] Background sync supported:', backgroundSyncSupported);
        } catch (error) {
          console.error('[LocationSync] Error initializing service worker:', error);
        }
      }

      // Set up default geofence regions for Baltic capitals
      const defaultRegions: GeofenceRegion[] = [
        {
          id: 'tallinn',
          name: 'Tallinn',
          coordinates: { lat: 59.4370, lng: 24.7536 },
          radius: 15000,
          priority: 'high',
          triggers: { entry: true, exit: true, dwell: { enabled: true, duration: 30 } },
          syncActions: { preloadContent: true, updatePrices: true, fetchEvents: true, downloadMaps: true }
        },
        {
          id: 'riga',
          name: 'Riga',
          coordinates: { lat: 56.9496, lng: 24.1052 },
          radius: 15000,
          priority: 'high',
          triggers: { entry: true, exit: true, dwell: { enabled: true, duration: 30 } },
          syncActions: { preloadContent: true, updatePrices: true, fetchEvents: true, downloadMaps: true }
        },
        {
          id: 'vilnius',
          name: 'Vilnius',
          coordinates: { lat: 54.6892, lng: 25.2798 },
          radius: 15000,
          priority: 'high',
          triggers: { entry: true, exit: true, dwell: { enabled: true, duration: 30 } },
          syncActions: { preloadContent: true, updatePrices: true, fetchEvents: true, downloadMaps: true }
        }
      ];

      // Add default regions if none exist
      if (!savedRegions) {
        setConfig(prev => ({
          ...prev,
          geofencing: { ...prev.geofencing, regions: defaultRegions }
        }));
        localStorage.setItem(GEOFENCE_STORAGE_KEY, JSON.stringify(defaultRegions));
      }
    };

    initializeLocationSync();
  }, []);

  // Start location tracking
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('[LocationSync] Geolocation not supported');
      return false;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 60000 // 1 minute
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        handleLocationUpdate(position);
      },
      (error) => {
        console.error('[LocationSync] Location error:', error);
        // Try to use cached location
        const lastKnown = localStorage.getItem('last_known_location');
        if (lastKnown) {
          const { lat, lng } = JSON.parse(lastKnown);
          setLocationContext(prev => ({
            ...prev,
            lastKnownLocation: { lat, lng }
          }));
        }
      },
      options
    );

    return true;
  }, []);

  // Stop location tracking
  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  // Handle location updates
  const handleLocationUpdate = useCallback((position: GeolocationPosition) => {
    const newLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    // Update location history
    locationHistoryRef.current.push({
      position: newLocation,
      timestamp: Date.now()
    });

    // Keep only last 10 positions
    if (locationHistoryRef.current.length > 10) {
      locationHistoryRef.current = locationHistoryRef.current.slice(-10);
    }

    // Calculate movement metrics
    const speed = calculateMovementSpeed();
    const isStationary = speed < 1; // Less than 1 km/h considered stationary

    // Check geofence regions
    const { currentRegion, nearbyRegions } = checkGeofenceStatus(newLocation);

    setLocationContext(prev => ({
      ...prev,
      currentLocation: newLocation,
      lastKnownLocation: newLocation,
      locationAccuracy: position.coords.accuracy,
      movementSpeed: speed,
      isStationary,
      currentRegion,
      nearbyRegions
    }));

    // Save to localStorage for offline access
    localStorage.setItem('last_known_location', JSON.stringify(newLocation));

    // Trigger sync if needed
    if (shouldTriggerSync(newLocation, currentRegion)) {
      triggerLocationBasedSync(newLocation, currentRegion);
    }
  }, [config]);

  // Calculate movement speed based on location history
  const calculateMovementSpeed = useCallback((): number => {
    const history = locationHistoryRef.current;
    if (history.length < 2) return 0;

    const recent = history.slice(-2);
    const [prev, current] = recent;
    
    const distance = calculateDistance(
      prev.position.lat, prev.position.lng,
      current.position.lat, current.position.lng
    );
    
    const timeDiff = (current.timestamp - prev.timestamp) / 1000 / 3600; // hours
    return timeDiff > 0 ? distance / timeDiff : 0;
  }, []);

  // Check geofence status
  const checkGeofenceStatus = useCallback((location: { lat: number; lng: number }) => {
    const { regions } = config.geofencing;
    let currentRegion: GeofenceRegion | null = null;
    const nearbyRegions: GeofenceRegion[] = [];

    regions.forEach(region => {
      const distance = calculateDistance(
        location.lat, location.lng,
        region.coordinates.lat, region.coordinates.lng
      ) * 1000; // Convert to meters

      if (distance <= region.radius) {
        if (!currentRegion || region.priority === 'high') {
          currentRegion = region;
        }
      } else if (distance <= region.radius * 2) {
        nearbyRegions.push(region);
      }
    });

    // Handle geofence entry/exit events
    const previousRegion = locationContext.currentRegion;
    if (currentRegion?.id !== previousRegion?.id) {
      if (currentRegion) {
        handleGeofenceEntry(currentRegion);
      }
      if (previousRegion) {
        handleGeofenceExit(previousRegion);
      }
    }

    return { currentRegion, nearbyRegions };
  }, [config.geofencing, locationContext.currentRegion]);

  // Handle geofence entry
  const handleGeofenceEntry = useCallback(async (region: GeofenceRegion) => {
    console.log('[LocationSync] Entered region:', region.name);

    if (!region.triggers.entry) return;

    // Execute entry actions
    if (region.syncActions.preloadContent) {
      await preloadRegionContent(region);
    }

    if (region.syncActions.downloadMaps) {
      await downloadRegionMaps(region);
    }

    if (region.syncActions.updatePrices || region.syncActions.fetchEvents) {
      await syncRegionData(region);
    }
  }, []);

  // Handle geofence exit
  const handleGeofenceExit = useCallback(async (region: GeofenceRegion) => {
    console.log('[LocationSync] Exited region:', region.name);

    if (!region.triggers.exit) return;

    // Execute exit actions (like cleanup)
    if (config.geofencing.exitActions.includes('cleanup-cache')) {
      await cleanupRegionCache(region);
    }
  }, [config.geofencing.exitActions]);

  // Check if sync should be triggered
  const shouldTriggerSync = useCallback((
    location: { lat: number; lng: number },
    region: GeofenceRegion | null
  ): boolean => {
    const now = Date.now();
    const timeSinceLastSync = now - syncStatus.lastSync;
    const minInterval = config.updateFrequency.checkInterval * 60 * 1000;

    // Don't sync too frequently
    if (timeSinceLastSync < minInterval) return false;

    // Don't sync if offline mode is enabled and not wifi
    if (isOfflineMode && config.updateFrequency.wifiOnly) {
      return navigator.connection?.effectiveType === 'wifi' || false;
    }

    // Always sync when entering high priority regions
    if (region?.priority === 'high') return true;

    // Sync based on movement
    return !locationContext.isStationary || timeSinceLastSync > minInterval * 2;
  }, [config, syncStatus.lastSync, locationContext.isStationary, isOfflineMode]);

  // Trigger location-based sync
  const triggerLocationBasedSync = useCallback(async (
    location: { lat: number; lng: number },
    region: GeofenceRegion | null
  ) => {
    if (syncStatus.isActive) {
      console.log('[LocationSync] Sync already in progress');
      return;
    }

    setSyncStatus(prev => ({
      ...prev,
      isActive: true,
      currentOperation: 'Initializing sync...'
    }));

    try {
      const syncTasks = [];

      // Determine what to sync based on location and config
      if (config.enabledTypes.attractions) {
        syncTasks.push({
          type: 'attractions',
          operation: () => syncNearbyAttractions(location)
        });
      }

      if (config.enabledTypes.weather) {
        syncTasks.push({
          type: 'weather',
          operation: () => syncWeatherData(location)
        });
      }

      if (config.enabledTypes.events && region) {
        syncTasks.push({
          type: 'events',
          operation: () => syncRegionEvents(region)
        });
      }

      if (config.enabledTypes.restaurants) {
        syncTasks.push({
          type: 'restaurants',
          operation: () => syncNearbyRestaurants(location)
        });
      }

      setSyncStatus(prev => ({
        ...prev,
        syncProgress: {
          total: syncTasks.length,
          completed: 0,
          current: '',
          errors: []
        }
      }));

      // Execute sync tasks
      for (let i = 0; i < syncTasks.length; i++) {
        const task = syncTasks[i];
        
        setSyncStatus(prev => ({
          ...prev,
          currentOperation: `Syncing ${task.type}...`,
          syncProgress: {
            ...prev.syncProgress,
            current: task.type,
            completed: i
          }
        }));

        try {
          await task.operation();
        } catch (error) {
          console.error(`[LocationSync] Failed to sync ${task.type}:`, error);
          setSyncStatus(prev => ({
            ...prev,
            syncProgress: {
              ...prev.syncProgress,
              errors: [...prev.syncProgress.errors, `Failed to sync ${task.type}`]
            }
          }));
        }
      }

      // Update sync status
      setSyncStatus(prev => ({
        ...prev,
        isActive: false,
        lastSync: Date.now(),
        nextSync: Date.now() + (config.updateFrequency.checkInterval * 60 * 1000),
        currentOperation: null,
        syncProgress: {
          ...prev.syncProgress,
          completed: syncTasks.length,
          current: 'Complete'
        }
      }));

      console.log('[LocationSync] Sync completed successfully');

    } catch (error) {
      console.error('[LocationSync] Sync failed:', error);
      setSyncStatus(prev => ({
        ...prev,
        isActive: false,
        currentOperation: null,
        syncProgress: {
          ...prev.syncProgress,
          errors: [...prev.syncProgress.errors, 'Sync operation failed']
        }
      }));
    }
  }, [config, syncStatus.isActive]);

  // Sync functions
  const syncNearbyAttractions = useCallback(async (location: { lat: number; lng: number }) => {
    // Mock implementation - would call actual API
    console.log('[LocationSync] Syncing nearby attractions for:', location);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  const syncWeatherData = useCallback(async (location: { lat: number; lng: number }) => {
    console.log('[LocationSync] Syncing weather data for:', location);
    await new Promise(resolve => setTimeout(resolve, 500));
  }, []);

  const syncRegionEvents = useCallback(async (region: GeofenceRegion) => {
    console.log('[LocationSync] Syncing events for region:', region.name);
    await new Promise(resolve => setTimeout(resolve, 800));
  }, []);

  const syncNearbyRestaurants = useCallback(async (location: { lat: number; lng: number }) => {
    console.log('[LocationSync] Syncing nearby restaurants for:', location);
    await new Promise(resolve => setTimeout(resolve, 1200));
  }, []);

  // Region-specific operations
  const preloadRegionContent = useCallback(async (region: GeofenceRegion) => {
    console.log('[LocationSync] Preloading content for:', region.name);
    // Implementation would preload popular attractions, restaurants, etc.
  }, []);

  const downloadRegionMaps = useCallback(async (region: GeofenceRegion) => {
    console.log('[LocationSync] Downloading maps for:', region.name);
    
    const bounds = {
      north: region.coordinates.lat + 0.1,
      south: region.coordinates.lat - 0.1,
      east: region.coordinates.lng + 0.1,
      west: region.coordinates.lng - 0.1
    };
    
    try {
      await downloadAreaForOffline(bounds, region.name, [10, 11, 12, 13, 14]);
    } catch (error) {
      console.error('[LocationSync] Failed to download maps:', error);
    }
  }, [downloadAreaForOffline]);

  const syncRegionData = useCallback(async (region: GeofenceRegion) => {
    console.log('[LocationSync] Syncing data for:', region.name);
    // Implementation would sync prices, events, etc.
  }, []);

  const cleanupRegionCache = useCallback(async (region: GeofenceRegion) => {
    console.log('[LocationSync] Cleaning up cache for:', region.name);
    // Implementation would clean up old cached data
  }, []);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<LocationUpdateConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updatedConfig));
  }, [config]);

  // Add geofence region
  const addGeofenceRegion = useCallback((region: Omit<GeofenceRegion, 'id'>) => {
    const newRegion: GeofenceRegion = {
      ...region,
      id: `region_${Date.now()}`
    };

    const updatedRegions = [...config.geofencing.regions, newRegion];
    updateConfig({
      geofencing: {
        ...config.geofencing,
        regions: updatedRegions
      }
    });

    localStorage.setItem(GEOFENCE_STORAGE_KEY, JSON.stringify(updatedRegions));
    return newRegion.id;
  }, [config, updateConfig]);

  // Remove geofence region
  const removeGeofenceRegion = useCallback((regionId: string) => {
    const updatedRegions = config.geofencing.regions.filter(r => r.id !== regionId);
    updateConfig({
      geofencing: {
        ...config.geofencing,
        regions: updatedRegions
      }
    });

    localStorage.setItem(GEOFENCE_STORAGE_KEY, JSON.stringify(updatedRegions));
  }, [config, updateConfig]);

  // Force sync
  const forceSync = useCallback(async () => {
    if (!locationContext.currentLocation) {
      console.warn('[LocationSync] No current location for sync');
      return false;
    }

    await triggerLocationBasedSync(
      locationContext.currentLocation,
      locationContext.currentRegion
    );
    return true;
  }, [locationContext, triggerLocationBasedSync]);

  // Auto-start location tracking on mount
  useEffect(() => {
    if (config.updateFrequency.backgroundSync) {
      startLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [config.updateFrequency.backgroundSync]); // Remove function dependencies to prevent unnecessary restarts

  return {
    // State
    config,
    locationContext,
    syncStatus,

    // Actions
    startLocationTracking,
    stopLocationTracking,
    updateConfig,
    addGeofenceRegion,
    removeGeofenceRegion,
    forceSync,

    // Utilities
    isTracking: watchIdRef.current !== null,
    hasLocation: !!locationContext.currentLocation,
    isSyncEnabled: config.updateFrequency.backgroundSync,
    canSync: !syncStatus.isActive && (!!locationContext.currentLocation || !!locationContext.lastKnownLocation)
  };
}

// Utility functions
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export type { LocationUpdateConfig, GeofenceRegion, LocationContext, SyncStatus };