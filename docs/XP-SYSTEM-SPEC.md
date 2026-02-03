# delulu XP-System - Backend-Logik & Balancing

## 🧮 Die Mathematik

### XP-Formel für Level-Thresholds
```
XP_required(L) = L^1.5 × 100
```

### Level 1-10 Balancing Table

| Level | XP Required | XP to Next | Ungefähre Zeit | Titel |
|-------|-------------|------------|----------------|-------|
| 1 | 0 | 100 | 0 | Newcomer |
| 2 | 100 | 183 | ~30 min Voice | Newcomer |
| 3 | 283 | 252 | ~1h Voice | Newcomer |
| 4 | 535 | 314 | ~2h total | Newcomer |
| 5 | 849 | 372 | ~3h total | Newcomer |
| 6 | 1,221 | 426 | ~4h total | Dreamer |
| 7 | 1,647 | 479 | ~5.5h total | Dreamer |
| 8 | 2,126 | 529 | ~7h total | Dreamer |
| 9 | 2,655 | 578 | ~8.5h total | Dreamer |
| 10 | 3,233 | 625 | ~10h total | Dreamer |

### Level-Titel (Progression)
```typescript
const LEVEL_TITLES = {
  1: { name: 'Newcomer', emoji: '🌱', color: '#9CA3AF' },
  6: { name: 'Dreamer', emoji: '💭', color: '#8B5CF6' },
  16: { name: 'Connector', emoji: '🔗', color: '#3B82F6' },
  31: { name: 'Socialite', emoji: '✨', color: '#F59E0B' },
  51: { name: 'Influencer', emoji: '👑', color: '#EF4444' },
  76: { name: 'Legend', emoji: '🏆', color: '#FFD700' },
};
```

---

## 📊 XP-Quellen & Gewichtung

### Positive XP-Aktionen

| Aktion | Base XP | Mit Streak (2x) | Cooldown |
|--------|---------|-----------------|----------|
| Voice-Chat (pro Minute) | +3 XP | +6 XP | None |
| Positive Bewertung erhalten | +20 XP | +40 XP | 1x pro User/24h |
| Erste Verbindung des Tages | +10 XP | +20 XP | 1x/Tag |
| Lounge erstellen | +15 XP | +30 XP | 3x/Tag max |
| Flash-Event teilnehmen | +50 XP | +100 XP | Event-basiert |
| Daily Login | +5 XP | +10 XP | 1x/Tag |
| Freundschaft geschlossen | +25 XP | +50 XP | None |

### Negative XP-Aktionen (Penalties)

| Aktion | XP Verlust | Zusätzliche Konsequenz |
|--------|------------|------------------------|
| Negative Bewertung erhalten | -15 XP | Trust Score -0.2 |
| Report erhalten | -75 XP | Review Queue |
| Bestätigter Report | -200 XP | Temp Ban (24h) |
| Toxicity Auto-Detect | -50 XP | Shadow Mute (1h) |
| Spam-Verhalten | -30 XP | Rate Limit |

---

## 🔥 Daily Streak System

### Multiplikator-Kurve
```typescript
const STREAK_MULTIPLIERS = {
  0: 1.0,   // Kein Streak
  1: 1.0,   // Tag 1
  2: 1.1,   // Tag 2
  3: 1.2,   // Tag 3
  4: 1.3,   // Tag 4
  5: 1.4,   // Tag 5
  6: 1.5,   // Tag 6
  7: 1.6,   // Tag 7 (1 Woche!)
  14: 1.8,  // 2 Wochen
  30: 2.0,  // 1 Monat (MAX)
};

function getStreakMultiplier(days: number): number {
  const thresholds = [30, 14, 7, 6, 5, 4, 3, 2, 1, 0];
  for (const t of thresholds) {
    if (days >= t) return STREAK_MULTIPLIERS[t];
  }
  return 1.0;
}
```

### Streak-Regeln
- **Reset:** Streak bricht bei 24h ohne Login
- **Grace Period:** 4h nach Mitternacht (bis 04:00 Uhr)
- **Freeze:** Premium-User können 1x/Woche Streak einfrieren
- **Recovery:** Bei Verlust: Schneller Wiederaufbau (50% der alten Streak-Tage als Bonus)

---

## 🛡️ Trust Score System

