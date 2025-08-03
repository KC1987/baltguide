"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSmartFilters, type FilterSuggestion } from './useSmartFilters';

interface VoiceSearchState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
}

interface VoiceCommand {
  pattern: RegExp;
  action: (matches: RegExpMatchArray) => {
    searchText: string;
    suggestions: FilterSuggestion[];
    filters?: any;
  };
  description: string;
}

export function useVoiceSearch() {
  const [voiceState, setVoiceState] = useState<VoiceSearchState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    confidence: 0,
    error: null
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { getContextualSuggestions } = useSmartFilters();

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setVoiceState(prev => ({ ...prev, isSupported: true }));
        
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US'; // TODO: Support multiple languages
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
          setVoiceState(prev => ({ ...prev, isListening: true, error: null }));
        };

        recognition.onresult = (event) => {
          const result = event.results[event.results.length - 1];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;
          
          setVoiceState(prev => ({
            ...prev,
            transcript,
            confidence,
            error: null
          }));
        };

        recognition.onerror = (event) => {
          let errorMessage = 'Voice recognition error';
          
          switch (event.error) {
            case 'no-speech':
              errorMessage = 'No speech detected. Please try again.';
              break;
            case 'audio-capture':
              errorMessage = 'Microphone not accessible. Please check permissions.';
              break;
            case 'not-allowed':
              errorMessage = 'Microphone access denied. Please enable microphone permissions.';
              break;
            case 'network':
              errorMessage = 'Network error. Please check your internet connection.';
              break;
            default:
              errorMessage = `Voice recognition error: ${event.error}`;
          }

          setVoiceState(prev => ({
            ...prev,
            isListening: false,
            error: errorMessage
          }));
        };

        recognition.onend = () => {
          setVoiceState(prev => ({ ...prev, isListening: false }));
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Start voice recognition
  const startListening = useCallback(() => {
    if (!recognitionRef.current || voiceState.isListening) return;

    try {
      recognitionRef.current.start();
      
      // Auto-stop after 10 seconds
      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, 10000);
    } catch (error) {
      setVoiceState(prev => ({
        ...prev,
        error: 'Failed to start voice recognition'
      }));
    }
  }, [voiceState.isListening]);

  // Stop voice recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current && voiceState.isListening) {
      recognitionRef.current.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [voiceState.isListening]);

  // Process voice commands and return search suggestions
  const processVoiceCommand = useCallback((transcript: string): {
    searchText: string;
    suggestions: FilterSuggestion[];
    filters?: any;
  } => {
    const text = transcript.toLowerCase().trim();
    
    // Get contextual suggestions based on voice input
    const suggestions = getContextualSuggestions(text);
    
    // Define voice command patterns
    const commands: VoiceCommand[] = [
      {
        pattern: /show me (.*) near (.*)/i,
        action: (matches) => {
          // e.g., "Show me restaurants near Old Town"
          return {
            searchText: `${matches[1]} near ${matches[2]}`,
            suggestions,
            filters: { searchText: `${matches[1]} ${matches[2]}` }
          };
        },
        description: 'Location-specific search'
      },
      {
        pattern: /find (free|budget|cheap) (.*)/i,
        action: (matches) => {
          return {
            searchText: matches[2],
            suggestions,
            filters: { 
              searchText: matches[2],
              free_entry: true,
              price_range: ['free', 'budget']
            }
          };
        },
        description: 'Budget-conscious search'
      },
      {
        pattern: /family friendly (.*)/i,
        action: (matches) => {
          return {
            searchText: matches[1],
            suggestions,
            filters: {
              searchText: matches[1],
              family_friendly: true,
              categories: ['amusement-theme-parks', 'educational-interactive', 'parks-nature']
            }
          };
        },
        description: 'Family-oriented search'
      },
      {
        pattern: /(.*) open now/i,
        action: (matches) => {
          return {
            searchText: matches[1],
            suggestions,
            filters: {
              searchText: matches[1],
              open_24hrs: true
            }
          };
        },
        description: 'Currently open venues'
      },
      {
        pattern: /outdoor (.*)|nature (.*)|park/i,
        action: (matches) => {
          const searchTerm = matches[1] || matches[2] || 'outdoor activities';
          return {
            searchText: searchTerm,
            suggestions,
            filters: {
              searchText: searchTerm,
              categories: ['parks-nature', 'sports-recreation']
            }
          };
        },
        description: 'Outdoor activities'
      },
      {
        pattern: /(museum|culture|history)/i,
        action: (matches) => {
          return {
            searchText: matches[0],
            suggestions,
            filters: {
              searchText: matches[0],
              categories: ['culture-history', 'educational-interactive']
            }
          };
        },
        description: 'Cultural attractions'
      }
    ];

    // Try to match voice commands
    for (const command of commands) {
      const match = text.match(command.pattern);
      if (match) {
        return command.action(match);
      }
    }

    // If no specific command found, return plain search
    return {
      searchText: transcript,
      suggestions,
      filters: { searchText: transcript }
    };
  }, [getContextualSuggestions]);

  // Toggle voice search
  const toggleListening = useCallback(() => {
    if (voiceState.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [voiceState.isListening, startListening, stopListening]);

  // Clear transcript and errors
  const clearVoiceState = useCallback(() => {
    setVoiceState(prev => ({
      ...prev,
      transcript: '',
      confidence: 0,
      error: null
    }));
  }, []);

  // Get supported languages (for future multi-language support)
  const getSupportedLanguages = useCallback(() => {
    // Baltic states + common tourist languages
    return [
      { code: 'en-US', name: 'English', flag: '🇺🇸' },
      { code: 'lv-LV', name: 'Latvian', flag: '🇱🇻' },
      { code: 'lt-LT', name: 'Lithuanian', flag: '🇱🇹' },
      { code: 'et-EE', name: 'Estonian', flag: '🇪🇪' },
      { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' },
      { code: 'de-DE', name: 'German', flag: '🇩🇪' },
      { code: 'fi-FI', name: 'Finnish', flag: '🇫🇮' },
      { code: 'sv-SE', name: 'Swedish', flag: '🇸🇪' }
    ];
  }, []);

  // Change recognition language
  const setLanguage = useCallback((langCode: string) => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = langCode;
    }
  }, []);

  return {
    // State
    ...voiceState,
    
    // Actions
    startListening,
    stopListening,
    toggleListening,
    clearVoiceState,
    processVoiceCommand,
    
    // Configuration
    setLanguage,
    getSupportedLanguages,
    
    // Utilities
    isActive: voiceState.isListening,
    hasTranscript: voiceState.transcript.length > 0,
    isHighConfidence: voiceState.confidence > 0.7
  };
}

// Extend the Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export type { VoiceSearchState, VoiceCommand };