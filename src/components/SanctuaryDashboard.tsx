/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SANCTUARY DASHBOARD v5.5
 * "Das ultimative Privacy & Safety Center"
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Minimalistisches Dashboard mit:
 * - 100% Darkmode-Sync
 * - Gender-Lock Toggle
 * - Identity-Verification-Status
 * - Safety-Score Anzeige
 * - Consent Management
 * - Ghost Mode
 *
 * @version 5.5.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ShieldCheck, ShieldAlert, Eye, EyeOff,
  Users, UserCheck, UserX, Ghost, Lock, Unlock,
  Mic, MicOff, Radio, MapPin, Fingerprint,
  ChevronRight, AlertTriangle, CheckCircle, Info,
  Settings, Bell, FileText, HelpCircle
} from 'lucide-react';
import {
  getSafetyProfile,
  updateVisibilitySettings,
  AegisSafetyProfile,
  VisibilityGender,
  SAFETY_THRESHOLDS,
} from '@/lib/aegisVerification';
import { getScoreHistory, ScoreChange } from '@/lib/aegisSafetyScore';
import { getUserConsents, ConsentRecord, withdrawConsent } from '@/lib/legalAudit';
import { useStore } from '@/lib/store';
import SanctuaryConsentModal from './SanctuaryConsentModal';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface SanctuaryDashboardProps {
  onClose?: () => void;
}

// ═══════════════════════════════════════
// TOGGLE COMPONENT (Apple-Style)
// ═══════════════════════════════════════

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  color?: 'violet' | 'emerald' | 'amber' | 'red';
}

const Toggle: React.FC<ToggleProps> = ({
  enabled,
  onChange,
  disabled,
  color = 'violet'
}) => {
  const colors = {
    violet: 'bg-violet-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };

  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`
        relative w-14 h-8 rounded-full transition-all duration-300 ease-out
        ${enabled ? colors[color] : 'bg-[var(--delulu-surface)]'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <motion.div
        animate={{ x: enabled ? 26 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md"
      />
    </button>
  );
};

// ═══════════════════════════════════════
// SECTION COMPONENT
// ═══════════════════════════════════════

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-xs font-semibold text-[var(--delulu-muted)] uppercase tracking-wider px-4 mb-3">
      {title}
    </h3>
    <div className="rounded-2xl bg-[var(--delulu-card)] border border-[var(--delulu-border)] divide-y divide-[var(--delulu-border)] overflow-hidden theme-transition">
      {children}
    </div>
  </div>
);

// ═══════════════════════════════════════
// SETTING ROW COMPONENT
// ═══════════════════════════════════════

interface SettingRowProps {
  icon: React.ReactNode;
  iconColor?: string;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  iconColor = 'text-violet-500',
  title,
  subtitle,
  rightElement,
  onClick,
  disabled,
}) => (
  <button
    onClick={onClick}
    disabled={disabled || !onClick}
    className={`
      w-full p-4 flex items-center gap-4 text-left transition-colors
      ${onClick && !disabled ? 'hover:bg-[var(--delulu-surface)] active:bg-[var(--delulu-border)]' : ''}
      ${disabled ? 'opacity-50' : ''}
    `}
  >
    <div className={`w-10 h-10 rounded-xl bg-[var(--delulu-surface)] flex items-center justify-center ${iconColor}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-[var(--delulu-text)] truncate">{title}</p>
      {subtitle && (
        <p className="text-sm text-[var(--delulu-muted)] truncate">{subtitle}</p>
      )}
    </div>
    {rightElement || (onClick && (
      <ChevronRight size={20} className="text-[var(--delulu-muted)]" />
    ))}
  </button>
);

// ═══════════════════════════════════════
// SAFETY SCORE CARD
// ═══════════════════════════════════════

interface SafetyScoreCardProps {
  score: number;
  onViewHistory: () => void;
}

const SafetyScoreCard: React.FC<SafetyScoreCardProps> = ({ score, onViewHistory }) => {
  const getStatus = () => {
    if (score >= SAFETY_THRESHOLDS.FULL_ACCESS) return { color: 'emerald', label: 'Ausgezeichnet', icon: ShieldCheck };
    if (score >= SAFETY_THRESHOLDS.LIMITED_ACCESS) return { color: 'amber', label: 'Eingeschränkt', icon: Shield };
    if (score >= SAFETY_THRESHOLDS.SUSPENDED) return { color: 'orange', label: 'Warnung', icon: ShieldAlert };
    return { color: 'red', label: 'Gesperrt', icon: ShieldAlert };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  const gradients = {
    emerald: 'from-emerald-500/20 to-emerald-600/20',
    amber: 'from-amber-500/20 to-amber-600/20',
    orange: 'from-orange-500/20 to-orange-600/20',
    red: 'from-red-500/20 to-red-600/20',
  };

  const textColors = {
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
    orange: 'text-orange-500',
    red: 'text-red-500',
  };

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradients[status.color as keyof typeof gradients]} p-4 mb-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <StatusIcon size={24} className={textColors[status.color as keyof typeof textColors]} />
          <div>
            <p className="text-sm text-[var(--delulu-muted)]">Safety Score</p>
            <p className={`text-2xl font-bold ${textColors[status.color as keyof typeof textColors]}`}>
              {score}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full bg-[var(--delulu-bg)]/50 ${textColors[status.color as keyof typeof textColors]} text-sm font-medium`}>
          {status.label}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 rounded-full bg-[var(--delulu-bg)]/30 overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full ${
            status.color === 'emerald' ? 'bg-emerald-500' :
            status.color === 'amber' ? 'bg-amber-500' :
            status.color === 'orange' ? 'bg-orange-500' :
            'bg-red-500'
          }`}
        />
      </div>

      <button
        onClick={onViewHistory}
        className="w-full py-2 text-sm text-[var(--delulu-text)] hover:underline"
      >
        Score-Verlauf anzeigen →
      </button>
    </div>
  );
};

