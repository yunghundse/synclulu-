/**
 * PioneerState.tsx
 * Beautiful empty state cards instead of loading spinners
 * Encourages users to be pioneers and create content
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Compass,
  Users,
  MapPin,
  Plus,
  Rocket,
  Star,
  Crown,
} from 'lucide-react';

export type EmptyStateType =
  | 'no_hotspots'
  | 'no_creators'
  | 'no_friends'
  | 'no_notifications'
  | 'no_messages'
  | 'location_required';

interface PioneerStateProps {
  type: EmptyStateType;
  onAction?: () => void;
  actionLabel?: string;
}

const stateConfig: Record<
  EmptyStateType,
  {
    icon: React.ElementType;
    title: string;
    message: string;
    submessage?: string;
    gradient: string;
    actionLabel: string;
  }
> = {
  no_hotspots: {
    icon: MapPin,
    title: 'Pionier-Zone',
    message: 'Noch keine Rooms in deiner Nähe.',
    submessage: 'Sei der Erste! Erstelle einen Room und lass andere zu dir kommen.',
    gradient: 'from-violet-500 to-purple-600',
    actionLabel: 'Room erstellen',
  },
  no_creators: {
    icon: Crown,
    title: 'Die Bühne ist frei',
    message: 'Noch keine Rising Stars in dieser Stunde.',
    submessage: 'Sammle Aura-Punkte und werde selbst zum Star!',
    gradient: 'from-amber-500 to-orange-600',
    actionLabel: 'Aura sammeln',
  },
  no_friends: {
    icon: Users,
    title: 'Deine Crew wartet',
    message: 'Noch keine Freunde hinzugefügt.',
    submessage: 'Entdecke Leute in deiner Nähe und baue dein Netzwerk auf.',
    gradient: 'from-emerald-500 to-teal-600',
    actionLabel: 'Leute entdecken',
  },
  no_notifications: {
    icon: Sparkles,
    title: 'Alles ruhig hier',
    message: 'Keine neuen Benachrichtigungen.',
    submessage: 'Interagiere mit anderen, um Updates zu erhalten.',
    gradient: 'from-blue-500 to-indigo-600',
    actionLabel: 'Entdecken',
  },
  no_messages: {
    icon: Star,
    title: 'Starte das Gespräch',
    message: 'Noch keine Nachrichten.',
    submessage: 'Schreibe jemandem oder tritt einem Wölkchen bei.',
    gradient: 'from-pink-500 to-rose-600',
    actionLabel: 'Chat starten',
  },
  location_required: {
    icon: Compass,
    title: 'Standort-Vakuum',
    message: 'Bitte GPS aktivieren.',
    submessage: 'synclulu braucht deinen Standort, um Hotspots in der Nähe zu zeigen.',
    gradient: 'from-red-500 to-orange-600',
    actionLabel: 'GPS prüfen',
  },
};

export const PioneerState = memo(function PioneerState({
  type,
  onAction,
  actionLabel,
}: PioneerStateProps) {
  const config = stateConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl p-6"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Background Gradient Glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-5`}
      />

      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-32 h-32 rounded-full bg-gradient-to-r ${config.gradient} opacity-10 blur-3xl`}
            style={{
              left: `${20 + i * 30}%`,
              top: `${10 + i * 20}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center text-center">
        {/* Icon */}
        <motion.div
          className={`w-16 h-16 rounded-full bg-gradient-to-r ${config.gradient} flex items-center justify-center mb-4`}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            boxShadow: '0 4px 30px rgba(139, 92, 246, 0.3)',
          }}
        >
          <Icon size={28} className="text-white" />
        </motion.div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2">{config.title}</h3>

        {/* Message */}
        <p className="text-sm text-white/60 mb-1">{config.message}</p>
        {config.submessage && (
          <p className="text-xs text-white/40 mb-4 max-w-[250px]">
            {config.submessage}
          </p>
        )}

        {/* Action Button */}
        {onAction && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onAction}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r ${config.gradient} text-white text-sm font-semibold`}
            style={{
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            }}
          >
            <Plus size={16} />
            {actionLabel || config.actionLabel}
          </motion.button>
        )}
      </div>

      {/* Decorative Elements */}
      <motion.div
        className="absolute top-4 right-4 text-2xl opacity-30"
        animate={{
          rotate: [0, 10, -10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Rocket className="text-white/20" size={24} />
      </motion.div>
    </motion.div>
  );
});

// Compact version for inline use
export const PioneerStateCompact = memo(function PioneerStateCompact({
  type,
  onAction,
}: PioneerStateProps) {
  const config = stateConfig[type];
  const Icon = config.icon;

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onAction}
      className="w-full flex items-center gap-3 p-4 rounded-xl"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px dashed rgba(255, 255, 255, 0.1)',
      }}
    >
      <div
        className={`w-10 h-10 rounded-full bg-gradient-to-r ${config.gradient} opacity-50 flex items-center justify-center`}
      >
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm text-white/60">{config.message}</p>
        <p className="text-xs text-white/40">{config.actionLabel}</p>
      </div>
      <Plus size={18} className="text-white/30" />
    </motion.button>
  );
});

export default PioneerState;
