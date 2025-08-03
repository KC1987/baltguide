"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Button, 
  Input, 
  Slider, 
  CheckboxGroup, 
  Checkbox, 
  Divider,
  Card,
  CardBody,
  Switch,
  Badge
} from '@heroui/react';
import { 
  XMarkIcon, 
  MapPinIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface FilterPreview {
  estimatedResults: number;
  hasConflicts: boolean;
  conflictMessage?: string;
  suggestedRefinements: string[];
  isLoading: boolean;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filter: any;
  setFilter: (filter: any) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  // Real-time preview props
  onPreviewFilter?: (filter: any) => Promise<FilterPreview>;
  currentResultCount?: number;
}

interface FilterSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  hasActiveFilters?: boolean;
}

function FilterSection({ 
  title, 
  icon, 
  children, 
  defaultExpanded = false,
  hasActiveFilters = false 
}: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className="mb-4 shadow-sm">
      <CardBody className="p-0">
        <Button
          variant="light"
          className="w-full justify-between p-4 h-auto"
          onPress={() => setIsExpanded(!isExpanded)}
          endContent={
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Badge color="primary" size="sm" className="min-w-5 h-5">
                  •
                </Badge>
              )}
              {isExpanded ? (
                <ChevronUpIcon className="w-5 h-5" />
              ) : (
                <ChevronDownIcon className="w-5 h-5" />
              )}
            </div>
          }
        >
          <div className="flex items-center gap-3">
            {icon}
            <span className="font-medium text-left">{title}</span>
          </div>
        </Button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardBody>
    </Card>
  );
}

