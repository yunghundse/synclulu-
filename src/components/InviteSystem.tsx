/**
 * DELULU INVITE SYSTEM
 * "The Growth Engine" - Exclusive, magical invite experience
 * Inspired by Clubhouse invites & Apple design language
 */

import React, { useState, useEffect } from 'react';
import {
  Gift, Share2, Copy, Check, Sparkles,
  Lock, Trophy, X
} from 'lucide-react';
import { useStore } from '@/lib/store';
import {
  getUserReferrals,
  getReferralStats,
  shareReferralLink,
  copyReferralLink,
  ReferralLink,
} from '@/lib/referralSystem';
import { REFERRAL_MILESTONES, ReferralUnlock } from '@/types';

// ═══════════════════════════════════════
// SHARE CARD COMPONENT
// ═══════════════════════════════════════

interface ShareCardProps {
  code: string;
  username: string;
  onShare: () => void;
  onCopy: () => void;
  isUsed: boolean;
}

const ShareCard: React.FC<ShareCardProps> = ({ code, username, onShare, onCopy, isUsed }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyReferralLink(code);
    if (success) {
      setCopied(true);
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 5, 20]);
      }
      setTimeout(() => setCopied(false), 2000);
      onCopy();
    }
  };

  const handleShare = async () => {
    await shareReferralLink(code, username);
    if ('vibrate' in navigator) {
      navigator.vibrate([15, 10, 30]);
    }
    onShare();
  };

  if (isUsed) {
    return (
      <div className="relative bg-gray-100 rounded-2xl p-4 opacity-60">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center">
            <Check size={24} className="text-gray-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-400 line-through">{code}</p>
            <p className="text-xs text-gray-400">Bereits verwendet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />

      <div className="relative bg-white/80 backdrop-blur-sm border border-purple-200/50 rounded-2xl p-4 shadow-lg shadow-purple-500/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Gift size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-mono font-bold text-purple-900 tracking-wider">{code}</p>
            <p className="text-xs text-purple-600/70">Exklusiver Einladungscode</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <Sparkles size={16} className="text-green-600" />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium text-sm transition-all active:scale-95"
          >
            {copied ? (
              <>
                <Check size={16} className="text-green-600" />
                <span className="text-green-600">Kopiert!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                Kopieren
              </>
            )}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl text-white font-medium text-sm transition-all active:scale-95 shadow-lg shadow-purple-500/30"
          >
            <Share2 size={16} />
            Teilen
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
// MILESTONE CARD COMPONENT
// ═══════════════════════════════════════

interface MilestoneCardProps {
  count: number;
  unlock: ReferralUnlock;
  label: string;
  icon: string;
  currentReferrals: number;
  isUnlocked: boolean;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({
  count,
  label,
  icon,
  currentReferrals,
  isUnlocked,
}) => {
  return (
    <div
      className={`relative p-4 rounded-2xl border-2 transition-all animate-in fade-in ${
        isUnlocked
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 shadow-lg shadow-amber-500/20'
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
            isUnlocked
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30'
              : 'bg-gray-200'
          }`}
        >
          {isUnlocked ? icon : <Lock size={20} className="text-gray-400" />}
        </div>
        <div className="flex-1">
          <p className={`font-semibold ${isUnlocked ? 'text-amber-900' : 'text-gray-500'}`}>
            {label}
          </p>
          <p className={`text-xs ${isUnlocked ? 'text-amber-600' : 'text-gray-400'}`}>
            {isUnlocked ? '✓ Freigeschaltet!' : `${count} Einladungen benötigt`}
          </p>
        </div>
        {isUnlocked && (
          <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center animate-in zoom-in">
            <Check size={16} className="text-white" />
          </div>
        )}
      </div>

      {!isUnlocked && currentReferrals > 0 && (
        <div className="mt-3">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (currentReferrals / count) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1 text-right">
            {currentReferrals}/{count}
          </p>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════
// MAIN INVITE SYSTEM COMPONENT
// ═══════════════════════════════════════

interface InviteSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

const InviteSystem: React.FC<InviteSystemProps> = ({ isOpen, onClose }) => {
  const { user } = useStore();
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [stats, setStats] = useState({
    totalLinks: 0,
    usedLinks: 0,
    availableLinks: 0,
    totalReferrals: 0,
    xpEarned: 0,
    premiumDaysEarned: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id && isOpen) {
      loadReferralData();
    }
  }, [user?.id, isOpen]);

  const loadReferralData = async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      const [referrals, referralStats] = await Promise.all([
        getUserReferrals(user.id),
        getReferralStats(user.id),
      ]);

      if (referrals) {
        setLinks(referrals.links);
      }
      setStats(referralStats);
    } catch (error) {
      console.error('Failed to load referral data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const availableLinks = links.filter(l => l.isActive && !l.usedBy);
  const usedLinks = links.filter(l => l.usedBy !== null);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 px-6 py-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Gift size={32} className="text-white" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">Freunde einladen</h2>
              <p className="text-white/80 text-sm">
                {stats.availableLinks} von {stats.totalLinks} Einladungen verfügbar
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-3 bg-white/10 rounded-xl">
              <p className="text-2xl font-bold">{stats.totalReferrals}</p>
              <p className="text-xs text-white/70">Eingeladen</p>
            </div>
            <div className="text-center p-3 bg-white/10 rounded-xl">
              <p className="text-2xl font-bold">{stats.xpEarned}</p>
              <p className="text-xs text-white/70">XP verdient</p>
            </div>
            <div className="text-center p-3 bg-white/10 rounded-xl">
              <p className="text-2xl font-bold">{stats.premiumDaysEarned}d</p>
              <p className="text-xs text-white/70">Premium</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-500" />
                  Deine Einladungscodes
                </h3>
                <div className="space-y-3">
                  {availableLinks.map((link) => (
                    <ShareCard
                      key={link.id}
                      code={link.code}
                      username={user?.username || 'user'}
                      onShare={() => {}}
                      onCopy={() => {}}
                      isUsed={false}
                    />
                  ))}
                  {usedLinks.map((link) => (
                    <ShareCard
                      key={link.id}
                      code={link.code}
                      username={user?.username || 'user'}
                      onShare={() => {}}
                      onCopy={() => {}}
                      isUsed={true}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Trophy size={16} className="text-amber-500" />
                  Belohnungen freischalten
                </h3>
                <div className="space-y-3">
                  {REFERRAL_MILESTONES.map((milestone) => (
                    <MilestoneCard
                      key={milestone.unlock}
                      count={milestone.count}
                      unlock={milestone.unlock}
                      label={milestone.label}
                      icon={milestone.icon}
                      currentReferrals={stats.totalReferrals}
                      isUnlocked={stats.totalReferrals >= milestone.count}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-purple-50 rounded-2xl">
                <p className="text-sm text-purple-800">
                  <strong>💡 Tipp:</strong> Für jede erfolgreiche Einladung erhältst du{' '}
                  <span className="font-bold">250 XP</span> und{' '}
                  <span className="font-bold">3 Tage Premium</span>!
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteSystem;
