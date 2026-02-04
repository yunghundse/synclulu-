/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AEGIS NAME SCANNER v5.5
 * "Profilnamen-Validator mit dynamischer Blacklist"
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Automatisches Scannen von Profilnamen auf:
 * - Explizite Begriffe
 * - Hate Speech
 * - Grooming-Signale
 * - Impersonation (admin, support, etc.)
 * - Spam-Patterns
 *
 * Legal Shield:
 * - AGG-konform durch objektive Kriterien
 * - Transparente Ablehnungsgründe
 *
 * @version 5.5.0
 */

import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { addAuditLogEntry } from './legalAudit';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

export type BlockedCategory =
  | 'EXPLICIT'
  | 'HATE_SPEECH'
  | 'GROOMING'
  | 'IMPERSONATION'
  | 'SPAM'
  | 'OTHER';

export type BlockedSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface BlockedKeyword {
  id?: string;
  keyword: string;
  category: BlockedCategory;
  severity: BlockedSeverity;
  isRegex: boolean;
  isActive: boolean;
}

export interface NameValidationResult {
  isValid: boolean;
  isBlocked: boolean;
  reason?: string;
  blockedKeyword?: string;
  category?: BlockedCategory;
  severity?: BlockedSeverity;
  suggestions?: string[];
}

// ═══════════════════════════════════════
// BUILT-IN BLACKLIST
// Sofort aktiv, ohne Datenbank
// ═══════════════════════════════════════

