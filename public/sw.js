// Enhanced Service Worker for Comprehensive Offline Support
const CACHE_VERSION = '2.0.0';
const CACHE_NAME = `baltguide-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `baltguide-dynamic-v${CACHE_VERSION}`;
const MAP_TILES_CACHE = `baltguide-tiles-v${CACHE_VERSION}`;
const LOCATIONS_CACHE = `baltguide-locations-v${CACHE_VERSION}`;
const IMAGES_CACHE = `baltguide-images-v${CACHE_VERSION}`;

// Cache size limits (in MB)
const CACHE_LIMITS = {
  [MAP_TILES_CACHE]: 50 * 1024 * 1024,      // 50MB for map tiles
  [LOCATIONS_CACHE]: 10 * 1024 * 1024,      // 10MB for location data
  [IMAGES_CACHE]: 30 * 1024 * 1024,         // 30MB for images
  [DYNAMIC_CACHE_NAME]: 5 * 1024 * 1024     // 5MB for API responses
};

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/map',
  '/map/enhanced-page',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html'
];

// Critical resources that should be cached with high priority
const CRITICAL_RESOURCES = [
  '/_next/static/',
  '/fonts/',
  '/icons/'
];

// Image patterns for location photos
const IMAGE_PATTERNS = [
  /\.(jpg|jpeg|png|webp|avif|gif)$/i,
  /unsplash\.com/,
  /cloudinary\.com/,
  /supabase.*\/storage/
];

// Map tile URL patterns to cache
const MAP_TILE_PATTERNS = [
  /^https:\/\/api\.mapbox\.com\/styles\/v1\/.+\/tiles\/\d+\/\d+\/\d+/,
  /^https:\/\/.*\.tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Force activation of new service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches and initialize background sync
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            const isCurrentCache = [
              CACHE_NAME, 
              DYNAMIC_CACHE_NAME, 
              MAP_TILES_CACHE,
              LOCATIONS_CACHE,
              IMAGES_CACHE
            ].includes(cacheName);
            
            if (!isCurrentCache) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Initialize cache size management
      initializeCacheManagement(),
      
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests with advanced strategies
  if (isMapTileRequest(request)) {
    event.respondWith(handleMapTileRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isLocationDataRequest(request)) {
    event.respondWith(handleLocationDataRequest(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isStaticAssetRequest(request)) {
    event.respondWith(handleStaticAssetRequest(request));
  } else if (isCriticalResource(request)) {
    event.respondWith(handleCriticalResourceRequest(request));
  } else {
    event.respondWith(handleOtherRequest(request));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(performBackgroundSync());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(handlePushNotification(data));
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(handleNotificationClick(event));
});

// Check if request is for map tiles
function isMapTileRequest(request) {
  return MAP_TILE_PATTERNS.some(pattern => pattern.test(request.url));
}

// Check if request is for API data
function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/api/') || 
         url.hostname.includes('supabase') ||
         url.pathname.includes('rpc/');
}

// Check if request is for images
function isImageRequest(request) {
  return IMAGE_PATTERNS.some(pattern => pattern.test(request.url));
}

// Check if request is for location data
function isLocationDataRequest(request) {
  const url = new URL(request.url);
  return url.pathname.includes('get_attractions') ||
         url.pathname.includes('location') ||
         url.searchParams.has('location_id');
}

// Check if request is for critical resources
function isCriticalResource(request) {
  return CRITICAL_RESOURCES.some(pattern => request.url.includes(pattern));
}

// Check if request is for static assets
function isStaticAssetRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/_next/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.woff2') ||
         (url.pathname.endsWith('.png') && !isImageRequest(request)) ||
         (url.pathname.endsWith('.jpg') && !isImageRequest(request)) ||
         url.pathname.endsWith('.svg');
}

// Handle map tile requests (cache heavily for offline use)
async function handleMapTileRequest(request) {
  try {
    const cache = await caches.open(MAP_TILES_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Serve from cache and update in background
      updateTileInBackground(request, cache);
      return cachedResponse;
    }
    
    // Fetch and cache new tile
    const response = await fetch(request);
    if (response.ok) {
      // Cache successful responses
      cache.put(request, response.clone());
    }
    return response;
    
  } catch (error) {
    console.log('[SW] Map tile request failed:', error);
    
    // Try to return cached tile if available
    const cache = await caches.open(MAP_TILES_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return placeholder tile if no cache available
    return createPlaceholderTile();
  }
}

// Handle API requests (cache with network-first strategy)
async function handleAPIRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful API responses for short time
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      const clonedResponse = response.clone();
      
      // Add timestamp for cache invalidation
      const responseWithTimestamp = new Response(clonedResponse.body, {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers: {
          ...Object.fromEntries(clonedResponse.headers.entries()),
          'sw-cached-at': Date.now().toString()
        }
      });
      
      cache.put(request, responseWithTimestamp);
    }
    
    return response;
    
  } catch (error) {
    console.log('[SW] API request failed, checking cache:', error);
    
    // Network failed, try cache
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Check if cached response is still fresh (30 minutes)
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      const isStale = cachedAt && (Date.now() - parseInt(cachedAt)) > 30 * 60 * 1000;
      
      if (!isStale) {
        // Add offline indicator to response
        const offlineResponse = new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: {
            ...Object.fromEntries(cachedResponse.headers.entries()),
            'sw-offline': 'true'
          }
        });
        
        return offlineResponse;
      }
    }
    
    // Return offline fallback
    return createOfflineResponse(request);
  }
}

// Handle static asset requests (cache-first strategy)
async function handleStaticAssetRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Static asset request failed:', error);
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Handle image requests with cache-first strategy and intelligent sizing
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGES_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch new image with size optimization
    const response = await fetch(request);
    
    if (response.ok) {
      // Check cache size and clean if necessary
      await manageCacheSize(IMAGES_CACHE);
      
      // Cache the image
      cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    console.log('[SW] Image request failed:', error);
    
    // Try to return cached image
    const cache = await caches.open(IMAGES_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return placeholder image
    return createPlaceholderImage();
  }
}

// Handle location data requests with smart caching
async function handleLocationDataRequest(request) {
  try {
    // Try network first for fresh data
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(LOCATIONS_CACHE);
      
      // Add timestamp and location info for smart cache management
      const data = await response.clone().json();
      const enhancedResponse = new Response(JSON.stringify({
        ...data,
        _cached_at: Date.now(),
        _cache_key: request.url
      }), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
      
      // Manage cache size
      await manageCacheSize(LOCATIONS_CACHE);
      
      cache.put(request, enhancedResponse.clone());
      return response; // Return original response to client
    }
    
    return response;
    
  } catch (error) {
    console.log('[SW] Location data request failed, trying cache:', error);
    
    // Network failed, try cache
    const cache = await caches.open(LOCATIONS_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      const data = await cachedResponse.json();
      
      // Check if cached data is still fresh (1 hour for location data)
      const isStale = data._cached_at && (Date.now() - data._cached_at) > 60 * 60 * 1000;
      
      if (!isStale) {
        // Remove cache metadata before returning
        const { _cached_at, _cache_key, ...cleanData } = data;
        
        return new Response(JSON.stringify(cleanData), {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: {
            ...Object.fromEntries(cachedResponse.headers.entries()),
            'sw-offline': 'true',
            'sw-cached-at': _cached_at.toString()
          }
        });
      }
    }
    
    // Return offline fallback for location requests
    return createOfflineLocationResponse(request);
  }
}

// Handle critical resource requests (cache-first with network fallback)
async function handleCriticalResourceRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Update in background if online
    if (navigator.onLine) {
      updateResourceInBackground(request, cache);
    }
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Critical resource request failed:', error);
    return new Response('Critical resource not available offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Handle other requests (network-first)
async function handleOtherRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Return cached version if available
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Content not available offline', { status: 503 });
  }
}

// Update tile in background (for stale-while-revalidate pattern)
function updateTileInBackground(request, cache) {
  fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    })
    .catch(error => {
      console.log('[SW] Background tile update failed:', error);
    });
}

// Create placeholder tile for offline use
function createPlaceholderTile() {
  try {
    // Try OffscreenCanvas first (modern browsers)
    if ('OffscreenCanvas' in self) {
      const canvas = new OffscreenCanvas(256, 256);
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, 256, 256);
        
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, 256, 256);
        
        ctx.fillStyle = '#9ca3af';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Offline', 128, 128);
        
        return canvas.convertToBlob({ type: 'image/png' })
          .then(blob => new Response(blob, {
            headers: { 'Content-Type': 'image/png' }
          }));
      }
    }
  } catch (error) {
    console.log('[SW] OffscreenCanvas not supported, using fallback');
  }
  
  // Fallback: return a simple SVG tile
  const svgTile = `
    <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" fill="#f3f4f6" stroke="#e5e7eb" stroke-width="1"/>
      <text x="128" y="128" text-anchor="middle" font-family="Arial" font-size="12" fill="#9ca3af">Offline</text>
    </svg>
  `;
  
  return Promise.resolve(new Response(svgTile, {
    headers: { 'Content-Type': 'image/svg+xml' }
  }));
}

// Create offline API response
function createOfflineResponse(request) {
  const url = new URL(request.url);
  
  if (url.pathname.includes('get_attractions')) {
    // Return empty results for location search
    return new Response(JSON.stringify([]), {
      headers: { 
        'Content-Type': 'application/json',
        'sw-offline': 'true'
      }
    });
  }
  
  return new Response(JSON.stringify({ 
    error: 'This feature requires an internet connection',
    offline: true 
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_MAP_AREA') {
    // Pre-cache map tiles for a specific area
    const { bounds, zoomLevels, mapboxToken } = event.data.payload;
    cacheMapArea(bounds, zoomLevels, mapboxToken);
  }
});

// Pre-cache map tiles for offline use
async function cacheMapArea(bounds, zoomLevels, mapboxToken) {
  const cache = await caches.open(MAP_TILES_CACHE);
  const promises = [];
  
  // Skip if no token provided
  if (!mapboxToken) {
    console.warn('[SW] MapBox token not provided, skipping tile caching');
    return;
  }
  
  zoomLevels.forEach(zoom => {
    const tiles = getTilesInBounds(bounds, zoom);
    
    tiles.forEach(({ x, y, z }) => {
      const tileUrl = `https://api.mapbox.com/styles/v1/kc87/cmapseqwe01mz01qyc4ma5m7a/tiles/${z}/${x}/${y}?access_token=${mapboxToken}`;
      
      promises.push(
        fetch(tileUrl)
          .then(response => {
            if (response.ok) {
              return cache.put(tileUrl, response.clone());
            }
          })
          .catch(error => {
            console.log('[SW] Failed to cache tile:', error);
          })
      );
    });
  });
  
  try {
    await Promise.all(promises);
    console.log('[SW] Map area cached successfully');
    
    // Notify main thread
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'MAP_AREA_CACHED',
          success: true
        });
      });
    });
  } catch (error) {
    console.log('[SW] Failed to cache map area:', error);
  }
}

