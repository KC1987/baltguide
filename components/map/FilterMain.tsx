"use client";

import { useState } from "react";
import { Button, Chip } from "@heroui/react";
import { Input, Slider, CheckboxGroup, Checkbox, Divider } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPinIcon, FunnelIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useBreakpoint } from "./hooks/useBreakpoint";

interface FilterState {
  searchText: string;
  family_friendly?: boolean;
  free_entry?: boolean;
  petfriendly?: boolean;
  open_24hrs?: boolean;
  souvenirs?: boolean;
  categories?: string[];
  price_range?: string[];
  audience_range?: string[];
  parking?: string[];
  wifi?: string[];
  accessibility?: string[];
  distanceSearch?: {
    radius: number | string;
    userLat: number | string;
    userLon: number | string;
  };
}

interface FilterMainProps {
  getLocations: () => void;
  filter: FilterState;
  setFilter: (filter: FilterState) => void;
}

export default function FilterMain({
  getLocations,
  filter,
  setFilter,
}: FilterMainProps) {
  const [advancedMenuOpen, setAdvancedMenuOpen] = useState(false);
  const { isMobile } = useBreakpoint();

  function handleSearch() {
    getLocations();
  }

  function handleSelectionChange(name: keyof FilterState, selection: string[] | boolean) {
    setFilter({ ...filter, [name]: selection });
  }

  function getUserGeolocation() {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFilter({
          ...filter,
          distanceSearch: {
            ...filter.distanceSearch,
            userLat: pos.coords.latitude,
            userLon: pos.coords.longitude,
          },
        });
      },
      (error) => {
        console.error('Error getting location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }

  // Quick filter options for mobile chips
  const quickFilters = [
    { key: 'family_friendly', label: '👨‍👩‍👧‍👦 Family', isActive: filter.family_friendly },
    { key: 'free_entry', label: '🆓 Free', isActive: filter.free_entry },
    { key: 'petfriendly', label: '🐕 Pet OK', isActive: filter.petfriendly },
    { key: 'open_24hrs', label: '🕒 24/7', isActive: filter.open_24hrs },
    { key: 'souvenirs', label: '🛍️ Souvenirs', isActive: filter.souvenirs },
  ];

  const handleQuickFilterToggle = (filterKey: string) => {
    const currentValue = filter[filterKey];
    setFilter({ ...filter, [filterKey]: !currentValue });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filter.searchText) count++;
    if (filter.categories?.length > 0) count++;
    if (filter.price_range?.length > 0) count++;
    if (filter.audience_range?.length > 0) count++;
    if (filter.parking?.length > 0) count++;
    if (filter.wifi?.length > 0) count++;
    if (filter.accessibility?.length > 0) count++;
    if (filter.distanceSearch?.radius && filter.distanceSearch.radius !== "0") count++;
    quickFilters.forEach(qf => {
      if (filter[qf.key]) count++;
    });
    return count;
  };

  // Mobile-first responsive layout
  if (isMobile) {
    return (
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        {/* Mobile Search Bar */}
        <div className="p-4 pb-2">
          <Input
            placeholder="Search locations..."
            type="text"
            value={filter.searchText}
            onChange={(e) => setFilter({ ...filter, searchText: e.target.value })}
            startContent={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
            size="lg"
            className="w-full"
            radius="full"
          />
        </div>

        {/* Horizontal Quick Filter Chips */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {quickFilters.map((qf) => (
              <motion.div
                key={qf.key}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0"
              >
                <Chip
                  variant={qf.isActive ? "solid" : "bordered"}
                  color={qf.isActive ? "primary" : "default"}
                  className={`
                    min-h-[44px] px-4 cursor-pointer select-none
                    ${qf.isActive ? 'bg-blue-500 text-white' : 'bg-white border-gray-300'}
                    hover:scale-105 transition-all duration-200
                  `}
                  onClick={() => handleQuickFilterToggle(qf.key)}
                >
                  {qf.label}
                </Chip>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile Search Button */}
        <div className="px-4 pb-4">
          <Button
            color="primary"
            size="lg"
            onPress={handleSearch}
            className="w-full min-h-[48px] text-base font-semibold"
            startContent={<MagnifyingGlassIcon className="w-5 h-5" />}
          >
            Search Locations
          </Button>
        </div>

        {/* Distance slider for mobile (if location enabled) */}
        {filter.distanceSearch?.userLat && filter.distanceSearch.userLat !== "0" && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-700">Search Radius</span>
              <span className="text-sm text-gray-500">
                {filter.distanceSearch?.radius || 0} km
              </span>
            </div>
            <Slider
              color="primary"
              step={10}
              maxValue={300}
              minValue={0}
              value={filter.distanceSearch?.radius || 0}
              onChange={(value) =>
                setFilter({
                  ...filter,
                  distanceSearch: { ...filter.distanceSearch, radius: value },
                })
              }
              className="w-full"
            />
          </div>
        )}
      </div>
    );
  }

  // Tablet and Desktop Layout
  return (
    <div className="bg-sky-100 dark:bg-sky-800 w-full min-h-16 p-4 gap-4">
      {/* Desktop/Tablet Search */}
      <div className="flex gap-4 items-center mb-4">
        <Input
          placeholder="Search..."
          type="text"
          value={filter.searchText}
          onChange={(e) => setFilter({ ...filter, searchText: e.target.value })}
          startContent={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
          size="lg"
          className="flex-1"
        />
        <Button color="primary" size="lg" onPress={handleSearch} className="min-h-[48px]">
          Search
        </Button>
      </div>

      {/* Quick Filters for Desktop */}
      <div className="flex flex-wrap gap-3 mb-4">
        {quickFilters.map((qf) => (
          <Chip
            key={qf.key}
            variant={qf.isActive ? "solid" : "bordered"}
            color={qf.isActive ? "primary" : "default"}
            className={`
              min-h-[44px] px-4 cursor-pointer select-none
              ${qf.isActive ? 'bg-blue-500 text-white' : 'bg-white border-gray-300'}
              hover:scale-105 transition-all duration-200
            `}
            onClick={() => handleQuickFilterToggle(qf.key)}
          >
            {qf.label}
          </Chip>
        ))}
      </div>

      {/* Distance Search */}
      <div className="flex gap-4 items-center mb-4">
        <Slider
          className="flex-1 max-w-md"
          color="primary"
          label="Distance (km)"
          maxValue={300}
          minValue={0}
          showSteps={true}
          size="lg"
          step={30}
          value={filter.distanceSearch?.radius || 0}
          onChange={(value) =>
            setFilter({
              ...filter,
              distanceSearch: { ...filter.distanceSearch, radius: value },
            })
          }
        />
        <Button 
          color="secondary" 
          size="lg" 
          onPress={getUserGeolocation}
          startContent={<MapPinIcon className="w-5 h-5" />}
          className="min-h-[48px]"
        >
          Get Location
        </Button>
      </div>

      {filter.distanceSearch?.userLat && filter.distanceSearch.userLat !== "0" && (
        <div className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">
          📍 Location: {parseFloat(filter.distanceSearch.userLat).toFixed(4)}, {parseFloat(filter.distanceSearch.userLon).toFixed(4)}
        </div>
      )}

      {/* Advanced Menu Toggle */}
      <Button
        color="primary"
        variant="bordered"
        size="lg"
        onPress={() => setAdvancedMenuOpen(!advancedMenuOpen)}
        startContent={<FunnelIcon className="w-5 h-5" />}
        endContent={
          getActiveFilterCount() > 0 && (
            <Chip size="sm" color="primary" className="ml-2">
              {getActiveFilterCount()}
            </Chip>
          )
        }
        className="min-h-[48px]"
      >
        Advanced Filters
      </Button>

      {/* Animated Advanced Menu */}
      <AnimatePresence>
        {advancedMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-4"
          >
            <div className="bg-white rounded-xl p-6 shadow-lg">
              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  🏛️ Categories
                </h3>
                <CheckboxGroup
                  value={filter.categories || []}
                  onValueChange={(selection) =>
                    handleSelectionChange("categories", selection)
                  }
                  className="gap-3"
                >
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    <Checkbox value="culture-history" className="min-h-[44px]">
                      Culture & History
                    </Checkbox>
                    <Checkbox value="parks-nature" className="min-h-[44px]">
                      Parks & Nature
                    </Checkbox>
                    <Checkbox value="amusement-theme-parks" className="min-h-[44px]">
                      Amusement & Theme Parks
                    </Checkbox>
                    <Checkbox value="arts-live-entertainment" className="min-h-[44px]">
                      Arts & Live Entertainment
                    </Checkbox>
                    <Checkbox value="nightlife-bars" className="min-h-[44px]">
                      Nightlife & Bars
                    </Checkbox>
                    <Checkbox value="sports-recreation" className="min-h-[44px]">
                      Sports & Recreation
                    </Checkbox>
                    <Checkbox value="shopping-markets" className="min-h-[44px]">
                      Shopping & Markets
                    </Checkbox>
                    <Checkbox value="restaurants-dining" className="min-h-[44px]">
                      Restaurants & Dining
                    </Checkbox>
                    <Checkbox value="educational-interactive" className="min-h-[44px]">
                      Educational & Interactive
                    </Checkbox>
                    <Checkbox value="wellness-relaxation" className="min-h-[44px]">
                      Wellness & Relaxation
                    </Checkbox>
                    <Checkbox value="transport-tours" className="min-h-[44px]">
                      Transport & Tours
                    </Checkbox>
                    <Checkbox value="unique-niche" className="min-h-[44px]">
                      Unique & Niche Attractions
                    </Checkbox>
                  </div>
                </CheckboxGroup>
              </div>

              <Divider className="my-6" />

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  💰 Price Range
                </h3>
                <CheckboxGroup
                  value={filter.price_range || []}
                  onValueChange={(selection) => handleSelectionChange("price_range", selection)}
                  className="gap-3"
                >
                  <div className="flex flex-wrap gap-3">
                    <Checkbox value="free" className="min-h-[44px]">Free</Checkbox>
                    <Checkbox value="budget" className="min-h-[44px]">Budget (€0-10)</Checkbox>
                    <Checkbox value="moderate" className="min-h-[44px]">Moderate (€10-25)</Checkbox>
                    <Checkbox value="expensive" className="min-h-[44px]">Expensive (€25-50)</Checkbox>
                    <Checkbox value="luxury" className="min-h-[44px]">Luxury (€50+)</Checkbox>
                  </div>
                </CheckboxGroup>
              </div>

              <Divider className="my-6" />

              {/* Audience Range */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  👥 Suitable For
                </h3>
                <CheckboxGroup
                  value={filter.audience_range || []}
                  onValueChange={(selection) => handleSelectionChange("audience_range", selection)}
                  className="gap-3"
                >
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <Checkbox value="infants" className="min-h-[44px]">Infants (0-2)</Checkbox>
                    <Checkbox value="toddlers" className="min-h-[44px]">Toddlers (2-5)</Checkbox>
                    <Checkbox value="children" className="min-h-[44px]">Children (6-12)</Checkbox>
                    <Checkbox value="teenagers" className="min-h-[44px]">Teenagers (13-17)</Checkbox>
                    <Checkbox value="adults" className="min-h-[44px]">Adults (18+)</Checkbox>
                    <Checkbox value="seniors" className="min-h-[44px]">Seniors (65+)</Checkbox>
                  </div>
                </CheckboxGroup>
              </div>

              <Divider className="my-6" />

              {/* Amenities */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Parking */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    🚗 Parking
                  </h4>
                  <CheckboxGroup
                    value={filter.parking || []}
                    onValueChange={(selection) => handleSelectionChange("parking", selection)}
                    className="gap-2"
                  >
                    <Checkbox value="free" className="min-h-[44px]">Free</Checkbox>
                    <Checkbox value="paid" className="min-h-[44px]">Paid</Checkbox>
                    <Checkbox value="nearby" className="min-h-[44px]">Nearby</Checkbox>
                  </CheckboxGroup>
                </div>

                {/* WiFi */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    📶 WiFi
                  </h4>
                  <CheckboxGroup
                    value={filter.wifi || []}
                    onValueChange={(selection) => handleSelectionChange("wifi", selection)}
                    className="gap-2"
                  >
                    <Checkbox value="free" className="min-h-[44px]">Free</Checkbox>
                    <Checkbox value="free-limited" className="min-h-[44px]">Free Limited</Checkbox>
                    <Checkbox value="paid" className="min-h-[44px]">Paid</Checkbox>
                    <Checkbox value="none" className="min-h-[44px]">None</Checkbox>
                  </CheckboxGroup>
                </div>

                {/* Accessibility */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    ♿ Accessibility
                  </h4>
                  <CheckboxGroup
                    value={filter.accessibility || []}
                    onValueChange={(selection) => handleSelectionChange("accessibility", selection)}
                    className="gap-2"
                  >
                    <Checkbox value="wheelchair-accessible" className="min-h-[44px]">
                      Wheelchair Accessible
                    </Checkbox>
                    <Checkbox value="accessible-restrooms" className="min-h-[44px]">
                      Accessible Restrooms
                    </Checkbox>
                    <Checkbox value="audio-tours" className="min-h-[44px]">Audio Tours</Checkbox>
                    <Checkbox value="braille-signage" className="min-h-[44px]">Braille Signage</Checkbox>
                  </CheckboxGroup>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
