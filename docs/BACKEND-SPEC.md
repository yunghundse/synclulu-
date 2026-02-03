# 🔧 DELULU Backend-Spezifikation

> **Version:** 2.0 | **Status:** Production Ready | **Last Update:** Januar 2026

---

## 📐 Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                        FIREBASE BACKEND                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐   │
│  │   Firestore   │  │   Auth        │  │   Cloud Functions │   │
│  │   (Database)  │  │   (Users)     │  │   (Logic)         │   │
│  └───────────────┘  └───────────────┘  └───────────────────┘   │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐   │
│  │   Storage     │  │   FCM         │  │   Analytics       │   │
│  │   (Avatars)   │  │   (Push)      │  │   (Tracking)      │   │
│  └───────────────┘  └───────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Firestore Collections

### 1. `users` Collection
```typescript
// /users/{userId}
interface UserDocument {
  // Core Identity
  email: string;
  username: string;           // Unique, lowercase
  displayName: string;
  avatarUrl?: string;
  bio?: string;

  // XP & Level System
  xp: number;                 // Total XP earned
  level: number;              // Current level (1-100)
  levelTitle: string;         // "Newcomer", "Legend", etc.

  // Streak System
  currentStreak: number;      // Days in a row
  longestStreak: number;      // All-time best
  lastLoginDate: Timestamp;   // For streak calculation
  streakFreezeUsed: boolean;  // Premium feature

  // Trust System
  trustScore: number;         // 0.0 - 5.0
  totalRatings: number;
  positiveRatings: number;
  negativeRatings: number;

  // Activity Stats
  totalVoiceMinutes: number;
  totalConnections: number;
  friendCount: number;

  // Privacy & Visibility
  visibilityMode: 'public' | 'friends' | 'ghost';
  friendRadarEnabled: boolean;
  searchRadius: number;       // In meters (100-5000)

  // Moderation
  reportCount: number;
  isShadowMuted: boolean;
  shadowMuteUntil?: Timestamp;
  isBanned: boolean;
  banUntil?: Timestamp;

  // Premium
  isPremium: boolean;
  premiumUntil?: Timestamp;

  // Timestamps
  createdAt: Timestamp;
  lastSeen: Timestamp;
  isActive: boolean;
}
```

### 2. `user_locations` Collection (Ephemeral)
```typescript
// /user_locations/{locationId}
interface UserLocationDocument {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  geohash: string;            // For geo-queries
  visibilityMode: string;
  updatedAt: Timestamp;
  expiresAt: Timestamp;       // Auto-delete after 15 min inactive
}
```

### 3. `xp_transactions` Collection
```typescript
// /xp_transactions/{transactionId}
interface XPTransactionDocument {
  userId: string;
  amount: number;             // Base XP
  multiplier: number;         // Streak + Premium multiplier
  finalAmount: number;        // amount * multiplier
  reason: XPReason;
  metadata?: {
    voiceSessionId?: string;
    ratingFromUserId?: string;
    eventId?: string;
    loungeId?: string;
  };
  timestamp: Timestamp;
}

type XPReason =
  | 'voice_minute'           // +10 XP per minute
  | 'positive_rating'        // +25 XP
  | 'negative_rating'        // -15 XP
  | 'daily_login'            // +50 XP
  | 'first_connection'       // +100 XP
  | 'lounge_created'         // +75 XP
  | 'flash_event'            // Variable (3x base)
  | 'friendship'             // +30 XP
  | 'report_received'        // -50 XP
  | 'spam_penalty';          // -100 XP
```

### 4. `flash_events` Collection
```typescript
// /flash_events/{eventId}
interface FlashEventDocument {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  geohash: string;
  radius: number;             // In meters
  xpMultiplier: number;       // 2x, 3x, 5x
  startsAt: Timestamp;
  endsAt: Timestamp;
  participantCount: number;
  participantIds: string[];
  createdBy: 'system' | 'admin';
  isActive: boolean;
}
```

### 5. `lounges` Collection
```typescript
// /lounges/{loungeId}
interface LoungeDocument {
  hostId: string;
  hostName: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  geohash: string;
  radius: number;
  maxMembers: number;
  currentMembers: string[];
  isPrivate: boolean;
  inviteCode?: string;
  isPremiumOnly: boolean;
  rating: number;
  ratingCount: number;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  isActive: boolean;
}
```

### 6. `blocks` Collection
```typescript
// /blocks/{blockId}
interface BlockDocument {
  blockerId: string;
  blockedUserId: string;
  createdAt: Timestamp;
  mutualUnblock: boolean;     // Both must unblock
  unblockedAt?: Timestamp;
}
```

