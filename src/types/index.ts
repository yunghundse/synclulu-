// ═══════════════════════════════════════
// IDENTITY TYPES
// ═══════════════════════════════════════

/**
 * UNIQUE HANDLE SYSTEM:
 * - `username` (@handle): Globally unique, lowercase, immutable after creation
 * - `displayName`: Freely changeable nickname for UI display
 * - `anonymousAlias`: Auto-generated alias for anonymous mode
 */
export interface UserIdentity {
  username: string;              // @handle - unique, lowercase, 3-20 chars
  displayName: string;           // Spitzname - frei wählbar
  anonymousAlias: string;        // Auto-generated: "Wanderer_4829"
  isAnonymous: boolean;          // Global anonymity toggle
  avatarBlurred: boolean;        // Blur avatar when anonymous
}

// Username validation rules
export const USERNAME_RULES = {
  minLength: 3,
  maxLength: 20,
  pattern: /^[a-z0-9_]+$/,       // Only lowercase, numbers, underscores
  reserved: ['admin', 'synclulu', 'support', 'help', 'system', 'mod', 'moderator'],
};

// ═══════════════════════════════════════
// USER TYPES
// ═══════════════════════════════════════

export interface User {
  id: string;
  email: string;

  // Identity (NEW)
  username: string;              // @handle - UNIQUE in DB
  displayName: string;           // Spitzname
  anonymousAlias?: string;       // Auto-generated for anon mode
  isGlobalAnonymous?: boolean;   // Master anonymity switch

  avatar?: string;
  avatarUrl?: string;
  avatarBlurred?: boolean;       // Blur when anonymous
  bio?: string;
  visibilityMode: VisibilityMode;
  isActive: boolean;
  lastSeen: Date;
  createdAt: Date;

  // Full Birthdate (day, month, year)
  birthDate?: Date;              // Full birthdate
  birthDay?: number;             // Day 1-31
  birthMonth?: number;           // Month 1-12
  birthYear?: number;            // Year (e.g. 1990)
  showBirthdateOnProfile?: boolean; // Privacy setting
  city?: string;                 // City/Region

  // Language preference (from registration)
  language?: 'de' | 'en' | 'es' | 'fr' | 'pt';

  // Social Graph (NEW)
  followerCount?: number;
  followingCount?: number;
  totalStarsReceived?: number;
  totalStarsGiven?: number;

  // XP & Level (optional for backwards compatibility)
  xp?: number;
  level?: number;
  levelTitle?: string;

  // Streak
  currentStreak?: number;
  longestStreak?: number;
  lastLoginDate?: Date;
  streakFreezeUsed?: boolean;

  // Trust
  trustScore?: number;
  totalRatings?: number;
  positiveRatings?: number;
  negativeRatings?: number;

  // Voice Stats
  totalVoiceMinutes?: number;
  totalConnections?: number;

  // Social
  friendCount?: number;
  friendRadarEnabled?: boolean;
  searchRadius?: number;

  // Moderation
  reportCount?: number;
  isShadowMuted?: boolean;
  shadowMuteUntil?: Date;
  isBanned?: boolean;
  banUntil?: Date;

  // Premium
  isPremium?: boolean;
  premiumUntil?: Date;

  // Admin
  isAdmin?: boolean;

  // Account Status
  isPaused?: boolean;
  pausedAt?: Date;

  // Username Change Control (30-day limit)
  usernameLastChanged?: Date;
  usernameChangeCount?: number;

  // Referral System
  referralCount?: number;
  referralUnlocks?: ReferralUnlock[];
}

// Referral Unlock Types
export type ReferralUnlock =
  | 'premium_trial_7d'      // 1 referral: 7 days premium trial
  | 'exclusive_theme'       // 2 referrals: Exclusive app theme
  | 'priority_matching'     // 3 referrals: Priority in voice matching
  | 'double_xp_weekend'     // 4 referrals: Weekend double XP boost
  | 'vip_badge'             // 5 referrals: VIP badge on profile
  | 'unlimited_invites';    // 5+ referrals: Generate unlimited invites

