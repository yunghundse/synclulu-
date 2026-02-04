/**
 * synclulu THEME SYSTEM v2.0
 * "The Deep Night Standard"
 *
 * PHILOSOPHY:
 * - No pure black (#000) - always use refined dark grays
 * - WCAG AA compliant contrasts
 * - synclulu Glow: Soft pastels on dark backgrounds
 * - Consistent elevation system with subtle shadows
 *
 * @design Apple Human Interface Guidelines meets synclulu
 * @version 2.0.0
 */

// ═══════════════════════════════════════
// COLOR PALETTE - DEEP NIGHT STANDARD
// ═══════════════════════════════════════

export const colors = {
  // ─── DARK MODE BACKGROUNDS ───
  dark: {
    bg: {
      primary: '#0A0A0B',      // Main background - NOT pure black
      secondary: '#111113',    // Cards, elevated surfaces
      tertiary: '#18181B',     // Modals, overlays
      elevated: '#1F1F23',     // Highest elevation
      hover: '#252529',        // Hover states
      active: '#2A2A2F',       // Active/pressed states
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.06)',
      default: 'rgba(255, 255, 255, 0.10)',
      strong: 'rgba(255, 255, 255, 0.15)',
    },
    text: {
      primary: '#FAFAFA',      // High contrast - headings
      secondary: '#A1A1AA',    // Body text
      tertiary: '#71717A',     // Muted text
      disabled: '#52525B',     // Disabled states
    },
  },

  // ─── LIGHT MODE BACKGROUNDS ───
  light: {
    bg: {
      primary: '#FFFFFF',
      secondary: '#FAFAFA',
      tertiary: '#F4F4F5',
      elevated: '#FFFFFF',
      hover: '#F4F4F5',
      active: '#E4E4E7',
    },
    border: {
      subtle: 'rgba(0, 0, 0, 0.04)',
      default: 'rgba(0, 0, 0, 0.08)',
      strong: 'rgba(0, 0, 0, 0.12)',
    },
    text: {
      primary: '#09090B',
      secondary: '#52525B',
      tertiary: '#71717A',
      disabled: '#A1A1AA',
    },
  },

  // ─── synclulu ACCENT COLORS ───
  accent: {
    purple: {
      50: '#FAF5FF',
      100: '#F3E8FF',
      200: '#E9D5FF',
      300: '#D8B4FE',
      400: '#C084FC',
      500: '#A855F7',    // Primary
      600: '#9333EA',
      700: '#7C3AED',
      800: '#6B21A8',
      900: '#581C87',
    },
    pink: {
      50: '#FDF2F8',
      100: '#FCE7F3',
      200: '#FBCFE8',
      300: '#F9A8D4',
      400: '#F472B6',
      500: '#EC4899',    // Secondary
      600: '#DB2777',
      700: '#BE185D',
      800: '#9D174D',
      900: '#831843',
    },
    // synclulu Glow - Pastels for dark mode accents
    glow: {
      purple: 'rgba(168, 85, 247, 0.15)',
      pink: 'rgba(236, 72, 153, 0.15)',
      cyan: 'rgba(34, 211, 238, 0.15)',
      amber: 'rgba(251, 191, 36, 0.15)',
    },
  },

  // ─── SEMANTIC COLORS ───
  semantic: {
    success: '#22C55E',
    warning: '#FBBF24',
    error: '#EF4444',
    info: '#3B82F6',
  },
};

// ═══════════════════════════════════════
// ELEVATION SYSTEM
// ═══════════════════════════════════════

export const elevation = {
  dark: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.4), 0 4px 6px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.5), 0 8px 10px rgba(0, 0, 0, 0.3)',
    glow: {
      purple: '0 0 40px rgba(168, 85, 247, 0.3)',
      pink: '0 0 40px rgba(236, 72, 153, 0.3)',
    },
  },
  light: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15), 0 8px 10px rgba(0, 0, 0, 0.04)',
    glow: {
      purple: '0 0 40px rgba(168, 85, 247, 0.2)',
      pink: '0 0 40px rgba(236, 72, 153, 0.2)',
    },
  },
};

// ═══════════════════════════════════════
// SPACING & RADIUS
// ═══════════════════════════════════════

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
};

export const radius = {
  none: '0',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  full: '9999px',
};

// ═══════════════════════════════════════
// THEME HOOK & CONTEXT
// ═══════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  setDark: (dark: boolean) => void;
  toggle: () => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: true, // Default to dark mode for synclulu
      setDark: (dark) => {
        set({ isDark: dark });
        applyTheme(dark);
      },
      toggle: () => set((state) => {
        const newDark = !state.isDark;
        applyTheme(newDark);
        return { isDark: newDark };
      }),
    }),
    { name: 'synclulu-theme' }
  )
);

// Apply theme to DOM
export const applyTheme = (isDark: boolean) => {
  const root = document.documentElement;

  if (isDark) {
    root.classList.add('dark');
    root.style.setProperty('--bg-primary', colors.dark.bg.primary);
    root.style.setProperty('--bg-secondary', colors.dark.bg.secondary);
    root.style.setProperty('--bg-tertiary', colors.dark.bg.tertiary);
    root.style.setProperty('--bg-elevated', colors.dark.bg.elevated);
    root.style.setProperty('--text-primary', colors.dark.text.primary);
    root.style.setProperty('--text-secondary', colors.dark.text.secondary);
    root.style.setProperty('--border-default', colors.dark.border.default);
  } else {
    root.classList.remove('dark');
    root.style.setProperty('--bg-primary', colors.light.bg.primary);
    root.style.setProperty('--bg-secondary', colors.light.bg.secondary);
    root.style.setProperty('--bg-tertiary', colors.light.bg.tertiary);
    root.style.setProperty('--bg-elevated', colors.light.bg.elevated);
    root.style.setProperty('--text-primary', colors.light.text.primary);
    root.style.setProperty('--text-secondary', colors.light.text.secondary);
    root.style.setProperty('--border-default', colors.light.border.default);
  }
};

// Initialize theme on load
export const initTheme = () => {
  const stored = localStorage.getItem('synclulu-theme');
  if (stored) {
    const { state } = JSON.parse(stored);
    applyTheme(state.isDark);
  } else {
    applyTheme(true); // Default dark
  }
};

// ═══════════════════════════════════════
// CSS VARIABLES FOR TAILWIND
// ═══════════════════════════════════════

export const cssVariables = `
  :root {
    /* Light Mode */
    --bg-primary: ${colors.light.bg.primary};
    --bg-secondary: ${colors.light.bg.secondary};
    --bg-tertiary: ${colors.light.bg.tertiary};
    --bg-elevated: ${colors.light.bg.elevated};
    --bg-hover: ${colors.light.bg.hover};
    --text-primary: ${colors.light.text.primary};
    --text-secondary: ${colors.light.text.secondary};
    --text-tertiary: ${colors.light.text.tertiary};
    --border-subtle: ${colors.light.border.subtle};
    --border-default: ${colors.light.border.default};
  }

  .dark {
    --bg-primary: ${colors.dark.bg.primary};
    --bg-secondary: ${colors.dark.bg.secondary};
    --bg-tertiary: ${colors.dark.bg.tertiary};
    --bg-elevated: ${colors.dark.bg.elevated};
    --bg-hover: ${colors.dark.bg.hover};
    --text-primary: ${colors.dark.text.primary};
    --text-secondary: ${colors.dark.text.secondary};
    --text-tertiary: ${colors.dark.text.tertiary};
    --border-subtle: ${colors.dark.border.subtle};
    --border-default: ${colors.dark.border.default};
  }
`;
