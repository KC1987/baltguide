"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/router";

import { loadTranslations, type Locale, type Translations } from "@/lib/i18n";

interface TranslationContextType {
  translations: Translations | null;
  locale: Locale;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType>({
  translations: null,
  locale: "en",
  isLoading: true,
});

export const useTranslationContext = () => {
  const context = useContext(TranslationContext);

  if (!context) {
    throw new Error(
      "useTranslationContext must be used within a TranslationProvider",
    );
  }

  return context;
};

interface TranslationProviderProps {
  children: ReactNode;
  initialTranslations?: Translations;
  initialLocale?: Locale;
}

export function TranslationProvider({
  children,
  initialTranslations,
  initialLocale,
}: TranslationProviderProps) {
  const router = useRouter();
  const [translations, setTranslations] = useState<Translations | null>(
    initialTranslations || null,
  );
  const [isLoading, setIsLoading] = useState(!initialTranslations);
  const locale = (router.locale || initialLocale || "en") as Locale;

  useEffect(() => {
    if (!translations || router.locale !== initialLocale) {
      setIsLoading(true);
      loadTranslations(locale)
        .then((loadedTranslations) => {
          setTranslations(loadedTranslations);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Failed to load translations:", error);
          setIsLoading(false);
        });
    }
  }, [locale, translations, router.locale, initialLocale]);

  return (
    <TranslationContext.Provider
      value={{
        translations,
        locale,
        isLoading,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}