### Formel
```typescript
interface TrustScore {
  value: number;        // 0.0 - 5.0
  totalRatings: number;
  positiveRatings: number;
  negativeRatings: number;
  reportCount: number;
  lastUpdated: Timestamp;
}

function calculateTrustScore(user: TrustScore): number {
  if (user.totalRatings < 5) {
    // Nicht genug Daten - Default Score
    return 3.0;
  }

  const baseScore = (user.positiveRatings / user.totalRatings) * 5;
  const reportPenalty = Math.min(user.reportCount * 0.3, 2.0);

  return Math.max(0, Math.min(5, baseScore - reportPenalty));
}
```

### Trust-Tier System
```
⭐⭐⭐⭐⭐ (4.5-5.0) = "Trusted" - Gold Badge
⭐⭐⭐⭐   (3.5-4.4) = "Reliable" - Silber Badge
⭐⭐⭐     (2.5-3.4) = "Neutral" - Kein Badge
⭐⭐       (1.5-2.4) = "Caution" - Gelbe Warnung
⭐         (0.0-1.4) = "Restricted" - Rote Warnung, eingeschränkte Features
```

---

## 🚫 Shadow-Ban & Moderation Logic

### Auto-Detection Triggers
```typescript
interface ModerationTrigger {
  type: 'shadow_mute' | 'temp_ban' | 'perm_ban';
  condition: string;
  duration: number; // in minutes, 0 = permanent
}

const MODERATION_TRIGGERS: ModerationTrigger[] = [
  // Shadow Mute (User weiß es nicht, Messages werden nicht zugestellt)
  { type: 'shadow_mute', condition: '3 negative ratings in 1h', duration: 60 },
  { type: 'shadow_mute', condition: 'toxicity_score > 0.7', duration: 120 },

  // Temp Ban (User wird informiert)
  { type: 'temp_ban', condition: '5 reports in 24h', duration: 1440 }, // 24h
  { type: 'temp_ban', condition: 'trust_score < 1.0', duration: 4320 }, // 72h

  // Permanent Ban (Review required)
  { type: 'perm_ban', condition: '3 temp_bans in 30 days', duration: 0 },
  { type: 'perm_ban', condition: 'confirmed harassment', duration: 0 },
];
```

### Skeptic-Style Nachrichten
```typescript
const MODERATION_MESSAGES = {
  shadow_mute: `Deine Vibes sind gerade ziemlich toxic. Wir haben dich mal kurz stummgeschaltet, damit die anderen in Ruhe weiterreden können. Atme mal tief durch.`,

  temp_ban: `OK, das war's erstmal für dich. Du bist für {duration} auf Eis gelegt. Nutz die Zeit, um über deine Lebensentscheidungen nachzudenken.`,

  warning: `Heads up: Dein Trust-Score ist im Keller. Noch ein Ausrutscher und du landest auf der Bank. Deine Entscheidung.`,

  trust_restored: `Sieh an, du hast dich zusammengerissen. Dein Trust-Score erholt sich. Weiter so, Champ.`,
};
```

---

## 💰 Premium "Catalyst" System

### Feature-Matrix
```typescript
interface PremiumFeatures {
  xpBoost: 1.5;              // Permanenter 1.5x Multiplikator
  exactDistance: true;        // Meter-genaue Distanzanzeige
  profileStalker: true;       // Wer hat mein Profil besucht?
  priorityListing: true;      // Immer oben in der Liste
  streakFreeze: 1;            // 1x pro Woche Streak einfrieren
  premiumLounges: true;       // Exklusive Lounges erstellen
  noAds: true;                // Werbefrei
  extendedRadius: 10000;      // 10km statt 5km max
}
```

### Premium XP Calculation
```typescript
function calculateXP(
  baseXP: number,
  streakDays: number,
  isPremium: boolean,
  isFlashEvent: boolean
): number {
  let multiplier = getStreakMultiplier(streakDays);

  if (isPremium) multiplier *= 1.5;
  if (isFlashEvent) multiplier *= 3.0;

  return Math.floor(baseXP * multiplier);
}

// Beispiel:
// Voice 1 Min während Flash Event als Premium mit 7-Tage-Streak:
// 3 XP × 1.6 (streak) × 1.5 (premium) × 3.0 (event) = 21.6 → 21 XP
```

---

## 🗄️ Firestore Schema

### User Document Extension
```typescript
interface UserXPData {
  // XP & Level
  xp: number;
  level: number;
  levelTitle: string;

  // Streak
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: Timestamp;
  streakFreezeUsed: boolean;

  // Trust
  trustScore: number;
  totalRatings: number;
  positiveRatings: number;
  negativeRatings: number;

