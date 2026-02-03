/**
 * DELULU SANCTUARY MODAL v3.5
 * "Deine Wolke. Dein Schutzraum. ✨"
 *
 * DESIGN PHILOSOPHY:
 * - Apple HIG meets Instagram's emotional design
 * - Glassmorphism with premium feel
 * - Interactive consent with haptic feedback
 * - Legal-grade consent tracking
 *
 * @design Apple UX + Legal Shield
 * @version 3.5.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Heart, Cloud, Sparkles, Check,
  Lock, Eye, EyeOff, X, ChevronRight,
  AlertTriangle, Volume2, Camera
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { recordLegalConsent, ConsentType } from '@/lib/legalAudit';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface SanctuaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface ConsentItem {
  id: ConsentType;
  title: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
  version: string;
}

// ═══════════════════════════════════════
// CONSENT ITEMS (Legal-Grade)
// ═══════════════════════════════════════

const CONSENT_ITEMS: ConsentItem[] = [
  {
    id: 'community_guidelines',
    title: 'Community Richtlinien',
    description: 'Ich respektiere alle Mitglieder und halte mich an die Verhaltensregeln.',
    icon: <Heart className="text-pink-500" size={20} />,
    required: true,
    version: '3.5.0',
  },
  {
    id: 'safety_recording',
    title: 'Sicherheits-Aufzeichnung',
    description: 'Bei Verstößen darf die App anonymisierte Daten zur Überprüfung speichern.',
    icon: <Shield className="text-violet-500" size={20} />,
    required: true,
    version: '3.5.0',
  },
  {
    id: 'content_moderation',
    title: 'Content Moderation',
    description: 'Meine Inhalte werden auf Einhaltung der Richtlinien geprüft.',
    icon: <Eye className="text-blue-500" size={20} />,
    required: true,
    version: '3.5.0',
  },
  {
    id: 'privacy_policy',
    title: 'Datenschutz',
    description: 'Ich habe die Datenschutzerklärung gelesen und akzeptiere sie.',
    icon: <Lock className="text-emerald-500" size={20} />,
    required: true,
    version: '3.5.0',
  },
];

// ═══════════════════════════════════════
// SANCTUARY TOGGLE COMPONENT
// ═══════════════════════════════════════

const SanctuaryToggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled }) => {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        relative w-14 h-8 rounded-full transition-all duration-300 ease-out
        ${checked
          ? 'bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg shadow-violet-500/50'
          : 'bg-[var(--delulu-surface)] border border-[var(--delulu-border)]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-violet-500/50
      `}
      aria-checked={checked}
      role="switch"
    >
      {/* Glow Ring Animation */}
      {checked && (
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ opacity: 0, scale: 1 }}
          animate={{
            opacity: [0.5, 0, 0.5],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Toggle Knob */}
      <motion.div
        className={`
          absolute top-1 w-6 h-6 rounded-full shadow-md
          ${checked
            ? 'bg-white'
            : 'bg-[var(--delulu-muted)]'
          }
        `}
        animate={{
          left: checked ? '1.75rem' : '0.25rem',
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {checked && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Check size={14} className="text-violet-600" strokeWidth={3} />
          </motion.div>
        )}
      </motion.div>
    </button>
  );
};

// ═══════════════════════════════════════
// CONSENT CARD COMPONENT
// ═══════════════════════════════════════

const ConsentCard: React.FC<{
  item: ConsentItem;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ item, checked, onChange }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        p-4 rounded-2xl border transition-all duration-300
        ${checked
          ? 'bg-violet-500/10 border-violet-500/30'
          : 'bg-[var(--delulu-card)] border-[var(--delulu-border)]'
        }
      `}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center
          ${checked ? 'bg-violet-500/20' : 'bg-[var(--delulu-surface)]'}
          transition-colors duration-300
        `}>
          {item.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-[var(--delulu-text)]">
              {item.title}
            </h4>
            {item.required && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-500/10 text-red-500 rounded">
                Pflicht
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--delulu-muted)] leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Toggle */}
        <SanctuaryToggle
          checked={checked}
          onChange={onChange}
        />
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════
// MAIN SANCTUARY MODAL
// ═══════════════════════════════════════