// Calculate tiles within bounds for a zoom level
function getTilesInBounds(bounds, zoom) {
  const tiles = [];
  const minTile = latLngToTile(bounds.north, bounds.west, zoom);
  const maxTile = latLngToTile(bounds.south, bounds.east, zoom);
  
  for (let x = minTile.x; x <= maxTile.x; x++) {
    for (let y = minTile.y; y <= maxTile.y; y++) {
      tiles.push({ x, y, z: zoom });
    }
  }
  
  return tiles;
}

// Convert lat/lng to tile coordinates
function latLngToTile(lat, lng, zoom) {
  const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  return { x, y };
}

// Enhanced cache management functions
async function initializeCacheManagement() {
  console.log('[SW] Initializing cache management');
  
  // Set up periodic cache cleanup
  setInterval(async () => {
    await cleanupExpiredCaches();
  }, 60 * 60 * 1000); // Every hour
}

async function manageCacheSize(cacheName) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  
  // Calculate current cache size
  let totalSize = 0;
  const responses = await Promise.all(
    requests.map(async (request) => {
      const response = await cache.match(request);
      if (response) {
        const size = await estimateResponseSize(response);
        return { request, response, size };
      }
      return null;
    })
  );
  
  const validResponses = responses.filter(Boolean);
  totalSize = validResponses.reduce((sum, item) => sum + item.size, 0);
  
  const limit = CACHE_LIMITS[cacheName] || 10 * 1024 * 1024; // Default 10MB
  
  if (totalSize > limit) {
    console.log(`[SW] Cache ${cacheName} over limit (${totalSize}/${limit}), cleaning up`);
    
    // Sort by last access time (LRU) and remove oldest
    const sortedByAccess = validResponses.sort((a, b) => {
      const aTime = getLastAccessTime(a.response) || 0;
      const bTime = getLastAccessTime(b.response) || 0;
      return aTime - bTime;
    });
    
    let cleanedSize = 0;
    const targetReduction = totalSize - (limit * 0.8); // Clean to 80% of limit
    
    for (const item of sortedByAccess) {
      if (cleanedSize >= targetReduction) break;
      
      await cache.delete(item.request);
      cleanedSize += item.size;
    }
    
    console.log(`[SW] Cleaned ${cleanedSize} bytes from ${cacheName}`);
  }
}