### 7. `friendships` Collection
```typescript
// /friendships/{friendshipId}
interface FriendshipDocument {
  users: [string, string];    // Sorted user IDs
  status: 'pending' | 'accepted';
  initiatorId: string;
  createdAt: Timestamp;
  acceptedAt?: Timestamp;
}
```

### 8. `friend_radar_notifications` Collection
```typescript
// /friend_radar_notifications/{notificationId}
interface FriendRadarNotificationDocument {
  userId: string;             // Receiver
  friendId: string;
  friendName: string;
  distance: number;
  timestamp: Timestamp;
  seen: boolean;
  expiresAt: Timestamp;       // Auto-delete after 24h
}
```

---

## ⚡ Cloud Functions

### 1. XP & Level Functions

```typescript
// onXPTransaction - Triggered on new XP transaction
export const onXPTransaction = functions.firestore
  .document('xp_transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    const transaction = snap.data();
    const userRef = db.collection('users').doc(transaction.userId);

    // Update user XP
    await userRef.update({
      xp: FieldValue.increment(transaction.finalAmount),
    });

    // Check for level up
    const user = await userRef.get();
    const newLevel = calculateLevel(user.data().xp);

    if (newLevel > user.data().level) {
      await userRef.update({
        level: newLevel,
        levelTitle: getLevelTitle(newLevel),
      });

      // Send level up notification
      await sendPushNotification(transaction.userId, {
        title: '🎉 Level Up!',
        body: `Du bist jetzt Level ${newLevel}!`,
        type: 'level_up',
      });
    }
  });

// calculateXPForLevel - XP Formula: L^1.5 × 100
function calculateXPForLevel(level: number): number {
  return Math.floor(Math.pow(level, 1.5) * 100);
}

function calculateLevel(totalXP: number): number {
  let level = 1;
  while (calculateXPForLevel(level + 1) <= totalXP && level < 100) {
    level++;
  }
  return level;
}
```

### 2. Streak Functions

```typescript
// dailyStreakCheck - Runs at 00:00 UTC
export const dailyStreakCheck = functions.pubsub
  .schedule('0 0 * * *')
  .onRun(async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const users = await db.collection('users').get();

    for (const user of users.docs) {
      const lastLogin = user.data().lastLoginDate.toDate();
      const daysSinceLogin = Math.floor(
        (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLogin > 1) {
        // Streak lost (unless freeze used)
        if (user.data().isPremium && !user.data().streakFreezeUsed) {
          await user.ref.update({ streakFreezeUsed: true });
          // Send freeze notification
        } else {
          await user.ref.update({
            currentStreak: 0,
            streakFreezeUsed: false,
          });
          // Send streak lost notification
        }
      }
    }
  });

// getStreakMultiplier
function getStreakMultiplier(days: number): number {
  if (days >= 30) return 2.0;
  if (days >= 14) return 1.8;
  if (days >= 7) return 1.6;
  if (days >= 5) return 1.4;
  if (days >= 3) return 1.2;
  if (days >= 2) return 1.1;
  return 1.0;
}
```

### 3. Flash Event Functions

```typescript
// createFlashEvent - Called by admin or automatically
export const createFlashEvent = functions.https.onCall(async (data, context) => {
  // Verify admin
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const event = {
    name: data.name,
    description: data.description,
    latitude: data.latitude,
    longitude: data.longitude,
    geohash: geohashForLocation([data.latitude, data.longitude]),
    radius: data.radius || 500,
    xpMultiplier: data.multiplier || 3,
    startsAt: Timestamp.now(),
    endsAt: Timestamp.fromDate(new Date(Date.now() + data.duration * 60000)),
    participantCount: 0,
    participantIds: [],
    createdBy: 'admin',
    isActive: true,
  };

  const ref = await db.collection('flash_events').add(event);

  // Notify nearby users
  await notifyUsersInRadius(data.latitude, data.longitude, data.radius * 2, {
    title: '⚡ Flash Event!',
    body: `${data.multiplier}x XP bei "${data.name}" - Nur ${data.duration} Minuten!`,
    type: 'flash_event',
    eventId: ref.id,
  });

  return { eventId: ref.id };
});

// autoCreateFlashEvents - Creates random events based on user density
export const autoCreateFlashEvents = functions.pubsub
  .schedule('*/30 * * * *') // Every 30 minutes
  .onRun(async () => {
    // Find high-density areas
    const hotspots = await findUserHotspots();

    for (const hotspot of hotspots) {
      if (hotspot.userCount >= 5 && Math.random() < 0.3) { // 30% chance
        await createFlashEvent({
          name: 'Spontaner Hotspot',
          description: 'Viele User in der Nähe - nutze die Chance!',
          latitude: hotspot.latitude,
          longitude: hotspot.longitude,
          radius: 300,
          multiplier: 3,
          duration: 30, // 30 minutes
        });
      }
    }
  });
```

