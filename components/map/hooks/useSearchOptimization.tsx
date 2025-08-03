"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

interface SearchCache {
  [key: string]: {
    data: any[];
    timestamp: number;
    filterHash: string;
  };
}

interface SearchMetrics {
  searchCount: number;
  cacheHits: number;
  averageSearchTime: number;
  lastSearchTime: number;
}

interface UseSearchOptimizationProps {
  searchFunction: (filter: any) => Promise<any[]>;
  debounceMs?: number;
  cacheExpiryMs?: number;
  maxCacheSize?: number;
  enableMetrics?: boolean;
}

export function useSearchOptimization({
  searchFunction,
  debounceMs = 300,
  cacheExpiryMs = 5 * 60 * 1000, // 5 minutes
  maxCacheSize = 50,
  enableMetrics = true
}: UseSearchOptimizationProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchCache, setSearchCache] = useState<SearchCache>({});
  const [searchMetrics, setSearchMetrics] = useState<SearchMetrics>({
    searchCount: 0,
    cacheHits: 0,
    averageSearchTime: 0,
    lastSearchTime: 0
  });

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchStartTimeRef = useRef<number>(0);
  const lastFilterRef = useRef<any>(null);

  // Generate cache key from filter object
  const generateCacheKey = useCallback((filter: any): string => {
    // Create a stable string representation of the filter
    const sortedFilter = Object.keys(filter)
      .sort()
      .reduce((result, key) => {
        const value = filter[key];
        if (Array.isArray(value)) {
          result[key] = [...value].sort();
        } else if (typeof value === 'object' && value !== null) {
          result[key] = JSON.stringify(value);
        } else {
          result[key] = value;
        }
        return result;
      }, {} as any);

    return JSON.stringify(sortedFilter);
  }, []);

  // Generate filter hash for cache validation
  const generateFilterHash = useCallback((filter: any): string => {
    // Exclude timestamp-sensitive fields for hash
    const { searchText, distanceSearch, ...hashableFilter } = filter;
    
    // Include searchText and location but not radius for partial cache hits
    const hashData = {
      searchText: searchText || '',
      hasLocation: Boolean(distanceSearch?.userLat && distanceSearch.userLat !== "0"),
      ...hashableFilter
    };

    return JSON.stringify(hashData);
  }, []);

  // Clean expired cache entries
  const cleanExpiredCache = useCallback(() => {
    const now = Date.now();
    setSearchCache(prevCache => {
      const newCache = { ...prevCache };
      Object.keys(newCache).forEach(key => {
        if (now - newCache[key].timestamp > cacheExpiryMs) {
          delete newCache[key];
        }
      });
      return newCache;
    });
  }, [cacheExpiryMs]);

  // Limit cache size by removing oldest entries
  const limitCacheSize = useCallback(() => {
    setSearchCache(prevCache => {
      const entries = Object.entries(prevCache);
      if (entries.length <= maxCacheSize) return prevCache;

      // Sort by timestamp and keep most recent entries
      const sortedEntries = entries
        .sort(([, a], [, b]) => b.timestamp - a.timestamp)
        .slice(0, maxCacheSize);

      return Object.fromEntries(sortedEntries);
    });
  }, [maxCacheSize]);

  // Get cached results if available
  const getCachedResults = useCallback((cacheKey: string, filterHash: string) => {
    const cached = searchCache[cacheKey];
    if (!cached) return null;

    const now = Date.now();
    const isExpired = now - cached.timestamp > cacheExpiryMs;
    
    if (isExpired) {
      return null;
    }

    // Check if filter hash matches for exact cache hit
    if (cached.filterHash === filterHash) {
      return cached.data;
    }

    // For partial matches (same base filter, different radius), we could implement
    // distance-based filtering on cached results in the future
    return null;
  }, [searchCache, cacheExpiryMs]);

  // Update search metrics
  const updateMetrics = useCallback((searchTime: number, cacheHit: boolean) => {
    if (!enableMetrics) return;

    setSearchMetrics(prev => {
      const newSearchCount = prev.searchCount + 1;
      const newCacheHits = prev.cacheHits + (cacheHit ? 1 : 0);
      const nonCachedSearches = newSearchCount - newCacheHits;
      const newAverageTime = cacheHit 
        ? prev.averageSearchTime 
        : nonCachedSearches > 0 
          ? (prev.averageSearchTime * Math.max(0, prev.searchCount - prev.cacheHits) + searchTime) / nonCachedSearches
          : searchTime;

      return {
        searchCount: newSearchCount,
        cacheHits: newCacheHits,
        averageSearchTime: newAverageTime,
        lastSearchTime: searchTime
      };
    });
  }, [enableMetrics]);

  // Optimized search with debouncing and caching
  const optimizedSearch = useCallback(async (filter: any): Promise<any[]> => {
    // Generate unique request ID to handle race conditions
    const requestId = Date.now() + Math.random();
    
    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    return new Promise((resolve, reject) => {
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          // Check if this is still the latest request
          const currentRequestId = requestId;
          
          setIsSearching(true);
          searchStartTimeRef.current = Date.now();

          const cacheKey = generateCacheKey(filter);
          const filterHash = generateFilterHash(filter);

          // Check cache first
          const cachedResults = getCachedResults(cacheKey, filterHash);
          if (cachedResults) {
            // Verify this is still the active request
            if (currentRequestId !== requestId) {
              return; // Stale request, ignore
            }
            
            const searchTime = Date.now() - searchStartTimeRef.current;
            updateMetrics(searchTime, true);
            setIsSearching(false);
            resolve(cachedResults);
            return;
          }

          // Perform actual search
          const results = await searchFunction(filter);
          
          // Verify this is still the active request before processing results
          if (currentRequestId !== requestId) {
            return; // Stale request, ignore
          }
          
          const searchTime = Date.now() - searchStartTimeRef.current;

          // Cache the results safely
          setSearchCache(prevCache => {
            // Double-check we're not overwriting newer data
            const existingEntry = prevCache[cacheKey];
            if (existingEntry && existingEntry.timestamp > Date.now() - 1000) {
              return prevCache; // Recent entry exists, don't overwrite
            }
            
            return {
              ...prevCache,
              [cacheKey]: {
                data: results,
                timestamp: Date.now(),
                filterHash
              }
            };
          });

          // Update metrics
          updateMetrics(searchTime, false);

          // Clean up cache periodically
          if (Math.random() < 0.1) { // 10% chance to trigger cleanup
            setTimeout(() => {
              cleanExpiredCache();
              limitCacheSize();
            }, 100);
          }

          lastFilterRef.current = filter;
          setIsSearching(false);
          resolve(results);
        } catch (error) {
          // Only set loading false if this is the current request
          if (requestId === currentRequestId) {
            setIsSearching(false);
          }
          reject(error);
        }
      }, debounceMs);
    });
  }, [
    searchFunction,
    debounceMs,
    generateCacheKey,
    generateFilterHash,
    getCachedResults,
    updateMetrics,
    cleanExpiredCache,
    limitCacheSize
  ]);

  // Prefetch function for predictive loading
  const prefetchResults = useCallback(async (filter: any) => {
    const cacheKey = generateCacheKey(filter);
    const filterHash = generateFilterHash(filter);

    // Don't prefetch if already cached
    if (getCachedResults(cacheKey, filterHash)) return;

    try {
      const results = await searchFunction(filter);
      setSearchCache(prevCache => ({
        ...prevCache,
        [cacheKey]: {
          data: results,
          timestamp: Date.now(),
          filterHash
        }
      }));
    } catch (error) {
      console.warn('Prefetch failed:', error);
    }
  }, [generateCacheKey, generateFilterHash, getCachedResults, searchFunction]);

  // Smart prefetch suggestions based on current filter
  const generatePrefetchSuggestions = useCallback((currentFilter: any) => {
    const suggestions = [];

    // Suggest nearby radius variations if location is available
    if (currentFilter.distanceSearch?.userLat && currentFilter.distanceSearch.userLat !== "0") {
      const currentRadius = parseInt(currentFilter.distanceSearch.radius || "0");
      const radiusVariations = [10, 20, 50, 100].filter(r => r !== currentRadius);
      
      radiusVariations.slice(0, 2).forEach(radius => {
        suggestions.push({
          ...currentFilter,
          distanceSearch: {
            ...currentFilter.distanceSearch,
            radius: radius.toString()
          }
        });
      });
    }

    // Suggest category variations
    if (currentFilter.categories?.length === 1) {
      const relatedCategories = {
        'culture-history': ['educational-interactive', 'arts-live-entertainment'],
        'parks-nature': ['sports-recreation', 'wellness-relaxation'],
        'restaurants-dining': ['nightlife-bars', 'shopping-markets'],
        'amusement-theme-parks': ['sports-recreation', 'educational-interactive']
      };

      const currentCategory = currentFilter.categories[0];
      const related = relatedCategories[currentCategory as keyof typeof relatedCategories];
      
      if (related) {
        suggestions.push({
          ...currentFilter,
          categories: [currentCategory, related[0]]
        });
      }
    }

    return suggestions.slice(0, 3); // Limit prefetch suggestions
  }, []);

  // Trigger intelligent prefetching
  const triggerSmartPrefetch = useCallback((currentFilter: any) => {
    const suggestions = generatePrefetchSuggestions(currentFilter);
    
    // Prefetch with delay to avoid impacting current search
    suggestions.forEach((suggestion, index) => {
      setTimeout(() => {
        prefetchResults(suggestion);
      }, 1000 + index * 500); // Stagger prefetch requests
    });
  }, [generatePrefetchSuggestions, prefetchResults]);

  // Clear cache function
  const clearCache = useCallback(() => {
    setSearchCache({});
    setSearchMetrics({
      searchCount: 0,
      cacheHits: 0,
      averageSearchTime: 0,
      lastSearchTime: 0
    });
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const cacheSize = Object.keys(searchCache).length;
    const cacheHitRate = searchMetrics.searchCount > 0 
      ? (searchMetrics.cacheHits / searchMetrics.searchCount * 100).toFixed(1)
      : '0';

    return {
      cacheSize,
      cacheHitRate: `${cacheHitRate}%`,
      averageSearchTime: Math.round(searchMetrics.averageSearchTime),
      totalSearches: searchMetrics.searchCount,
      cacheHits: searchMetrics.cacheHits
    };
  }, [searchCache, searchMetrics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Core functions
    optimizedSearch,
    isSearching,
    
    // Cache management
    clearCache,
    getCacheStats,
    
    // Performance features
    prefetchResults,
    triggerSmartPrefetch,
    
    // Metrics
    searchMetrics: enableMetrics ? searchMetrics : null
  };
}

