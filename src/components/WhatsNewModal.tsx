/**
 * WHAT'S NEW MODAL
 * synclulu Update Log mit verspieltem Design
 */

import { useState, useEffect } from 'react';
import {
  X, Sparkles, Eye, Star, Users, Crown, Zap, Gift,
  Clock, Shield, Bell, ChevronRight, Rocket, LucideIcon
} from 'lucide-react';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UpdateEntry {
  version: string;
  date: string;
  title: string;
  titleDE: string;
  emoji: string;
  color: string;
  features: {
    icon: LucideIcon;
    title: string;
    description: string;
    isNew?: boolean;
    isPremium?: boolean;
  }[];
}

const UPDATES: UpdateEntry[] = [
  {
    version: 'v1.4',
    date: '31. Januar 2026',
    title: 'The Awakening Update',
    titleDE: 'Das Erwachen',
    emoji: '✨',
    color: '#A78BFA',
    features: [
      {
        icon: Eye,
        title: 'Besucher-Tracking',
        description: 'Sieh, wer einen Blick in deine Wolke geworfen hat',
        isNew: true,
      },
      {
        icon: Star,
        title: 'Sterne-Rating',
        description: 'Bewerte andere nach Voice-Chats mit 1-5 Sternen',
        isNew: true,
      },
      {
        icon: Users,
        title: '200 Beta-Plätze',
        description: 'Exklusiver Zugang – der Countdown läuft!',
        isNew: true,
      },
      {
        icon: Shield,
        title: 'Inkognito-Modus',
        description: 'Besuche Profile unsichtbar',
        isPremium: true,
      },
      {
        icon: Zap,
        title: 'Online-Status',
        description: 'Sanft leuchtender Indikator am Profilbild',
        isNew: true,
      },
    ],
  },
  {
    version: 'v1.3',
    date: '20. Januar 2026',
    title: 'Dream Pass Beta',
    titleDE: 'Traum-Pass Beta',
    emoji: '👑',
    color: '#F472B6',
    features: [
      {
        icon: Crown,
        title: 'Dream Pass System',
        description: '100 Level mit exklusiven Belohnungen',
      },
      {
        icon: Gift,
        title: 'Creator Dashboard',
        description: 'Verwalte deine Secret Bubbles',
      },
      {
        icon: Users,
        title: '5-Freunde-System',
        description: 'Premium gratis durch Einladungen',
      },
    ],
  },
  {
    version: 'v1.2',
    date: '10. Januar 2026',
    title: 'Social Vibes',
    titleDE: 'Soziale Vibes',
    emoji: '🌈',
    color: '#60A5FA',
    features: [
      {
        icon: Bell,
        title: 'Benachrichtigungen',
        description: 'Push-Notifications für wichtige Events',
      },
      {
        icon: Clock,
        title: 'Streak-System',
        description: 'Tägliche Aktivität wird belohnt',
      },
    ],
  },
];

const WhatsNewModal = ({ isOpen, onClose }: WhatsNewModalProps) => {
  const [activeVersion, setActiveVersion] = useState(0);
  const [hasSeenUpdate, setHasSeenUpdate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Mark as seen
      const seenVersions = localStorage.getItem('synclulu_seen_updates') || '';
      const latestVersion = UPDATES[0].version;

      if (!seenVersions.includes(latestVersion)) {
        localStorage.setItem('synclulu_seen_updates', seenVersions + latestVersion);
      }

      setHasSeenUpdate(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentUpdate = UPDATES[activeVersion];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div
        className="bg-gray-900 rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col animate-scale-in"
        style={{
          boxShadow: `0 0 60px ${currentUpdate.color}30`,
        }}
      >
        {/* Header */}
        <div
          className="relative p-6 pb-8"
          style={{
            background: `linear-gradient(135deg, ${currentUpdate.color}20 0%, transparent 100%)`,
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"
          >
            <X size={20} className="text-white" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: `${currentUpdate.color}30` }}
            >
              {currentUpdate.emoji}
            </div>
            <div>
              <p className="text-sm text-white/60">Was gibt's Neues?</p>
              <h2 className="text-2xl font-bold text-white">
                {currentUpdate.titleDE}
              </h2>
            </div>
          </div>

          {/* Version Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {UPDATES.map((update, index) => (
              <button
                key={update.version}
                onClick={() => setActiveVersion(index)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  activeVersion === index
                    ? 'text-white'
                    : 'bg-white/10 text-white/60'
                }`}
                style={{
                  background: activeVersion === index ? update.color : undefined,
                }}
              >
                {update.version}
                {index === 0 && (
                  <span className="ml-2 text-xs">NEU</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-0">
          <p className="text-sm text-white/50 mb-4">{currentUpdate.date}</p>

          <div className="space-y-4">
            {currentUpdate.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${currentUpdate.color}20` }}
                >
                  <feature.icon size={24} style={{ color: currentUpdate.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    {feature.isNew && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
                        NEU
                      </span>
                    )}
                    {feature.isPremium && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full flex items-center gap-1">
                        <Crown size={10} />
                        PREMIUM
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/60">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20 mb-4">
            <div className="flex items-center gap-3">
              <Rocket size={24} className="text-purple-400" />
              <div>
                <p className="text-sm font-semibold text-white">Dream Pass Beta</p>
                <p className="text-xs text-white/60">
                  Startet im März 2026 – Sammle jetzt schon XP!
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <Sparkles size={20} />
            Los geht's!
          </button>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

/**
 * Check if user has unseen updates
 */
export const hasUnseenUpdates = (): boolean => {
  const seenVersions = localStorage.getItem('synclulu_seen_updates') || '';
  const latestVersion = UPDATES[0].version;
  return !seenVersions.includes(latestVersion);
};

/**
 * Get latest version
 */
export const getLatestVersion = (): string => UPDATES[0].version;

export default WhatsNewModal;
