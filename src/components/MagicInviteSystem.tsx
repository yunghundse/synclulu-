/**
 * synclulu MAGIC INVITE SYSTEM
 * "The Growth Engine" - Clubhouse-inspired exclusive invite experience
 *
 * Features:
 * - Animated golden tickets with holographic effects
 * - Haptic feedback on all interactions
 * - Social media share cards
 * - Dramatic unlock animations
 * - Exclusive "limited edition" feeling
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Gift, Share2, Copy, Check, Sparkles, Star,
  Lock, Trophy, X, Crown, Zap, Heart, Users,
  ChevronRight, ExternalLink
} from 'lucide-react';
import { useStore } from '@/lib/store';
import {
  getUserReferrals,
  getReferralStats,
  shareReferralLink,
  copyReferralLink,
  ReferralLink,
} from '@/lib/referralSystem';

// ═══════════════════════════════════════
// MILESTONES CONFIG
// ═══════════════════════════════════════

const MILESTONES = [
  { count: 1, label: 'Early Adopter Badge', icon: '🌟', reward: '50 XP + Badge' },
  { count: 3, label: 'Social Butterfly', icon: '🦋', reward: '150 XP + 3 Tage Premium' },
  { count: 5, label: 'Inner Circle', icon: '💫', reward: '300 XP + Exklusiver Avatar' },
  { count: 10, label: 'synclulu Legend', icon: '👑', reward: '500 XP + Lifetime Badge' },
];

// ═══════════════════════════════════════
// GOLDEN TICKET COMPONENT
// ═══════════════════════════════════════

interface GoldenTicketProps {
  code: string;
  index: number;
  isUsed: boolean;
  usedBy?: string;
  onCopy: () => void;
  onShare: () => void;
}

const GoldenTicket: React.FC<GoldenTicketProps> = ({
  code,
  index,
  isUsed,
  usedBy,
  onCopy,
  onShare,
}) => {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    const success = await copyReferralLink(code);
    if (success) {
      setCopied(true);
      // Haptic feedback pattern: "success"
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 30, 10, 30, 50]);
      }
      setTimeout(() => setCopied(false), 2000);
      onCopy();
    }
  };

  const handleShare = async () => {
    // Haptic feedback pattern: "share"
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 10, 20, 10, 40]);
    }
    await shareReferralLink(code, 'synclulu_user');
    onShare();
  };

  // Mouse follow effect for holographic shine
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ticketRef.current || isUsed) return;
    const rect = ticketRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    ticketRef.current.style.setProperty('--mouse-x', `${x}%`);
    ticketRef.current.style.setProperty('--mouse-y', `${y}%`);
  };

  if (isUsed) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl p-5 opacity-50"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        }}
      >
        <div className="absolute inset-0 bg-[url('/patterns/noise.png')] opacity-5" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center">
            <Check size={28} className="text-gray-500" />
          </div>
          <div className="flex-1">
            <p className="font-mono text-gray-500 line-through tracking-widest">{code}</p>
            <p className="text-xs text-gray-600 mt-1">Eingelöst ✓</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gray-600">TICKET #{index + 1}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ticketRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="golden-ticket relative overflow-hidden rounded-2xl cursor-pointer group"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Holographic overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(139, 92, 246, 0.3) 0%,
            rgba(236, 72, 153, 0.2) 25%,
            rgba(59, 130, 246, 0.2) 50%,
            transparent 70%)`,
        }}
      />

      {/* Animated border */}
      <div className="absolute inset-0 rounded-2xl p-[1px] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg,
              transparent 0%,
              rgba(139, 92, 246, 0.5) 25%,
              rgba(236, 72, 153, 0.5) 50%,
              rgba(59, 130, 246, 0.5) 75%,
              transparent 100%)`,
            animation: 'shimmer-border 3s linear infinite',
          }}
        />
      </div>

      {/* Sparkle particles */}
      {isHovered && (
        <>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 200}ms`,
                animationDuration: '1.5s',
              }}
            />
          ))}
        </>
      )}

      {/* Content */}
      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                boxShadow: '0 0 30px rgba(251, 191, 36, 0.4)',
              }}
            >
              <Gift size={28} className="text-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <Sparkles size={10} className="text-white" />
              </div>
            </div>
            <div>
              <p className="text-[10px] text-amber-500/60 uppercase tracking-widest font-bold">
                Exklusiv
              </p>
              <p className="font-mono text-xl font-bold text-white tracking-wider">{code}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500">GOLDEN TICKET</p>
            <p className="text-amber-500 font-bold">#{index + 1}</p>
          </div>
        </div>

        {/* Divider with ticket notches */}
        <div className="relative h-4 my-2">
          <div className="absolute left-0 w-4 h-4 bg-synclulu-bg rounded-full -translate-x-1/2" />
          <div className="absolute right-0 w-4 h-4 bg-synclulu-bg rounded-full translate-x-1/2" />
          <div className="absolute inset-x-6 top-1/2 border-t border-dashed border-gray-700" />
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={{
              background: copied
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              color: copied ? 'white' : '#9ca3af',
            }}
          >
            {copied ? (
              <>
                <Check size={18} />
                Kopiert!
              </>
            ) : (
              <>
                <Copy size={18} />
                Code kopieren
              </>
            )}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white text-sm font-semibold transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
            }}
          >
            <Share2 size={18} />
            Teilen
          </button>
        </div>

        {/* Reward hint */}
        <p className="text-center text-[11px] text-gray-500 mt-3">
          <Sparkles size={12} className="inline mr-1 text-amber-500" />
          Beide erhalten <span className="text-amber-400 font-semibold">250 XP</span> +
          <span className="text-purple-400 font-semibold"> 3 Tage Premium</span>
        </p>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes shimmer-border {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .golden-ticket {
          animation: ticket-appear 0.6s ease-out backwards;
        }

        @keyframes ticket-appear {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

// ═══════════════════════════════════════
// MILESTONE UNLOCK COMPONENT
// ═══════════════════════════════════════

interface MilestoneProps {
  milestone: typeof MILESTONES[0];
  currentCount: number;
  index: number;
}

const Milestone: React.FC<MilestoneProps> = ({ milestone, currentCount, index }) => {
  const isUnlocked = currentCount >= milestone.count;
  const progress = Math.min(100, (currentCount / milestone.count) * 100);

  return (
    <div
      className={`relative p-4 rounded-2xl transition-all duration-500 ${
        isUnlocked
          ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30'
          : 'bg-white/5 border border-gray-800'
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Unlock glow effect */}
      {isUnlocked && (
        <div
          className="absolute inset-0 rounded-2xl animate-pulse"
          style={{
            background: 'radial-gradient(circle at center, rgba(251, 191, 36, 0.1) 0%, transparent 70%)',
          }}
        />
      )}

      <div className="relative flex items-center gap-4">
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all duration-500 ${
            isUnlocked
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30 scale-110'
              : 'bg-gray-800'
          }`}
        >
          {isUnlocked ? milestone.icon : <Lock size={22} className="text-gray-600" />}
        </div>

        <div className="flex-1">
          <p className={`font-semibold ${isUnlocked ? 'text-amber-400' : 'text-gray-400'}`}>
            {milestone.label}
          </p>
          <p className={`text-xs ${isUnlocked ? 'text-amber-500/70' : 'text-gray-600'}`}>
            {isUnlocked ? '✓ Freigeschaltet!' : milestone.reward}
          </p>

          {/* Progress bar for locked milestones */}
          {!isUnlocked && currentCount > 0 && (
            <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #8b5cf6 0%, #a855f7 100%)',
                }}
              />
            </div>
          )}
        </div>

        <div className="text-right">
          {isUnlocked ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Check size={16} className="text-white" />
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              {currentCount}/{milestone.count}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════

interface MagicInviteSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

const MagicInviteSystem: React.FC<MagicInviteSystemProps> = ({ isOpen, onClose }) => {
  const { user } = useStore();
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [stats, setStats] = useState({
    totalLinks: 5,
    usedLinks: 0,
    availableLinks: 5,
    totalReferrals: 0,
    xpEarned: 0,
    premiumDaysEarned: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tickets' | 'rewards'>('tickets');

  useEffect(() => {
    if (user?.id && isOpen) {
      loadData();
    }
  }, [user?.id, isOpen]);

  const loadData = async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      const [referrals, referralStats] = await Promise.all([
        getUserReferrals(user.id),
        getReferralStats(user.id),
      ]);

      if (referrals) {
        setLinks(referrals.links || []);
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-[#0f0f1a] to-[#1a1a2e] rounded-t-[2rem] sm:rounded-[2rem] max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="relative px-6 pt-8 pb-6 text-center overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0">
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
            />
          </div>

          {/* Icon */}
          <div className="relative">
            <div
              className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                boxShadow: '0 0 50px rgba(251, 191, 36, 0.4)',
              }}
            >
              <Gift size={40} className="text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
              {stats.availableLinks}
            </div>
          </div>

          <h2 className="text-2xl font-display font-bold text-white mb-2">
            Deine Golden Tickets
          </h2>
          <p className="text-gray-400 text-sm">
            Exklusive Einladungen für ausgewählte Freunde
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-white">{stats.totalReferrals}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Eingeladen</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-amber-400">{stats.xpEarned}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">XP Verdient</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-purple-400">{stats.premiumDaysEarned}d</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Premium</p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 px-6 mb-4">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'tickets'
                ? 'bg-white/10 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Gift size={16} className="inline mr-2" />
            Tickets ({stats.availableLinks})
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'rewards'
                ? 'bg-white/10 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Trophy size={16} className="inline mr-2" />
            Rewards
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-8 overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeTab === 'tickets' ? (
            <div className="space-y-4">
              {availableLinks.map((link, index) => (
                <GoldenTicket
                  key={link.id || link.code}
                  code={link.code}
                  index={index}
                  isUsed={false}
                  onCopy={() => {}}
                  onShare={() => {}}
                />
              ))}
              {usedLinks.map((link, index) => (
                <GoldenTicket
                  key={link.id || link.code}
                  code={link.code}
                  index={availableLinks.length + index}
                  isUsed={true}
                  usedBy={link.usedBy || undefined}
                  onCopy={() => {}}
                  onShare={() => {}}
                />
              ))}
              {links.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Gift size={48} className="mx-auto mb-4 opacity-30" />
                  <p>Keine Einladungscodes verfügbar</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {MILESTONES.map((milestone, index) => (
                <Milestone
                  key={milestone.count}
                  milestone={milestone}
                  currentCount={stats.totalReferrals}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom tip */}
        <div className="px-6 pb-6">
          <div
            className="p-4 rounded-xl text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
            }}
          >
            <p className="text-sm text-gray-300">
              <Crown size={14} className="inline mr-1 text-amber-400" />
              Lade <span className="text-amber-400 font-bold">5 Freunde</span> ein und werde{' '}
              <span className="text-purple-400 font-bold">Inner Circle</span> Member!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagicInviteSystem;