// Hook for search analytics and insights
export function useSearchAnalytics() {
  const [searchPatterns, setSearchPatterns] = useState<any[]>([]);

  const trackSearchPattern = useCallback((filter: any, resultCount: number) => {
    const pattern = {
      timestamp: Date.now(),
      filterComplexity: Object.keys(filter).filter(key => {
        const value = filter[key];
        return value !== null && value !== undefined && 
               (Array.isArray(value) ? value.length > 0 : Boolean(value));
      }).length,
      resultCount,
      hasLocation: Boolean(filter.distanceSearch?.userLat && filter.distanceSearch.userLat !== "0"),
      categories: filter.categories?.length || 0,
      searchText: Boolean(filter.searchText)
    };

    setSearchPatterns(prev => [...prev.slice(-49), pattern]); // Keep last 50 patterns
  }, []);

  const getSearchInsights = useCallback(() => {
    if (searchPatterns.length < 5) return null;

    const avgResultCount = searchPatterns.reduce((sum, p) => sum + p.resultCount, 0) / searchPatterns.length;
    const avgComplexity = searchPatterns.reduce((sum, p) => sum + p.filterComplexity, 0) / searchPatterns.length;
    const locationUsageRate = searchPatterns.filter(p => p.hasLocation).length / searchPatterns.length;
    const textSearchRate = searchPatterns.filter(p => p.searchText).length / searchPatterns.length;

    return {
      averageResults: Math.round(avgResultCount),
      averageComplexity: Math.round(avgComplexity * 10) / 10,
      locationUsageRate: Math.round(locationUsageRate * 100),
      textSearchRate: Math.round(textSearchRate * 100),
      totalSearches: searchPatterns.length
    };
  }, [searchPatterns]);

  return {
    trackSearchPattern,
    getSearchInsights,
    searchPatterns: searchPatterns.slice(-10) // Return last 10 for analysis
  };
}