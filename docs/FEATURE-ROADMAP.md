# delulu App - Feature Roadmap v2.0

## Backend-Prioritätenliste

### 🔴 PRIORITÄT 1: Sicherheit & Grundlagen (Woche 1-2)

#### 1.1 Block-System (KRITISCH)
```
Warum zuerst? Ohne Block-Logik keine sichere Community.
```
- **Firestore Collection:** `blocks/{blockId}`
- **Felder:** `blockerId`, `blockedUserId`, `createdAt`, `mutualUnblock: false`
- **Cloud Function:** Trigger bei Location-Updates → filtert geblockte User aus
- **Regel:** Geblockt = permanent unsichtbar bis BEIDE entblocken

#### 1.2 User-Reports & Moderation
- **Collection:** `reports/{reportId}`
- **Auto-Ban Trigger:** 3+ Reports in 24h → temporärer Ban
- **Toxicity Score:** Accumulator-Feld im User-Dokument

---

### 🟠 PRIORITÄT 2: Reputation & Trust (Woche 2-3)

#### 2.1 XP-System
```typescript
interface UserReputation {
  xp: number;
  level: number;           // 1-100
  voiceMinutes: number;    // Gesprächszeit
  positiveRatings: number;
  negativeRatings: number;
  trustScore: number;      // 0.0 - 5.0
}
```

**XP-Quellen:**
| Aktion | XP |
|--------|-----|
| Voice-Chat 1 Min | +2 XP |
| Positive Bewertung erhalten | +15 XP |
| Erste Verbindung des Tages | +5 XP |
| Negative Bewertung | -10 XP |
| Report erhalten | -50 XP |

**Level-Formel:** `level = floor(sqrt(xp / 10))`

#### 2.2 Positive Listener Rating
- Nach jedem Voice-Chat: 👍 / 👎 Popup
- Nur bewertbar nach min. 60 Sekunden Gespräch
- Kein Spam: Max 1 Bewertung pro User-Paar pro 24h

---

### 🟡 PRIORITÄT 3: Social Features (Woche 3-4)

#### 3.1 Friend-System
```typescript
interface Friendship {
  id: string;
  users: [string, string];  // Sorted user IDs
  status: 'pending' | 'accepted';
  createdAt: Timestamp;
  initiatorId: string;
}
```

#### 3.2 Friend-Radar (10km Notifications)
- **Cloud Function:** Scheduled every 5 Min
- **Logic:**
  ```
  IF friend.location within 10km
  AND friend.radarEnabled
  AND !notifiedInLast6Hours
  THEN send push notification
  ```
- **Privacy Toggle:** `user.friendRadarEnabled: boolean`

---

### 🟢 PRIORITÄT 4: Location Features (Woche 4-5)

#### 4.1 Private Lounges
```typescript
interface Lounge {
  id: string;
  hostId: string;
  location: GeoPoint;
  radius: number;          // 50-200m
  name: string;
  maxMembers: number;      // 2-10
  members: string[];
  isPrivate: boolean;
  inviteCode?: string;
  expiresAt: Timestamp;    // Auto-delete nach 24h
}
```

**Crowd-Management Regeln:**
- Auto-Suggestion wenn >20 User in 100m Radius
- Host kann Lounge "claimen" für 24h
- Invite-Only oder Open Join
- Lounges erscheinen als Bubbles auf der Karte

#### 4.2 Globaler Suchradius-Filter
- Slider: 100m - 5km (logarithmisch)
- Persistiert in `user.searchRadius`
- Real-time Filter auf Discover/Home

---

### 🔵 PRIORITÄT 5: Voice & Engagement (Woche 5-6)

#### 5.1 Voice-Chat Integration
- WebRTC über Firebase + Agora/Daily.co SDK
- Max 2 Personen pro Call (MVP)
- Auto-End nach 30 Min (Fair Use)

#### 5.2 Engagement Hooks
- Daily Login Streak → Bonus XP
- "Icebreaker" Prompts bei Match
- Achievement System (später)

---