export const REFERRAL_MILESTONES: { count: number; unlock: ReferralUnlock; label: string; icon: string }[] = [
  { count: 1, unlock: 'premium_trial_7d', label: '7 Tage Premium', icon: '👑' },
  { count: 2, unlock: 'exclusive_theme', label: 'Exklusives Theme', icon: '🎨' },
  { count: 3, unlock: 'priority_matching', label: 'Priority Matching', icon: '⚡' },
  { count: 4, unlock: 'double_xp_weekend', label: 'Doppel-XP Wochenende', icon: '✨' },
  { count: 5, unlock: 'vip_badge', label: 'VIP Badge', icon: '💎' },
];

export type VisibilityMode = 'public' | 'friends' | 'ghost' | 'anonymous' | 'semi';

// ═══════════════════════════════════════
// XP & LEVEL TYPES
// ═══════════════════════════════════════

export interface XPTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: XPReason;
  multiplier: number;
  finalAmount: number;
  timestamp: Date;
  metadata?: XPMetadata;
}

export type XPReason =
  | 'voice_minute'
  | 'positive_rating'
  | 'negative_rating'
  | 'daily_login'
  | 'first_connection'
  | 'lounge_created'
  | 'flash_event'
  | 'friendship'
  | 'report_received'
  | 'report_confirmed'
  | 'spam_penalty';

export interface XPMetadata {
  voiceSessionId?: string;
  ratingFromUserId?: string;
  eventId?: string;
  loungeId?: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  emoji: string;
  color: string;
  xpRequired: number;
  xpToNext: number;
  progress: number; // 0-100
}

export const LEVEL_TITLES: Record<number, { name: string; emoji: string; color: string }> = {
  1: { name: 'Newcomer', emoji: '🌱', color: '#9CA3AF' },
  6: { name: 'Dreamer', emoji: '💭', color: '#8B5CF6' },
  16: { name: 'Connector', emoji: '🔗', color: '#3B82F6' },
  31: { name: 'Socialite', emoji: '✨', color: '#F59E0B' },
  51: { name: 'Influencer', emoji: '👑', color: '#EF4444' },
  76: { name: 'Legend', emoji: '🏆', color: '#FFD700' },
};

// ═══════════════════════════════════════
// TRUST & RATING TYPES
// ═══════════════════════════════════════

export interface Rating {
  id: string;
  raterId: string;
  ratedUserId: string;
  isPositive: boolean;
  voiceSessionId?: string;
  timestamp: Date;
}

export interface TrustInfo {
  score: number;
  tier: TrustTier;
  label: string;
  color: string;
  totalRatings: number;
}

export type TrustTier = 'trusted' | 'reliable' | 'neutral' | 'caution' | 'restricted';

// ═══════════════════════════════════════
// STREAK TYPES
// ═══════════════════════════════════════

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  multiplier: number;
  nextMultiplier: number;
  daysToNextMultiplier: number;
  isFrozen: boolean;
  canFreeze: boolean;
}

export const STREAK_MULTIPLIERS: Record<number, number> = {
  0: 1.0,
  1: 1.0,
  2: 1.1,
  3: 1.2,
  4: 1.3,
  5: 1.4,
  6: 1.5,
  7: 1.6,
  14: 1.8,
  30: 2.0,
};

// ═══════════════════════════════════════
// BLOCK TYPES
// ═══════════════════════════════════════

export interface Block {
  id: string;
  blockerId: string;
  blockedUserId: string;
  createdAt: Date;
  mutualUnblock: boolean;
  unblockedAt?: Date;
}

export interface BlockedUser {
  id: string;
  blockerId: string;             // Who blocked
  blockedUserId: string;         // Who was blocked
  username: string;
  displayName?: string;
  avatar?: string;
  avatarUrl?: string;
  blockedAt: Date;
  reason?: BlockReason;
  customReason?: string;
}

export type BlockReason = 'harassment' | 'spam' | 'inappropriate' | 'personal' | 'other';

export const BLOCK_REASONS: { id: BlockReason; label: string; icon: string }[] = [
  { id: 'harassment', label: 'Belästigung', icon: '⚠️' },
  { id: 'spam', label: 'Spam / Werbung', icon: '📩' },
  { id: 'inappropriate', label: 'Unangemessenes Verhalten', icon: '🚩' },
  { id: 'personal', label: 'Persönliche Gründe', icon: '👤' },
  { id: 'other', label: 'Sonstiges', icon: '🚫' },
];

