/**
 * Unified Color Theme for BaltGuide
 * Provides consistent, accessible colors across all components
 */

export const colors = {
  // BaltGuide Brand Colors (from screenshot)
  primary: {
    50: '#f0f9ff',   // Very light blue
    100: '#e0f2fe',  // Light blue  
    200: '#bae6fd',  // Lighter blue
    300: '#7dd3fc',  // Light blue
    400: '#38bdf8',  // Medium blue
    500: '#0ea5e9',  // BaltGuide blue
    600: '#0284c7',  // Primary brand blue
    700: '#0369a1',  // Dark blue
    800: '#075985',  // Very dark blue
    900: '#0c4a6e',  // Darkest blue (from screenshot gradient)
  },

  // Accent Colors
  accent: {
    pink: '#ec4899',     // Pink from "Get Location" button
    pinkHover: '#db2777', // Darker pink for hover
    pinkLight: '#fce7f3', // Light pink background
  },

  // Status Colors (Semantic) - Updated for BaltGuide
  status: {
    success: {
      light: '#10b981',    // emerald-500
      dark: '#059669',     // emerald-600  
      bg: '#d1fae5',       // emerald-100
      bgDark: '#065f46',   // emerald-800
    },
    warning: {
      light: '#f59e0b',    // amber-500
      dark: '#d97706',     // amber-600
      bg: '#fef3c7',       // amber-100
      bgDark: '#92400e',   // amber-800
    },
    error: {
      light: '#ef4444',    // red-500
      dark: '#dc2626',     // red-600
      bg: '#fee2e2',       // red-100
      bgDark: '#991b1b',   // red-800
    },
    info: {
      light: '#0ea5e9',    // BaltGuide blue-500
      dark: '#0284c7',     // BaltGuide blue-600
      bg: '#e0f2fe',       // BaltGuide blue-100
      bgDark: '#075985',   // BaltGuide blue-800
    },
  },

  // Connection Status Colors - BaltGuide themed
  connection: {
    online: {
      indicator: '#10b981',  // emerald-500 (success)
      text: '#065f46',       // emerald-800
      bg: '#d1fae5',         // emerald-100
      bgDark: '#022c22',     // emerald-950
    },
    offline: {
      indicator: '#ef4444',  // red-500 (error)
      text: '#991b1b',       // red-800
      bg: '#fee2e2',         // red-100
      bgDark: '#450a0a',     // red-950
    },
    syncing: {
      indicator: '#0ea5e9',  // BaltGuide blue-500
      text: '#075985',       // BaltGuide blue-800
      bg: '#e0f2fe',         // BaltGuide blue-100
      bgDark: '#0c2d48',     // BaltGuide blue-950
    },
    offlineMode: {
      indicator: '#ec4899',  // BaltGuide accent pink
      text: '#831843',       // pink-800
      bg: '#fce7f3',         // pink-100
      bgDark: '#500724',     // pink-950
    },
  },

  // Gray Scale (Neutral)
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },

  // Surface Colors
  surface: {
    light: {
      primary: '#ffffff',
      secondary: '#f9fafb',    // gray-50
      tertiary: '#f3f4f6',    // gray-100
      border: '#e5e7eb',      // gray-200
      borderSubtle: '#f3f4f6', // gray-100
    },
    dark: {
      primary: '#111827',      // gray-900
      secondary: '#1f2937',    // gray-800
      tertiary: '#374151',     // gray-700
      border: '#4b5563',       // gray-600
      borderSubtle: '#374151', // gray-700
    },
  },

  // Text Colors
  text: {
    light: {
      primary: '#111827',      // gray-900
      secondary: '#374151',    // gray-700
      tertiary: '#6b7280',     // gray-500
      quaternary: '#9ca3af',   // gray-400
      disabled: '#d1d5db',     // gray-300
    },
    dark: {
      primary: '#f9fafb',      // gray-50
      secondary: '#e5e7eb',    // gray-200
      tertiary: '#9ca3af',     // gray-400
      quaternary: '#6b7280',   // gray-500
      disabled: '#4b5563',     // gray-600
    },
  },
} as const;

