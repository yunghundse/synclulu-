/**
 * DELULU CREATOR DASHBOARD
 * Statistics and monetization panel for creators
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import GlowUpAvatar from '@/components/GlowUpAvatar';
import LockedContentCard from '@/components/LockedContentCard';
import {
  ArrowLeft, TrendingUp, Users, Eye, Coins, Gift,
  Crown, ChevronRight, Plus, Share2, Sparkles,
  Lock, BarChart2, Star, Zap
} from 'lucide-react';
import {
  CREATOR_TIERS,
  CreatorProfile,
  CreatorTier,
  getCreatorProfile,
  getTierProgress,
} from '@/lib/creatorSystem';
import { LockedContent, getUserWallet, CURRENCY_CONFIG } from '@/lib/lockSystem';
import { getReferralStats } from '@/lib/referralSystem';

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useStore();

  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [lockedContents, setLockedContents] = useState<LockedContent[]>([]);
  const [coinBalance, setCoinBalance] = useState(0);
  const [referralStats, setReferralStats] = useState({ totalReferrals: 0, xpEarned: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Load creator profile
      const profile = await getCreatorProfile(user.id);
      setCreatorProfile(profile);

      // Load wallet
      const wallet = await getUserWallet(user.id);
      setCoinBalance(wallet?.balance || 0);

      // Load referral stats
      const refStats = await getReferralStats(user.id);
      setReferralStats(refStats);

      // Load locked content
      const contentRef = collection(db, 'lockedContent');
      const q = query(
        contentRef,
        where('creatorId', '==', user.id),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      setLockedContents(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as LockedContent[]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
    setIsLoading(false);
  };

  const tier = creatorProfile?.tier || 'user';
  const tierConfig = CREATOR_TIERS[tier];
  const userLevel = (user as any)?.level || 1;

  const progress = getTierProgress(
    tier,
    creatorProfile?.followerCount || 0,
    creatorProfile?.successfulInvites || 0,
    userLevel
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/50 to-transparent">
        <div className="px-4 py-6 safe-top">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Creator Dashboard</h1>
              <p className="text-sm text-white/60">Deine Statistiken & Verdienste</p>
            </div>
          </div>

          {/* Creator Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-4 mb-6">
              <GlowUpAvatar
                avatarUrl={(user as any)?.avatarUrl}
                level={userLevel}
                creatorTier={tier}
                isVerified={creatorProfile?.isVerified}
                size="xl"
                showParticles
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold">{user?.displayName}</h2>
                  {creatorProfile?.isVerified && (
                    <span className="text-purple-400">☁️</span>
                  )}
                </div>
                <p className="text-white/60 mb-2">@{user?.username}</p>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: `${tierConfig.color}20`, color: tierConfig.color }}
                >
                  <span>{tierConfig.emoji}</span>
                  <span>{tierConfig.nameDE}</span>
                </div>
              </div>
            </div>

            {/* Tier Progress */}
            {progress.nextTier && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Nächstes Level</span>
                  <span style={{ color: CREATOR_TIERS[progress.nextTier].color }}>
                    {CREATOR_TIERS[progress.nextTier].emoji} {CREATOR_TIERS[progress.nextTier].nameDE}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                      <span>Follower</span>
                      <span>{Math.round(progress.followersProgress)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${progress.followersProgress}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                      <span>Invites</span>
                      <span>{Math.round(progress.invitesProgress)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${progress.invitesProgress}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                      <span>Level</span>
                      <span>{Math.round(progress.levelProgress)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all"
                        style={{ width: `${progress.levelProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-4 border border-blue-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Users size={20} className="text-blue-400" />
              <span className="text-white/60 text-sm">Follower</span>
            </div>
            <p className="text-3xl font-bold">{creatorProfile?.followerCount || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-4 border border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Eye size={20} className="text-purple-400" />
              <span className="text-white/60 text-sm">Cloud Reach</span>
            </div>
            <p className="text-3xl font-bold">{creatorProfile?.cloudReach || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-4 border border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Gift size={20} className="text-green-400" />
              <span className="text-white/60 text-sm">Referrals</span>
            </div>
            <p className="text-3xl font-bold">{referralStats.totalReferrals}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl p-4 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={20} className="text-amber-400" />
              <span className="text-white/60 text-sm">Unlocks</span>
            </div>
            <p className="text-3xl font-bold">{creatorProfile?.totalUnlocks || 0}</p>
          </div>
        </div>

        {/* Wallet */}
        <div className="bg-gradient-to-r from-amber-600/20 to-yellow-600/20 rounded-2xl p-6 border border-amber-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/30 flex items-center justify-center">
                <Coins size={24} className="text-amber-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Dein Guthaben</p>
                <p className="text-2xl font-bold text-amber-400">💎 {coinBalance}</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-amber-500 text-white font-semibold rounded-xl">
              Auszahlen
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/50 text-xs mb-1">Gesamt verdient</p>
              <p className="font-bold text-white">💎 {creatorProfile?.totalRevenue || 0}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/50 text-xs mb-1">Anteil ({tierConfig.revenueShare}%)</p>
              <p className="font-bold text-green-400">+{tierConfig.revenueShare}%</p>
            </div>
          </div>
        </div>

        {/* Secret Bubbles */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Lock size={20} className="text-purple-400" />
              Deine Secret Bubbles
            </h2>
            <button
              onClick={() => navigate('/creator/new-content')}
              className="flex items-center gap-1 text-purple-400 text-sm"
            >
              <Plus size={16} />
              Erstellen
            </button>
          </div>

          {lockedContents.length === 0 ? (
            <div className="bg-white/5 rounded-2xl p-8 text-center">
              <Lock size={48} className="mx-auto text-white/20 mb-4" />
              <h3 className="font-semibold mb-2">Noch keine Secret Bubbles</h3>
              <p className="text-white/50 text-sm mb-4">
                Erstelle exklusive Inhalte und verdiene an Unlocks!
              </p>
              <button
                onClick={() => navigate('/creator/new-content')}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold"
              >
                Ersten Content erstellen
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {lockedContents.map((content) => (
                <div key={content.id} className="bg-white/5 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{content.title}</h3>
                    <span className="text-sm text-white/50">
                      {content.totalUnlocks} Unlocks
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <span className="flex items-center gap-1">
                      <Coins size={14} /> {content.unlockCost} Coins
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={14} /> {content.totalUnlocks} Views
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp size={14} /> {content.totalRevenue} verdient
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feature Unlocks */}
        <div className="bg-white/5 rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-amber-400" />
            Deine Creator-Features
          </h2>

          <div className="space-y-3">
            {tierConfig.features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
              >
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Zap size={16} className="text-green-400" />
                </div>
                <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>

          {progress.nextTier && (
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/30">
              <p className="text-sm text-purple-300 mb-2">
                Nächste Stufe schaltet frei:
              </p>
              <div className="flex flex-wrap gap-2">
                {CREATOR_TIERS[progress.nextTier].features
                  .filter(f => !tierConfig.features.includes(f))
                  .map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full capitalize"
                    >
                      {feature.replace(/_/g, ' ')}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;
