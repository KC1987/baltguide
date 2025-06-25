"use client";

import { useState, useEffect } from "react";

import { useTranslation, localeNames, type Locale } from "@/lib/i18n";

export default function LanguageSelector() {
  const { locale, changeLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    changeLocale(newLocale);
    setIsOpen(false);
  };

  if (!mounted) return null;

  return (
    <div className="relative">
      <button
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{localeNames[locale]}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M19 9l-7 7-7-7"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
            role="button"
            tabIndex={0}
          />
          <div className="absolute right-0 z-20 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg">
            <div className="py-1">
              {Object.entries(localeNames).map(([code, name]) => (
                <button
                  key={code}
                  className={`block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                    locale === code
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700"
                  }`}
                  onClick={() => handleLocaleChange(code as Locale)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
