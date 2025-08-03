"use client";

import { useState, useEffect, useCallback } from 'react';

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

interface FilterSuggestion {
  id: string;
  name: string;
  emoji: string;
  description: string;
  filters: Partial<FilterState>;
  priority: number;
  context: string[];
  autoApply?: boolean;
}

interface WeatherCondition {
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'unknown';
  temperature: number;
  humidity: number;
}

interface SmartDefaults {
  timeBasedSuggestions: Partial<FilterState>;
  locationBasedSuggestions: Partial<FilterState>;
  weekdayBasedSuggestions: Partial<FilterState>;
  seasonalSuggestions: Partial<FilterState>;
  weatherBasedSuggestions: Partial<FilterState>;
  eventBasedSuggestions: Partial<FilterState>;
}

interface ContextualIntelligence {
  userBehaviorPattern: 'explorer' | 'planner' | 'spontaneous' | 'local';
  visitFrequency: 'first-time' | 'occasional' | 'frequent';
  preferredTimeSlots: string[];
  budgetTier: 'budget' | 'moderate' | 'premium' | 'luxury';
  groupType: 'solo' | 'couple' | 'family' | 'friends' | 'business';
}

const STORAGE_KEY = 'baltguide_filter_preferences';
const RECENT_SEARCHES_KEY = 'baltguide_recent_searches';
const CONTEXTUAL_DATA_KEY = 'baltguide_contextual_data';
const FILTER_ANALYTICS_KEY = 'baltguide_filter_analytics';
const FILTER_SESSION_KEY = 'baltguide_current_session_filter';
const FILTER_HISTORY_KEY = 'baltguide_filter_history';
const MAX_RECENT_SEARCHES = 10; // Increased for better suggestions
const MAX_FILTER_HISTORY = 20;

interface ContextualData {
  nearbyAttractions: any[];
  weatherInfo: any;
  localEvents: any[];
  trendingCategories: string[];
}

interface UserPreferences {
  categories: string[];
  priceRange: string[];
  accessibility: string[];
  recentSearches: string[];
}

