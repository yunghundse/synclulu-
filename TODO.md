# 🔴 DELULU APP - TODO Liste

## 🚨 SICHERHEIT (BLOCKER - Muss vor Launch gefixt werden!)

### Admin-Passwort Sicherheitslücke
- [x] **KRITISCH: Admin-Passwort aus Client-Code entfernen** (`src/pages/Admin.tsx`)
  - ~~Aktuell hardcoded: `ADMIN_PASSWORD = 'delulu2024admin'`~~
  - ~~Wird sogar in der UI angezeigt (Zeile 591)~~
  - ✅ **GEFIXT:** Jetzt Firebase Firestore `isAdmin: true` Flag

### Agora Voice Security
- [ ] **Token Server implementieren** für Voice Chat
  - Aktuell: null-Token (nur für Testing)
  - Muss: Token Server mit Agora App Certificate

## 🔴 NICHT FUNKTIONAL (Muss implementiert werden)

### Settings.tsx - Fehlende Logik
- [x] **Logout-Funktion implementieren** ✅ GEFIXT
- [ ] **Account pausieren** (TODO)
- [ ] **Account löschen** (TODO)
- [x] **Passwort ändern** ✅ GEFIXT (navigiert zu Login mit Reset)

### Discover.tsx
- [ ] **Voting/Kick System** (Zeile 528 - TODO)

## 🧹 CLEANUP (Vor Production)

- [ ] **40+ console.log Statements entfernen** (siehe CEO-REVIEW.md)
- [ ] Logging Service einrichten (Sentry/LogRocket)
- [ ] Mock-Daten in Settings.tsx durch echte Daten ersetzen

---

## 🔥 KRITISCH (Sofort)

### Authentication & Login
- [ ] **Google Sign-In fixen** - Erfordert Firebase Console Konfiguration:
  1. Firebase Console → Authentication → Sign-in method → Google aktivieren
  2. OAuth 2.0 Client ID von Google Cloud Console hinzufügen
  3. Authorized domains hinzufügen (delulu-app-ten.vercel.app)
- [ ] **Apple Sign-In hinzufügen** - Erfordert Apple Developer Account ($99/Jahr)
- [ ] **Facebook Login hinzufügen** - Erfordert Facebook Developer App
- [ ] **GitHub Login hinzufügen** (optional)

### Registrierung & Sicherheit
- [x] Registrierungsseite neu designen (Apple-Style)
- [x] Logo zentrieren
- [x] Placeholder aus Feldern entfernen
- [x] Passwort-Stärke-Anzeige hinzufügen
- [x] Passwort-Anforderungen (min. 8 Zeichen, Großbuchstabe, Zahl, Sonderzeichen)
- [ ] Nutzungsbedingungen-Seite verlinken
- [ ] Datenschutz-Seite verlinken

### Sprache
- [x] Sprachauswahl auf Welcome-Seite (5 Sprachen)
- [x] Sprache persistent speichern (localStorage)
- [x] Sprache auf allen Seiten beibehalten

## 🟡 WICHTIG (Diese Woche)

### Onboarding & Profil
- [ ] Geschlecht-Auswahl hinzufügen
- [ ] Vollständiges Geburtsdatum (Tag/Monat/Jahr)
- [ ] Standort-Berechtigung anfragen
- [ ] Pflichtfelder für alle Angaben

### User Limit
- [x] Limitierung auf 500 Benutzer
- [x] Warteliste wenn voll
- [ ] Admin kann Limit ändern

### Home Page
- [ ] Mehr Farben wie butterbread.org
- [ ] Träumerische Atmosphäre
- [ ] Bessere visuelle Gestaltung

### Wölkchen (Voice Rooms)
- [x] Automatisches Löschen leerer Räume
- [ ] Schöneres Cloud-Design
- [ ] Modernerer Voice Chat UI
- [ ] Profilvorschau beim Klick auf User
- [ ] Öffentlich/Anonym Auswahl vor Beitritt

## 🟢 FEATURES (Später)

### Premium/Catalyst
- [ ] Neues Abo-Modell (kein Lifetime)
- [ ] Apple Pay Integration
- [ ] Google Pay Integration
- [ ] Stripe Payment Setup
- [ ] Schöneres Abo-Design

### Star Events
- [ ] Nur Star kann Leute auf Bühne holen
- [ ] Stummschalten von Teilnehmern
- [ ] Sternchen an Stars schenken
- [ ] Stars können Leute von Bühne entfernen

### News Feed
- [ ] Bekannte Personen in der Nähe
- [ ] Push-Benachrichtigungen
- [ ] Event-Ankündigungen

### Tagesquests & Fortschritt
- [ ] Tägliche Quests System
- [ ] Wochenfortschritt anzeigen
- [ ] XP für Quest-Abschluss

## 📝 NOTIZEN

### Firebase Console Aktionen (manuell erforderlich):
1. **Google Auth aktivieren:**
   - Firebase Console → Authentication → Sign-in method
   - Google Provider aktivieren
   - Web SDK configuration ausfüllen

2. **Apple Auth aktivieren:**
   - Apple Developer Account erforderlich
   - Service ID erstellen
   - Key erstellen und hochladen

3. **Zahlungen:**
   - Stripe Account erstellen
   - Firebase Extensions: "Run Payments with Stripe" installieren
   - Oder: RevenueCat für In-App Purchases

---
*Zuletzt aktualisiert: Januar 2026*
