/**
 * GUARDIAN MIDDLEWARE v3.5
 * "Der unsichtbare Bodyguard"
 *
 * Content-Filtering & Safety-Checks für alle User-Inputs
 *
 * @version 3.5.0
 */

import { addAuditLogEntry } from './legalAudit';

// ═══════════════════════════════════════
// BLACKLIST (Erweiterbar)
// ═══════════════════════════════════════

const TOXIC_PATTERNS = {
  // German
  de: [
    'scheiß', 'fick', 'hurensohn', 'wichser', 'fotze', 'arsch',
    'nazi', 'heil', 'negger', 'schwuchtel', 'missgeburt',
    'behindert', 'spast', 'mongo', 'kanake', 'kümmeltürke',
  ],
  // English
  en: [
    'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'nigger',
    'faggot', 'retard', 'whore', 'slut', 'kike', 'chink',
  ],
  // Threats
  threats: [
    'umbringen', 'töten', 'ermorden', 'kill', 'murder', 'die',
    'droh', 'threat', 'hurt', 'attack', 'schlag', 'verprügel',
  ],
};

// Aggression keywords for voice analysis
const AGGRESSION_KEYWORDS = [
  'droh', 'töte', 'umbring', 'schlag', 'hass', 'verrecke',
  'kill', 'threat', 'hurt', 'attack', 'hate', 'die',
];

// ═══════════════════════════════════════
// CONTENT FILTERING
// ═══════════════════════════════════════

/**
 * Filter toxic content from text
 * Returns cleaned text with censored words
 */
export function filterContent(text: string): {
  cleanText: string;
  wasCensored: boolean;
  censoredWords: string[];
} {
  if (!text) return { cleanText: '', wasCensored: false, censoredWords: [] };

  let cleanText = text;
  const censoredWords: string[] = [];

  // Combine all patterns
  const allPatterns = [
    ...TOXIC_PATTERNS.de,
    ...TOXIC_PATTERNS.en,
    ...TOXIC_PATTERNS.threats,
  ];

  allPatterns.forEach(word => {
    const regex = new RegExp(word, 'gi');
    if (regex.test(cleanText)) {
      censoredWords.push(word);
      cleanText = cleanText.replace(regex, '*'.repeat(word.length));
    }
  });

  return {
    cleanText,
    wasCensored: censoredWords.length > 0,
    censoredWords,
  };
}

/**
 * Check if text contains threats
 */
export function containsThreats(text: string): boolean {
  const lowerText = text.toLowerCase();
  return TOXIC_PATTERNS.threats.some(word => lowerText.includes(word));
}

/**
 * Calculate toxicity score (0.0 - 1.0)
 */
export function calculateToxicityScore(text: string): number {
  if (!text) return 0;

  const lowerText = text.toLowerCase();
  let score = 0;
  let matches = 0;

  // Check all patterns
  const allPatterns = [
    ...TOXIC_PATTERNS.de,
    ...TOXIC_PATTERNS.en,
    ...TOXIC_PATTERNS.threats,
  ];

  allPatterns.forEach(word => {
    if (lowerText.includes(word)) {
      matches++;
      // Threats are weighted more heavily
      if (TOXIC_PATTERNS.threats.includes(word)) {
        score += 0.3;
      } else {
        score += 0.1;
      }
    }
  });

  // Excessive caps detection (shouting)
  const capsRatio = (text.match(/[A-Z]/g) || []).length / Math.max(text.length, 1);
  if (capsRatio > 0.7 && text.length > 10) {
    score += 0.2;
  }

  // Repeated characters (spam/aggression)
  if (/(.)\1{4,}/i.test(text)) {
    score += 0.15;
  }

  // Multiple exclamation marks
  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount > 3) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}

// ═══════════════════════════════════════
// SAFETY CHECK MIDDLEWARE
// ═══════════════════════════════════════

export interface SafetyCheckResult {
  isAllowed: boolean;
  action: 'allow' | 'warn' | 'block';
  reason?: string;
  toxicityScore: number;
  cleanedContent?: string;
  flaggedWords?: string[];
}

/**
 * Main safety check function for all content
 */
export async function sanctuarySafetyCheck(params: {
  userId: string;
  content: string;
  contentType: 'username' | 'bio' | 'message' | 'comment';
}): Promise<SafetyCheckResult> {
  const { userId, content, contentType } = params;

  // 1. Filter content
  const { cleanText, wasCensored, censoredWords } = filterContent(content);

  // 2. Calculate toxicity
  const toxicityScore = calculateToxicityScore(content);

  // 3. Check for threats
  const hasThreat = containsThreats(content);

  // 4. Determine action
  let action: 'allow' | 'warn' | 'block' = 'allow';
  let reason: string | undefined;

  if (hasThreat || toxicityScore >= 0.8) {
    action = 'block';
    reason = 'Bedrohlicher oder stark toxischer Inhalt erkannt.';
  } else if (wasCensored || toxicityScore >= 0.4) {
    action = 'warn';
    reason = 'Potenziell unangemessener Inhalt erkannt.';
  }

  // 5. Log if flagged
  if (action !== 'allow') {
    await addAuditLogEntry({
      userId,
      action: action === 'block' ? 'content_blocked' : 'content_flagged',
      category: 'content_moderation',
      severity: action === 'block' ? 'critical' : 'warning',
      details: {
        contentType,
        toxicityScore,
        flaggedWords: censoredWords,
        action,
        reason,
      },
    });
  }

  return {
    isAllowed: action !== 'block',
    action,
    reason,
    toxicityScore,
    cleanedContent: cleanText,
    flaggedWords: censoredWords,
  };
}