export function useSmartFilters() {
  const [filterHistory, setFilterHistory] = useState<FilterState[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [userPreferences, setUserPreferences] = useState<Partial<FilterState>>({});
  const [contextualData, setContextualData] = useState<ContextualIntelligence | null>(null);
  const [currentWeather, setCurrentWeather] = useState<WeatherCondition | null>(null);
  const [filterAnalytics, setFilterAnalytics] = useState<Map<string, number>>(new Map());

  // Load persisted data and initialize contextual intelligence on mount
  useEffect(() => {
    loadPersistedData();
    initializeContextualIntelligence();
    fetchWeatherData();
  }, []);

  // Update contextual data based on usage patterns
  useEffect(() => {
    if (filterHistory.length > 5) {
      updateContextualIntelligence();
    }
  }, [filterHistory]);

  const loadPersistedData = () => {
    try {
      // Load filter preferences
      const savedPreferences = localStorage.getItem(STORAGE_KEY);
      if (savedPreferences) {
        setUserPreferences(JSON.parse(savedPreferences));
      }

      // Load recent searches
      const savedSearches = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (savedSearches) {
        setRecentSearches(JSON.parse(savedSearches));
      }

      // Load contextual data
      const savedContextual = localStorage.getItem(CONTEXTUAL_DATA_KEY);
      if (savedContextual) {
        setContextualData(JSON.parse(savedContextual));
      }

      // Load filter history
      const savedHistory = localStorage.getItem(FILTER_HISTORY_KEY);
      if (savedHistory) {
        setFilterHistory(JSON.parse(savedHistory));
      }

      // Load filter analytics
      const savedAnalytics = localStorage.getItem(FILTER_ANALYTICS_KEY);
      if (savedAnalytics) {
        setFilterAnalytics(new Map(JSON.parse(savedAnalytics)));
      }
    } catch (error) {
      console.error('Error loading persisted filter data:', error);
    }
  };

  const initializeContextualIntelligence = () => {
    if (!contextualData) {
      const initialContext: ContextualIntelligence = {
        userBehaviorPattern: 'explorer',
        visitFrequency: 'first-time',
        preferredTimeSlots: [],
        budgetTier: 'moderate',
        groupType: 'solo'
      };
      setContextualData(initialContext);
    }
  };

  const fetchWeatherData = async () => {
    try {
      // Simple weather simulation - in real app, use weather API
      const mockWeather: WeatherCondition = {
        condition: Math.random() > 0.7 ? 'rainy' : 'sunny',
        temperature: Math.round(Math.random() * 30 + 5), // 5-35°C
        humidity: Math.round(Math.random() * 50 + 30) // 30-80%
      };
      setCurrentWeather(mockWeather);
    } catch (error) {
      console.warn('Could not fetch weather data:', error);
    }
  };

  const updateContextualIntelligence = () => {
    if (!filterHistory.length) return;

    const recentFilters = filterHistory.slice(-10);
    const categoryFrequency = new Map<string, number>();
    const timeSlots = new Set<string>();
    let totalBudgetSelections = 0;
    let familyFriendlyCount = 0;

    recentFilters.forEach(filter => {
      // Analyze category preferences
      filter.categories?.forEach(cat => {
        categoryFrequency.set(cat, (categoryFrequency.get(cat) || 0) + 1);
      });

      // Analyze time patterns
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 12) timeSlots.add('morning');
      else if (hour >= 12 && hour < 18) timeSlots.add('afternoon');
      else timeSlots.add('evening');

      // Analyze budget preferences
      if (filter.price_range?.includes('budget') || filter.free_entry) {
        totalBudgetSelections++;
      }

      // Analyze group type indicators
      if (filter.family_friendly) familyFriendlyCount++;
    });

    // Determine user behavior pattern
    let behaviorPattern: ContextualIntelligence['userBehaviorPattern'] = 'explorer';
    if (categoryFrequency.size <= 2) behaviorPattern = 'planner';
    else if (recentFilters.length > 15) behaviorPattern = 'local';

    // Determine budget tier
    let budgetTier: ContextualIntelligence['budgetTier'] = 'moderate';
    if (totalBudgetSelections > recentFilters.length * 0.7) budgetTier = 'budget';

    // Determine group type
    let groupType: ContextualIntelligence['groupType'] = 'solo';
    if (familyFriendlyCount > recentFilters.length * 0.5) groupType = 'family';

    const updatedContext: ContextualIntelligence = {
      userBehaviorPattern: behaviorPattern,
      visitFrequency: filterHistory.length > 20 ? 'frequent' : 'occasional',
      preferredTimeSlots: Array.from(timeSlots),
      budgetTier,
      groupType
    };

    setContextualData(updatedContext);
    localStorage.setItem(CONTEXTUAL_DATA_KEY, JSON.stringify(updatedContext));
  };

  const saveFilterPreferences = useCallback((filter: FilterState) => {
    try {
      // Extract preferences (non-temporary data)
      const preferences: Partial<FilterState> = {
        categories: filter.categories,
        price_range: filter.price_range,
        audience_range: filter.audience_range,
        accessibility: filter.accessibility,
        parking: filter.parking,
        wifi: filter.wifi,
        // Boolean preferences
        family_friendly: filter.family_friendly,
        petfriendly: filter.petfriendly,
      };

      setUserPreferences(preferences);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));

      // Update filter history for session persistence
      setFilterHistory(prev => {
        const updated = [filter, ...prev.filter(f => 
          JSON.stringify(f) !== JSON.stringify(filter)
        )].slice(0, MAX_FILTER_HISTORY);
        
        try {
          localStorage.setItem(FILTER_HISTORY_KEY, JSON.stringify(updated));
        } catch (error) {
          console.error('Error saving filter history:', error);
        }
        
        return updated;
      });

      // Save current session filter for restoration
      try {
        localStorage.setItem(FILTER_SESSION_KEY, JSON.stringify({
          filter,
          timestamp: Date.now(),
          sessionId: Date.now().toString() // Simple session tracking
        }));
      } catch (error) {
        console.error('Error saving session filter:', error);
      }
    } catch (error) {
      console.error('Error saving filter preferences:', error);
    }
  }, []);

  const addToRecentSearches = useCallback((searchText: string) => {
    if (!searchText.trim()) return;

    setRecentSearches(prev => {
      const updated = [searchText, ...prev.filter(s => s !== searchText)]
        .slice(0, MAX_RECENT_SEARCHES);
      
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving recent searches:', error);
      }
      
      return updated;
    });
  }, []);

  const getSmartDefaults = useCallback((): SmartDefaults => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const month = now.getMonth(); // 0 = January

    // Time-based suggestions
    const timeBasedSuggestions: Partial<FilterState> = {};
    
    if (hour >= 18 || hour <= 6) {
      // Evening/Night suggestions
      timeBasedSuggestions.open_24hrs = true;
      timeBasedSuggestions.categories = ['nightlife-bars', 'restaurants-dining'];
    } else if (hour >= 9 && hour <= 17) {
      // Daytime suggestions
      timeBasedSuggestions.categories = ['culture-history', 'parks-nature', 'shopping-markets'];
    }

    // Weekend suggestions
    const weekdayBasedSuggestions: Partial<FilterState> = {};
    if (day === 0 || day === 6) {
      // Weekend
      weekdayBasedSuggestions.family_friendly = true;
      weekdayBasedSuggestions.categories = ['amusement-theme-parks', 'parks-nature', 'family-entertainment'];
    }

    // Seasonal suggestions
    const seasonalSuggestions: Partial<FilterState> = {};
    if (month >= 5 && month <= 8) {
      // Summer (June-September)
      seasonalSuggestions.categories = ['parks-nature', 'sports-recreation', 'amusement-theme-parks'];
    } else if (month >= 11 || month <= 2) {
      // Winter (December-March)
      seasonalSuggestions.categories = ['culture-history', 'arts-live-entertainment', 'shopping-markets'];
    }

    // Location-based suggestions (if geolocation is available)
    const locationBasedSuggestions: Partial<FilterState> = {};
    // This would be enhanced with actual location data
    
    return {
      timeBasedSuggestions,
      locationBasedSuggestions,
      weekdayBasedSuggestions,
      seasonalSuggestions
    };
  }, []);

  const getPopularFilters = useCallback(() => {
    // Based on usage patterns - could be enhanced with analytics
    return {
      categories: ['culture-history', 'parks-nature', 'restaurants-dining'],
      quickFilters: ['family_friendly', 'free_entry'],
      priceRanges: ['free', 'budget']
    };
  }, []);

  const getSuggestedFilterCombinations = useCallback((): FilterSuggestion[] => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    const baseCombo: FilterSuggestion[] = [
      {
        id: 'family-day-out',
        name: 'Family Day Out',
        emoji: '👨‍👩‍👧‍👦',
        description: 'Perfect activities for the whole family',
        filters: {
          family_friendly: true,
          categories: ['amusement-theme-parks', 'parks-nature'],
          price_range: ['budget', 'moderate']
        },
        priority: (day === 0 || day === 6) ? 95 : 80, // Higher priority on weekends
        context: ['family', 'weekend', 'popular']
      },
      {
        id: 'culture-history',
        name: 'Culture & History',
        emoji: '🏛️',
        description: 'Discover the rich history and culture',
        filters: {
          categories: ['culture-history', 'educational-interactive'],
          price_range: ['free', 'budget']
        },
        priority: (hour >= 9 && hour <= 17) ? 90 : 75, // Higher priority during daytime
        context: ['culture', 'educational', 'popular']
      },
      {
        id: 'nature-lover',
        name: 'Nature Lover',
        emoji: '🌳',
        description: 'Connect with nature and relax',
        filters: {
          categories: ['parks-nature', 'wellness-relaxation'],
          accessibility: ['wheelchair-accessible']
        },
        priority: currentWeather?.condition === 'sunny' ? 90 : 70, // Higher priority in good weather
        context: ['nature', 'outdoor', 'wellness']
      },
      {
        id: 'budget-explorer',
        name: 'Budget Explorer',
        emoji: '💰',
        description: 'Amazing experiences that won\'t break the bank',
        filters: {
          free_entry: true,
          price_range: ['free', 'budget'],
          categories: ['culture-history', 'parks-nature']
        },
        priority: 85,
        context: ['budget', 'free', 'popular']
      },
      {
        id: 'night-life',
        name: 'Night Life',
        emoji: '🌙',
        description: 'Experience the vibrant nightlife',
        filters: {
          open_24hrs: true,
          categories: ['nightlife-bars', 'restaurants-dining'],
          audience_range: ['adults']
        },
        priority: (hour >= 18 || hour <= 6) ? 95 : 60, // Higher priority during evening/night
        context: ['nightlife', 'adult', 'evening']
      }
    ];

    // Add weather-based suggestions
    if (currentWeather?.condition === 'rainy') {
      baseCombo.push({
        id: 'indoor-activities',
        name: 'Indoor Fun',
        emoji: '🏢',
        description: 'Great indoor activities for rainy weather',
        filters: {
          categories: ['culture-history', 'shopping-markets', 'arts-live-entertainment']
        },
        priority: 95,
        context: ['weather', 'indoor', 'rainy']
      });
    }

    // Add contextual suggestions based on user behavior
    if (contextualData?.userBehaviorPattern === 'local') {
      baseCombo.push({
        id: 'local-gems',
        name: 'Local Gems',
        emoji: '💎',
        description: 'Hidden treasures locals love',
        filters: {
          categories: ['restaurants-dining', 'shopping-markets'],
          free_entry: false
        },
        priority: 85,
        context: ['local', 'hidden', 'personalized']
      });
    }
    
    // Sort by priority and return
    return baseCombo.sort((a, b) => b.priority - a.priority);
  }, [currentWeather, contextualData]);

  // Restore previous session filter
  const restoreSessionFilter = useCallback((): FilterState | null => {
    try {
      const savedSession = localStorage.getItem(FILTER_SESSION_KEY);
      if (!savedSession) return null;

      const sessionData = JSON.parse(savedSession);
      const now = Date.now();
      const sessionAge = now - sessionData.timestamp;
      
      // Only restore if session is less than 2 hours old
      if (sessionAge > 2 * 60 * 60 * 1000) {
        localStorage.removeItem(FILTER_SESSION_KEY);
        return null;
      }

      return sessionData.filter;
    } catch (error) {
      console.error('Error restoring session filter:', error);
      return null;
    }
  }, []);

  // Get filter suggestions from history
  const getFilterHistorySuggestions = useCallback((): FilterSuggestion[] => {
    const suggestions: FilterSuggestion[] = [];
    
    // Get most recent 5 unique filters from history
    const recentFilters = filterHistory.slice(0, 5);
    
    recentFilters.forEach((historyFilter, index) => {
      // Skip if this is just search text or basic filters
      const isComplex = (
        (historyFilter.categories?.length || 0) > 0 ||
        (historyFilter.price_range?.length || 0) > 0 ||
        historyFilter.family_friendly ||
        historyFilter.free_entry ||
        historyFilter.accessibility?.length
      );

      if (isComplex) {
        // Generate a descriptive name based on filter content
        let name = 'Recent Filter';
        if (historyFilter.categories?.length) {
          const mainCategory = historyFilter.categories[0].replace('-', ' & ');
          name = `${mainCategory.charAt(0).toUpperCase() + mainCategory.slice(1)}`;
        }
        if (historyFilter.family_friendly) name += ' (Family)';
        if (historyFilter.free_entry) name += ' (Free)';

        suggestions.push({
          id: `history-${index}`,
          name,
          emoji: '🕒',
          description: `Recent filter #${index + 1}`,
          filters: historyFilter,
          priority: 70 - index * 5, // Decrease priority for older filters
          context: ['history', 'recent'],
          autoApply: false
        });
      }
    });

    return suggestions;
  }, [filterHistory]);

  // Smart session restoration with user preferences
  const getSmartSessionRestore = useCallback((): {
    shouldRestore: boolean;
    restoredFilter: FilterState | null;
    restoreReason: string;
  } => {
    const sessionFilter = restoreSessionFilter();
    
    if (!sessionFilter) {
      return {
        shouldRestore: false,
        restoredFilter: null,
        restoreReason: 'No recent session found'
      };
    }

    // Check if the session filter has meaningful content
    const hasContent = (
      sessionFilter.searchText ||
      (sessionFilter.categories?.length || 0) > 0 ||
      (sessionFilter.price_range?.length || 0) > 0 ||
      sessionFilter.family_friendly ||
      sessionFilter.free_entry ||
      (sessionFilter.distanceSearch?.radius && sessionFilter.distanceSearch.radius !== "0")
    );

    if (!hasContent) {
      return {
        shouldRestore: false,
        restoredFilter: null,
        restoreReason: 'Session had no meaningful filters'
      };
    }

    return {
      shouldRestore: true,
      restoredFilter: sessionFilter,
      restoreReason: 'Restored your previous search session'
    };
  }, [restoreSessionFilter]);

  const clearAllPreferences = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      localStorage.removeItem(FILTER_HISTORY_KEY);
      localStorage.removeItem(FILTER_SESSION_KEY);
      localStorage.removeItem(CONTEXTUAL_DATA_KEY);
      setUserPreferences({});
      setRecentSearches([]);
      setFilterHistory([]);
      setContextualData(null);
    } catch (error) {
      console.error('Error clearing preferences:', error);
    }
  }, []);

  const getPersonalizedSuggestions = useCallback((): FilterSuggestion[] => {
    const suggestions: FilterSuggestion[] = [];
    
    // If user frequently selects family_friendly
    if (userPreferences.family_friendly) {
      suggestions.push({
        id: 'personalized-family',
        name: 'More Family Fun',
        emoji: '👨‍👩‍👧‍👦',
        description: 'Based on your family-friendly preferences',
        filters: {
          family_friendly: true,
          categories: ['amusement-theme-parks', 'educational-interactive'],
          price_range: ['budget', 'moderate']
        },
        priority: 90,
        context: ['personalized', 'family', 'preference']
      });
    }
    
    // If user has preferred categories
    if (userPreferences.categories && userPreferences.categories.length > 0) {
      const topCategory = userPreferences.categories[0];
      const categoryEmojis: { [key: string]: string } = {
        'culture-history': '🏛️',
        'parks-nature': '🌳',
        'restaurants-dining': '🍽️',
        'nightlife-bars': '🍻',
        'shopping-markets': '🛒',
        'arts-live-entertainment': '🎭',
        'sports-recreation': '⚽',
        'wellness-relaxation': '🧘'
      };
      
      suggestions.push({
        id: `personalized-${topCategory}`,
        name: `More ${topCategory.replace('-', ' & ')}`,
        emoji: categoryEmojis[topCategory] || '⭐',
        description: `You seem to enjoy ${topCategory.replace('-', ' & ')} attractions`,
        filters: {
          categories: [topCategory, ...(userPreferences.categories?.slice(1, 3) || [])],
          price_range: userPreferences.price_range || ['budget', 'moderate']
        },
        priority: 85,
        context: ['personalized', 'category', 'preference']
      });
    }
    
    // If user prefers budget options
    if (userPreferences.free_entry || userPreferences.price_range?.includes('free')) {
      suggestions.push({
        id: 'personalized-budget',
        name: 'Budget Picks',
        emoji: '💰',
        description: 'Free and budget-friendly options for you',
        filters: {
          free_entry: true,
          price_range: ['free', 'budget']
        },
        priority: 80,
        context: ['personalized', 'budget', 'preference']
      });
    }
    
    return suggestions.slice(0, 3); // Limit to 3 personalized suggestions
  }, [userPreferences]);

  const applySmartDefaults = useCallback((currentFilter: FilterState): FilterState => {
    const smartDefaults = getSmartDefaults();
    const enhancedFilter = { ...currentFilter };

    // Apply contextual suggestions with priority order
    const applyIfEmpty = (field: keyof FilterState, suggestions: Partial<FilterState>) => {
      if (field === 'categories' && (!enhancedFilter.categories || enhancedFilter.categories.length === 0)) {
        if (suggestions.categories) enhancedFilter.categories = suggestions.categories;
      } else if (field === 'price_range' && (!enhancedFilter.price_range || enhancedFilter.price_range.length === 0)) {
        if (suggestions.price_range) enhancedFilter.price_range = suggestions.price_range;
      } else if (enhancedFilter[field] === null || enhancedFilter[field] === undefined) {
        if (suggestions[field] !== undefined) {
          (enhancedFilter as any)[field] = suggestions[field];
        }
      }
    };

    // Priority order: Weather > Time > User Preferences > Seasonal > Weekend
    if (smartDefaults.weatherBasedSuggestions) {
      Object.keys(smartDefaults.weatherBasedSuggestions).forEach(key => {
        applyIfEmpty(key as keyof FilterState, smartDefaults.weatherBasedSuggestions);
      });
    }

    if (smartDefaults.timeBasedSuggestions) {
      Object.keys(smartDefaults.timeBasedSuggestions).forEach(key => {
        applyIfEmpty(key as keyof FilterState, smartDefaults.timeBasedSuggestions);
      });
    }

    // Apply user preferences with intelligence
    if (contextualData && userPreferences) {
      // Apply preferences based on user behavior pattern
      if (contextualData.userBehaviorPattern === 'local' && userPreferences.categories) {
        // Locals might prefer variety, so don't always apply same categories
        if (Math.random() > 0.7) {
          applyIfEmpty('categories', userPreferences);
        }
      } else {
        // Regular application for tourists/explorers
        Object.keys(userPreferences).forEach(key => {
          applyIfEmpty(key as keyof FilterState, userPreferences);
        });
      }
      
      // Apply contextual intelligence
      if (contextualData.budgetTier === 'budget' && !enhancedFilter.free_entry) {
        enhancedFilter.free_entry = true;
        if (!enhancedFilter.price_range?.length) {
          enhancedFilter.price_range = ['free', 'budget'];
        }
      }
      
      if (contextualData.groupType === 'family' && enhancedFilter.family_friendly === null) {
        enhancedFilter.family_friendly = true;
      }
    }

    // Apply seasonal and weekend suggestions
    if (smartDefaults.seasonalSuggestions) {
      Object.keys(smartDefaults.seasonalSuggestions).forEach(key => {
        applyIfEmpty(key as keyof FilterState, smartDefaults.seasonalSuggestions);
      });
    }

    if (smartDefaults.weekdayBasedSuggestions) {
      Object.keys(smartDefaults.weekdayBasedSuggestions).forEach(key => {
        applyIfEmpty(key as keyof FilterState, smartDefaults.weekdayBasedSuggestions);
      });
    }

    return enhancedFilter;
  }, [getSmartDefaults, userPreferences, contextualData]);

  // Advanced contextual suggestions
  const getContextualSuggestions = useCallback((searchQuery?: string) => {
    const suggestions: FilterSuggestion[] = [];
    
    // Voice command interpretation
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      
      if (query.includes('free') || query.includes('budget')) {
        suggestions.push({
          id: 'voice-budget',
          name: 'Budget Options',
          emoji: '💰',
          description: 'Based on your search for budget options',
          filters: { free_entry: true, price_range: ['free', 'budget'] },
          priority: 95,
          context: ['voice', 'budget']
        });
      }
      
      if (query.includes('family') || query.includes('kids') || query.includes('children')) {
        suggestions.push({
          id: 'voice-family',
          name: 'Family Friendly',
          emoji: '👨‍👩‍👧‍👦',
          description: 'Perfect for families with children',
          filters: { family_friendly: true, categories: ['amusement-theme-parks', 'educational-interactive'] },
          priority: 95,
          context: ['voice', 'family']
        });
      }
      
      if (query.includes('outdoor') || query.includes('nature') || query.includes('park')) {
        suggestions.push({
          id: 'voice-outdoor',
          name: 'Outdoor Activities',
          emoji: '🌳',
          description: 'Great outdoor experiences',
          filters: { categories: ['parks-nature', 'sports-recreation'] },
          priority: 90,
          context: ['voice', 'outdoor']
        });
      }
    }
    
    return suggestions;
  }, []);

  return {
    // Enhanced State
    userPreferences: userPreferences as UserPreferences,
    recentSearches,
    filterHistory,
    contextualData: {
      nearbyAttractions: contextualData?.nearbyAttractions || [],
      weatherInfo: currentWeather,
      localEvents: contextualData?.localEvents || [],
      trendingCategories: contextualData?.trendingFilters || []
    } as ContextualData,
    currentWeather,
    filterAnalytics,

    // Actions
    saveFilterPreferences,
    addToRecentSearches,
    clearAllPreferences,
    applySmartDefaults,

    // Enhanced Smart suggestions
    getSmartDefaults,
    getPopularFilters,
    getSuggestedFilterCombinations,
    getPersonalizedSuggestions,
    getContextualSuggestions,
    
    // Session persistence
    restoreSessionFilter,
    getSmartSessionRestore,
    getFilterHistorySuggestions,
    
    // Contextual intelligence
    updateContextualIntelligence,
    fetchWeatherData
  };
}

// Export types for use in other components
export type { FilterSuggestion, WeatherCondition, ContextualIntelligence };