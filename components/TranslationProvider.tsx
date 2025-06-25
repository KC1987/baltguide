"use client";

import { useEffect, ReactNode } from "react";

import { loadTranslations, type Locale } from "@/lib/i18n";

interface TranslationProviderProps {
  children: ReactNode;
  locale?: Locale;
}

export default function TranslationProvider({
  children,
  locale = "en",
}: TranslationProviderProps) {
  useEffect(() => {
    loadTranslations(locale).catch((error) => {
      console.error("Failed to load translations:", error);
    });
  }, [locale]);

  return <>{children}</>;
}
