"use client";

import { useEffect, useState, useCallback } from "react";

import { createClient } from "@/config/supabase/client";

// Layout Components
import ResponsiveMapLayout from "@/components/map/layout/ResponsiveMapLayout";
// Mobile Components
import BottomSheet from "@/components/map/mobile/BottomSheet";
import FloatingSearchBar from "@/components/map/mobile/FloatingSearchBar";
import FloatingFAB from "@/components/map/mobile/FloatingFAB";
import TouchOptimizedMap from "@/components/map/mobile/TouchOptimizedMap";
import EnhancedMobileResults from "@/components/map/mobile/EnhancedMobileResults";
// Enhanced Components
import FilterModal from "@/components/map/responsive/FilterModal";
// Existing Components (for tablet/desktop)
import Sidebar from "@/components/map/Sidebar";
import FilterMain from "@/components/map/FilterMain";
// Hooks and Utilities
import { useMapState } from "@/components/map/hooks/useMapState";
import { useSmartFilters } from "@/components/map/hooks/useSmartFilters";
import { useSearchOptimization, useSearchAnalytics } from "@/components/map/hooks/useSearchOptimization";
import { useServiceWorker } from "@/components/map/utils/serviceWorker";
import { hapticFeedback } from "@/components/map/hooks/useSwipeGestures";

