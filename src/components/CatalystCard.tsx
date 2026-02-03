/**
 * CATALYST CARD SYSTEM
 * Apple Home / Material You Design Language
 *
 * Features:
 * - Glassmorphism cards with dynamic colors
 * - Real-time progress updates
 * - Haptic feedback on interactions
 * - Persistent status linked to user ID
 *
 * @design Apple Human Interface Guidelines + Material You
 * @version 2.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Crown, Zap, Eye, Shield, Mic2, Star, Users,
  ChevronRight, Lock, Check, Sparkles, Clock
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';

// ═══════════════════════════════════════
// CATALYST FEATURES CONFIG
// ═══════════════════════════════════════

const CATALYST_FEATURES = [
  {
    id: 'xp_boost',
    icon: Zap,
    label: '1.5x XP Boost',
    description: '50% mehr XP bei allen Aktivitäten',
    color: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-500',
  },
  {
    id: 'unlimited_stars',
    icon: Star,
    label: 'Unlimited Stars',
    description: 'Verschenke unbegrenzt Sterne',
    color: 'from-yellow-400 to-amber-500',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-500',
  },
  {
    id: 'profile_visitors',
    icon: Eye,
    label: 'Profilbesucher',
    description: 'Sieh wer dein Profil besucht hat',
    color: 'from-purple-400 to-violet-500',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-500',
  },
  {
    id: 'extended_privacy',
    icon: Shield,
    label: 'Extended Privacy',
    description: 'Unsichtbar-Modus & Lesebestätigung',
    color: 'from-emerald-400 to-green-500',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-500',
  },
  {
    id: 'premium_lounges',
    icon: Mic2,
    label: 'Premium Lounges',
    description: 'Exklusive Voice-Räume',
    color: 'from-pink-400 to-rose-500',
    bgColor: 'bg-pink-500/10',
    textColor: 'text-pink-500',
  },
  {
    id: 'extended_radar',
    icon: Users,
    label: 'Extended Radar',
    description: 'Bis zu 5km Suchradius',
    color: 'from-blue-400 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-500',
  },
] as const;

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface CatalystStatus {
  isActive: boolean;
  tier: 'none' | 'trial' | 'monthly' | 'yearly' | 'lifetime';
  expiresAt: Date | null;
  activatedAt: Date | null;
  features: string[];
  daysRemaining: number;
}

// ═══════════════════════════════════════
// FEATURE CARD COMPONENT
// ═══════════════════════════════════════

interface FeatureCardProps {
  feature: typeof CATALYST_FEATURES[number];
  isUnlocked: boolean;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, isUnlocked, index }) => {
  const Icon = feature.icon;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl transition-all duration-500 ${
        isUnlocked
          ? 'bg-white dark:bg-gray-800 shadow-lg shadow-purple-500/10'
          : 'bg-gray-100 dark:bg-gray-900 opacity-60'
      }`}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Gradient overlay for unlocked cards */}
      {isUnlocked && (
        <div
          className={`absolute inset-0 opacity-10 bg-gradient-to-br ${feature.color}`}
        />
      )}

      <div className="relative p-4">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              isUnlocked
                ? `bg-gradient-to-br ${feature.color} shadow-lg`
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            {isUnlocked ? (
              <Icon size={24} className="text-white" />
            ) : (
              <Lock size={20} className="text-gray-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`font-semibold truncate ${
              isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-400'
            }`}>
              {feature.label}
            </p>
            <p className={`text-xs truncate ${
              isUnlocked ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {feature.description}
            </p>
          </div>

          {/* Status indicator */}
          {isUnlocked && (
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
// MAIN CATALYST CARD COMPONENT
// ═══════════════════════════════════════

interface CatalystCardProps {
  onUpgrade?: () => void;
  compact?: boolean;
}

const CatalystCard: React.FC<CatalystCardProps> = ({ onUpgrade, compact = false }) => {
  const { user } = useStore();
  const [status, setStatus] = useState<CatalystStatus>({
    isActive: false,
    tier: 'none',
    expiresAt: null,
    activatedAt: null,
    features: [],
    daysRemaining: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // ═══════════════════════════════════════
  // LOAD CATALYST STATUS
  // ═══════════════════════════════════════

  useEffect(() => {
    const loadStatus = async () => {
      if (!user?.id) return;

      setIsLoading(true);

      try {
        // Load from Firestore
        const catalystDoc = await getDoc(doc(db, 'catalyst_status', user.id));

        if (catalystDoc.exists()) {
          const data = catalystDoc.data();
          const expiresAt = data.expiresAt?.toDate?.() || null;
          const isActive = expiresAt ? expiresAt > new Date() : false;

          // Calculate days remaining
          let daysRemaining = 0;
          if (isActive && expiresAt) {
            daysRemaining = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          }

          setStatus({
            isActive,
            tier: data.tier || 'none',
            expiresAt,
            activatedAt: data.activatedAt?.toDate?.() || null,
            features: isActive ? CATALYST_FEATURES.map(f => f.id) : [],
            daysRemaining,
          });
        } else {
          // Check if user has premium from referrals
          const userDoc = await getDoc(doc(db, 'users', user.id));
          const userData = userDoc.data();

          if (userData?.isPremium) {
            const premiumUntil = userData.premiumUntil?.toDate?.() || null;
            const isActive = premiumUntil ? premiumUntil > new Date() : false;

            setStatus({
              isActive,
              tier: isActive ? 'trial' : 'none',
              expiresAt: premiumUntil,
              activatedAt: null,
              features: isActive ? CATALYST_FEATURES.map(f => f.id) : [],
              daysRemaining: isActive && premiumUntil
                ? Math.ceil((premiumUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : 0,
            });
          }
        }
      } catch (error) {
        console.error('[Catalyst] Failed to load status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStatus();
  }, [user?.id]);

  // ═══════════════════════════════════════
  // HAPTIC FEEDBACK
  // ═══════════════════════════════════════

  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  // ═══════════════════════════════════════
  // COMPACT VIEW (for Profile)
  // ═══════════════════════════════════════

  if (compact) {
    return (
      <div
        onClick={() => {
          triggerHaptic([10, 30, 10]);
          onUpgrade?.();
        }}
        className={`relative overflow-hidden rounded-2xl p-4 cursor-pointer transition-all active:scale-98 ${
          status.isActive
            ? 'bg-gradient-to-br from-purple-500 to-violet-600'
            : 'bg-gradient-to-br from-gray-800 to-gray-900'
        }`}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              status.isActive ? 'bg-white/20' : 'bg-purple-500/20'
            }`}>
              <Crown size={20} className={status.isActive ? 'text-white' : 'text-purple-400'} />
            </div>
            <div>
              <p className="font-semibold text-white">
                {status.isActive ? 'Catalyst Aktiv' : 'Catalyst Premium'}
              </p>
              <p className={`text-xs ${status.isActive ? 'text-white/70' : 'text-gray-400'}`}>
                {status.isActive
                  ? `Noch ${status.daysRemaining} Tage`
                  : 'Jetzt freischalten'}
              </p>
            </div>
          </div>

          <ChevronRight size={20} className={status.isActive ? 'text-white/60' : 'text-gray-500'} />
        </div>

        {/* Progress bar for active status */}
        {status.isActive && status.tier === 'trial' && (
          <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(0, Math.min(100, (status.daysRemaining / 7) * 100))}%`,
              }}
            />
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════
  // FULL VIEW
  // ═══════════════════════════════════════

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div
        className={`relative overflow-hidden rounded-3xl p-6 ${
          status.isActive
            ? 'bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-500'
            : 'bg-gradient-to-br from-gray-800 via-gray-900 to-black'
        }`}
      >
        {/* Animated background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-white rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-purple-300 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative">
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                status.isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-purple-500/20 text-purple-400'
              }`}>
                {status.isActive ? '✨ AKTIV' : 'GESPERRT'}
              </div>
              {status.tier !== 'none' && (
                <span className="text-xs text-white/60 uppercase">
                  {status.tier === 'trial' && 'Testversion'}
                  {status.tier === 'monthly' && 'Monatlich'}
                  {status.tier === 'yearly' && 'Jährlich'}
                  {status.tier === 'lifetime' && 'Lifetime'}
                </span>
              )}
            </div>
            {status.isActive && status.daysRemaining > 0 && (
              <div className="flex items-center gap-1 text-white/70 text-sm">
                <Clock size={14} />
                {status.daysRemaining} Tage
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              status.isActive
                ? 'bg-white/20 shadow-lg'
                : 'bg-purple-500/20'
            }`}>
              <Crown size={32} className={status.isActive ? 'text-white' : 'text-purple-400'} />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-white">
                Catalyst Premium
              </h2>
              <p className={status.isActive ? 'text-white/70' : 'text-gray-400'}>
                {status.isActive
                  ? 'Alle Features freigeschaltet'
                  : 'Schalte alle Features frei'}
              </p>
            </div>
          </div>

          {/* CTA Button */}
          {!status.isActive && (
            <button
              onClick={() => {
                triggerHaptic([15, 30, 15, 30, 50]);
                onUpgrade?.();
              }}
              className="w-full py-4 rounded-2xl font-bold text-lg bg-white text-purple-600 shadow-lg shadow-white/20 hover:shadow-white/40 transition-all active:scale-98"
            >
              <Sparkles size={20} className="inline mr-2" />
              Jetzt freischalten
            </button>
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
          Enthaltene Features
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {CATALYST_FEATURES.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              isUnlocked={status.features.includes(feature.id)}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
        .active\\:scale-98:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
};

export default CatalystCard;
