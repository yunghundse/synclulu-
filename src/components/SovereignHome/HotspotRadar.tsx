/**
 * HotspotRadar.tsx
 * Vertical list of the most active clouds nearby with live activity indicators
 * Shows real-time pulse waves for active rooms
 */

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Users, MapPin, Zap, ChevronRight, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { audioFeedback } from '../../lib/audioFeedback';

export interface Hotspot {
  id: string;
  name: string;
  description?: string;
  distance: number; // in meters
  userCount: number;
  maxUsers?: number;
  activityLevel: 'ruhig' | 'aktiv' | 'sehr_aktiv' | 'hot';
  category?: string;
  creatorName?: string;
  creatorAvatar?: string;
  isNew?: boolean;
  isFriendInside?: boolean;
}

interface HotspotRadarProps {
  hotspots: Hotspot[];
  isLoading?: boolean;
  maxItems?: number;
  onHotspotClick?: (hotspotId: string) => void;
}

const activityConfig = {
  ruhig: {
    color: 'bg-gray-500',
    textColor: 'text-gray-400',
    pulseSpeed: 3,
    label: 'Ruhig',
  },
  aktiv: {
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
    pulseSpeed: 2,
    label: 'Aktiv',
  },
  sehr_aktiv: {
    color: 'bg-violet-500',
    textColor: 'text-violet-400',
    pulseSpeed: 1.5,
    label: 'Sehr Aktiv',
  },
  hot: {
    color: 'bg-amber-500',
    textColor: 'text-amber-400',
    pulseSpeed: 1,
    label: '🔥 Hot',
  },
};

const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

const HotspotItem = memo(function HotspotItem({
  hotspot,
  index,
  onClick,
}: {
  hotspot: Hotspot;
  index: number;
  onClick: () => void;
}) {
  const config = activityConfig[hotspot.activityLevel];

  const handleClick = () => {
    audioFeedback.tap();
    onClick();
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="w-full group"
    >
      <div
        className="relative flex items-center gap-3 p-3 rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Live Activity Indicator */}
        <div className="relative flex-shrink-0">
          {/* Pulse Waves */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[1, 2, 3].map((wave) => (
              <motion.div
                key={wave}
                className={`absolute w-10 h-10 rounded-full ${config.color} opacity-20`}
                animate={{
                  scale: [1, 1.5 + wave * 0.3],
                  opacity: [0.3, 0],
                }}
                transition={{
                  duration: config.pulseSpeed,
                  repeat: Infinity,
                  delay: wave * 0.3,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>

          {/* Center Icon */}
          <div
            className={`relative w-10 h-10 rounded-full ${config.color} flex items-center justify-center`}
            style={{
              boxShadow: `0 0 20px ${config.color === 'bg-amber-500' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(139, 92, 246, 0.3)'}`,
            }}
          >
            {hotspot.activityLevel === 'hot' ? (
              <Flame size={18} className="text-white" />
            ) : (
              <Radio size={18} className="text-white" />
            )}
          </div>

          {/* New Badge */}
          {hotspot.isNew && (
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <span className="text-[8px] font-bold text-white">N</span>
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-white truncate">
              {hotspot.name}
            </h4>
            {hotspot.isFriendInside && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                Freund drin
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1">
            {/* Distance */}
            <div className="flex items-center gap-1">
              <MapPin size={10} className="text-white/40" />
              <span className="text-xs text-white/40">
                {formatDistance(hotspot.distance)}
              </span>
            </div>

            {/* User Count */}
            <div className="flex items-center gap-1">
              <Users size={10} className="text-white/40" />
              <span className="text-xs text-white/40">
                {hotspot.userCount}
                {hotspot.maxUsers && `/${hotspot.maxUsers}`}
              </span>
            </div>

            {/* Activity Level */}
            <div className="flex items-center gap-1">
              <Zap size={10} className={config.textColor} />
              <span className={`text-xs font-medium ${config.textColor}`}>
                {config.label}
              </span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight
          size={18}
          className="text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0"
        />

        {/* Hover Overlay */}
        <motion.div
          className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300 rounded-2xl"
        />
      </div>
    </motion.button>
  );
});

const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="space-y-2 px-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-2xl"
          style={{ background: 'rgba(255, 255, 255, 0.03)' }}
        >
          <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
          <div className="flex-1">
            <div className="w-24 h-3 rounded bg-white/5 animate-pulse mb-2" />
            <div className="w-32 h-2 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
});

export const HotspotRadar = memo(function HotspotRadar({
  hotspots,
  isLoading = false,
  maxItems = 5,
  onHotspotClick,
}: HotspotRadarProps) {
  const navigate = useNavigate();

  const handleHotspotClick = (hotspotId: string) => {
    if (onHotspotClick) {
      onHotspotClick(hotspotId);
    } else {
      navigate(`/room/${hotspotId}`);
    }
  };

  const displayHotspots = hotspots.slice(0, maxItems);

  return (
    <div className="relative">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
              <Radio size={16} className="text-white" />
            </div>
            {/* Live indicator */}
            <motion.div
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Hotspot-Radar</h3>
            <p className="text-[10px] text-white/40">Live in deiner Nähe</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="text-xs text-emerald-400 font-medium"
          onClick={() => navigate('/discover')}
        >
          Karte öffnen
        </motion.button>
      </div>

      {/* Hotspot List */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : displayHotspots.length === 0 ? (
        <div className="px-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 5, 5, 0.9) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
            }}
          >
            {/* Animated Pulse */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <div className="relative">
              <motion.div
                className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-3"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Radio size={24} className="text-emerald-400" />
              </motion.div>

              <h4 className="text-sm font-bold text-white mb-1">Niemand in Reichweite</h4>
              <p className="text-xs text-white/40">
                Gerade sind keine Wölkchen aktiv in deiner Nähe.
              </p>
              <p className="text-[10px] text-emerald-400/60 mt-2">
                Probier es später nochmal oder erweitere deinen Radius
              </p>
            </div>
          </motion.div>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2 px-4">
            {displayHotspots.map((hotspot, index) => (
              <HotspotItem
                key={hotspot.id}
                hotspot={hotspot}
                index={index}
                onClick={() => handleHotspotClick(hotspot.id)}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Show More */}
      {hotspots.length > maxItems && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/discover')}
          className="w-full mt-3 px-4"
        >
          <div
            className="py-2 rounded-xl text-center text-xs text-white/40 hover:text-white/60 transition-colors"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
            }}
          >
            +{hotspots.length - maxItems} weitere Hotspots anzeigen
          </div>
        </motion.button>
      )}
    </div>
  );
});

export default HotspotRadar;
