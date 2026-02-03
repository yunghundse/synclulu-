/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // ═══════════════════════════════════════════════════════════════
        // DELULU NATIVE THEME SYSTEM - Apple-Standard Color Palette
        // ═══════════════════════════════════════════════════════════════
        delulu: {
          // Light Mode Colors
          bg: 'var(--delulu-bg)',
          surface: 'var(--delulu-surface)',
          text: 'var(--delulu-text)',
          'text-secondary': 'var(--delulu-text-secondary)',
          muted: 'var(--delulu-muted)',
          border: 'var(--delulu-border)',

          // Brand Colors (same in both modes)
          violet: '#A78BFA',
          'violet-dark': '#7C3AED',
          'violet-light': '#C4B5FD',
          purple: '#8B5CF6',
          pink: '#EC4899',

          // Pastell Accent (Dark Mode)
          'accent-pastell': '#C4B5FD',
          // Vivid Accent (Light Mode)
          'accent-vivid': '#7C3AED',

          // Semantic Colors
          soft: 'var(--delulu-soft)',
          card: 'var(--delulu-card)',
          nav: 'var(--delulu-nav)',
        },

        // ═══════════════════════════════════════════════════════════════
        // DEEP-NIGHT DARKMODE - OLED Black Layer Structure
        // ═══════════════════════════════════════════════════════════════
        dark: {
          base: '#050505',      // OLED True Black (Layer 0)
          card: '#121212',      // Elevation 1 (Cards)
          elevated: '#1A1A1A',  // Elevation 2 (Modals)
          surface: '#242424',   // Elevation 3 (Interactive)

          // Text Colors
          text: '#F5F5F5',      // Primary Text (High Contrast)
          'text-secondary': '#B3B3B3', // Secondary Text
          muted: '#666666',     // Muted/Disabled Text

          // Accent with glow
          accent: '#A855F7',    // Purple Nebula
          'accent-glow': 'rgba(168, 85, 247, 0.2)', // Violet Glow 20%

          // Borders
          border: 'rgba(255, 255, 255, 0.08)',
          'border-strong': 'rgba(255, 255, 255, 0.15)',
        }
      },
      fontFamily: {
        display: ['Quicksand', 'sans-serif'],
        body: ['Nunito', 'sans-serif'],
      },
      backgroundColor: {
        'glass': 'var(--glass-bg)',
        'glass-strong': 'var(--glass-bg-strong)',
      },
      backdropBlur: {
        'glass': '20px',
      },
      transitionProperty: {
        'theme': 'background-color, border-color, color, fill, stroke',
      },
      transitionDuration: {
        'theme': '300ms',
      },
    },
  },
  plugins: [],
}
