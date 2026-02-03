/**
 * DREAM PASS MODAL
 * Full-Screen Battle Pass Interface mit Free & Premium Pfaden
 */

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import {
  X, Crown, Lock, Gift, Sparkles, Users, Clock, ChevronRight,
  ChevronLeft, Check, Star, Zap, Eye, Trophy
} from 'lucide-react';
import {
  DREAM_PASS_CONFIG,
  BETA_SEASON_REWARDS,
  getDreamPassProgress,
  initializeDreamPass,
  checkPremiumUnlock,
  claimReward,
  getSeasonCountdown,
  getRarityColor,
  getRarityGlow,
  UserDreamPassProgress,
  PassReward,
} from '@/lib/dreamPassSystem';
import { getReferralStats } from '@/lib/referralSystem';

interface DreamPassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DreamPassModal = ({ isOpen, onClose }: DreamPassModalProps) => {
  const { user } = useStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [progress, setProgress] = useState<UserDreamPassProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rewards' | 'sneak-peek'>('rewards');
  const [countdown, setCountdown] = useState(getSeasonCountdown());
  const [referralCount, setReferralCount] = useState(0);
  const [claimingReward, setClaimingReward] = useState<string | null>(null);
  const [selectedReward, setSelectedReward] = useState<PassReward | null>(null);

  // Load progress
  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const loadProgress = async () => {
      setIsLoading(true);
      let userProgress = await getDreamPassProgress(user.id);

      if (!userProgress) {
        userProgress = await initializeDreamPass(user.id);
      }

      // Check premium unlock
      await checkPremiumUnlock(user.id);
      userProgress = await getDreamPassProgress(user.id);

      setProgress(userProgress);

      // Get referral count
      const referralStats = await getReferralStats(user.id);
      setReferralCount(referralStats.totalReferrals);

      setIsLoading(false);
    };