// ═══════════════════════════════════════
// SOCIAL GRAPH TYPES (NEW)
// ═══════════════════════════════════════

/**
 * FOLLOW SYSTEM:
 * - One-sided following (like Twitter/Instagram)
 * - Followers can see when you're active (if not anonymous)
 * - Following doesn't require approval
 */
export interface Follow {
  id: string;
  followerId: string;           // Who is following
  followingId: string;          // Who is being followed
  createdAt: Date;
  notificationsEnabled: boolean; // Get alerts for this user
}

export interface FollowStats {
  followers: number;
  following: number;
  mutualFollows: number;        // Both follow each other
}

/**
 * STAR SYSTEM:
 * - Give stars to boost someone's XP
 * - Limited stars per day (3 free, unlimited for Premium)
 * - Each star = +15 XP for receiver
 */
export interface Star {
  id: string;
  giverId: string;
  receiverId: string;
  amount: number;               // 1-5 stars
  message?: string;             // Optional appreciation message
  xpAwarded: number;            // XP given to receiver
  createdAt: Date;
}

export interface StarStats {
  totalReceived: number;
  totalGiven: number;
  starsAvailableToday: number;  // Resets daily
  maxStarsPerDay: number;       // 3 free, unlimited premium
}

export const STAR_CONFIG = {
  xpPerStar: 15,
  freeStarsPerDay: 3,           // Free users: 3 stars per day
  premiumStarsPerDay: 15,       // Premium users: 15 stars per day
  maxStarsPerUser: 5,           // Max stars to one user per day
  creatorApplicationThreshold: 500, // Stars needed to apply as creator
  creatorMinLevel: 25,          // Minimum level to apply
};

// ═══════════════════════════════════════
// FRIEND TYPES (HANDSHAKE SYSTEM)
// ═══════════════════════════════════════

/**
 * HANDSHAKE FRIENDSHIP:
 * - Requires mutual confirmation (both must accept)
 * - Different from Follow (one-sided)
 * - Friends see each other on Friend-Radar
 */
export interface Friendship {
  id: string;
  users: [string, string];       // Sorted user IDs
  status: FriendshipStatus;
  initiatorId: string;           // Who sent the request
  createdAt: Date;
  acceptedAt?: Date;
  // Handshake tracking
  userAConfirmed: boolean;
  userBConfirmed: boolean;
}

export type FriendshipStatus =
  | 'pending'                    // One side requested
  | 'accepted'                   // Both confirmed (handshake complete)
  | 'declined'                   // One side declined
  | 'blocked';                   // Friendship blocked

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromDisplayName: string;
  fromAvatar?: string;
  fromLevel: number;
  fromTrustScore: number;
  message?: string;              // Optional request message
  createdAt: Date;
  expiresAt: Date;              // Auto-decline after 7 days
}

export interface Friend {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  trustScore: number;
  level: number;
  isOnline: boolean;
  lastSeen: Date;
  distance?: number;
  isNearby: boolean;
  // Social Graph additions
  isFollowing: boolean;          // Do I follow them?
  isFollowedBy: boolean;         // Do they follow me?
  starsGivenToThem: number;      // Stars I gave them
  starsReceivedFromThem: number; // Stars they gave me
}

export interface FriendRadarNotification {
  id: string;
  friendId: string;
  friendName: string;
  distance: number;
  timestamp: Date;
  seen: boolean;
}

// ═══════════════════════════════════════
// CHAT GATEKEEPER TYPES (NEW)
// ═══════════════════════════════════════

/**
 * CHAT GATEKEEPER:
 * - Mandatory interstitial before joining any chat
 * - User chooses: Anonymous or Public identity
 * - Choice persists for that chat session
 */
export interface ChatGatekeeperChoice {
  chatId: string;
  userId: string;
  identityMode: ChatIdentityMode;
  chosenAt: Date;
  expiresAt?: Date;             // Resets after 24h for lounges
}

export type ChatIdentityMode = 'anonymous' | 'public';

export interface ChatGatekeeperConfig {
  showBeforeChat: boolean;
  showBeforeLounge: boolean;
  showBeforeVoice: boolean;
  rememberChoice: boolean;       // Remember for same chat
  choiceExpiresHours: number;    // 24h default
}

