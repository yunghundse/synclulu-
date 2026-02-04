/**
 * synclulu GLOW-UP EFFECTS SYSTEM
 * Visual effects based on level progression (1-500)
 */

// ═══════════════════════════════════════
// GLOW-UP EFFECT TIERS
// ═══════════════════════════════════════

export interface GlowUpTier {
  minLevel: number;
  maxLevel: number;
  name: string;
  nameDE: string;
  emoji: string;
  frameStyle: string;
  glowColor: string;
  glowIntensity: number;
  nameEffect: 'none' | 'gradient' | 'shimmer' | 'rainbow' | 'fire' | 'holographic';
  backgroundEffect: 'none' | 'particles' | 'stars' | 'aurora' | 'nebula' | 'cosmic';
  badgeStyle: string;
  particles: ParticleConfig | null;
}

export interface ParticleConfig {
  type: 'sparkles' | 'stars' | 'hearts' | 'clouds' | 'fire' | 'cosmic';
  count: number;
  speed: number;
  size: number;
  colors: string[];
}

export const GLOW_UP_TIERS: GlowUpTier[] = [
  {
    minLevel: 1,
    maxLevel: 9,
    name: 'Newcomer',
    nameDE: 'Neuling',
    emoji: '🌱',
    frameStyle: 'border-2 border-gray-300',
    glowColor: 'transparent',
    glowIntensity: 0,
    nameEffect: 'none',
    backgroundEffect: 'none',
    badgeStyle: 'bg-gray-200 text-gray-600',
    particles: null,
  },
  {
    minLevel: 10,
    maxLevel: 24,
    name: 'Beginner',
    nameDE: 'Anfänger',
    emoji: '☁️',
    frameStyle: 'border-2 border-blue-400',
    glowColor: '#60A5FA',
    glowIntensity: 5,
    nameEffect: 'none',
    backgroundEffect: 'none',
    badgeStyle: 'bg-blue-100 text-blue-600',
    particles: null,
  },
  {
    minLevel: 25,
    maxLevel: 49,
    name: 'Explorer',
    nameDE: 'Entdecker',
    emoji: '🧭',
    frameStyle: 'border-3 border-green-500',
    glowColor: '#22C55E',
    glowIntensity: 8,
    nameEffect: 'gradient',
    backgroundEffect: 'none',
    badgeStyle: 'bg-green-100 text-green-600',
    particles: {
      type: 'sparkles',
      count: 5,
      speed: 1,
      size: 4,
      colors: ['#22C55E', '#4ADE80'],
    },
  },
  {
    minLevel: 50,
    maxLevel: 99,
    name: 'Adventurer',
    nameDE: 'Abenteurer',
    emoji: '⚡',
    frameStyle: 'border-3 border-purple-500 ring-2 ring-purple-300',
    glowColor: '#A855F7',
    glowIntensity: 12,
    nameEffect: 'gradient',
    backgroundEffect: 'particles',
    badgeStyle: 'bg-purple-100 text-purple-600',
    particles: {
      type: 'sparkles',
      count: 10,
      speed: 1.5,
      size: 5,
      colors: ['#A855F7', '#C084FC', '#E879F9'],
    },
  },
  {
    minLevel: 100,
    maxLevel: 149,
    name: 'Champion',
    nameDE: 'Champion',
    emoji: '🏆',
    frameStyle: 'border-4 border-amber-500 ring-4 ring-amber-300',
    glowColor: '#F59E0B',
    glowIntensity: 18,
    nameEffect: 'shimmer',
    backgroundEffect: 'stars',
    badgeStyle: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white',
    particles: {
      type: 'stars',
      count: 15,
      speed: 2,
      size: 6,
      colors: ['#F59E0B', '#FBBF24', '#FCD34D'],
    },
  },
  {
    minLevel: 150,
    maxLevel: 199,
    name: 'Master',
    nameDE: 'Meister',
    emoji: '🔥',
    frameStyle: 'border-4 border-orange-500 ring-4 ring-orange-400 ring-offset-2',
    glowColor: '#F97316',
    glowIntensity: 22,
    nameEffect: 'shimmer',
    backgroundEffect: 'aurora',
    badgeStyle: 'bg-gradient-to-r from-orange-500 to-red-500 text-white',
    particles: {
      type: 'fire',
      count: 20,
      speed: 2.5,
      size: 7,
      colors: ['#F97316', '#EF4444', '#FCD34D'],
    },
  },
  {
    minLevel: 200,
    maxLevel: 299,
    name: 'Grandmaster',
    nameDE: 'Großmeister',
    emoji: '💎',
    frameStyle: 'border-4 border-pink-500 ring-4 ring-pink-400 ring-offset-4 ring-offset-pink-100',
    glowColor: '#EC4899',
    glowIntensity: 28,
    nameEffect: 'rainbow',
    backgroundEffect: 'aurora',
    badgeStyle: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white',
    particles: {
      type: 'hearts',
      count: 25,
      speed: 3,
      size: 8,
      colors: ['#EC4899', '#F472B6', '#F9A8D4'],
    },
  },
  {
    minLevel: 300,
    maxLevel: 399,
    name: 'Legend',
    nameDE: 'Legende',
    emoji: '🌟',
    frameStyle: 'border-[6px] border-transparent bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 p-[3px]',
    glowColor: '#8B5CF6',
    glowIntensity: 35,
    nameEffect: 'rainbow',
    backgroundEffect: 'nebula',
    badgeStyle: 'bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white animate-pulse',
    particles: {
      type: 'cosmic',
      count: 30,
      speed: 3.5,
      size: 10,
      colors: ['#8B5CF6', '#A855F7', '#D946EF', '#EC4899'],
    },
  },
  {
    minLevel: 400,
    maxLevel: 499,
    name: 'Mythic',
    nameDE: 'Mythisch',
    emoji: '🦋',
    frameStyle: 'border-[8px] border-transparent bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 p-[4px] animate-gradient',
    glowColor: '#FFD700',
    glowIntensity: 45,
    nameEffect: 'holographic',
    backgroundEffect: 'cosmic',
    badgeStyle: 'bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 text-white animate-gradient',
    particles: {
      type: 'cosmic',
      count: 40,
      speed: 4,
      size: 12,
      colors: ['#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6'],
    },
  },
  {
    minLevel: 500,
    maxLevel: 500,
    name: 'synclulu God',
    nameDE: 'synclulu Gott',
    emoji: '👑',
    frameStyle: 'border-[10px] border-transparent bg-gradient-conic from-red-500 via-yellow-500 via-green-500 via-blue-500 via-purple-500 to-red-500 p-[5px] animate-spin-slow',
    glowColor: '#FFFFFF',
    glowIntensity: 60,
    nameEffect: 'holographic',
    backgroundEffect: 'cosmic',
    badgeStyle: 'bg-gradient-conic from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 text-white animate-gradient shadow-2xl',
    particles: {
      type: 'cosmic',
      count: 60,
      speed: 5,
      size: 15,
      colors: ['#FFFFFF', '#FFD700', '#FF69B4', '#00CED1', '#9400D3'],
    },
  },
];

