"use client";

import { useCallback, useEffect, useState } from "react";

export type Locale = "en" | "lv" | "ru" | "de";

export const locales: Locale[] = ["en", "lv", "ru", "de"];

export const localeNames: Record<Locale, string> = {
  en: "English",
  lv: "Latviešu",
  ru: "Русский",
  de: "Deutsch",
};

// Type for nested translation keys
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

// Translation interface (extend this as you add more translation files)
export interface Translations {
  navigation: {
    home: string;
    map: string;
    locations: string;
    addAttraction: string;
  };
  common: {
    loading: string;
    error: string;
    search: string;
    filter: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    close: string;
  };
  map: {
    searchPlaceholder: string;
    noResults: string;
  };
  locations: {
    title: string;
    description: string;
  };
}

export type TranslationKey = NestedKeyOf<Translations>;

// Cache for loaded translations
const translationCache: Record<string, Translations> = {};

export async function loadTranslations(locale: Locale): Promise<Translations> {
  if (translationCache[locale]) {
    return translationCache[locale];
  }

  try {
    const common = await import(`../locales/${locale}/common.json`);

    const translations: Translations = {
      ...common.default,
    };

    translationCache[locale] = translations;

    return translations;
  } catch (error) {
    console.error(`Failed to load translations for locale: ${locale}`, error);
    // Fallback to English if locale loading fails
    if (locale !== "en") {
      return loadTranslations("en");
    }
    throw error;
  }
}

// Get nested property from object using dot notation
function getNestedProperty(obj: any, path: string): string {
  return path.split(".").reduce((current, key) => current?.[key], obj) || path;
}

// Simple locale state management for App Router
let currentLocale: Locale = 'en';

export function setCurrentLocale(locale: Locale) {
  currentLocale = locale;
  // Store in localStorage for persistence
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferred-locale', locale);
  }
}

export function getCurrentLocale(): Locale {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('preferred-locale') as Locale;
    if (stored && locales.includes(stored)) {
      currentLocale = stored;
      return stored;
    }
  }
  return currentLocale;
}

// Hook for App Router
export function useTranslation() {
  const [locale, setLocale] = useState<Locale>(() => getCurrentLocale());

  useEffect(() => {
    const handleStorageChange = () => {
      const newLocale = getCurrentLocale();
      setLocale(newLocale);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const t = useCallback(
    (key: TranslationKey, fallback?: string): string => {
      const translations = translationCache[locale];

      if (!translations) {
        return fallback || key;
      }

      return getNestedProperty(translations, key) || fallback || key;
    },
    [locale],
  );

  const changeLocale = useCallback((newLocale: Locale) => {
    setCurrentLocale(newLocale);
    setLocale(newLocale);
    // Force reload to apply new locale
    window.location.reload();
  }, []);

  // Load translations for current locale if not already loaded
  useEffect(() => {
    if (!translationCache[locale]) {
      loadTranslations(locale).catch((error) => {
        console.error("Failed to load translations:", error);
      });
    }
  }, [locale]);

  return {
    t,
    locale,
    locales,
    changeLocale,
  };
}