export const DEFAULT_GATEKEEPER_CONFIG: ChatGatekeeperConfig = {
  showBeforeChat: true,
  showBeforeLounge: true,
  showBeforeVoice: true,
  rememberChoice: true,
  choiceExpiresHours: 24,
};

// ═══════════════════════════════════════
// LOUNGE TYPES
// ═══════════════════════════════════════

export interface Lounge {
  id: string;
  hostId: string;
  hostName: string;
  name: string;
  description?: string;
  location: Location;
  radius: number;
  maxMembers: number;
  currentMembers: string[];
  isPrivate: boolean;
  inviteCode?: string;
  isPremiumOnly: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export interface LoungePreview {
  id: string;
  name: string;
  hostName: string;
  memberCount: number;
  maxMembers: number;
  distance: number;
  isPrivate: boolean;
  isPremiumOnly: boolean;
}

// ═══════════════════════════════════════
// MODERATION TYPES
// ═══════════════════════════════════════

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: ReportReason;
  description?: string;
  voiceSessionId?: string;
  status: 'pending' | 'reviewed' | 'confirmed' | 'dismissed';
  createdAt: Date;
  reviewedAt?: Date;
}

export type ReportReason =
  | 'harassment'
  | 'spam'
  | 'inappropriate'
  | 'threats'
  | 'impersonation'
  | 'other';

export interface BanRecord {
  id: string;
  userId: string;
  type: 'shadow_mute' | 'temp_ban' | 'perm_ban';
  reason: string;
  duration: number; // in minutes, 0 = permanent
  createdAt: Date;
  expiresAt?: Date;
  appealStatus?: 'none' | 'pending' | 'approved' | 'denied';
}

// ═══════════════════════════════════════
// PREMIUM TYPES
// ═══════════════════════════════════════

export interface PremiumFeatures {
  xpBoost: number;
  exactDistance: boolean;
  profileStalker: boolean;
  priorityListing: boolean;
  streakFreeze: number;
  premiumLounges: boolean;
  noAds: boolean;
  extendedRadius: number;
}

export const PREMIUM_FEATURES: PremiumFeatures = {
  xpBoost: 1.5,
  exactDistance: true,
  profileStalker: true,
  priorityListing: true,
  streakFreeze: 1,
  premiumLounges: true,
  noAds: true,
  extendedRadius: 10000,
};

export interface ProfileVisitor {
  id: string;
  userId: string;
  visitorId: string;
  visitorName: string;
  visitorAvatar?: string;
  timestamp: Date;
}

// ═══════════════════════════════════════
// LOCATION TYPES
// ═══════════════════════════════════════

export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

export interface NearbyUser {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  avatarUrl?: string;
  distance: number;
  visibilityMode: VisibilityMode;
  lastSeen: Date;
  level?: number;
  trustScore?: number;
  isPremium?: boolean;
  isActive?: boolean;
}

export interface HotspotZone {
  id: string;
  center: Location;
  radius: number;
  userCount: number;
  isFlashEvent: boolean;
  eventName?: string;
  xpMultiplier: number;
}

// ═══════════════════════════════════════
// CONNECTION & CHAT TYPES
// ═══════════════════════════════════════

export interface Connection {
  id: string;
  userAId: string;
  userBId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  initiatedBy: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  connectionId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'location' | 'voice_invite';
  createdAt: Date;
  readAt?: Date;
}

export interface Chat {
  connection: Connection;
  otherUser: NearbyUser;
  lastMessage?: Message;
  unreadCount: number;
}

// ═══════════════════════════════════════
// VOICE CHAT TYPES
// ═══════════════════════════════════════

export interface VoiceSession {
  id: string;
  participants: [string, string];
  startedAt: Date;
  endedAt?: Date;
  duration: number; // in seconds
  xpAwarded: boolean;
}

