/**
 * ═══════════════════════════════════════════════════════════════════════════
 * synclulu THEME UTILITY CLASSES
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
    primary: 'bg-[var(--synclulu-bg)]',
    /** Secondary/surface background */
    secondary: 'bg-[var(--synclulu-surface)]',
    /** Card backgrounds */
    card: 'bg-[var(--synclulu-card)]',
    /** Soft highlight background */
    soft: 'bg-[var(--synclulu-soft)]',
    /** Glass effect background */
    glass: 'glass-card',
    /** Navigation background */
    nav: 'glass-nav',
    /** Input/form backgrounds */
    input: 'bg-[var(--synclulu-surface)]',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TEXT COLORS
  // ═══════════════════════════════════════════════════════════════════════════
  text: {
    /** Primary text */
    primary: 'text-[var(--synclulu-text)]',
    /** Secondary/muted text */
    secondary: 'text-[var(--synclulu-text-secondary)]',
    /** Subtle/hint text */
    muted: 'text-[var(--synclulu-muted)]',
    /** Accent colored text */
    accent: 'text-[var(--synclulu-accent)]',
    /** Gradient text */
    gradient: 'gradient-text',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BORDERS
  // ═══════════════════════════════════════════════════════════════════════════
  border: {
    /** Default border */
    default: 'border-[var(--synclulu-border)]',
    /** Accent border */
    accent: 'border-[var(--synclulu-accent)]',
    /** Input focus border */
    focus: 'focus:border-[var(--synclulu-accent)]',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CARDS & CONTAINERS
  // ═══════════════════════════════════════════════════════════════════════════
  card: {
    /** Standard card */
    default: 'bg-[var(--synclulu-card)] border border-[var(--synclulu-border)] rounded-2xl theme-transition',
    /** Glass card */
    glass: 'glass-card',
    /** Elevated card with shadow */
    elevated: 'bg-[var(--synclulu-card)] border border-[var(--synclulu-border)] rounded-2xl shadow-[var(--shadow-md)] theme-transition',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BUTTONS
  // ═══════════════════════════════════════════════════════════════════════════
  button: {
    /** Primary gradient button */
    primary: 'btn-primary text-white',
    /** Secondary button */
    secondary: 'bg-[var(--synclulu-surface)] text-[var(--synclulu-text)] border border-[var(--synclulu-border)] hover:bg-[var(--synclulu-soft)] transition-colors',
    /** Ghost button */
    ghost: 'text-[var(--synclulu-text)] hover:bg-[var(--synclulu-soft)] transition-colors',
    /** Icon button */
    icon: 'bg-[var(--glass-bg)] backdrop-blur-sm border border-[var(--synclulu-border)] text-[var(--synclulu-text)] hover:text-[var(--synclulu-accent)] transition-colors',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INPUTS
  // ═══════════════════════════════════════════════════════════════════════════
  input: {
    /** Default input */
    default: 'bg-[var(--synclulu-surface)] text-[var(--synclulu-text)] border border-[var(--synclulu-border)] placeholder:text-[var(--synclulu-muted)] focus:border-[var(--synclulu-accent)] focus:ring-2 focus:ring-[var(--synclulu-accent)]/20 outline-none transition-all',
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
    default: 'text-[var(--synclulu-text)]',
    /** Muted icon color */
    muted: 'text-[var(--synclulu-muted)]',
    /** Accent icon color */
    accent: 'text-[var(--synclulu-accent)]',
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
export const pageWrapper = 'min-h-screen bg-[var(--synclulu-bg)] text-[var(--synclulu-text)] theme-transition';

/**
 * Safe area wrapper
 */
export const safePageWrapper = `${pageWrapper} safe-top pb-24`;

export default theme;