### 4. Friend Radar Functions

```typescript
// onLocationUpdate - Check for nearby friends
export const onLocationUpdate = functions.firestore
  .document('user_locations/{locationId}')
  .onWrite(async (change, context) => {
    const location = change.after.data();
    if (!location) return;

    const user = await db.collection('users').doc(location.userId).get();
    if (!user.data()?.friendRadarEnabled) return;

    // Get friends
    const friendships = await db.collection('friendships')
      .where('users', 'array-contains', location.userId)
      .where('status', '==', 'accepted')
      .get();

    const friendIds = friendships.docs.flatMap(doc =>
      doc.data().users.filter(id => id !== location.userId)
    );

    // Check friend locations within 10km
    for (const friendId of friendIds) {
      const friendLocation = await db.collection('user_locations')
        .where('userId', '==', friendId)
        .limit(1)
        .get();

      if (friendLocation.empty) continue;

      const friendLoc = friendLocation.docs[0].data();
      const distance = calculateDistance(
        location.latitude, location.longitude,
        friendLoc.latitude, friendLoc.longitude
      );

      if (distance <= 10000) { // 10km
        // Check if already notified recently
        const recentNotif = await db.collection('friend_radar_notifications')
          .where('userId', '==', location.userId)
          .where('friendId', '==', friendId)
          .where('timestamp', '>', Timestamp.fromDate(new Date(Date.now() - 3600000)))
          .limit(1)
          .get();

        if (recentNotif.empty) {
          await db.collection('friend_radar_notifications').add({
            userId: location.userId,
            friendId,
            friendName: (await db.collection('users').doc(friendId).get()).data()?.displayName,
            distance,
            timestamp: Timestamp.now(),
            seen: false,
            expiresAt: Timestamp.fromDate(new Date(Date.now() + 86400000)),
          });

          // Send push notification
          await sendPushNotification(location.userId, {
            title: '📍 Freund in der Nähe!',
            body: `${friendName} ist ${formatDistance(distance)} entfernt`,
            type: 'friend_nearby',
          });
        }
      }
    }
  });
```

### 5. Block Logic Functions

```typescript
// blockUser
export const blockUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

  const blockerId = context.auth.uid;
  const blockedUserId = data.userId;

  // Create block record
  await db.collection('blocks').add({
    blockerId,
    blockedUserId,
    createdAt: Timestamp.now(),
    mutualUnblock: false,
  });

  // Remove from each other's friends
  const friendships = await db.collection('friendships')
    .where('users', 'array-contains', blockerId)
    .get();

  for (const friendship of friendships.docs) {
    if (friendship.data().users.includes(blockedUserId)) {
      await friendship.ref.delete();
    }
  }

  return { success: true };
});

// unblockUser
export const unblockUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

  const unblockerId = context.auth.uid;
  const unblockedUserId = data.userId;

  // Find the block
  const block = await db.collection('blocks')
    .where('blockerId', '==', unblockerId)
    .where('blockedUserId', '==', unblockedUserId)
    .limit(1)
    .get();

  if (block.empty) {
    throw new functions.https.HttpsError('not-found', 'Block not found');
  }

  // Check for mutual block
  const reverseBlock = await db.collection('blocks')
    .where('blockerId', '==', unblockedUserId)
    .where('blockedUserId', '==', unblockerId)
    .limit(1)
    .get();

  if (!reverseBlock.empty) {
    // Both users must unblock
    await block.docs[0].ref.update({ mutualUnblock: true });
    return { success: true, message: 'Waiting for mutual unblock' };
  }

  // Single-sided block - can unblock
  await block.docs[0].ref.delete();
  return { success: true };
});
```

### 6. Premium Functions

```typescript
// activatePremium
export const activatePremium = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

  const userId = context.auth.uid;
  const duration = data.duration; // 'monthly' | 'yearly'

  const premiumUntil = duration === 'yearly'
    ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.collection('users').doc(userId).update({
    isPremium: true,
    premiumUntil: Timestamp.fromDate(premiumUntil),
    streakFreezeUsed: false, // Reset freeze
  });

  // Award bonus XP for subscribing
  await awardXP(userId, 200, 'premium_bonus');

  return { success: true, premiumUntil };
});

// PREMIUM FEATURES
const PREMIUM_BENEFITS = {
  xpBoost: 1.5,              // 50% more XP
  exactDistance: true,        // See exact meters instead of ranges
  profileStalker: true,       // See who viewed your profile
  priorityListing: true,      // Appear first in nearby lists
  streakFreeze: 1,            // One free freeze per month
  premiumLounges: true,       // Access premium-only lounges
  noAds: true,
  extendedRadius: 10000,      // 10km max radius (vs 5km free)
};
```

