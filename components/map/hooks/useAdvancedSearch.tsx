"use client";

import { useCallback } from 'react';

interface SearchToken {
  type: 'text' | 'category' | 'filter' | 'location' | 'price' | 'rating' | 'operator';
  value: string;
  original: string;
  confidence: number;
}

interface ParsedQuery {
  searchText: string;
  inferredFilters: any;
  suggestions: string[];
  confidence: number;
  tokens: SearchToken[];
}

interface SearchOperator {
  pattern: RegExp;
  type: string;
  parser: (match: RegExpMatchArray, query: string) => {
    filters: any;
    searchText: string;
    confidence: number;
  };
  examples: string[];
}

export function useAdvancedSearch() {
  
  // Define category mappings for natural language
  const categoryMappings = {
    // Culture & History
    'museum': 'culture-history',
    'museums': 'culture-history', 
    'church': 'culture-history',
    'churches': 'culture-history',
    'castle': 'culture-history',
    'castles': 'culture-history',
    'history': 'culture-history',
    'historical': 'culture-history',
    'culture': 'culture-history',
    'cultural': 'culture-history',
    'monument': 'culture-history',
    'monuments': 'culture-history',
    'heritage': 'culture-history',
    
    // Parks & Nature
    'park': 'parks-nature',
    'parks': 'parks-nature',
    'nature': 'parks-nature',
    'garden': 'parks-nature',
    'gardens': 'parks-nature',
    'forest': 'parks-nature',
    'beach': 'parks-nature',
    'beaches': 'parks-nature',
    'lake': 'parks-nature',
    'lakes': 'parks-nature',
    'outdoor': 'parks-nature',
    'hiking': 'parks-nature',
    'trail': 'parks-nature',
    'trails': 'parks-nature',
    
    // Restaurants & Dining
    'restaurant': 'restaurants-dining',
    'restaurants': 'restaurants-dining',
    'food': 'restaurants-dining',
    'dining': 'restaurants-dining',
    'cafe': 'restaurants-dining',
    'cafes': 'restaurants-dining',
    'bar': 'nightlife-bars',
    'bars': 'nightlife-bars',
    'pub': 'nightlife-bars',
    'pubs': 'nightlife-bars',
    'nightlife': 'nightlife-bars',
    
    // Shopping
    'shop': 'shopping-markets',
    'shopping': 'shopping-markets',
    'market': 'shopping-markets',
    'markets': 'shopping-markets',
    'mall': 'shopping-markets',
    'store': 'shopping-markets',
    'stores': 'shopping-markets',
    
    // Entertainment
    'theater': 'arts-live-entertainment',
    'theatre': 'arts-live-entertainment',
    'concert': 'arts-live-entertainment',
    'show': 'arts-live-entertainment',
    'art': 'arts-live-entertainment',
    'gallery': 'arts-live-entertainment',
    'galleries': 'arts-live-entertainment',
    
    // Sports & Recreation
    'sport': 'sports-recreation',
    'sports': 'sports-recreation',
    'gym': 'sports-recreation',
    'fitness': 'sports-recreation',
    'pool': 'sports-recreation',
    'swimming': 'sports-recreation',
    'tennis': 'sports-recreation',
    'golf': 'sports-recreation',
    
    // Family & Kids
    'playground': 'amusement-theme-parks',
    'zoo': 'amusement-theme-parks',
    'aquarium': 'amusement-theme-parks',
    'kids': 'amusement-theme-parks',
    'children': 'amusement-theme-parks',
    'family': 'amusement-theme-parks',
    
    // Education
    'library': 'educational-interactive',
    'university': 'educational-interactive',
    'school': 'educational-interactive',
    'science': 'educational-interactive',
    'educational': 'educational-interactive',
    
    // Wellness
    'spa': 'wellness-relaxation',
    'massage': 'wellness-relaxation',
    'wellness': 'wellness-relaxation',
    'meditation': 'wellness-relaxation',
    'yoga': 'wellness-relaxation'
  };

  // Price-related terms
  const priceTerms = {
    'free': ['free', 'gratis', 'no cost', 'complimentary', 'no charge'],
    'budget': ['cheap', 'budget', 'affordable', 'inexpensive', 'low cost', 'under 10'],
    'moderate': ['moderate', 'mid-range', 'reasonable', '10-25', 'average price'],
    'expensive': ['expensive', 'pricey', 'high-end', '25-50', 'costly'],
    'luxury': ['luxury', 'premium', 'exclusive', 'upscale', 'over 50', 'top-tier']
  };

  // Location indicators
  const locationTerms = {
    'old town': 'old town',
    'oldtown': 'old town',
    'center': 'center',
    'centre': 'center', 
    'downtown': 'center',
    'city center': 'center',
    'near me': 'nearby',
    'nearby': 'nearby',
    'close': 'nearby',
    'around here': 'nearby'
  };

  // Filter terms
  const filterTerms = {
    'family friendly': 'family_friendly',
    'family-friendly': 'family_friendly',
    'kid friendly': 'family_friendly',
    'kids': 'family_friendly',
    'children': 'family_friendly',
    'open now': 'open_24hrs',
    '24/7': 'open_24hrs',
    '24 hours': 'open_24hrs',
    'open late': 'open_24hrs',
    'pet friendly': 'petfriendly',
    'pet-friendly': 'petfriendly',
    'dogs allowed': 'petfriendly',
    'pets ok': 'petfriendly',
    'wheelchair accessible': 'accessibility',
    'accessible': 'accessibility',
    'disabled access': 'accessibility',
    'souvenirs': 'souvenirs',
    'gift shop': 'souvenirs',
    'parking': 'parking',
    'wifi': 'wifi',
    'internet': 'wifi'
  };

  // Advanced search operators
  const searchOperators: SearchOperator[] = [
    {
      pattern: /category:(\w+[-\w]*)/gi,
      type: 'category_filter',
      parser: (match) => ({
        filters: { categories: [match[1]] },
        searchText: '',
        confidence: 0.95
      }),
      examples: ['category:museums', 'category:parks-nature']
    },
    {
      pattern: /price:(free|budget|moderate|expensive|luxury)/gi,
      type: 'price_filter',
      parser: (match) => ({
        filters: { price_range: [match[1]] },
        searchText: '',
        confidence: 0.9
      }),
      examples: ['price:free', 'price:budget']
    },
    {
      pattern: /rating:([1-5])(\+?)/gi,
      type: 'rating_filter',
      parser: (match) => ({
        filters: { rating: parseInt(match[1]) },
        searchText: '',
        confidence: 0.85
      }),
      examples: ['rating:4+', 'rating:5']
    },
    {
      pattern: /near:([^,]+)(?:,\s*(\d+(?:\.\d+)?)(?:km|mi)?)?/gi,
      type: 'location_filter',
      parser: (match) => {
        const filters: any = { searchText: `near ${match[1]}` };
        if (match[2]) {
          const radius = parseFloat(match[2]);
          filters.distanceSearch = { radius: radius.toString() };
        }
        return {
          filters,
          searchText: '',
          confidence: 0.8
        };
      },
      examples: ['near:Old Town', 'near:Riga,5km']
    },
    {
      pattern: /within:(\d+(?:\.\d+)?)(km|mi)/gi,
      type: 'radius_filter',
      parser: (match) => {
        const radius = parseFloat(match[1]);
        const unit = match[2];
        const kmRadius = unit === 'mi' ? radius * 1.60934 : radius;
        return {
          filters: { distanceSearch: { radius: kmRadius.toString() } },
          searchText: '',
          confidence: 0.85
        };
      },
      examples: ['within:5km', 'within:3mi']
    },
    {
      pattern: /"([^"]+)"/g,
      type: 'exact_phrase',
      parser: (match) => ({
        filters: { searchText: match[1] },
        searchText: match[1],
        confidence: 0.9
      }),
      examples: ['"Old Town Square"', '"National Museum"']
    },
    {
      pattern: /OR\s+/gi,
      type: 'or_operator',
      parser: () => ({
        filters: {},
        searchText: '',
        confidence: 0.7
      }),
      examples: ['museums OR galleries', 'parks OR nature']
    },
    {
      pattern: /AND\s+/gi,
      type: 'and_operator', 
      parser: () => ({
        filters: {},
        searchText: '',
        confidence: 0.7
      }),
      examples: ['restaurants AND open now', 'parks AND family']  
    },
    {
      pattern: /NOT\s+(\w+)/gi,
      type: 'not_operator',
      parser: (match) => ({
        filters: { excludeKeywords: [match[1]] },
        searchText: '',
        confidence: 0.6
      }),
      examples: ['museums NOT modern', 'restaurants NOT expensive']
    }
  ];

  // Tokenize search query
  const tokenizeQuery = useCallback((query: string): SearchToken[] => {
    const tokens: SearchToken[] = [];
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    
    for (let i = 0; i < words.length; i++) {
      // Safety check to prevent infinite loops
      if (i >= words.length) break;
      
      const word = words[i];
      const phrase2 = words.slice(i, i + 2).join(' ');
      const phrase3 = words.slice(i, i + 3).join(' '); 
      
      // Check for categories (prioritize longer phrases)
      if (categoryMappings[phrase3]) {
        tokens.push({
          type: 'category',
          value: categoryMappings[phrase3],
          original: phrase3,
          confidence: 0.9
        });
        i += 2; // Skip next 2 words
        continue;
      }
      
      if (categoryMappings[phrase2]) {
        tokens.push({
          type: 'category',
          value: categoryMappings[phrase2],
          original: phrase2,
          confidence: 0.85
        });
        i += 1; // Skip next word
        continue;
      }
      
      if (categoryMappings[word]) {
        tokens.push({
          type: 'category',
          value: categoryMappings[word],
          original: word,
          confidence: 0.8
        });
        continue;
      }
      
      // Check for price terms
      let foundPriceterm = false;
      Object.entries(priceTerms).forEach(([priceKey, terms]) => {
        if (terms.some(term => phrase2.includes(term) || word === term)) {
          tokens.push({
            type: 'price',
            value: priceKey,
            original: word,
            confidence: 0.8
          });
          foundPriceterm = true;
        }
      });
      
      if (foundPriceterm) continue;
      
      // Check for location terms
      if (locationTerms[phrase2]) {
        tokens.push({
          type: 'location',
          value: locationTerms[phrase2],
          original: phrase2,
          confidence: 0.75
        });
        i += 1;
        continue;
      }
      
      if (locationTerms[word]) {
        tokens.push({
          type: 'location',
          value: locationTerms[word],
          original: word,
          confidence: 0.7
        });
        continue;
      }
      
      // Check for filter terms
      if (filterTerms[phrase2]) {
        tokens.push({
          type: 'filter',
          value: filterTerms[phrase2],
          original: phrase2,
          confidence: 0.8
        });
        i += 1;
        continue;
      }
      
      if (filterTerms[word]) {
        tokens.push({
          type: 'filter',
          value: filterTerms[word],
          original: word,
          confidence: 0.75
        });
        continue;
      }
      
      // Default to text token
      tokens.push({
        type: 'text',
        value: word,
        original: word,
        confidence: 0.5
      });
    }
    
    return tokens;
  }, []);

  // Parse advanced search query
  const parseAdvancedQuery = useCallback((query: string): ParsedQuery => {
    let processedQuery = query.trim();
    const inferredFilters: any = {
      categories: [],
      price_range: [],
      accessibility: [],
      parking: [],
      wifi: []
    };
    let searchText = query;
    let totalConfidence = 0;
    let operatorCount = 0;

    // Process search operators first
    searchOperators.forEach(operator => {
      // Create a new RegExp to avoid global flag issues
      const regex = new RegExp(operator.pattern.source, operator.pattern.flags);
      const matches = [...processedQuery.matchAll(regex)];
      matches.forEach(match => {
        const result = operator.parser(match, processedQuery);
        
        // Merge filters
        Object.entries(result.filters).forEach(([key, value]) => {
          if (Array.isArray(inferredFilters[key]) && Array.isArray(value)) {
            inferredFilters[key] = [...new Set([...inferredFilters[key], ...value])];
          } else if (Array.isArray(inferredFilters[key])) {
            inferredFilters[key] = [...new Set([...inferredFilters[key], value])];
          } else {
            inferredFilters[key] = value;
          }
        });
        
        totalConfidence += result.confidence;
        operatorCount++;
        
        // Remove operator from search text
        searchText = searchText.replace(match[0], '').trim();
      });
    });

    // Tokenize remaining query
    const tokens = tokenizeQuery(searchText);
    
    // Process tokens
    tokens.forEach(token => {
      switch (token.type) {
        case 'category':
          if (!inferredFilters.categories.includes(token.value)) {
            inferredFilters.categories.push(token.value);
          }
          totalConfidence += token.confidence;
          break;
          
        case 'price':
          if (!inferredFilters.price_range.includes(token.value)) {
            inferredFilters.price_range.push(token.value);
          }
          totalConfidence += token.confidence;
          break;
          
        case 'filter':
          inferredFilters[token.value] = true;
          totalConfidence += token.confidence;
          break;
          
        case 'location':
          if (token.value === 'nearby') {
            inferredFilters.useLocation = true;
          } else {
            inferredFilters.searchText = (inferredFilters.searchText || '') + ' ' + token.original;
          }
          totalConfidence += token.confidence;
          break;
          
        case 'text':
          // Keep as search text
          break;
      }
    });

    // Clean up search text - remove processed tokens
    const processedTokens = tokens.filter(t => t.type !== 'text');
    processedTokens.forEach(token => {
      searchText = searchText.replace(new RegExp(`\\b${token.original}\\b`, 'gi'), '').trim();
    });

    // Clean up empty arrays
    Object.keys(inferredFilters).forEach(key => {
      if (Array.isArray(inferredFilters[key]) && inferredFilters[key].length === 0) {
        delete inferredFilters[key];
      }
    });

    const averageConfidence = operatorCount + tokens.length > 0 
      ? totalConfidence / (operatorCount + tokens.length) 
      : 0;

    // Generate suggestions for improvement
    const suggestions: string[] = [];
    
    if (averageConfidence < 0.6) {
      suggestions.push('Try using more specific terms like "museums", "restaurants", or "parks"');
    }
    
    if (!inferredFilters.categories?.length && !searchText) {
      suggestions.push('Add a category like "category:museums" or search for specific places');
    }
    
    if (query.includes('free') && !inferredFilters.price_range?.includes('free')) {
      suggestions.push('Use "price:free" for more accurate free attraction filtering');
    }

    return {
      searchText: searchText.trim(),
      inferredFilters,
      suggestions,
      confidence: averageConfidence,
      tokens
    };
  }, [tokenizeQuery]);

  // Get search suggestions based on partial input
  const getSearchSuggestions = useCallback((partialQuery: string): string[] => {
    const suggestions: string[] = [];
    const lower = partialQuery.toLowerCase();
    
    // Category suggestions
    Object.keys(categoryMappings).forEach(term => {
      if (term.startsWith(lower) && term !== lower) {
        suggestions.push(term);
      }
    });
    
    // Operator suggestions
    if (lower.includes('near') && !lower.includes('near:')) {
      suggestions.push('near:Old Town', 'near:city center');
    }
    
    if (lower.includes('price') && !lower.includes('price:')) {
      suggestions.push('price:free', 'price:budget', 'price:moderate');
    }
    
    if (lower.includes('rating') && !lower.includes('rating:')) {
      suggestions.push('rating:4+', 'rating:5');
    }
    
    // Common searches
    const commonQueries = [
      'free museums',
      'family restaurants', 
      'parks near me',
      'nightlife open now',
      'budget attractions',
      'wheelchair accessible museums',
      'pet friendly parks'
    ];
    
    commonQueries.forEach(query => {
      if (query.includes(lower) && query !== lower) {
        suggestions.push(query);
      }
    });
    
    return suggestions.slice(0, 6);
  }, []);

  // Get example queries for help
  const getExampleQueries = useCallback(() => {
    return [
      // Basic searches
      'museums in Old Town',
      'free parks near me',
      'family restaurants',
      
      // Advanced operators
      'category:culture price:free',
      'near:Riga,5km rating:4+',
      '"National Museum" OR "Art Gallery"',
      
      // Natural language
      'wheelchair accessible museums',
      'pet friendly parks open now',
      'budget nightlife within:2km',
      
      // Complex queries
      'restaurants AND family NOT expensive',
      'outdoor activities OR sports near:center'
    ];
  }, []);

  return {
    parseAdvancedQuery,
    tokenizeQuery,
    getSearchSuggestions,
    getExampleQueries,
    searchOperators: searchOperators.map(op => ({
      type: op.type,
      examples: op.examples
    }))
  };
}

export type { SearchToken, ParsedQuery };