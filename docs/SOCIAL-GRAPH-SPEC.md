# 🔗 DELULU Social Graph Spezifikation

> **Version:** 1.0 | **Architektur:** Senior Product Architect | **Last Update:** Januar 2026

---

## 🎯 Übersicht

Das Social Graph System von Delulu basiert auf drei Säulen:

```
┌─────────────────────────────────────────────────────────────────┐
│                     SOCIAL GRAPH ARCHITEKTUR                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     │
│    │   FOLLOW    │     │   FRIENDS   │     │    STARS    │     │
│    │  (1-sided)  │     │ (Handshake) │     │  (XP Gift)  │     │
│    └─────────────┘     └─────────────┘     └─────────────┘     │
│           │                   │                   │             │
│           ▼                   ▼                   ▼             │
│    ┌─────────────────────────────────────────────────────┐     │
│    │              IDENTITY LAYER                          │     │
│    │   @handle (unique) → displayName → anonymousAlias   │     │
│    └─────────────────────────────────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🆔 Identity Management

### 1. Unique Handle System

```typescript
// Firestore: /users/{userId}
interface UserIdentity {
  // UNIQUE - einmalig in gesamter DB
  username: string;           // @handle: lowercase, 3-20 chars, [a-z0-9_]

  // FREI WÄHLBAR - kann jederzeit geändert werden
  displayName: string;        // Spitzname für UI

  // AUTO-GENERIERT - für anonymen Modus
  anonymousAlias: string;     // "Wanderer_4829", "Träumer_1337"
}
```

### Username-Validierung (Cloud Function)

```typescript
// validateUsername.ts
export const validateUsername = functions.https.onCall(async (data, context) => {
  const { username } = data;

  // 1. Format check
  if (!USERNAME_RULES.pattern.test(username)) {
    throw new HttpsError('invalid-argument', 'Nur Kleinbuchstaben, Zahlen und Unterstriche erlaubt');
  }

  // 2. Length check
  if (username.length < 3 || username.length > 20) {
    throw new HttpsError('invalid-argument', 'Username muss 3-20 Zeichen lang sein');
  }

  // 3. Reserved words check
  if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
    throw new HttpsError('invalid-argument', 'Dieser Username ist reserviert');
  }

  // 4. Uniqueness check (case-insensitive)
  const existing = await db.collection('users')
    .where('username_lower', '==', username.toLowerCase())
    .limit(1)
    .get();

  if (!existing.empty) {
    throw new HttpsError('already-exists', 'Username bereits vergeben');
  }

  return { available: true };
});

const RESERVED_USERNAMES = [
  'admin', 'delulu', 'support', 'help', 'system', 'mod', 'moderator',
  'official', 'staff', 'team', 'butterbread', 'premium', 'pro',
  'null', 'undefined', 'anonymous', 'anon', 'guest', 'user'
];
```

### 2. Anonymity Layer

```typescript
// Globaler Toggle-Status
interface AnonymityState {
  isGlobalAnonymous: boolean;  // Master-Switch
  avatarBlurred: boolean;      // Profilbild verschleiert
  showLevel: boolean;          // Level trotzdem zeigen?
}

// Auto-generierter Alias
function generateAnonymousAlias(): string {
  const adjectives = ['Stiller', 'Neugieriger', 'Wandernder', 'Träumender', 'Suchender'];
  const nouns = ['Wanderer', 'Träumer', 'Entdecker', 'Beobachter', 'Reisender'];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9999);

  return `${adj}${noun}_${num}`;
}
```

---

## 👥 Follow System (Einseitig)

### Datenmodell

```typescript
// Firestore: /follows/{followId}
interface FollowDocument {
  id: string;                  // Auto-generated
  followerId: string;          // Wer folgt
  followingId: string;         // Wem wird gefolgt
  createdAt: Timestamp;
  notificationsEnabled: boolean;

  // Denormalized for queries
  followerUsername: string;
  followingUsername: string;
}

