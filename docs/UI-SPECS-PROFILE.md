# delulu UI-Spezifikationen - Profil Interface v2.0

## 🎯 Design-Philosophie

> "Kompetent, leicht arrogant, aber charmant. Wie ein Freund, der alles besser weiß – und meistens Recht hat."

### Kernprinzipien
1. **Information Hierarchy:** Wichtigstes zuerst (Level, Trust)
2. **Micro-Interactions:** Jede Aktion hat spürbares Feedback
3. **Progressive Disclosure:** Komplexität nur wenn nötig
4. **Skeptic Voice:** Texte mit Persönlichkeit, nie generisch

---

## 📱 Profil-Screen Wireframe

### Struktur (Top → Bottom)

```
┌────────────────────────────────────────┐
│                                        │
│  HEADER BAR                           │
│  ← Back          "Profil"        ⚙️   │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  │        HERO SECTION              │  │
│  │                                  │  │
│  │    ┌─────────────┐               │  │
│  │    │             │               │  │
│  │    │   AVATAR    │ ← Tappable    │  │
│  │    │    128px    │   Edit Icon   │  │
│  │    │             │               │  │
│  │    └─────────────┘               │  │
│  │                                  │  │
│  │    ┌─────────────────────────┐   │  │
│  │    │ ✨ Level 12 • Dreamer   │   │  │  ← Gradient Pill
│  │    └─────────────────────────┘   │  │
│  │                                  │  │
│  │    ████████████░░░░  68%         │  │  ← XP Progress Bar
│  │    340 / 500 XP zum nächsten     │  │
│  │                                  │  │
│  │    @username                     │  │
│  │    "Bio hier..."                 │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  STATS ROW (3 Columns)                │
│  ┌────────┐ ┌────────┐ ┌────────┐     │
│  │   23   │ │  ⭐4.2 │ │  156   │     │
│  │ Friends│ │ Trust  │ │Voice Min│    │
│  └────────┘ └────────┘ └────────┘     │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  STREAK BANNER (wenn aktiv)           │
│  ┌──────────────────────────────────┐  │
│  │ 🔥 7 Tage Streak! 1.6x XP Boost  │  │
│  │     Morgen: 1.8x                 │  │
│  └──────────────────────────────────┘  │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  VISIBILITY SELECTOR                  │
│  ┌──────────────────────────────────┐  │
│  │ Wer darf dich sehen?             │  │
│  │                                  │  │
│  │ ● Alle in Reichweite            │  │  ← Radio, selected
│  │ ○ Nur meine Freunde             │  │
│  │ ○ Niemand (Ghost Mode) 👻       │  │
│  └──────────────────────────────────┘  │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  FRIEND RADAR TOGGLE                  │
│  ┌──────────────────────────────────┐  │
│  │ 📍 Friend-Radar          [===●] │  │
│  │ "Max ist im 10km-Radius.        │  │
│  │  Keine Sorge, er kann dich      │  │
│  │  nicht hören – es sei denn,     │  │
│  │  du willst es."                 │  │
│  └──────────────────────────────────┘  │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  SEARCH RADIUS SLIDER                 │
│  ┌──────────────────────────────────┐  │
│  │ 🎯 Suchradius                    │  │
│  │                                  │  │
│  │ 100m ●━━━━━━━━━━━━━━━○ 5km      │  │
│  │              ▲                   │  │
│  │           500m                   │  │
│  │                                  │  │
│  │ "Je weiter du schaust, desto    │  │
│  │  mehr Chaos erwartet dich."     │  │
│  └──────────────────────────────────┘  │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  PREMIUM UPSELL (wenn nicht Premium)  │
│  ┌──────────────────────────────────┐  │
│  │ 💎 CATALYST                      │  │
│  │                                  │  │
│  │ "Hör auf zu schleichen. Hol dir │  │
│  │  den Catalyst und sieh genau,   │  │
│  │  wer in deiner Nähe ist, bevor  │  │
│  │  sie dich sehen."               │  │
│  │                                  │  │
│  │       [ Jetzt upgraden ]        │  │
│  └──────────────────────────────────┘  │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  SETTINGS LIST                        │
│  ┌──────────────────────────────────┐  │
│  │ 🚫 Blockierte Nutzer      (3) → │  │
│  ├──────────────────────────────────┤  │
│  │ 📊 Meine Stats & History      → │  │
│  ├──────────────────────────────────┤  │
│  │ 🔔 Benachrichtigungen         → │  │
│  ├──────────────────────────────────┤  │
│  │ 🎨 App-Design                 → │  │
│  ├──────────────────────────────────┤  │
│  │ ❓ Hilfe & FAQ                → │  │
│  └──────────────────────────────────┘  │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  LOGOUT BUTTON                        │
│  ┌──────────────────────────────────┐  │
│  │     🚪 Abmelden                  │  │  ← Red text
│  └──────────────────────────────────┘  │
│                                        │
│  delulu v2.0 • butterbread ☁️        │
│                                        │
└────────────────────────────────────────┘
```