export interface VoiceInvite {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

// ═══════════════════════════════════════
// NOTIFICATION TYPES
// ═══════════════════════════════════════

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'friend_nearby'
  | 'voice_invite'
  | 'level_up'
  | 'streak_warning'
  | 'streak_lost'
  | 'trust_change'
  | 'moderation'
  | 'flash_event'
  | 'lounge_invite';

// ═══════════════════════════════════════
// FLASH EVENT TYPES
// ═══════════════════════════════════════

export interface FlashEvent {
  id: string;
  name: string;
  description: string;
  location: Location;
  radius: number;
  xpMultiplier: number;
  startsAt: Date;
  endsAt: Date;
  participantCount: number;
}

// ═══════════════════════════════════════
// STARS PROGRAM TYPES (VIP/INFLUENCER)
// ═══════════════════════════════════════

/**
 * STAR VERIFICATION STATUS:
 * - Exclusive program for public figures, influencers, entrepreneurs
 * - Requires manual verification by admin team
 * - Verified users get the Nebula Badge
 */
export type StarVerificationStatus =
  | 'none'           // Never applied
  | 'pending'        // Application submitted, awaiting review
  | 'under_review'   // Admin is actively reviewing
  | 'approved'       // Verified Star
  | 'rejected'       // Application denied
  | 'suspended';     // Verification revoked

export interface StarApplication {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  email: string;

  // Application Details
  category: StarCategory;
  description: string;           // Why they should be verified
  followerCount: number;         // Claimed follower count

  // Verification Documents
  socialMediaLinks: SocialMediaLink[];
  verificationDocuments: VerificationDocument[];

  // Processing
  status: StarVerificationStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;           // Admin ID
  reviewNotes?: string;
  rejectionReason?: string;

  // Auto-generated
  riskScore?: number;            // AI-generated risk assessment
}

export type StarCategory =
  | 'influencer'
  | 'entrepreneur'
  | 'artist'
  | 'athlete'
  | 'musician'
  | 'actor'
  | 'journalist'
  | 'politician'
  | 'scientist'
  | 'creator'
  | 'other';

export interface SocialMediaLink {
  platform: SocialPlatform;
  url: string;
  username: string;
  followerCount?: number;
  verified?: boolean;            // Verified on that platform
}

export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'twitter'
  | 'linkedin'
  | 'twitch'
  | 'spotify'
  | 'other';

export interface VerificationDocument {
  id: string;
  type: DocumentType;
  url: string;
  fileName: string;
  uploadedAt: Date;
  verifiedAt?: Date;
}

export type DocumentType =
  | 'id_document'
  | 'business_card'
  | 'press_article'
  | 'verification_screenshot'
  | 'other';

// ═══════════════════════════════════════
// VERIFIED STAR PROFILE
// ═══════════════════════════════════════

export interface VerifiedStar {
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;

  // Star Status
  verifiedAt: Date;
  category: StarCategory;
  nebulaTier: NebulaTier;

  // Custom Branding
  customBio?: string;
  customBadgeColor?: string;     // Hex color for badge
  profileBackground?: string;    // Custom background URL

  // Permissions
  permissions: StarPermissions;

  // Analytics
  totalListeners: number;
  totalStarsReceived: number;
  totalEventsHosted: number;
  averageEventRating: number;

  // Activity
  lastEventAt?: Date;
  isLive: boolean;
  currentEventId?: string;
}

export type NebulaTier =
  | 'nebula'         // Standard verified (1k-10k followers)
  | 'supernova'      // Popular (10k-100k followers)
  | 'galaxy'         // Major star (100k-1M followers)
  | 'universe'       // Mega star (1M+ followers)
  | 'founder';       // App founders/owners (special tier)

export interface StarPermissions {
  // Stage Control
  canMuteParticipants: boolean;
  canRemoveParticipants: boolean;
  canManageHandRaise: boolean;
  canPinMessages: boolean;
  canStartRecording: boolean;

  // Voice Lift
  canVoiceLiftUsers: boolean;
  maxVoiceLiftSlots: number;

  // Event Creation
  canCreatePublicEvents: boolean;
  canScheduleEvents: boolean;
  maxEventCapacity: number;
  canChargeForEvents: boolean;

  // Analytics
  hasAdvancedAnalytics: boolean;
  canExportData: boolean;

