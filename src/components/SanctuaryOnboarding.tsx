/**
 * SANCTUARY ONBOARDING v3.5
 * "Deine Wolke. Dein Schutzraum. ✨"
 *
 * Schlanke Version mit nativem Darkmode-Sync
 * Kombiniert Apple UX mit rechtlicher Absicherung
 *
 * @version 3.5.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { recordLegalConsent } from '@/lib/legalAudit';

interface SanctuaryOnboardingProps {
  onAccept: () => void;
  onDecline?: () => void;
}

const SanctuaryOnboarding: React.FC<SanctuaryOnboardingProps> = ({
  onAccept,
  onDecline,
}) => {
  const { user } = useStore();
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Haptic feedback
  const triggerHaptic = useCallback((pattern: number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  // Handle toggle
  const handleToggle = useCallback(() => {
    setIsChecked(prev => !prev);
    triggerHaptic([10]);
  }, [triggerHaptic]);

  // Handle accept
  const handleAccept = useCallback(async () => {
    if (!isChecked || !user?.id) return;

    setIsSubmitting(true);
    triggerHaptic([10, 5, 10]);

    try {
      // Record legal consent
      await recordLegalConsent({
        userId: user.id,
        consentType: 'community_guidelines',
        version: '3.5.0',
        granted: true,
        metadata: { sanctuary: true },
      });

      await recordLegalConsent({
        userId: user.id,
        consentType: 'safety_recording',
        version: '3.5.0',
        granted: true,
        metadata: { sanctuary: true },
      });

      // Show success animation
      setShowSuccess(true);
      triggerHaptic([15, 10, 15, 10, 30]);

      // Delay before callback
      setTimeout(() => {
        onAccept();
      }, 1500);

    } catch (error) {
      console.error('Consent recording failed:', error);
      setIsSubmitting(false);
    }
  }, [isChecked, user?.id, onAccept, triggerHaptic]);

  // Success state
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[var(--delulu-bg)]/90 backdrop-blur-2xl theme-transition">
        <div className="text-center animate-[fadeIn_0.5s_ease-out]">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-[scaleIn_0.5s_ease-out]">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[var(--delulu-text)] mb-2">
            Willkommen im Sanctuary! 🌟
          </h2>
          <p className="text-[var(--delulu-muted)]">
            Du bist jetzt geschützt.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[var(--delulu-bg)]/90 backdrop-blur-2xl theme-transition">
      <div className="max-w-md w-full p-8 rounded-[32px] border border-[var(--delulu-border)] bg-[var(--delulu-card)] shadow-2xl theme-transition">

        {/* Pulsierendes Shield Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Pulse Animation */}
            <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/20" />
            <div className="absolute inset-0 animate-pulse rounded-full bg-violet-500/10" />

            {/* Icon Container */}
            <div className="relative bg-violet-500/10 p-5 rounded-full">
              <svg
                className="w-8 h-8 text-violet-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Headline */}
        <h2 className="text-2xl font-bold text-center mb-4 text-[var(--delulu-text)]">
          Deine Wolke. Dein Schutzraum. ✨
        </h2>

        {/* Description */}
        <p className="text-sm text-center mb-8 leading-relaxed text-[var(--delulu-muted)]">
          Unsere KI agiert als unsichtbarer Bodyguard. Durch Aktivierung des
          Sanctuary-Schutzes erlaubst du uns, Hassrede und Gewalt im Ernstfall
          verschlüsselt zu sichern.
        </p>

        {/* Der Magische Schalter */}
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-start gap-4 mb-8 group cursor-pointer w-full text-left"
        >
          {/* Toggle Circle */}
          <div
            className={`
              mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2
              transition-all duration-300 flex items-center justify-center
              ${isChecked
                ? 'bg-violet-500 border-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.5)]'
                : 'border-[var(--delulu-muted)]'
              }
            `}
            style={{
              // Extra glow animation when checked
              animation: isChecked ? 'sanctuary-pulse 2s infinite' : 'none',
            }}
          >
            {isChecked && (
              <div className="w-2 h-2 bg-white rounded-full animate-[scaleIn_0.2s_ease-out]" />
            )}
          </div>

          {/* Label */}
          <p className="text-xs select-none text-[var(--delulu-muted)] group-hover:text-[var(--delulu-text)] transition-colors">
            Ich aktiviere den Sanctuary-Schutz und bestätige die{' '}
            <a
              href="/datenschutz"
              className="text-violet-500 underline"
              onClick={(e) => e.stopPropagation()}
            >
              Community-Richtlinien
            </a>
            .
          </p>
        </button>

        {/* Submit Button */}
        <button
          disabled={!isChecked || isSubmitting}
          onClick={handleAccept}
          className={`
            w-full py-4 rounded-2xl font-semibold
            transition-all duration-500 ease-out
            ${isChecked
              ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 scale-100 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/40'
              : 'bg-[var(--delulu-surface)] text-[var(--delulu-muted)] scale-95 cursor-not-allowed opacity-50'
            }
          `}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Wird aktiviert...
            </span>
          ) : (
            'In die Sicherheit eintauchen'
          )}
        </button>

        {/* Decline Option */}
        {onDecline && (
          <button
            onClick={onDecline}
            className="w-full mt-3 py-3 text-sm text-[var(--delulu-muted)] hover:text-[var(--delulu-text)] transition-colors"
          >
            Später erinnern
          </button>
        )}

        {/* Legal Fine Print */}
        <p className="text-center text-[10px] text-[var(--delulu-muted)] mt-6 opacity-70">
          Mit der Aktivierung akzeptierst du unsere{' '}
          <a href="/datenschutz" className="underline">Datenschutzerklärung</a>
          {' '}v3.5
        </p>
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes sanctuary-pulse {
          0%, 100% { box-shadow: 0 0 12px rgba(139, 92, 246, 0.5); }
          50% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.8), 0 0 30px rgba(139, 92, 246, 0.4); }
        }
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SanctuaryOnboarding;