export default function FilterModal({
  isOpen,
  onClose,
  filter,
  setFilter,
  onApplyFilters,
  onClearFilters,
  onPreviewFilter,
  currentResultCount = 0
}: FilterModalProps) {
  const [localFilter, setLocalFilter] = useState(filter);
  const [filterPreview, setFilterPreview] = useState<FilterPreview>({
    estimatedResults: currentResultCount,
    hasConflicts: false,
    suggestedRefinements: [],
    isLoading: false
  });
  const [previewTimeout, setPreviewTimeout] = useState<NodeJS.Timeout | null>(null);

  // Sync with external filter changes
  useEffect(() => {
    setLocalFilter(filter);
    // Reset preview when external filter changes
    setFilterPreview(prev => ({
      ...prev,
      estimatedResults: currentResultCount,
      hasConflicts: false,
      suggestedRefinements: []
    }));
  }, [filter, currentResultCount]);

  // Real-time filter preview with debouncing
  useEffect(() => {
    if (!onPreviewFilter || !isOpen) return;

    // Clear existing timeout
    if (previewTimeout) {
      clearTimeout(previewTimeout);
      setPreviewTimeout(null);
    }

    // Set new timeout for debounced preview
    const timeout = setTimeout(async () => {
      setFilterPreview(prev => ({ ...prev, isLoading: true }));
      
      try {
        const preview = await onPreviewFilter(localFilter);
        // Check if component is still mounted and timeout is still valid
        setPreviewTimeout(currentTimeout => {
          if (currentTimeout === timeout) {
            setFilterPreview(preview);
            return null;
          }
          return currentTimeout;
        });
      } catch (error) {
        console.error('Filter preview error:', error);
        setPreviewTimeout(currentTimeout => {
          if (currentTimeout === timeout) {
            setFilterPreview(prev => ({
              ...prev,
              isLoading: false,
              hasConflicts: true,
              conflictMessage: 'Unable to preview results'
            }));
            return null;
          }
          return currentTimeout;
        });
      }
    }, 300); // 300ms debounce

    setPreviewTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [localFilter, onPreviewFilter, isOpen, previewTimeout]);

  const handleApply = () => {
    setFilter(localFilter);
    onApplyFilters();
    onClose();
  };

  const handleClear = () => {
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
      audience_range: []
    };
    setLocalFilter(clearedFilter);
    onClearFilters();
  };

  const handleLocalChange = (field: string, value: any) => {
    const updatedFilter = { ...localFilter, [field]: value };
    setLocalFilter(updatedFilter);
    
    // Immediate UI feedback for better UX
    if (!filterPreview.isLoading) {
      setFilterPreview(prev => ({ ...prev, isLoading: true }));
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleLocalChange('distanceSearch', {
            ...localFilter.distanceSearch,
            userLat: position.coords.latitude.toString(),
            userLon: position.coords.longitude.toString(),
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    }
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilter.searchText) count++;
    if (localFilter.distanceSearch?.radius && localFilter.distanceSearch.radius !== "0") count++;
    if (localFilter.family_friendly) count++;
    if (localFilter.open_24hrs) count++;
    if (localFilter.free_entry) count++;
    if (localFilter.souvenirs) count++;
    if (localFilter.petfriendly) count++;
    if (localFilter.categories?.length > 0) count++;
    if (localFilter.price_range?.length > 0) count++;
    if (localFilter.audience_range?.length > 0) count++;
    if (localFilter.parking?.length > 0) count++;
    if (localFilter.wifi?.length > 0) count++;
    if (localFilter.accessibility?.length > 0) count++;
    return count;
  };

  const getResultCountColor = () => {
    if (filterPreview.hasConflicts) return 'text-red-500';
    if (filterPreview.estimatedResults === 0) return 'text-orange-500';
    if (filterPreview.estimatedResults < 5) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getResultCountMessage = () => {
    if (filterPreview.hasConflicts) {
      return filterPreview.conflictMessage || 'Filter conflict detected';
    }
    if (filterPreview.estimatedResults === 0) {
      return 'No results found - try relaxing some filters';
    }
    if (filterPreview.estimatedResults === 1) {
      return '1 location matches your filters';
    }
    return `~${filterPreview.estimatedResults} locations match your filters`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute inset-x-0 bottom-0 top-16 bg-white rounded-t-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm rounded-t-2xl border-b border-gray-100">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <FunnelIcon className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Filters
                </h2>
                {getActiveFilterCount() > 0 && (
                  <Badge color="primary">{getActiveFilterCount()}</Badge>
                )}
              </div>
              <Button
                isIconOnly
                variant="light"
                size="lg"
                onPress={onClose}
                className="text-gray-500"
              >
                <XMarkIcon className="w-6 h-6" />
              </Button>
            </div>
            
            {/* Real-time filter preview */}
            {onPreviewFilter && (
              <div className="px-4 pb-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {filterPreview.isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-600">Updating preview...</span>
                      </>
                    ) : (
                      <>
                        <span className={`text-sm font-medium ${getResultCountColor()}`}>
                          📍 {getResultCountMessage()}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {filterPreview.estimatedResults !== currentResultCount && !filterPreview.isLoading && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <span>Preview</span>
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
                
                {/* Conflict resolution suggestions */}
                {filterPreview.hasConflicts && filterPreview.suggestedRefinements.length > 0 && (
                  <div className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="text-sm font-medium text-orange-800 mb-2">
                      💡 Suggestions to find more results:
                    </div>
                    <div className="space-y-1">
                      {filterPreview.suggestedRefinements.map((suggestion, index) => (
                        <div key={index} className="text-xs text-orange-700">
                          • {suggestion}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 pb-24">
            {/* Quick Search */}
            <FilterSection 
              title="Search & Location" 
              icon={<MagnifyingGlassIcon className="w-5 h-5 text-gray-600" />}
              defaultExpanded={true}
              hasActiveFilters={Boolean(localFilter.searchText || (localFilter.distanceSearch?.radius && localFilter.distanceSearch.radius !== "0"))}
            >
              <div className="space-y-4">
                <Input
                  placeholder="Search attractions..."
                  value={localFilter.searchText}
                  onChange={(e) => handleLocalChange('searchText', e.target.value)}
                  startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
                  size="lg"
                  radius="lg"
                />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Distance Search</span>
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={getUserLocation}
                      startContent={<MapPinIcon className="w-4 h-4" />}
                    >
                      Use My Location
                    </Button>
                  </div>
                  
                  <Slider
                    label="Search Radius"
                    size="lg"
                    step={10}
                    maxValue={300}
                    minValue={0}
                    value={Math.max(0, parseInt(localFilter.distanceSearch?.radius || "0") || 0)}
                    onChange={(value) => handleLocalChange('distanceSearch', {
                      ...localFilter.distanceSearch,
                      radius: Math.max(0, Number(value) || 0).toString()
                    })}
                    formatOptions={{ style: "unit", unit: "kilometer" }}
                    className="max-w-full"
                  />
                  
                  {localFilter.distanceSearch?.userLat && localFilter.distanceSearch?.userLat !== "0" && (
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                      📍 Location: {(parseFloat(localFilter.distanceSearch.userLat) || 0).toFixed(4)}, {(parseFloat(localFilter.distanceSearch.userLon) || 0).toFixed(4)}
                    </div>
                  )}
                </div>
              </div>
            </FilterSection>

            {/* Quick Toggles */}
            <FilterSection 
              title="Quick Filters" 
              icon={<span className="text-gray-600">⚡</span>}
              defaultExpanded={true}
              hasActiveFilters={Boolean(localFilter.family_friendly || localFilter.open_24hrs || localFilter.free_entry || localFilter.souvenirs || localFilter.petfriendly)}
            >
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium">👨‍👩‍👧‍👦 Family Friendly</span>
                  <Switch
                    isSelected={localFilter.family_friendly || false}
                    onValueChange={(value) => handleLocalChange('family_friendly', value)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium">🕒 Open 24/7</span>
                  <Switch
                    isSelected={localFilter.open_24hrs || false}
                    onValueChange={(value) => handleLocalChange('open_24hrs', value)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium">🆓 Free Entry</span>
                  <Switch
                    isSelected={localFilter.free_entry || false}
                    onValueChange={(value) => handleLocalChange('free_entry', value)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium">🛍️ Souvenirs Available</span>
                  <Switch
                    isSelected={localFilter.souvenirs || false}
                    onValueChange={(value) => handleLocalChange('souvenirs', value)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium">🐕 Pet Friendly</span>
                  <Switch
                    isSelected={localFilter.petfriendly || false}
                    onValueChange={(value) => handleLocalChange('petfriendly', value)}
                  />
                </div>
              </div>
            </FilterSection>

            {/* Categories */}
            <FilterSection 
              title="Categories" 
              icon={<span className="text-gray-600">🏛️</span>}
              hasActiveFilters={localFilter.categories?.length > 0}
            >
              <CheckboxGroup
                value={localFilter.categories || []}
                onValueChange={(value) => handleLocalChange('categories', value)}
                className="gap-3"
              >
                <div className="grid grid-cols-1 gap-3">
                  <Checkbox value="culture-history" className="p-3 bg-gray-50 rounded-xl">
                    🏛️ Culture & History
                  </Checkbox>
                  <Checkbox value="parks-nature" className="p-3 bg-gray-50 rounded-xl">
                    🌳 Parks & Nature
                  </Checkbox>
                  <Checkbox value="amusement-theme-parks" className="p-3 bg-gray-50 rounded-xl">
                    🎢 Amusement & Theme Parks
                  </Checkbox>
                  <Checkbox value="arts-live-entertainment" className="p-3 bg-gray-50 rounded-xl">
                    🎭 Arts & Live Entertainment
                  </Checkbox>
                  <Checkbox value="nightlife-bars" className="p-3 bg-gray-50 rounded-xl">
                    🍺 Nightlife & Bars
                  </Checkbox>
                  <Checkbox value="sports-recreation" className="p-3 bg-gray-50 rounded-xl">
                    ⚽ Sports & Recreation
                  </Checkbox>
                  <Checkbox value="shopping-markets" className="p-3 bg-gray-50 rounded-xl">
                    🛒 Shopping & Markets
                  </Checkbox>
                  <Checkbox value="restaurants-dining" className="p-3 bg-gray-50 rounded-xl">
                    🍽️ Restaurants & Dining
                  </Checkbox>
                  <Checkbox value="educational-interactive" className="p-3 bg-gray-50 rounded-xl">
                    📚 Educational & Interactive
                  </Checkbox>
                  <Checkbox value="wellness-relaxation" className="p-3 bg-gray-50 rounded-xl">
                    🧘 Wellness & Relaxation
                  </Checkbox>
                </div>
              </CheckboxGroup>
            </FilterSection>

            {/* Price Range */}
            <FilterSection 
              title="Price Range" 
              icon={<span className="text-gray-600">💰</span>}
              hasActiveFilters={localFilter.price_range?.length > 0}
            >
              <CheckboxGroup
                value={localFilter.price_range || []}
                onValueChange={(value) => handleLocalChange('price_range', value)}
                className="gap-3"
              >
                <div className="grid grid-cols-1 gap-3">
                  <Checkbox value="free" className="p-3 bg-gray-50 rounded-xl">
                    🆓 Free
                  </Checkbox>
                  <Checkbox value="budget" className="p-3 bg-gray-50 rounded-xl">
                    💰 Budget (€0-10)
                  </Checkbox>
                  <Checkbox value="moderate" className="p-3 bg-gray-50 rounded-xl">
                    💰💰 Moderate (€10-25)
                  </Checkbox>
                  <Checkbox value="expensive" className="p-3 bg-gray-50 rounded-xl">
                    💰💰💰 Expensive (€25-50)
                  </Checkbox>
                  <Checkbox value="luxury" className="p-3 bg-gray-50 rounded-xl">
                    💎 Luxury (€50+)
                  </Checkbox>
                </div>
              </CheckboxGroup>
            </FilterSection>

            {/* Audience Range */}
            <FilterSection 
              title="Suitable For" 
              icon={<span className="text-gray-600">👥</span>}
              hasActiveFilters={localFilter.audience_range?.length > 0}
            >
              <CheckboxGroup
                value={localFilter.audience_range || []}
                onValueChange={(value) => handleLocalChange('audience_range', value)}
                className="gap-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <Checkbox value="infants" className="p-3 bg-gray-50 rounded-xl text-sm">
                    👶 Infants (0-2)
                  </Checkbox>
                  <Checkbox value="toddlers" className="p-3 bg-gray-50 rounded-xl text-sm">
                    🧒 Toddlers (2-5)
                  </Checkbox>
                  <Checkbox value="children" className="p-3 bg-gray-50 rounded-xl text-sm">
                    👦 Children (6-12)
                  </Checkbox>
                  <Checkbox value="teenagers" className="p-3 bg-gray-50 rounded-xl text-sm">
                    👨‍🎓 Teens (13-17)
                  </Checkbox>
                  <Checkbox value="adults" className="p-3 bg-gray-50 rounded-xl text-sm">
                    👩‍💼 Adults (18+)
                  </Checkbox>
                  <Checkbox value="seniors" className="p-3 bg-gray-50 rounded-xl text-sm">
                    👴 Seniors (65+)
                  </Checkbox>
                </div>
              </CheckboxGroup>
            </FilterSection>

            {/* Amenities */}
            <FilterSection 
              title="Amenities" 
              icon={<span className="text-gray-600">🏪</span>}
              hasActiveFilters={localFilter.parking?.length > 0 || localFilter.wifi?.length > 0 || localFilter.accessibility?.length > 0}
            >
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">🚗 Parking</h4>
                  <CheckboxGroup
                    value={localFilter.parking || []}
                    onValueChange={(value) => handleLocalChange('parking', value)}
                    orientation="horizontal"
                    className="gap-2"
                  >
                    <Checkbox value="free">Free</Checkbox>
                    <Checkbox value="paid">Paid</Checkbox>
                    <Checkbox value="nearby">Nearby</Checkbox>
                  </CheckboxGroup>
                </div>

                <div>
                  <h4 className="font-medium mb-3">📶 WiFi</h4>
                  <CheckboxGroup
                    value={localFilter.wifi || []}
                    onValueChange={(value) => handleLocalChange('wifi', value)}
                    orientation="horizontal"
                    className="gap-2"
                  >
                    <Checkbox value="free">Free</Checkbox>
                    <Checkbox value="paid">Paid</Checkbox>
                    <Checkbox value="none">None</Checkbox>
                  </CheckboxGroup>
                </div>

                <div>
                  <h4 className="font-medium mb-3">♿ Accessibility</h4>
                  <CheckboxGroup
                    value={localFilter.accessibility || []}
                    onValueChange={(value) => handleLocalChange('accessibility', value)}
                    className="gap-2"
                  >
                    <Checkbox value="wheelchair-accessible">Wheelchair Accessible</Checkbox>
                    <Checkbox value="accessible-restrooms">Accessible Restrooms</Checkbox>
                    <Checkbox value="audio-tours">Audio Tours</Checkbox>
                    <Checkbox value="braille-signage">Braille Signage</Checkbox>
                  </CheckboxGroup>
                </div>
              </div>
            </FilterSection>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 p-4 pb-safe">
            {/* Quick result summary */}
            {onPreviewFilter && !filterPreview.isLoading && (
              <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {filterPreview.estimatedResults === currentResultCount
                      ? 'Current results'
                      : 'Preview results'
                    }
                  </span>
                  <span className={`font-medium ${getResultCountColor()}`}>
                    {filterPreview.estimatedResults} locations
                  </span>
                </div>
                {filterPreview.estimatedResults !== currentResultCount && (
                  <div className="text-xs text-gray-500 mt-1">
                    Current: {currentResultCount} → Preview: {filterPreview.estimatedResults}
                    <span className={`ml-2 ${
                      filterPreview.estimatedResults > currentResultCount
                        ? 'text-green-600'
                        : filterPreview.estimatedResults < currentResultCount
                        ? 'text-orange-600'
                        : 'text-gray-600'
                    }`}>
                      {filterPreview.estimatedResults > currentResultCount
                        ? `(+${filterPreview.estimatedResults - currentResultCount})`
                        : filterPreview.estimatedResults < currentResultCount
                        ? `(${filterPreview.estimatedResults - currentResultCount})`
                        : '(no change)'
                      }
                    </span>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-3">
              <Button
                variant="bordered"
                size="lg"
                onPress={handleClear}
                className="flex-1"
              >
                Clear All
              </Button>
              <Button
                color={filterPreview.hasConflicts ? "warning" : "primary"}
                size="lg"
                onPress={handleApply}
                className="flex-1"
                isDisabled={filterPreview.isLoading}
              >
                {filterPreview.isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  `Apply Filters ${getActiveFilterCount() > 0 ? `(${getActiveFilterCount()})` : ''}`
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}