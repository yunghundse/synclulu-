/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PRIVACY DASHBOARD v5.5
 * "Sicherheit & Aura"
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Zentrale Stelle für Datenschutz- und Sicherheitseinstellungen.
 * Minimalistisch, Darkmode-kompatibel, Apple-Standard.
 *
 * Features:
 * - Radar-Sichtbarkeit
 * - Gender-Filter
 * - Ghost-Mode
 * - Safety-Score Anzeige
 * - Verifikationsstatus
 *
 * @version 5.5.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Eye, EyeOff, Users, UserCheck, Ghost,
  MapPin, Radio, Lock, Unlock, ChevronRight,
  AlertTriangle, CheckCircle, Info, Sparkles
} from 'lucide-react';
import {
  getSafetyProfile,
  updateVisibilitySettings,
  AegisSafetyProfile,
  VisibilityGender,
  SAFETY_THRESHOLDS,
} from '@/lib/aegisVerification';
import { getScoreHistory, ScoreChange } from '@/lib/aegisSafetyScore';
import { useStore } from '@/lib/store';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface PrivacyDashboardProps {
  onClose?: () => void;
}

// ═══════════════════════════════════════
// TOGGLE COMPONENT
// ═══════════════════════════════════════

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({ enabled, onChange, disabled }) => (
  <button
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    className={`
      relative w-12 h-7 rounded-full transition-all duration-200
      ${enabled
        ? 'bg-violet-500'
        : 'bg-[var(--synclulu-surface)]'
      }
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    <motion.div
      animate={{ x: enabled ? 22 : 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
    />
  </button>
);

// ═══════════════════════════════════════
// SAFETY SCORE DISPLAY
// ═══════════════════════════════════════

interface SafetyScoreProps {
  score: number;
}

const SafetyScoreDisplay: React.FC<SafetyScoreProps> = ({ score }) => {
  const getScoreColor = () => {
    if (score >= SAFETY_THRESHOLDS.FULL_ACCESS) return 'text-emerald-500';
    if (score >= SAFETY_THRESHOLDS.LIMITED_ACCESS) return 'text-amber-500';
    if (score >= SAFETY_THRESHOLDS.SUSPENDED) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreLabel = () => {
    if (score >= SAFETY_THRESHOLDS.FULL_ACCESS) return 'Ausgezeichnet';
    if (score >= SAFETY_THRESHOLDS.LIMITED_ACCESS) return 'Eingeschränkt';
    if (score >= SAFETY_THRESHOLDS.SUSPENDED) return 'Warnung';
    return 'Gesperrt';
  };

  const getScoreBg = () => {
    if (score >= SAFETY_THRESHOLDS.FULL_ACCESS) return 'bg-emerald-500/10';
    if (score >= SAFETY_THRESHOLDS.LIMITED_ACCESS) return 'bg-amber-500/10';
    if (score >= SAFETY_THRESHOLDS.SUSPENDED) return 'bg-orange-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className={`rounded-2xl p-4 ${getScoreBg()}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield size={20} className={getScoreColor()} />
          <span className="font-medium text-[var(--synclulu-text)]">Safety Score</span>
        </div>
        <span className={`text-2xl font-bold ${getScoreColor()}`}>{score}</span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 rounded-full bg-[var(--synclulu-surface)] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full ${
            score >= SAFETY_THRESHOLDS.FULL_ACCESS ? 'bg-emerald-500' :
            score >= SAFETY_THRESHOLDS.LIMITED_ACCESS ? 'bg-amber-500' :
            score >= SAFETY_THRESHOLDS.SUSPENDED ? 'bg-orange-500' :
            'bg-red-500'
          }`}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className={`text-sm ${getScoreColor()}`}>{getScoreLabel()}</span>
        <span className="text-xs text-[var(--synclulu-muted)]">von 100</span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════

const PrivacyDashboard: React.FC<PrivacyDashboardProps> = ({ onClose }) => {
  const { user } = useStore();

  const [profile, setProfile] = useState<AegisSafetyProfile | null>(null);
  const [scoreHistory, setScoreHistory] = useState<ScoreChange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Local state for settings
  const [radarEnabled, setRadarEnabled] = useState(true);
  const [ghostMode, setGhostMode] = useState(false);
  const [visibleTo, setVisibleTo] = useState<VisibilityGender>('ALL');

  // ═══════════════════════════════════════
  // LOAD DATA
  // ═══════════════════════════════════════

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;

      setIsLoading(true);
      const [profileData, history] = await Promise.all([
        getSafetyProfile(user.id),
        getScoreHistory(user.id, 10),
      ]);

      if (profileData) {
        setProfile(profileData);
        setRadarEnabled(profileData.radarEnabled);
        setGhostMode(profileData.ghostMode);
        setVisibleTo(profileData.visibleToGender);
      }

      setScoreHistory(history);
      setIsLoading(false);
    }

    loadProfile();
  }, [user?.id]);

  // ═══════════════════════════════════════
  // SAVE SETTINGS
  // ═══════════════════════════════════════

  const saveSettings = useCallback(async (updates: {
    radarEnabled?: boolean;
    ghostMode?: boolean;
    visibleToGender?: VisibilityGender;
  }) => {
    if (!user?.id) return;

    setIsSaving(true);
    const success = await updateVisibilitySettings({
      userId: user.id,
      ...updates,
    });

    if (success) {
      // Update local profile
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }
    setIsSaving(false);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [user?.id]);

  const handleRadarToggle = (enabled: boolean) => {
    setRadarEnabled(enabled);
    saveSettings({ radarEnabled: enabled });
  };

  const handleGhostToggle = (enabled: boolean) => {
    setGhostMode(enabled);
    saveSettings({ ghostMode: enabled });
  };

  const handleVisibilityChange = (value: VisibilityGender) => {
    setVisibleTo(value);
    saveSettings({ visibleToGender: value });
  };

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[var(--synclulu-bg)] min-h-full theme-transition">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--synclulu-bg)]/80 backdrop-blur-xl border-b border-[var(--synclulu-border)]">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-xl font-semibold text-[var(--synclulu-text)]">
            Sicherheit & Aura
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-violet-500 font-medium"
            >
              Fertig
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Safety Score Section */}
        {profile && (
          <section>
            <SafetyScoreDisplay score={profile.safetyScore} />

            {/* Score History Toggle */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full mt-3 py-2 flex items-center justify-between text-sm text-[var(--synclulu-muted)] hover:text-[var(--synclulu-text)] transition-colors"
            >
              <span>Score-Verlauf anzeigen</span>
              <motion.div
                animate={{ rotate: showHistory ? 90 : 0 }}
              >
                <ChevronRight size={18} />
              </motion.div>
            </button>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-2">
                    {scoreHistory.length > 0 ? (
                      scoreHistory.map(change => (
                        <div
                          key={change.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-[var(--synclulu-card)] border border-[var(--synclulu-border)]"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`
                              w-8 h-8 rounded-full flex items-center justify-center
                              ${change.change > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}
                            `}>
                              {change.change > 0 ? '+' : ''}{change.change}
                            </div>
                            <div>
                              <p className="text-sm text-[var(--synclulu-text)]">{change.reason}</p>
                              <p className="text-xs text-[var(--synclulu-muted)]">
                                {change.createdAt.toLocaleDateString('de-DE')}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-[var(--synclulu-text)]">
                            {change.newScore}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-sm text-[var(--synclulu-muted)] py-4">
                        Keine Score-Änderungen
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {/* Verification Status */}
        <section className="rounded-2xl bg-[var(--synclulu-card)] border border-[var(--synclulu-border)] overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {profile?.isAdult ? (
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle size={20} className="text-emerald-500" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-amber-500" />
                </div>
              )}
              <div>
                <h3 className="font-medium text-[var(--synclulu-text)]">
                  {profile?.isAdult ? 'Verifiziert (18+)' : 'Geschütztes Profil'}
                </h3>
                <p className="text-xs text-[var(--synclulu-muted)]">
                  {profile?.verificationMethod === 'ID_DOCUMENT_HASH'
                    ? 'Via Ausweis-Verifikation'
                    : profile?.verificationMethod === 'AI_ESTIMATION'
                      ? 'Via AI-Schätzung'
                      : 'Selbst-Deklaration'
                  }
                </p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-[var(--synclulu-surface)] text-xs text-[var(--synclulu-muted)]">
              {profile?.isMinorProtected ? 'Minor-Schutz aktiv' : 'Erwachsenen-Pool'}
            </div>
          </div>
        </section>

        {/* Radar Settings */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--synclulu-muted)] uppercase tracking-wider px-1">
            Radar-Einstellungen
          </h3>

          <div className="rounded-2xl bg-[var(--synclulu-card)] border border-[var(--synclulu-border)] divide-y divide-[var(--synclulu-border)]">
            {/* Radar Toggle */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
                  <Radio size={20} className="text-violet-500" />
                </div>
                <div>
                  <h4 className="font-medium text-[var(--synclulu-text)]">Radar aktiv</h4>
                  <p className="text-xs text-[var(--synclulu-muted)]">
                    Auf dem Radar anderer sichtbar sein
                  </p>
                </div>
              </div>
              <Toggle
                enabled={radarEnabled}
                onChange={handleRadarToggle}
                disabled={isSaving}
              />
            </div>

            {/* Ghost Mode */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-500/10 flex items-center justify-center">
                  <Ghost size={20} className="text-gray-500" />
                </div>
                <div>
                  <h4 className="font-medium text-[var(--synclulu-text)]">Ghost-Mode</h4>
                  <p className="text-xs text-[var(--synclulu-muted)]">
                    Komplett unsichtbar werden
                  </p>
                </div>
              </div>
              <Toggle
                enabled={ghostMode}
                onChange={handleGhostToggle}
                disabled={isSaving}
              />
            </div>
          </div>
        </section>

        {/* Visibility Settings */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--synclulu-muted)] uppercase tracking-wider px-1">
            Wer kann mich sehen?
          </h3>

          <div className="rounded-2xl bg-[var(--synclulu-card)] border border-[var(--synclulu-border)] divide-y divide-[var(--synclulu-border)]">
            {[
              { value: 'ALL' as VisibilityGender, icon: <Users size={20} />, label: 'Alle', desc: 'Jeder kann dich sehen' },
              { value: 'FEMALE_ONLY' as VisibilityGender, icon: <UserCheck size={20} />, label: 'Nur Frauen', desc: 'Sicherheits-Feature' },
              { value: 'VERIFIED_ONLY' as VisibilityGender, icon: <Lock size={20} />, label: 'Nur Verifizierte', desc: 'Nur 18+ verifizierte User' },
            ].map(option => (
              <button
                key={option.value}
                onClick={() => handleVisibilityChange(option.value)}
                disabled={isSaving}
                className="w-full p-4 flex items-center justify-between hover:bg-[var(--synclulu-surface)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${visibleTo === option.value
                      ? 'bg-violet-500/10 text-violet-500'
                      : 'bg-[var(--synclulu-surface)] text-[var(--synclulu-muted)]'
                    }
                  `}>
                    {option.icon}
                  </div>
                  <div className="text-left">
                    <h4 className={`font-medium ${
                      visibleTo === option.value
                        ? 'text-violet-500'
                        : 'text-[var(--synclulu-text)]'
                    }`}>
                      {option.label}
                    </h4>
                    <p className="text-xs text-[var(--synclulu-muted)]">{option.desc}</p>
                  </div>
                </div>
                {visibleTo === option.value && (
                  <CheckCircle size={20} className="text-violet-500" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Info Box */}
        <section className="rounded-2xl bg-violet-500/5 border border-violet-500/10 p-4">
          <div className="flex gap-3">
            <Info size={20} className="text-violet-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-violet-500 mb-1">Deine Privatsphäre</h4>
              <p className="text-xs text-[var(--synclulu-muted)]">
                synclulu speichert niemals dein Geburtsdatum oder Ausweisdaten.
                Wir nutzen nur verschlüsselte Hashes um dein Alter zu verifizieren.
                Dein Standort wird nur während du die App nutzt verarbeitet.
              </p>
            </div>
          </div>
        </section>

        {/* Spacer for safe area */}
        <div className="h-20" />
      </div>
    </div>
  );
};

export default PrivacyDashboard;
