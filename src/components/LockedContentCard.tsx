/**
 * DELULU LOCKED CONTENT CARD
 * "Secret Bubble" with blur effect and unlock options
 */

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import {
  Lock, Unlock, Gift, Coins, Crown, Share2,
  Eye, Users, Sparkles, X, Check, Loader2
} from 'lucide-react';
import {
  LockedContent,
  UnlockMethod,
  LOCK_CONFIG,
  hasUnlockedContent,
  unlockContent,
  getAvailableFreeUnlocks,
  getUserWallet,
} from '@/lib/lockSystem';

interface LockedContentCardProps {
  content: LockedContent;
  onUnlock?: (unlockedContent: string) => void;
}

const LockedContentCard = ({ content, onUnlock }: LockedContentCardProps) => {
  const { user } = useStore();
  const [isLocked, setIsLocked] = useState(true);
  const [unlockedText, setUnlockedText] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);
  const [freeUnlocks, setFreeUnlocks] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUnlockStatus();
    loadBalances();
  }, [user?.id, content.id]);

  const checkUnlockStatus = async () => {
    if (!user?.id) return;

    const unlocked = await hasUnlockedContent(user.id, content.id);
    setIsLocked(!unlocked);

    if (unlocked) {
      // Content was already unlocked, show it
      setUnlockedText(content.content);
    }
  };

  const loadBalances = async () => {
    if (!user?.id) return;

    const wallet = await getUserWallet(user.id);
    setCoinBalance(wallet?.balance || 0);

    const free = await getAvailableFreeUnlocks(user.id);
    setFreeUnlocks(free);
  };

  const handleUnlock = async (method: UnlockMethod) => {
    if (!user?.id) return;

    setIsUnlocking(true);
    setError(null);

    const result = await unlockContent(user.id, content.id, method);

    if (result.success && result.content) {
      setIsLocked(false);
      setUnlockedText(result.content);
      setShowUnlockModal(false);
      onUnlock?.(result.content);
      loadBalances(); // Refresh balances
    } else {
      setError(result.error || 'Fehler beim Entsperren');
    }

    setIsUnlocking(false);
  };

  const renderContentPreview = () => {
    if (content.type === 'image') {
      return (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden">
          {/* Blurred preview image */}
          <img
            src={content.thumbnailUrl || '/placeholder-locked.jpg'}
            alt="Locked content"
            className="w-full h-full object-cover"
            style={{
              filter: isLocked ? `blur(${LOCK_CONFIG.blurIntensity}px)` : 'none',
              transition: 'filter 0.5s ease',
            }}
          />

          {/* Unlocked image */}
          {!isLocked && unlockedText && (
            <img
              src={unlockedText}
              alt={content.title}
              className="w-full h-full object-cover absolute inset-0"
            />
          )}

          {/* Lock overlay */}
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="text-center text-white">
                <Lock size={48} className="mx-auto mb-2 animate-pulse" />
                <p className="font-semibold">Secret Bubble 🔒</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Text content
    return (
      <div className="relative bg-white/5 rounded-xl p-4 min-h-[120px]">
        <p
          className="text-white/90 leading-relaxed"
          style={{
            filter: isLocked ? `blur(${LOCK_CONFIG.blurIntensity}px)` : 'none',
            userSelect: isLocked ? 'none' : 'auto',
            transition: 'filter 0.5s ease',
          }}
        >
          {isLocked ? content.previewText || content.content : unlockedText || content.content}
        </p>

        {/* Lock overlay for text */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Lock size={32} className="mx-auto mb-2 text-white/80 animate-pulse" />
              <p className="text-white/80 text-sm">Tippe zum Entsperren</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl overflow-hidden border border-white/10">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">{content.creatorUsername}</p>
              <p className="text-xs text-white/60">Secret Bubble</p>
            </div>
          </div>

          {isLocked ? (
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full flex items-center gap-1">
              <Lock size={12} />
              Gesperrt
            </span>
          ) : (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full flex items-center gap-1">
              <Unlock size={12} />
              Entsperrt
            </span>
          )}
        </div>

        {/* Content */}
        <div
          className="p-4 cursor-pointer"
          onClick={() => isLocked && setShowUnlockModal(true)}
        >
          <h3 className="font-bold text-white mb-3">{content.title}</h3>
          {renderContentPreview()}
        </div>

        {/* Stats & Actions */}
        <div className="px-4 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-white/60 text-sm">
            <span className="flex items-center gap-1">
              <Eye size={14} />
              {content.totalUnlocks}
            </span>
            <span className="flex items-center gap-1">
              <Coins size={14} />
              {content.unlockCost}
            </span>
          </div>

          {isLocked && (
            <button
              onClick={() => setShowUnlockModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl flex items-center gap-2"
            >
              <Unlock size={16} />
              Entsperren
            </button>
          )}
        </div>
      </div>

      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md bg-gray-900 rounded-3xl overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Secret Bubble entsperren</h2>
                <button
                  onClick={() => setShowUnlockModal(false)}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-white/80">
                "{content.title}" von @{content.creatorUsername}
              </p>
            </div>

            {/* Unlock Options */}
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Referral Option */}
              {content.unlockMethods.includes('referral') && (
                <button
                  onClick={() => handleUnlock('referral')}
                  disabled={isUnlocking || freeUnlocks < content.requiresInvites}
                  className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
                    freeUnlocks >= content.requiresInvites
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 hover:border-green-400'
                      : 'bg-gray-800 border-2 border-gray-700 opacity-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Users size={24} className="text-green-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-white">Gratis mit Einladung</p>
                    <p className="text-sm text-white/60">
                      {freeUnlocks >= content.requiresInvites
                        ? `${freeUnlocks} Einladungen verfügbar`
                        : `Noch ${content.requiresInvites - freeUnlocks} Einladung(en) nötig`}
                    </p>
                  </div>
                  {freeUnlocks >= content.requiresInvites && (
                    <div className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-full">
                      GRATIS
                    </div>
                  )}
                </button>
              )}

              {/* Coins Option */}
              {content.unlockMethods.includes('coins') && (
                <button
                  onClick={() => handleUnlock('coins')}
                  disabled={isUnlocking || coinBalance < content.unlockCost}
                  className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
                    coinBalance >= content.unlockCost
                      ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-2 border-amber-500/50 hover:border-amber-400'
                      : 'bg-gray-800 border-2 border-gray-700 opacity-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Coins size={24} className="text-amber-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-white">Mit Coins bezahlen</p>
                    <p className="text-sm text-white/60">
                      Dein Guthaben: 💎 {coinBalance}
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-amber-500 text-white text-sm font-bold rounded-full">
                    💎 {content.unlockCost}
                  </div>
                </button>
              )}

              {/* Premium Option */}
              {content.unlockMethods.includes('premium') && (
                <button
                  onClick={() => handleUnlock('premium')}
                  disabled={isUnlocking}
                  className="w-full p-4 rounded-xl flex items-center gap-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 hover:border-purple-400 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Crown size={24} className="text-purple-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-white">Mit Premium</p>
                    <p className="text-sm text-white/60">
                      Alle Secret Bubbles inklusive
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full">
                    PRO
                  </div>
                </button>
              )}

              {/* Loading State */}
              {isUnlocking && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={24} className="animate-spin text-purple-400" />
                  <span className="ml-2 text-white/60">Wird entsperrt...</span>
                </div>
              )}

              {/* Invite Friends CTA */}
              {freeUnlocks < content.requiresInvites && (
                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl">
                  <p className="text-sm text-blue-300 mb-3">
                    Lade Freunde ein und entsperre Inhalte gratis!
                  </p>
                  <button className="w-full py-3 bg-blue-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
                    <Share2 size={18} />
                    Freunde einladen
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LockedContentCard;