---

## 🔐 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isNotBlocked(userId) {
      return !exists(/databases/$(database)/documents/blocks/$(request.auth.uid + '_' + userId));
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && isNotBlocked(userId);
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
      allow delete: if false; // Never delete user documents
    }

    // User locations (ephemeral)
    match /user_locations/{locationId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    // XP transactions (read-only for users)
    match /xp_transactions/{transactionId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow write: if false; // Only Cloud Functions can write
    }

    // Flash events
    match /flash_events/{eventId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only Cloud Functions can write
    }

    // Lounges
    match /lounges/{loungeId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && resource.data.hostId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.hostId == request.auth.uid;
    }

    // Blocks
    match /blocks/{blockId} {
      allow read: if isAuthenticated() &&
        (resource.data.blockerId == request.auth.uid ||
         resource.data.blockedUserId == request.auth.uid);
      allow create: if isAuthenticated() && request.resource.data.blockerId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.blockerId == request.auth.uid;
    }

    // Friendships
    match /friendships/{friendshipId} {
      allow read: if isAuthenticated() && request.auth.uid in resource.data.users;
      allow create: if isAuthenticated() && request.auth.uid in request.resource.data.users;
      allow update: if isAuthenticated() && request.auth.uid in resource.data.users;
      allow delete: if isAuthenticated() && request.auth.uid in resource.data.users;
    }

    // Friend radar notifications
    match /friend_radar_notifications/{notificationId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 📱 Realtime Subscriptions

### Location Updates
```typescript
// Subscribe to nearby users
const subscribeToNearbyUsers = (
  userId: string,
  center: GeoPoint,
  radiusKm: number,
  callback: (users: NearbyUser[]) => void
) => {
  const bounds = geohashQueryBounds(
    [center.latitude, center.longitude],
    radiusKm * 1000
  );

  const queries = bounds.map(([start, end]) =>
    db.collection('user_locations')
      .orderBy('geohash')
      .startAt(start)
      .endAt(end)
      .where('expiresAt', '>', Timestamp.now())
  );

  return queries.map(q => q.onSnapshot(snapshot => {
    const users = snapshot.docs
      .filter(doc => doc.data().userId !== userId)
      .map(doc => ({
        id: doc.data().userId,
        distance: calculateDistance(center, doc.data()),
        // ... more fields
      }))
      .filter(u => u.distance <= radiusKm * 1000);

    callback(users);
  }));
};
```

### Flash Event Updates
```typescript
// Subscribe to active flash events
const subscribeToFlashEvents = (
  center: GeoPoint,
  radiusKm: number,
  callback: (events: FlashEvent[]) => void
) => {
  return db.collection('flash_events')
    .where('isActive', '==', true)
    .where('endsAt', '>', Timestamp.now())
    .onSnapshot(snapshot => {
      const events = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(event => {
          const distance = calculateDistance(center, event);
          return distance <= radiusKm * 1000;
        });

      callback(events);
    });
};
```

---

## 📈 Analytics Events

```typescript
const ANALYTICS_EVENTS = {
  // User lifecycle
  'user_signup': { method: string },
  'user_login': { method: string, streak_days: number },
  'user_logout': {},

  // XP & Level
  'xp_earned': { amount: number, reason: string, multiplier: number },
  'level_up': { from_level: number, to_level: number },

  // Social
  'connection_request': { to_user: string },
  'connection_accepted': { from_user: string },
  'voice_call_started': { with_user: string },
  'voice_call_ended': { duration_seconds: number },
  'user_rated': { is_positive: boolean },
  'user_blocked': { blocked_user: string },

  // Lounges
  'lounge_created': { is_private: boolean },
  'lounge_joined': { lounge_id: string },
  'lounge_left': { duration_seconds: number },

  // Flash Events
  'flash_event_joined': { event_id: string, multiplier: number },
  'flash_event_xp_earned': { amount: number },

  // Premium
  'premium_page_viewed': {},
  'premium_purchased': { plan: string, price: number },
  'premium_cancelled': { reason?: string },

  // Privacy
  'visibility_changed': { mode: string },
  'radius_changed': { old_radius: number, new_radius: number },
};
```

---

## 🚀 Deployment Checklist

- [ ] Firestore indexes erstellt
- [ ] Security Rules deployed
- [ ] Cloud Functions deployed
- [ ] FCM konfiguriert
- [ ] Analytics aktiviert
- [ ] Geofencing konfiguriert
- [ ] Scheduled functions aktiviert
- [ ] Error monitoring (Sentry/Crashlytics)
- [ ] Performance monitoring
- [ ] A/B Testing setup

---

**Erstellt für: Butterbread UG – delulu App**
