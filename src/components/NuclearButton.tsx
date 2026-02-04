/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NUCLEAR BUTTON COMPONENT v5.5
 * "Ein-Tap Ghost-Reporting"
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Der Nuklear-Button für sofortige Incident-Meldung.
 * Ein Tap sichert den gesamten Vorfall verschlüsselt.
 *
 * @version 5.5.0
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, X, Check, AlertTriangle,
  MessageSquareWarning, UserX, Skull, Ban, Sparkles
} from 'lucide-react';
import {
  submitGhostReport,
  quickGhostReport,
  IncidentType,
  ChatMessage,
} from '@/lib/aegisGhostReport';
import { useStore } from '@/lib/store';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface NuclearButtonProps {
  /** ID of the user being reported */
  targetUserId: string;
  /** Name of the target user for display */
  targetUserName?: string;
  /** Optional chat log to include */
  chatLog?: ChatMessage[];
  /** Session duration in seconds */
  sessionDuration?: number;
  /** Callback after successful report */
  onReportSubmitted?: (incidentId: string) => void;
  /** Compact mode for inline display */
  compact?: boolean;
}

interface IncidentOption {
  type: IncidentType;
  icon: React.ReactNode;
  label: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// ═══════════════════════════════════════
// INCIDENT OPTIONS
// ═══════════════════════════════════════

const INCIDENT_OPTIONS: IncidentOption[] = [
  {
    type: 'HARASSMENT',
    icon: <MessageSquareWarning size={20} />,
    label: 'Belästigung',
    description: 'Unerwünschte oder aggressive Nachrichten',
    severity: 'high',
  },
  {
    type: 'GROOMING_ATTEMPT',
    icon: <Skull size={20} />,
    label: 'Grooming-Versuch',
    description: 'Verdächtige Annäherung an Minderjährige',
    severity: 'critical',
  },
  {
    type: 'EXPLICIT_CONTENT',
    icon: <Ban size={20} />,
    label: 'Expliziter Inhalt',
    description: 'Unerwünschte anzügliche Inhalte',
    severity: 'high',
  },
  {
    type: 'IDENTITY_FRAUD',
    icon: <UserX size={20} />,
    label: 'Fake-Profil',
    description: 'Gefälschte Identität oder Catfishing',
    severity: 'high',
  },
  {
    type: 'THREATS',
    icon: <AlertTriangle size={20} />,
    label: 'Drohungen',
    description: 'Drohende oder einschüchternde Nachrichten',
    severity: 'critical',
  },
  {
    type: 'SPAM',
    icon: <Sparkles size={20} />,
    label: 'Spam',
    description: 'Werbung oder Massennachrichten',
    severity: 'low',
  },
];

// ═══════════════════════════════════════
// SEVERITY COLORS
// ═══════════════════════════════════════

const severityColors = {
  low: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  high: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  critical: 'text-red-500 bg-red-500/10 border-red-500/20',
};

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════

const NuclearButton: React.FC<NuclearButtonProps> = ({
  targetUserId,
  targetUserName = 'Dieser User',
  chatLog,
  sessionDuration,
  onReportSubmitted,
  compact = false,
}) => {
  const { user } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<IncidentType | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ═══════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════

  const handleQuickReport = useCallback(async (type: IncidentType) => {
    if (!user?.id) return;

    setIsSubmitting(true);
    setError(null);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 20, 30]);
    }

    const result = await quickGhostReport({
      reporterId: user.id,
      reportedUserId: targetUserId,
      incidentType: type,
    });

    setIsSubmitting(false);

