"use client";

import { useState, useCallback } from 'react';
import { BottomSheetSnapPoint } from '../mobile/BottomSheet';

interface FilterState {
  searchText: string;
  distanceSearch: { radius: string; userLat: string; userLon: string };
  city: string | null;
  country: string | null;
  petfriendly: boolean | null;
  family_friendly: boolean | null;
  open_24hrs: boolean | null;
  free_entry: boolean | null;
  souvenirs: boolean | null;
  rating: number | null;
  price_range: string[];
  categories: string[];
  wifi: string[];
  parking: string[];
  accessibility: string[];
  audience_range: string[];
}

interface MapUIState {
  bottomSheetSnapPoint: BottomSheetSnapPoint;
  isFilterModalOpen: boolean;
  activeMarker: string | undefined;
  isSearchFocused: boolean;
}

const initialFilterState: FilterState = {
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
  audience_range: []
};

const initialUIState: MapUIState = {
  bottomSheetSnapPoint: 'peek',
  isFilterModalOpen: false,
  activeMarker: undefined,
  isSearchFocused: false
};

export function useMapState() {
  const [filter, setFilter] = useState<FilterState>(initialFilterState);
  const [uiState, setUIState] = useState<MapUIState>(initialUIState);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter actions
  const updateFilter = useCallback((updates: Partial<FilterState>) => {
    setFilter(prev => ({ ...prev, ...updates }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilter(initialFilterState);
  }, []);

  // UI actions
  const updateUIState = useCallback((updates: Partial<MapUIState>) => {
    setUIState(prev => ({ ...prev, ...updates }));
  }, []);

  const setBottomSheetSnapPoint = useCallback((snapPoint: BottomSheetSnapPoint) => {
    updateUIState({ bottomSheetSnapPoint: snapPoint });
  }, [updateUIState]);

  const toggleFilterModal = useCallback(() => {
    updateUIState({ isFilterModalOpen: !uiState.isFilterModalOpen });
  }, [uiState.isFilterModalOpen, updateUIState]);

  const setActiveMarker = useCallback((markerId: string | undefined) => {
    updateUIState({ activeMarker: markerId });
  }, [updateUIState]);

  // Search actions
  const updateSearchText = useCallback((searchText: string) => {
    updateFilter({ searchText });
  }, [updateFilter]);

  const performSearch = useCallback(() => {
    // This will be called by the parent component
    // to trigger the actual search
    console.log('Performing search with:', filter);
  }, [filter]);

  // Smart defaults based on mobile context
  const getSmartDefaults = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    const isEvening = hour >= 18 || hour <= 6;
    
    return {
      // Suggest "open_24hrs" in evening/night hours
      suggestedFilters: isEvening ? { open_24hrs: true } : {},
      // Suggest nearby search if location available
      suggestNearbySearch: true
    };
  }, []);

  return {
    // State
    filter,
    uiState,
    markers,
    isLoading,
    
    // Filter actions
    updateFilter,
    clearFilters,
    updateSearchText,
    performSearch,
    
    // UI actions
    updateUIState,
    setBottomSheetSnapPoint,
    toggleFilterModal,
    setActiveMarker,
    
    // Data actions
    setMarkers,
    setIsLoading,
    
    // Smart features
    getSmartDefaults
  };
}