/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AURA QUICK PREVIEW - Node Detail Card v1.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Shows a quick preview of a selected Aura node:
 * - Active Cloud: Room name, participants, join button
 * - Friend Online: Avatar, status, message button
 * - New Hotspot: Discovery info, explore button
 *
 * @version 1.0.0
 */

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud, User, Sparkles, MapPin, Users, Zap, X,
  MessageCircle, UserPlus, ArrowRight
} from 'lucide-react';
import type { AuraNode } from './AuraNetwork';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface AuraQuickPreviewProps {
  node: AuraNode | null;
  onClose: () => void;
  onJoinRoom: (roomId: string) => void;
  onViewProfile: (userId: string) => void;
  onExplore: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const AuraQuickPreview: React.FC<AuraQuickPreviewProps> = memo(({
  node,
  onClose,
  onJoinRoom,
  onViewProfile,
  onExplore,
}) => {
  if (!node) return null;

  // Get type-specific content
  const getTypeIcon = () => {
    switch (node.type) {
      case 'activeCloud':
        return <Cloud size={20} className="text-purple-400" />;
      case 'friendOnline':
        return <User size={20} className="text-emerald-400" />;
      case 'newHotspot':
        return <Sparkles size={20} className="text-amber-400" />;
      case 'regionalBonus':
        return <MapPin size={20} className="text-pink-400" />;
    }
  };

  const getTypeLabel = () => {
    switch (node.type) {
      case 'activeCloud':
        return 'Aktives Wölkchen';
      case 'friendOnline':
        return 'Freund online';
      case 'newHotspot':
        return 'Neuer Hotspot';
      case 'regionalBonus':
        return 'Regional Bonus';
    }
  };

  const getTypeColor = () => {
    switch (node.type) {
      case 'activeCloud':
        return 'from-purple-500/20 to-purple-600/20 border-purple-500/30';
      case 'friendOnline':
        return 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30';
      case 'newHotspot':
        return 'from-amber-500/20 to-amber-600/20 border-amber-500/30';
      case 'regionalBonus':
        return 'from-pink-500/20 to-pink-600/20 border-pink-500/30';
    }
  };

  const handlePrimaryAction = () => {
    switch (node.type) {
      case 'activeCloud':
        if (node.roomId) onJoinRoom(node.roomId);
        break;
      case 'friendOnline':
        if (node.userId) onViewProfile(node.userId);
        break;
      case 'newHotspot':
      case 'regionalBonus':
        onExplore();
        break;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute bottom-24 left-4 right-4 z-50"
      >
        <div
          className={`bg-gradient-to-br ${getTypeColor()} backdrop-blur-xl rounded-3xl p-5 border shadow-2xl`}
          style={{
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Close Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
          >
            <X size={16} className="text-white/60" />
          </motion.button>

          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            {/* Icon or Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden">
              {node.avatarUrl ? (
                <img src={node.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                getTypeIcon()
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                {getTypeLabel()}
              </p>
              <h3 className="font-bold text-white text-lg truncate">
                {node.name}
              </h3>

              {/* Stats Row */}
              <div className="flex items-center gap-3 mt-2">
                {node.count > 0 && (
                  <div className="flex items-center gap-1 text-white/60 text-xs">
                    <Users size={12} />
                    <span>{node.count} aktiv</span>
                  </div>
                )}
                {node.xpMultiplier && node.xpMultiplier > 1 && (
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    <Zap size={12} />
                    <span>{node.xpMultiplier}x XP</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {/* Secondary Action */}
            {node.type === 'friendOnline' && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => node.userId && onViewProfile(node.userId)}
                className="flex-1 py-3 rounded-xl bg-white/10 text-white font-semibold text-sm flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} />
                Nachricht
              </motion.button>
            )}

            {/* Primary Action */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handlePrimaryAction}
              className="flex-1 py-3 rounded-xl bg-white/20 text-white font-bold text-sm flex items-center justify-center gap-2"
              style={{
                background: node.type === 'activeCloud'
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                  : node.type === 'friendOnline'
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              }}
            >
              {node.type === 'activeCloud' && (
                <>
                  <UserPlus size={16} />
                  Beitreten
                </>
              )}
              {node.type === 'friendOnline' && (
                <>
                  <User size={16} />
                  Profil
                </>
              )}
              {(node.type === 'newHotspot' || node.type === 'regionalBonus') && (
                <>
                  <ArrowRight size={16} />
                  Erkunden
                </>
              )}
            </motion.button>
          </div>

          {/* Dismiss Hint */}
          <p className="text-center text-[10px] text-white/30 mt-3">
            Tippe außerhalb zum Schließen
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

AuraQuickPreview.displayName = 'AuraQuickPreview';

export default AuraQuickPreview;
