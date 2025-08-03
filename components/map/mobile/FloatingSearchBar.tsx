"use client";

import { useState, useEffect, useRef } from 'react';
import { Input, Button, Popover, PopoverTrigger, PopoverContent, Chip } from '@heroui/react';
import { MagnifyingGlassIcon, MicrophoneIcon, SparklesIcon } from '@heroicons/react/24/outline';
import QuickFilters from '../responsive/QuickFilters';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
import { useAdvancedSearch } from '../hooks/useAdvancedSearch';

interface FloatingSearchBarProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  className?: string;
  // Quick filters props
  onApplyFilterCombination?: (filters: any) => void;
  currentFilter?: any;
  recentSearches?: string[];
  onRecentSearchSelect?: (search: string) => void;
  showQuickFilters?: boolean;
  // Voice search props
  onVoiceSearchResult?: (result: { searchText: string; filters?: any }) => void;
  enableVoiceSearch?: boolean;
}

export default function FloatingSearchBar({
  searchText,
  onSearchChange,
  onSearch,
  placeholder = "Search locations...",
  className = "",
  onApplyFilterCombination,
  currentFilter,
  recentSearches = [],
  onRecentSearchSelect,
  showQuickFilters = true,
  onVoiceSearchResult,
  enableVoiceSearch = false
}: FloatingSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Voice search integration
  const {
    isListening,
    transcript,
    confidence,
    toggleListening,
    processVoiceCommand,
    isSupported,
    error
  } = useVoiceSearch();

  // Advanced search parsing
  const {
    parseAdvancedQuery,
    getSearchSuggestions,
    getExampleQueries
  } = useAdvancedSearch();

  // Update search suggestions as user types
  useEffect(() => {
    if (searchText.length > 2) {
      const suggestions = getSearchSuggestions(searchText);
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0 && isFocused);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchText, isFocused, getSearchSuggestions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdvancedSearch();
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleAdvancedSearch = () => {
    if (searchText.trim()) {
      const parsed = parseAdvancedQuery(searchText);
      
      // If advanced parsing found filters, apply them first
      if (Object.keys(parsed.inferredFilters).length > 0 && onApplyFilterCombination) {
        onApplyFilterCombination(parsed.inferredFilters);
      }
      
      // Update search text to parsed version if different, then search
      if (parsed.searchText !== searchText) {
        onSearchChange(parsed.searchText);
        // Defer search to next tick to allow state update
        setTimeout(() => onSearch(), 10);
        return;
      }
    }
    
    onSearch();
  };

  const handleSuggestionSelect = (suggestion: string) => {
    onSearchChange(suggestion);
    setShowSuggestions(false);
    setTimeout(() => handleAdvancedSearch(), 100);
  };

  // Handle voice search completion
  const handleVoiceSearch = () => {
    if (transcript && onVoiceSearchResult) {
      const result = processVoiceCommand(transcript);
      onVoiceSearchResult({
        searchText: result.searchText,
        filters: result.filters
      });
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className={`
        relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border-2 
        transition-all duration-200 ease-out
        ${isFocused ? 'border-blue-500 shadow-2xl transform scale-[1.02]' : 'border-gray-200'}
      `}>
        <div className="flex items-center">
          {/* Search Icon */}
          <div className="pl-4 pr-2">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-500" />
          </div>

          {/* Search Input with Advanced Search Support */}
          <Popover 
            isOpen={showSuggestions} 
            onOpenChange={setShowSuggestions}
            placement="bottom-start"
            classNames={{
              content: "p-0 border-0 bg-white shadow-xl rounded-xl overflow-hidden max-w-sm"
            }}
          >
            <PopoverTrigger>
              <Input
                ref={inputRef}
                value={searchText}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                placeholder={placeholder}
                variant="flat"
                classNames={{
                  base: "flex-1",
                  inputWrapper: "bg-transparent shadow-none border-none h-14 touch-manipulation",
                  input: "text-base placeholder:text-gray-500 focus:outline-none"
                }}
                radius="none"
              />
            </PopoverTrigger>
            <PopoverContent>
              <div className="w-full max-w-sm">
                {/* Search suggestions */}
                {searchSuggestions.length > 0 && (
                  <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <SparklesIcon className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">Smart Suggestions</span>
                    </div>
                    <div className="space-y-1">
                      {searchSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => handleSuggestionSelect(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Advanced search examples */}
                <div className="p-3">
                  <div className="text-xs font-medium text-gray-500 mb-2">Try advanced search:</div>
                  <div className="flex flex-wrap gap-1">
                    {['price:free', 'near:center', 'category:museums'].map((example) => (
                      <Chip
                        key={example}
                        size="sm"
                        variant="flat"
                        className="cursor-pointer text-xs"
                        onClick={() => handleSuggestionSelect(example)}
                      >
                        {example}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Enhanced Voice Search Button with better touch target */}
          {enableVoiceSearch && isSupported && (
            <Button
              isIconOnly
              variant="light"
              className={`mr-2 w-12 h-12 min-w-12 transition-all duration-200 touch-manipulation active:scale-95 ${
                isListening 
                  ? 'bg-red-100 text-red-600 shadow-md' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
              onPress={() => {
                if (!isListening) {
                  toggleListening();
                } else {
                  toggleListening();
                  handleVoiceSearch();
                }
              }}
              aria-label={isListening ? "Stop voice search" : "Start voice search"}
            >
              <MicrophoneIcon className={`w-6 h-6 ${
                isListening ? 'animate-pulse' : ''
              }`} />
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced Voice Search Feedback with better mobile UX */}
      {enableVoiceSearch && (isListening || transcript || error) && (
        <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
          {isListening && (
            <div className="flex items-center gap-3 text-blue-700">
              <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 bg-red-400 rounded-full animate-ping" />
              </div>
              <span className="text-sm font-medium">Listening...</span>
            </div>
          )}
          {transcript && !isListening && (
            <div className="text-sm text-gray-700 space-y-1">
              <div>
                <span className="font-medium text-blue-700">Heard:</span> 
                <span className="ml-2 italic">"{transcript}"</span>
              </div>
              {confidence > 0 && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full" />
                  <span>Confidence: {Math.round(confidence * 100)}%</span>
                </div>
              )}
            </div>
          )}
          {error && (
            <div className="text-sm text-red-600 flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <div>
                <span className="font-medium">Voice Error:</span>
                <span className="ml-1">{error}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Filter Chips */}
      {showQuickFilters && onApplyFilterCombination && (
        <div className="mt-3">
          <QuickFilters
            onApplyFilterCombination={onApplyFilterCombination}
            currentFilter={currentFilter}
            recentSearches={recentSearches}
            onRecentSearchSelect={onRecentSearchSelect || (() => {})}
          />
        </div>
      )}
    </div>
  );
}

// Voice search tips component for first-time users
export function VoiceSearchTips() {
  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
      <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
        🎤 Voice Search Tips
      </h3>
      <div className="space-y-1 text-xs text-gray-600">
        <div>• "Show me free museums nearby"</div>
        <div>• "Find family restaurants open now"</div>
        <div>• "Outdoor activities in Old Town"</div>
        <div>• "Budget attractions"</div>
      </div>
    </div>
  );
}