/**
 * ConsentScreen.tsx
 * ✅ PRIVACY-FIRST CONSENT - Nur rechtliche Zustimmung
 *
 * KEINE automatischen Permission-Requests mehr!
 * Permissions werden nur bei expliziter User-Aktion abgefragt.
 *
 * @version 2.0.0 - Privacy-First Edition
 */

import React, { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, ExternalLink, Sparkles } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

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
  const [isLoading, setIsLoading] = useState(false);

  // NUR rechtliche Zustimmungen - KEINE Hardware-Permissions!
  const allAccepted = termsAccepted && privacyAccepted && ageVerified;

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
          consentTimestamp: serverTimestamp(),
          consentVersion: '2.0-privacy-first',
        });
      }

      // LocalStorage speichern für schnelle Prüfung
      localStorage.setItem('synclulu_consent_accepted', 'true');

      // KEINE automatischen Permission-Requests!
      // Permissions werden später bei expliziter User-Aktion abgefragt

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

          {/* Consent Checkboxes - NUR RECHTLICHES */}
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
                Deine Daten werden sicher verarbeitet
              </p>
            </ConsentCheckbox>

            {/* Age Verification */}
            <ConsentCheckbox checked={ageVerified} onChange={setAgeVerified}>
              <p className="text-sm text-white/80">Ich bin mindestens 16 Jahre alt</p>
              <p className="text-[10px] text-white/40 mt-1">
                Erforderlich für die Nutzung von synclulu
              </p>
            </ConsentCheckbox>
          </div>

          {/* Privacy Info */}
          <div
            className="p-4 rounded-xl mb-6"
            style={{
              background: 'rgba(168, 85, 247, 0.05)',
              border: '1px solid rgba(168, 85, 247, 0.1)',
            }}
          >
            <p className="text-xs text-white/60 text-center">
              🔒 <span className="text-purple-400">Privacy-First:</span> Standort und Mikrofon werden
              nur abgefragt, wenn du sie aktiv nutzen möchtest.
            </p>
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
                <span>Los geht's!</span>
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
