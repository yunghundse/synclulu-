# delulu App

> Connect in the Clouds – Hyperlokale Community App

## Features

- 📍 **Hyperlokal** – Finde Menschen in deinem direkten Umkreis (50m - 5km)
- 🎭 **Anonym oder Offen** – Wechsle zwischen anonym und sichtbar
- 💬 **Chat** – Echtzeitnachrichten mit Menschen in deiner Nähe
- 🔒 **Privacy First** – Keine Algorithmen, keine Datenverkäufe
- 📱 **PWA** – Installierbar auf iOS & Android

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Backend**: Firebase (Firestore, Auth, Storage)
- **PWA**: Vite PWA Plugin

## Quick Start

```bash
# 1. Dependencies installieren
npm install

# 2. Entwicklungsserver starten
npm run dev

# 3. Öffne http://localhost:5173
```

## Build & Deploy

```bash
# Production Build
npm run build

# Preview Build
npm run preview

# Deploy zu Firebase
npm run deploy
```

## Projektstruktur

```
delulu-app/
├── src/
│   ├── components/     # Wiederverwendbare UI-Komponenten
│   ├── hooks/          # Custom React Hooks
│   ├── lib/            # Firebase Config, Store
│   ├── pages/          # Seiten-Komponenten
│   ├── types/          # TypeScript Types
│   ├── App.tsx         # Haupt-App mit Routing
│   ├── main.tsx        # Entry Point
│   └── index.css       # Global Styles
├── public/             # Statische Assets
├── index.html          # HTML Template
└── package.json
```

## Seiten

| Route | Beschreibung |
|-------|--------------|
| `/` | Home Dashboard |
| `/discover` | Menschen in der Nähe finden |
| `/messages` | Chat-Übersicht |
| `/profile` | Profil & Einstellungen |

## Firebase Collections

| Collection | Zweck |
|------------|-------|
| `users` | User-Profile |
| `user_locations` | Aktuelle Standorte (15 Min. TTL) |
| `connections` | Verbindungen zwischen Usern |
| `messages` | Chat-Nachrichten |

## Nächste Schritte

1. **Firebase Rules** – Firestore Security Rules einrichten
2. **Push Notifications** – Firebase Cloud Messaging
3. **Verifizierung** – Email/SMS Verifizierung
4. **Native Apps** – React Native / Capacitor

## Deployment als Native App

### iOS (App Store)

```bash
# Mit Capacitor
npm install @capacitor/core @capacitor/ios
npx cap init delulu com.butterbread.delulu
npm run build
npx cap add ios
npx cap open ios
```

### Android (Play Store)

```bash
npm install @capacitor/android
npx cap add android
npx cap open android
```

---

**Status**: MVP Ready
**Version**: 1.0.0
**Erstellt**: Januar 2025
**Ein Projekt von**: butterbread
