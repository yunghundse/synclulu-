/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SANCTUARY CONSENT MODAL v5.5
 * "Art. 6 DSGVO Einwilligung"
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Explizite Einwilligung für:
 * - Audio-Analyse zur Gewaltprävention
 * - Lokale Verarbeitung von Sprachsignalen
 * - Verschlüsselte Beweissicherung bei Vorfällen
 *
 * @version 5.5.0
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ShieldCheck, Mic, Lock, Eye, AlertTriangle,
  ChevronDown, ChevronUp, Check, X, Info
} from 'lucide-react';
import { recordLegalConsent, ConsentType } from '@/lib/legalAudit';
import { useStore } from '@/lib/store';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface SanctuaryConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  isRequired?: boolean;
}

interface ConsentItem {
  id: ConsentType;
  icon: React.ReactNode;
  title: string;
  description: string;
  details: string[];
  required: boolean;
}

// ═══════════════════════════════════════
// CONSENT ITEMS
// ═══════════════════════════════════════

const CONSENT_ITEMS: ConsentItem[] = [
  {
    id: 'sanctuary_audio',
    icon: <Mic size={20} />,
    title: 'Audio-Analyse (Sanctuary)',
    description: 'Lokale Analyse von Sprachkommunikation zum Schutz vor Bedrohungen und Grooming.',
    details: [
      'Verarbeitung erfolgt primär auf deinem Gerät (On-Device)',
      'Es werden keine Gespräche an Server übertragen',
      'Nur bei erkannter Gefährdung (>85% Konfidenz) erfolgt eine verschlüsselte Dokumentation',
      'Du kannst die Einwilligung jederzeit in den Einstellungen widerrufen',
    ],
    required: true,
  },
  {
    id: 'age_verification',
    icon: <ShieldCheck size={20} />,
    title: 'Altersverifikation (Aegis)',
    description: 'Bestätigung deines Alters zum Schutz von Minderjährigen.',
    details: [
      'Wir speichern niemals dein Geburtsdatum oder Ausweisdaten',
      'Nur ein verschlüsselter Ja/Nein-Status wird gespeichert',
      'Minderjährige und Erwachsene werden in getrennten Bereichen geführt',
      'Dies dient dem Jugendschutz nach JuSchG',
    ],
    required: true,
  },
  {
    id: 'content_moderation',
    icon: <Eye size={20} />,
    title: 'Inhaltsmoderation (Guardian)',
    description: 'Automatische Prüfung von Textnachrichten auf verbotene Inhalte.',
    details: [
      'Texte werden auf Bedrohungen, Belästigung und Spam geprüft',
      'Die Analyse erfolgt in Echtzeit auf unseren Servern',
      'Problematische Inhalte werden gefiltert oder blockiert',
      'Dies schützt dich und andere vor schädlichen Inhalten',
    ],
    required: true,
  },
];

// ═══════════════════════════════════════
// CONSENT ITEM COMPONENT
// ═══════════════════════════════════════

interface ConsentItemProps {
  item: ConsentItem;
  isChecked: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
}

