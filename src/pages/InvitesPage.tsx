/**
 * InvitesPage.tsx
 * 🎫 SOVEREIGN DISCOVERY v23.0 - Theme-Aware Invites Page
 *
 * Features:
 * - Light/Dark mode support
 * - Magic Invite Cards with holographic effects
 * - Reward milestone tracker
 * - Invited friends status list
 * - QR Code modal
 *
 * @design Sovereign Discovery v23.0
 * @version 23.0.0
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import MagicInviteCard from '@/components/MagicInviteCard';
import {
  ChevronLeft, Gift, Users, Star, Crown,
  Trophy, Sparkles, Check, Clock, X, QrCode
} from 'lucide-react';
import QRCode from 'qrcode';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface InvitedFriend {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  status: 'pending' | 'registered' | 'active';
  invitedAt: Date;
  registeredAt?: Date;
}

interface Milestone {
  count: number;
  reward: string;
  rewardDays: number;
  icon: React.ReactNode;
  unlocked: boolean;
}

// ═══════════════════════════════════════
// QR CODE MODAL
// ═══════════════════════════════════════

interface QRModalProps {
  code: string;
  onClose: () => void;
}

const QRModal: React.FC<QRModalProps> = ({ code, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(`https://delulu.app/join/${code}`, {
          width: 256,
          margin: 2,
          color: {
            dark: '#1a1a1a',
            light: '#ffffff',
          },
        });
        setQrDataUrl(url);
      } catch (error) {
        console.error('QR generation failed:', error);
      }
    };
    generateQR();
  }, [code]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[var(--delulu-card)] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[var(--delulu-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-[var(--delulu-text)]">QR-Code scannen</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--delulu-bg)] flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <X size={16} className="text-[var(--delulu-muted)]" />
          </button>
        </div>

        <div className="bg-gradient-to-br from-[var(--delulu-accent)]/10 to-pink-500/10 rounded-2xl p-6 flex items-center justify-center mb-4">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 rounded-xl" />
          ) : (
            <div className="w-48 h-48 bg-[var(--delulu-bg)] animate-pulse rounded-xl" />
          )}
        </div>

        <p className="text-center text-[var(--delulu-muted)] text-sm mb-2">
          Lass deine Freunde diesen Code scannen
        </p>
        <p className="text-center font-mono text-lg font-bold text-[var(--delulu-accent)]">
          {code}
        </p>
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════
// FRIEND CARD COMPONENT
// ═══════════════════════════════════════

interface FriendCardProps {
  friend: InvitedFriend;
}

const FriendCard: React.FC<FriendCardProps> = ({ friend }) => {
  const statusConfig = {
    pending: {
      label: 'Eingeladen',
      color: 'bg-amber-500/10 text-amber-500',
      icon: <Clock size={12} />,
    },
    registered: {
      label: 'Registriert',
      color: 'bg-blue-500/10 text-blue-500',
      icon: <Check size={12} />,
    },
    active: {
      label: 'Aktiv',
      color: 'bg-green-500/10 text-green-500',
      icon: <Sparkles size={12} />,
    },
  };

  const config = statusConfig[friend.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 bg-[var(--delulu-card)] rounded-2xl shadow-sm border border-[var(--delulu-border)]"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--delulu-accent)]/20 to-pink-500/20 flex items-center justify-center overflow-hidden">
        {friend.avatar ? (
          <img src={friend.avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <Users size={20} className="text-[var(--delulu-accent)]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[var(--delulu-text)] truncate">
          {friend.displayName || friend.username || 'Anonym'}
        </p>
        <p className="text-xs text-[var(--delulu-muted)]">
          {friend.invitedAt.toLocaleDateString('de-DE')}
        </p>
      </div>
      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.icon}
        {config.label}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════
// MILESTONE CARD
// ═══════════════════════════════════════

interface MilestoneCardProps {
  milestone: Milestone;
  currentCount: number;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({ milestone, currentCount }) => (
  <div
    className={`relative p-4 rounded-2xl border transition-all ${
      milestone.unlocked
        ? 'bg-gradient-to-br from-[var(--delulu-accent)]/10 to-pink-500/10 border-[var(--delulu-accent)]/30 shadow-lg'
        : 'bg-[var(--delulu-card)] border-[var(--delulu-border)] opacity-60'
    }`}
  >
    {milestone.unlocked && (
      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
        <Check size={12} className="text-white" />
      </div>
    )}

    <div className="flex items-center gap-3 mb-2">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        milestone.unlocked ? 'bg-[var(--delulu-accent)] text-white' : 'bg-[var(--delulu-bg)] text-[var(--delulu-muted)]'
      }`}>
        {milestone.icon}
      </div>
      <div>
        <p className={`font-bold ${milestone.unlocked ? 'text-[var(--delulu-text)]' : 'text-[var(--delulu-muted)]'}`}>
          {milestone.count} Freunde
        </p>
        <p className={`text-xs ${milestone.unlocked ? 'text-[var(--delulu-accent)]' : 'text-[var(--delulu-muted)]'}`}>
          {milestone.reward}
        </p>
      </div>
    </div>

    {!milestone.unlocked && (
      <div className="mt-2">
        <div className="h-1.5 bg-[var(--delulu-bg)] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (currentCount / milestone.count) * 100)}%` }}
            className="h-full bg-[var(--delulu-accent)] rounded-full"
          />
        </div>
        <p className="text-[10px] text-[var(--delulu-muted)] mt-1 text-right">
          {currentCount}/{milestone.count}
        </p>
      </div>
    )}
  </div>
);

// ═══════════════════════════════════════
// MAIN INVITES PAGE
// ═══════════════════════════════════════

const InvitesPage = () => {
  const navigate = useNavigate();
  const { user } = useStore();

  const [inviteCode, setInviteCode] = useState('');
  const [remainingInvites, setRemainingInvites] = useState(5);
  const [totalInvites, setTotalInvites] = useState(5);
  const [friends, setFriends] = useState<InvitedFriend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState<'card' | 'friends' | 'rewards'>('card');

  // Milestones
  const milestones: Milestone[] = [
    { count: 1, reward: '7 Tage Premium', rewardDays: 7, icon: <Star size={18} />, unlocked: friends.filter(f => f.status !== 'pending').length >= 1 },
    { count: 3, reward: '14 Tage Premium', rewardDays: 14, icon: <Gift size={18} />, unlocked: friends.filter(f => f.status !== 'pending').length >= 3 },
    { count: 5, reward: '30 Tage Premium', rewardDays: 30, icon: <Crown size={18} />, unlocked: friends.filter(f => f.status !== 'pending').length >= 5 },
    { count: 10, reward: 'Lifetime Premium', rewardDays: 999, icon: <Trophy size={18} />, unlocked: friends.filter(f => f.status !== 'pending').length >= 10 },
  ];

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      setIsLoading(true);

      try {
        // Load user invite data
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setInviteCode(data.referralCode || `DELULU-${user.id.slice(0, 6).toUpperCase()}`);
          setRemainingInvites(data.remainingInvites ?? 5);
          setTotalInvites(data.totalInvites ?? 5);
        }

        // Load invited friends
        const friendsQuery = query(
          collection(db, 'referrals'),
          where('referrerId', '==', user.id),
          orderBy('createdAt', 'desc')
        );

        const friendsSnap = await getDocs(friendsQuery);
        const loadedFriends: InvitedFriend[] = [];

        for (const docSnap of friendsSnap.docs) {
          const data = docSnap.data();

          // Get friend's user data if registered
          let friendData: any = {};
          if (data.referredId) {
            const friendDoc = await getDoc(doc(db, 'users', data.referredId));
            if (friendDoc.exists()) {
              friendData = friendDoc.data();
            }
          }

          loadedFriends.push({
            id: data.referredId || docSnap.id,
            username: friendData.username || '',
            displayName: friendData.displayName || data.invitedName || '',
            avatar: friendData.avatarUrl,
            status: data.status || 'pending',
            invitedAt: data.createdAt?.toDate() || new Date(),
            registeredAt: data.registeredAt?.toDate(),
          });
        }

        setFriends(loadedFriends);
      } catch (error) {
        console.error('[InvitesPage] Load failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const activeFriendsCount = friends.filter(f => f.status !== 'pending').length;

  return (
    <div className="min-h-screen bg-[var(--delulu-bg)] theme-transition">
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--delulu-accent)]/5 via-transparent to-transparent" />
      </div>

      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-[var(--delulu-card)] shadow-sm border border-[var(--delulu-border)] flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <ChevronLeft size={20} className="text-[var(--delulu-muted)]" />
          </motion.button>
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--delulu-text)]">
              Einladungen
            </h1>
            <p className="text-sm text-[var(--delulu-muted)]">
              Lade Freunde ein & erhalte Rewards
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-[var(--delulu-card)] rounded-2xl border border-[var(--delulu-border)]">
          {[
            { key: 'card', label: 'Ticket', icon: Gift },
            { key: 'friends', label: 'Freunde', icon: Users },
            { key: 'rewards', label: 'Rewards', icon: Trophy },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  if ('vibrate' in navigator) navigator.vibrate(10);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  isActive
                    ? 'bg-[var(--delulu-accent)] text-white shadow-md'
                    : 'text-[var(--delulu-muted)] hover:text-[var(--delulu-text)]'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-32">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[var(--delulu-accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* CARD TAB */}
            <AnimatePresence mode="wait">
              {activeTab === 'card' && (
                <motion.div
                  key="card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <MagicInviteCard
                    code={inviteCode}
                    remainingInvites={remainingInvites}
                    totalInvites={totalInvites}
                    rewardDays={7}
                    onShowQR={() => setShowQR(true)}
                    variant={activeFriendsCount >= 10 ? 'diamond' : activeFriendsCount >= 5 ? 'platinum' : 'golden'}
                  />

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[var(--delulu-card)] rounded-2xl p-4 text-center shadow-sm border border-[var(--delulu-border)]">
                      <p className="text-2xl font-bold text-[var(--delulu-accent)]">{friends.length}</p>
                      <p className="text-[10px] text-[var(--delulu-muted)] uppercase tracking-wider">Eingeladen</p>
                    </div>
                    <div className="bg-[var(--delulu-card)] rounded-2xl p-4 text-center shadow-sm border border-[var(--delulu-border)]">
                      <p className="text-2xl font-bold text-green-500">{activeFriendsCount}</p>
                      <p className="text-[10px] text-[var(--delulu-muted)] uppercase tracking-wider">Aktiv</p>
                    </div>
                    <div className="bg-[var(--delulu-card)] rounded-2xl p-4 text-center shadow-sm border border-[var(--delulu-border)]">
                      <p className="text-2xl font-bold text-amber-500">{remainingInvites}</p>
                      <p className="text-[10px] text-[var(--delulu-muted)] uppercase tracking-wider">Übrig</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* FRIENDS TAB */}
              {activeTab === 'friends' && (
                <motion.div
                  key="friends"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-3"
                >
                  {friends.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--delulu-card)] flex items-center justify-center border border-[var(--delulu-border)]">
                        <Users size={32} className="text-[var(--delulu-muted)]" />
                      </div>
                      <p className="text-[var(--delulu-muted)] mb-2">Noch keine Einladungen</p>
                      <p className="text-sm text-[var(--delulu-muted)] opacity-60">
                        Teile deinen Code und lade Freunde ein!
                      </p>
                    </div>
                  ) : (
                    friends.map((friend) => (
                      <FriendCard key={friend.id} friend={friend} />
                    ))
                  )}
                </motion.div>
              )}

              {/* REWARDS TAB */}
              {activeTab === 'rewards' && (
                <motion.div
                  key="rewards"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="bg-gradient-to-r from-[var(--delulu-accent)] to-pink-500 rounded-2xl p-4 text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <Sparkles size={24} />
                      <div>
                        <p className="font-bold">Aktive Freunde</p>
                        <p className="text-2xl font-black">{activeFriendsCount}</p>
                      </div>
                    </div>
                    <p className="text-sm text-white/80">
                      Je mehr Freunde sich registrieren, desto besser deine Rewards!
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {milestones.map((milestone, index) => (
                      <MilestoneCard
                        key={index}
                        milestone={milestone}
                        currentCount={activeFriendsCount}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && (
          <QRModal code={inviteCode} onClose={() => setShowQR(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvitesPage;
