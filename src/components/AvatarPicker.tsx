import { useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

// synclulu-style avatar options with actual images
const AVATARS = [
  { id: 'pegasus', image: '/avatars/pegasus.png', name: 'Pegasus' },
  { id: 'sailor-boy', image: '/avatars/sailor-boy.png', name: 'Sailor Boy' },
  { id: 'sailor-girl', image: '/avatars/sailor-girl.png', name: 'Sailor Girl' },
  { id: 'sailor-boy-2', image: '/avatars/sailor-boy-2.png', name: 'Sailor Shy' },
];

interface AvatarPickerProps {
  selectedAvatar: string;
  onSelect: (avatarId: string) => void;
  onClose: () => void;
}

const AvatarPicker = ({ selectedAvatar, onSelect, onClose }: AvatarPickerProps) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(selectedAvatar);

  const handleSave = () => {
    onSelect(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="font-display text-xl font-bold text-synclulu-text">
            {t('avatar.title')}
          </h2>
          <p className="text-sm text-synclulu-muted">
            {t('avatar.subtitle')}
          </p>
        </div>

        {/* Avatar Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {AVATARS.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => setSelected(avatar.id)}
              className={`relative aspect-square rounded-2xl bg-gradient-to-br from-synclulu-soft to-white p-2 transition-all ${
                selected === avatar.id
                  ? 'scale-105 ring-4 ring-synclulu-violet ring-offset-2 shadow-lg'
                  : 'hover:scale-102 hover:shadow-md'
              }`}
            >
              <img
                src={avatar.image}
                alt={avatar.name}
                className="w-full h-full object-contain"
              />
              {selected === avatar.id && (
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-synclulu-violet rounded-full flex items-center justify-center shadow-lg">
                  <Check size={16} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Selected Info */}
        <div className="text-center mb-6">
          <p className="text-sm text-synclulu-muted">
            {t('avatar.selected')}: <span className="font-semibold text-synclulu-text">
              {AVATARS.find(a => a.id === selected)?.name}
            </span>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-synclulu-soft font-semibold text-synclulu-muted"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl btn-primary text-white font-semibold"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper component for displaying avatars
export const Avatar = ({
  avatarId,
  size = 'md',
  className = ''
}: {
  avatarId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) => {
  const avatar = AVATARS.find(a => a.id === avatarId) || AVATARS[0]; // Default to pegasus

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24',
  };

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br from-synclulu-soft to-white flex items-center justify-center p-1 ${sizeClasses[size]} ${className}`}
    >
      <img
        src={avatar.image}
        alt={avatar.name}
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export { AVATARS };
export default AvatarPicker;
