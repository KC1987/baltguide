"use client";

import { useState, useEffect } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@heroui/react";

import { useTranslation, localeNames, type Locale } from "@/lib/i18n";

export default function LanguageSelector() {
  const { locale, changeLocale } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLocaleChange = (key: string) => {
    changeLocale(key as Locale);
  };

  if (!mounted) return null;

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          className="capitalize"
          endContent={
            <svg
              className="w-4 h-4"
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
          }
          startContent={
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          }
          variant="bordered"
        >
          {localeNames[locale]}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Language selection"
        selectedKeys={[locale]}
        selectionMode="single"
        onSelectionChange={(keys) => {
          const selectedKey = Array.from(keys)[0] as string;

          handleLocaleChange(selectedKey);
        }}
      >
        {Object.entries(localeNames).map(([code, name]) => (
          <DropdownItem key={code}>{name}</DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
