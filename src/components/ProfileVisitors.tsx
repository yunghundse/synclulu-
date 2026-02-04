/**
 * PROFILE VISITORS SECTION
 * Zeigt an, wer das Profil besucht hat
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Clock, Ghost, ChevronRight, Users, User } from 'lucide-react';
import {
  getProfileVisitors,
  getVisitorStats,
  ProfileVisit,
  VisitorStats,
  formatLastSeen,
} from '@/lib/presenceSystem';

interface ProfileVisitorsProps {
  userId: string;
  isOwnProfile?: boolean;
  compact?: boolean;
}

const ProfileVisitors = ({
  userId,
  isOwnProfile = false,
  compact = false,
}: ProfileVisitorsProps) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [visitors, setVisitors] = useState<ProfileVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const loadVisitors = async () => {
      setIsLoading(true);

      const [visitorStats, recentVisitors] = await Promise.all([
        getVisitorStats(userId),
        getProfileVisitors(userId, 20),
      ]);

      setStats(visitorStats);
      setVisitors(recentVisitors);
      setIsLoading(false);
    };

    loadVisitors();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-xl" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalVisits === 0) {
    return (
      <div className="glass-card rounded-2xl p-4 text-center">
        <Eye size={24} className="mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-synclulu-muted">Noch keine Besucher</p>
      </div>
    );
  }

  const displayVisitors = showAll ? visitors : visitors.slice(0, compact ? 3 : 5);

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Eye size={20} className="text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold text-synclulu-text">Wolken-Besucher</h3>
              <p className="text-xs text-synclulu-muted">
                {stats.todayVisits} heute • {stats.totalVisits} gesamt
              </p>
            </div>
          </div>

          {/* Stats Pills */}
          <div className="flex gap-2">
            <div className="px-2 py-1 bg-white rounded-full text-xs font-medium text-purple-600">
              {stats.uniqueVisitors} Unique
            </div>
          </div>
        </div>
      </div>

      {/* Visitors List */}
      <div className="p-4">
        {displayVisitors.length > 0 ? (
          <div className="space-y-3">
            {displayVisitors.map((visit) => (
              <button
                key={visit.id}
                onClick={() => !visit.isAnonymous && navigate(`/user/${visit.visitorId}`)}
                disabled={visit.isAnonymous}
                className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors ${
                  visit.isAnonymous
                    ? 'opacity-70 cursor-default'
                    : 'hover:bg-gray-50'
                }`}
              >
                {/* Avatar */}
                <div className="relative">
                  {visit.isAnonymous ? (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Ghost size={20} className="text-gray-400" />
                    </div>
                  ) : (visit as any).visitorAvatarUrl ? (
                    <img
                      src={(visit as any).visitorAvatarUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {visit.visitorUsername?.charAt(0).toUpperCase() || <User size={16} />}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-synclulu-text truncate">
                    {visit.isAnonymous ? 'Jemand Mysteriöses' : visit.visitorUsername}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-synclulu-muted">
                    <Clock size={12} />
                    <span>{formatLastSeen(visit.visitedAt)}</span>
                  </div>
                </div>

                {/* Arrow */}
                {!visit.isAnonymous && (
                  <ChevronRight size={16} className="text-gray-300" />
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <Users size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-synclulu-muted">Keine Besucher anzeigbar</p>
          </div>
        )}

        {/* Show More Button */}
        {!showAll && visitors.length > (compact ? 3 : 5) && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full mt-4 py-2 text-sm text-purple-500 font-medium hover:bg-purple-50 rounded-xl transition-colors"
          >
            Alle {visitors.length} Besucher anzeigen
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Compact visitor notification toast
 */
export const VisitorNotificationToast = ({
  visitorUsername,
  visitorAvatarUrl,
  isAnonymous,
  onClose,
  onClick,
}: {
  visitorUsername: string;
  visitorAvatarUrl?: string | null;
  isAnonymous: boolean;
  onClose: () => void;
  onClick?: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <button
      onClick={onClick}
      className="fixed top-4 left-4 right-4 z-50 bg-white rounded-2xl shadow-2xl p-4 flex items-center gap-4 animate-slide-down"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {isAnonymous ? (
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
            <Ghost size={24} className="text-purple-400" />
          </div>
        ) : visitorAvatarUrl ? (
          <img src={visitorAvatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {visitorUsername?.charAt(0).toUpperCase() || <User size={20} />}
          </div>
        )}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
          <Eye size={12} className="text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 text-left">
        <p className="font-semibold text-synclulu-text">Wolken-Besuch ✨</p>
        <p className="text-sm text-synclulu-muted">
          {isAnonymous
            ? 'Jemand hat einen Blick in deine Wolke geworfen...'
            : `${visitorUsername} hat dein Profil besucht`}
        </p>
      </div>

      {/* Close indicator */}
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
        <ChevronRight size={16} className="text-gray-400" />
      </div>
    </button>
  );
};

export default ProfileVisitors;
