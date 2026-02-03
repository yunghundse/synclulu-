import { useState } from 'react';
import { UserPlus, UserMinus, Users, Check, Loader2 } from 'lucide-react';

interface FollowButtonProps {
  userId: string;
  username: string;
  isFollowing: boolean;
  isFollowedBy: boolean;
  onFollow: (userId: string) => Promise<void>;
  onUnfollow: (userId: string) => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
}

const FollowButton = ({
  userId,
  username: _username,
  isFollowing,
  isFollowedBy,
  onFollow,
  onUnfollow,
  size = 'md',
}: FollowButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showUnfollow, setShowUnfollow] = useState(false);

  const isMutual = isFollowing && isFollowedBy;

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        await onUnfollow(userId);
      } else {
        await onFollow(userId);
      }

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(isFollowing ? 10 : [20, 10, 20]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  // Not following
  if (!isFollowing) {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          flex items-center font-semibold rounded-xl
          bg-delulu-violet text-white
          hover:bg-delulu-violet-dark active:scale-95
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]}
        `}
      >
        {isLoading ? (
          <Loader2 size={iconSizes[size]} className="animate-spin" />
        ) : (
          <UserPlus size={iconSizes[size]} />
        )}
        <span>{isFollowedBy ? 'Zurückfolgen' : 'Folgen'}</span>
      </button>
    );
  }

  // Already following
  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      onMouseEnter={() => setShowUnfollow(true)}
      onMouseLeave={() => setShowUnfollow(false)}
      className={`
        flex items-center font-semibold rounded-xl
        border-2 transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${showUnfollow
          ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
          : isMutual
            ? 'border-green-300 bg-green-50 text-green-700'
            : 'border-delulu-violet/30 bg-delulu-violet/5 text-delulu-violet'
        }
        ${sizeClasses[size]}
      `}
    >
      {isLoading ? (
        <Loader2 size={iconSizes[size]} className="animate-spin" />
      ) : showUnfollow ? (
        <UserMinus size={iconSizes[size]} />
      ) : isMutual ? (
        <Users size={iconSizes[size]} />
      ) : (
        <Check size={iconSizes[size]} />
      )}
      <span>
        {showUnfollow
          ? 'Entfolgen'
          : isMutual
            ? 'Gegenseitig'
            : 'Folgst du'
        }
      </span>
    </button>
  );
};

export default FollowButton;
