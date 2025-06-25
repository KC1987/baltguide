# 🌍 Multilanguage System Manual for Baltguide

## Table of Contents
1. [System Overview](#system-overview)
2. [Adding New Languages](#adding-new-languages)
3. [Managing Translation Files](#managing-translation-files)
4. [Using Translations in Components](#using-translations-in-components)
5. [Adding New Pages with Translations](#adding-new-pages-with-translations)
6. [Best Practices](#best-practices)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

---

## System Overview

The Baltguide multilanguage system uses a **localStorage-based approach** compatible with Next.js App Router. It supports 4 languages by default:

- **English (en)** - Default language
- **Latvian (lv)** - Latviešu
- **Russian (ru)** - Русский  
- **German (de)** - Deutsch

### Key Files
```
lib/i18n.ts                    # Core translation system
locales/[lang]/common.json      # Translation files
components/LanguageSelector.tsx # Language switcher
components/TranslationProvider.tsx # Provider wrapper
```

---

## Adding New Languages

### Step 1: Update Language Configuration

Edit `lib/i18n.ts`:

```typescript
// Add your new language code
export type Locale = "en" | "lv" | "ru" | "de" | "es" | "fr";

export const locales: Locale[] = ["en", "lv", "ru", "de", "es", "fr"];

export const localeNames: Record<Locale, string> = {
  en: "English",
  lv: "Latviešu", 
  ru: "Русский",
  de: "Deutsch",
  es: "Español",    // New language
  fr: "Français",   // New language
};
```

### Step 2: Create Translation Files

Create directories and files for new languages:

```bash
mkdir -p locales/es locales/fr
touch locales/es/common.json locales/fr/common.json
```

### Step 3: Add Translations

**locales/es/common.json**:
```json
{
  "navigation": {
    "home": "Inicio",
    "map": "Mapa", 
    "locations": "Lugares",
    "addAttraction": "Añadir Atracción"
  },
  "common": {
    "loading": "Cargando...",
    "error": "Ocurrió un error",
    "search": "Buscar",
    "filter": "Filtro",
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "close": "Cerrar"
  },
  "map": {
    "searchPlaceholder": "Buscar lugares...",
    "noResults": "No se encontraron resultados"
  },
  "locations": {
    "title": "Explorar Lugares",
    "description": "Descubre lugares increíbles en la región del Báltico"
  }
}
```

---

## Managing Translation Files

### File Structure

Each language has its own directory under `locales/`:

```
locales/
├── en/
│   ├── common.json      # General UI translations
│   ├── navigation.json  # Navigation specific
│   └── forms.json       # Form labels and validation
├── lv/
│   ├── common.json
│   ├── navigation.json
│   └── forms.json
└── ru/
    ├── common.json
    ├── navigation.json
    └── forms.json
```

### Adding New Translation Categories

**Step 1: Create new translation file**

`locales/en/forms.json`:
```json
{
  "labels": {
    "name": "Name",
    "email": "Email",
    "description": "Description",
    "category": "Category"
  },
  "validation": {
    "required": "This field is required",
    "invalidEmail": "Please enter a valid email",
    "minLength": "Minimum {{count}} characters required"
  },
  "buttons": {
    "submit": "Submit",
    "reset": "Reset",
    "preview": "Preview"
  }
}
```

**Step 2: Update translation interface**

Edit `lib/i18n.ts`:
```typescript
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
    // ... existing fields
  };
  // Add new category
  forms: {
    labels: {
      name: string;
      email: string;
      description: string;
      category: string;
    };
    validation: {
      required: string;
      invalidEmail: string;
      minLength: string;
    };
    buttons: {
      submit: string;
      reset: string;
      preview: string;
    };
  };
}
```

**Step 3: Update loadTranslations function**

```typescript
export async function loadTranslations(locale: Locale): Promise<Translations> {
  if (translationCache[locale]) {
    return translationCache[locale];
  }

  try {
    const common = await import(`../locales/${locale}/common.json`);
    const forms = await import(`../locales/${locale}/forms.json`);
    
    const translations: Translations = {
      ...common.default,
      ...forms.default,
    };

    translationCache[locale] = translations;
    return translations;
  } catch (error) {
    console.error(`Failed to load translations for locale: ${locale}`, error);
    if (locale !== "en") {
      return loadTranslations("en");
    }
    throw error;
  }
}
```

---

## Using Translations in Components

### Basic Usage

```tsx
'use client';

import { useTranslation } from '@/lib/i18n';
import TranslationProvider from '@/components/TranslationProvider';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('locations.title')}</h1>
      <p>{t('locations.description')}</p>
      <button>{t('common.save')}</button>
    </div>
  );
}

// Always wrap components using translations
export default function Page() {
  return (
    <TranslationProvider>
      <MyComponent />
    </TranslationProvider>
  );
}
```

### With Fallback Text

```tsx
function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Fallback if translation key doesn't exist */}
      <h1>{t('locations.title', 'Default Title')}</h1>
      <p>{t('nonexistent.key', 'This text shows if key is missing')}</p>
    </div>
  );
}
```

### Dynamic Translations with Variables

**Translation file**:
```json
{
  "messages": {
    "welcome": "Welcome, {{name}}!",
    "itemCount": "You have {{count}} items"
  }
}
```

**Component** (you'll need to implement interpolation):
```tsx
function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => 
    String(values[key] || match)
  );
}

function MyComponent() {
  const { t } = useTranslation();
  const userName = "John";
  const itemCount = 5;

  return (
    <div>
      <h1>{interpolate(t('messages.welcome'), { name: userName })}</h1>
      <p>{interpolate(t('messages.itemCount'), { count: itemCount })}</p>
    </div>
  );
}
```

### Conditional Rendering Based on Language

```tsx
function MyComponent() {
  const { locale } = useTranslation();

  return (
    <div>
      {locale === 'ru' && (
        <div className="text-right">
          {/* Special layout for RTL languages */}
        </div>
      )}
      
      {locale === 'en' && (
        <div className="text-left">
          {/* Standard layout */}
        </div>
      )}
    </div>
  );
}
```

---

## Adding New Pages with Translations

### Step 1: Create Translation Keys

Add keys to all language files. Example for a new "About" page:

**locales/en/common.json**:
```json
{
  "about": {
    "title": "About Baltguide",
    "subtitle": "Your trusted guide to the Baltic region",
    "mission": "Our mission is to help travelers discover...",
    "team": {
      "title": "Our Team",
      "description": "Meet the people behind Baltguide"
    }
  }
}
```

### Step 2: Create the Page Component

**app/about/page.tsx**:
```tsx
'use client';

import { useTranslation } from '@/lib/i18n';
import TranslationProvider from '@/components/TranslationProvider';

function AboutContent() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">
        {t('about.title')}
      </h1>
      
      <h2 className="text-2xl text-gray-600 mb-8">
        {t('about.subtitle')}
      </h2>
      
      <div className="prose max-w-none">
        <p className="text-lg mb-6">
          {t('about.mission')}
        </p>
        
        <section>
          <h3 className="text-2xl font-semibold mb-4">
            {t('about.team.title')}
          </h3>
          <p>{t('about.team.description')}</p>
        </section>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <TranslationProvider>
      <AboutContent />
    </TranslationProvider>
  );
}
```

### Step 3: Update Navigation

Update navigation translations and site config:

**locales/en/common.json**:
```json
{
  "navigation": {
    "home": "Home",
    "map": "Map",
    "locations": "Locations", 
    "about": "About",
    "addAttraction": "Add Attraction"
  }
}
```

**config/site.ts**:
```typescript
export const siteConfig = {
  navItems: [
    { label: "Home", href: "/" },
    { label: "Map", href: "/map" },
    { label: "Locations", href: "/location" },
    { label: "About", href: "/about" }, // Add new page
    { label: "Add", href: "/add" },
  ],
  // ... rest of config
};
```

### Step 4: Update Navbar to Use Translations

**components/navbar.tsx**:
```tsx
// In the NavbarMain function, update the navigation rendering:
<ul className="hidden lg:flex gap-4 justify-start ml-2">
  <NavbarItem>
    <NextLink href="/" className={linkStyles({ color: "foreground" })}>
      {t('navigation.home')}
    </NextLink>
  </NavbarItem>
  <NavbarItem>
    <NextLink href="/map" className={linkStyles({ color: "foreground" })}>
      {t('navigation.map')}
    </NextLink>
  </NavbarItem>
  <NavbarItem>
    <NextLink href="/location" className={linkStyles({ color: "foreground" })}>
      {t('navigation.locations')}
    </NextLink>
  </NavbarItem>
  <NavbarItem>
    <NextLink href="/about" className={linkStyles({ color: "foreground" })}>
      {t('navigation.about')}
    </NextLink>
  </NavbarItem>
  <NavbarItem>
    <NextLink href="/add" className={linkStyles({ color: "foreground" })}>
      {t('navigation.addAttraction')}
    </NextLink>
  </NavbarItem>
</ul>
```

---

## Best Practices

### 1. Consistent Key Naming

Use descriptive, hierarchical keys:

```json
{
  "page": {
    "section": {
      "element": "Translation"
    }
  }
}
```

**Good Examples**:
- `user.profile.editButton`
- `forms.validation.emailRequired`
- `maps.filters.categorySelect`

**Bad Examples**:
- `btn1`, `text2`, `label`
- `userEditButtonText`

### 2. Organize by Feature/Page

```
locales/en/
├── common.json       # Shared across app
├── navigation.json   # All navigation items
├── forms.json        # Form labels, validation
├── maps.json         # Map-specific translations  
├── locations.json    # Location pages
└── auth.json         # Authentication pages
```

### 3. Always Provide Fallbacks

```tsx
// Always provide fallback text
const title = t('page.title', 'Default Page Title');

// For critical UI elements
const saveButton = t('common.save', 'Save');
```

### 4. Use Translation Provider Pattern

```tsx
// Every page component should follow this pattern
function PageContent() {
  const { t } = useTranslation();
  // ... component logic
}

export default function Page() {
  return (
    <TranslationProvider>
      <PageContent />
    </TranslationProvider>
  );
}
```

### 5. Type Safety

Always update the `Translations` interface when adding new keys:

```typescript
export interface Translations {
  // ... existing interfaces
  newSection: {
    title: string;
    description: string;
    actions: {
      submit: string;
      cancel: string;
    };
  };
}
```

---

## Common Patterns

### 1. Form with Translations

```tsx
'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import TranslationProvider from '@/components/TranslationProvider';

function ContactForm() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  return (
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium">
          {t('forms.labels.name')}
        </label>
        <input
          type="text"
          placeholder={t('forms.placeholders.enterName')}
          className="mt-1 block w-full border rounded-md px-3 py-2"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium">
          {t('forms.labels.email')}
        </label>
        <input
          type="email"
          placeholder={t('forms.placeholders.enterEmail')}
          className="mt-1 block w-full border rounded-md px-3 py-2"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium">
          {t('forms.labels.message')}
        </label>
        <textarea
          placeholder={t('forms.placeholders.enterMessage')}
          className="mt-1 block w-full border rounded-md px-3 py-2"
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({...formData, message: e.target.value})}
        />
      </div>
      
      <div className="flex space-x-2">
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {t('forms.buttons.submit')}
        </button>
        <button
          type="button"
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
        >
          {t('forms.buttons.cancel')}
        </button>
      </div>
    </form>
  );
}

export default function ContactPage() {
  return (
    <TranslationProvider>
      <div className="container mx-auto px-4 py-8">
        <ContactForm />
      </div>
    </TranslationProvider>
  );
}
```

### 2. Loading States

```tsx
function DataComponent() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  if (loading) {
    return (
      <div className="flex justify-center">
        {t('common.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        {t('common.error')}: {error.message}
      </div>
    );
  }

  return (
    <div>
      {/* Your content */}
    </div>
  );
}
```

### 3. Dynamic Content Lists

```tsx
function LocationList({ locations }) {
  const { t } = useTranslation();

  if (locations.length === 0) {
    return (
      <div className="text-center py-8">
        <p>{t('locations.noResults')}</p>
        <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
          {t('locations.addFirst')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>{t('locations.title')}</h2>
      <p>{t('locations.found', `Found ${locations.length} locations`)}</p>
      
      {locations.map((location) => (
        <div key={location.id} className="border p-4 rounded mb-4">
          <h3>{location.name}</h3>
          <p>{location.description}</p>
          <div className="mt-2 space-x-2">
            <button className="text-blue-500">
              {t('common.edit')}
            </button>
            <button className="text-red-500">
              {t('common.delete')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Troubleshooting

### Issue: Translation Keys Not Found

**Symptoms**: Seeing the key name instead of translated text
```
"locations.title" instead of "Explore Locations"
```

**Solutions**:
1. Check if the key exists in all language files
2. Verify the key path is correct
3. Ensure TranslationProvider wraps the component
4. Check browser console for loading errors

### Issue: Language Not Persisting

**Symptoms**: Language resets to English on page reload

**Solutions**:
1. Check browser localStorage:
   ```javascript
   localStorage.getItem('preferred-locale')
   ```
2. Ensure localStorage is supported
3. Check for JavaScript errors in console

### Issue: New Language Not Appearing

**Symptoms**: Language selector doesn't show new language

**Solutions**:
1. Update `locales` array in `lib/i18n.ts`
2. Add to `localeNames` object
3. Create translation files for new language
4. Restart development server

### Issue: Build Errors

**Symptoms**: Build fails with translation-related errors

**Solutions**:
1. Ensure all translation files have valid JSON
2. Check that all referenced keys exist
3. Verify TypeScript interfaces match translation structure
4. Run `npm run lint -- --fix`

### Issue: Performance Issues

**Symptoms**: Slow page loads or language switching

**Solutions**:
1. Check translation file sizes
2. Implement lazy loading for large translation files
3. Use `React.memo` for components with many translations
4. Consider splitting translations by page/feature

---

## Quick Reference

### Adding a Translation
1. Add key to all language files
2. Update TypeScript interface if new section
3. Use `t('your.key')` in component
4. Wrap component with TranslationProvider

### Adding a Language
1. Update `Locale` type and `locales` array
2. Add to `localeNames` object  
3. Create `locales/[code]/` directory
4. Copy and translate all JSON files

### Creating a New Page
1. Create translation keys for page content
2. Build component using `useTranslation()` 
3. Wrap with TranslationProvider
4. Update navigation if needed

### Testing Translations
```bash
# Build to check for errors
npm run build

# Check specific language
# Change language in UI and test all pages

# Validate JSON files
npx jsonlint locales/*/common.json
```

This manual should cover all scenarios for managing the multilanguage system in Baltguide. Keep it updated as you add new features or languages!