// Compound index for efficiency
// follows: followerId ASC, followingId ASC
// follows: followingId ASC, createdAt DESC
```

### Cloud Functions

```typescript
// followUser.ts
export const followUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Login required');

  const followerId = context.auth.uid;
  const { targetUserId } = data;

  // Prevent self-follow
  if (followerId === targetUserId) {
    throw new HttpsError('invalid-argument', 'Du kannst dir nicht selbst folgen');
  }

  // Check if blocked
  const block = await db.collection('blocks')
    .where('blockerId', '==', targetUserId)
    .where('blockedUserId', '==', followerId)
    .limit(1).get();

  if (!block.empty) {
    throw new HttpsError('permission-denied', 'Du kannst diesem User nicht folgen');
  }

  // Check existing follow
  const existingFollow = await db.collection('follows')
    .where('followerId', '==', followerId)
    .where('followingId', '==', targetUserId)
    .limit(1).get();

  if (!existingFollow.empty) {
    throw new HttpsError('already-exists', 'Du folgst diesem User bereits');
  }

  // Create follow
  const batch = db.batch();

  // 1. Create follow document
  const followRef = db.collection('follows').doc();
  batch.set(followRef, {
    followerId,
    followingId: targetUserId,
    createdAt: FieldValue.serverTimestamp(),
    notificationsEnabled: true,
  });

  // 2. Update follower counts
  batch.update(db.collection('users').doc(followerId), {
    followingCount: FieldValue.increment(1),
  });

  batch.update(db.collection('users').doc(targetUserId), {
    followerCount: FieldValue.increment(1),
  });

  // 3. Check for mutual follow → notify "Gegenseitiges Folgen!"
  const reverseFollow = await db.collection('follows')
    .where('followerId', '==', targetUserId)
    .where('followingId', '==', followerId)
    .limit(1).get();

  await batch.commit();

  // Send notification
  await sendPushNotification(targetUserId, {
    title: '👋 Neuer Follower!',
    body: `@${(await getUser(followerId)).username} folgt dir jetzt${reverseFollow.empty ? '' : ' - Gegenseitig! 🤝'}`,
    type: 'new_follower',
  });

  return { success: true, isMutual: !reverseFollow.empty };
});

// unfollowUser.ts
export const unfollowUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Login required');

  const followerId = context.auth.uid;
  const { targetUserId } = data;

  const follow = await db.collection('follows')
    .where('followerId', '==', followerId)
    .where('followingId', '==', targetUserId)
    .limit(1).get();

  if (follow.empty) {
    throw new HttpsError('not-found', 'Du folgst diesem User nicht');
  }

  const batch = db.batch();

  // 1. Delete follow
  batch.delete(follow.docs[0].ref);

  // 2. Update counts
  batch.update(db.collection('users').doc(followerId), {
    followingCount: FieldValue.increment(-1),
  });

  batch.update(db.collection('users').doc(targetUserId), {
    followerCount: FieldValue.increment(-1),
  });

  await batch.commit();

  return { success: true };
});
```

---

## ⭐ Star System (XP Gift)

### Konfiguration

```typescript
const STAR_CONFIG = {
  xpPerStar: 15,              // XP pro Stern für Empfänger
  freeStarsPerDay: 3,         // Kostenlose Sterne pro Tag
  premiumUnlimited: true,     // Premium = unbegrenzt
  maxStarsPerUser: 5,         // Max Sterne an einen User pro Tag
  cooldownMinutes: 0,         // Kein Cooldown zwischen Sternen
};
```

### Datenmodell

```typescript
// Firestore: /stars/{starId}
interface StarDocument {
  id: string;
  giverId: string;
  receiverId: string;
  amount: number;             // 1-5 Sterne
  message?: string;           // Optional: "Toll gemacht!"
  xpAwarded: number;          // amount * xpPerStar
  createdAt: Timestamp;

  // Denormalized
  giverUsername: string;
  receiverUsername: string;
}