// ═══════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════

/**
 * Get glow-up tier for a level
 */
export const getGlowUpTier = (level: number): GlowUpTier => {
  const tier = GLOW_UP_TIERS.find(t => level >= t.minLevel && level <= t.maxLevel);
  return tier || GLOW_UP_TIERS[0];
};

/**
 * Get CSS styles for avatar frame
 */
export const getAvatarFrameStyles = (level: number): React.CSSProperties => {
  const tier = getGlowUpTier(level);

  return {
    boxShadow: tier.glowIntensity > 0
      ? `0 0 ${tier.glowIntensity}px ${tier.glowIntensity / 2}px ${tier.glowColor}`
      : 'none',
  };
};

/**
 * Get CSS class for avatar frame
 */
export const getAvatarFrameClass = (level: number): string => {
  const tier = getGlowUpTier(level);
  return tier.frameStyle;
};

/**
 * Get name effect CSS class
 */
export const getNameEffectClass = (level: number): string => {
  const tier = getGlowUpTier(level);

  switch (tier.nameEffect) {
    case 'gradient':
      return 'bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent';
    case 'shimmer':
      return 'bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]';
    case 'rainbow':
      return 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_100%]';
    case 'fire':
      return 'bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent animate-fire';
    case 'holographic':
      return 'bg-gradient-conic from-red-500 via-yellow-500 via-green-500 via-blue-500 via-purple-500 to-red-500 bg-clip-text text-transparent animate-holographic bg-[length:100%_100%]';
    default:
      return '';
  }
};

/**
 * Get badge style for level
 */
export const getBadgeStyle = (level: number): string => {
  const tier = getGlowUpTier(level);
  return tier.badgeStyle;
};

/**
 * Check if level has particle effects
 */
export const hasParticles = (level: number): boolean => {
  const tier = getGlowUpTier(level);
  return tier.particles !== null;
};

/**
 * Get particle configuration for level
 */
export const getParticleConfig = (level: number): ParticleConfig | null => {
  const tier = getGlowUpTier(level);
  return tier.particles;
};

// ═══════════════════════════════════════
// UNLOCK REQUIREMENTS
// ═══════════════════════════════════════

