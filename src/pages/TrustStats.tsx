/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TRUST STATS PAGE - /profile/trust-stats
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Features:
 * - Safety Score from Aegis System
 * - Interaction Ranking
 * - Trust Radar Polygon Visualization
 * - Shareable Trust Badge
 *
 * @author Lead Architect @ Apple
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ChevronLeft, Share2, Award, Users,
  MessageCircle, Clock, Heart, Star, Zap,
  TrendingUp, AlertTriangle, CheckCircle, Lock,
  Eye, Mic, Calendar
} from 'lucide-react';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getScoreHistory, type ScoreChange } from '@/lib/aegisSafetyScore';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface TrustMetrics {
  safetyScore: number;
  interactionScore: number;
  reliabilityScore: number;
  communityScore: number;
  verificationLevel: number;
  accountAge: number; // days
}

interface InteractionRank {
  totalInteractions: number;
  rank: 'newcomer' | 'active' | 'regular' | 'veteran' | 'legend';
  percentile: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRUST RADAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const TrustRadar = ({ metrics }: { metrics: TrustMetrics }) => {
  const categories = [
    { label: 'Safety', value: metrics.safetyScore, color: '#22C55E' },
    { label: 'Interaktion', value: metrics.interactionScore, color: '#A855F7' },
    { label: 'Zuverlässig', value: metrics.reliabilityScore, color: '#3B82F6' },
    { label: 'Community', value: metrics.communityScore, color: '#EC4899' },
    { label: 'Verifiziert', value: metrics.verificationLevel, color: '#F59E0B' },
  ];

  const centerX = 150;
  const centerY = 150;
  const maxRadius = 100;
  const levels = 5;

  // Calculate polygon points
  const angleStep = (2 * Math.PI) / categories.length;
  const points = categories.map((cat, i) => {
    const angle = i * angleStep - Math.PI / 2; // Start from top
    const radius = (cat.value / 100) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  const polygonPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className="relative">
      <svg width="300" height="300" viewBox="0 0 300 300" className="mx-auto">
        {/* Background circles */}
        {[...Array(levels)].map((_, i) => (
          <circle
            key={i}
            cx={centerX}
            cy={centerY}
            r={(maxRadius / levels) * (i + 1)}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {categories.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const endX = centerX + maxRadius * Math.cos(angle);
          const endY = centerY + maxRadius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={endX}
              y2={endY}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon */}
        <motion.path
          d={polygonPath}
          fill="url(#trustGradient)"
          stroke="#A855F7"
          strokeWidth="2"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.8, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="trustGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Data points */}
        {points.map((point, i) => (
          <motion.circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="6"
            fill={categories[i].color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 * i, duration: 0.3 }}
          />
        ))}

        {/* Labels */}
        {categories.map((cat, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelRadius = maxRadius + 30;
          const x = centerX + labelRadius * Math.cos(angle);
          const y = centerY + labelRadius * Math.sin(angle);
          return (
            <g key={i}>
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs fill-white/70 font-medium"
              >
                {cat.label}
              </text>
              <text
                x={x}
                y={y + 14}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs fill-white/50"
              >
                {cat.value}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRUST BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const TrustBadge = ({ score, rank }: { score: number; rank: InteractionRank['rank'] }) => {
  const getBadgeConfig = () => {
    if (score >= 95) return { color: 'from-emerald-400 to-green-500', label: 'Vertrauenswürdig', icon: '🛡️' };
    if (score >= 80) return { color: 'from-purple-400 to-violet-500', label: 'Zuverlässig', icon: '✨' };
    if (score >= 60) return { color: 'from-blue-400 to-cyan-500', label: 'Aktiv', icon: '💫' };
    return { color: 'from-gray-400 to-gray-500', label: 'Neu', icon: '🌱' };
  };

  const config = getBadgeConfig();

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r ${config.color} shadow-lg`}
    >
      <span className="text-xl">{config.icon}</span>
      <div>
        <p className="text-white font-bold text-sm">{config.label}</p>
        <p className="text-white/80 text-xs">Trust Score: {score}</p>
      </div>
      <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
        <CheckCircle size={12} className="text-green-500" />
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const TrustStats = () => {
  const navigate = useNavigate();
  const { user } = useStore();

  const [metrics, setMetrics] = useState<TrustMetrics | null>(null);
  const [interactionRank, setInteractionRank] = useState<InteractionRank | null>(null);
  const [scoreHistory, setScoreHistory] = useState<ScoreChange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadTrustData();
    }
  }, [user?.id]);

  const loadTrustData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Fetch safety profile
      const safetyProfileRef = doc(db, 'user_safety_profiles', user.id);
      const safetyProfileSnap = await getDoc(safetyProfileRef);

      // Fetch user stats
      const userRef = doc(db, 'users', user.id);
      const userSnap = await getDoc(userRef);

      const safetyData = safetyProfileSnap.data() || {};
      const userData = userSnap.data() || {};

      // Calculate metrics
      const safetyScore = safetyData.safetyScore || 100;
      const interactionCount = userData.totalInteractions || 0;
      const roomsJoined = userData.roomsJoined || 0;
      const friendsCount = userData.friendsCount || 0;
      const accountCreatedAt = userData.createdAt?.toDate() || new Date();
      const accountAge = Math.floor((Date.now() - accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24));

      setMetrics({
        safetyScore,
        interactionScore: Math.min(100, Math.floor(interactionCount / 10)),
        reliabilityScore: Math.min(100, Math.floor(roomsJoined * 2)),
        communityScore: Math.min(100, Math.floor(friendsCount * 5)),
        verificationLevel: userData.isVerified ? 100 : userData.emailVerified ? 50 : 0,
        accountAge,
      });

      // Calculate rank
      const percentile = Math.min(99, Math.floor(interactionCount / 5));
      let rank: InteractionRank['rank'] = 'newcomer';
      if (interactionCount >= 1000) rank = 'legend';
      else if (interactionCount >= 500) rank = 'veteran';
      else if (interactionCount >= 100) rank = 'regular';
      else if (interactionCount >= 20) rank = 'active';

      setInteractionRank({
        totalInteractions: interactionCount,
        rank,
        percentile,
      });

      // Fetch score history
      const history = await getScoreHistory(user.id, 10);
      setScoreHistory(history);
    } catch (error) {
      console.error('Error loading trust data:', error);
    }
    setIsLoading(false);
  };

  const handleShare = async () => {
    if (!metrics) return;

    const shareText = `🛡️ Mein Trust Score bei Delulu: ${metrics.safetyScore}/100\n✨ Rank: ${interactionRank?.rank || 'Newcomer'}\n\nJoin me: https://delulu.app`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mein Delulu Trust Badge',
          text: shareText,
        });
      } catch (e) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(shareText);
      setShowShareModal(true);
      setTimeout(() => setShowShareModal(false), 2000);
    }
  };

  const getRankLabel = (rank: InteractionRank['rank']) => {
    switch (rank) {
      case 'legend': return { label: 'Legende', icon: '👑', color: 'text-amber-400' };
      case 'veteran': return { label: 'Veteran', icon: '🏆', color: 'text-purple-400' };
      case 'regular': return { label: 'Stammgast', icon: '⭐', color: 'text-blue-400' };
      case 'active': return { label: 'Aktiv', icon: '💫', color: 'text-green-400' };
      default: return { label: 'Newcomer', icon: '🌱', color: 'text-gray-400' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-base flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-base text-white safe-top pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-dark-base/90 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-display font-bold text-lg">Trust Stats</h1>
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Trust Badge */}
        {metrics && interactionRank && (
          <div className="text-center">
            <TrustBadge score={metrics.safetyScore} rank={interactionRank.rank} />
          </div>
        )}

        {/* Trust Radar */}
        {metrics && (
          <div className="bg-dark-card rounded-3xl p-6">
            <h2 className="font-semibold text-center mb-4 flex items-center justify-center gap-2">
              <Shield size={18} className="text-purple-400" />
              Trust Radar
            </h2>
            <TrustRadar metrics={metrics} />
          </div>
        )}

        {/* Interaction Ranking */}
        {interactionRank && (
          <div className="bg-dark-card rounded-3xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Award size={18} className="text-amber-400" />
              Interaktions-Ranking
            </h2>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getRankLabel(interactionRank.rank).icon}</span>
                <div>
                  <p className={`font-bold ${getRankLabel(interactionRank.rank).color}`}>
                    {getRankLabel(interactionRank.rank).label}
                  </p>
                  <p className="text-sm text-white/50">
                    Top {100 - interactionRank.percentile}% der Nutzer
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-400">
                  {interactionRank.totalInteractions}
                </p>
                <p className="text-xs text-white/50">Interaktionen</p>
              </div>
            </div>

            {/* Progress to next rank */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/50">
                <span>Fortschritt zum nächsten Rang</span>
                <span>{interactionRank.totalInteractions} / 100</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, interactionRank.totalInteractions)}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Score Details */}
        {metrics && (
          <div className="bg-dark-card rounded-3xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-400" />
              Score Details
            </h2>

            <div className="space-y-4">
              <ScoreRow
                icon={<Shield size={16} className="text-green-400" />}
                label="Safety Score"
                value={metrics.safetyScore}
                description="Basiert auf deinem Verhalten"
              />
              <ScoreRow
                icon={<MessageCircle size={16} className="text-purple-400" />}
                label="Interaktion"
                value={metrics.interactionScore}
                description="Aktive Teilnahme"
              />
              <ScoreRow
                icon={<Clock size={16} className="text-blue-400" />}
                label="Zuverlässigkeit"
                value={metrics.reliabilityScore}
                description="Raum-Besuche"
              />
              <ScoreRow
                icon={<Heart size={16} className="text-pink-400" />}
                label="Community"
                value={metrics.communityScore}
                description="Freundschaften"
              />
              <ScoreRow
                icon={<CheckCircle size={16} className="text-amber-400" />}
                label="Verifizierung"
                value={metrics.verificationLevel}
                description={metrics.verificationLevel === 100 ? 'Verifiziert' : 'Nicht verifiziert'}
              />
            </div>
          </div>
        )}

        {/* Score History */}
        {scoreHistory.length > 0 && (
          <div className="bg-dark-card rounded-3xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-blue-400" />
              Score-Verlauf
            </h2>

            <div className="space-y-3">
              {scoreHistory.map((change) => (
                <div
                  key={change.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    {change.change > 0 ? (
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <TrendingUp size={16} className="text-green-400" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle size={16} className="text-red-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{change.reason}</p>
                      <p className="text-xs text-white/50">
                        {change.createdAt.toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                  <div className={`font-bold ${change.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {change.change > 0 ? '+' : ''}{change.change}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Account Age */}
        {metrics && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl p-6 text-center">
            <Calendar size={24} className="mx-auto mb-2 text-purple-400" />
            <p className="text-2xl font-bold">
              {metrics.accountAge} Tage
            </p>
            <p className="text-sm text-white/60">bei Delulu</p>
          </div>
        )}
      </div>

      {/* Share Confirmation Toast */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 bg-green-500 text-white p-4 rounded-2xl text-center font-semibold"
          >
            ✅ In Zwischenablage kopiert!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const ScoreRow = ({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}) => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
      {icon}
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-center mb-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm font-bold">{value}%</p>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <p className="text-xs text-white/40 mt-1">{description}</p>
    </div>
  </div>
);

export default TrustStats;