const ConsentItemComponent: React.FC<ConsentItemProps> = ({
  item,
  isChecked,
  isExpanded,
  onToggle,
  onExpand,
}) => (
  <div
    className={`
      rounded-2xl border transition-all duration-200
      ${isChecked
        ? 'border-violet-500/50 bg-violet-500/5'
        : 'border-[var(--delulu-border)] bg-[var(--delulu-card)]'
      }
    `}
  >
    {/* Main Row */}
    <div className="p-4 flex items-start gap-4">
      {/* Checkbox */}
      <button
        onClick={onToggle}
        disabled={item.required}
        className={`
          flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center
          transition-all duration-200
          ${isChecked
            ? 'bg-violet-500 border-violet-500'
            : 'border-[var(--delulu-border)] hover:border-violet-500/50'
          }
          ${item.required ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {isChecked && <Check size={14} className="text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={isChecked ? 'text-violet-500' : 'text-[var(--delulu-muted)]'}>
            {item.icon}
          </span>
          <h4 className="font-medium text-[var(--delulu-text)]">{item.title}</h4>
          {item.required && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-500">
              Erforderlich
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--delulu-muted)]">{item.description}</p>
      </div>

      {/* Expand Button */}
      <button
        onClick={onExpand}
        className="flex-shrink-0 p-2 rounded-lg hover:bg-[var(--delulu-surface)] transition-colors"
      >
        {isExpanded ? (
          <ChevronUp size={18} className="text-[var(--delulu-muted)]" />
        ) : (
          <ChevronDown size={18} className="text-[var(--delulu-muted)]" />
        )}
      </button>
    </div>

    {/* Details (Expanded) */}
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="px-4 pb-4 pl-14">
            <ul className="space-y-2">
              {item.details.map((detail, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--delulu-muted)]">
                  <Info size={14} className="flex-shrink-0 mt-0.5 text-violet-500/50" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// ═══════════════════════════════════════
// MAIN MODAL COMPONENT
// ═══════════════════════════════════════

const SanctuaryConsentModal: React.FC<SanctuaryConsentModalProps> = ({
  isOpen,
  onAccept,
  onDecline,
  isRequired = true,
}) => {
  const { user } = useStore();

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    // Pre-check required items
    const initial: Record<string, boolean> = {};
    CONSENT_ITEMS.forEach(item => {
      initial[item.id] = item.required;
    });
    return initial;
  });

  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allRequiredChecked = CONSENT_ITEMS
    .filter(item => item.required)
    .every(item => checkedItems[item.id]);

  const handleToggle = useCallback((id: string) => {
    const item = CONSENT_ITEMS.find(i => i.id === id);
    if (item?.required) return; // Can't uncheck required items

    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleExpand = useCallback((id: string) => {
    setExpandedItem(prev => prev === id ? null : id);
  }, []);

  const handleAccept = useCallback(async () => {
    if (!user?.id || !allRequiredChecked) return;

    setIsSubmitting(true);

    try {
      // Record all consents
      for (const item of CONSENT_ITEMS) {
        if (checkedItems[item.id]) {
          await recordLegalConsent({
            userId: user.id,
            consentType: item.id,
            version: '5.5.0',
            granted: true,
          });
        }
      }

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([20, 10, 20]);
      }

      onAccept();
    } catch (error) {
      console.error('Error recording consent:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.id, allRequiredChecked, checkedItems, onAccept]);

  const handleDecline = useCallback(async () => {
    if (!user?.id) {
      onDecline();
      return;
    }

    // Record declined consent
    for (const item of CONSENT_ITEMS) {
      if (item.required) {
        await recordLegalConsent({
          userId: user.id,
          consentType: item.id,
          version: '5.5.0',
          granted: false,
        });
      }
    }

    onDecline();
  }, [user?.id, onDecline]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={isRequired ? undefined : onDecline}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden bg-[var(--delulu-bg)] rounded-t-3xl sm:rounded-3xl shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-b from-[var(--delulu-bg)] to-[var(--delulu-bg)]/80 backdrop-blur-xl p-6 pb-4 border-b border-[var(--delulu-border)]">
            <div className="flex items-center gap-4 mb-4">
              {/* Animated Shield */}
              <motion.div
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center"
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(139, 92, 246, 0)',
                    '0 0 0 10px rgba(139, 92, 246, 0.1)',
                    '0 0 0 0 rgba(139, 92, 246, 0)',
                  ],
                }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Shield size={28} className="text-violet-500" />
              </motion.div>

              <div>
                <h2 className="text-xl font-semibold text-[var(--delulu-text)]">
                  Sanctuary aktivieren
                </h2>
                <p className="text-sm text-[var(--delulu-muted)]">
                  Dein Schutz ist uns wichtig
                </p>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/10 text-xs text-[var(--delulu-muted)]">
              <strong className="text-violet-500">Art. 6 Abs. 1 lit. a DSGVO:</strong>{' '}
              Deine ausdrückliche Einwilligung ist erforderlich für die Audio-Analyse zum Zweck des Schutzes vor Gewalt und Grooming.
            </div>
          </div>

          {/* Consent Items */}
          <div className="p-4 space-y-3 max-h-[40vh] overflow-y-auto">
            {CONSENT_ITEMS.map(item => (
              <ConsentItemComponent
                key={item.id}
                item={item}
                isChecked={checkedItems[item.id]}
                isExpanded={expandedItem === item.id}
                onToggle={() => handleToggle(item.id)}
                onExpand={() => handleExpand(item.id)}
              />
            ))}
          </div>

          {/* Warning for decline */}
          {!allRequiredChecked && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mx-4 mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Ohne die erforderlichen Einwilligungen sind Sprach- und Video-Funktionen nicht verfügbar.
                </p>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="sticky bottom-0 p-4 bg-[var(--delulu-bg)] border-t border-[var(--delulu-border)]">
            <div className="flex gap-3">
              {!isRequired && (
                <button
                  onClick={handleDecline}
                  className="flex-1 py-3 rounded-xl bg-[var(--delulu-surface)] text-[var(--delulu-text)] font-medium hover:bg-[var(--delulu-card)] transition-colors"
                >
                  Ablehnen
                </button>
              )}

              <button
                onClick={handleAccept}
                disabled={!allRequiredChecked || isSubmitting}
                className={`
                  flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all
                  ${allRequiredChecked
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl'
                    : 'bg-[var(--delulu-surface)] text-[var(--delulu-muted)] cursor-not-allowed'
                  }
                `}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Akzeptieren & Aktivieren
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-center text-[var(--delulu-muted)] mt-3">
              Du kannst deine Einwilligungen jederzeit in den Einstellungen widerrufen.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SanctuaryConsentModal;
