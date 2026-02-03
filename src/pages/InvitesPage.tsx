/**
 * INVITES PAGE v1.5
 * "The Golden Ticket Gallery"
 *
 * Features:
 * - Magic Invite Cards with holographic effects
 * - Reward milestone tracker
 * - Invited friends status list
 * - QR Code modal
 *
 * @design Clubhouse Exclusivity
 * @version 1.5.0
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">QR-Code scannen</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 flex items-center justify-center mb-4">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
          ) : (
            <div className="w-48 h-48 bg-gray-200 animate-pulse rounded-xl" />
          )}
        </div>

        <p className="text-center text-gray-600 text-sm mb-2">
          Lass deine Freunde diesen Code scannen
        </p>
        <p className="text-center font-mono text-lg font-bold text-purple-600">
          {code}
        </p>
      </div>
    </div>
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
      color: 'bg-amber-100 text-amber-700',
      icon: <Clock size={12} />,
    },
    registered: {
      label: 'Registriert',
      color: 'bg-blue-100 text-blue-700',
      icon: <Check size={12} />,
    },
    active: {
      label: 'Aktiv',
      color: 'bg-green-100 text-green-700',
      icon: <Sparkles size={12} />,
    },
  };

  const config = statusConfig[friend.status];

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center overflow-hidden">
        {friend.avatar ? (
          <img src={friend.avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <Users size={20} className="text-purple-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">
          {friend.displayName || friend.username || 'Anonym'}
        </p>
        <p className="text-xs text-gray-500">
          {friend.invitedAt.toLocaleDateString('de-DE')}
        </p>
      </div>
      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.icon}
        {config.label}
      </div>
    </div>
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
        ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg shadow-purple-500/10'
        : 'bg-gray-50 border-gray-100 opacity-60'
    }`}
  >
    {milestone.unlocked && (
      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
        <Check size={12} className="text-white" />
      </div>
    )}

    <div className="flex items-center gap-3 mb-2">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        milestone.unlocked ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-400'
      }`}>
        {milestone.icon}
      </div>
      <div>
        <p className={`font-bold ${milestone.unlocked ? 'text-purple-900' : 'text-gray-400'}`}>
          {milestone.count} Freunde
        </p>
        <p className={`text-xs ${milestone.unlocked ? 'text-purple-600' : 'text-gray-400'}`}>
          {milestone.reward}
        </p>
      </div>
    </div>

    {!milestone.unlocked && (
      <div className="mt-2">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all"
            style={{ width: `${Math.min(100, (currentCount / milestone.count) * 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1 text-right">
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
    <div className="min-h-screen bg-gradient-to-b from-purple-50/80 via-white to-gray-50">
      {/* ═══════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════ */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">
              Einladungen
            </h1>
            <p className="text-sm text-gray-500">
              Lade Freunde ein & erhalte Rewards
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* TABS */}
        {/* ═══════════════════════════════════════ */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
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
                    ? 'bg-white shadow-md text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* CONTENT */}
      {/* ═══════════════════════════════════════ */}
      <div className="px-4 pb-32">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* CARD TAB */}
            {activeTab === 'card' && (
              <div className="space-y-6">
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
                  <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                    <p className="text-2xl font-bold text-purple-600">{friends.length}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Eingeladen</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                    <p className="text-2xl font-bold text-green-600">{activeFriendsCount}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Aktiv</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                    <p className="text-2xl font-bold text-amber-600">{remainingInvites}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Übrig</p>
                  </div>
                </div>
              </div>
            )}

            {/* FRIENDS TAB */}
            {activeTab === 'friends' && (
              <div className="space-y-3">
                {friends.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <Users size={32} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-2">Noch keine Einladungen</p>
                    <p className="text-sm text-gray-400">
                      Teile deinen Code und lade Freunde ein!
                    </p>
                  </div>
                ) : (
                  friends.map((friend) => (
                    <FriendCard key={friend.id} friend={friend} />
                  ))
                )}
              </div>
            )}

            {/* REWARDS TAB */}
            {activeTab === 'rewards' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 text-white">
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
              </div>
            )}
          </>
        )}
      </div>

      {/* QR Modal */}
      {showQR && (
        <QRModal code={inviteCode} onClose={() => setShowQR(false)} />
      )}
    </div>
  );
};

export default InvitesPage;