// ═══════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════

const SanctuaryDashboard: React.FC<SanctuaryDashboardProps> = ({ onClose }) => {
  const { user } = useStore();

  // State
  const [profile, setProfile] = useState<AegisSafetyProfile | null>(null);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<ScoreChange[]>([]);

  // Settings state
  const [radarEnabled, setRadarEnabled] = useState(true);
  const [ghostMode, setGhostMode] = useState(false);
  const [visibleTo, setVisibleTo] = useState<VisibilityGender>('ALL');
  const [sanctuaryActive, setSanctuaryActive] = useState(true);

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const [profileData, userConsents, history] = await Promise.all([
          getSafetyProfile(user.id),
          getUserConsents(user.id),
          getScoreHistory(user.id, 10),
        ]);

        if (profileData) {
          setProfile(profileData);
          setRadarEnabled(profileData.radarEnabled);
          setGhostMode(profileData.ghostMode);
          setVisibleTo(profileData.visibleToGender);
        }

        setConsents(userConsents);
        setScoreHistory(history);

        // Check if sanctuary consent is active
        const sanctuaryConsent = userConsents.find(c => c.consentType === 'sanctuary_audio');
        setSanctuaryActive(sanctuaryConsent?.granted ?? false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user?.id]);

  // Save settings
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
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
    setIsSaving(false);
  }, [user?.id]);

  const handleSanctuaryToggle = useCallback(async (enabled: boolean) => {
    if (enabled) {
      setShowConsentModal(true);
    } else {
      // Withdraw consent
      if (user?.id) {
        await withdrawConsent(user.id, 'sanctuary_audio');
        setSanctuaryActive(false);
      }
    }
  }, [user?.id]);

  const handleConsentAccepted = useCallback(() => {
    setShowConsentModal(false);
    setSanctuaryActive(true);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--delulu-bg)]">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          >
            <Shield size={40} className="text-violet-500" />
          </motion.div>
          <p className="text-[var(--delulu-muted)]">Lade Sanctuary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--delulu-bg)] theme-transition">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[var(--delulu-bg)]/80 backdrop-blur-xl border-b border-[var(--delulu-border)]">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
              <Shield size={22} className="text-violet-500" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--delulu-text)]">Sanctuary</h1>
              <p className="text-xs text-[var(--delulu-muted)]">Sicherheit & Privatsphäre</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-violet-500"
            >
              Fertig
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Safety Score Card */}
        {profile && (
          <SafetyScoreCard
            score={profile.safetyScore}
            onViewHistory={() => setShowHistory(!showHistory)}
          />
        )}

        {/* Score History */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="space-y-2">
                {scoreHistory.length > 0 ? (
                  scoreHistory.map(change => (
                    <div
                      key={change.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--delulu-card)] border border-[var(--delulu-border)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                          ${change.change > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}
                        `}>
                          {change.change > 0 ? '+' : ''}{change.change}
                        </div>
                        <div>
                          <p className="text-sm text-[var(--delulu-text)]">{change.reason}</p>
                          <p className="text-xs text-[var(--delulu-muted)]">
                            {change.createdAt.toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      </div>
                      <span className="font-medium text-[var(--delulu-text)]">{change.newScore}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-[var(--delulu-muted)] py-4">
                    Keine Score-Änderungen
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sanctuary System */}
        <Section title="Schutzsysteme">
          <SettingRow
            icon={<Mic size={20} />}
            iconColor={sanctuaryActive ? 'text-emerald-500' : 'text-red-500'}
            title="Sanctuary Audio"
            subtitle={sanctuaryActive ? 'Aktiv - Lokale Analyse' : 'Deaktiviert'}
            rightElement={
              <Toggle
                enabled={sanctuaryActive}
                onChange={handleSanctuaryToggle}
                color={sanctuaryActive ? 'emerald' : 'red'}
              />
            }
          />
          <SettingRow
            icon={<ShieldCheck size={20} />}
            iconColor="text-violet-500"
            title="Guardian Text-Filter"
            subtitle="Immer aktiv"
            rightElement={
              <div className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 text-xs">
                Pflicht
              </div>
            }
          />
        </Section>

        {/* Verification Status */}
        <Section title="Verifikation">
          <SettingRow
            icon={profile?.isAdult ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            iconColor={profile?.isAdult ? 'text-emerald-500' : 'text-amber-500'}
            title={profile?.isAdult ? 'Verifiziert (18+)' : 'Geschütztes Profil'}
            subtitle={
              profile?.verificationMethod === 'ID_DOCUMENT_HASH'
                ? 'Via Ausweis-Verifikation'
                : profile?.verificationMethod === 'AI_ESTIMATION'
                  ? 'Via KI-Schätzung'
                  : 'Selbst-Deklaration'
            }
            rightElement={
              <div className={`px-3 py-1 rounded-full text-xs ${
                profile?.isAdult
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-amber-500/10 text-amber-500'
              }`}>
                {profile?.isMinorProtected ? 'Geschützt' : 'Erwachsenen-Pool'}
              </div>
            }
          />
          <SettingRow
            icon={<Fingerprint size={20} />}
            iconColor="text-violet-500"
            title="Geräte-ID"
            subtitle={profile?.deviceFingerprintHash ? 'Registriert' : 'Nicht registriert'}
            rightElement={
              <Lock size={18} className="text-[var(--delulu-muted)]" />
            }
          />
        </Section>

        {/* Visibility Settings */}
        <Section title="Sichtbarkeit">
          <SettingRow
            icon={<Radio size={20} />}
            iconColor="text-violet-500"
            title="Radar aktiv"
            subtitle="Auf dem Radar sichtbar"
            rightElement={
              <Toggle
                enabled={radarEnabled}
                onChange={(v) => {
                  setRadarEnabled(v);
                  saveSettings({ radarEnabled: v });
                }}
                disabled={isSaving}
              />
            }
          />
          <SettingRow
            icon={<Ghost size={20} />}
            iconColor="text-gray-500"
            title="Ghost-Mode"
            subtitle="Komplett unsichtbar"
            rightElement={
              <Toggle
                enabled={ghostMode}
                onChange={(v) => {
                  setGhostMode(v);
                  saveSettings({ ghostMode: v });
                }}
                disabled={isSaving}
                color="amber"
              />
            }
          />
        </Section>

        {/* Gender Lock */}
        <Section title="Wer kann mich sehen? (Gender-Lock)">
          {[
            { value: 'ALL' as VisibilityGender, icon: <Users size={18} />, label: 'Alle' },
            { value: 'FEMALE_ONLY' as VisibilityGender, icon: <UserCheck size={18} />, label: 'Nur Frauen', desc: 'Sicherheits-Feature' },
            { value: 'VERIFIED_ONLY' as VisibilityGender, icon: <Lock size={18} />, label: 'Nur Verifizierte (18+)' },
          ].map(option => (
            <SettingRow
              key={option.value}
              icon={option.icon}
              iconColor={visibleTo === option.value ? 'text-violet-500' : 'text-[var(--delulu-muted)]'}
              title={option.label}
              subtitle={option.desc}
              onClick={() => {
                setVisibleTo(option.value);
                saveSettings({ visibleToGender: option.value });
              }}
              rightElement={
                visibleTo === option.value && (
                  <CheckCircle size={20} className="text-violet-500" />
                )
              }
            />
          ))}
        </Section>

        {/* Legal & Info */}
        <Section title="Rechtliches">
          <SettingRow
            icon={<FileText size={20} />}
            iconColor="text-[var(--delulu-muted)]"
            title="Datenschutzerklärung"
            onClick={() => {/* Navigate to privacy policy */}}
          />
          <SettingRow
            icon={<FileText size={20} />}
            iconColor="text-[var(--delulu-muted)]"
            title="AGB"
            onClick={() => {/* Navigate to TOS */}}
          />
          <SettingRow
            icon={<HelpCircle size={20} />}
            iconColor="text-[var(--delulu-muted)]"
            title="Hilfe & Support"
            onClick={() => {/* Navigate to support */}}
          />
        </Section>

        {/* Info Box */}
        <div className="rounded-2xl bg-violet-500/5 border border-violet-500/10 p-4 mb-6">
          <div className="flex gap-3">
            <Info size={20} className="text-violet-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-violet-500 mb-1">Privacy by Design</h4>
              <p className="text-xs text-[var(--delulu-muted)]">
                Delulu speichert niemals dein Geburtsdatum oder Ausweisdaten.
                Die Audio-Analyse erfolgt lokal auf deinem Gerät.
                Dein Standort wird nur während der Nutzung verarbeitet.
              </p>
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="h-24" />
      </div>

      {/* Consent Modal */}
      <SanctuaryConsentModal
        isOpen={showConsentModal}
        onAccept={handleConsentAccepted}
        onDecline={() => setShowConsentModal(false)}
        isRequired={false}
      />
    </div>
  );
};

export default SanctuaryDashboard;
