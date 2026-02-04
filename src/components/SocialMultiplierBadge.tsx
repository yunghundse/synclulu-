/**
 * synclulu DIGITAL OPERATING SYSTEM
 * Social Multiplier Badge - Shows XP boost status
 */

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Zap, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import {
  calculateSocialMultiplier,
  formatMultiplier,
  getMultiplierTier,
  MultiplierBreakdown,
} from '@/lib/socialMultiplier';

interface SocialMultiplierBadgeProps {
  compact?: boolean;
  showBreakdown?: boolean;
}

const SocialMultiplierBadge = ({ compact = false, showBreakdown = false }: SocialMultiplierBadgeProps) => {
  const { user } = useStore();
  const [multiplier, setMultiplier] = useState<MultiplierBreakdown | null>(null);
  const [isExpanded, setIsExpanded] = useState(showBreakdown);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMultiplier();
  }, [user?.id]);

  const loadMultiplier = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const result = await calculateSocialMultiplier(user.id);
      setMultiplier(result);
    } catch (error) {
      console.error('Error loading multiplier:', error);
    }
    setIsLoading(false);
  };

  if (isLoading || !multiplier) {
    return (
      <div className={`animate-pulse ${compact ? 'h-6 w-16' : 'h-10 w-24'} bg-white/10 rounded-lg`} />
    );
  }

  const tierInfo = getMultiplierTier(multiplier.total);

  if (compact) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold"
        style={{ backgroundColor: `${tierInfo.color}20`, color: tierInfo.color }}
      >
        <Zap size={14} />
        <span>{formatMultiplier(multiplier.total)}</span>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${tierInfo.color}20` }}
          >
            <span className="text-2xl">{tierInfo.emoji}</span>
          </div>
          <div className="text-left">
            <p className="text-sm text-white/60">XP Multiplier</p>
            <p
              className="text-xl font-bold"
              style={{ color: tierInfo.color }}
            >
              {formatMultiplier(multiplier.total)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-1 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: `${tierInfo.color}20`, color: tierInfo.color }}
          >
            {tierInfo.tier}
          </span>
          {isExpanded ? (
            <ChevronUp size={20} className="text-white/50" />
          ) : (
            <ChevronDown size={20} className="text-white/50" />
          )}
        </div>
      </button>

      {/* Breakdown */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="h-px bg-white/10" />

          {/* Active Bonuses */}
          {multiplier.activeBonuses.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {multiplier.activeBonuses.map((bonus, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium"
                >
                  {bonus}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/40 text-center py-2">
              Keine aktiven Boni - sammle Referrals und bleib aktiv!
            </p>
          )}

          {/* Breakdown Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-white/60">
              <span>Basis</span>
              <span>+{Math.round(multiplier.base * 100)}%</span>
            </div>
            {multiplier.referral > 0 && (
              <div className="flex justify-between text-pink-400">
                <span>Referrals</span>
                <span>+{Math.round(multiplier.referral * 100)}%</span>
              </div>
            )}
            {multiplier.streak > 0 && (
              <div className="flex justify-between text-orange-400">
                <span>Streak</span>
                <span>+{Math.round(multiplier.streak * 100)}%</span>
              </div>
            )}
            {multiplier.premium > 0 && (
              <div className="flex justify-between text-amber-400">
                <span>Premium</span>
                <span>+{Math.round(multiplier.premium * 100)}%</span>
              </div>
            )}
            {multiplier.voiceActivity > 0 && (
              <div className="flex justify-between text-blue-400">
                <span>Voice Activity</span>
                <span>+{Math.round(multiplier.voiceActivity * 100)}%</span>
              </div>
            )}
            {multiplier.friends > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Freunde</span>
                <span>+{Math.round(multiplier.friends * 100)}%</span>
              </div>
            )}
            {multiplier.events > 0 && (
              <div className="flex justify-between text-purple-400">
                <span>Events</span>
                <span>+{Math.round(multiplier.events * 100)}%</span>
              </div>
            )}
            {multiplier.timeBonus > 0 && (
              <div className="flex justify-between text-cyan-400">
                <span>Zeit-Bonus</span>
                <span>+{Math.round(multiplier.timeBonus * 100)}%</span>
              </div>
            )}
            <div className="h-px bg-white/10 my-2" />
            <div className="flex justify-between font-bold text-white">
              <span>Gesamt</span>
              <span style={{ color: tierInfo.color }}>{formatMultiplier(multiplier.total)}</span>
            </div>
          </div>

          {/* Tips */}
          <div className="p-3 bg-purple-500/10 rounded-xl">
            <p className="text-xs text-purple-300 flex items-start gap-2">
              <Sparkles size={14} className="flex-shrink-0 mt-0.5" />
              <span>
                Erhöhe deinen Multiplier durch Referrals, tägliche Streaks und Community-Engagement!
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialMultiplierBadge;
