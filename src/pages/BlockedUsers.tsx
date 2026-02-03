/**
 * BLOCKED USERS PAGE
 * View and manage blocked users
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white safe-top">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-gray-900">
              Blockierte Nutzer
            </h1>
            <p className="text-xs text-gray-500">
              {blockedUsers.length} {blockedUsers.length === 1 ? 'Person' : 'Personen'} blockiert
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Shield size={20} className="text-red-500" />
          </div>
        </div>
      </div>

      {/* Search */}
      {blockedUsers.length > 5 && (
        <div className="px-4 py-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suchen..."
              className="w-full pl-11 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="text-gray-300 animate-spin" />
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
              <UserX size={32} className="text-green-500" />
            </div>
            <h2 className="font-semibold text-gray-900 mb-2">Keine blockierten Nutzer</h2>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Du hast noch niemanden blockiert. Wenn dich jemand stört, kannst du ihn/sie auf dem Profil blockieren.
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20">
            <Search size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Keine Ergebnisse für "{searchQuery}"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((blockedUser) => (
              <div
                key={blockedUser.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
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
                      <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400">
                        <User size={24} />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <Shield size={12} className="text-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      @{blockedUser.username}
                    </p>
                    {blockedUser.displayName && (
                      <p className="text-sm text-gray-500 truncate">
                        {blockedUser.displayName}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Blockiert am {formatDate(blockedUser.blockedAt)} • {getReasonLabel(blockedUser.reason)}
                    </p>
                  </div>

                  {/* Unblock button */}
                  <button
                    onClick={() => setShowConfirm(blockedUser.blockedUserId)}
                    disabled={unblockingId === blockedUser.blockedUserId}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {unblockingId === blockedUser.blockedUserId ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Unlock size={16} />
                    )}
                    <span className="hidden sm:inline">Entblocken</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        {blockedUsers.length > 0 && (
          <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-200">
            <div className="flex gap-3">
              <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Was passiert beim Blockieren?</p>
                <ul className="text-xs space-y-1 text-amber-700">
                  <li>• Diese Person kann dir keine Nachrichten mehr senden</li>
                  <li>• Ihr seht euch nicht mehr in der "In der Nähe"-Liste</li>
                  <li>• Voice-Chats werden verhindert</li>
                  <li>• Die Person erfährt nicht, dass sie blockiert wurde</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Unblock Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <Unlock size={28} className="text-amber-600" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Nutzer entblocken?
            </h2>

            <p className="text-gray-500 text-center text-sm mb-6">
              Diese Person kann dich dann wieder kontaktieren und in Voice-Chats sehen.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleUnblock(showConfirm)}
                className="flex-1 py-3 bg-violet-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
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
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockedUsers;
