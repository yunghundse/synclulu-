import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, UserPlus, Star, Users, Bell, Check } from 'lucide-react';
import { useNotifications, AppNotification } from '@/contexts/NotificationContext';

const NotificationToast = () => {
  const navigate = useNavigate();
  const { currentToast, clearToast, markAsRead } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (currentToast) {
      setIsVisible(true);
      setIsLeaving(false);
    }
  }, [currentToast]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      clearToast();
    }, 300);
  };

  const handleClick = () => {
    if (!currentToast) return;

    markAsRead(currentToast.id);

    // Navigate based on notification type
    switch (currentToast.type) {
      case 'friend_request':
        navigate('/notifications');
        break;
      case 'friend_accepted':
        if (currentToast.fromUserId) {
          navigate(`/user/${currentToast.fromUserId}`);
        }
        break;
      case 'star_received':
        navigate('/profile');
        break;
      case 'room_invite':
        navigate('/discover');
        break;
      default:
        navigate('/notifications');
    }

    handleClose();
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus size={24} className="text-synclulu-violet" />;
      case 'friend_accepted':
        return <Check size={24} className="text-green-500" />;
      case 'star_received':
        return <Star size={24} className="text-amber-500" />;
      case 'room_invite':
        return <Users size={24} className="text-blue-500" />;
      default:
        return <Bell size={24} className="text-synclulu-violet" />;
    }
  };

  const getGradient = (type: AppNotification['type']) => {
    switch (type) {
      case 'friend_request':
        return 'from-purple-500/10 to-pink-500/10 border-purple-200';
      case 'friend_accepted':
        return 'from-green-500/10 to-emerald-500/10 border-green-200';
      case 'star_received':
        return 'from-amber-500/10 to-yellow-500/10 border-amber-200';
      case 'room_invite':
        return 'from-blue-500/10 to-cyan-500/10 border-blue-200';
      default:
        return 'from-gray-500/10 to-gray-400/10 border-gray-200';
    }
  };

  if (!currentToast || !isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] px-4 pt-safe-top pointer-events-none">
      <div
        className={`mt-4 pointer-events-auto transform transition-all duration-300 ease-out ${
          isLeaving ? 'translate-y-[-100%] opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <div
          onClick={handleClick}
          className={`bg-gradient-to-r ${getGradient(currentToast.type)} backdrop-blur-lg rounded-2xl p-4 shadow-lg border cursor-pointer active:scale-[0.98] transition-transform`}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
              {getIcon(currentToast.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-synclulu-text text-sm">
                {currentToast.title}
              </p>
              <p className="text-sm text-synclulu-muted mt-0.5 line-clamp-2">
                {currentToast.message}
              </p>
              <p className="text-xs text-synclulu-violet mt-1 font-medium">
                Tippe zum Ansehen →
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-synclulu-violet rounded-full animate-shrink"
              style={{ animationDuration: '5s' }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shrink {
          animation: shrink linear forwards;
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;
