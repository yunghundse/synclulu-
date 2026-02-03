/**
 * delulu UI Copy - Skeptic Style
 * "Kompetent, leicht arrogant, aber charmant."
 */

export const UI_COPY = {
  // ═══════════════════════════════════════
  // LEVEL SYSTEM
  // ═══════════════════════════════════════

  levelUp: (level: number, title: string) =>
    `Du bist jetzt offiziell weniger irrelevant. Willkommen auf Level ${level}. Dein neuer Titel: ${title}.`,

  levelUpSubtext: 'Deine Lounge wartet.',

  // ═══════════════════════════════════════
  // XP GAINS
  // ═══════════════════════════════════════

  xpGain: (amount: number) => `+${amount} XP`,

  xpGainWithStreak: (amount: number, mult: number) =>
    `+${amount} XP (${mult}x Streak-Bonus, nicht schlecht)`,

  xpGainVoice: (minutes: number, xp: number) =>
    `${minutes} Min Voice = +${xp} XP. Reden zahlt sich aus.`,

  // ═══════════════════════════════════════
  // STREAK SYSTEM
  // ═══════════════════════════════════════

  streakReminder: (days: number) =>
    `${days} Tage Streak. Morgen wirds noch besser – wenn du es schaffst, aufzutauchen.`,

  streakCurrent: (days: number, multiplier: number) =>
    `🔥 ${days} Tage Streak • ${multiplier}x XP Boost`,

  streakLost:
    'Streak verloren. Das war wohl nichts. Aber hey, morgen ist ein neuer Tag – nutze ihn.',

  streakFrozen:
    'Streak eingefroren. Ausnahmsweise. Das nächste Mal musst du schon erscheinen.',

  streakUnstoppable: '🔥🔥 UNSTOPPABLE! Dein Streak ist beeindruckend.',

  streakLegendary: '🏆 LEGENDARY STREAK! Du bist offiziell besessen.',

  // ═══════════════════════════════════════
  // TRUST SCORE
  // ═══════════════════════════════════════

  trustLow:
    'Dein Trust-Score ist im Keller. Vielleicht mal netter sein? Nur so ein Gedanke.',

  trustRecovering:
    'Sieh an, du hast dich zusammengerissen. Dein Trust-Score erholt sich. Weiter so, Champ.',

  trustHigh:
    'Trust-Score auf Maximum. Die Leute mögen dich. Genieß es, solange es anhält.',

  trustTier: {
    trusted: 'TRUSTED',
    reliable: 'RELIABLE',
    neutral: 'NEUTRAL',
    caution: 'CAUTION',
    restricted: 'RESTRICTED',
  },

  // ═══════════════════════════════════════
  // VISIBILITY MODES
  // ═══════════════════════════════════════

  visibility: {
    public: {
      title: 'Alle in Reichweite',
      description: 'Jeder im Radius kann dich sehen',
      hint: 'Alle sehen dich. Kein Verstecken.',
    },
    friends: {
      title: 'Nur meine Freunde',
      description: 'Fremde sehen dich nicht',
      hint: 'Nur deine Freunde sehen dich. Exklusivclub.',
    },
    ghost: {
      title: 'Niemand (Ghost Mode) 👻',
      description: 'Du bist komplett unsichtbar',
      hint: 'Ghost Mode aktiv. Du existierst nicht. Sehr dramatisch.',
    },
  },

  // ═══════════════════════════════════════
  // FRIEND RADAR
  // ═══════════════════════════════════════

  friendRadarNotification: (name: string) =>
    `${name} ist im 10km-Radius. Keine Sorge, er kann dich nicht hören – es sei denn, du willst es.`,

  friendRadarEnabled:
    'Friend-Radar aktiv. Du wirst benachrichtigt, wenn Freunde in der Nähe sind.',

  friendRadarDisabled:
    'Friend-Radar aus. Du willst also überrascht werden? Mutig.',

  // ═══════════════════════════════════════
  // SEARCH RADIUS
  // ═══════════════════════════════════════

  radiusHint: (distance: number) => {
    if (distance >= 5000) return 'Maximale Reichweite. Viel Spaß mit dem Chaos.';
    if (distance <= 100) return 'Nur die Nächsten. Sehr... intim.';
    return `${formatDistance(distance)} Radius. Sollte reichen.`;
  },

  radiusError:
    'Nett versucht, aber die Physik lässt sich nicht austricksen. Wir kalibrieren den Radius neu – bleib entspannt.',

  radiusLabel: 'Suchradius',
  radiusSubtitle: 'Wie weit siehst du andere?',

  // ═══════════════════════════════════════
  // PREMIUM / CATALYST
  // ═══════════════════════════════════════

  premiumUpsell:
    'Hör auf zu schleichen. Hol dir den Catalyst und sieh genau, wer in deiner Nähe ist, bevor sie dich sehen.',

  premiumActivated:
    'Catalyst aktiviert. Du siehst jetzt mehr als die anderen. Nutze es weise – oder nicht, deine Sache.',

  premiumFeatures: {
    xpBoost: '1.5x XP Boost – permanent',
    exactDistance: 'Meter-genaue Distanzanzeige',
    profileStalker: 'Sieh wer dein Profil besucht',
    priorityListing: 'Immer oben in der Liste',
    extendedRadius: '10km statt 5km Reichweite',
    premiumLounges: 'Exklusive Lounges erstellen',
  },

  // ═══════════════════════════════════════
  // MODERATION
  // ═══════════════════════════════════════

  shadowMuted:
    'Deine Vibes sind gerade ziemlich toxic. Wir haben dich mal kurz stummgeschaltet, damit die anderen in Ruhe weiterreden können. Atme mal tief durch.',

  tempBanned: (hours: number) =>
    `OK, das war's erstmal für dich. Du bist für ${hours}h auf Eis gelegt. Nutz die Zeit, um über deine Lebensentscheidungen nachzudenken.`,

  warningIssued:
    'Heads up: Noch ein Ausrutscher und du landest auf der Bank. Deine Entscheidung.',

  appealInfo:
    'Wenn du denkst, dass das ein Fehler war, kannst du Einspruch einlegen. Aber überleg dir gut, was du schreibst.',

  // ═══════════════════════════════════════
  // BLOCK SYSTEM
  // ═══════════════════════════════════════

  userBlocked: (name: string) =>
    `${name} ist jetzt unsichtbar für dich – und du für ${name}. Aus den Augen, aus dem Sinn.`,

  userUnblocked: (name: string) =>
    `${name} ist entblockt. Aber die Karte zeigt euch erst wieder, wenn beide zustimmen. Safety first.`,

  blockListEmpty:
    'Keine blockierten Nutzer. Entweder bist du sehr tolerant, oder sehr neu hier.',

  blockConfirm: (name: string) =>
    `${name} wirklich blockieren? Ihr werdet euch gegenseitig nicht mehr sehen.`,

  // ═══════════════════════════════════════
  // ERRORS
  // ═══════════════════════════════════════

  errors: {
    generic:
      'Irgendwas ist schiefgelaufen. Wahrscheinlich nicht deine Schuld. Wahrscheinlich.',
    network:
      'Keine Verbindung. Das Internet hat dich verlassen, nicht wir.',
    location: 'GPS-Signal verloren. Vielleicht stehst du in einem Bunker?',
    permission:
      'Keine Berechtigung. Du musst uns schon vertrauen, wenn das hier funktionieren soll.',
    rateLimit:
      'Zu viele Anfragen. Chill mal kurz, wir sind auch nur Server.',
    auth: 'Session abgelaufen. Meld dich nochmal an, Fremder.',
  },

  // ═══════════════════════════════════════
  // EMPTY STATES
  // ═══════════════════════════════════════

  empty: {
    friends:
      'Noch keine Freunde. Das lässt sich ändern – geh raus und quatsch Leute an.',
    nearbyUsers:
      'Niemand in Reichweite. Entweder bist du allein, oder alle verstecken sich vor dir.',
    messages: 'Keine Nachrichten. Die Stille ist ohrenbetäubend.',
    notifications:
      'Keine Benachrichtigungen. Entweder läuft alles rund, oder niemand denkt an dich.',
    lounges:
      'Keine Lounges in der Nähe. Zeit, selbst eine zu erstellen?',
    stats:
      'Noch keine Stats. Fang an zu reden, dann gibts auch was zu zeigen.',
  },

  // ═══════════════════════════════════════
  // PROFILE
  // ═══════════════════════════════════════

  profile: {
    editHint: 'Tippe um zu bearbeiten',
    bioPlaceholder: 'Erzähl was über dich... oder lass es mysteriös.',
    bioEmpty: 'Keine Bio. Ein Mensch der Geheimnisse.',
    statsTitle: 'Deine Stats',
    settingsTitle: 'Einstellungen',
  },

  // ═══════════════════════════════════════
  // LOUNGES
  // ═══════════════════════════════════════

  lounge: {
    created: 'Lounge erstellt. Du bist jetzt der Boss hier.',
    joined: (name: string) => `Du bist jetzt in "${name}". Benimm dich.`,
    left: 'Lounge verlassen. Dramatischer Abgang.',
    full: 'Lounge ist voll. Versuchs später nochmal, oder erstell deine eigene.',
    expired: 'Diese Lounge existiert nicht mehr. Alles ist vergänglich.',
    inviteOnly: 'Invite-Only. Du brauchst einen Code, Fremder.',
  },

  // ═══════════════════════════════════════
  // VOICE CHAT
  // ═══════════════════════════════════════

  voice: {
    connecting: 'Verbinde... Gleich gehts los.',
    connected: 'Verbunden. Rede, aber überleg dir was du sagst.',
    ended: 'Call beendet. Hoffentlich war es produktiv.',
    rating: 'Wie war das Gespräch?',
    ratingPositive: '👍 War gut',
    ratingNegative: '👎 Naja...',
    ratingSkip: 'Überspringen',
  },

  // ═══════════════════════════════════════
  // ACTIONS & BUTTONS
  // ═══════════════════════════════════════

  actions: {
    save: 'Speichern',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    delete: 'Löschen',
    block: 'Blockieren',
    unblock: 'Entblocken',
    report: 'Melden',
    logout: 'Abmelden',
    upgrade: 'Jetzt upgraden',
    retry: 'Nochmal versuchen',
    continue: 'Weiter',
    skip: 'Überspringen',
    done: 'Fertig',
  },
};

