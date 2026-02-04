/**
 * SovereignUI Component Library
 * Das komplette Design-System für synclulu
 */

// Core Components
export { AuraOrb, type AuraLevel } from './AuraOrb';
export { FloatingDock } from './FloatingDock';
export { DeepSpaceGrid } from './DeepSpaceGrid';
export { LightBridge } from './LightBridge';
export { NexusCommandCenter, FOUNDER_UID } from './NexusCommandCenter';
export { GlobalDiscoveryButton } from './GlobalDiscoveryButton';
export { LiquidGumButton } from './LiquidGumButton';
export { ObsidianNav } from './ObsidianNav';
export { CloudChatList, CloudChatItem } from './CloudChatList';

// Re-export ascension system
export {
  ASCENSION_TIERS,
  XP_REWARDS,
  getXPForLevel,
  getTotalXPForLevel,
  getLevelFromXP,
  getAscensionTier,
  getTierProgress,
  getNextTier,
  calculateLevelUp,
  formatLevel,
  formatLevelShort,
  type AscensionRank,
  type AscensionTier,
  type LevelUpData,
} from '../../lib/ascensionSystem';