export default function EnhancedMapPage() {
  const supabase = createClient();
  const [savedLocations, setSavedLocations] = useState<string[]>([]);

  // Enhanced state management
  const {
    filter,
    uiState,
    markers,
    updateSearchText,
    setBottomSheetSnapPoint,
    toggleFilterModal,
    setActiveMarker,
    setMarkers,
    setIsLoading,
    updateFilter,
  } = useMapState();

  // Smart filters
  const {
    recentSearches,
    saveFilterPreferences,
    addToRecentSearches,
    applySmartDefaults,
  } = useSmartFilters();

  // Search optimization and analytics
  const { trackSearchPattern, getSearchInsights } = useSearchAnalytics();

  // Service worker for offline support
  const { isOnline, cacheMapArea, cacheInfo } = useServiceWorker();

  // Core search function for optimization
  const coreSearchFunction = useCallback(async (searchFilter: any) => {
    const params = {
      search_text: searchFilter.searchText,
      max_results: 100,
      petfriendly_filter: searchFilter.petfriendly,
      family_friendly_filter: searchFilter.family_friendly,
      open_24hrs_filter: searchFilter.open_24hrs,
      free_entry_filter: searchFilter.free_entry,
      souvenirs_filter: searchFilter.souvenirs,
      city_filter: searchFilter.city,
      country_filter: searchFilter.country,
      categories_filter:
        searchFilter.categories.length > 0
          ? searchFilter.categories
          : null,
      price_range_filter:
        searchFilter.price_range.length > 0
          ? searchFilter.price_range
          : null,
      audience_range_filter:
        searchFilter.audience_range.length > 0
          ? searchFilter.audience_range
          : null,
      parking_filter:
        searchFilter.parking.length > 0 ? searchFilter.parking : null,
      wifi_filter:
        searchFilter.wifi.length > 0 ? searchFilter.wifi : null,
      accessibility_filter:
        searchFilter.accessibility.length > 0
          ? searchFilter.accessibility
          : null,
      user_latitude:
        searchFilter.distanceSearch?.userLat &&
        searchFilter.distanceSearch.userLat !== "0"
          ? parseFloat(searchFilter.distanceSearch.userLat)
          : null,
      user_longitude:
        searchFilter.distanceSearch?.userLon &&
        searchFilter.distanceSearch.userLon !== "0"
          ? parseFloat(searchFilter.distanceSearch.userLon)
          : null,
      radius_km:
        searchFilter.distanceSearch?.radius &&
        searchFilter.distanceSearch.radius !== "0"
          ? parseFloat(searchFilter.distanceSearch.radius)
          : null,
      min_rating: searchFilter.rating,
    };

    const { data, error } = await supabase.rpc(
      "get_attractions_simple",
      params,
    );
    
    if (error) throw error;
    return data || [];
  }, [supabase]);

  // Optimized search with caching and debouncing
  const {
    optimizedSearch,
    getCacheStats,
    triggerSmartPrefetch
  } = useSearchOptimization({
    searchFunction: coreSearchFunction,
    debounceMs: 300,
    cacheExpiryMs: 5 * 60 * 1000, // 5 minutes
    maxCacheSize: 50,
    enableMetrics: true
  });

  // Enhanced search with smart defaults and persistence
  async function getLocations() {
    setIsLoading(true);

    // Apply smart defaults before search
    const enhancedFilter = applySmartDefaults(filter);
    
    try {
      // Use optimized search with caching and debouncing
      const data = await optimizedSearch(enhancedFilter);
      
      setMarkers(data);

      // Track search analytics
      trackSearchPattern(enhancedFilter, data.length);

      // Save search to recent searches
      if (enhancedFilter.searchText) {
        addToRecentSearches(enhancedFilter.searchText);
      }

      // Save filter preferences
      saveFilterPreferences(enhancedFilter);

      // Auto-expand bottom sheet if we have results
      if (data.length > 0 && uiState.bottomSheetSnapPoint === "peek") {
        setBottomSheetSnapPoint("half");
      }

      // Trigger smart prefetch for likely next searches
      triggerSmartPrefetch(enhancedFilter);

      // Haptic feedback for successful search
      hapticFeedback.success();
    } catch (searchError) {
      console.error('Search error:', searchError);
      hapticFeedback.error();

      // Show offline message if applicable
      if (!isOnline) {
        // Offline - showing cached results if available
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    getLocations();
  }, []);

  // Cache map area when locations are loaded
  useEffect(() => {
    if (markers.length > 0 && isOnline) {
      // Calculate bounds of current markers
      const lats = markers.map((m) => m.latitude);
      const lngs = markers.map((m) => m.longitude);

      const bounds = {
        north: Math.max(...lats) + 0.1,
        south: Math.min(...lats) - 0.1,
        east: Math.max(...lngs) + 0.1,
        west: Math.min(...lngs) - 0.1,
      };

      // Cache tiles for zoom levels 8-14
      cacheMapArea({
        bounds,
        zoomLevels: [8, 9, 10, 11, 12, 13, 14],
      });
    }
  }, [markers, isOnline, cacheMapArea]);

  // Enhanced search handler
  const handleSearch = () => {
    getLocations();
    hapticFeedback.light();
  };

  // Handle filter combinations from quick filters
  const handleApplyFilterCombination = (filterUpdates: any) => {
    updateFilter({ ...filter, ...filterUpdates });
    hapticFeedback.medium();

    // Trigger search after short delay to allow UI update
    setTimeout(() => {
      getLocations();
    }, 100);
  };

  // Handle recent search selection
  const handleRecentSearchSelect = (searchText: string) => {
    updateSearchText(searchText);
    hapticFeedback.light();

    // Trigger search
    setTimeout(() => {
      getLocations();
    }, 100);
  };

  // Handle voice search results
  const handleVoiceSearchResult = (result: { searchText: string; filters?: any }) => {
    // Update search text
    updateSearchText(result.searchText);
    
    // Apply any detected filters
    if (result.filters) {
      updateFilter({ ...filter, ...result.filters });
      hapticFeedback.medium();
    }
    
    // Trigger search after a short delay to allow state updates
    setTimeout(() => {
      getLocations();
    }, 150);
  };

  // Handle location saving
  const handleSaveLocation = (locationId: string) => {
    setSavedLocations((prev) => {
      const isAlreadySaved = prev.includes(locationId);

      if (isAlreadySaved) {
        hapticFeedback.light();

        return prev.filter((id) => id !== locationId);
      } else {
        hapticFeedback.success();

        return [...prev, locationId];
      }
    });
  };

  // Handle location sharing
  const handleShareLocation = (_location: any) => {
    // Location sharing functionality
    hapticFeedback.light();
  };

  // Handle filter modal actions
  const handleApplyFilters = () => {
    getLocations();
  };

  // Real-time filter preview function
  const handleFilterPreview = async (previewFilter: any) => {
    try {
      // For now, simulate count estimation based on filter complexity
      // In production, this would be a separate RPC function that uses these params:
      /*
      const previewParams = {
        search_text: previewFilter.searchText || "",
        max_results: 5,
        petfriendly_filter: previewFilter.petfriendly,
        family_friendly_filter: previewFilter.family_friendly,
        open_24hrs_filter: previewFilter.open_24hrs,
        free_entry_filter: previewFilter.free_entry,
        souvenirs_filter: previewFilter.souvenirs,
        city_filter: previewFilter.city,
        country_filter: previewFilter.country,
        categories_filter: previewFilter.categories?.length > 0 ? previewFilter.categories : null,
        price_range_filter: previewFilter.price_range?.length > 0 ? previewFilter.price_range : null,
        audience_range_filter: previewFilter.audience_range?.length > 0 ? previewFilter.audience_range : null,
        parking_filter: previewFilter.parking?.length > 0 ? previewFilter.parking : null,
        wifi_filter: previewFilter.wifi?.length > 0 ? previewFilter.wifi : null,
        accessibility_filter: previewFilter.accessibility?.length > 0 ? previewFilter.accessibility : null,
        user_latitude: previewFilter.distanceSearch?.userLat && previewFilter.distanceSearch.userLat !== "0"
          ? parseFloat(previewFilter.distanceSearch.userLat) : null,
        user_longitude: previewFilter.distanceSearch?.userLon && previewFilter.distanceSearch.userLon !== "0"
          ? parseFloat(previewFilter.distanceSearch.userLon) : null,
        radius_km: previewFilter.distanceSearch?.radius && previewFilter.distanceSearch.radius !== "0"
          ? parseFloat(previewFilter.distanceSearch.radius) : null,
        min_rating: previewFilter.rating,
      };
      */
      let estimatedCount = markers.length; // Start with current result count
      
      // Apply estimation logic based on filters
      if (previewFilter.searchText && previewFilter.searchText.length > 0) {
        estimatedCount = Math.max(1, Math.floor(estimatedCount * 0.6)); // Text search typically reduces results
      }
      
      if (previewFilter.categories?.length > 0) {
        const categoryReduction = Math.min(0.8, previewFilter.categories.length * 0.15);
        estimatedCount = Math.floor(estimatedCount * (1 - categoryReduction));
      }
      
      if (previewFilter.price_range?.length > 0 && previewFilter.price_range.length < 3) {
        estimatedCount = Math.floor(estimatedCount * 0.7); // Price filtering reduces options
      }
      
      if (previewFilter.free_entry) {
        estimatedCount = Math.floor(estimatedCount * 0.4); // Free entry is more restrictive
      }
      
      if (previewFilter.family_friendly) {
        estimatedCount = Math.floor(estimatedCount * 0.6);
      }
      
      if (previewFilter.accessibility?.length > 0) {
        estimatedCount = Math.floor(estimatedCount * 0.5); // Accessibility is more restrictive
      }
      
      if (previewFilter.distanceSearch?.radius && parseFloat(previewFilter.distanceSearch.radius) > 0) {
        const radius = parseFloat(previewFilter.distanceSearch.radius);
        if (radius < 10) {
          estimatedCount = Math.floor(estimatedCount * 0.3);
        } else if (radius < 50) {
          estimatedCount = Math.floor(estimatedCount * 0.7);
        }
      }
      
      if (previewFilter.rating && previewFilter.rating > 3) {
        estimatedCount = Math.floor(estimatedCount * 0.4);
      }
      
      // Ensure minimum of 0
      const count = Math.max(0, estimatedCount);

      // Generate suggestions based on result count
      const suggestedRefinements = [];
      if (count === 0) {
        if (previewFilter.categories?.length > 3) {
          suggestedRefinements.push("Try selecting fewer categories");
        }
        if (previewFilter.price_range?.length === 1 && previewFilter.price_range[0] === 'luxury') {
          suggestedRefinements.push("Include more price ranges");
        }
        if (previewFilter.distanceSearch?.radius && parseFloat(previewFilter.distanceSearch.radius) < 10) {
          suggestedRefinements.push("Increase search radius");
        }
        if (previewFilter.rating && previewFilter.rating > 4) {
          suggestedRefinements.push("Lower minimum rating requirement");
        }
      }

      return {
        estimatedResults: count || 0,
        hasConflicts: count === 0,
        conflictMessage: count === 0 ? "No locations match these filters" : undefined,
        suggestedRefinements,
        isLoading: false
      };

    } catch (error) {
      console.error('Filter preview error:', error);
      return {
        estimatedResults: 0,
        hasConflicts: true,
        conflictMessage: "Preview temporarily unavailable",
        suggestedRefinements: ["Try applying filters to see results"],
        isLoading: false
      };
    }
  };

  const handleClearFilters = () => {
    const clearedFilter = {
      searchText: "",
      distanceSearch: { radius: "0", userLat: "0", userLon: "0" },
      city: null,
      country: null,
      petfriendly: null,
      family_friendly: null,
      open_24hrs: null,
      free_entry: null,
      souvenirs: null,
      rating: null,
      price_range: [],
      categories: [],
      wifi: [],
      parking: [],
      accessibility: [],
      audience_range: [],
    };
    updateFilter(clearedFilter);
    hapticFeedback.medium();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white text-center py-2 text-sm">
          📶 You&apos;re offline - showing cached content
        </div>
      )}

      <ResponsiveMapLayout
        searchBar={
          <FloatingSearchBar
            searchText={filter.searchText}
            onSearchChange={updateSearchText}
            onSearch={handleSearch}
            placeholder="Search locations in Baltic States..."
            onApplyFilterCombination={handleApplyFilterCombination}
            currentFilter={filter}
            recentSearches={recentSearches}
            onRecentSearchSelect={handleRecentSearchSelect}
            onVoiceSearchResult={handleVoiceSearchResult}
            enableVoiceSearch={true}
          />
        }
        map={
          <TouchOptimizedMap
            markers={markers}
            className="h-screen"
          />
        }
        sidebar={
          <Sidebar
            activeMarker={uiState.activeMarker}
            setActiveMarker={setActiveMarker}
            markers={markers}
          />
        }
        bottomSheet={
          <BottomSheet
            initialSnapPoint="peek"
            onSnapPointChange={setBottomSheetSnapPoint}
          >
            <EnhancedMobileResults
              markers={markers}
              activeMarker={uiState.activeMarker}
              setActiveMarker={setActiveMarker}
              onRefresh={getLocations}
              onSaveLocation={handleSaveLocation}
              onShareLocation={handleShareLocation}
              savedLocations={savedLocations}
            />
          </BottomSheet>
        }
        filterFAB={
          <FloatingFAB
            onPress={toggleFilterModal}
            isActive={uiState.isFilterModalOpen}
          />
        }
        filterOverlay={
          <FilterModal
            isOpen={uiState.isFilterModalOpen}
            onClose={toggleFilterModal}
            filter={filter}
            setFilter={updateFilter}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            onPreviewFilter={handleFilterPreview}
            currentResultCount={markers.length}
          />
        }
        filterPanel={
          <div className="p-4">
            <FilterMain
              filter={filter}
              getLocations={getLocations}
              setFilter={updateFilter}
            />
          </div>
        }
      />

      {/* Enhanced development info with search optimization stats */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded z-50 space-y-1">
          <div>SW Cache: {Math.round(cacheInfo.percentUsed)}% used</div>
          <div>Online: {isOnline ? '✅' : '❌'}</div>
          <div>Search Cache: {getCacheStats().cacheSize} entries</div>
          <div>Cache Hit Rate: {getCacheStats().cacheHitRate}</div>
          <div>Avg Search: {getCacheStats().averageSearchTime}ms</div>
          {getSearchInsights() && (
            <>
              <div>Avg Results: {getSearchInsights()?.averageResults}</div>
              <div>Location Usage: {getSearchInsights()?.locationUsageRate}%</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}