async function cleanupExpiredCaches() {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    if (cacheName.includes('baltguide')) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response && isResponseExpired(response)) {
          await cache.delete(request);
        }
      }
    }
  }
}

function isResponseExpired(response) {
  const cachedAt = response.headers.get('sw-cached-at');
  if (!cachedAt) return false;
  
  const cacheTime = parseInt(cachedAt);
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  return Date.now() - cacheTime > maxAge;
}

function getLastAccessTime(response) {
  return parseInt(response.headers.get('sw-last-access') || '0');
}

async function estimateResponseSize(response) {
  try {
    const clone = response.clone();
    const arrayBuffer = await clone.arrayBuffer();
    return arrayBuffer.byteLength;
  } catch {
    return 1024; // Default estimate if we can't read the response
  }
}

// Background sync functions
async function performBackgroundSync() {
  console.log('[SW] Performing background sync');
  
  try {
    // Sync any queued offline actions
    const syncData = await getStoredSyncData();
    
    for (const item of syncData) {
      try {
        await syncItem(item);
        await markSyncItemComplete(item.id);
      } catch (error) {
        console.error('[SW] Sync item failed:', error);
        await incrementSyncRetries(item.id);
      }
    }
    
    // Notify clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC_COMPLETE',
        success: true
      });
    });
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