---

## 🎨 Komponenten-Spezifikationen

### 1. Level Badge (Hero Section)

```
Anatomy:
┌─────────────────────────────────────┐
│  ✨  Level 12  •  Dreamer           │
└─────────────────────────────────────┘
     ↑       ↑          ↑
   Emoji   Number     Title

Styling:
- Background: gradient (violet-500 → purple-600)
- Border-radius: 9999px (pill)
- Padding: 8px 20px
- Font: 600 weight, 14px
- Shadow: 0 4px 14px rgba(139, 92, 246, 0.3)

States:
- Normal: As above
- Level Up Animation: Scale 1.1 → 1.0, glow pulse
- Premium: Gold gradient border
```

### 2. XP Progress Bar

```
Anatomy:
┌─────────────────────────────────────┐
│ ████████████████░░░░░░░░░           │  ← Bar
└─────────────────────────────────────┘
         340 / 500 XP                    ← Label

Styling:
- Track: bg-gray-200, h-3, rounded-full
- Fill: gradient (violet-500 → purple-500)
- Label: text-xs, text-muted, mt-1

Animation:
- Fill: transition-all 500ms ease-out
- Bei XP Gain: Pulse animation on fill edge
- Bei Level Up: Confetti + Flash white
```

### 3. Trust Score Badge

```
Tiers & Styling:

⭐⭐⭐⭐⭐ (4.5+)
┌───────────────┐
│  ⭐ 4.8       │  ← Gold gradient bg
│  TRUSTED      │  ← Uppercase, 10px
└───────────────┘

⭐⭐⭐⭐ (3.5-4.4)
┌───────────────┐
│  ⭐ 4.1       │  ← Silver bg
│  RELIABLE     │
└───────────────┘

⭐⭐⭐ (2.5-3.4)
┌───────────────┐
│  ⭐ 3.0       │  ← Gray bg
│  NEUTRAL      │
└───────────────┘

⭐⭐ (<2.5)
┌───────────────┐
│  ⚠️ 1.8       │  ← Yellow/Red bg
│  CAUTION      │
└───────────────┘
```

### 4. Streak Banner

```
Anatomy:
┌─────────────────────────────────────────┐
│ 🔥 7 Tage Streak!                       │
│    Aktuell: 1.6x XP  →  Morgen: 1.8x    │
└─────────────────────────────────────────┘

Styling:
- Background: gradient (orange-400 → red-500)
- Border-radius: 16px
- Padding: 16px
- Flame emoji: animated (wiggle)

Conditional Display:
- streak < 2: Hidden
- streak >= 2: Show
- streak >= 7: "🔥🔥 UNSTOPPABLE!" label
- streak >= 30: Gold border + "LEGENDARY" badge
```

### 5. Visibility Selector

```
Layout: Vertical radio group

┌─────────────────────────────────────────┐
│ Wer darf dich sehen?                    │  ← Section header
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ● Alle in Reichweite               │ │  ← Selected (violet bg)
│ │   Jeder im Radius kann dich sehen  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ○ Nur meine Freunde                │ │  ← Unselected (gray bg)
│ │   Fremde sehen dich nicht          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ○ Niemand (Ghost Mode) 👻          │ │
│ │   Du bist komplett unsichtbar      │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

Interaction:
- Tap: Instant switch with haptic feedback
- Selected: violet-100 bg, violet border, violet radio
- Unselected: gray-50 bg, gray border
```

### 6. Search Radius Slider