// Firestore: /star_limits/{date_userId}
interface StarLimitDocument {
  userId: string;
  date: string;               // "2026-01-30"
  starsGiven: number;
  starsGivenTo: {
    [userId: string]: number;
  };
}
```

### Cloud Functions

```typescript
// giveStar.ts
export const giveStar = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Login required');

  const giverId = context.auth.uid;
  const { receiverId, amount, message } = data;

  // Validate amount
  if (amount < 1 || amount > 5) {
    throw new HttpsError('invalid-argument', '1-5 Sterne erlaubt');
  }

  // Get giver
  const giver = await db.collection('users').doc(giverId).get();
  const giverData = giver.data()!;

  // Check daily limit (unless premium)
  const today = new Date().toISOString().split('T')[0];
  const limitRef = db.collection('star_limits').doc(`${today}_${giverId}`);
  const limitDoc = await limitRef.get();

  if (!giverData.isPremium) {
    if (limitDoc.exists) {
      const limits = limitDoc.data()!;

      // Daily total check
      if (limits.starsGiven >= STAR_CONFIG.freeStarsPerDay) {
        throw new HttpsError('resource-exhausted', 'Tägliches Limit erreicht. Premium = Unbegrenzt!');
      }

      // Per-user check
      if ((limits.starsGivenTo[receiverId] || 0) + amount > STAR_CONFIG.maxStarsPerUser) {
        throw new HttpsError('resource-exhausted', `Max ${STAR_CONFIG.maxStarsPerUser} Sterne pro User/Tag`);
      }
    }
  }

  const xpAwarded = amount * STAR_CONFIG.xpPerStar;

  const batch = db.batch();

  // 1. Create star record
  const starRef = db.collection('stars').doc();
  batch.set(starRef, {
    giverId,
    receiverId,
    amount,
    message: message || null,
    xpAwarded,
    createdAt: FieldValue.serverTimestamp(),
    giverUsername: giverData.username,
    receiverUsername: (await db.collection('users').doc(receiverId).get()).data()!.username,
  });

  // 2. Update receiver XP
  batch.update(db.collection('users').doc(receiverId), {
    xp: FieldValue.increment(xpAwarded),
    totalStarsReceived: FieldValue.increment(amount),
  });

  // 3. Update giver stats
  batch.update(db.collection('users').doc(giverId), {
    totalStarsGiven: FieldValue.increment(amount),
  });

  // 4. Update daily limit
  if (!giverData.isPremium) {
    batch.set(limitRef, {
      userId: giverId,
      date: today,
      starsGiven: FieldValue.increment(amount),
      [`starsGivenTo.${receiverId}`]: FieldValue.increment(amount),
    }, { merge: true });
  }

  await batch.commit();

  // 5. Create XP transaction
  await db.collection('xp_transactions').add({
    userId: receiverId,
    amount: xpAwarded,
    reason: 'star_received',
    multiplier: 1,
    finalAmount: xpAwarded,
    timestamp: FieldValue.serverTimestamp(),
    metadata: { starId: starRef.id, fromUserId: giverId },
  });

  // 6. Send notification
  await sendPushNotification(receiverId, {
    title: `⭐ ${amount} Stern${amount > 1 ? 'e' : ''} erhalten!`,
    body: `@${giverData.username} hat dir ${amount}⭐ geschenkt${message ? `: "${message}"` : ''}. +${xpAwarded} XP!`,
    type: 'star_received',
  });

  return { success: true, xpAwarded };
});
```

---

## 🤝 Handshake Friendship System

### Prinzip

```
User A sendet Anfrage → User B muss bestätigen → Erst dann: Freunde
                                                 ↓
                            Friend-Radar aktiv + gegenseitige Sichtbarkeit
```

### Datenmodell

```typescript
// Firestore: /friendships/{friendshipId}
interface FriendshipDocument {
  id: string;
  users: [string, string];    // Sortierte User-IDs
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  initiatorId: string;        // Wer hat Anfrage gesendet
  createdAt: Timestamp;
  acceptedAt?: Timestamp;