  // Moderation
  canReportFastTrack: boolean;   // Reports get priority
  hasModeratorSupport: boolean;  // Dedicated mod team
}

export const DEFAULT_STAR_PERMISSIONS: Record<NebulaTier, StarPermissions> = {
  nebula: {
    canMuteParticipants: true,
    canRemoveParticipants: false,
    canManageHandRaise: true,
    canPinMessages: true,
    canStartRecording: false,
    canVoiceLiftUsers: true,
    maxVoiceLiftSlots: 3,
    canCreatePublicEvents: true,
    canScheduleEvents: true,
    maxEventCapacity: 100,
    canChargeForEvents: false,
    hasAdvancedAnalytics: true,
    canExportData: false,
    canReportFastTrack: true,
    hasModeratorSupport: false,
  },
  supernova: {
    canMuteParticipants: true,
    canRemoveParticipants: true,
    canManageHandRaise: true,
    canPinMessages: true,
    canStartRecording: true,
    canVoiceLiftUsers: true,
    maxVoiceLiftSlots: 5,
    canCreatePublicEvents: true,
    canScheduleEvents: true,
    maxEventCapacity: 500,
    canChargeForEvents: true,
    hasAdvancedAnalytics: true,
    canExportData: true,
    canReportFastTrack: true,
    hasModeratorSupport: false,
  },
  galaxy: {
    canMuteParticipants: true,
    canRemoveParticipants: true,
    canManageHandRaise: true,
    canPinMessages: true,
    canStartRecording: true,
    canVoiceLiftUsers: true,
    maxVoiceLiftSlots: 10,
    canCreatePublicEvents: true,
    canScheduleEvents: true,
    maxEventCapacity: 2000,
    canChargeForEvents: true,
    hasAdvancedAnalytics: true,
    canExportData: true,
    canReportFastTrack: true,
    hasModeratorSupport: true,
  },
  universe: {
    canMuteParticipants: true,
    canRemoveParticipants: true,
    canManageHandRaise: true,
    canPinMessages: true,
    canStartRecording: true,
    canVoiceLiftUsers: true,
    maxVoiceLiftSlots: 20,
    canCreatePublicEvents: true,
    canScheduleEvents: true,
    maxEventCapacity: 10000,
    canChargeForEvents: true,
    hasAdvancedAnalytics: true,
    canExportData: true,
    canReportFastTrack: true,
    hasModeratorSupport: true,
  },
  founder: {
    canMuteParticipants: true,
    canRemoveParticipants: true,
    canManageHandRaise: true,
    canPinMessages: true,
    canStartRecording: true,
    canVoiceLiftUsers: true,
    maxVoiceLiftSlots: 999,
    canCreatePublicEvents: true,
    canScheduleEvents: true,
    maxEventCapacity: 999999,
    canChargeForEvents: true,
    hasAdvancedAnalytics: true,
    canExportData: true,
    canReportFastTrack: true,
    hasModeratorSupport: true,
  },
};

// ═══════════════════════════════════════
// STAR EVENT TYPES
// ═══════════════════════════════════════

export interface StarEvent {
  id: string;
  hostId: string;
  hostUsername: string;
  hostDisplayName: string;
  hostAvatar?: string;
  hostTier: NebulaTier;

  // Event Details
  title: string;
  description: string;
  category: EventCategory;
  scheduledAt?: Date;
  startedAt?: Date;
  endedAt?: Date;

  // Capacity
  maxCapacity: number;
  currentListeners: number;
  peakListeners: number;

  // Stage
  stageParticipants: StageParticipant[];
  handRaiseQueue: HandRaiseRequest[];

  // Engagement
  starsReceived: number;
  chatMessages: number;

  // Settings
  isPublic: boolean;
  isRecording: boolean;
  isPinned: boolean;              // Featured on home
  xpMultiplier: number;
}

export type EventCategory =
  | 'qa'
  | 'talk'
  | 'interview'
  | 'music'
  | 'gaming'
  | 'education'
  | 'business'
  | 'casual'
  | 'other';

export interface StageParticipant {
  id: string;
  oderId: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: 'host' | 'co_host' | 'speaker' | 'voice_lifted';
  isMuted: boolean;
  isSpeaking: boolean;
  joinedStageAt: Date;
  voiceLiftedBy?: string;        // If voice lifted, by whom
  voiceLiftExpiresAt?: Date;     // Voice lift is temporary
}

export interface HandRaiseRequest {
  id: string;
  oderId: string;
  username: string;
  displayName: string;
  avatar?: string;
  requestedAt: Date;
  message?: string;              // Why they want to speak
}

// ═══════════════════════════════════════
// VOICE LIFT SYSTEM
// ═══════════════════════════════════════

export interface VoiceLift {
  id: string;
  eventId: string;
  starId: string;                // Star who lifted the user
  liftedUserId: string;
  liftedUsername: string;

