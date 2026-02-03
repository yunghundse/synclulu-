/**
 * Home.tsx
 * 👑 NEBULA-DISCOVERY v23.0 - SovereignHome Integration
 *
 * This file now exports SovereignHome as the main Home experience.
 * The original Home component is preserved as HomeClassic for fallback.
 *
 * @design Apple HIG × Snapchat Flow-States
 * @version 23.0.0
 */

// Export SovereignHome as the default Home experience
export { SovereignHome as default } from '@/components/SovereignHome';

// Re-export for explicit imports
export { SovereignHome } from '@/components/SovereignHome';
