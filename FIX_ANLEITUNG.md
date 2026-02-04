# synclulu Fix-Anleitung

## 🔧 Was wurde gefixt

### 1. Register-Seite "Prüfe Verfügbarkeit..." hängt
**Problem:** Die Register-Seite blieb bei "Prüfe Verfügbarkeit..." hängen wegen Firestore Permission-Fehlern.

**Ursache:** Die `checkCapacity()` Funktion in `gatekeeperSystem.ts` machte Firestore-Abfragen BEVOR der User authentifiziert war. Da die Firestore Rules `request.auth != null` verlangten, schlug dies fehl.

**Lösung (bereits im Code):**
- `src/lib/gatekeeperSystem.ts`: Graceful error handling für permission-denied
- `src/hooks/useAuth.ts`: Try-catch um Firestore-Calls mit Fallback
- `src/components/VibeMap/VibeMap.tsx`: Error callbacks für onSnapshot listeners
- `firestore.rules`: Public read für system/stats, system/config, referrals, waitlist

### 2. **NEU** Permission-Konflikte zwischen ConsentScreen und Location-Hooks
**Problem:** Standort- und Mikrofon-Freigabe überschrieben sich gegenseitig.

**Ursache:** Die Location-Hooks (`usePreciseLocation`, `useLocation`, `useGeolocation`) starteten SOFORT `watchPosition` beim Mount - gleichzeitig mit dem ConsentScreen, der auch Permissions anfragte.

**Lösung (bereits im Code):**
- `src/hooks/usePreciseLocation.ts`: Prüft jetzt `localStorage` auf Consent BEVOR Location angefragt wird
- `src/hooks/useLocation.ts`: Gleiches Consent-Check hinzugefügt
- `src/hooks/useGeolocation.ts`: Gleiches Consent-Check hinzugefügt
- `src/components/ConsentScreen/ConsentScreen.tsx`:
  - Setzt `localStorage` ZUERST (damit Hooks wissen, dass Consent da ist)
  - Fragt Permissions SEQUENTIELL statt parallel an
  - Location-Anfrage entfernt (wird automatisch von Hooks übernommen)

### 3. Push-Benachrichtigungen hinzugefügt
**Neue Datei:** `src/lib/pushNotifications.ts`
- Service für Web Push Notifications
- Benachrichtigungen für neue Nachrichten, Freundschaftsanfragen, Wölkchen in der Nähe

### 4. ConsentScreen erweitert
**Datei:** `src/components/ConsentScreen/ConsentScreen.tsx`
- Notifications-Checkbox hinzugefügt
- Echte Browser Permission-Anfragen bei Consent
- Scrollbarer Container für mobile Geräte

---

## 📋 Manuelle Schritte (WICHTIG!)

### Schritt 1: Git Push
Der Git Push funktioniert nicht wegen Proxy-Einstellungen. Du musst manuell pushen:

```bash
cd /pfad/zu/delulu-app
git push origin main
```

### Schritt 2: Firestore Rules deployen
Die Firestore Rules müssen auf Firebase deployed werden:

```bash
# Firebase CLI installieren (falls nicht vorhanden)
npm install -g firebase-tools

# Einloggen
firebase login

# Rules deployen
firebase deploy --only firestore:rules
```

**ODER** manuell in der Firebase Console:
1. Gehe zu https://console.firebase.google.com
2. Wähle dein synclulu-Projekt
3. Navigiere zu "Firestore Database" → "Rules"
4. Kopiere den Inhalt von `firestore.rules` und füge ihn ein
5. Klicke "Publish"

### Schritt 3: Vercel Deployment abwarten
Nach dem Git Push wird Vercel automatisch deployen. Warte ca. 2-3 Minuten.

---

## 🧪 Testen

### Register-Seite testen
1. Öffne https://synclulu.vercel.app/register
2. Die Seite sollte NICHT mehr bei "Prüfe Verfügbarkeit..." hängen
3. Das Formular sollte sofort angezeigt werden

### Mit neuem Account testen
1. Fülle das Registrierungsformular aus
2. Nach erfolgreicher Registrierung sollte der ConsentScreen erscheinen
3. Alle Checkboxen anklicken (inkl. Notifications, Standort, Mikrofon)
4. Nach Consent sollte die App zum Onboarding weiterleiten

### Mit Hauptaccount testen
1. Logge dich mit jan@synclulu.app ein
2. Prüfe ob die Karte lädt
3. Prüfe ob Standort angezeigt wird

---

## 🔍 Falls Probleme auftreten

### Console-Fehler prüfen
Öffne die Browser DevTools (F12) und schau in der Console nach Fehlern:
- `permission-denied` Fehler sollten jetzt graceful behandelt werden
- Keine "Missing or insufficient permissions" Fehler mehr

### Firestore Rules überprüfen
In der Firebase Console unter "Firestore" → "Rules" sollte folgendes stehen:

```javascript
// System stats - Public read
match /system/stats {
  allow read: if true;
  // ...
}

// System config - Public read
match /system/config {
  allow read: if true;
  // ...
}

// Referrals - Public read
match /referrals/{code} {
  allow read: if true;
  // ...
}

// Waitlist - Public read and create
match /waitlist/{email} {
  allow read: if true;
  allow create: if true;
  // ...
}
```

---

## 📁 Geänderte Dateien

1. `firestore.rules` - Public read für Pre-Auth Collections
2. `src/lib/gatekeeperSystem.ts` - Graceful permission handling
3. `src/hooks/useAuth.ts` - Error handling im onAuthStateChanged
4. `src/components/VibeMap/VibeMap.tsx` - Error callbacks für listeners
5. `src/lib/pushNotifications.ts` - (NEU) Push Notification Service
6. `src/components/ConsentScreen/ConsentScreen.tsx` - Notifications Consent + Sequential Permissions
7. `src/hooks/usePreciseLocation.ts` - Consent-Check vor Location-Anfrage
8. `src/hooks/useLocation.ts` - Consent-Check vor Location-Anfrage
9. `src/hooks/useGeolocation.ts` - Consent-Check vor Location-Anfrage

---

## ✅ Zusammenfassung

Die Code-Änderungen sind fertig und lokal committed. Du musst nur noch:

1. **Git push** durchführen (oder Änderungen manuell hochladen)
2. **Firestore Rules** auf Firebase deployen
3. **Testen** ob alles funktioniert

Bei Fragen oder Problemen kannst du mich gerne wieder ansprechen!