  // Voice Stats
  totalVoiceMinutes: number;
  totalConnections: number;

  // Moderation
  reportCount: number;
  banHistory: BanRecord[];
  isShadowMuted: boolean;
  shadowMuteUntil?: Timestamp;
  isBanned: boolean;
  banUntil?: Timestamp;

  // Premium
  isPremium: boolean;
  premiumUntil?: Timestamp;
}
```

### XP Transaction Log
```typescript
// Collection: xp_transactions/{transactionId}
interface XPTransaction {
  userId: string;
  amount: number;           // Kann negativ sein
  reason: XPReason;
  multiplier: number;
  finalAmount: number;      // amount × multiplier
  timestamp: Timestamp;
  metadata?: {
    voiceSessionId?: string;
    ratingFromUserId?: string;
    eventId?: string;
  };
}

type XPReason =
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
```

---

## 🔧 Cloud Functions

### 1. XP Award Function
```typescript
// Trigger: Callable function
export const awardXP = functions.https.onCall(async (data, context) => {
  const { userId, reason, metadata } = data;

  // Get user data
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  const user = userDoc.data();

  // Calculate XP
  const baseXP = XP_VALUES[reason];
  const streakMultiplier = getStreakMultiplier(user.currentStreak);
  const premiumMultiplier = user.isPremium ? 1.5 : 1.0;
  const finalXP = Math.floor(baseXP * streakMultiplier * premiumMultiplier);

  // Update user
  const newXP = user.xp + finalXP;
  const newLevel = calculateLevel(newXP);

  await userRef.update({
    xp: newXP,
    level: newLevel,
    levelTitle: getLevelTitle(newLevel),
  });

  // Log transaction
  await db.collection('xp_transactions').add({
    userId,
    amount: baseXP,
    reason,
    multiplier: streakMultiplier * premiumMultiplier,
    finalAmount: finalXP,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    metadata,
  });

  // Check for level up
  if (newLevel > user.level) {
    await sendLevelUpNotification(userId, newLevel);
  }

  return { success: true, xpAwarded: finalXP, newLevel };
});
```

### 2. Daily Streak Check (Scheduled)
```typescript
// Runs daily at 04:00 UTC
export const checkStreaks = functions.pubsub
  .schedule('0 4 * * *')
  .onRun(async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Find users who didn't log in yesterday
    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('lastLoginDate', '<', yesterday)
      .where('currentStreak', '>', 0)
      .get();

    const batch = db.batch();

    snapshot.forEach((doc) => {
      const user = doc.data();

      // Check for streak freeze (Premium)
      if (user.isPremium && !user.streakFreezeUsed) {
        batch.update(doc.ref, { streakFreezeUsed: true });
      } else {
        // Reset streak
        batch.update(doc.ref, {
          currentStreak: 0,
          streakFreezeUsed: false,
        });
      }
    });

    await batch.commit();
  });
```

---

## 📱 Client-Side Implementation

### XP Store (Zustand)
```typescript
interface XPState {
  xp: number;
  level: number;
  levelTitle: string;
  xpToNextLevel: number;
  xpProgress: number; // 0-100%
  currentStreak: number;
  streakMultiplier: number;
  trustScore: number;

  // Actions
  refreshXP: () => Promise<void>;
  showXPGain: (amount: number, reason: string) => void;
}
```

### XP Toast Animation
```typescript
// Zeigt "+15 XP" Animation mit Streak-Info
const XPToast = ({ amount, reason, multiplier }) => (
  <motion.div
    initial={{ y: 50, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: -50, opacity: 0 }}
    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
  >
    <div className="bg-gradient-to-r from-violet-500 to-purple-500 text-white px-6 py-3 rounded-2xl shadow-xl">
      <p className="text-2xl font-bold">+{amount} XP</p>
      {multiplier > 1 && (
        <p className="text-xs opacity-80">
          🔥 {multiplier}x Streak Bonus!
        </p>
      )}
    </div>
  </motion.div>
);
```

---

## ⚡ Performance Considerations

1. **XP Updates:** Batch-write bei Voice-Sessions (alle 5 Min statt jede Minute)
2. **Level Calculation:** Client-side berechnen, Server validiert nur
3. **Streak Check:** Einmal täglich via Cloud Function, nicht bei jedem Request
4. **Trust Score:** Cached im User-Doc, Update nur bei neuen Ratings
5. **Leaderboards:** Separate Collection mit Top 100, hourly refresh

---

*Erstellt für delulu v2.0 - butterbread ☁️*