  // Duration
  startedAt: Date;
  duration: number;              // In seconds (default 60s)
  expiresAt: Date;

  // Status
  status: 'active' | 'expired' | 'ended_early';
  endedBy?: 'timeout' | 'star' | 'user';
}

export const VOICE_LIFT_CONFIG = {
  defaultDuration: 60,           // 60 seconds default
  maxDuration: 300,              // 5 minutes max
  cooldownBetweenLifts: 300,     // 5 minutes between being lifted
};

// ═══════════════════════════════════════
// STAR ANALYTICS
// ═══════════════════════════════════════

export interface StarAnalytics {
  userId: string;
  period: 'day' | 'week' | 'month' | 'all_time';

  // Audience
  totalListeners: number;
  uniqueListeners: number;
  averageListenDuration: number; // In minutes
  peakConcurrentListeners: number;

  // Engagement
  totalStarsReceived: number;
  starsValue: number;            // Monetary equivalent
  totalChatMessages: number;
  averageEngagementRate: number; // %

  // Events
  eventsHosted: number;
  totalEventDuration: number;    // In minutes
  averageEventDuration: number;

  // Growth
  newFollowers: number;
  followerGrowthRate: number;    // %

  // Top Supporters
  topSupporters: TopSupporter[];

  // Demographics
  listenerLocations: LocationBreakdown[];
  listenerAgeGroups: AgeBreakdown[];
}

export interface TopSupporter {
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  starsGiven: number;
  eventsAttended: number;
  totalListenTime: number;
}

export interface LocationBreakdown {
  region: string;
  country: string;
  percentage: number;
}

export interface AgeBreakdown {
  ageGroup: string;
  percentage: number;
}

// ═══════════════════════════════════════
// NEWS TICKER (STAR EVENTS)
// ═══════════════════════════════════════

export interface NewsTickerItem {
  id: string;
  type: 'star_live' | 'star_event' | 'star_milestone' | 'trending';
  title: string;
  subtitle?: string;
  starId?: string;
  starUsername?: string;
  starAvatar?: string;
  starTier?: NebulaTier;
  eventId?: string;
  link?: string;
  priority: number;              // Higher = more important
  createdAt: Date;
  expiresAt: Date;
}

// ═══════════════════════════════════════
// SCHEDULED EVENTS (FOR FOLLOWERS)
// ═══════════════════════════════════════

export interface ScheduledEvent {
  id: string;
  hostId: string;
  hostUsername: string;
  hostDisplayName: string;
  hostAvatar?: string;
  hostTier: NebulaTier;

  // Event Info
  title: string;
  description?: string;
  category: EventCategory;
  scheduledAt: Date;
  estimatedDuration: number;     // In minutes

  // Reminder
  interestedCount: number;       // Users who want to be notified
  reminderSentAt?: Date;

  // Status
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
}

// ═══════════════════════════════════════
// CREATOR ELIGIBILITY (FOR NORMAL USERS)
// ═══════════════════════════════════════

export interface CreatorEligibility {
  userId: string;

  // Current Progress
  totalStarsReceived: number;
  currentLevel: number;
  totalVoiceMinutes: number;
  positiveRatingsPercentage: number;

  // Requirements
  starsRequired: number;         // 500 stars
  levelRequired: number;         // Level 25
  voiceMinutesRequired: number;  // 120 minutes (2 hours)
  minPositiveRatings: number;    // 80%

  // Progress Percentages
  starsProgress: number;
  levelProgress: number;
  voiceProgress: number;
  ratingsProgress: number;

  // Overall
  isEligible: boolean;
  canApply: boolean;
  blockedReason?: string;
}

export const CREATOR_REQUIREMENTS = {
  starsRequired: 500,
  levelRequired: 25,
  voiceMinutesRequired: 120,
  minPositiveRatings: 80,
};