```
Anatomy:
┌─────────────────────────────────────────┐
│ 🎯 Suchradius                    500m   │  ← Header + value
│                                         │
│  100m ●━━━━━━━━━━━━━━━━━━━━━○ 5km      │  ← Slider
│              ▲                          │
│          [Thumb]                        │
│                                         │
│  "Je weiter du schaust, desto mehr     │  ← Skeptic hint
│   Chaos erwartet dich."                │
└─────────────────────────────────────────┘

Styling:
- Track: h-2, bg-gray-200, rounded-full
- Active Track: gradient violet
- Thumb: w-6 h-6, white, shadow-lg, border-2 violet
- Value Display: Bold gradient text

Scale (logarithmic feel):
100m → 200m → 300m → 500m → 750m → 1km → 2km → 3km → 5km

Haptic Feedback:
- Light tap at each "stop"
- Medium tap at 500m (default)
- Heavy tap at limits (100m, 5km)
```

### 7. Premium Upsell Card

```
Anatomy:
┌─────────────────────────────────────────┐
│                                         │
│  💎 CATALYST                            │  ← Gradient text
│                                         │
│  "Hör auf zu schleichen. Hol dir den   │  ← Skeptic copy
│   Catalyst und sieh genau, wer in      │
│   deiner Nähe ist, bevor sie dich      │
│   sehen."                              │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      Jetzt upgraden               │  │  ← CTA Button
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘

Styling:
- Background: gradient mesh (violet/purple/pink subtle)
- Border: 1px gradient (gold shimmer animation)
- CTA: Solid gold bg, black text, rounded-xl
- Hide if user.isPremium === true
```

---

## 💬 Skeptic-Style UI Copy

### System Messages