    loadProgress();
  }, [isOpen, user?.id]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown(getSeasonCountdown());
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Handle reward claim
  const handleClaimReward = async (rewardId: string) => {
    if (!user?.id || claimingReward) return;

    setClaimingReward(rewardId);
    const result = await claimReward(user.id, rewardId);

    if (result.success) {
      // Refresh progress
      const newProgress = await getDreamPassProgress(user.id);
      setProgress(newProgress);
    }

    setClaimingReward(null);
  };

  // Scroll to current level
  const scrollToCurrentLevel = () => {
    if (!scrollContainerRef.current || !progress) return;

    const levelIndex = progress.currentLevel - 1;
    const itemWidth = 280; // Approximate width of reward item
    scrollContainerRef.current.scrollTo({
      left: Math.max(0, levelIndex * itemWidth - 100),
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    if (progress && scrollContainerRef.current) {
      setTimeout(scrollToCurrentLevel, 100);
    }
  }, [progress]);

  if (!isOpen) return null;

  // Get unique levels with rewards
  const rewardLevels = [...new Set(BETA_SEASON_REWARDS.map(r => r.level))].sort((a, b) => a - b);

  // Calculate XP progress
  const xpProgress = progress
    ? ((progress.currentXP / DREAM_PASS_CONFIG.xpPerLevel) * 100)
    : 0;

  const invitesNeeded = DREAM_PASS_CONFIG.premiumUnlockInvites - referralCount;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, #A78BFA40 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, #818CF840 0%, transparent 40%)',
          }}
        />
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 safe-top">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"
          >
            <X size={20} className="text-white" />
          </button>

          <div className="text-center">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Crown size={20} className="text-purple-400" />
              Dream Pass
            </h1>
            <p className="text-xs text-white/60">Beta Season 1</p>
          </div>

          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Countdown Timer */}
        {!countdown.hasStarted && (
          <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/30">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-purple-400" />
              <div className="flex-1">
                <p className="text-sm text-white/80">Season startet in</p>
                <div className="flex gap-3 mt-1">
                  {[
                    { value: countdown.days, label: 'Tage' },
                    { value: countdown.hours, label: 'Std' },
                    { value: countdown.minutes, label: 'Min' },
                    { value: countdown.seconds, label: 'Sek' },
                  ].map(({ value, label }) => (
                    <div key={label} className="text-center">
                      <span className="text-lg font-bold text-white">{value}</span>
                      <span className="text-xs text-white/60 ml-1">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Level & XP Progress */}
        {!isLoading && progress && (
          <div className="mx-4 mb-4 p-4 bg-white/5 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-lg font-bold text-white">{progress.currentLevel}</span>
                </div>
                <div>
                  <p className="text-white font-semibold">Level {progress.currentLevel}</p>
                  <p className="text-xs text-white/60">
                    {progress.currentXP.toLocaleString()} / {DREAM_PASS_CONFIG.xpPerLevel.toLocaleString()} XP
                  </p>
                </div>
              </div>

              {/* Premium Badge */}
              {progress.isPremium ? (
                <div className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center gap-2">
                  <Crown size={14} className="text-white" />
                  <span className="text-sm font-bold text-white">PREMIUM</span>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('rewards')}
                  className="px-3 py-1.5 bg-white/10 rounded-full flex items-center gap-2 hover:bg-white/20 transition-colors"
                >
                  <Lock size={14} className="text-white/60" />
                  <span className="text-sm text-white/80">Premium</span>
                </button>
              )}
            </div>

            {/* XP Bar */}
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Premium Unlock CTA (if not premium) */}
        {!isLoading && progress && !progress.isPremium && (
          <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl border border-amber-500/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Users size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Premium freischalten</p>
                <p className="text-sm text-white/70">
                  {invitesNeeded > 0
                    ? `Lade ${invitesNeeded} Freund${invitesNeeded > 1 ? 'e' : ''} ein!`
                    : 'Du hast es geschafft!'}
                </p>
                <div className="flex gap-1 mt-2">
                  {[...Array(DREAM_PASS_CONFIG.premiumUnlockInvites)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-8 h-2 rounded-full ${
                        i < referralCount
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                          : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Switch */}
        <div className="flex mx-4 mb-4 bg-white/5 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'rewards'
                ? 'bg-purple-500 text-white'
                : 'text-white/60'
            }`}
          >
            <Gift size={16} className="inline mr-2" />
            Belohnungen
          </button>
          <button
            onClick={() => setActiveTab('sneak-peek')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'sneak-peek'
                ? 'bg-purple-500 text-white'
                : 'text-white/60'
            }`}
          >
            <Eye size={16} className="inline mr-2" />
            Sneak Peek
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : activeTab === 'rewards' ? (
          /* Rewards Path */
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto overflow-y-hidden pb-32 hide-scrollbar"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            <div className="flex gap-4 px-4 min-w-max">
              {rewardLevels.map((level) => {
                const levelRewards = BETA_SEASON_REWARDS.filter(r => r.level === level);
                const freeReward = levelRewards.find(r => !r.isPremium);
                const premiumReward = levelRewards.find(r => r.isPremium);
                const isUnlocked = progress && progress.currentLevel >= level;
                const isCurrent = progress && progress.currentLevel === level;

                return (
                  <div
                    key={level}
                    className="flex flex-col items-center gap-4"
                    style={{ scrollSnapAlign: 'center' }}
                  >
                    {/* Premium Reward (Top) */}
                    <RewardCard
                      reward={premiumReward}
                      isUnlocked={isUnlocked && progress?.isPremium}
                      isClaimed={progress?.claimedRewards.includes(premiumReward?.id || '')}
                      isPremiumLocked={!progress?.isPremium}
                      onClaim={() => premiumReward && handleClaimReward(premiumReward.id)}
                      onPreview={() => premiumReward && setSelectedReward(premiumReward)}
                      isClaiming={claimingReward === premiumReward?.id}
                    />

                    {/* Level Node */}
                    <div
                      className={`relative w-16 h-16 rounded-full flex items-center justify-center ${
                        isCurrent
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 ring-4 ring-purple-500/50'
                          : isUnlocked
                          ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                          : 'bg-white/10'
                      }`}
                    >
                      {isUnlocked && !isCurrent ? (
                        <Check size={24} className="text-white" />
                      ) : (
                        <span className={`text-xl font-bold ${isUnlocked ? 'text-white' : 'text-white/50'}`}>
                          {level}
                        </span>
                      )}

                      {/* Connection line */}
                      {level < DREAM_PASS_CONFIG.maxLevel && (
                        <div
                          className={`absolute left-full top-1/2 w-4 h-1 ${
                            isUnlocked ? 'bg-green-500' : 'bg-white/20'
                          }`}
                          style={{ transform: 'translateY(-50%)' }}
                        />
                      )}
                    </div>

                    {/* Free Reward (Bottom) */}
                    <RewardCard
                      reward={freeReward}
                      isUnlocked={isUnlocked}
                      isClaimed={progress?.claimedRewards.includes(freeReward?.id || '')}
                      isPremiumLocked={false}
                      onClaim={() => freeReward && handleClaimReward(freeReward.id)}
                      onPreview={() => freeReward && setSelectedReward(freeReward)}
                      isClaiming={claimingReward === freeReward?.id}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Sneak Peek */
          <div className="px-4 pb-32 overflow-y-auto">
            <div className="bg-white/5 rounded-2xl p-6 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={24} className="text-purple-400" />
                <h2 className="text-xl font-bold text-white">Coming Soon</h2>
              </div>
              <p className="text-white/70 mb-6">
                Diese exklusiven Belohnungen warten auf dich in der Beta Season 1!
              </p>

              {/* Featured Rewards Grid */}
              <div className="grid grid-cols-2 gap-4">
                {BETA_SEASON_REWARDS.filter(r => r.rarity === 'legendary' || r.rarity === 'mythic')
                  .slice(0, 6)
                  .map((reward) => (
                    <div
                      key={reward.id}
                      className="relative bg-white/5 rounded-xl p-4 border border-white/10 overflow-hidden"
                      onClick={() => setSelectedReward(reward)}
                    >
                      {/* Rarity glow */}
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          background: `radial-gradient(circle at 50% 50%, ${getRarityColor(reward.rarity)} 0%, transparent 70%)`,
                        }}
                      />

                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="text-xs font-bold uppercase px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${getRarityColor(reward.rarity)}30`,
                              color: getRarityColor(reward.rarity),
                            }}
                          >
                            {reward.rarity}
                          </span>
                          <span className="text-xs text-white/50">Lv.{reward.level}</span>
                        </div>

                        <div
                          className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${getRarityColor(reward.rarity)}40 0%, ${getRarityColor(reward.rarity)}20 100%)`,
                          }}
                        >
                          {reward.isPremium ? (
                            <Crown size={24} style={{ color: getRarityColor(reward.rarity) }} />
                          ) : (
                            <Gift size={24} style={{ color: getRarityColor(reward.rarity) }} />
                          )}
                        </div>

                        <h3 className="text-sm font-semibold text-white truncate">
                          {reward.nameDE}
                        </h3>
                        <p className="text-xs text-white/50 truncate">
                          {reward.descriptionDE}
                        </p>

                        {reward.isPremium && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
                            <Crown size={12} />
                            <span>Premium</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Stats Preview */}
            <div className="bg-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Trophy size={20} className="text-amber-400" />
                Season Statistik
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-white">{BETA_SEASON_REWARDS.length}</p>
                  <p className="text-sm text-white/60">Belohnungen</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-white">{DREAM_PASS_CONFIG.maxLevel}</p>
                  <p className="text-sm text-white/60">Level</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-white">
                    {BETA_SEASON_REWARDS.filter(r => r.isPremium).length}
                  </p>
                  <p className="text-sm text-white/60">Premium Items</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-white">
                    {BETA_SEASON_REWARDS.filter(r => r.rarity === 'mythic').length}
                  </p>
                  <p className="text-sm text-white/60">Mythisch</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reward Preview Modal */}
      {selectedReward && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setSelectedReward(null)}
        >
          <div
            className="bg-gray-900 rounded-3xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: getRarityGlow(selectedReward.rarity) }}
          >
            <div className="text-center">
              {/* Rarity Badge */}
              <span
                className="text-sm font-bold uppercase px-3 py-1 rounded-full"
                style={{
                  backgroundColor: `${getRarityColor(selectedReward.rarity)}30`,
                  color: getRarityColor(selectedReward.rarity),
                }}
              >
                {selectedReward.rarity}
              </span>

              {/* Icon */}
              <div
                className="w-24 h-24 rounded-2xl mx-auto mt-4 mb-4 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${getRarityColor(selectedReward.rarity)}40 0%, ${getRarityColor(selectedReward.rarity)}20 100%)`,
                  boxShadow: getRarityGlow(selectedReward.rarity),
                }}
              >
                {selectedReward.isPremium ? (
                  <Crown size={48} style={{ color: getRarityColor(selectedReward.rarity) }} />
                ) : (
                  <Gift size={48} style={{ color: getRarityColor(selectedReward.rarity) }} />
                )}
              </div>

              {/* Info */}
              <h2 className="text-2xl font-bold text-white mb-2">{selectedReward.nameDE}</h2>
              <p className="text-white/70 mb-4">{selectedReward.descriptionDE}</p>

              {/* Details */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{selectedReward.level}</p>
                  <p className="text-xs text-white/50">Level</p>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div className="text-center">
                  <p className="text-sm font-medium text-white/80 capitalize">{selectedReward.type.replace('_', ' ')}</p>
                  <p className="text-xs text-white/50">Typ</p>
                </div>
                {selectedReward.isPremium && (
                  <>
                    <div className="w-px h-8 bg-white/20" />
                    <div className="text-center">
                      <Crown size={20} className="text-amber-400 mx-auto" />
                      <p className="text-xs text-white/50">Premium</p>
                    </div>
                  </>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedReward(null)}
                className="w-full py-3 bg-white/10 rounded-xl text-white font-medium hover:bg-white/20 transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

// ═══════════════════════════════════════
// REWARD CARD COMPONENT
// ═══════════════════════════════════════

interface RewardCardProps {
  reward?: PassReward;
  isUnlocked?: boolean;
  isClaimed?: boolean;
  isPremiumLocked?: boolean;
  onClaim: () => void;
  onPreview: () => void;
  isClaiming?: boolean;
}

const RewardCard = ({
  reward,
  isUnlocked = false,
  isClaimed = false,
  isPremiumLocked = false,
  onClaim,
  onPreview,
  isClaiming = false,
}: RewardCardProps) => {
  if (!reward) {
    return (
      <div className="w-32 h-40 bg-white/5 rounded-2xl flex items-center justify-center">
        <span className="text-white/20 text-sm">—</span>
      </div>
    );
  }

  const rarityColor = getRarityColor(reward.rarity);
  const canClaim = isUnlocked && !isClaimed && !isPremiumLocked;

  return (
    <div
      className={`relative w-32 rounded-2xl overflow-hidden transition-all duration-300 ${
        canClaim ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-black' : ''
      }`}
      style={{
        background: isUnlocked
          ? `linear-gradient(180deg, ${rarityColor}20 0%, transparent 100%)`
          : 'rgba(255,255,255,0.05)',
        boxShadow: isUnlocked ? getRarityGlow(reward.rarity) : 'none',
      }}
      onClick={onPreview}
    >
      {/* Lock overlay for premium */}
      {isPremiumLocked && (
        <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
          <Lock size={24} className="text-amber-400" />
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        {/* Premium badge */}
        {reward.isPremium && (
          <div className="absolute top-2 right-2 z-20">
            <Crown size={14} className="text-amber-400" />
          </div>
        )}

        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${rarityColor}40 0%, ${rarityColor}20 100%)`,
          }}
        >
          {reward.type === 'coins' ? (
            <span className="text-xl">💎</span>
          ) : reward.type === 'xp_boost' ? (
            <Zap size={24} style={{ color: rarityColor }} />
          ) : (
            <Gift size={24} style={{ color: rarityColor }} />
          )}
        </div>

        {/* Name */}
        <p className="text-xs font-medium text-white text-center truncate mb-1">
          {reward.nameDE}
        </p>

        {/* Value (if coins) */}
        {reward.value && (
          <p className="text-xs text-center" style={{ color: rarityColor }}>
            {reward.type === 'coins' ? `${reward.value} 💎` : `x${reward.value}`}
          </p>
        )}

        {/* Rarity */}
        <p
          className="text-[10px] text-center uppercase font-bold mt-1"
          style={{ color: rarityColor }}
        >
          {reward.rarity}
        </p>
      </div>

      {/* Claim Button */}
      {canClaim && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClaim();
          }}
          disabled={isClaiming}
          className="w-full py-2 bg-green-500 text-white text-xs font-bold flex items-center justify-center gap-1"
        >
          {isClaiming ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Gift size={14} />
              Abholen
            </>
          )}
        </button>
      )}

      {/* Claimed indicator */}
      {isClaimed && (
        <div className="w-full py-2 bg-white/10 text-white/50 text-xs text-center">
          <Check size={14} className="inline mr-1" />
          Abgeholt
        </div>
      )}
    </div>
  );
};

export default DreamPassModal;
