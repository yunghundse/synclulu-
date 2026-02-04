/**
 * ConsentScreen.tsx
 * ✅ FIRST-START CONSENT - Rechtlicher Haftungsschutz
 *
 * Einmal-Abfrage beim ersten Start:
 * - AGB Akzeptanz
 * - Datenschutz Akzeptanz
 * - Altersverifikation (16+)
 *
 * Ohne Zustimmung kein Zugriff auf die App.
 *
 * @version 1.1.0
 */

import React, { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, ExternalLink, Sparkles, MapPin, Mic, Bell } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { initializePushNotifications, requestNotificationPermission } from '@/lib/pushNotifications';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ConsentScreenProps {
  onAccept: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// CHECKBOX COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const ConsentCheckbox = memo(function ConsentCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-start gap-4 text-left w-full p-4 rounded-2xl transition-all"
      style={{
        background: checked ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255, 255, 255, 0.02)',
        border: checked ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
        style={{
          background: checked
            ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
            : 'rgba(255, 255, 255, 0.05)',
          border: checked ? 'none' : '2px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {checked && <CheckCircle size={14} className="text-white" />}
      </div>
      <div className="flex-1">{children}</div>
    </button>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const ConsentScreen = memo(function ConsentScreen({
  onAccept,
}: ConsentScreenProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);
  const [locationAccepted, setLocationAccepted] = useState(false);
  const [microphoneAccepted, setMicrophoneAccepted] = useState(false);
  const [notificationsAccepted, setNotificationsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const allAccepted = termsAccepted && privacyAccepted && ageVerified && locationAccepted && microphoneAccepted && notificationsAccepted;

  const handleConsent = useCallback(async () => {
    if (!allAccepted || isLoading) return;

    setIsLoading(true);

    try {
      // Get current user ID
      const userId = auth.currentUser?.uid;

      if (userId) {
        // Consent in Firestore speichern
        await updateDoc(doc(db, 'users', userId), {
          hasAcceptedTerms: true,
          hasAcceptedPrivacy: true,
          hasVerifiedAge: true,
          hasAcceptedLocation: true,
          hasAcceptedMicrophone: true,
          hasAcceptedNotifications: true,
          consentTimestamp: serverTimestamp(),
          consentVersion: '1.2',
        });
      }

      // LocalStorage speichern für schnelle Prüfung
      localStorage.setItem('synclulu_consent_accepted', 'true');

      // Request actual permissions
      // 1. Location Permission
      if (locationAccepted && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(() => {}, () => {}, { timeout: 1000 });
      }

      // 2. Microphone Permission
      if (microphoneAccepted && navigator.mediaDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop()); // Stop immediately
        } catch (e) {
          console.log('Microphone permission not yet granted');
        }
      }

      // 3. Push Notification Permission
      if (notificationsAccepted) {
        await requestNotificationPermission();
        await initializePushNotifications();
      }

      // Haptic Feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 50, 10]);
      }

      onAccept();
    } catch (error) {
      console.error('Consent Error:', error);
      // Trotzdem akzeptieren wenn Firestore fehlschlägt (localStorage reicht)
      localStorage.setItem('synclulu_consent_accepted', 'true');
      onAccept();
    } finally {
      setIsLoading(false);
    }
  }, [allAccepted, isLoading, onAccept]);

  const openTerms = () => {
    window.open('/legal-popup', '_blank', 'width=600,height=800,scrollbars=yes');
  };

  const openPrivacy = () => {
    window.open('/datenschutz-popup', '_blank', 'width=600,height=800,scrollbars=yes');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: 'rgba(5, 5, 5, 0.98)' }}
    >
      {/* Scrollable Container */}
      <div className="w-full h-full overflow-y-auto px-6 py-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-md mx-auto"
        >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(217, 70, 239, 0.2) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
            }}
          >
            <Shield size={36} className="text-purple-400" />
          </motion.div>

          <h1 className="text-xl font-bold text-white mb-2">Willkommen bei synclulu</h1>
          <p className="text-sm text-white/50">
            Bevor du startest, lies bitte unsere Bedingungen
          </p>
        </div>

        {/* Consent Checkboxes */}
        <div className="space-y-3 mb-8">
          {/* Terms */}
          <ConsentCheckbox checked={termsAccepted} onChange={setTermsAccepted}>
            <p className="text-sm text-white/80">
              Ich akzeptiere die{' '}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openTerms();
                }}
                className="text-purple-400 underline inline-flex items-center gap-1"
              >
                Nutzungsbedingungen
                <ExternalLink size={12} />
              </button>
            </p>
            <p className="text-[10px] text-white/40 mt-1">
              Inkl. Community-Richtlinien und KI-Moderation
            </p>
          </ConsentCheckbox>

          {/* Privacy */}
          <ConsentCheckbox checked={privacyAccepted} onChange={setPrivacyAccepted}>
            <p className="text-sm text-white/80">
              Ich akzeptiere die{' '}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openPrivacy();
                }}
                className="text-purple-400 underline inline-flex items-center gap-1"
              >
                Datenschutzerklärung
                <ExternalLink size={12} />
              </button>
            </p>
            <p className="text-[10px] text-white/40 mt-1">
              Standortdaten werden nur während der Nutzung verarbeitet
            </p>
          </ConsentCheckbox>

          {/* Age Verification */}
          <ConsentCheckbox checked={ageVerified} onChange={setAgeVerified}>
            <p className="text-sm text-white/80">Ich bin mindestens 16 Jahre alt</p>
            <p className="text-[10px] text-white/40 mt-1">
              Erforderlich für die Nutzung von synclulu
            </p>
          </ConsentCheckbox>

          {/* Location Permission - Pflicht */}
          <ConsentCheckbox checked={locationAccepted} onChange={setLocationAccepted}>
            <div className="flex items-start gap-2">
              <MapPin size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white/80">Standort-Zugriff erlauben</p>
                <p className="text-[10px] text-white/40 mt-1">
                  Pflicht: Wird benötigt um Wölkchen und Freunde in deiner Nähe zu finden
                </p>
              </div>
            </div>
          </ConsentCheckbox>

          {/* Microphone Permission - Pflicht für Wölkchen */}
          <ConsentCheckbox checked={microphoneAccepted} onChange={setMicrophoneAccepted}>
            <div className="flex items-start gap-2">
              <Mic size={16} className="text-violet-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white/80">Mikrofon-Zugriff erlauben</p>
                <p className="text-[10px] text-white/40 mt-1">
                  Pflicht: Wird benötigt um in Wölkchen sprechen zu können
                </p>
              </div>
            </div>
          </ConsentCheckbox>

          {/* Push Notifications Permission - Pflicht */}
          <ConsentCheckbox checked={notificationsAccepted} onChange={setNotificationsAccepted}>
            <div className="flex items-start gap-2">
              <Bell size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white/80">Push-Benachrichtigungen erlauben</p>
                <p className="text-[10px] text-white/40 mt-1">
                  Pflicht: Erhalte Benachrichtigungen über Nachrichten, Freundschaftsanfragen und Wölkchen in deiner Nähe
                </p>
              </div>
            </div>
          </ConsentCheckbox>
        </div>

        {/* Action Button */}
        <motion.button
          whileTap={{ scale: allAccepted ? 0.98 : 1 }}
          onClick={handleConsent}
          disabled={!allAccepted || isLoading}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-white transition-all"
          style={{
            background: allAccepted
              ? 'linear-gradient(135deg, #A855F7 0%, #D946EF 100%)'
              : 'rgba(255, 255, 255, 0.05)',
            opacity: allAccepted ? 1 : 0.5,
            boxShadow: allAccepted ? '0 0 30px rgba(168, 85, 247, 0.3)' : 'none',
          }}
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <>
              <Sparkles size={18} />
              <span>Einverstanden & Sync starten</span>
            </>
          )}
        </motion.button>

        {/* Footer */}
        <p className="text-center text-[10px] text-white/30 mt-6 mb-8">
          Mit der Zustimmung bestätigst du, dass du unsere Regeln gelesen und verstanden hast.
        </p>
      </motion.div>
      </div>
    </motion.div>
  );
});

export default ConsentScreen;
