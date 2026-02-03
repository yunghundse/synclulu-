import { useState, useEffect } from 'react';
import { Eye, EyeOff, Shield, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface HeaderAnonymToggleProps {
  onToggle?: (isAnonymous: boolean) => void;
}

const HeaderAnonymToggle = ({ onToggle }: HeaderAnonymToggleProps) => {
  const { user, setUser } = useStore();
  const [isAnonymous, setIsAnonymous] = useState(user?.isGlobalAnonymous || false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with user state when it changes (e.g., on login)
  useEffect(() => {
    if (user?.isGlobalAnonymous !== undefined) {
      setIsAnonymous(user.isGlobalAnonymous);
    }
  }, [user?.isGlobalAnonymous]);

  const handleToggle = async () => {
    if (!user?.id || isSaving) return;

    const newState = !isAnonymous;
    setIsAnonymous(newState);
    setIsSaving(true);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(newState ? [20, 10, 20] : 10);
    }

    try {
      // Persist to Firestore
      await updateDoc(doc(db, 'users', user.id), {
        isGlobalAnonymous: newState,
        lastAnonymityChange: new Date(),
      });

      // Update local store
      setUser({
        ...user,
        isGlobalAnonymous: newState,
      });

      onToggle?.(newState);
    } catch (error) {
      console.error('Failed to save anonymity mode:', error);
      // Revert on error
      setIsAnonymous(!newState);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative flex items-center gap-3">
      {/* Avatar with anonymity effect */}
      <div className="relative">
        <div
          className={`
            w-12 h-12 rounded-2xl overflow-hidden transition-all duration-300
            ${isAnonymous
              ? 'ring-2 ring-green-400 ring-offset-2 shadow-lg shadow-green-400/30'
              : 'ring-1 ring-gray-200'
            }
          `}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className={`w-full h-full object-cover transition-all duration-300 ${
                isAnonymous ? 'blur-md scale-110' : ''
              }`}
            />
          ) : (
            <div className={`
              w-full h-full bg-gradient-to-br from-delulu-violet to-purple-600
              flex items-center justify-center text-white text-xl font-bold
              transition-all duration-300
              ${isAnonymous ? 'blur-sm' : ''}
            `}>
              {user?.displayName?.charAt(0) || '?'}
            </div>
          )}

          {/* Anonymity overlay */}
          {isAnonymous && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Shield size={20} className="text-white drop-shadow-lg" />
            </div>
          )}
        </div>

        {/* Status indicator */}
        <div
          className={`
            absolute -bottom-1 -right-1 w-5 h-5 rounded-full
            flex items-center justify-center
            transition-all duration-300
            ${isAnonymous
              ? 'bg-green-500 shadow-lg shadow-green-500/50'
              : 'bg-gray-400'
            }
          `}
        >
          {isAnonymous ? (
            <EyeOff size={10} className="text-white" />
          ) : (
            <Eye size={10} className="text-white" />
          )}
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={handleToggle}
        disabled={isSaving}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          relative flex items-center gap-2 px-3 py-2 rounded-xl
          font-semibold text-sm transition-all duration-300
          disabled:opacity-70
          ${isAnonymous
            ? 'bg-green-100 text-green-700 border border-green-200 shadow-sm'
            : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-50'
          }
        `}
      >
        {isSaving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <div className={`
            relative w-8 h-5 rounded-full transition-colors duration-300
            ${isAnonymous ? 'bg-green-500' : 'bg-gray-300'}
          `}>
            <div className={`
              absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm
              transition-transform duration-300
              ${isAnonymous ? 'left-3.5' : 'left-0.5'}
            `} />
          </div>
        )}
        <span className="hidden sm:inline">
          {isAnonymous ? 'Anonym' : 'Sichtbar'}
        </span>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-xl z-50 w-48 animate-in fade-in slide-in-from-top-2">
          <p className="font-semibold mb-1">
            {isAnonymous ? '🔒 Anonymer Modus' : '👁️ Sichtbarer Modus'}
          </p>
          <p className="text-gray-300">
            {isAnonymous
              ? 'Dein Profilbild ist verschleiert. Andere sehen nur deinen Alias.'
              : 'Dein Profil ist vollständig sichtbar für andere User.'}
          </p>
          <p className="text-gray-400 text-[10px] mt-2">
            Diese Einstellung bleibt gespeichert
          </p>
        </div>
      )}
    </div>
  );
};

export default HeaderAnonymToggle;
