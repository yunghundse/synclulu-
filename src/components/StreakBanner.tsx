import { Flame, Zap, Gift } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getStreakMultiplier } from '@/lib/uiCopy';

interface StreakBannerProps {
  currentStreak: number;
  longestStreak?: number;
  onClaim?: () => void;
  canClaim?: boolean;
}

const StreakBanner = ({ currentStreak, longestStreak = 0, onClaim, canClaim = false }: StreakBannerProps) => {
  const { t } = useTranslation();
  const multiplier = getStreakMultiplier(currentStreak);

  // Milestone rewards
  const nextMilestone = [7, 14, 30, 60, 100].find(m => m > currentStreak) || 100;
  const progress = (currentStreak / nextMilestone) * 100;

  const getMilestoneReward = (days: number): string => {
    if (days >= 100) return '🏆 Legend Box';
    if (days >= 60) return '💎 Diamond Box';
    if (days >= 30) return '👑 Royal Box';
    if (days >= 14) return '🎁 Premium Box';
    if (days >= 7) return '📦 Bonus Box';
    return '⭐ XP Bonus';
  };

  return (
    <div className="relative overflow-hidden">
      {/* Main streak card */}
      <div className="glass-card p-4 border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center justify-between">
          {/* Left: Streak info */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
                <Flame size={28} className="text-white" />
              </div>
              {/* Animated fire glow */}
              <div className="absolute inset-0 rounded-2xl bg-orange-400/30 animate-pulse" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-black text-orange-600">
                  {currentStreak}
                </span>
                <span className="text-sm font-semibold text-orange-500">
                  {t('profile.stats.streak')}
                </span>
              </div>
              <p className="text-xs text-orange-600/70">
                Best: {longestStreak} Tage
              </p>
            </div>
          </div>

          {/* Right: Multiplier badge */}
          <div className="text-right">
            <div className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1.5 rounded-xl shadow-lg">
              <Zap size={14} className="fill-white" />
              <span className="font-bold text-sm">{multiplier}x XP</span>
            </div>
            {canClaim && (
              <button
                onClick={onClaim}
                className="mt-2 flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
              >
                <Gift size={12} />
                <span>Bonus abholen!</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress to next milestone */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-orange-600/70">Nächste Belohnung</span>
            <span className="font-semibold text-orange-600">
              {getMilestoneReward(nextMilestone)} @ Tag {nextMilestone}
            </span>
          </div>
          <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-orange-500/60 mt-1">
            <span>Tag {currentStreak}</span>
            <span>Tag {nextMilestone}</span>
          </div>
        </div>
      </div>

      {/* Decorative flames */}
      {currentStreak >= 7 && (
        <div className="absolute -top-2 -right-2 text-2xl animate-bounce">🔥</div>
      )}
      {currentStreak >= 30 && (
        <div className="absolute -top-2 -left-2 text-xl animate-bounce" style={{ animationDelay: '0.2s' }}>
          ✨
        </div>
      )}
    </div>
  );
};

export default StreakBanner;
