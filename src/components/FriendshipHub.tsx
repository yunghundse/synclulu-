/**
 * DELULU FRIENDSHIP HUB
 * Visual display of friendships with streak highlighting
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import GlowUpAvatar from './GlowUpAvatar';
import {
  Heart, Flame, Crown, Users, ChevronRight,
  Sparkles, Cloud, MessageCircle, Clock
} from 'lucide-react';

interface FriendData {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  level: number;
  streak: number;
  lastInteraction: Date;
  cloudCount: number;
  bondStrength: 'new' | 'growing' | 'strong' | 'best';
}

interface FriendshipHubProps {
  maxDisplay?: number;
  showTitle?: boolean;
  compact?: boolean;
}

const FriendshipHub = ({ maxDisplay = 6, showTitle = true, compact = false }: FriendshipHubProps) => {
  const { user } = useStore();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFriends();
  }, [user?.id]);

  const loadFriends = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Get friend relationships
      const friendsRef = collection(db, 'friendships');
      const q = query(
        friendsRef,
        where('users', 'array-contains', user.id),
        orderBy('streak', 'desc'),
        limit(maxDisplay)
      );

      const snapshot = await getDocs(q);
      const friendsData: FriendData[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const friendId = data.users.find((id: string) => id !== user.id);

        if (friendId) {
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          if (friendDoc.exists()) {
            const friendData = friendDoc.data();
            const streak = data.streak || 0;

            friendsData.push({
              id: friendId,
              username: friendData.username || 'unknown',
              displayName: friendData.displayName || 'Unknown',
              avatarUrl: friendData.avatarUrl,
              level: friendData.level || 1,
              streak,
              lastInteraction: data.lastInteraction?.toDate() || new Date(),
              cloudCount: data.cloudCount || 0,
              bondStrength: getBondStrength(streak, data.cloudCount || 0),
            });
          }
        }
      }

      // Sort by bond strength
      friendsData.sort((a, b) => {
        const strengthOrder = { best: 0, strong: 1, growing: 2, new: 3 };
        return strengthOrder[a.bondStrength] - strengthOrder[b.bondStrength];
      });

      setFriends(friendsData);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
    setIsLoading(false);
  };

  const getBondStrength = (streak: number, cloudCount: number): FriendData['bondStrength'] => {
    const score = streak * 2 + cloudCount;
    if (score >= 100) return 'best';
    if (score >= 50) return 'strong';
    if (score >= 10) return 'growing';
    return 'new';
  };

  const getBondColor = (strength: FriendData['bondStrength']): string => {
    switch (strength) {
      case 'best': return 'from-pink-500 via-red-500 to-orange-500';
      case 'strong': return 'from-purple-500 to-pink-500';
      case 'growing': return 'from-blue-500 to-purple-500';
      default: return 'from-gray-500 to-gray-400';
    }
  };

  const getBondEmoji = (strength: FriendData['bondStrength']): string => {
    switch (strength) {
      case 'best': return '💕';
      case 'strong': return '💜';
      case 'growing': return '💙';
      default: return '🤍';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-16 h-20 bg-white/10 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 text-center">
        <Users size={48} className="mx-auto text-white/30 mb-3" />
        <h3 className="font-semibold text-white mb-1">Noch keine Freunde</h3>
        <p className="text-sm text-white/60 mb-4">
          Finde Freunde in den Wölkchen oder lade sie ein!
        </p>
        <button
          onClick={() => navigate('/discover')}
          className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-semibold"
        >
          Wölkchen entdecken
        </button>
      </div>
    );
  }

  if (compact) {
    // Compact horizontal view
    return (
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {friends.slice(0, 4).map((friend) => (
          <button
            key={friend.id}
            onClick={() => navigate(`/profile/${friend.username}`)}
            className="flex-shrink-0"
          >
            <div className="relative">
              <GlowUpAvatar
                avatarUrl={friend.avatarUrl}
                level={friend.level}
                size="md"
              />
              {friend.streak > 0 && (
                <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center gap-0.5">
                  <Flame size={10} />
                  {friend.streak}
                </div>
              )}
            </div>
          </button>
        ))}

        {friends.length > 4 && (
          <button
            onClick={() => navigate('/friends')}
            className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors"
          >
            +{friends.length - 4}
          </button>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className="bg-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      {showTitle && (
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="text-pink-500" size={20} />
            <h3 className="font-semibold text-white">Freundschaften</h3>
          </div>
          <button
            onClick={() => navigate('/friends')}
            className="text-sm text-purple-400 flex items-center gap-1"
          >
            Alle anzeigen
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Best Friends (Top Row) */}
      {friends.some(f => f.bondStrength === 'best' || f.bondStrength === 'strong') && (
        <div className="p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10">
          <p className="text-xs font-semibold text-pink-400 uppercase tracking-wide mb-3">
            💕 Stärkste Bindungen
          </p>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {friends
              .filter(f => f.bondStrength === 'best' || f.bondStrength === 'strong')
              .map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => navigate(`/profile/${friend.username}`)}
                  className="flex-shrink-0 text-center"
                >
                  <div className="relative mb-2">
                    {/* Bond glow ring */}
                    <div
                      className={`absolute inset-0 rounded-full bg-gradient-to-r ${getBondColor(friend.bondStrength)} opacity-50 blur-md`}
                    />
                    <GlowUpAvatar
                      avatarUrl={friend.avatarUrl}
                      level={friend.level}
                      size="lg"
                      showParticles={friend.bondStrength === 'best'}
                    />
                    {/* Streak badge */}
                    {friend.streak > 0 && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
                        <Flame size={12} />
                        {friend.streak}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white truncate max-w-[80px]">
                    {friend.displayName}
                  </p>
                  <p className="text-xs text-white/50">
                    {getBondEmoji(friend.bondStrength)} {friend.cloudCount} Clouds
                  </p>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Other Friends */}
      <div className="p-4">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">
          Alle Freunde
        </p>
        <div className="space-y-2">
          {friends.slice(0, maxDisplay).map((friend) => (
            <button
              key={friend.id}
              onClick={() => navigate(`/profile/${friend.username}`)}
              className="w-full p-3 bg-white/5 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-colors"
            >
              <GlowUpAvatar
                avatarUrl={friend.avatarUrl}
                level={friend.level}
                size="sm"
              />

              <div className="flex-1 text-left">
                <p className="font-semibold text-white text-sm">
                  {friend.displayName}
                </p>
                <p className="text-xs text-white/50">
                  Lv. {friend.level} · {friend.cloudCount} Clouds zusammen
                </p>
              </div>

              {/* Bond indicator */}
              <div className="flex items-center gap-2">
                {friend.streak > 0 && (
                  <div className="flex items-center gap-1 text-orange-400">
                    <Flame size={14} />
                    <span className="text-xs font-bold">{friend.streak}</span>
                  </div>
                )}
                <span className="text-lg">{getBondEmoji(friend.bondStrength)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cloud Streak Info */}
      <div className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Flame size={20} className="text-orange-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Cloud Streak</p>
            <p className="text-xs text-white/60">
              Tägliche Clouds mit Freunden stärken eure Bindung!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendshipHub;
