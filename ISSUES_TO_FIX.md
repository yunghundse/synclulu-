# 🚨 Synclulu App - Gefundene Probleme & Manuelle Fixes

**Stand:** 4. Februar 2026
**Getestet auf:** synclulu.vercel.app

---

## 🔴 KRITISCH: Firebase Security Rules - Permission Denied

### Problem
Die App funktioniert visuell, aber **alle Firebase Firestore-Abfragen schlagen fehl** mit:
```
FirebaseError: Missing or insufficient permissions.
```

### Betroffene Funktionen
- `[PrecisionRadar] Failed to fetch nearby users`
- `[PrecisionRadar] Failed to update location`
- `Error getting Dream Pass progress`
- Alle Echtzeit-Listener (snapshot listeners)

### Lösung
Du musst die **Firebase Security Rules** in der Firebase Console aktualisieren:

1. Gehe zu: https://console.firebase.google.com/
2. Wähle Projekt: **synclulu-4e6c0**
3. Navigiere zu: **Firestore Database** → **Rules**
4. Ersetze die Rules mit folgendem Code:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: Ist der User authentifiziert?
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper: Ist es der eigene User?
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // ============================================
    // USERS COLLECTION
    // ============================================
    match /users/{userId} {
      // Lesen: Authentifizierte User können alle Profile sehen
      allow read: if isAuthenticated();

      // Schreiben: Nur der eigene User kann sein Profil ändern
      allow write: if isOwner(userId);

      // Subcollections
      match /friends/{friendId} {
        allow read, write: if isOwner(userId);
      }

      match /blocked/{blockedId} {
        allow read, write: if isOwner(userId);
      }

      match /notifications/{notificationId} {
        allow read, write: if isOwner(userId);
      }
    }

    // ============================================
    // LOCATIONS COLLECTION (für Radar)
    // ============================================
    match /locations/{locationId} {
      // Alle authentifizierten User können Standorte sehen
      allow read: if isAuthenticated();

      // User kann nur seinen eigenen Standort aktualisieren
      allow write: if isAuthenticated() && request.auth.uid == locationId;
    }

    // ============================================
    // ROOMS COLLECTION (Lounges/Wölkchen)
    // ============================================
    match /rooms/{roomId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() &&
        (resource.data.creatorId == request.auth.uid ||
         request.auth.uid in resource.data.members);

      match /messages/{messageId} {
        allow read, write: if isAuthenticated();
      }
    }

    // ============================================
    // MESSAGES COLLECTION (Direct Messages)
    // ============================================
    match /messages/{conversationId} {
      allow read, write: if isAuthenticated() &&
        request.auth.uid in resource.data.participants;

      match /messages/{messageId} {
        allow read, write: if isAuthenticated();
      }
    }

    // ============================================
    // DREAM PASS COLLECTION
    // ============================================
    match /dreamPass/{passId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(passId);
    }

    // ============================================
    // REPORTS COLLECTION
    // ============================================
    match /reports/{reportId} {
      allow create: if isAuthenticated();
      allow read: if false; // Nur Admin
    }
  }
}
```

5. Klicke auf **Publish**

---

## 🟡 WICHTIG: Firebase Index fehlt

### Problem
Beim Laden der Lounges erscheint:
```
FirebaseError: The query requires an index
```

### Lösung
Erstelle den fehlenden Composite Index:

1. Klicke auf diesen Link:
   https://console.firebase.google.com/v1/r/project/synclulu-4e6c0/firestore/indexes?create_composite=ClRwcm9qZWN0cy9zeW5jbHVsdS00ZTZjMC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvcm9vbXMvaW5kZXhlcy9fEAEaCgoGaXNBY3RpdmUSARoNCgl1c2VyQ291bnQQAhoMCghfX25hbWVfXxAC

2. Oder erstelle manuell:
   - Collection: `rooms`
   - Field 1: `isActive` (Ascending)
   - Field 2: `userCount` (Descending)
   - Field 3: `__name__` (Descending)

---

## 🟢 ERLEDIGT: Diese Fixes wurden bereits gemacht

### ✅ Notification Permission entfernt
- **Problem:** Notification-Permission funktionierte nicht im Onboarding
- **Fix:** Komplett aus OnboardingFlow.tsx entfernt
- **Datei:** `src/pages/OnboardingFlow.tsx`
- **Status:** ✅ Deployed

### ✅ ConsentScreen Konflikte behoben
- **Problem:** GPS-Permission-Konflikt zwischen ConsentScreen und Onboarding
- **Fix:** Consent-Check in usePreciseLocation integriert
- **Status:** ✅ Deployed

### ✅ SovereignHomeV3 Crashes behoben
- **Problem:** TypeError: a is not a function
- **Fix:** useNebulaToast und andere Hooks repariert
- **Status:** ✅ Deployed

---

## 📋 Checkliste nach Firebase-Fixes

Nach dem Aktualisieren der Security Rules:

- [ ] Seite neu laden (Hard Refresh: Cmd+Shift+R)
- [ ] Console auf Fehler prüfen
- [ ] Testen: Home-Page lädt ohne Fehler
- [ ] Testen: Radar zeigt Standort
- [ ] Testen: Lounges/Wölkchen können erstellt werden
- [ ] Testen: Profil kann bearbeitet werden

---

## 🔧 Zusätzliche Empfehlungen

### 1. Error Boundary verbessern
Die App hat einen GlobalErrorBoundary, aber er zeigt keine hilfreichen Fehlermeldungen für Firebase-Probleme.

### 2. Offline-Support
Aktuell gibt es keine Offline-Unterstützung. Firebase Firestore hat eingebaute Offline-Persistenz, die aktiviert werden könnte:

```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db).catch((err) => {
  console.error('Offline persistence failed:', err);
});
```

### 3. Rate Limiting
Die App macht viele Firestore-Abfragen. Überlege, ob du Debouncing oder Caching hinzufügen willst.

---

**Erstellt von Claude** | Bei Fragen, frag einfach!