// ═══════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${meters}m`;
}

export const getLevelTitle = (level: number): { name: string; emoji: string } => {
  if (level >= 76) return { name: 'Legend', emoji: '🏆' };
  if (level >= 51) return { name: 'Influencer', emoji: '👑' };
  if (level >= 31) return { name: 'Socialite', emoji: '✨' };
  if (level >= 16) return { name: 'Connector', emoji: '🔗' };
  if (level >= 6) return { name: 'Dreamer', emoji: '💭' };
  return { name: 'Newcomer', emoji: '🌱' };
};

export const getTrustTier = (
  score: number
): { tier: string; color: string; label: string } => {
  if (score >= 4.5) return { tier: 'trusted', color: '#FFD700', label: 'TRUSTED' };
  if (score >= 3.5) return { tier: 'reliable', color: '#C0C0C0', label: 'RELIABLE' };
  if (score >= 2.5) return { tier: 'neutral', color: '#9CA3AF', label: 'NEUTRAL' };
  if (score >= 1.5) return { tier: 'caution', color: '#F59E0B', label: 'CAUTION' };
  return { tier: 'restricted', color: '#EF4444', label: 'RESTRICTED' };
};

export const getStreakMultiplier = (days: number): number => {
  if (days >= 30) return 2.0;
  if (days >= 14) return 1.8;
  if (days >= 7) return 1.6;
  if (days >= 6) return 1.5;
  if (days >= 5) return 1.4;
  if (days >= 4) return 1.3;
  if (days >= 3) return 1.2;
  if (days >= 2) return 1.1;
  return 1.0;
};

export const calculateXPForLevel = (level: number): number => {
  return Math.floor(Math.pow(level, 1.5) * 100);
};

export const calculateLevelFromXP = (xp: number): number => {
  return Math.floor(Math.pow(xp / 100, 1 / 1.5));
};

export default UI_COPY;
