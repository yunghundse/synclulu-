/**
 * PathfinderService.tsx
 * Smart suggestion module that recommends hotspots based on user location and activity
 * "In der Sonnenallee ist gerade viel los – jetzt beitreten?"
 */

import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Navigation, X, Sparkles, MapPin, Users, ArrowRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface PathfinderSuggestion {
  id: string;
  type: 'hotspot' | 'friend_nearby' | 'trending_area' | 'new_discovery';
  title: string;
  subtitle: string;
  location: string;
  distance: number;
  userCount?: number;
  activityScore: number; // 0-100
  actionLabel: string;
  targetId?: string;
  imageUrl?: string;
  expiresAt?: Date;
}

interface PathfinderServiceProps {
  suggestions: PathfinderSuggestion[];
  isLoading?: boolean;
  onSuggestionClick?: (suggestion: PathfinderSuggestion) => void;
  onDismiss?: (suggestionId: string) => void;
}

const suggestionConfig = {
  hotspot: {
    icon: Zap,
    gradient: 'from-violet-500 to-purple-600',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  friend_nearby: {
    icon: Users,
    gradient: 'from-emerald-500 to-teal-600',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  trending_area: {
    icon: Sparkles,
    gradient: 'from-amber-500 to-orange-600',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  new_discovery: {
    icon: Compass,
    gradient: 'from-blue-500 to-indigo-600',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
};

const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m entfernt`;
  }
  return `${(meters / 1000).toFixed(1)}km entfernt`;
};

const SuggestionCard = memo(function SuggestionCard({
  suggestion,
  onAction,
  onDismiss,
}: {
  suggestion: PathfinderSuggestion;
  onAction: () => void;
  onDismiss: () => void;
}) {
  const config = suggestionConfig[suggestion.type];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: config.bgColor,
        border: `1px solid ${config.borderColor}`,
      }}
    >
      {/* Animated Background Gradient */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-5`}
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      <div className="relative p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Icon with Glow */}
            <div className="relative">
              <div
                className={`absolute inset-0 rounded-full bg-gradient-to-r ${config.gradient} blur-md opacity-50`}
              />
              <div
                className={`relative w-10 h-10 rounded-full bg-gradient-to-r ${config.gradient} flex items-center justify-center`}
              >
                <Icon size={18} className="text-white" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div>
              <h4 className="text-sm font-bold text-white">{suggestion.title}</h4>
              <p className="text-xs text-white/60">{suggestion.subtitle}</p>
            </div>
          </div>

          {/* Dismiss Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onDismiss}
            className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"
          >
            <X size={12} className="text-white/40" />
          </motion.button>
        </div>

        {/* Info Row */}
        <div className="flex items-center gap-4 mb-3 text-xs text-white/50">
          <div className="flex items-center gap-1">
            <MapPin size={10} />
            <span>{suggestion.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Navigation size={10} />
            <span>{formatDistance(suggestion.distance)}</span>
          </div>
          {suggestion.userCount !== undefined && (
            <div className="flex items-center gap-1">
              <Users size={10} />
              <span>{suggestion.userCount} aktiv</span>
            </div>
          )}
        </div>

        {/* Activity Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/40">Aktivitäts-Level</span>
            <span className="text-[10px] font-bold text-white/60">
              {suggestion.activityScore}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
              initial={{ width: 0 }}
              animate={{ width: `${suggestion.activityScore}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Action Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${config.gradient} flex items-center justify-center gap-2`}
          style={{
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          }}
        >
          <span className="text-sm font-semibold text-white">
            {suggestion.actionLabel}
          </span>
          <ArrowRight size={16} className="text-white" />
        </motion.button>
      </div>
    </motion.div>
  );
});

const MiniSuggestion = memo(function MiniSuggestion({
  suggestion,
  onAction,
}: {
  suggestion: PathfinderSuggestion;
  onAction: () => void;
}) {
  const config = suggestionConfig[suggestion.type];
  const Icon = config.icon;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onAction}
      className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{
        background: config.bgColor,
        border: `1px solid ${config.borderColor}`,
      }}
    >
      <div
        className={`w-6 h-6 rounded-full bg-gradient-to-r ${config.gradient} flex items-center justify-center`}
      >
        <Icon size={12} className="text-white" />
      </div>
      <span className="text-xs text-white/80 font-medium max-w-[120px] truncate">
        {suggestion.title}
      </span>
      <span className="text-[10px] text-white/40">
        {formatDistance(suggestion.distance).replace(' entfernt', '')}
      </span>
    </motion.button>
  );
});

export const PathfinderService = memo(function PathfinderService({
  suggestions,
  isLoading = false,
  onSuggestionClick,
  onDismiss,
}: PathfinderServiceProps) {
  const navigate = useNavigate();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const handleAction = (suggestion: PathfinderSuggestion) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    } else if (suggestion.targetId) {
      if (suggestion.type === 'hotspot' || suggestion.type === 'trending_area') {
        navigate(`/room/${suggestion.targetId}`);
      } else if (suggestion.type === 'friend_nearby') {
        navigate(`/user/${suggestion.targetId}`);
      } else {
        navigate(`/discover`);
      }
    }
  };

  const handleDismiss = (suggestionId: string) => {
    setDismissedIds((prev) => new Set(prev).add(suggestionId));
    onDismiss?.(suggestionId);
  };

  const visibleSuggestions = suggestions.filter((s) => !dismissedIds.has(s.id));
  const primarySuggestion = visibleSuggestions[0];
  const secondarySuggestions = visibleSuggestions.slice(1, 4);

  if (isLoading) {
    return (
      <div className="px-4">
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(255, 255, 255, 0.03)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
            <div>
              <div className="w-24 h-3 rounded bg-white/5 animate-pulse mb-1" />
              <div className="w-32 h-2 rounded bg-white/5 animate-pulse" />
            </div>
          </div>
          <div className="w-full h-8 rounded-xl bg-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  // Show empty state when no suggestions
  if (visibleSuggestions.length === 0) {
    return (
      <div className="px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(5, 5, 5, 0.9) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.15)',
          }}
        >
          {/* Subtle Background Animation */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          <div className="relative">
            <motion.div
              className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-3"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Compass size={22} className="text-blue-400" />
            </motion.div>

            <h4 className="text-sm font-bold text-white mb-1">Kein Vibe gerade</h4>
            <p className="text-xs text-white/40 max-w-[200px] mx-auto">
              Gerade gibt es keine besonderen Aktivitäten in deiner Nähe.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
            <Compass size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Pathfinder</h3>
            <p className="text-[10px] text-white/40">Vorschläge für dich</p>
          </div>
        </div>
      </div>

      {/* Primary Suggestion Card */}
      {primarySuggestion && (
        <div className="px-4">
          <AnimatePresence mode="wait">
            <SuggestionCard
              key={primarySuggestion.id}
              suggestion={primarySuggestion}
              onAction={() => handleAction(primarySuggestion)}
              onDismiss={() => handleDismiss(primarySuggestion.id)}
            />
          </AnimatePresence>
        </div>
      )}

      {/* Secondary Suggestions (Mini Pills) */}
      {secondarySuggestions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
          {secondarySuggestions.map((suggestion) => (
            <MiniSuggestion
              key={suggestion.id}
              suggestion={suggestion}
              onAction={() => handleAction(suggestion)}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default PathfinderService;