```typescript
const UI_COPY = {
  // Level System
  levelUp: (level: number, title: string) =>
    `Du bist jetzt offiziell weniger irrelevant. Willkommen auf Level ${level}. Dein neuer Titel: ${title}.`,

  levelUpSubtext: 'Deine Lounge wartet.',

  // XP Gains
  xpGain: (amount: number) => `+${amount} XP`,
  xpGainWithStreak: (amount: number, mult: number) =>
    `+${amount} XP (${mult}x Streak-Bonus, nicht schlecht)`,

  // Streak
  streakReminder: (days: number) =>
    `${days} Tage Streak. Morgen wirds noch besser – wenn du es schaffst, aufzutauchen.`,

  streakLost:
    'Streak verloren. Das war wohl nichts. Aber hey, morgen ist ein neuer Tag – nutze ihn.',

  streakFrozen:
    'Streak eingefroren. Ausnahmsweise. Das nächste Mal musst du schon erscheinen.',

  // Trust Score
  trustLow:
    'Dein Trust-Score ist im Keller. Vielleicht mal netter sein? Nur so ein Gedanke.',

  trustRecovering:
    'Sieh an, du hast dich zusammengerissen. Dein Trust-Score erholt sich. Weiter so, Champ.',

  trustHigh:
    'Trust-Score auf Maximum. Die Leute mögen dich. Genieß es, solange es anhält.',

  // Visibility
  visibilityPublic: 'Alle sehen dich. Kein Verstecken.',
  visibilityFriends: 'Nur deine Freunde sehen dich. Exklusivclub.',
  visibilityGhost: 'Ghost Mode aktiv. Du existierst nicht. Sehr dramatisch.',

  // Friend Radar
  friendRadarNotification: (name: string) =>
    `${name} ist im 10km-Radius. Keine Sorge, er kann dich nicht hören – es sei denn, du willst es.`,

  friendRadarEnabled: 'Friend-Radar aktiv. Du wirst benachrichtigt, wenn Freunde in der Nähe sind.',
  friendRadarDisabled: 'Friend-Radar aus. Du willst also überrascht werden? Mutig.',

  // Search Radius
  radiusHint: (distance: string) =>
    distance === '5km'
      ? 'Maximale Reichweite. Viel Spaß mit dem Chaos.'
      : distance === '100m'
        ? 'Nur die Nächsten. Sehr... intim.'
        : `${distance} Radius. Sollte reichen.`,

  radiusError:
    'Nett versucht, aber die Physik lässt sich nicht austricksen. Wir kalibrieren den Radius neu – bleib entspannt.',

  // Premium
  premiumUpsell:
    'Hör auf zu schleichen. Hol dir den Catalyst und sieh genau, wer in deiner Nähe ist, bevor sie dich sehen.',

  premiumActivated:
    'Catalyst aktiviert. Du siehst jetzt mehr als die anderen. Nutze es weise – oder nicht, deine Sache.',

  // Moderation
  shadowMuted:
    'Deine Vibes sind gerade ziemlich toxic. Wir haben dich mal kurz stummgeschaltet, damit die anderen in Ruhe weiterreden können. Atme mal tief durch.',

  tempBanned: (hours: number) =>
    `OK, das war's erstmal für dich. Du bist für ${hours}h auf Eis gelegt. Nutz die Zeit, um über deine Lebensentscheidungen nachzudenken.`,

  warningIssued:
    'Heads up: Noch ein Ausrutscher und du landest auf der Bank. Deine Entscheidung.',

  // Block System
  userBlocked: (name: string) =>
    `${name} ist jetzt unsichtbar für dich – und du für ${name}. Aus den Augen, aus dem Sinn.`,

  userUnblocked: (name: string) =>
    `${name} ist entblockt. Aber die Karte zeigt euch erst wieder, wenn beide zustimmen. Safety first.`,

  // Errors
  genericError: 'Irgendwas ist schiefgelaufen. Wahrscheinlich nicht deine Schuld. Wahrscheinlich.',
  networkError: 'Keine Verbindung. Das Internet hat dich verlassen, nicht wir.',
  locationError: 'GPS-Signal verloren. Vielleicht stehst du in einem Bunker?',

  // Empty States
  noFriends: 'Noch keine Freunde. Das lässt sich ändern – geh raus und quatsch Leute an.',
  noNearbyUsers: 'Niemand in Reichweite. Entweder bist du allein, oder alle verstecken sich vor dir.',
  noMessages: 'Keine Nachrichten. Die Stille ist ohrenbetäubend.',
};
```

---

## 🎬 Animations & Micro-Interactions

### 1. XP Gain Toast
```css
@keyframes xpGainPop {
  0% { transform: scale(0.5) translateY(20px); opacity: 0; }
  50% { transform: scale(1.1) translateY(-10px); }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

.xp-toast {
  animation: xpGainPop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### 2. Level Up Celebration
```css
@keyframes levelUpGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
  50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.6); }
}

@keyframes levelUpShake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-3deg); }
  75% { transform: rotate(3deg); }
}

.level-badge.leveling-up {
  animation: levelUpGlow 0.5s ease-in-out 3, levelUpShake 0.1s ease-in-out 6;
}
```

### 3. Streak Fire Animation
```css
@keyframes fireWiggle {
  0%, 100% { transform: rotate(-3deg) scale(1); }
  50% { transform: rotate(3deg) scale(1.1); }
}

.streak-fire {
  animation: fireWiggle 0.3s ease-in-out infinite;
}
```

### 4. Toggle Switch
```css
.toggle-switch {
  transition: background-color 0.2s ease;
}

.toggle-thumb {
  transition: transform 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### 5. Slider Haptic Stops
```typescript
const HAPTIC_STOPS = [100, 200, 300, 500, 750, 1000, 2000, 3000, 5000];

const handleSliderChange = (value: number) => {
  const nearestStop = HAPTIC_STOPS.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );

  if (value === nearestStop) {
    // Trigger haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(value === 500 ? 50 : 20);
    }
  }
};
```

---

## 📐 Spacing & Typography

### Spacing Scale
```
4px  - xs (micro gaps)
8px  - sm (tight)
12px - md (default)
16px - lg (section gaps)
24px - xl (major sections)
32px - 2xl (hero spacing)
```

### Typography
```
Hero Title: 24px, 700 weight, -0.02em tracking
Section Header: 12px, 600 weight, uppercase, 0.05em tracking
Body: 14px, 400 weight
Muted: 12px, 400 weight, text-gray-500
XP Numbers: 32px, 700 weight, gradient fill
Stats: 24px, 700 weight
```

---

## 🔄 State Management

### Profile Store
```typescript
interface ProfileUIState {
  // Edit Mode
  isEditing: boolean;
  editedName: string;
  editedBio: string;

  // Modals
  showAvatarPicker: boolean;
  showBlockedUsers: boolean;
  showStatsDetail: boolean;

  // Animations
  showXPToast: boolean;
  xpToastAmount: number;
  isLevelingUp: boolean;

  // Loading
  isSaving: boolean;
  isLoggingOut: boolean;
}
```

---

*UI Specs v2.0 - delulu by butterbread ☁️*
