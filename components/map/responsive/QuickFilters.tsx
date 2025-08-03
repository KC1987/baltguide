"use client";

import { ScrollShadow, Chip, Button, Badge } from '@heroui/react';
import { ClockIcon, FireIcon, SparklesIcon, StarIcon, BoltIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useSmartFilters, type FilterSuggestion } from '../hooks/useSmartFilters';
import { hapticFeedback } from '../hooks/useSwipeGestures';

interface QuickFiltersProps {
  onApplyFilterCombination: (filters: any) => void;
  currentFilter: any;
  recentSearches: string[];
  onRecentSearchSelect: (search: string) => void;
  // Enhanced props for context-aware filtering
  showPersonalized?: boolean;
  maxSuggestions?: number;
  enableAnalytics?: boolean;
}

interface FilterCombination {
  name: string;
  emoji: string;
  filters: any;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  priority?: number;
  isPersonalized?: boolean;
  description?: string;
}

export default function QuickFilters({
  onApplyFilterCombination,
  currentFilter,
  recentSearches,
  onRecentSearchSelect,
  showPersonalized = true,
  maxSuggestions = 8,
  enableAnalytics = true
}: QuickFiltersProps) {
  
  // Use enhanced smart filters for dynamic suggestions
  const {
    getSuggestedFilterCombinations,
    getPersonalizedSuggestions,
    contextualData,
    currentWeather
  } = useSmartFilters();
  
  // Convert FilterSuggestion to FilterCombination format
  const convertToFilterCombination = (suggestion: FilterSuggestion): FilterCombination => {
    const priorityColorMap: Record<number, FilterCombination['color']> = {
      95: 'primary',
      90: 'success', 
      85: 'secondary',
      80: 'warning',
      75: 'danger'
    };
    
    // Find closest priority color
    const colorKey = Object.keys(priorityColorMap)
      .map(Number)
      .sort((a, b) => Math.abs(suggestion.priority - a) - Math.abs(suggestion.priority - b))[0];
    
    return {
      name: suggestion.name,
      emoji: suggestion.emoji,
      filters: suggestion.filters,
      color: priorityColorMap[colorKey] || 'primary',
      priority: suggestion.priority,
      description: suggestion.description,
      isPersonalized: suggestion.context?.includes('personalized') || false
    };
  };
  
  // Get dynamic contextual suggestions
  const getContextualSuggestions = (): FilterCombination[] => {
    const smartSuggestions = getSuggestedFilterCombinations();
    return smartSuggestions
      .slice(0, maxSuggestions)
      .map(convertToFilterCombination)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  };
  
  // Get personalized suggestions if enabled
  const getPersonalizedCombinations = (): FilterCombination[] => {
    if (!showPersonalized) return [];
    
    const personalizedSuggestions = getPersonalizedSuggestions();
    return personalizedSuggestions
      .slice(0, 3)
      .map(suggestion => ({
        ...convertToFilterCombination(suggestion),
        isPersonalized: true
      }));
  };

  // Handle filter selection with analytics and haptic feedback
  const handleFilterSelection = (combination: FilterCombination) => {
    // Haptic feedback
    if (combination.isPersonalized) {
      hapticFeedback.success(); // Special feedback for personalized suggestions
    } else {
      hapticFeedback.light();
    }
    
    // Apply the filter combination
    onApplyFilterCombination(combination.filters);
    
    // Analytics tracking (if enabled)
    if (enableAnalytics && typeof window !== 'undefined') {
      try {
        // Track filter combination usage
        const analyticsData = {
          combination_name: combination.name,
          is_personalized: combination.isPersonalized,
          priority: combination.priority,
          context: contextualData?.userBehaviorPattern,
          weather: currentWeather?.condition,
          timestamp: Date.now()
        };
        
        // Store in localStorage for local analytics
        const existingAnalytics = JSON.parse(
          localStorage.getItem('filter_combination_analytics') || '[]'
        );
        existingAnalytics.push(analyticsData);
        
        // Keep only last 100 entries
        const recentAnalytics = existingAnalytics.slice(-100);
        localStorage.setItem('filter_combination_analytics', JSON.stringify(recentAnalytics));
      } catch (error) {
        console.warn('Analytics tracking failed:', error);
      }
    }
  };

  const contextualSuggestions = getContextualSuggestions();
  const personalizedCombinations = getPersonalizedCombinations();
  
  // Combine all suggestions with deduplication
  const allSuggestions = [
    ...personalizedCombinations,
    ...contextualSuggestions
  ].reduce((acc, current) => {
    // Remove duplicates based on name
    if (!acc.find(item => item.name === current.name)) {
      acc.push(current);
    }
    return acc;
  }, [] as FilterCombination[]);

  return (
    <div className="space-y-4">
      {/* Context indicator */}
      {contextualData && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-full px-3 py-1 w-fit"
        >
          <span>🧠</span>
          <span>
            {contextualData.userBehaviorPattern === 'explorer' ? 'Discovering new places' :
             contextualData.userBehaviorPattern === 'planner' ? 'Planning carefully' :
             contextualData.userBehaviorPattern === 'local' ? 'Local insights' :
             'Smart suggestions'}
          </span>
          {currentWeather && (
            <span className="ml-1">
              • {currentWeather.temperature}°C {currentWeather.condition}
            </span>
          )}
        </motion.div>
      )}
      {/* Personalized suggestions */}
      {personalizedCombinations.length > 0 && showPersonalized && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <StarIcon className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-700">For You</span>
            <Badge size="sm" color="secondary" variant="flat">
              Smart
            </Badge>
          </div>
          <ScrollShadow 
            orientation="horizontal" 
            className="flex gap-2 pb-2"
            hideScrollBar
          >
            {personalizedCombinations.map((combination, index) => (
              <motion.div
                key={combination.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <Chip
                  color={combination.color}
                  variant="flat"
                  className="cursor-pointer hover:scale-105 transition-transform whitespace-nowrap pr-8"
                  onClick={() => handleFilterSelection(combination)}
                  startContent={<span className="text-sm">{combination.emoji}</span>}
                >
                  {combination.name}
                </Chip>
                <Badge
                  content="✨"
                  size="sm"
                  color="secondary"
                  className="absolute -top-1 -right-1 pointer-events-none"
                />
              </motion.div>
            ))}
          </ScrollShadow>
        </div>
      )}

      {/* Contextual suggestions */}
      {contextualSuggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BoltIcon className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              {currentWeather?.condition === 'rainy' ? 'Weather-Smart' :
               new Date().getHours() >= 18 || new Date().getHours() <= 6 ? 'Evening Picks' :
               new Date().getDay() === 0 || new Date().getDay() === 6 ? 'Weekend Fun' :
               'Recommended'}
            </span>
            {currentWeather && (
              <Badge size="sm" color="primary" variant="dot">
                {currentWeather.condition}
              </Badge>
            )}
          </div>
          <ScrollShadow 
            orientation="horizontal" 
            className="flex gap-2 pb-2"
            hideScrollBar
          >
            <AnimatePresence>
              {contextualSuggestions.map((combination, index) => (
                <motion.div
                  key={combination.name}
                  initial={{ opacity: 0, x: 20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.9 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Chip
                    color={combination.color}
                    variant={combination.priority && combination.priority > 90 ? "solid" : "flat"}
                    className="cursor-pointer transition-all duration-200 whitespace-nowrap"
                    onClick={() => handleFilterSelection(combination)}
                    startContent={<span className="text-sm">{combination.emoji}</span>}
                  >
                    <span className="flex items-center gap-1">
                      {combination.name}
                      {combination.priority && combination.priority > 90 && (
                        <span className="text-xs opacity-75">⚡</span>
                      )}
                    </span>
                  </Chip>
                </motion.div>
              ))}
            </AnimatePresence>
          </ScrollShadow>
        </div>
      )}

      {/* Recent searches */}
      {recentSearches.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <SparklesIcon className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-700">Recent searches</span>
          </div>
          <ScrollShadow 
            orientation="horizontal" 
            className="flex gap-2 pb-2"
            hideScrollBar
          >
            {recentSearches.map((search, index) => (
              <motion.div
                key={search}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Chip
                  variant="bordered"
                  className="cursor-pointer hover:scale-105 transition-transform whitespace-nowrap"
                  onClick={() => {
                    hapticFeedback.light();
                    onRecentSearchSelect(search);
                  }}
                >
                  {search}
                </Chip>
              </motion.div>
            ))}
          </ScrollShadow>
        </div>
      )}
    </div>
  );
}