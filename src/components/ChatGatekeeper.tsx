import { useState } from 'react';
import { Eye, EyeOff, Shield, User, Lock, Sparkles, ChevronRight, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { ChatIdentityMode } from '@/types';

interface ChatGatekeeperProps {
  isOpen: boolean;
  onClose: () => void;
  onChoose: (mode: ChatIdentityMode) => void;
  chatType: 'dm' | 'lounge' | 'voice';
  targetName?: string;
}

const ChatGatekeeper = ({
  isOpen,
  onClose,
  onChoose,
  chatType,
  targetName = 'Chat',
}: ChatGatekeeperProps) => {
  const { user } = useStore();
  const [selectedMode, setSelectedMode] = useState<ChatIdentityMode | null>(null);
  const [rememberChoice, setRememberChoice] = useState(true);

  if (!isOpen) return null;

  const chatTypeLabels = {
    dm: 'Direktnachricht',
    lounge: 'Lounge',
    voice: 'Voice Chat',
  };

  const handleConfirm = () => {
    if (selectedMode) {
      onChoose(selectedMode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-synclulu-violet to-purple-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Identität wählen</h2>
              <p className="text-white/80 text-sm">
                Wie möchtest du {chatTypeLabels[chatType]} beitreten?
              </p>
            </div>
          </div>

          {targetName && (
            <div className="mt-2 px-3 py-1.5 bg-white/10 rounded-lg inline-block">
              <span className="text-sm">→ {targetName}</span>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="p-6 space-y-4">
          {/* Anonymous Option */}
          <button
            onClick={() => setSelectedMode('anonymous')}
            className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
              selectedMode === 'anonymous'
                ? 'border-synclulu-violet bg-synclulu-violet/5 shadow-lg scale-[1.02]'
                : 'border-gray-200 hover:border-synclulu-violet/50 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                selectedMode === 'anonymous'
                  ? 'bg-synclulu-violet text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                <EyeOff size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-lg text-synclulu-text">
                    Anonym
                  </h3>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold rounded-full">
                    EMPFOHLEN
                  </span>
                </div>
                <p className="text-sm text-synclulu-muted mt-1">
                  Dein Profilbild wird verschleiert und du erscheinst als
                  <span className="font-semibold text-synclulu-violet ml-1">
                    "{user?.anonymousAlias || 'Wanderer_' + Math.floor(Math.random() * 9999)}"
                  </span>
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Lock size={12} className="text-green-600" />
                  <span className="text-xs text-green-600 font-medium">
                    Echte Identität geschützt
                  </span>
                </div>
              </div>
              {selectedMode === 'anonymous' && (
                <div className="w-6 h-6 rounded-full bg-synclulu-violet flex items-center justify-center">
                  <Sparkles size={14} className="text-white" />
                </div>
              )}
            </div>
          </button>

          {/* Public Option */}
          <button
            onClick={() => setSelectedMode('public')}
            className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
              selectedMode === 'public'
                ? 'border-synclulu-violet bg-synclulu-violet/5 shadow-lg scale-[1.02]'
                : 'border-gray-200 hover:border-synclulu-violet/50 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                selectedMode === 'public'
                  ? 'bg-synclulu-violet text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  <User size={24} />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-lg text-synclulu-text">
                  Öffentlich
                </h3>
                <p className="text-sm text-synclulu-muted mt-1">
                  Du erscheinst als
                  <span className="font-semibold text-synclulu-text ml-1">
                    @{user?.username || 'dein_name'}
                  </span>
                  {' '}mit deinem echten Profilbild
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Eye size={12} className="text-amber-600" />
                  <span className="text-xs text-amber-600 font-medium">
                    Profil vollständig sichtbar
                  </span>
                </div>
              </div>
              {selectedMode === 'public' && (
                <div className="w-6 h-6 rounded-full bg-synclulu-violet flex items-center justify-center">
                  <Sparkles size={14} className="text-white" />
                </div>
              )}
            </div>
          </button>

          {/* Remember choice toggle */}
          <label className="flex items-center gap-3 py-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={rememberChoice}
                onChange={(e) => setRememberChoice(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-synclulu-violet transition-colors" />
              <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
            </div>
            <span className="text-sm text-synclulu-muted">
              Auswahl für diesen Chat merken (24h)
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <button
            onClick={handleConfirm}
            disabled={!selectedMode}
            className={`
              w-full py-4 px-6 rounded-2xl font-bold text-lg
              flex items-center justify-center gap-2
              transition-all duration-200
              ${selectedMode
                ? 'bg-gradient-to-r from-synclulu-violet to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {selectedMode === 'anonymous' ? (
              <>
                <EyeOff size={20} />
                Anonym beitreten
              </>
            ) : selectedMode === 'public' ? (
              <>
                <Eye size={20} />
                Öffentlich beitreten
              </>
            ) : (
              'Bitte wählen'
            )}
            {selectedMode && <ChevronRight size={20} />}
          </button>

          <p className="text-center text-xs text-synclulu-muted mt-4">
            Du kannst deine Identität jederzeit in den Einstellungen ändern
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatGatekeeper;