    if (result.success && result.incidentId) {
      setIsSuccess(true);
      onReportSubmitted?.(result.incidentId);

      // Auto-close after success
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setSelectedType(null);
      }, 2000);
    } else {
      setError('Meldung fehlgeschlagen. Bitte versuche es erneut.');
    }
  }, [user?.id, targetUserId, onReportSubmitted]);

  const handleDetailedReport = useCallback(async () => {
    if (!user?.id || !selectedType) return;

    setIsSubmitting(true);
    setError(null);

    const result = await submitGhostReport({
      reporterId: user.id,
      reportedUserId: targetUserId,
      incidentType: selectedType,
      description: description.trim() || undefined,
      chatLog,
      sessionDuration,
      incidentTimestamp: new Date(),
    });

    setIsSubmitting(false);

    if (result.success && result.incidentId) {
      setIsSuccess(true);
      onReportSubmitted?.(result.incidentId);

      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setSelectedType(null);
        setDescription('');
      }, 2000);
    } else {
      setError(result.error || 'Meldung fehlgeschlagen');
    }
  }, [user?.id, targetUserId, selectedType, description, chatLog, sessionDuration, onReportSubmitted]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSelectedType(null);
    setDescription('');
    setError(null);
    setIsSuccess(false);
  }, []);

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileTap={{ scale: 0.95 }}
        className={`
          flex items-center justify-center gap-2 rounded-xl
          bg-red-500/10 text-red-500 border border-red-500/20
          hover:bg-red-500/20 transition-all
          ${compact ? 'p-2' : 'px-4 py-2'}
        `}
        title="User melden"
      >
        <ShieldAlert size={compact ? 18 : 20} />
        {!compact && <span className="text-sm font-medium">Melden</span>}
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={handleClose}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-[var(--synclulu-card)] rounded-3xl border border-[var(--synclulu-border)] shadow-2xl z-50 overflow-hidden theme-transition"
            >
              {/* Header */}
              <div className="p-4 border-b border-[var(--synclulu-border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <ShieldAlert size={20} className="text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--synclulu-text)]">
                      {targetUserName} melden
                    </h3>
                    <p className="text-xs text-[var(--synclulu-muted)]">
                      Wähle einen Grund für die Meldung
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-[var(--synclulu-surface)] transition-colors"
                >
                  <X size={20} className="text-[var(--synclulu-muted)]" />
                </button>
              </div>

              {/* Success State */}
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center"
                  >
                    <Check size={32} className="text-emerald-500" />
                  </motion.div>
                  <h4 className="font-semibold text-[var(--synclulu-text)] mb-2">
                    Meldung gespeichert
                  </h4>
                  <p className="text-sm text-[var(--synclulu-muted)]">
                    Der Vorfall wurde sicher dokumentiert. Unser Team wird ihn prüfen.
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Incident Types */}
                  <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
                    {error && (
                      <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm mb-3">
                        {error}
                      </div>
                    )}

                    {INCIDENT_OPTIONS.map((option) => (
                      <motion.button
                        key={option.type}
                        onClick={() => setSelectedType(option.type)}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          w-full p-4 rounded-xl border text-left transition-all
                          ${selectedType === option.type
                            ? severityColors[option.severity]
                            : 'border-[var(--synclulu-border)] hover:bg-[var(--synclulu-surface)]'
                          }
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`
                            flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                            ${selectedType === option.type
                              ? severityColors[option.severity]
                              : 'bg-[var(--synclulu-surface)]'
                            }
                          `}>
                            {option.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${
                                selectedType === option.type
                                  ? ''
                                  : 'text-[var(--synclulu-text)]'
                              }`}>
                                {option.label}
                              </span>
                              {option.severity === 'critical' && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-red-500 text-white">
                                  Kritisch
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--synclulu-muted)] mt-1">
                              {option.description}
                            </p>
                          </div>
                          {selectedType === option.type && (
                            <Check size={20} className="flex-shrink-0" />
                          )}
                        </div>
                      </motion.button>
                    ))}

                    {/* Description Input (only when type selected) */}
                    {selectedType && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-3"
                      >
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Optionale Beschreibung des Vorfalls..."
                          className="w-full p-3 rounded-xl bg-[var(--synclulu-surface)] border border-[var(--synclulu-border)] text-[var(--synclulu-text)] placeholder-[var(--synclulu-muted)] resize-none h-24 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 border-t border-[var(--synclulu-border)] flex gap-3">
                    <button
                      onClick={handleClose}
                      className="flex-1 py-3 rounded-xl bg-[var(--synclulu-surface)] text-[var(--synclulu-text)] font-medium hover:bg-[var(--synclulu-border)] transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={selectedType ? handleDetailedReport : undefined}
                      disabled={!selectedType || isSubmitting}
                      className={`
                        flex-1 py-3 rounded-xl font-medium transition-all
                        flex items-center justify-center gap-2
                        ${selectedType
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600'
                          : 'bg-[var(--synclulu-surface)] text-[var(--synclulu-muted)] cursor-not-allowed'
                        }
                      `}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sende...
                        </>
                      ) : (
                        <>
                          <ShieldAlert size={18} />
                          Melden
                        </>
                      )}
                    </button>
                  </div>

                  {/* Quick Report Buttons */}
                  {!selectedType && (
                    <div className="px-4 pb-4">
                      <p className="text-xs text-center text-[var(--synclulu-muted)] mb-2">
                        Oder schnell melden:
                      </p>
                      <div className="flex gap-2">
                        {INCIDENT_OPTIONS.filter(o => o.severity === 'critical').map(option => (
                          <button
                            key={option.type}
                            onClick={() => handleQuickReport(option.type)}
                            disabled={isSubmitting}
                            className="flex-1 py-2 px-3 rounded-xl text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default NuclearButton;
