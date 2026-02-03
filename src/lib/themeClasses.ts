/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DELULU THEME UTILITY CLASSES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Zentrale Theme-aware Klassen für 100% Dark/Light Mode Konsistenz.
 * NIEMALS hardcoded Farben in Komponenten verwenden!
 *
 * Usage:
 * import { theme } from '@/lib/themeClasses';
 * <div className={theme.bg.primary}>...</div>
 *
 * @version 2.0.0 - Global Theme Edition
 */

export const theme = {
  // ═══════════════════════════════════════════════════════════════════════════
  // BACKGROUNDS
  // ═══════════════════════════════════════════════════════════════════════════
  bg: {
    /** Main app background */
    primary: 'bg-[var(--delulu-bg)]',
    /** Secondary/surface background */
    secondary: 'bg-[var(--delulu-surface)]',
    /** Card backgrounds */
    card: 'bg-[var(--delulu-card)]',
    /** Soft highlight background */
    soft: 'bg-[var(--delulu-soft)]',
    /** Glass effect background */
    glass: 'glass-card',
    /** Navigation background */
    nav: 'glass-nav',
    /** Input/form backgrounds */
    input: 'bg-[var(--delulu-surface)]',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TEXT COLORS
  // ═══════════════════════════════════════════════════════════════════════════
  text: {
    /** Primary text */
    primary: 'text-[var(--delulu-text)]',
    /** Secondary/muted text */
    secondary: 'text-[var(--delulu-text-secondary)]',
    /** Subtle/hint text */
    muted: 'text-[var(--delulu-muted)]',
    /** Accent colored text */
    accent: 'text-[var(--delulu-accent)]',
    /** Gradient text */
    gradient: 'gradient-text',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BORDERS
  // ═══════════════════════════════════════════════════════════════════════════
  border: {
    /** Default border */
    default: 'border-[var(--delulu-border)]',
    /** Accent border */
    accent: 'border-[var(--delulu-accent)]',
    /** Input focus border */
    focus: 'focus:border-[var(--delulu-accent)]',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CARDS & CONTAINERS
  // ═══════════════════════════════════════════════════════════════════════════
  card: {
    /** Standard card */
    default: 'bg-[var(--delulu-card)] border border-[var(--delulu-border)] rounded-2xl theme-transition',
    /** Glass card */
    glass: 'glass-card',
    /** Elevated card with shadow */
    elevated: 'bg-[var(--delulu-card)] border border-[var(--delulu-border)] rounded-2xl shadow-[var(--shadow-md)] theme-transition',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BUTTONS
  // ═══════════════════════════════════════════════════════════════════════════
  button: {
    /** Primary gradient button */
    primary: 'btn-primary text-white',
    /** Secondary button */
    secondary: 'bg-[var(--delulu-surface)] text-[var(--delulu-text)] border border-[var(--delulu-border)] hover:bg-[var(--delulu-soft)] transition-colors',
    /** Ghost button */
    ghost: 'text-[var(--delulu-text)] hover:bg-[var(--delulu-soft)] transition-colors',
    /** Icon button */
    icon: 'bg-[var(--glass-bg)] backdrop-blur-sm border border-[var(--delulu-border)] text-[var(--delulu-text)] hover:text-[var(--delulu-accent)] transition-colors',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INPUTS
  // ═══════════════════════════════════════════════════════════════════════════
  input: {
    /** Default input */
    default: 'bg-[var(--delulu-surface)] text-[var(--delulu-text)] border border-[var(--delulu-border)] placeholder:text-[var(--delulu-muted)] focus:border-[var(--delulu-accent)] focus:ring-2 focus:ring-[var(--delulu-accent)]/20 outline-none transition-all',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSITIONS
  // ═══════════════════════════════════════════════════════════════════════════
  transition: {
    /** Theme-aware transition */
    theme: 'theme-transition',
    /** Color transition */
    colors: 'transition-colors duration-200',
    /** All properties */
    all: 'transition-all duration-200',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ICONS
  // ═══════════════════════════════════════════════════════════════════════════
  icon: {
    /** Default icon color */
    default: 'text-[var(--delulu-text)]',
    /** Muted icon color */
    muted: 'text-[var(--delulu-muted)]',
    /** Accent icon color */
    accent: 'text-[var(--delulu-accent)]',
    /** currentColor for SVG adaptation */
    adaptive: 'text-current',
  },
} as const;

/**
 * Convenience function to combine theme classes
 */
export const tw = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Page wrapper with theme background
 */
export const pageWrapper = 'min-h-screen bg-[var(--delulu-bg)] text-[var(--delulu-text)] theme-transition';

/**
 * Safe area wrapper
 */
export const safePageWrapper = `${pageWrapper} safe-top pb-24`;

export default theme;