const BUILT_IN_BLACKLIST: BlockedKeyword[] = [
  // ═══════════════════════════════════════
  // IMPERSONATION (Kritisch)
  // ═══════════════════════════════════════
  { keyword: 'admin', category: 'IMPERSONATION', severity: 'CRITICAL', isRegex: false, isActive: true },
  { keyword: 'administrator', category: 'IMPERSONATION', severity: 'CRITICAL', isRegex: false, isActive: true },
  { keyword: 'moderator', category: 'IMPERSONATION', severity: 'CRITICAL', isRegex: false, isActive: true },
  { keyword: 'support', category: 'IMPERSONATION', severity: 'CRITICAL', isRegex: false, isActive: true },
  { keyword: 'helpdesk', category: 'IMPERSONATION', severity: 'CRITICAL', isRegex: false, isActive: true },
  { keyword: 'official', category: 'IMPERSONATION', severity: 'HIGH', isRegex: false, isActive: true },
  { keyword: 'synclulu_team', category: 'IMPERSONATION', severity: 'CRITICAL', isRegex: false, isActive: true },
  { keyword: 'synclulu_support', category: 'IMPERSONATION', severity: 'CRITICAL', isRegex: false, isActive: true },
  { keyword: 'syncluluapp', category: 'IMPERSONATION', severity: 'HIGH', isRegex: false, isActive: true },
  { keyword: 'system', category: 'IMPERSONATION', severity: 'HIGH', isRegex: false, isActive: true },
  { keyword: 'bot', category: 'IMPERSONATION', severity: 'MEDIUM', isRegex: false, isActive: true },
  { keyword: 'verified', category: 'IMPERSONATION', severity: 'HIGH', isRegex: false, isActive: true },

  // ═══════════════════════════════════════
  // EXPLICIT (Hoch)
  // ═══════════════════════════════════════
  { keyword: 'porn', category: 'EXPLICIT', severity: 'HIGH', isRegex: false, isActive: true },
  { keyword: 'xxx', category: 'EXPLICIT', severity: 'HIGH', isRegex: false, isActive: true },
  { keyword: 'sex', category: 'EXPLICIT', severity: 'MEDIUM', isRegex: false, isActive: true },
  { keyword: 'nude', category: 'EXPLICIT', severity: 'HIGH', isRegex: false, isActive: true },
  { keyword: 'naked', category: 'EXPLICIT', severity: 'HIGH', isRegex: false, isActive: true },
  { keyword: 'nsfw', category: 'EXPLICIT', severity: 'HIGH', isRegex: false, isActive: true },
  { keyword: 'onlyfans', category: 'EXPLICIT', severity: 'HIGH', isRegex: false, isActive: true },
  { keyword: 'escort', category: 'EXPLICIT', severity: 'CRITICAL', isRegex: false, isActive: true },

  // ═══════════════════════════════════════
  // HATE SPEECH (Kritisch)
  // ═══════════════════════════════════════
  { keyword: 'nazi', category: 'HATE_SPEECH', severity: 'CRITICAL', isRegex: false, isActive: true },
  { keyword: 'hitler', category: 'HATE_SPEECH', severity: 'CRITICAL', isRegex: false, isActive: true },
  { keyword: 'heil', category: 'HATE_SPEECH', severity: 'CRITICAL', isRegex: false, isActive: true },
  { keyword: 'white_power', category: 'HATE_SPEECH', severity: 'CRITICAL', isRegex: false, isActive: true },
  { keyword: 'kkk', category: 'HATE_SPEECH', severity: 'CRITICAL', isRegex: false, isActive: true },
  { keyword: '1488', category: 'HATE_SPEECH', severity: 'CRITICAL', isRegex: false, isActive: true },
  { keyword: '88', category: 'HATE_SPEECH', severity: 'HIGH', isRegex: false, isActive: true },

  // ═══════════════════════════════════════
  // GROOMING SIGNALS (Kritisch)
  // ═══════════════════════════════════════
  { keyword: 'daddy4', category: 'GROOMING', severity: 'CRITICAL', isRegex: true, isActive: true },
  { keyword: 'sugar_?daddy', category: 'GROOMING', severity: 'HIGH', isRegex: true, isActive: true },
  { keyword: 'looking_?for_?young', category: 'GROOMING', severity: 'CRITICAL', isRegex: true, isActive: true },
  { keyword: 'teen_?lover', category: 'GROOMING', severity: 'CRITICAL', isRegex: true, isActive: true },
  { keyword: 'young_?girls', category: 'GROOMING', severity: 'CRITICAL', isRegex: true, isActive: true },
  { keyword: 'young_?boys', category: 'GROOMING', severity: 'CRITICAL', isRegex: true, isActive: true },

  // ═══════════════════════════════════════
  // SPAM PATTERNS (Medium)
  // ═══════════════════════════════════════
  { keyword: 'follow_?me', category: 'SPAM', severity: 'MEDIUM', isRegex: true, isActive: true },
  { keyword: 'add_?me', category: 'SPAM', severity: 'LOW', isRegex: true, isActive: true },
  { keyword: 'free_?money', category: 'SPAM', severity: 'HIGH', isRegex: true, isActive: true },
  { keyword: 'crypto_?invest', category: 'SPAM', severity: 'HIGH', isRegex: true, isActive: true },
  { keyword: 'click_?here', category: 'SPAM', severity: 'MEDIUM', isRegex: true, isActive: true },
  { keyword: 'earn_?money', category: 'SPAM', severity: 'MEDIUM', isRegex: true, isActive: true },
];

// German toxic words (from guardianMiddleware)
const GERMAN_TOXIC = [
  'scheiß', 'fick', 'hurensohn', 'wichser', 'fotze', 'arsch',
  'schwuchtel', 'missgeburt', 'behindert', 'spast', 'mongo',
  'kanake', 'kümmeltürke', 'negger',
];

const ENGLISH_TOXIC = [
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'nigger',
  'faggot', 'retard', 'whore', 'slut', 'kike', 'chink',
];

// Add toxic words to blacklist
GERMAN_TOXIC.forEach(word => {
  BUILT_IN_BLACKLIST.push({
    keyword: word,
    category: 'EXPLICIT',
    severity: 'HIGH',
    isRegex: false,
    isActive: true,
  });
});