const SanctuaryModal: React.FC<SanctuaryModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { user } = useStore();
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'intro' | 'consents' | 'complete'>('intro');

  // Check if all required consents are given
  const allRequiredAccepted = CONSENT_ITEMS
    .filter(item => item.required)
    .every(item => consents[item.id]);

  // Handle consent change
  const handleConsentChange = useCallback((id: string, checked: boolean) => {
    setConsents(prev => ({ ...prev, [id]: checked }));

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(checked ? [10, 5, 10] : 5);
    }
  }, []);

  // Handle accept all
  const handleAcceptAll = useCallback(() => {
    const allConsents: Record<string, boolean> = {};
    CONSENT_ITEMS.forEach(item => {
      allConsents[item.id] = true;
    });
    setConsents(allConsents);

    if ('vibrate' in navigator) {
      navigator.vibrate([10, 5, 10, 5, 15]);
    }
  }, []);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!user?.id || !allRequiredAccepted) return;

    setIsSubmitting(true);

    try {
      // Record each consent legally
      for (const item of CONSENT_ITEMS) {
        if (consents[item.id]) {
          await recordLegalConsent({
            userId: user.id,
            consentType: item.id,
            version: item.version,
            granted: true,
          });
        }
      }

      // Haptic success
      if ('vibrate' in navigator) {
        navigator.vibrate([15, 10, 15, 10, 30]);
      }

      setStep('complete');

      // Auto-close after animation
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (error) {
      console.error('Failed to record consents:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.id, consents, allRequiredAccepted, onComplete]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('intro');
      setConsents({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop with blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-3xl bg-[var(--delulu-bg)] shadow-2xl theme-transition"
        >
          {/* ═══════════════════════════════════════ */}
          {/* INTRO STEP */}
          {/* ═══════════════════════════════════════ */}
          {step === 'intro' && (
            <div className="p-6 text-center">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[var(--delulu-surface)] flex items-center justify-center text-[var(--delulu-muted)] hover:text-[var(--delulu-text)] transition-colors"
              >
                <X size={20} />
              </button>

              {/* Hero Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="relative mx-auto mb-6"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Cloud size={40} className="text-white" />
                </div>
                {/* Floating sparkles */}
                <motion.div
                  animate={{
                    y: [-5, 5, -5],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles size={24} className="text-amber-400" />
                </motion.div>
              </motion.div>

              {/* Title */}
              <h2 className="font-display text-2xl font-bold text-[var(--delulu-text)] mb-2">
                Deine Wolke. Dein Schutzraum. ✨
              </h2>
              <p className="text-[var(--delulu-muted)] mb-8 max-w-sm mx-auto">
                Delulu ist ein sicherer Ort für echte Verbindungen.
                Gemeinsam schützen wir unsere Community.
              </p>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { icon: Shield, label: 'Geschützt', color: 'violet' },
                  { icon: Heart, label: 'Respektvoll', color: 'pink' },
                  { icon: Lock, label: 'Privat', color: 'emerald' },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className={`w-12 h-12 rounded-2xl bg-${item.color}-500/10 flex items-center justify-center`}>
                      <item.icon size={24} className={`text-${item.color}-500`} />
                    </div>
                    <span className="text-xs font-medium text-[var(--delulu-muted)]">
                      {item.label}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep('consents')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2"
              >
                Weiter
                <ChevronRight size={20} />
              </motion.button>
            </div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* CONSENTS STEP */}
          {/* ═══════════════════════════════════════ */}
          {step === 'consents' && (
            <div className="flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-6 pb-4 border-b border-[var(--delulu-border)]">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-display text-xl font-bold text-[var(--delulu-text)]">
                    Community Vereinbarung
                  </h2>
                  <button
                    onClick={handleAcceptAll}
                    className="text-sm font-medium text-violet-500 hover:text-violet-600"
                  >
                    Alle akzeptieren
                  </button>
                </div>
                <p className="text-sm text-[var(--delulu-muted)]">
                  Bitte bestätige die folgenden Punkte, um beizutreten.
                </p>
              </div>

              {/* Consent List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {CONSENT_ITEMS.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ConsentCard
                      item={item}
                      checked={consents[item.id] || false}
                      onChange={(checked) => handleConsentChange(item.id, checked)}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-6 pt-4 border-t border-[var(--delulu-border)]">
                <motion.button
                  whileHover={allRequiredAccepted ? { scale: 1.02 } : {}}
                  whileTap={allRequiredAccepted ? { scale: 0.98 } : {}}
                  onClick={handleSubmit}
                  disabled={!allRequiredAccepted || isSubmitting}
                  className={`
                    w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2
                    transition-all duration-300
                    ${allRequiredAccepted
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                      : 'bg-[var(--delulu-surface)] text-[var(--delulu-muted)] grayscale cursor-not-allowed'
                    }
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Wird gespeichert...
                    </>
                  ) : (
                    <>
                      <Shield size={20} />
                      Beitreten
                    </>
                  )}
                </motion.button>

                <p className="text-center text-xs text-[var(--delulu-muted)] mt-3">
                  Mit dem Beitritt akzeptierst du unsere{' '}
                  <a href="/datenschutz" className="text-violet-500 underline">
                    Datenschutzerklärung
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* COMPLETE STEP */}
          {/* ═══════════════════════════════════════ */}
          {step === 'complete' && (
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
              >
                <Check size={40} className="text-white" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-display text-2xl font-bold text-[var(--delulu-text)] mb-2"
              >
                Willkommen im Sanctuary! 🌟
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-[var(--delulu-muted)]"
              >
                Du bist jetzt Teil unserer geschützten Community.
              </motion.p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SanctuaryModal;