  // Handshake-Tracking
  userAConfirmed: boolean;    // Hat User A bestätigt?
  userBConfirmed: boolean;    // Hat User B bestätigt?

  // Denormalized for queries
  userAUsername: string;
  userBUsername: string;
}

// Index: users ARRAY_CONTAINS, status ASC
```

### Cloud Functions

```typescript
// sendFriendRequest.ts
export const sendFriendRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Login required');

  const senderId = context.auth.uid;
  const { targetUserId, message } = data;

  // Validation
  if (senderId === targetUserId) {
    throw new HttpsError('invalid-argument', 'Du kannst dir nicht selbst eine Anfrage senden');
  }

  // Check block status
  const block = await db.collection('blocks')
    .where('blockerId', 'in', [senderId, targetUserId])
    .where('blockedUserId', 'in', [senderId, targetUserId])
    .limit(1).get();

  if (!block.empty) {
    throw new HttpsError('permission-denied', 'Freundschaftsanfrage nicht möglich');
  }

  // Check existing friendship
  const sortedUsers = [senderId, targetUserId].sort() as [string, string];
  const existingFriendship = await db.collection('friendships')
    .where('users', '==', sortedUsers)
    .limit(1).get();

  if (!existingFriendship.empty) {
    const status = existingFriendship.docs[0].data().status;
    if (status === 'accepted') {
      throw new HttpsError('already-exists', 'Ihr seid bereits Freunde');
    }
    if (status === 'pending') {
      throw new HttpsError('already-exists', 'Anfrage bereits gesendet');
    }
  }

  const sender = await db.collection('users').doc(senderId).get();
  const senderData = sender.data()!;

  // Create pending friendship
  const friendshipRef = db.collection('friendships').doc();
  await friendshipRef.set({
    users: sortedUsers,
    status: 'pending',
    initiatorId: senderId,
    createdAt: FieldValue.serverTimestamp(),
    userAConfirmed: sortedUsers[0] === senderId,
    userBConfirmed: sortedUsers[1] === senderId,
    userAUsername: (await db.collection('users').doc(sortedUsers[0]).get()).data()!.username,
    userBUsername: (await db.collection('users').doc(sortedUsers[1]).get()).data()!.username,
  });

  // Create notification/request document
  await db.collection('friend_requests').add({
    fromUserId: senderId,
    toUserId: targetUserId,
    friendshipId: friendshipRef.id,
    fromUsername: senderData.username,
    fromDisplayName: senderData.displayName,
    fromAvatar: senderData.avatarUrl || null,
    fromLevel: senderData.level || 1,
    fromTrustScore: senderData.trustScore || 3.0,
    message: message || null,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
  });

  // Send push notification
  await sendPushNotification(targetUserId, {
    title: '🤝 Freundschaftsanfrage!',
    body: `@${senderData.username} möchte mit dir befreundet sein${message ? `: "${message}"` : ''}`,
    type: 'friend_request',
  });

  return { success: true, friendshipId: friendshipRef.id };
});

