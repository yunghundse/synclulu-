/**
 * BlockedUsers.tsx
 * 🛡️ SOVEREIGN DISCOVERY v23.0 - Theme-Aware Blocked Users Page
 *
 * Features:
 * - Light/Dark mode support
 * - Manage blocked users
 * - Unblock functionality
 * - Smooth animations
 *
 * @design Sovereign Discovery v23.0
 * @version 23.0.0
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { useTranslation } from '@/lib/i18n';
import {
  ChevronLeft, Shield, UserX, Unlock, Loader2,
  Search, AlertTriangle, User
} from 'lucide-react';

const BlockedUsers = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { blockedUsers, isLoading, unblockUser } = useBlockedUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const filteredUsers = blockedUsers.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUnblock = async (userId: string) => {
    setUnblockingId(userId);
    const success = await unblockUser(userId);
    setUnblockingId(null);
    setShowConfirm(null);

    if (success) {
      // Show success feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const getReasonLabel = (reason?: string) => {
    const labels: Record<string, string> = {
      harassment: 'Belästigung',
      spam: 'Spam / Werbung',
      inappropriate: 'Unangemessen',
      personal: 'Persönliche Gründe',
      other: 'Sonstiges',
    };
    return labels[reason || ''] || 'Persönliche Gründe';
  };

  return (
    <div className="min-h-screen bg-[var(--delulu-bg)] safe-top safe-bottom pb-24 theme-transition">
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-transparent" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10 glass-nav border-b border-[var(--delulu-border)]">
        <div className="px-4 py-4 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-[var(--delulu-card)] flex items-center justify-center shadow-sm border border-[var(--delulu-border)]"
          >
            <ChevronLeft size={20} className="text-[var(--delulu-muted)]" />
          </motion.button>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-[var(--delulu-text)]">
              Blockierte Nutzer
            </h1>
            <p className="text-xs text-[var(--delulu-muted)]">
              {blockedUsers.length} {blockedUsers.length === 1 ? 'Person' : 'Personen'} blockiert
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Shield size={20} className="text-red-500" />
          </div>
        </div>
      </div>

      {/* Search */}
      <AnimatePresence>
        {blockedUsers.length > 5 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3"
          >
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--delulu-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suchen..."
                className="w-full pl-11 pr-4 py-3 bg-[var(--delulu-card)] border border-[var(--delulu-border)] rounded-xl text-[var(--delulu-text)] placeholder-[var(--delulu-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--delulu-accent)]/30"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="text-[var(--delulu-muted)] animate-spin" />
          </div>
        ) : blockedUsers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <UserX size={32} className="text-green-500" />
            </div>
            <h2 className="font-semibold text-[var(--delulu-text)] mb-2">Keine blockierten Nutzer</h2>
            <p className="text-sm text-[var(--delulu-muted)] max-w-xs mx-auto">
              Du hast noch niemanden blockiert. Wenn dich jemand stört, kannst du ihn/sie auf dem Profil blockieren.
            </p>
          </motion.div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20">
            <Search size={32} className="text-[var(--delulu-muted)] mx-auto mb-3 opacity-50" />
            <p className="text-[var(--delulu-muted)]">Keine Ergebnisse für "{searchQuery}"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((blockedUser, index) => (
              <motion.div
                key={blockedUser.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[var(--delulu-card)] rounded-2xl border border-[var(--delulu-border)] p-4 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    {blockedUser.avatarUrl ? (
                      <img
                        src={blockedUser.avatarUrl}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover grayscale"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-[var(--delulu-bg)] flex items-center justify-center text-[var(--delulu-muted)]">
                        <User size={24} />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <Shield size={12} className="text-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--delulu-text)] truncate">
                      @{blockedUser.username}
                    </p>
                    {blockedUser.displayName && (
                      <p className="text-sm text-[var(--delulu-muted)] truncate">
                        {blockedUser.displayName}
                      </p>
                    )}
                    <p className="text-xs text-[var(--delulu-muted)] mt-1 opacity-60">
                      Blockiert am {formatDate(blockedUser.blockedAt)} • {getReasonLabel(blockedUser.reason)}
                    </p>
                  </div>

                  {/* Unblock button */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowConfirm(blockedUser.blockedUserId)}
                    disabled={unblockingId === blockedUser.blockedUserId}
                    className="px-4 py-2 bg-[var(--delulu-bg)] text-[var(--delulu-muted)] rounded-xl text-sm font-semibold hover:text-[var(--delulu-text)] transition-colors disabled:opacity-50 flex items-center gap-2 border border-[var(--delulu-border)]"
                  >
                    {unblockingId === blockedUser.blockedUserId ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Unlock size={16} />
                    )}
                    <span className="hidden sm:inline">Entblocken</span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <AnimatePresence>
          {blockedUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-6 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20"
            >
              <div className="flex gap-3">
                <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-[var(--delulu-text)]">
                  <p className="font-medium mb-1">Was passiert beim Blockieren?</p>
                  <ul className="text-xs space-y-1 text-[var(--delulu-muted)]">
                    <li>• Diese Person kann dir keine Nachrichten mehr senden</li>
                    <li>• Ihr seht euch nicht mehr in der "In der Nähe"-Liste</li>
                    <li>• Voice-Chats werden verhindert</li>
                    <li>• Die Person erfährt nicht, dass sie blockiert wurde</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirm Unblock Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--delulu-card)] rounded-3xl w-full max-w-sm p-6 border border-[var(--delulu-border)]"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                <Unlock size={28} className="text-amber-500" />
              </div>

              <h2 className="text-xl font-bold text-[var(--delulu-text)] text-center mb-2">
                Nutzer entblocken?
              </h2>

              <p className="text-[var(--delulu-muted)] text-center text-sm mb-6">
                Diese Person kann dich dann wieder kontaktieren und in Voice-Chats sehen.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="flex-1 py-3 bg-[var(--delulu-bg)] text-[var(--delulu-muted)] rounded-xl font-semibold border border-[var(--delulu-border)]"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => handleUnblock(showConfirm)}
                  className="flex-1 py-3 bg-[var(--delulu-accent)] text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  {unblockingId ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Unlock size={18} />
                      Entblocken
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlockedUsers;
