import { MapPin, MessageCircle, EyeOff, User } from 'lucide-react';
import { NearbyUser } from '@/types';
import { formatDistance } from '@/hooks/useLocation';

interface UserCardProps {
  user: NearbyUser;
}

const UserCard = ({ user }: UserCardProps) => {
  const isAnonymous = user.visibilityMode === 'anonymous';
  const avatarUrl = (user as any).avatarUrl;
  const displayName = user.displayName || user.username || '';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="glass-card p-4 flex items-center gap-4">
      {/* Avatar */}
      <div className="relative">
        {isAnonymous ? (
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-500">
            <EyeOff size={24} className="text-white" />
          </div>
        ) : avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="w-14 h-14 rounded-xl object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold">
            {initials || <User size={24} />}
          </div>
        )}
        {/* Online indicator */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-delulu-text truncate">
            {isAnonymous ? 'Anonym' : user.displayName || user.username}
          </p>
          {isAnonymous && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded-full">
              Anonym
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-delulu-muted">
            <MapPin size={12} />
            {formatDistance(user.distance)}
          </span>
          <span className="text-xs text-delulu-muted">
            Aktiv vor {getTimeAgo(user.lastSeen)}
          </span>
        </div>
      </div>

      {/* Action */}
      <button className="w-10 h-10 rounded-xl bg-delulu-violet/10 flex items-center justify-center text-delulu-violet hover:bg-delulu-violet hover:text-white transition-colors">
        <MessageCircle size={18} />
      </button>
    </div>
  );
};

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'gerade eben';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} Min`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} Std`;
  return `${Math.floor(seconds / 86400)} Tagen`;
}

export default UserCard;
