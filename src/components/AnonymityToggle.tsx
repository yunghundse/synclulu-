import { useState } from 'react';
import { Eye, EyeOff, Shield, AlertTriangle, Info } from 'lucide-react';
import { useStore } from '@/lib/store';

interface AnonymityToggleProps {
  compact?: boolean;
  showDescription?: boolean;
  onToggle?: (isAnonymous: boolean) => void;
}

const AnonymityToggle = ({
  compact = false,
  showDescription = true,
  onToggle,
}: AnonymityToggleProps) => {
  const { user } = useStore();
  const [isAnonymous, setIsAnonymous] = useState(user?.isGlobalAnonymous || false);
  const [showInfo, setShowInfo] = useState(false);

  const handleToggle = () => {
    const newState = !isAnonymous;
    setIsAnonymous(newState);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(newState ? [30, 20, 30] : 10);
    }

    onToggle?.(newState);
  };

  // Compact version for header/navbar
  if (compact) {
    return (
      <button
        onClick={handleToggle}
        className={`
          relative flex items-center gap-2 px-3 py-2 rounded-xl
          transition-all duration-300
          ${isAnonymous
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-gray-100 text-gray-600 border border-gray-200'
          }
        `}
      >
        <div className={`
          w-6 h-6 rounded-lg flex items-center justify-center
          ${isAnonymous ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}
        `}>
          {isAnonymous ? <EyeOff size={14} /> : <Eye size={14} />}
        </div>
        <span className="text-xs font-semibold">
          {isAnonymous ? 'Anonym' : 'Sichtbar'}
        </span>
      </button>
    );
  }

  // Full version for settings
  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`
            w-12 h-12 rounded-2xl flex items-center justify-center
            ${isAnonymous
              ? 'bg-gradient-to-br from-green-400 to-emerald-500'
              : 'bg-gray-200'
            }
          `}>
            <Shield size={24} className={isAnonymous ? 'text-white' : 'text-gray-500'} />
          </div>
          <div>
            <h3 className="font-display font-bold text-synclulu-text">
              Globale Anonymität
            </h3>
            <p className="text-xs text-synclulu-muted">
              {isAnonymous ? 'Dein Profil ist geschützt' : 'Du bist sichtbar'}
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          onClick={handleToggle}
          className={`
            relative w-16 h-9 rounded-full transition-colors duration-300
            ${isAnonymous ? 'bg-green-500' : 'bg-gray-300'}
          `}
        >
          <div className={`
            absolute top-1 w-7 h-7 rounded-full bg-white shadow-md
            flex items-center justify-center
            transition-all duration-300
            ${isAnonymous ? 'left-8' : 'left-1'}
          `}>
            {isAnonymous ? (
              <EyeOff size={14} className="text-green-500" />
            ) : (
              <Eye size={14} className="text-gray-400" />
            )}
          </div>
        </button>
      </div>

      {/* Status indicator */}
      <div className={`
        flex items-center gap-3 p-4 rounded-2xl mb-4
        ${isAnonymous
          ? 'bg-green-50 border border-green-200'
          : 'bg-amber-50 border border-amber-200'
        }
      `}>
        {isAnonymous ? (
          <>
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <EyeOff size={20} className="text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-800 text-sm">
                Anonymer Modus aktiv
              </p>
              <p className="text-xs text-green-600">
                Du erscheinst als "{user?.anonymousAlias || 'Wanderer_' + Math.floor(Math.random() * 9999)}"
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-800 text-sm">
                Öffentlicher Modus
              </p>
              <p className="text-xs text-amber-600">
                Andere sehen @{user?.username || 'dein_name'} und dein Profilbild
              </p>
            </div>
          </>
        )}
      </div>

      {/* Description */}
      {showDescription && (
        <div className="space-y-3">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="flex items-center gap-2 text-sm text-synclulu-violet hover:underline"
          >
            <Info size={14} />
            Was bedeutet das?
          </button>

          {showInfo && (
            <div className="p-4 bg-synclulu-soft/50 rounded-xl text-sm text-synclulu-muted space-y-2 animate-in slide-in-from-top-2">
              <p><strong>🔒 Wenn aktiv:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Dein Profilbild wird auf der Karte verschleiert</li>
                <li>Andere sehen nur deinen anonymen Alias</li>
                <li>Dein @handle bleibt verborgen</li>
                <li>Du kannst trotzdem Sterne erhalten</li>
              </ul>

              <p className="mt-3"><strong>👁️ Wenn deaktiviert:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Dein echtes Profilbild ist sichtbar</li>
                <li>Andere sehen deinen @handle</li>
                <li>Dein Level-Badge ist sichtbar</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      <div className="mt-4 pt-4 border-t border-synclulu-soft">
        <p className="text-xs text-synclulu-muted mb-3">Vorschau auf der Karte:</p>
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
          {/* Avatar preview */}
          <div className="relative">
            <div className={`
              w-14 h-14 rounded-2xl overflow-hidden
              ${isAnonymous ? 'blur-md' : ''}
            `}>
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-synclulu-violet flex items-center justify-center text-white text-xl">
                  {user?.displayName?.charAt(0) || '?'}
                </div>
              )}
            </div>
            {isAnonymous && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center">
                  <EyeOff size={20} className="text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Info preview */}
          <div>
            <p className="font-semibold text-synclulu-text">
              {isAnonymous
                ? user?.anonymousAlias || 'Wanderer_' + Math.floor(Math.random() * 9999)
                : user?.displayName || 'Dein Name'
              }
            </p>
            <p className="text-xs text-synclulu-muted">
              {isAnonymous ? '🔒 Geschützt' : `@${user?.username || 'handle'}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnonymityToggle;
