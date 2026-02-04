import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.synclulu',
  appName: 'synclulu',
  webDir: 'dist',
  ios: {
    minVersion: '15.0',
    allowsLinkPreview: false
  },
  server: {
    // Allow all Firebase domains
    allowNavigation: [
      'https://*.firebaseapp.com',
      'https://*.googleapis.com',
      'https://*.firebase.google.com'
    ]
  }
};

export default config;
