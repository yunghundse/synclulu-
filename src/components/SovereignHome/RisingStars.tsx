/**
 * RisingStars.tsx
 * Horizontal carousel showing creators with the highest aura score increase
 * "Die Stars der Stunde" - Trending Creators Module
 */

import React, { memo, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Star, Crown, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { audioFeedback } from '../../lib/audioFeedback';

export interface RisingStar {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  auraScore: number;
  auraChange: number; // Percentage change in last 60 min
  rank: number;
  isVerified?: boolean;
  isCrown?: boolean; // Top creator of the hour
}

interface RisingStarsProps {
  stars: RisingStar[];
  isLoading?: boolean;
  onCreatorClick?: (creatorId: string) => void;
}

const getRankBadge = (rank: number) => {
  switch (rank) {
    case 1:
      return { icon: Crown, color: 'from-amber-400 to-yellow-500', text: '#1' };
    case 2:
      return { icon: Star, color: 'from-gray-300 to-gray-400', text: '#2' };
    case 3:
      return { icon: Star, color: 'from-amber-600 to-orange-700', text: '#3' };
    default:
      return { icon: Sparkles, color: 'from-violet-500 to-purple-600', text: `#${rank}` };
  }
};

const StarCard = memo(function StarCard({
  star,
  onClick,
}: {
  star: RisingStar;
  onClick: () => void;
}) {
  const rankConfig = getRankBadge(star.rank);
  const RankIcon = rankConfig.icon;

  const handleClick = () => {
    audioFeedback.click();
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.95 }}
      className="flex-shrink-0 relative group"
      style={{ width: '110px' }}
    >
      {/* Card Container */}
      <div
        className="relative rounded-2xl p-3 overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Top Crown Badge for #1 */}
        {star.rank === 1 && (
          <motion.div
            className="absolute -top-1 left-1/2 -translate-x-1/2 z-10"
            animate={{
              y: [0, -2, 0],
              rotate: [-5, 5, -5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Crown size={16} className="text-amber-400 fill-amber-400" />
          </motion.div>
        )}

        {/* Avatar with Aura Ring */}
        <div className="relative mx-auto mb-2">
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-r ${rankConfig.color} blur-md opacity-50`}
            style={{ transform: 'scale(1.1)' }}
          />
          <div
            className={`relative w-14 h-14 rounded-full bg-gradient-to-r ${rankConfig.color} p-0.5`}
          >
            <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
              {star.avatarUrl ? (
                <img
                  src={star.avatarUrl}
                  alt={star.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-white/60">
                  {star.displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Rank Badge */}
          <div
            className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r ${rankConfig.color} flex items-center justify-center`}
            style={{
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <span className="text-[10px] font-bold text-white">{rankConfig.text}</span>
          </div>
        </div>

        {/* Username */}
        <p className="text-xs text-white/90 font-medium text-center truncate mb-1">
          {star.displayName}
        </p>

        {/* Aura Change Indicator */}
        <div className="flex items-center justify-center gap-1">
          <TrendingUp size={10} className="text-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-400">
            +{star.auraChange}%
          </span>
        </div>

        {/* Aura Score */}
        <p className="text-[9px] text-white/40 text-center mt-0.5">
          {star.auraScore.toLocaleString()} Aura
        </p>

        {/* Hover Glow Effect */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-r ${rankConfig.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`}
        />
      </div>
    </motion.button>
  );
});

const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden px-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex-shrink-0 w-[110px] rounded-2xl p-3"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
          }}
        >
          <div className="w-14 h-14 rounded-full bg-white/5 animate-pulse mx-auto mb-2" />
          <div className="w-16 h-3 rounded bg-white/5 animate-pulse mx-auto mb-1" />
          <div className="w-12 h-2 rounded bg-white/5 animate-pulse mx-auto" />
        </div>
      ))}
    </div>
  );
});

export const RisingStars = memo(function RisingStars({
  stars,
  isLoading = false,
  onCreatorClick,
}: RisingStarsProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCreatorClick = (creatorId: string) => {
    if (onCreatorClick) {
      onCreatorClick(creatorId);
    } else {
      navigate(`/user/${creatorId}`);
    }
  };

  return (
    <div className="relative">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Rising Stars</h3>
            <p className="text-[10px] text-white/40">Letzte 60 Minuten</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="text-xs text-violet-400 font-medium"
        >
          Alle anzeigen
        </motion.button>
      </div>

      {/* Carousel */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : stars.length === 0 ? (
        <div className="px-4">
          <div
            className="rounded-2xl p-6 text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <Sparkles size={24} className="text-white/20 mx-auto mb-2" />
            <p className="text-xs text-white/40">
              Noch keine Rising Stars in dieser Stunde
            </p>
          </div>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {stars.map((star) => (
            <div key={star.id} style={{ scrollSnapAlign: 'start' }}>
              <StarCard star={star} onClick={() => handleCreatorClick(star.id)} />
            </div>
          ))}
        </div>
      )}

      {/* Gradient Fade Edges */}
      <div
        className="absolute top-12 left-0 w-8 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, #050505, transparent)',
        }}
      />
      <div
        className="absolute top-12 right-0 w-8 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to left, #050505, transparent)',
        }}
      />
    </div>
  );
});

export default RisingStars;