// ═══════════════════════════════════════
// PROFILE VALIDATION
// ═══════════════════════════════════════

/**
 * Validate username
 */
export function validateUsername(username: string): {
  isValid: boolean;
  error?: string;
} {
  // Length check
  if (username.length < 3) {
    return { isValid: false, error: 'Username muss mindestens 3 Zeichen haben.' };
  }
  if (username.length > 20) {
    return { isValid: false, error: 'Username darf maximal 20 Zeichen haben.' };
  }

  // Pattern check (alphanumeric + underscore)
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { isValid: false, error: 'Nur Buchstaben, Zahlen und Unterstriche erlaubt.' };
  }

  // Toxicity check
  const { wasCensored } = filterContent(username);
  if (wasCensored) {
    return { isValid: false, error: 'Dieser Username ist nicht erlaubt.' };
  }

  return { isValid: true };
}

/**
 * Validate bio
 */
export function validateBio(bio: string): {
  isValid: boolean;
  cleanedBio: string;
  warning?: string;
} {
  // Length check
  if (bio.length > 150) {
    return {
      isValid: false,
      cleanedBio: bio,
      warning: 'Bio darf maximal 150 Zeichen haben.',
    };
  }

  // Filter content
  const { cleanText, wasCensored } = filterContent(bio);

  return {
    isValid: true,
    cleanedBio: cleanText,
    warning: wasCensored ? 'Einige Wörter wurden zensiert.' : undefined,
  };
}

// ═══════════════════════════════════════
// AUDIO AGGRESSION ANALYSIS
// ═══════════════════════════════════════

export interface AudioAggressionResult {
  score: number;
  shouldRecord: boolean;
  categories: string[];
  transcript?: string;
}

/**
 * Analyze audio transcript for aggression
 * Used by Ghost Recorder feature
 */
export function analyzeAudioAggression(params: {
  transcript: string;
  volumeLevel?: number; // 0.0 - 1.0
  speechRate?: number; // words per minute
}): AudioAggressionResult {
  const { transcript, volumeLevel = 0.5, speechRate = 120 } = params;

  const categories: string[] = [];
  let score = 0;

  // Check transcript for keywords
  const lowerTranscript = transcript.toLowerCase();
  AGGRESSION_KEYWORDS.forEach(keyword => {
    if (lowerTranscript.includes(keyword)) {
      categories.push('verbal_aggression');
      score += 0.25;
    }
  });

  // High volume suggests shouting
  if (volumeLevel > 0.8) {
    categories.push('elevated_voice');
    score += 0.2;
  }

  // Fast speech rate suggests agitation
  if (speechRate > 180) {
    categories.push('rapid_speech');
    score += 0.15;
  }

  // Calculate toxicity of transcript
  const toxicity = calculateToxicityScore(transcript);
  score += toxicity * 0.4;

  score = Math.min(score, 1.0);

  return {
    score,
    shouldRecord: score > 0.85,
    categories: [...new Set(categories)], // Remove duplicates
    transcript: score > 0.85 ? transcript : undefined, // Only include if recording
  };
}

// ═══════════════════════════════════════
// IMAGE VALIDATION
// ═══════════════════════════════════════

export interface ImageValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Validate profile image
 * In production: integrate with AI moderation API
 */
export async function validateProfileImage(params: {
  userId: string;
  imageUrl: string;
  imageSize: number;
  mimeType?: string;
}): Promise<ImageValidationResult> {
  const { userId, imageUrl, imageSize, mimeType } = params;

  // Size check (max 5MB)
  if (imageSize > 5 * 1024 * 1024) {
    return { isValid: false, reason: 'Bild zu groß (max 5MB).' };
  }

  // Format check
  const validFormats = ['image/jpeg', 'image/png', 'image/webp'];
  if (mimeType && !validFormats.includes(mimeType)) {
    return { isValid: false, reason: 'Ungültiges Bildformat. Erlaubt: JPG, PNG, WebP.' };
  }

  // URL format check
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const hasValidExtension = validExtensions.some(ext =>
    imageUrl.toLowerCase().includes(ext)
  );

  if (!mimeType && !hasValidExtension) {
    return { isValid: false, reason: 'Ungültiges Bildformat.' };
  }

  // In production: Call AI moderation API here
  // Example: Google Cloud Vision, AWS Rekognition, or custom ML model
  // const aiResult = await checkImageWithAI(imageUrl);
  // if (!aiResult.isSafe) return { isValid: false, reason: aiResult.reason };

  // Log validation
  await addAuditLogEntry({
    userId,
    action: 'content_flagged',
    category: 'content_moderation',
    severity: 'info',
    details: {
      type: 'profile_image_validation',
      imageSize,
      mimeType,
      result: 'passed',
    },
  });

  return { isValid: true };
}

// ═══════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════

export default {
  filterContent,
  containsThreats,
  calculateToxicityScore,
  sanctuarySafetyCheck,
  validateUsername,
  validateBio,
  analyzeAudioAggression,
  validateProfileImage,
};
