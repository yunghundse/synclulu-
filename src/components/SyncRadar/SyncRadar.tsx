/**
 * SyncRadar.tsx
 * 🔮 SYNC-RADAR & MATCH-CARD UI
 *
 * Kreisförmiger Scan-Effekt beim Anklicken eines Profils
 * mit anschließender Match-Card am unteren Bildschirmrand
 *
 * Features:
 * - Radar-Scan Animation
 * - Frosted Glass Match-Card
 * - Aura-Verschmelzungs-Animation basierend auf Score
 * - Golden Halo für 90%+ Matches
 * - Voice-Room Einladung
 *
 * @version 1.0.0
 */

import React, { memo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { Users, Zap, Sparkles, X, Phone, Heart } from 'lucide-react';
import type { SyncResult, UserProfile } from '@/lib/auraSyncEngine';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface SyncRadarProps {
  isScanning: boolean;
  targetUser?: UserProfile | null;
  syncResult?: SyncResult | null;
  onClose: () => void;
  onInviteToSync: (userId: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// RADAR SCAN OVERLAY
// ═══════════════════════════════════════════════════════════════════════════

const RadarScanOverlay = memo(function RadarScanOverlay({
  isActive,
}: {
  isActive: boolean;
}) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] pointer-events-none flex items-center justify-center"
        >
          {/* Scan Rings */}
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2"
              style={{
                borderColor: 'rgba(168, 85, 247, 0.4)',
                width: 100,
                height: 100,
              }}
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{
                scale: [0, 3, 4],
                opacity: [0.8, 0.3, 0],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.3,
                ease: 'easeOut',
              }}
            />
          ))}

          {/* Center Pulse */}
          <motion.div
            className="w-4 h-4 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #A855F7 0%, #D946EF 100%)',
              boxShadow: '0 0 30px rgba(168, 85, 247, 0.8)',
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 0.5,
              repeat: 3,
            }}
          />

          {/* Scanning Text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-[40%] text-sm font-bold text-purple-300 tracking-widest uppercase"
          >
            Analysiere Aura...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// AURA MERGE ANIMATION
// ═══════════════════════════════════════════════════════════════════════════

const AuraMerge = memo(function AuraMerge({
  score,
  userAPhoto,
  userBPhoto,
}: {
  score: number;
  userAPhoto?: string;
  userBPhoto?: string;
}) {
  // Je höher der Score, desto mehr überlappen sich die Kreise
  const overlap = Math.min(40, (score / 100) * 50);

  return (
    <div className="relative flex items-center justify-center h-20">
      {/* User A Aura */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 72,
          height: 72,
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
          left: `calc(50% - 36px - ${20 - overlap / 2}px)`,
        }}
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* User B Aura */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 72,
          height: 72,
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)',
          right: `calc(50% - 36px - ${20 - overlap / 2}px)`,
        }}
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />

      {/* Merge Glow (bei hohem Score) */}
      {score >= 75 && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 40,
            height: 40,
            background:
              score >= 90
                ? 'radial-gradient(circle, rgba(234, 179, 8, 0.6) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, transparent 70%)',
          }}
          animate={{
            scale: [0.8, 1.3, 0.8],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* User A Avatar */}
      <div
        className="relative w-14 h-14 rounded-full overflow-hidden border-2 z-10"
        style={{
          borderColor: '#A855F7',
          transform: `translateX(-${20 - overlap / 2}px)`,
        }}
      >
        {userAPhoto ? (
          <img src={userAPhoto} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center">
            <span className="text-white font-bold">Du</span>
          </div>
        )}
      </div>

      {/* User B Avatar */}
      <div
        className="relative w-14 h-14 rounded-full overflow-hidden border-2 z-10"
        style={{
          borderColor: '#EC4899',
          transform: `translateX(${20 - overlap / 2}px)`,
        }}
      >
        {userBPhoto ? (
          <img src={userBPhoto} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MATCH CARD
// ═══════════════════════════════════════════════════════════════════════════

const MatchCard = memo(function MatchCard({
  targetUser,
  syncResult,
  currentUserPhoto,
  onClose,
  onInvite,
}: {
  targetUser: UserProfile;
  syncResult: SyncResult;
  currentUserPhoto?: string;
  onClose: () => void;
  onInvite: () => void;
}) {
  const isGolden = syncResult.isGoldenMatch;

  return (
    <motion.div
      initial={{ y: 300, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 300, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-24 left-4 right-4 z-[160]"
    >
      <div
        className="relative rounded-[28px] overflow-hidden will-change-transform"
        style={{
          background: 'rgba(5, 5, 5, 0.85)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: isGolden
            ? '2px solid rgba(234, 179, 8, 0.5)'
            : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: isGolden
            ? '0 0 40px rgba(234, 179, 8, 0.3), inset 0 0 20px rgba(234, 179, 8, 0.1)'
            : '0 -10px 40px rgba(0, 0, 0, 0.5)',
          transform: 'translateZ(0)',
        }}
      >
        {/* Golden Shimmer for 90%+ */}
        {isGolden && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(234, 179, 8, 0.15) 50%, transparent 100%)',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center z-10"
          style={{ background: 'rgba(255, 255, 255, 0.1)' }}
        >
          <X size={16} className="text-white/60" />
        </button>

        <div className="p-6">
          {/* Aura Merge Animation */}
          <AuraMerge
            score={syncResult.score}
            userAPhoto={currentUserPhoto}
            userBPhoto={targetUser.photoURL}
          />

          {/* Score Display */}
          <div className="text-center mt-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="inline-flex items-center gap-2"
            >
              {isGolden && <Sparkles size={20} className="text-yellow-400" />}
              <span
                className="text-4xl font-black"
                style={{
                  background: isGolden
                    ? 'linear-gradient(135deg, #EAB308 0%, #FDE047 50%, #EAB308 100%)'
                    : 'linear-gradient(135deg, #A855F7 0%, #D946EF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {syncResult.score}%
              </span>
              {isGolden && <Sparkles size={20} className="text-yellow-400" />}
            </motion.div>

            <p className="text-sm text-white/60 mt-1">
              Sync mit <span className="text-white font-medium">{targetUser.displayName}</span>
            </p>

            {/* Quality Badge */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mt-2"
              style={{
                background:
                  syncResult.matchQuality === 'perfect'
                    ? 'rgba(234, 179, 8, 0.2)'
                    : syncResult.matchQuality === 'high'
                    ? 'rgba(34, 197, 94, 0.2)'
                    : 'rgba(168, 85, 247, 0.2)',
                border: `1px solid ${
                  syncResult.matchQuality === 'perfect'
                    ? 'rgba(234, 179, 8, 0.4)'
                    : syncResult.matchQuality === 'high'
                    ? 'rgba(34, 197, 94, 0.4)'
                    : 'rgba(168, 85, 247, 0.4)'
                }`,
              }}
            >
              {syncResult.matchQuality === 'perfect' && <Heart size={12} className="text-yellow-400" />}
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{
                  color:
                    syncResult.matchQuality === 'perfect'
                      ? '#FDE047'
                      : syncResult.matchQuality === 'high'
                      ? '#86EFAC'
                      : '#D8B4FE',
                }}
              >
                {syncResult.matchQuality === 'perfect'
                  ? 'Perfekte Resonanz'
                  : syncResult.matchQuality === 'high'
                  ? 'Hohe Kompatibilität'
                  : syncResult.matchQuality === 'medium'
                  ? 'Gute Verbindung'
                  : 'Erste Verbindung'}
              </span>
            </div>
          </div>

          {/* Highlights */}
          {syncResult.highlights.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {syncResult.highlights.map((highlight, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-lg text-[10px] text-white/60"
                  style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                >
                  {highlight}
                </span>
              ))}
            </div>
          )}

          {/* Action Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onInvite}
            className="w-full mt-5 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-white"
            style={{
              background: isGolden
                ? 'linear-gradient(135deg, #EAB308 0%, #F59E0B 100%)'
                : 'linear-gradient(135deg, #A855F7 0%, #D946EF 100%)',
              boxShadow: isGolden
                ? '0 0 20px rgba(234, 179, 8, 0.4)'
                : '0 0 20px rgba(168, 85, 247, 0.4)',
            }}
          >
            <Zap size={18} />
            <span>In Sync gehen</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const SyncRadar = memo(function SyncRadar({
  isScanning,
  targetUser,
  syncResult,
  onClose,
  onInviteToSync,
}: SyncRadarProps) {
  const [showCard, setShowCard] = useState(false);

  // Zeige Card nach Scan
  useEffect(() => {
    if (isScanning) {
      setShowCard(false);
      const timer = setTimeout(() => {
        if (targetUser && syncResult) {
          setShowCard(true);
        }
      }, 1500); // 1.5s Scan-Zeit
      return () => clearTimeout(timer);
    }
  }, [isScanning, targetUser, syncResult]);

  const handleClose = useCallback(() => {
    setShowCard(false);
    onClose();
  }, [onClose]);

  const handleInvite = useCallback(() => {
    if (targetUser) {
      onInviteToSync(targetUser.uid);
      handleClose();
    }
  }, [targetUser, onInviteToSync, handleClose]);

  return (
    <>
      {/* Radar Scan Animation */}
      <RadarScanOverlay isActive={isScanning && !showCard} />

      {/* Match Card */}
      <AnimatePresence>
        {showCard && targetUser && syncResult && (
          <MatchCard
            targetUser={targetUser}
            syncResult={syncResult}
            onClose={handleClose}
            onInvite={handleInvite}
          />
        )}
      </AnimatePresence>
    </>
  );
});

export default SyncRadar;
