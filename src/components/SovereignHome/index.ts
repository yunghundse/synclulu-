// Sovereign Home v3.0 - Nebula Command Center Edition
// The Ultimate Home Dashboard with modular high-end components

// Main Export - Use V3 (Nebula Command Center) as default
export { default as SovereignHome } from './SovereignHomeV3';
export { default as SovereignHomeV3 } from './SovereignHomeV3';
export { default } from './SovereignHomeV3';

// Legacy exports for backwards compatibility
export { default as SovereignHomeV2 } from './SovereignHomeV2';
export { default as SovereignHomeLegacy } from './SovereignHome';

// V2 Network Components (Aura Network)
export { AuraNetwork } from './AuraNetwork';
export type { AuraNode, AuraEdge } from './AuraNetwork';
export { AuraQuickPreview } from './AuraQuickPreview';

// V3 Command Center Modules
export { SmartLocationBadge } from './SmartLocationBadge';
export { RisingStars } from './RisingStars';
export type { RisingStar } from './RisingStars';
export { HotspotRadar } from './HotspotRadar';
export type { Hotspot } from './HotspotRadar';
export { PathfinderService } from './PathfinderService';
export type { PathfinderSuggestion } from './PathfinderService';
export { OrbitalMenu } from './OrbitalMenu';
