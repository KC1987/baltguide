"use client";

import { useEffect } from "react";
import { createClient } from "@/config/supabase/client";

// Layout Components
import ResponsiveMapLayout from "@/components/map/layout/ResponsiveMapLayout";

// Mobile Components
import BottomSheet from "@/components/map/mobile/BottomSheet";
import FloatingSearchBar from "@/components/map/mobile/FloatingSearchBar";
import FloatingFAB from "@/components/map/mobile/FloatingFAB";
import TouchOptimizedMap from "@/components/map/mobile/TouchOptimizedMap";
import MobileResults from "@/components/map/mobile/MobileResults";

// Existing Components (for tablet/desktop)
import Sidebar from "@/components/map/Sidebar";
import FilterMain from "@/components/map/FilterMain";

// Hooks
import { useMapState } from "@/components/map/hooks/useMapState";

export default function MobileMapPage() {
  const supabase = createClient();
  const {
    filter,
    uiState,
    markers,
    isLoading,
    updateSearchText,
    performSearch,
    setBottomSheetSnapPoint,
    toggleFilterModal,
    setActiveMarker,
    setMarkers,
    setIsLoading,
    updateFilter
  } = useMapState();

  // Fetch locations function
  async function getLocations() {
    setIsLoading(true);
    
    const params = {
      search_text: filter.searchText,
      max_results: 100,
      petfriendly_filter: filter.petfriendly,
      family_friendly_filter: filter.family_friendly,
      open_24hrs_filter: filter.open_24hrs,
      free_entry_filter: filter.free_entry,
      souvenirs_filter: filter.souvenirs,
      city_filter: filter.city,
      country_filter: filter.country,
      categories_filter: filter.categories.length > 0 ? filter.categories : null,
      price_range_filter: filter.price_range.length > 0 ? filter.price_range : null,
      audience_range_filter: filter.audience_range.length > 0 ? filter.audience_range : null,
      parking_filter: filter.parking.length > 0 ? filter.parking : null,
      wifi_filter: filter.wifi.length > 0 ? filter.wifi : null,
      accessibility_filter: filter.accessibility.length > 0 ? filter.accessibility : null,
      user_latitude: filter.distanceSearch?.userLat && filter.distanceSearch.userLat !== "0" ? parseFloat(filter.distanceSearch.userLat) : null,
      user_longitude: filter.distanceSearch?.userLon && filter.distanceSearch.userLon !== "0" ? parseFloat(filter.distanceSearch.userLon) : null,
      radius_km: filter.distanceSearch?.radius && filter.distanceSearch.radius !== "0" ? parseFloat(filter.distanceSearch.radius) : null,
      min_rating: filter.rating
    };

    try {
      const { data, error } = await supabase.rpc('get_attractions_simple', params);
      
      if (error) {
        console.error("Error fetching locations:", error);
      } else if (data) {
        console.log(data);
        setMarkers(data);
        // Auto-expand bottom sheet if we have results and it's currently at peek
        if (data.length > 0 && uiState.bottomSheetSnapPoint === 'peek') {
          setBottomSheetSnapPoint('half');
        }
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    getLocations();
  }, []);

  // Search handler
  const handleSearch = () => {
    getLocations();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ResponsiveMapLayout
        searchBar={
          <FloatingSearchBar
            searchText={filter.searchText}
            onSearchChange={updateSearchText}
            onSearch={handleSearch}
            placeholder="Search locations in Baltic States..."
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
            <MobileResults
              markers={markers}
              activeMarker={uiState.activeMarker}
              setActiveMarker={setActiveMarker}
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
          <div>
            {/* TODO: Create FilterModal component for tablet */}
          </div>
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
    </div>
  );
}