ENGLISH_TOXIC.forEach(word => {
  BUILT_IN_BLACKLIST.push({
    keyword: word,
    category: 'EXPLICIT',
    severity: 'HIGH',
    isRegex: false,
    isActive: true,
  });
});

// ═══════════════════════════════════════
// VALIDATION LOGIC
// ═══════════════════════════════════════

/**
 * Check if name matches a blocked keyword
 */
function checkAgainstKeyword(name: string, keyword: BlockedKeyword): boolean {
  const lowerName = name.toLowerCase().replace(/[_\-\s\.]/g, '');

  if (keyword.isRegex) {
    try {
      const regex = new RegExp(keyword.keyword.replace(/_/g, '[_\\-\\s\\.]*'), 'i');
      return regex.test(lowerName);
    } catch {
      return false;
    }
  }

  // Exact match (case insensitive, normalized)
  const normalizedKeyword = keyword.keyword.toLowerCase().replace(/[_\-\s\.]/g, '');
  return lowerName.includes(normalizedKeyword);
}

/**
 * Load additional keywords from database
 */
async function loadDatabaseKeywords(): Promise<BlockedKeyword[]> {
  try {
    const keywordsRef = collection(db, 'blocked_keywords');
    const q = query(keywordsRef, where('isActive', '==', true));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      keyword: doc.data().keyword,
      category: doc.data().category,
      severity: doc.data().severity,
      isRegex: doc.data().isRegex || false,
      isActive: true,
    }));
  } catch (error) {
    console.warn('Could not load database keywords:', error);
    return [];
  }
}

// ═══════════════════════════════════════
// MAIN VALIDATION FUNCTION
// ═══════════════════════════════════════

/**
 * Validate a profile name against the blacklist
 */
export async function validateProfileName(
  name: string,
  userId?: string
): Promise<NameValidationResult> {
  // Basic validation
  if (!name || name.trim().length === 0) {
    return {
      isValid: false,
      isBlocked: false,
      reason: 'Name darf nicht leer sein.',
    };
  }

  if (name.length < 3) {
    return {
      isValid: false,
      isBlocked: false,
      reason: 'Name muss mindestens 3 Zeichen haben.',
    };
  }

  if (name.length > 20) {
    return {
      isValid: false,
      isBlocked: false,
      reason: 'Name darf maximal 20 Zeichen haben.',
    };
  }

  // Character validation (alphanumeric + underscore + some unicode)
  if (!/^[\w\u00C0-\u024F\u1E00-\u1EFF]+$/i.test(name.replace(/[_\-\.]/g, ''))) {
    return {
      isValid: false,
      isBlocked: false,
      reason: 'Nur Buchstaben, Zahlen und Unterstriche erlaubt.',
    };
  }

  // Check for excessive numbers (spam pattern)
  const numberRatio = (name.match(/\d/g) || []).length / name.length;
  if (numberRatio > 0.5 && name.length > 5) {
    return {
      isValid: false,
      isBlocked: true,
      reason: 'Zu viele Zahlen im Namen.',
      category: 'SPAM',
      severity: 'LOW',
    };
  }

  // Check for repeated characters (spam pattern)
  if (/(.)\1{3,}/i.test(name)) {
    return {
      isValid: false,
      isBlocked: true,
      reason: 'Zu viele wiederholte Zeichen.',
      category: 'SPAM',
      severity: 'LOW',
    };
  }

  // Load database keywords
  const dbKeywords = await loadDatabaseKeywords();
  const allKeywords = [...BUILT_IN_BLACKLIST, ...dbKeywords];

  // Check against all keywords
  for (const keyword of allKeywords) {
    if (!keyword.isActive) continue;

    if (checkAgainstKeyword(name, keyword)) {
      // Log blocked attempt
      if (userId) {
        await addAuditLogEntry({
          userId,
          action: 'name_blocked',
          category: 'content_moderation',
          severity: keyword.severity === 'CRITICAL' ? 'critical' : 'warning',
          details: {
            attemptedName: name,
            blockedKeyword: keyword.keyword,
            category: keyword.category,
            severity: keyword.severity,
          },
        });
      }

      return {
        isValid: false,
        isBlocked: true,
        reason: getBlockReason(keyword.category),
        blockedKeyword: keyword.keyword,
        category: keyword.category,
        severity: keyword.severity,
        suggestions: generateNameSuggestions(name),
      };
    }
  }

  return {
    isValid: true,
    isBlocked: false,
  };
}