export interface UnlockableFeature {
  name: string;
  nameDE: string;
  description: string;
  descriptionDE: string;
  requiredLevel: number;
  icon: string;
}

export const UNLOCKABLE_FEATURES: UnlockableFeature[] = [
  {
    name: 'Basic Frame',
    nameDE: 'Basis-Rahmen',
    description: 'Simple colored frame around your avatar',
    descriptionDE: 'Einfacher farbiger Rahmen um dein Avatar',
    requiredLevel: 10,
    icon: '🖼️',
  },
  {
    name: 'Sparkle Effects',
    nameDE: 'Funkel-Effekte',
    description: 'Sparkles appear around your profile',
    descriptionDE: 'Funken erscheinen um dein Profil',
    requiredLevel: 25,
    icon: '✨',
  },
  {
    name: 'Gradient Name',
    nameDE: 'Gradient-Name',
    description: 'Your name displays with a beautiful gradient',
    descriptionDE: 'Dein Name wird mit einem schönen Verlauf angezeigt',
    requiredLevel: 25,
    icon: '🌈',
  },
  {
    name: 'Glowing Avatar',
    nameDE: 'Leuchtendes Avatar',
    description: 'Your avatar has a glowing aura',
    descriptionDE: 'Dein Avatar hat eine leuchtende Aura',
    requiredLevel: 50,
    icon: '💫',
  },
  {
    name: 'Custom Header',
    nameDE: 'Eigenes Header-Bild',
    description: 'Upload a custom header image for your profile',
    descriptionDE: 'Lade ein eigenes Header-Bild für dein Profil hoch',
    requiredLevel: 50,
    icon: '🎨',
  },
  {
    name: 'Star Particles',
    nameDE: 'Stern-Partikel',
    description: 'Stars float around your profile',
    descriptionDE: 'Sterne schweben um dein Profil',
    requiredLevel: 100,
    icon: '⭐',
  },
  {
    name: 'Shimmer Name',
    nameDE: 'Schimmernder Name',
    description: 'Your name shimmers with light',
    descriptionDE: 'Dein Name schimmert mit Licht',
    requiredLevel: 100,
    icon: '✨',
  },
  {
    name: 'Aurora Background',
    nameDE: 'Aurora-Hintergrund',
    description: 'Animated aurora borealis behind your profile',
    descriptionDE: 'Animiertes Nordlicht hinter deinem Profil',
    requiredLevel: 150,
    icon: '🌌',
  },
  {
    name: 'Rainbow Name',
    nameDE: 'Regenbogen-Name',
    description: 'Your name cycles through rainbow colors',
    descriptionDE: 'Dein Name wechselt durch Regenbogenfarben',
    requiredLevel: 200,
    icon: '🌈',
  },
  {
    name: 'Nebula Background',
    nameDE: 'Nebula-Hintergrund',
    description: 'Cosmic nebula effect behind your profile',
    descriptionDE: 'Kosmischer Nebula-Effekt hinter deinem Profil',
    requiredLevel: 300,
    icon: '🌌',
  },
  {
    name: 'Holographic Name',
    nameDE: 'Holografischer Name',
    description: 'Your name has a holographic effect',
    descriptionDE: 'Dein Name hat einen holografischen Effekt',
    requiredLevel: 400,
    icon: '💎',
  },
  {
    name: 'Cosmic Effects',
    nameDE: 'Kosmische Effekte',
    description: 'Full cosmic particle and background effects',
    descriptionDE: 'Volle kosmische Partikel- und Hintergrund-Effekte',
    requiredLevel: 400,
    icon: '🌟',
  },
  {
    name: 'God Mode',
    nameDE: 'Gott-Modus',
    description: 'Ultimate effects reserved for Level 500',
    descriptionDE: 'Ultimative Effekte reserviert für Level 500',
    requiredLevel: 500,
    icon: '👑',
  },
];

/**
 * Get unlocked features for a level
 */
export const getUnlockedFeatures = (level: number): UnlockableFeature[] => {
  return UNLOCKABLE_FEATURES.filter(f => level >= f.requiredLevel);
};

/**
 * Get next unlockable feature
 */
export const getNextUnlockableFeature = (level: number): UnlockableFeature | null => {
  return UNLOCKABLE_FEATURES.find(f => f.requiredLevel > level) || null;
};

export default {
  GLOW_UP_TIERS,
  UNLOCKABLE_FEATURES,
  getGlowUpTier,
  getAvatarFrameStyles,
  getAvatarFrameClass,
  getNameEffectClass,
  getBadgeStyle,
  hasParticles,
  getParticleConfig,
  getUnlockedFeatures,
  getNextUnlockableFeature,
};
