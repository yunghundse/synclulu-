/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DELULU NATIVE THEME SYSTEM - Apple-Standard Dark/Light Mode
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Features:
 * - Auto-detects system preference (prefers-color-scheme)
 * - Syncs status bar color with theme
 * - Smooth 300ms transitions between modes
 * - Persists user preference in localStorage
 *
 * @version 2.0.0 - Native Sync Edition
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'delulu-theme';

// Get system preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Update meta theme-color for status bar
const updateMetaThemeColor = (isDark: boolean) => {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  const color = isDark ? '#0b0b0b' : '#ffffff';

  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', color);
  } else {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = color;
    document.head.appendChild(meta);
  }

  // Also update apple-mobile-web-app-status-bar-style
  const appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  const statusBarStyle = isDark ? 'black-translucent' : 'default';

  if (appleStatusBar) {
    appleStatusBar.setAttribute('content', statusBarStyle);
  } else {
    const meta = document.createElement('meta');
    meta.name = 'apple-mobile-web-app-status-bar-style';
    meta.content = statusBarStyle;
    document.head.appendChild(meta);
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize theme from localStorage or default to 'system'
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored as Theme) || 'system';
  });

  // Resolved theme (actual light/dark based on system preference if 'system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
    if (stored && stored !== 'system') return stored;
    return getSystemTheme();
  });

  // Apply theme to document
  const applyTheme = useCallback((resolved: 'light' | 'dark') => {
    const root = document.documentElement;

    if (resolved === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }

    // Update status bar color
    updateMetaThemeColor(resolved === 'dark');
  }, []);

  // Handle theme change
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);

    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, [applyTheme]);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const newResolved = e.matches ? 'dark' : 'light';
        setResolvedTheme(newResolved);
        applyTheme(newResolved);
      }
    };

    // Add listener
    mediaQuery.addEventListener('change', handleChange);

    // Initial apply
    applyTheme(resolvedTheme);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme, resolvedTheme, applyTheme]);

  // Apply theme on mount
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, []);

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
