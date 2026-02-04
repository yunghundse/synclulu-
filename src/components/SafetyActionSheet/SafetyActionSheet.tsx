/**
 * SafetyActionSheet.tsx
 * 🛡️ SAFETY ACTION SHEET - Report & Block UI
 *
 * Elegantes Glass-Sheet für:
 * - User melden (verschiedene Gründe)
 * - User blockieren (sofortige Trennung)
 *
 * @version 1.0.0
 */

import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Ban, X, Check, ChevronRight } from 'lucide-react';
import {
  createReport,
  blockUser,
  REPORT_REASONS,
  type ReportReason,
} from '@/lib/safetySystem';
import { useAuth } from '@/hooks/useAuth';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface SafetyActionSheetProps {
  isOpen: boolean;
  targetUserId: string;
  targetUserName?: string;
  roomId?: string;
  onClose: () => void;
  onActionComplete?: (action: 'report' | 'block', success: boolean) => void;
}

type SheetStep = 'main' | 'report_reasons' | 'report_description' | 'confirm_block' | 'success';

// ═══════════════════════════════════════════════════════════════════════════
// REPORT REASON BUTTON
// ═══════════════════════════════════════════════════════════════════════════

const ReasonButton = memo(function ReasonButton({
  reason,
  label,
  isSelected,
  onClick,
}: {
  reason: ReportReason;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full py-4 px-5 rounded-2xl flex items-center justify-between transition-all"
      style={{
        background: isSelected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)',
        border: isSelected ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <span
        className="text-xs font-medium"
        style={{ color: isSelected ? '#FCA5A5' : 'rgba(255, 255, 255, 0.6)' }}
      >
        {label}
      </span>
      {isSelected && <Check size={16} className="text-red-400" />}
    </motion.button>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const SafetyActionSheet = memo(function SafetyActionSheet({
  isOpen,
  targetUserId,
  targetUserName = 'Nutzer',
  roomId,
  onClose,
  onActionComplete,
}: SafetyActionSheetProps) {
  const { user } = useAuth();

  const [step, setStep] = useState<SheetStep>('main');
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Reset state when closed
  const handleClose = useCallback(() => {
    setStep('main');
    setSelectedReason(null);
    setDescription('');
    setIsLoading(false);
    onClose();
  }, [onClose]);

  // Submit Report
  const handleSubmitReport = useCallback(async () => {
    if (!user?.uid || !selectedReason) return;

    setIsLoading(true);
    const result = await createReport(
      user.uid,
      targetUserId,
      selectedReason,
      description,
      roomId
    );

    setIsLoading(false);

    if (result.success) {
      setSuccessMessage('Deine Meldung wurde übermittelt. Unsere KI prüft den Vorfall.');
      setStep('success');
      onActionComplete?.('report', true);
    } else {
      // TODO: Show error toast
      console.error(result.error);
    }
  }, [user?.uid, targetUserId, selectedReason, description, roomId, onActionComplete]);

  // Submit Block
  const handleConfirmBlock = useCallback(async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    const result = await blockUser(user.uid, targetUserId);
    setIsLoading(false);

    if (result.success) {
      setSuccessMessage(`${targetUserName} wurde blockiert und ist nicht mehr sichtbar.`);
      setStep('success');
      onActionComplete?.('block', true);
    } else {
      console.error(result.error);
    }
  }, [user?.uid, targetUserId, targetUserName, onActionComplete]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[210] will-change-transform"
            style={{ transform: 'translateZ(0)' }}
          >
            <div
              className="rounded-t-[32px] p-6 pb-safe"
              style={{
                background: '#0a0a0a',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderBottom: 'none',
              }}
            >
              {/* Handle */}
              <div className="w-12 h-1 rounded-full bg-white/10 mx-auto mb-6" />

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                  >
                    <Shield size={18} className="text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Sicherheit & Schutz</h3>
                    <p className="text-[10px] text-white/40">{targetUserName}</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                >
                  <X size={16} className="text-white/40" />
                </button>
              </div>

              {/* Content based on step */}
              <AnimatePresence mode="wait">
                {/* STEP: Main Menu */}
                {step === 'main' && (
                  <motion.div
                    key="main"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-3"
                  >
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('report_reasons')}
                      className="w-full py-5 px-5 rounded-2xl flex items-center justify-between"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <AlertTriangle size={18} className="text-amber-400" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-white">Nutzer melden</p>
                          <p className="text-[10px] text-white/40">Verstoß an unser Team melden</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-white/20" />
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('confirm_block')}
                      className="w-full py-5 px-5 rounded-2xl flex items-center justify-between"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <Ban size={18} className="text-red-400" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-white">Nutzer blockieren</p>
                          <p className="text-[10px] text-white/40">Sofort unsichtbar machen</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-white/20" />
                    </motion.button>
                  </motion.div>
                )}

                {/* STEP: Report Reasons */}
                {step === 'report_reasons' && (
                  <motion.div
                    key="reasons"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-4">
                      Wähle einen Grund
                    </p>

                    {Object.entries(REPORT_REASONS).map(([key, { label }]) => (
                      <ReasonButton
                        key={key}
                        reason={key as ReportReason}
                        label={label}
                        isSelected={selectedReason === key}
                        onClick={() => setSelectedReason(key as ReportReason)}
                      />
                    ))}

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setStep('main')}
                        className="flex-1 py-4 rounded-2xl text-xs font-bold text-white/60"
                        style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                      >
                        Zurück
                      </button>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => selectedReason && setStep('report_description')}
                        disabled={!selectedReason}
                        className="flex-1 py-4 rounded-2xl text-xs font-bold text-white disabled:opacity-30"
                        style={{
                          background: selectedReason
                            ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                            : 'rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        Weiter
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* STEP: Report Description */}
                {step === 'report_description' && (
                  <motion.div
                    key="description"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">
                      Details (optional)
                    </p>

                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Beschreibe den Vorfall kurz..."
                      maxLength={500}
                      rows={4}
                      className="w-full px-4 py-4 rounded-2xl text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:ring-1 focus:ring-red-500/50"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    />

                    <p className="text-[9px] text-white/20 text-right">{description.length}/500</p>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep('report_reasons')}
                        className="flex-1 py-4 rounded-2xl text-xs font-bold text-white/60"
                        style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                      >
                        Zurück
                      </button>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSubmitReport}
                        disabled={isLoading}
                        className="flex-1 py-4 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-2"
                        style={{
                          background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                        }}
                      >
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          />
                        ) : (
                          'Meldung senden'
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* STEP: Confirm Block */}
                {step === 'confirm_block' && (
                  <motion.div
                    key="block"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="text-center space-y-6"
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                      style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                    >
                      <Ban size={28} className="text-red-400" />
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white mb-2">
                        {targetUserName} blockieren?
                      </h4>
                      <p className="text-xs text-white/40 leading-relaxed">
                        Ihr werdet euch gegenseitig nicht mehr sehen können.
                        Diese Person kann nicht in deine Wölkchen kommen.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep('main')}
                        className="flex-1 py-4 rounded-2xl text-xs font-bold text-white/60"
                        style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                      >
                        Abbrechen
                      </button>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleConfirmBlock}
                        disabled={isLoading}
                        className="flex-1 py-4 rounded-2xl text-xs font-bold text-white"
                        style={{
                          background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                        }}
                      >
                        {isLoading ? 'Blockiere...' : 'Blockieren'}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* STEP: Success */}
                {step === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6 py-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                      style={{ background: 'rgba(34, 197, 94, 0.15)' }}
                    >
                      <Check size={28} className="text-emerald-400" />
                    </motion.div>

                    <div>
                      <h4 className="text-sm font-bold text-white mb-2">Erledigt</h4>
                      <p className="text-xs text-white/40 leading-relaxed">
                        {successMessage}
                      </p>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleClose}
                      className="w-full py-4 rounded-2xl text-xs font-bold text-white"
                      style={{
                        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                      }}
                    >
                      Fertig
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default SafetyActionSheet;