async function getStoredSyncData() {
  // This would typically read from IndexedDB
  // For now, return empty array
  return [];
}

async function syncItem(item) {
  // Implement actual sync logic based on item type
  console.log('[SW] Syncing item:', item);
}

async function markSyncItemComplete(itemId) {
  // Mark item as synced in storage
  console.log('[SW] Marking sync complete:', itemId);
}

async function incrementSyncRetries(itemId) {
  // Increment retry count for failed sync
  console.log('[SW] Incrementing retries for:', itemId);
}

// Push notification functions
async function handlePushNotification(data) {
  const { title, body, icon, badge, tag, url } = data;
  
  const options = {
    body,
    icon: icon || '/icon-192x192.png',
    badge: badge || '/badge-72x72.png',
    tag: tag || 'default',
    data: { url },
    requireInteraction: false,
    silent: false
  };
  
  await self.registration.showNotification(title, options);
}

async function handleNotificationClick(event) {
  const { notification } = event;
  const url = notification.data?.url || '/';
  
  // Focus existing window or open new one
  const clients = await self.clients.matchAll({ type: 'window' });
  
  for (const client of clients) {
    if (client.url === url && 'focus' in client) {
      return client.focus();
    }
  }
  
  // Open new window
  if (self.clients.openWindow) {
    return self.clients.openWindow(url);
  }
}

// Enhanced utility functions
function updateResourceInBackground(request, cache) {
  fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    })
    .catch(error => {
      console.log('[SW] Background resource update failed:', error);
    });
}

async function createPlaceholderImage() {
  try {
    // Try OffscreenCanvas first (modern browsers)
    if ('OffscreenCanvas' in self) {
      const canvas = new OffscreenCanvas(300, 200);
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Background
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, 300, 200);
        
        // Border
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, 298, 198);
        
        // Icon
        ctx.fillStyle = '#9ca3af';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('📷', 150, 80);
        
        // Text
        ctx.font = '14px Arial';
        ctx.fillText('Image not available offline', 150, 130);
        
        const blob = await canvas.convertToBlob({ type: 'image/png' });
        return new Response(blob, {
          headers: { 'Content-Type': 'image/png' }
        });
      }
    }
  } catch (error) {
    console.log('[SW] OffscreenCanvas not supported for images, using SVG fallback');
  }
  
  // Fallback: return a simple SVG placeholder
  const svgPlaceholder = `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="200" fill="#f3f4f6" stroke="#e5e7eb" stroke-width="2"/>
      <text x="150" y="80" text-anchor="middle" font-family="Arial" font-size="24" fill="#9ca3af">📷</text>
      <text x="150" y="130" text-anchor="middle" font-family="Arial" font-size="14" fill="#9ca3af">Image not available offline</text>
    </svg>
  `;
  
  return new Response(svgPlaceholder, {
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}

function createOfflineLocationResponse(request) {
  const url = new URL(request.url);
  
  // Return empty results with offline indicator
  const offlineResponse = {
    data: [],
    offline: true,
    message: 'Location data not available offline. Please connect to the internet for fresh results.',
    cachedResults: 0
  };
  
  return new Response(JSON.stringify(offlineResponse), {
    status: 200,
    headers: { 
      'Content-Type': 'application/json',
      'sw-offline': 'true'
    }
  });
}