// Helper functions for easier usage
export const getStatusColor = (status: 'online' | 'offline' | 'syncing' | 'offlineMode', variant: 'indicator' | 'text' | 'bg' | 'bgDark' = 'indicator') => {
  return colors.connection[status][variant];
};

export const getSemanticColor = (type: 'success' | 'warning' | 'error' | 'info', variant: 'light' | 'dark' | 'bg' | 'bgDark' = 'light') => {
  return colors.status[type][variant];
};

// CSS Custom Properties for runtime theme switching
export const getCSSVariables = (isDark: boolean) => ({
  '--color-primary': colors.primary[600],
  '--color-primary-hover': colors.primary[700],
  '--color-surface-primary': isDark ? colors.surface.dark.primary : colors.surface.light.primary,
  '--color-surface-secondary': isDark ? colors.surface.dark.secondary : colors.surface.light.secondary,
  '--color-surface-tertiary': isDark ? colors.surface.dark.tertiary : colors.surface.light.tertiary,
  '--color-border': isDark ? colors.surface.dark.border : colors.surface.light.border,
  '--color-border-subtle': isDark ? colors.surface.dark.borderSubtle : colors.surface.light.borderSubtle,
  '--color-text-primary': isDark ? colors.text.dark.primary : colors.text.light.primary,
  '--color-text-secondary': isDark ? colors.text.dark.secondary : colors.text.light.secondary,
  '--color-text-tertiary': isDark ? colors.text.dark.tertiary : colors.text.light.tertiary,
  '--color-text-quaternary': isDark ? colors.text.dark.quaternary : colors.text.light.quaternary,
  '--color-online': colors.connection.online.indicator,
  '--color-offline': colors.connection.offline.indicator,
  '--color-syncing': colors.connection.syncing.indicator,
  '--color-offline-mode': colors.connection.offlineMode.indicator,
});

// Tailwind CSS class mappings for consistent usage - BaltGuide Brand
export const tailwindClasses = {
  status: {
    online: {
      indicator: 'bg-emerald-500',
      text: 'text-emerald-700 dark:text-emerald-300',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-700',
    },
    offline: {
      indicator: 'bg-red-500',
      text: 'text-red-700 dark:text-red-300',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-700',
    },
    syncing: {
      indicator: 'bg-sky-500',  // BaltGuide blue
      text: 'text-sky-700 dark:text-sky-300',
      bg: 'bg-sky-50 dark:bg-sky-900/20',
      border: 'border-sky-200 dark:border-sky-700',
    },
    offlineMode: {
      indicator: 'bg-pink-500',  // BaltGuide accent pink
      text: 'text-pink-700 dark:text-pink-300',
      bg: 'bg-pink-50 dark:bg-pink-900/20',
      border: 'border-pink-200 dark:border-pink-700',
    },
  },
  surface: {
    primary: 'bg-white dark:bg-gray-900',
    secondary: 'bg-gray-50 dark:bg-gray-800',
    tertiary: 'bg-gray-100 dark:bg-gray-700',
    elevated: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg',
    border: 'border-gray-200 dark:border-gray-600',
    borderSubtle: 'border-gray-100 dark:border-gray-700',
  },
  text: {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-700 dark:text-gray-300', 
    tertiary: 'text-gray-600 dark:text-gray-400',
    quaternary: 'text-gray-500 dark:text-gray-500',
    disabled: 'text-gray-400 dark:text-gray-600',
  },
  interactive: {
    primary: 'bg-sky-600 hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 text-white transition-colors',  // BaltGuide blue
    secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 transition-colors',
    accent: 'bg-pink-500 hover:bg-pink-600 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 text-white transition-colors',  // BaltGuide pink
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-white transition-colors',
    success: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 text-white transition-colors',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors',
  },
  input: {
    base: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors',  // BaltGuide blue focus
    error: 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500',
  },
} as const;