import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  ArrowLeft, UserPlus, UserMinus, MessageCircle, Flag,
  MapPin, Calendar, Star, Users, Mic, Award, Loader2,
  CheckCircle, Shield, ShieldOff, Cake
} from 'lucide-react';
import BlockUserModal from '@/components/BlockUserModal';
import { recordProfileVisit } from '@/lib/profileVisitService';

interface UserData {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  joinedAt: Date;
  isVerified: boolean;
  isCreator: boolean;
  friendsCount: number;
  roomsJoined: number;
  minutesTalked: number;
  // Birthdate
  birthDay?: number;
  birthMonth?: number;
  showBirthdateOnProfile?: boolean;
  city?: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useStore();
  const { isBlocked, isBlockedBy } = useBlockedUsers();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  // Check if this user is blocked
  const userIsBlocked = userId ? isBlocked(userId) : false;
  const blockedByThisUser = userId ? isBlockedBy(userId) : false;

  // Fetch user data and record profile visit
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', userId));

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            id: userDoc.id,
            username: data.username || 'unknown',
            displayName: data.displayName || 'Unbekannt',
            bio: data.bio || '',
            avatar: data.avatar,
            avatarUrl: data.avatarUrl || data.photoURL,
            level: data.level || 1,
            xp: data.xp || 0,
            joinedAt: data.createdAt?.toDate() || new Date(),
            isVerified: data.isVerified || false,
            isCreator: data.isCreator || false,
            friendsCount: data.friendsCount || 0,
            roomsJoined: data.roomsJoined || 0,
            minutesTalked: data.minutesTalked || 0,
            birthDay: data.birthDay,
            birthMonth: data.birthMonth,
            showBirthdateOnProfile: data.showBirthdateOnProfile !== false,
            city: data.city,
          });

          // Record profile visit (only if logged in and viewing another user)
          if (currentUser?.id && currentUser.id !== userId) {
            recordProfileVisit(currentUser.id, userId);
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, currentUser?.id]);

  // Check friendship status
  useEffect(() => {
    const checkFriendship = async () => {
      if (!userId || !currentUser?.id) return;

      try {
        // Check if already friends
        const friendsQuery = query(
          collection(db, 'friends'),
          where('users', 'array-contains', currentUser.id)
        );
        const friendsSnapshot = await getDocs(friendsQuery);

        const isFriendResult = friendsSnapshot.docs.some(doc => {
          const users = doc.data().users;
          return users.includes(userId);
        });
        setIsFriend(isFriendResult);

        // Check if pending request
        const pendingQuery = query(
          collection(db, 'friendRequests'),
          where('fromId', '==', currentUser.id),
          where('toId', '==', userId),
          where('status', '==', 'pending')
        );
        const pendingSnapshot = await getDocs(pendingQuery);
        setIsPending(!pendingSnapshot.empty);
      } catch (error) {
        console.error('Error checking friendship:', error);
      }
    };

    checkFriendship();
  }, [userId, currentUser?.id]);

  const handleAddFriend = async () => {
    if (!userId || !currentUser?.id || isAddingFriend) return;

    setIsAddingFriend(true);
    try {
      await addDoc(collection(db, 'friendRequests'), {
        fromId: currentUser.id,
        fromUsername: currentUser.username,
        fromDisplayName: currentUser.displayName,
        toId: userId,
        toUsername: userData?.username,
        status: 'pending',
        createdAt: Timestamp.now(),
      });
      setIsPending(true);
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setIsAddingFriend(false);
    }
  };

  const handleMessage = () => {
    // Navigate to messages with this user
    navigate('/messages', { state: { openChat: userId } });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', {
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-synclulu-soft/50 to-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-synclulu-violet" />
      </div>
    );
  }

  // If user not found in database, show basic profile with ID
  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-synclulu-soft/50 to-white safe-top pb-24">
        <div className="px-6 pt-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6"
          >
            <ArrowLeft size={20} className="text-synclulu-text" />
          </button>

          {/* Basic Profile when no data found */}
          <div className="text-center py-8">
            <div className="w-28 h-28 mx-auto rounded-full bg-synclulu-violet/10 flex items-center justify-center mb-4">
              <span className="text-4xl">👤</span>
            </div>
            <h1 className="font-display text-xl font-bold text-synclulu-text mb-2">
              synclulu Nutzer
            </h1>
            <p className="text-sm text-synclulu-muted mb-6">
              Profil wird geladen...
            </p>

            {/* Action Buttons */}
            <button
              onClick={handleAddFriend}
              disabled={isAddingFriend || isPending}
              className="w-full max-w-xs mx-auto py-4 bg-synclulu-violet text-white rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isAddingFriend ? (
                <Loader2 size={20} className="animate-spin" />
              ) : isPending ? (
                <>
                  <CheckCircle size={20} />
                  Anfrage gesendet
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Freund hinzufügen
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Don't show own profile here - redirect to /profile
  if (userId === currentUser?.id) {
    navigate('/profile');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-synclulu-soft/50 to-white safe-top pb-24">
      {/* Header */}
      <div className="px-6 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6"
        >
          <ArrowLeft size={20} className="text-synclulu-text" />
        </button>
      </div>

      {/* Profile Header */}
      <div className="px-6 text-center mb-6">
        {/* Avatar */}
        <div className="relative inline-block mb-4">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl ${
            userData.isCreator
              ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
              : 'bg-synclulu-violet/10'
          }`}>
            {userData.avatar || '👤'}
          </div>
          {userData.isVerified && (
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-4 border-white">
              <CheckCircle size={16} className="text-white" />
            </div>
          )}
          {userData.isCreator && (
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center border-4 border-white">
              <Star size={14} className="text-white" />
            </div>
          )}
        </div>

        {/* Name & Username */}
        <h1 className="font-display text-2xl font-bold text-synclulu-text mb-1">
          {userData.displayName}
        </h1>
        <p className="text-synclulu-muted mb-2">@{userData.username}</p>

        {/* Level Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-synclulu-violet/10 rounded-full mb-4">
          <Award size={16} className="text-synclulu-violet" />
          <span className="font-semibold text-synclulu-violet">Level {userData.level}</span>
        </div>

        {/* Bio */}
        {userData.bio && (
          <p className="text-sm text-synclulu-text max-w-xs mx-auto mb-4">
            {userData.bio}
          </p>
        )}

        {/* Birthday & City */}
        {userData.showBirthdateOnProfile && userData.birthDay && userData.birthMonth && (
          <p className="text-xs text-synclulu-muted flex items-center justify-center gap-2 mb-1">
            <Cake size={12} />
            <span>{userData.birthDay}. {getMonthName(userData.birthMonth)}</span>
            {userData.city && (
              <>
                <span className="text-gray-300">•</span>
                <MapPin size={12} />
                <span>{userData.city}</span>
              </>
            )}
          </p>
        )}

        {/* Join Date */}
        <p className="text-xs text-synclulu-muted flex items-center justify-center gap-1">
          <Calendar size={12} />
          Dabei seit {formatDate(userData.joinedAt)}
        </p>
      </div>

      {/* Stats */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <Users size={20} className="mx-auto text-synclulu-violet mb-2" />
            <p className="font-bold text-synclulu-text">{userData.friendsCount}</p>
            <p className="text-xs text-synclulu-muted">Freunde</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <Mic size={20} className="mx-auto text-green-500 mb-2" />
            <p className="font-bold text-synclulu-text">{userData.roomsJoined}</p>
            <p className="text-xs text-synclulu-muted">Räume</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <Star size={20} className="mx-auto text-amber-500 mb-2" />
            <p className="font-bold text-synclulu-text">{Math.floor(userData.minutesTalked / 60)}h</p>
            <p className="text-xs text-synclulu-muted">Gesprochen</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 space-y-3">
        {isFriend ? (
          <div className="flex gap-3">
            <button
              onClick={handleMessage}
              className="flex-1 py-4 bg-synclulu-violet text-white rounded-2xl font-semibold flex items-center justify-center gap-2"
            >
              <MessageCircle size={20} />
              Nachricht
            </button>
            <button
              className="w-14 h-14 bg-gray-100 text-gray-500 rounded-2xl flex items-center justify-center"
            >
              <UserMinus size={20} />
            </button>
          </div>
        ) : isPending ? (
          <button
            disabled
            className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-semibold flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} />
            Anfrage gesendet
          </button>
        ) : (
          <button
            onClick={handleAddFriend}
            disabled={isAddingFriend}
            className="w-full py-4 bg-synclulu-violet text-white rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAddingFriend ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <UserPlus size={20} />
            )}
            Freund hinzufügen
          </button>
        )}

        {/* Block/Unblock Button */}
        <button
          onClick={() => setShowBlockModal(true)}
          className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-sm ${
            userIsBlocked
              ? 'bg-green-100 text-green-600'
              : 'bg-red-50 text-red-500'
          }`}
        >
          {userIsBlocked ? (
            <>
              <ShieldOff size={16} />
              Entblocken
            </>
          ) : (
            <>
              <Shield size={16} />
              Blockieren
            </>
          )}
        </button>

        {/* Report Button */}
        <button className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-medium flex items-center justify-center gap-2 text-sm">
          <Flag size={16} />
          Nutzer melden
        </button>
      </div>

      {/* Block User Modal */}
      <BlockUserModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        userId={userId || ''}
        username={userData?.username || ''}
        displayName={userData?.displayName}
        isCurrentlyBlocked={userIsBlocked}
      />
    </div>
  );
};

// Helper function for month names
const getMonthName = (month: number): string => {
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  return months[month - 1] || '';
};

export default UserProfile;