// acceptFriendRequest.ts
export const acceptFriendRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Login required');

  const acceptorId = context.auth.uid;
  const { requestId } = data;

  // Get request
  const requestRef = db.collection('friend_requests').doc(requestId);
  const request = await requestRef.get();

  if (!request.exists) {
    throw new HttpsError('not-found', 'Anfrage nicht gefunden');
  }

  const requestData = request.data()!;

  if (requestData.toUserId !== acceptorId) {
    throw new HttpsError('permission-denied', 'Du kannst diese Anfrage nicht annehmen');
  }

  // Update friendship
  const sortedUsers = [requestData.fromUserId, acceptorId].sort() as [string, string];
  const friendship = await db.collection('friendships')
    .where('users', '==', sortedUsers)
    .where('status', '==', 'pending')
    .limit(1).get();

  if (friendship.empty) {
    throw new HttpsError('not-found', 'Freundschaft nicht gefunden');
  }

  const batch = db.batch();

  // 1. Update friendship status
  batch.update(friendship.docs[0].ref, {
    status: 'accepted',
    acceptedAt: FieldValue.serverTimestamp(),
    userAConfirmed: true,
    userBConfirmed: true,
  });

  // 2. Update friend counts
  batch.update(db.collection('users').doc(requestData.fromUserId), {
    friendCount: FieldValue.increment(1),
  });
  batch.update(db.collection('users').doc(acceptorId), {
    friendCount: FieldValue.increment(1),
  });

  // 3. Delete request
  batch.delete(requestRef);

  await batch.commit();

  // 4. Award XP to both
  const XP_FOR_FRIENDSHIP = 30;
  for (const userId of [requestData.fromUserId, acceptorId]) {
    await db.collection('xp_transactions').add({
      userId,
      amount: XP_FOR_FRIENDSHIP,
      reason: 'friendship',
      multiplier: 1,
      finalAmount: XP_FOR_FRIENDSHIP,
      timestamp: FieldValue.serverTimestamp(),
    });

    await db.collection('users').doc(userId).update({
      xp: FieldValue.increment(XP_FOR_FRIENDSHIP),
    });
  }

  // 5. Send notification to initiator
  const acceptor = await db.collection('users').doc(acceptorId).get();
  await sendPushNotification(requestData.fromUserId, {
    title: '🎉 Freundschaft bestätigt!',
    body: `@${acceptor.data()!.username} hat deine Anfrage angenommen. Ihr seid jetzt Freunde!`,
    type: 'friend_accepted',
  });

  return { success: true };
});
```

---

## 💬 Chat Gatekeeper

### Flow

```
User klickt "Chat beitreten"
           ↓
   ┌───────────────────┐
   │  GATEKEEPER MODAL │
   ├───────────────────┤
   │                   │
   │   🔒 Anonym       │  ← Empfohlen
   │   "Wanderer_4829" │
   │                   │
   │   👁️ Öffentlich   │
   │   "@jan_h"        │
   │                   │
   └───────────────────┘
           ↓
   Auswahl wird gespeichert (24h)
           ↓
   User betritt Chat mit gewählter Identität
```

### Datenmodell

```typescript
// Firestore: /chat_identities/{chatId_userId}
interface ChatIdentityChoice {
  chatId: string;
  userId: string;
  identityMode: 'anonymous' | 'public';
  chosenAt: Timestamp;
  expiresAt: Timestamp;       // +24h
}
```

### Implementierung

```typescript
// Client-Side Hook
function useChatGatekeeper(chatId: string) {
  const { user } = useStore();
  const [showGatekeeper, setShowGatekeeper] = useState(false);
  const [identityMode, setIdentityMode] = useState<'anonymous' | 'public' | null>(null);

  useEffect(() => {
    // Check if choice exists and is valid
    const checkChoice = async () => {
      const choiceRef = doc(db, 'chat_identities', `${chatId}_${user.id}`);
      const choice = await getDoc(choiceRef);

      if (choice.exists()) {
        const data = choice.data();
        if (data.expiresAt.toDate() > new Date()) {
          setIdentityMode(data.identityMode);
          return;
        }
      }

      // No valid choice → show gatekeeper
      setShowGatekeeper(true);
    };

    checkChoice();
  }, [chatId, user.id]);

  const makeChoice = async (mode: 'anonymous' | 'public') => {
    await setDoc(doc(db, 'chat_identities', `${chatId}_${user.id}`), {
      chatId,
      userId: user.id,
      identityMode: mode,
      chosenAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    });

    setIdentityMode(mode);
    setShowGatekeeper(false);
  };

  return { showGatekeeper, identityMode, makeChoice };
}
```

---

## 📊 XP Balancing Matrix

### XP-Quellen

| Aktion | Base XP | Streak-Multiplikator | Premium-Boost | Max/Tag |
|--------|---------|---------------------|---------------|---------|
| Voice-Minute | +10 | ✅ | ✅ | 120 |
| Positive Rating erhalten | +25 | ✅ | ✅ | 20 |
| Negative Rating erhalten | -15 | ❌ | ❌ | - |
| Daily Login | +50 | ✅ | ✅ | 1 |
| Erste Verbindung des Tages | +100 | ✅ | ✅ | 1 |
| Lounge erstellt | +75 | ✅ | ✅ | 3 |
| Flash Event teilgenommen | +50 × Mult | ✅ | ✅ | - |
| Freundschaft geschlossen | +30 | ✅ | ✅ | 5 |
| Stern erhalten (pro Stern) | +15 | ❌ | ❌ | - |
| Stern gegeben | +5 | ❌ | ✅ | 3/∞ |
| Report erhalten (bestätigt) | -50 | ❌ | ❌ | - |
| Spam-Penalty | -100 | ❌ | ❌ | - |

### Level-Progression

```typescript
// XP = Level^1.5 × 100
const XP_FOR_LEVEL = [
  0,       // Level 0 (unused)
  100,     // Level 1
  283,     // Level 2
  520,     // Level 3
  800,     // Level 4
  1118,    // Level 5
  // ... schneller Fortschritt früh

  14697,   // Level 20
  // ... moderater Fortschritt

  50000,   // Level 50
  // ... langsamer Fortschritt

  100000,  // Level 100 (Max)
];