## Firestore Security Rules Update

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users
    match /users/{userId} {
      allow read: if request.auth != null && !isBlocked(userId);
      allow write: if request.auth.uid == userId;
    }

    // Blocks
    match /blocks/{blockId} {
      allow read: if request.auth != null &&
        (resource.data.blockerId == request.auth.uid ||
         resource.data.blockedUserId == request.auth.uid);
      allow create: if request.auth.uid == request.resource.data.blockerId;
      allow delete: if request.auth.uid == resource.data.blockerId;
    }

    // Friendships
    match /friendships/{friendshipId} {
      allow read: if request.auth.uid in resource.data.users;
      allow create: if request.auth.uid == request.resource.data.initiatorId;
      allow update: if request.auth.uid in resource.data.users;
    }

    // Lounges
    match /lounges/{loungeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.hostId;
    }

    // Reports
    match /reports/{reportId} {
      allow create: if request.auth != null;
      allow read: if false; // Admin only
    }

    // Ratings
    match /ratings/{ratingId} {
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.raterId;
      allow read: if request.auth.uid in [resource.data.raterId, resource.data.ratedUserId];
    }
  }
}
```

---

## Wireframe-Konzept: Neues Profil-Design

### Layout-Struktur

```
┌─────────────────────────────────────┐
│  ← Zurück              ⚙️ Settings  │  Header
├─────────────────────────────────────┤
│                                     │
│         ┌─────────┐                 │
│         │         │                 │
│         │  AVATAR │                 │  Avatar Section
│         │   XL    │                 │  (tappable)
│         └─────────┘                 │
│                                     │
│      ✨ Level 12 - Dreamer ✨       │  Level Badge
│         ████████░░ 340/500 XP       │  XP Progress Bar
│                                     │
│         @username                   │
│      "Bio text hier..."             │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ┌─────┐  ┌─────┐  ┌─────┐         │
│  │ 23  │  │ 4.2 │  │ 156 │         │  Stats Row
│  │Friends│ │Rating│ │ Min │         │
│  └─────┘  └─────┘  └─────┘         │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  🔘 Sichtbar für andere            │  Privacy Section
│  ○  Nur für Freunde                │
│  ○  Unsichtbar (Ghost Mode)        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  📍 Friend-Radar                   │  Toggles
│  ┌────────────────────────────┐    │
│  │ ○━━━━━━━━━━━━━━━━━━━━━●   │    │  ON
│  └────────────────────────────┘    │
│  Freunde im 10km Radius benachrichtigen │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  🎯 Suchradius: 500m               │  Radius Slider
│  ┌────────────────────────────┐    │
│  │ 100m ●━━━━━━━━━━━○ 5km    │    │
│  └────────────────────────────┘    │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  [ 🚫 Blockierte Nutzer (3) → ]    │  Settings Links
│  [ 📊 Meine Statistiken →     ]    │
│  [ ❓ Hilfe & Support →       ]    │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  [ 🚪 Abmelden ]                   │  Logout (red)
│                                     │
│      delulu v1.0 • butterbread ☁️   │
│                                     │
└─────────────────────────────────────┘
```

### Neue UI-Komponenten

#### 1. Level Badge Component
```
┌─────────────────────────────┐
│  ✨ Level 12               │
│     DREAMER                │
│  ████████████░░░░ 68%      │
└─────────────────────────────┘
```

**Level-Namen:**
- 1-5: Newcomer
- 6-15: Dreamer
- 16-30: Connector
- 31-50: Socialite
- 51-75: Influencer
- 76-100: Legend

#### 2. Trust Score Badge
```
┌───────────┐
│  ⭐ 4.2   │  Gradient: Gold bei >4.0
│  Trusted  │           Grün bei >3.0
└───────────┘           Grau bei <3.0
```

#### 3. Privacy Selector (Radio Style)
```
┌─────────────────────────────────────┐
│ 🔘 Sichtbar                        │ ← Selected (violet bg)
├─────────────────────────────────────┤
│ ○  Nur Freunde                     │
├─────────────────────────────────────┤
│ ○  Ghost Mode 👻                   │
└─────────────────────────────────────┘
```

#### 4. Radius Slider (Custom)
```
      100m              500m              5km
        │                 │                │
        ●━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━○
                          ▲
                     Current: 500m
```

---

## Home-Page Redesign

### Neues Layout

```
┌─────────────────────────────────────┐
│  delulu ☁️           🔔  👤         │  Header
├─────────────────────────────────────┤
│                                     │
│  Guten Abend, Jan! ✨               │  Greeting
│  12 Leute in deiner Nähe            │
│                                     │
├─────────────────────────────────────┤
│  📍 Radius: 500m                   │  GLOBAL FILTER
│  ┌────────────────────────────┐    │  (Always visible)
│  │ 100m ●━━━━━━━━━━━○ 5km    │    │
│  └────────────────────────────┘    │
├─────────────────────────────────────┤
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │  Quick Actions
│  │ 🎙️  │ │ 🗺️  │ │ 🎲  │ │ 🏠  │  │  (Scroll horizontal)
│  │Voice│ │ Map │ │Rand.│ │Lounge│  │
│  └─────┘ └─────┘ └─────┘ └─────┘  │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  In deiner Nähe                    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 Sarah • 120m • ⭐4.5    │   │  User Cards
│  │    "Mag Kaffee & Musik"     │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 Max • 340m • ⭐3.8      │   │
│  │    "Suche Gesprächspartner" │   │
│  └─────────────────────────────┘   │
│                                     │
│  ... (scrollable)                  │
│                                     │
├─────────────────────────────────────┤
│  🏠     🔍     💬     👤          │  Bottom Nav
│  Home  Discover  Chats  Profile    │
└─────────────────────────────────────┘
```

### Quick Action Buttons - Visuelles Feedback

**States:**
```
Normal:          Pressed:         Active:
┌─────┐          ┌─────┐          ┌─────┐
│ 🎙️  │          │ 🎙️  │          │ 🎙️  │
│     │  ──►     │░░░░░│  ──►     │█████│
│Voice│          │Voice│          │Voice│
└─────┘          └─────┘          └─────┘
 Gray bg         Scale 0.95       Violet bg
                 + opacity        + glow
```

---

## Nächste Schritte

1. **Jetzt:** Types & Interfaces definieren
2. **Dann:** Firestore Collections anlegen
3. **Dann:** Profile.tsx komplett neu bauen
4. **Dann:** Home.tsx mit Radius-Slider
5. **Dann:** Block-System implementieren
6. **Dann:** Friend-System implementieren

Soll ich mit der Implementierung starten?
