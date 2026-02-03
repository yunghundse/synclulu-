/**
 * PRIVACY SETTINGS COMPONENT
 * Incognito Mode & Visibility Settings
 */

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Ghost, Users, Bell, Shield, Sparkles, Check } from 'lucide-react';
import { useStore } from '@/lib/store';
import { setIncognitoMode } from '@/lib/presenceSystem';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isPremium?: boolean;
}

const PrivacySettings = () => {
  const { user } = useStore();
  const [settings, setSettings] = useState({
    isIncognito: false,
    showOnlineStatus: true,
    showProfileVisitors: true,
    allowProfileVisits: true,
    showLastSeen: true,
    notifyOnVisit: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  // Load settings
  useEffect(() => {
    if (!user?.id) return;

    const loadSettings = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setSettings({
            isIncognito: data.isIncognito || false,
            showOnlineStatus: data.showOnlineStatus !== false,
            showProfileVisitors: data.showProfileVisitors !== false,
            allowProfileVisits: data.allowProfileVisits !== false,
            showLastSeen: data.showLastSeen !== false,
            notifyOnVisit: data.notifyOnVisit !== false,
          });
        }
      } catch (error) {
        console.error('Error loading privacy settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user?.id]);

  const handleToggle = async (key: keyof typeof settings) => {
    if (!user?.id) return;

    const newValue = !settings[key];
    setIsSaving(key);

    try {
      // Special handling for incognito mode
      if (key === 'isIncognito') {
        await setIncognitoMode(user.id, newValue);
      }

      // Update user document
      await updateDoc(doc(db, 'users', user.id), {
        [key]: newValue,
      });

      setSettings(prev => ({ ...prev, [key]: newValue }));
    } catch (error) {
      console.error('Error updating setting:', error);
    } finally {
      setIsSaving(null);
    }
  };

  const privacyOptions: PrivacySetting[] = [
    {
      id: 'isIncognito',
      title: 'Inkognito-Modus',
      description: 'Besuche Profile unsichtbar. Andere sehen dich nicht.',
      icon: <Ghost size={20} className="text-purple-500" />,
    },
    {
      id: 'showOnlineStatus',
      title: 'Online-Status anzeigen',
      description: 'Andere können sehen, wenn du online bist.',
      icon: <Eye size={20} className="text-green-500" />,
    },
    {
      id: 'showProfileVisitors',
      title: 'Profilbesucher anzeigen',
      description: 'Sieh, wer dein Profil besucht hat.',
      icon: <Users size={20} className="text-blue-500" />,
    },
    {
      id: 'allowProfileVisits',
      title: 'Besuche erlauben',
      description: 'Erlaube anderen, dass sie in deinen Besuchern erscheinen.',
      icon: <Shield size={20} className="text-violet-500" />,
    },
    {
      id: 'showLastSeen',
      title: '"Zuletzt gesehen" anzeigen',
      description: 'Zeige an, wann du zuletzt aktiv warst.',
      icon: <EyeOff size={20} className="text-gray-500" />,
    },
    {
      id: 'notifyOnVisit',
      title: 'Bei Besuch benachrichtigen',
      description: 'Erhalte eine Benachrichtigung bei Profilbesuchern.',
      icon: <Bell size={20} className="text-amber-500" />,
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Incognito Banner when active */}
      {settings.isIncognito && (
        <div className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 rounded-2xl p-4 flex items-center gap-3 border border-purple-200">
          <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
            <Ghost size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-purple-900">Inkognito aktiv</h4>
            <p className="text-sm text-purple-600">Du bist unsichtbar unterwegs</p>
          </div>
          <Sparkles size={20} className="text-purple-400" />
        </div>
      )}

      {/* Privacy Options */}
      <div className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-100">
        {privacyOptions.map((option) => (
          <div
            key={option.id}
            className="p-4 flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
              {option.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900">{option.title}</h4>
                {option.isPremium && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-xs font-medium rounded-full">
                    Premium
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{option.description}</p>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={() => handleToggle(option.id as keyof typeof settings)}
              disabled={isSaving === option.id}
              className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                settings[option.id as keyof typeof settings]
                  ? 'bg-purple-500'
                  : 'bg-gray-200'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300 flex items-center justify-center ${
                  settings[option.id as keyof typeof settings]
                    ? 'left-7'
                    : 'left-1'
                }`}
              >
                {isSaving === option.id ? (
                  <div className="w-3 h-3 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                ) : settings[option.id as keyof typeof settings] ? (
                  <Check size={12} className="text-purple-500" />
                ) : null}
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Info Text */}
      <p className="text-xs text-gray-400 text-center px-4">
        Deine Privatsphäre ist uns wichtig. Diese Einstellungen gelten sofort.
      </p>
    </div>
  );
};

export default PrivacySettings;