// Geschätzte Zeit bis Level 100:
// Casual (30min/Tag): ~6 Monate
// Active (2h/Tag): ~2 Monate
// Hardcore + Premium: ~1 Monat
```

---

## 🔐 Security Rules Update

```javascript
// firestore.rules (Erweiterung)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ... bestehende Rules ...

    // Follows
    match /follows/{followId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated()
        && request.resource.data.followerId == request.auth.uid
        && request.resource.data.followingId != request.auth.uid;
      allow delete: if isAuthenticated()
        && resource.data.followerId == request.auth.uid;
    }

    // Stars
    match /stars/{starId} {
      allow read: if isAuthenticated()
        && (resource.data.giverId == request.auth.uid
            || resource.data.receiverId == request.auth.uid);
      // Write only through Cloud Functions
      allow write: if false;
    }

    // Star Limits
    match /star_limits/{limitId} {
      allow read: if isAuthenticated()
        && resource.data.userId == request.auth.uid;
      allow write: if false;
    }

    // Friend Requests
    match /friend_requests/{requestId} {
      allow read: if isAuthenticated()
        && (resource.data.fromUserId == request.auth.uid
            || resource.data.toUserId == request.auth.uid);
      allow write: if false;
    }

    // Chat Identities
    match /chat_identities/{identityId} {
      allow read: if isAuthenticated()
        && resource.data.userId == request.auth.uid;
      allow create, update: if isAuthenticated()
        && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 📱 Performance-Optimierungen

### 1. Denormalization

```typescript
// Statt joins → denormalisierte Felder
// Follow: followerUsername, followingUsername
// Star: giverUsername, receiverUsername
// Friendship: userAUsername, userBUsername
```

### 2. Counter Caching

```typescript
// User document enthält:
// - followerCount, followingCount (statt count queries)
// - totalStarsReceived, totalStarsGiven
// - friendCount
```

### 3. Pagination

```typescript
// Alle Listen: Cursor-based Pagination
const getFollowers = async (userId: string, lastDoc?: DocumentSnapshot) => {
  let query = db.collection('follows')
    .where('followingId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(20);

  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }

  return query.get();
};
```

### 4. Realtime Subscriptions (Websockets via Firestore)

```typescript
// Live Updates für Social Graph
const subscribeToFriendRequests = (userId: string, callback: Function) => {
  return db.collection('friend_requests')
    .where('toUserId', '==', userId)
    .onSnapshot(snapshot => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
};
```

---

**Erstellt für: Butterbread UG – delulu App**
