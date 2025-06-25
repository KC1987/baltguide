import type { GetServerSidePropsContext } from "next";

import { loadTranslations, type Locale, type Translations } from "./i18n";

export async function getServerTranslations(
  context: GetServerSidePropsContext | { locale?: string },
): Promise<{ translations: Translations; locale: Locale }> {
  const locale = (context.locale || "en") as Locale;
  const translations = await loadTranslations(locale);

  return {
    translations,
    locale,
  };
}

export async function getStaticTranslations(
  locale?: string,
): Promise<{ translations: Translations; locale: Locale }> {
  const currentLocale = (locale || "en") as Locale;
  const translations = await loadTranslations(currentLocale);

  return {
    translations,
    locale: currentLocale,
  };
}
