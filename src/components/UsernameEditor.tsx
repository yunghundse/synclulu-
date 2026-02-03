/**
 * DELULU USERNAME EDITOR
 * "Solid Identity" - Username change with 30-day cooldown
 *
 * Features:
 * - Visual progress bar for cooldown
 * - Real-time availability check
 * - Elegant feedback design
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  AtSign, Check, X, Loader2, Clock, AlertTriangle,
  Calendar, Lock, Unlock, Info
} from 'lucide-react';
import { useStore } from '@/lib/store';
import {
  getUsernameChangeStatus,
  validateUsernameFormat,
  checkUsernameAvailability,
  changeUsername,
  formatDaysRemaining,
  formatChangeDate,
  USERNAME_CHANGE_COOLDOWN_DAYS,
  UsernameChangeStatus,
} from '@/lib/usernameSystem';
import { debounce } from 'lodash';

// ═══════════════════════════════════════
// PROGRESS RING COMPONENT
// ═══════════════════════════════════════

interface ProgressRingProps {
  progress: number;  // 0-100
  size: number;
  strokeWidth: number;
  daysRemaining: number;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size,
  strokeWidth,
  daysRemaining,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progress >= 100 ? '#10B981' : '#8B5CF6'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {progress >= 100 ? (
          <Unlock size={24} className="text-green-500" />
        ) : (
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{daysRemaining}</p>
            <p className="text-[10px] text-gray-500">Tage</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════

interface UsernameEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newUsername: string) => void;
}

const UsernameEditor: React.FC<UsernameEditorProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, setUser } = useStore();

  const [username, setUsername] = useState(user?.username || '');
  const [status, setStatus] = useState<UsernameChangeStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Load status on mount
  useEffect(() => {
    if (user?.id && isOpen) {
      loadStatus();
    }
  }, [user?.id, isOpen]);

  const loadStatus = async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      const result = await getUsernameChangeStatus(user.id);
      setStatus(result);
    } catch (err) {
      console.error('Failed to load username status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced availability check
  const checkAvailability = useCallback(
    debounce(async (value: string) => {
      if (!value || value === user?.username) {
        setIsAvailable(null);
        return;
      }

      const formatResult = validateUsernameFormat(value);
      if (!formatResult.isValid) {
        setError(formatResult.error || null);
        setIsAvailable(false);
        setIsChecking(false);
        return;
      }

      setIsChecking(true);
      setError(null);

      try {
        const result = await checkUsernameAvailability(value, user?.id);
        setIsAvailable(result.isAvailable);
        if (!result.isAvailable) {
          setError(result.error || 'Username nicht verfügbar');
        }
      } catch {
        setIsAvailable(false);
        setError('Prüfung fehlgeschlagen');
      } finally {
        setIsChecking(false);
      }
    }, 500),
    [user?.id, user?.username]
  );

  // Handle input change
  const handleUsernameChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(normalized);
    setIsAvailable(null);
    setError(null);

    if (normalized && normalized !== user?.username) {
      checkAvailability(normalized);
    }
  };

  // Save username
  const handleSave = async () => {
    if (!user?.id || !username || username === user?.username) return;

    setIsSaving(true);
    setError(null);

    try {
      const result = await changeUsername(user.id, username);

      if (result.success) {
        // Update local state
        setUser({ ...user, username });

        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([20, 10, 30]);
        }

        onSuccess?.(username);
        onClose();
      } else {
        setError(result.error || 'Änderung fehlgeschlagen');
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const canSave = username !== user?.username && isAvailable && !isChecking && status?.canChange;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-6 py-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Username ändern</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-white/80 text-sm mt-1">
            Dein @handle ist deine Identität
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="text-purple-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Cooldown Status */}
              {status && (
                <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-2xl">
                  <ProgressRing
                    progress={status.progressPercent}
                    size={80}
                    strokeWidth={8}
                    daysRemaining={status.daysRemaining}
                  />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {status.canChange ? (
                        <span className="text-green-600 flex items-center gap-2">
                          <Check size={18} />
                          Änderung möglich
                        </span>
                      ) : (
                        <span className="text-amber-600 flex items-center gap-2">
                          <Clock size={18} />
                          {formatDaysRemaining(status.daysRemaining)}
                        </span>
                      )}
                    </p>
                    {status.lastChanged && (
                      <p className="text-sm text-gray-500 mt-1">
                        Letzte Änderung: {formatChangeDate(status.lastChanged)}
                      </p>
                    )}
                    {status.nextChangeDate && !status.canChange && (
                      <p className="text-xs text-gray-400 mt-1">
                        Verfügbar ab: {formatChangeDate(status.nextChangeDate)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Username Input */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Neuer Username
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <AtSign size={20} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    disabled={!status?.canChange}
                    className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 transition-all ${
                      !status?.canChange
                        ? 'bg-gray-100 border-gray-200 text-gray-400'
                        : error
                        ? 'border-red-300 focus:border-red-500'
                        : isAvailable
                        ? 'border-green-300 focus:border-green-500'
                        : 'border-gray-200 focus:border-purple-500'
                    } outline-none`}
                    placeholder="dein_username"
                    maxLength={20}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {isChecking ? (
                      <Loader2 size={20} className="text-gray-400 animate-spin" />
                    ) : isAvailable === true ? (
                      <Check size={20} className="text-green-500" />
                    ) : isAvailable === false ? (
                      <X size={20} className="text-red-500" />
                    ) : null}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1 animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle size={14} />
                    {error}
                  </p>
                )}

                {/* Availability Success */}
                {isAvailable && username !== user?.username && (
                  <p className="text-green-600 text-sm mt-2 flex items-center gap-1 animate-in fade-in slide-in-from-top-2">
                    <Check size={14} />
                    @{username} ist verfügbar
                  </p>
                )}
              </div>

              {/* Info Box */}
              <div className="p-4 bg-purple-50 rounded-xl mb-6">
                <div className="flex items-start gap-3">
                  <Info size={18} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-purple-800">
                    <p className="font-medium mb-1">Regeln für Usernames:</p>
                    <ul className="text-xs space-y-1 text-purple-700">
                      <li>• 3-20 Zeichen</li>
                      <li>• Nur Kleinbuchstaben, Zahlen & Unterstriche</li>
                      <li>• Änderung nur alle {USERNAME_CHANGE_COOLDOWN_DAYS} Tage möglich</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSave}
                  disabled={!canSave || isSaving}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-purple-500/30"
                >
                  {isSaving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Check size={18} />
                      Speichern
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsernameEditor;