/**
 * Get user-friendly block reason
 */
function getBlockReason(category: BlockedCategory): string {
  switch (category) {
    case 'EXPLICIT':
      return 'Dieser Name enthält unangemessene Begriffe.';
    case 'HATE_SPEECH':
      return 'Dieser Name verstößt gegen unsere Community-Richtlinien.';
    case 'GROOMING':
      return 'Dieser Name ist nicht erlaubt.';
    case 'IMPERSONATION':
      return 'Dieser Name könnte andere User irreführen.';
    case 'SPAM':
      return 'Dieser Name sieht nach Spam aus.';
    default:
      return 'Dieser Name ist nicht erlaubt.';
  }
}

/**
 * Generate alternative name suggestions
 */
function generateNameSuggestions(blockedName: string): string[] {
  const suggestions: string[] = [];

  // Remove problematic parts and suggest alternatives
  const cleanName = blockedName
    .replace(/[0-9]+/g, '')
    .replace(/[_\-\.]+/g, '')
    .slice(0, 10);

  if (cleanName.length >= 3) {
    suggestions.push(cleanName);
    suggestions.push(`${cleanName}_${Math.floor(Math.random() * 100)}`);
  }

  // Add random suggestions
  const prefixes = ['cool', 'super', 'happy', 'magic', 'star'];
  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  suggestions.push(`${randomPrefix}_user_${Math.floor(Math.random() * 1000)}`);

  return suggestions.slice(0, 3);
}

// ═══════════════════════════════════════
// ADMIN FUNCTIONS
// ═══════════════════════════════════════

/**
 * Add a new keyword to the database blacklist
 */
export async function addBlockedKeyword(params: {
  keyword: string;
  category: BlockedCategory;
  severity: BlockedSeverity;
  isRegex?: boolean;
  addedBy: string;
}): Promise<boolean> {
  try {
    await addDoc(collection(db, 'blocked_keywords'), {
      keyword: params.keyword.toLowerCase(),
      category: params.category,
      severity: params.severity,
      isRegex: params.isRegex || false,
      isActive: true,
      addedBy: params.addedBy,
      createdAt: serverTimestamp(),
    });

    await addAuditLogEntry({
      userId: params.addedBy,
      action: 'keyword_added',
      category: 'moderation',
      severity: 'info',
      details: {
        keyword: params.keyword,
        category: params.category,
        severity: params.severity,
      },
    });

    return true;
  } catch (error) {
    console.error('Error adding blocked keyword:', error);
    return false;
  }
}

/**
 * Quick validate without database (for real-time input)
 */
export function quickValidateName(name: string): NameValidationResult {
  if (!name || name.length < 3) {
    return { isValid: false, isBlocked: false };
  }

  // Only check built-in list for speed
  for (const keyword of BUILT_IN_BLACKLIST) {
    if (keyword.severity === 'CRITICAL' && checkAgainstKeyword(name, keyword)) {
      return {
        isValid: false,
        isBlocked: true,
        reason: 'Dieser Name ist nicht erlaubt.',
        category: keyword.category,
      };
    }
  }

  return { isValid: true, isBlocked: false };
}

// ═══════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════

export default {
  validateProfileName,
  quickValidateName,
  addBlockedKeyword,
  BUILT_IN_BLACKLIST,
};
