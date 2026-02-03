import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Crown, Star, Zap, Eye, Shield, Users,
  Sparkles, Check, ChevronRight, X, Gift, Loader2,
  Wrench, Bell, MapPin, Mic
} from 'lucide-react';
import { SailorMascot, FloatingMascot } from '@/components/Mascots';
import { useTranslation } from '@/lib/i18n';

// MAINTENANCE MODE FLAG - Set to false when ready to enable payments
const MAINTENANCE_MODE = true;

interface PlanFeature {
  icon: React.ReactNode;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  isPremium: boolean;
}

const Premium = () => {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const [showNotifySuccess, setShowNotifySuccess] = useState(false);

  const isGerman = language === 'de';

  const features: PlanFeature[] = [
    {
      icon: <Zap size={20} />,
      title: '1.5x XP Boost',
      titleEn: '1.5x XP Boost',
      description: 'Verdiene 50% mehr XP bei jeder Aktivität',
      descriptionEn: 'Earn 50% more XP with every activity',
      isPremium: true,
    },
    {
      icon: <Star size={20} />,
      title: 'Unbegrenzte Sterne',
      titleEn: 'Unlimited Stars',
      description: 'Verschenke so viele Sterne wie du möchtest',
      descriptionEn: 'Gift as many stars as you want',
      isPremium: true,
    },
    {
      icon: <Eye size={20} />,
      title: 'Profilbesucher',
      titleEn: 'Profile Visitors',
      description: 'Sieh wer dein Profil besucht hat',
      descriptionEn: 'See who visited your profile',
      isPremium: true,
    },
    {
      icon: <Shield size={20} />,
      title: 'Erweiterte Privatsphäre',
      titleEn: 'Extended Privacy',
      description: 'Unsichtbarer Modus & Lesebestätigungen kontrollieren',
      descriptionEn: 'Invisible mode & control read receipts',
      isPremium: true,
    },
    {
      icon: <Users size={20} />,
      title: 'Exklusive Lounges',
      titleEn: 'Exclusive Lounges',
      description: 'Zugang zu Premium-Only Voice Lounges',
      descriptionEn: 'Access to Premium-Only Voice Lounges',
      isPremium: true,
    },
    {
      icon: <Crown size={20} />,
      title: 'Premium Badge',
      titleEn: 'Premium Badge',
      description: 'Zeige deinen Status mit einem goldenen Badge',
      descriptionEn: 'Show your status with a golden badge',
      isPremium: true,
    },
    {
      icon: <MapPin size={20} />,
      title: 'Erweiterter Suchradius',
      titleEn: 'Extended Search Radius',
      description: 'Finde Nutzer in bis zu 2km Entfernung',
      descriptionEn: 'Find users up to 2km away',
      isPremium: true,
    },
    {
      icon: <Mic size={20} />,
      title: 'HD Sprachqualität',
      titleEn: 'HD Voice Quality',
      description: 'Kristallklare Audioqualität in Voice Chats',
      descriptionEn: 'Crystal clear audio quality in voice chats',
      isPremium: true,
    },
  ];

  const handleNotify = () => {
    // In a real app, this would register the user for notifications
    setShowNotifySuccess(true);

    if ('vibrate' in navigator) {
      navigator.vibrate([30, 20, 50]);
    }

    setTimeout(() => {
      setShowNotifySuccess(false);
    }, 3000);
  };

  // MAINTENANCE MODE VIEW
  if (MAINTENANCE_MODE) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-white safe-top safe-bottom pb-24">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-500" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Navigation */}
          <div className="relative px-6 pt-4 pb-2 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          </div>

          {/* Hero */}
          <div className="relative px-6 pt-4 pb-12 text-white text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Crown size={40} className="text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">
              Catalyst Premium
            </h1>
            <p className="text-white/80 text-sm max-w-xs mx-auto">
              {isGerman
                ? 'Entfessle dein volles Potenzial mit exklusiven Features'
                : 'Unleash your full potential with exclusive features'}
            </p>

            {/* Floating particles */}
            <div className="absolute top-8 left-8 w-3 h-3 bg-white/30 rounded-full animate-ping" />
            <div className="absolute top-16 right-12 w-2 h-2 bg-white/20 rounded-full animate-bounce" />
          </div>
        </div>

        {/* Maintenance Notice */}
        <div className="px-6 -mt-6 mb-6">
          <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
              <Wrench size={36} className="text-amber-600" />
            </div>
            <h2 className="font-display font-bold text-xl text-gray-900 mb-2">
              {isGerman ? 'Wartungsarbeiten' : 'Under Maintenance'}
            </h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              {isGerman
                ? 'Wir arbeiten an etwas Großartigem! Premium kommt bald zurück mit noch besseren Features.'
                : 'We\'re working on something great! Premium is coming back soon with even better features.'}
            </p>

            {/* Mascot */}
            <div className="mb-6">
              <FloatingMascot delay={0}>
                <SailorMascot size={120} className="mx-auto" />
              </FloatingMascot>
            </div>

            {/* Notify Button */}
            {!showNotifySuccess ? (
              <button
                onClick={handleNotify}
                className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
              >
                <Bell size={20} />
                {isGerman ? 'Benachrichtigen wenn verfügbar' : 'Notify me when available'}
              </button>
            ) : (
              <div className="py-4 bg-green-100 text-green-700 font-semibold rounded-2xl flex items-center justify-center gap-2">
                <Check size={20} />
                {isGerman ? 'Du wirst benachrichtigt!' : 'You\'ll be notified!'}
              </div>
            )}

            <p className="text-xs text-gray-400 mt-4">
              {isGerman ? 'Vielen Dank für deine Geduld 💜' : 'Thank you for your patience 💜'}
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="px-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={20} className="text-amber-500" />
            <h2 className="font-display font-bold text-lg text-gray-900">
              {isGerman ? 'Geplante Features' : 'Upcoming Features'}
            </h2>
          </div>

          <div className="space-y-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {isGerman ? feature.title : feature.titleEn}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {isGerman ? feature.description : feature.descriptionEn}
                  </p>
                </div>
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Crown size={12} className="text-amber-600" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className="px-6 pb-8">
          <div className="bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl p-5 text-center">
            <p className="font-semibold text-violet-700 mb-1">
              {isGerman ? '🚀 Bald verfügbar' : '🚀 Coming Soon'}
            </p>
            <p className="text-sm text-violet-600/80">
              {isGerman
                ? 'Apple Pay • Google Pay • Kreditkarte'
                : 'Apple Pay • Google Pay • Credit Card'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // NORMAL VIEW (when MAINTENANCE_MODE = false)
  // ... [Keep the rest of the original Premium page code here for when payments are ready]

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 safe-top safe-bottom pb-24">
      {/* This is a placeholder - the full payment flow code would go here */}
      <div className="px-6 pt-12 text-center">
        <p>Payment system ready</p>
      </div>
    </div>
  );
};

export default Premium;
