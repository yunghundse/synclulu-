/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MAGICAL ONBOARDING - Operation "First Contact" v15.0
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Onboarding that feels like an initiation, not registration:
 * 1. First Star Moment - Gift the user their first star
 * 2. Aura-Scan - Beautiful location permission flow
 * 3. Profile Setup - Liquid blob transformation
 * 4. Safety Promise - Aegis/Sanctuary intro
 * 5. First Cloud - Direct recommendation
 *
 * @version 15.0.0 - Apple CXO × Tinder Growth Edition
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, Shield, Cloud, Sparkles, Check, ChevronRight, Camera, Lock } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
  userName?: string;
}

interface OnboardingData {
  hasAcceptedTerms: boolean;
  hasLocationPermission: boolean;
  profileImageUrl?: string;
  firstStarReceived: boolean;
}

type OnboardingStep =
  | 'welcome'
  | 'first-star'
  | 'aura-scan'
  | 'profile-setup'
  | 'safety-promise'
  | 'first-cloud';

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED STAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const FallingStar = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<'falling' | 'landed' | 'absorbed'>('falling');

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('landed'), 2000);
    const timer2 = setTimeout(() => setPhase('absorbed'), 3000);
    const timer3 = setTimeout(onComplete, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className="relative w-full h-64 overflow-hidden">
      {/* Star trail */}
      <motion.div
        className="absolute"
        initial={{ x: '80%', y: '-20%', opacity: 0 }}
        animate={
          phase === 'falling'
            ? { x: '40%', y: '60%', opacity: [0, 1, 1, 0.8] }
            : phase === 'landed'
            ? { scale: [1, 1.5, 1], opacity: 1 }
            : { scale: 0, opacity: 0 }
        }
        transition={{
          duration: phase === 'falling' ? 2 : 1,
          ease: phase === 'falling' ? 'easeIn' : 'easeOut',
        }}
      >
        {/* Star glow */}
        <motion.div
          className="absolute w-32 h-32 -translate-x-1/2 -translate-y-1/2"
          style={{
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 1, repeat: Infinity }}
        />

        {/* Star icon */}
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <Star
            size={48}
            className="text-yellow-400"
            fill="currentColor"
            style={{ filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))' }}
          />
        </motion.div>
      </motion.div>

      {/* Sparkle trail */}
      {phase === 'falling' && (
        <>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              initial={{
                x: `${80 - i * 5}%`,
                y: `${-20 + i * 10}%`,
                opacity: 0,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                repeat: 3,
              }}
              style={{
                filter: 'blur(1px)',
              }}
            />
          ))}
        </>
      )}

      {/* Impact effect */}
      {phase === 'landed' && (
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <div
            className="w-32 h-32 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.6) 0%, transparent 70%)',
            }}
          />
        </motion.div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// AURA SCAN ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

const AuraScan = ({
  onPermissionGranted,
  nearbyCount,
}: {
  onPermissionGranted: () => void;
  nearbyCount: number;
}) => {
  const [isScanning, setIsScanning] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  const requestLocation = async () => {
    try {
      const result = await navigator.geolocation.getCurrentPosition(
        () => {
          setHasPermission(true);
          setIsScanning(false);
          onPermissionGranted();
        },
        () => {
          setIsScanning(false);
        },
        { enableHighAccuracy: true }
      );
    } catch (error) {
      setIsScanning(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Radar animation */}
      <div className="relative w-48 h-48">
        {/* Base circle */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
            border: '2px solid rgba(139, 92, 246, 0.3)',
          }}
        />

        {/* Scanning wave */}
        {isScanning && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full"
                style={{
                  border: '2px solid rgba(139, 92, 246, 0.5)',
                }}
                initial={{ scale: 0.3, opacity: 0.8 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{
                  duration: 2,
                  delay: i * 0.6,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            ))}

            {/* Sweep line */}
            <motion.div
              className="absolute left-1/2 top-1/2 w-1/2 h-0.5 origin-left"
              style={{
                background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.8), transparent)',
              }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </>
        )}

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={hasPermission ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            <MapPin
              size={32}
              className={hasPermission ? 'text-green-400' : 'text-purple-400'}
            />
          </motion.div>
        </div>

        {/* Nearby dots (when permission granted) */}
        {hasPermission && (
          <>
            {[...Array(Math.min(nearbyCount, 8))].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-purple-400 rounded-full"
                style={{
                  left: `${50 + 30 * Math.cos((i * 2 * Math.PI) / 8)}%`,
                  top: `${50 + 30 * Math.sin((i * 2 * Math.PI) / 8)}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              />
            ))}
          </>
        )}
      </div>

      {/* Status text */}
      <motion.p
        className="mt-6 text-center text-lg"
        key={hasPermission ? 'found' : 'searching'}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {hasPermission ? (
          <span className="text-purple-300">
            <span className="font-bold text-white">{nearbyCount}</span> Personen
            schweben gerade in deiner Nähe
          </span>
        ) : isScanning ? (
          <span className="text-gray-400">Suche deine lokale Aura...</span>
        ) : (
          <span className="text-gray-400">Standort wird benötigt</span>
        )}
      </motion.p>

      {/* Permission button */}
      {!hasPermission && (
        <motion.button
          className="mt-6 px-6 py-3 rounded-2xl font-medium"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={requestLocation}
        >
          <span className="text-white">Aura aktivieren</span>
        </motion.button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const WelcomeStep = ({ userName, onNext }: { userName: string; onNext: () => void }) => (
  <motion.div
    className="flex flex-col items-center text-center"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    <motion.div
      className="mb-8"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      <Cloud size={80} className="text-purple-400" />
    </motion.div>

    <h1 className="text-3xl font-bold text-white mb-4">
      Willkommen, {userName || 'Träumer'} ✨
    </h1>

    <p className="text-gray-400 max-w-sm mb-8">
      Du bist dabei, Teil einer magischen Community zu werden.
      Lass uns deine Reise beginnen.
    </p>

    <motion.button
      className="px-8 py-4 rounded-2xl font-bold text-lg"
      style={{
        background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
      }}
      whileHover={{ scale: 1.05, boxShadow: '0 12px 40px rgba(139, 92, 246, 0.5)' }}
      whileTap={{ scale: 0.95 }}
      onClick={onNext}
    >
      <span className="text-white flex items-center gap-2">
        Los geht's <ChevronRight size={20} />
      </span>
    </motion.button>
  </motion.div>
);

const FirstStarStep = ({ onNext }: { onNext: () => void }) => {
  const [starLanded, setStarLanded] = useState(false);

  return (
    <motion.div
      className="flex flex-col items-center text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <FallingStar onComplete={() => setStarLanded(true)} />

      <AnimatePresence>
        {starLanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              Dein erster Stern ⭐
            </h2>

            <p className="text-gray-400 max-w-sm mb-8">
              Dies ist dein Stern. Er verbindet dich mit Menschen in deiner Aura.
              Nutze ihn weise. ✨
            </p>

            <motion.button
              className="px-8 py-4 rounded-2xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
                boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNext}
            >
              <span className="text-black flex items-center gap-2">
                Stern annehmen <Star size={18} fill="currentColor" />
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const SafetyPromiseStep = ({
  onAccept,
}: {
  onAccept: () => void;
}) => {
  const [isToggled, setIsToggled] = useState(false);

  return (
    <motion.div
      className="flex flex-col items-center text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <motion.div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{
          background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Shield size={40} className="text-white" />
      </motion.div>

      <h2 className="text-2xl font-bold text-white mb-4">
        Das Sanctuary-Versprechen
      </h2>

      <p className="text-gray-400 max-w-sm mb-6">
        Delulu ist ein sicherer Raum. Wir schützen unsere Community
        durch das Aegis-System. Respekt ist unsere Währung.
      </p>

      <div className="bg-white/5 rounded-2xl p-4 mb-8 max-w-sm">
        <ul className="text-left text-sm text-gray-300 space-y-2">
          <li className="flex items-center gap-2">
            <Check size={16} className="text-green-400" />
            Ich respektiere andere Träumer
          </li>
          <li className="flex items-center gap-2">
            <Check size={16} className="text-green-400" />
            Ich teile keine schädlichen Inhalte
          </li>
          <li className="flex items-center gap-2">
            <Check size={16} className="text-green-400" />
            Ich akzeptiere die Community-Regeln
          </li>
        </ul>
      </div>

      {/* Safety switch */}
      <motion.button
        className={`w-20 h-10 rounded-full relative transition-colors ${
          isToggled ? 'bg-green-500' : 'bg-gray-600'
        }`}
        onClick={() => setIsToggled(!isToggled)}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="absolute w-8 h-8 bg-white rounded-full top-1"
          animate={{ left: isToggled ? 'calc(100% - 36px)' : '4px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.button>

      <p className="text-xs text-gray-500 mt-2 mb-6">
        Bestätige das Sanctuary-Versprechen
      </p>

      <AnimatePresence>
        {isToggled && (
          <motion.button
            className="px-8 py-4 rounded-2xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAccept}
          >
            <span className="text-white flex items-center gap-2">
              Versprechen bestätigen <Lock size={18} />
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FirstCloudStep = ({
  suggestedRoomName,
  onJoin,
  onSkip,
}: {
  suggestedRoomName: string;
  onJoin: () => void;
  onSkip: () => void;
}) => (
  <motion.div
    className="flex flex-col items-center text-center"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    <motion.div
      className="relative mb-8"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      {/* Cloud with glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
          filter: 'blur(30px)',
          transform: 'scale(1.5)',
        }}
      />
      <Cloud size={80} className="text-purple-400 relative" />
      <Sparkles
        size={24}
        className="text-yellow-400 absolute -top-2 -right-2"
      />
    </motion.div>

    <h2 className="text-2xl font-bold text-white mb-4">
      Dein erstes Wölkchen wartet! ☁️
    </h2>

    <p className="text-gray-400 max-w-sm mb-4">
      Basierend auf deinem Standort haben wir ein perfektes Wölkchen gefunden:
    </p>

    <motion.div
      className="bg-purple-500/20 border border-purple-500/40 rounded-2xl p-6 mb-8"
      style={{ backdropFilter: 'blur(8px)' }}
      animate={{
        boxShadow: [
          '0 0 20px rgba(139, 92, 246, 0.3)',
          '0 0 40px rgba(139, 92, 246, 0.5)',
          '0 0 20px rgba(139, 92, 246, 0.3)',
        ],
      }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <p className="text-white font-medium">{suggestedRoomName}</p>
      <p className="text-purple-300 text-sm mt-1">
        3 Träumer sind gerade hier ✨
      </p>
    </motion.div>

    <div className="flex gap-4">
      <motion.button
        className="px-8 py-4 rounded-2xl font-bold"
        style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onJoin}
      >
        <span className="text-white flex items-center gap-2">
          Hinschweben <Cloud size={18} />
        </span>
      </motion.button>

      <motion.button
        className="px-6 py-4 rounded-2xl font-medium text-gray-400"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onSkip}
      >
        Später
      </motion.button>
    </div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ONBOARDING COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const MagicalOnboarding = ({ onComplete, userName = '' }: OnboardingProps) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [nearbyCount, setNearbyCount] = useState(0);

  const handleComplete = useCallback(() => {
    onComplete({
      hasAcceptedTerms: true,
      hasLocationPermission,
      firstStarReceived: true,
    });
  }, [hasLocationPermission, onComplete]);

  const steps: OnboardingStep[] = [
    'welcome',
    'first-star',
    'aura-scan',
    'safety-promise',
    'first-cloud',
  ];

  const currentIndex = steps.indexOf(currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
      }}
    >
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-800">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Step indicators */}
      <div className="fixed top-6 flex gap-2">
        {steps.map((step, i) => (
          <motion.div
            key={step}
            className={`w-2 h-2 rounded-full ${
              i <= currentIndex ? 'bg-purple-500' : 'bg-gray-600'
            }`}
            animate={i === currentIndex ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.5 }}
          />
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {currentStep === 'welcome' && (
          <WelcomeStep
            key="welcome"
            userName={userName}
            onNext={() => setCurrentStep('first-star')}
          />
        )}

        {currentStep === 'first-star' && (
          <FirstStarStep
            key="first-star"
            onNext={() => setCurrentStep('aura-scan')}
          />
        )}

        {currentStep === 'aura-scan' && (
          <motion.div
            key="aura-scan"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <h2 className="text-2xl font-bold text-white mb-8">
              Finde deine Aura
            </h2>

            <AuraScan
              onPermissionGranted={() => {
                setHasLocationPermission(true);
                setNearbyCount(Math.floor(Math.random() * 12) + 3);
                setTimeout(() => setCurrentStep('safety-promise'), 2000);
              }}
              nearbyCount={nearbyCount}
            />
          </motion.div>
        )}

        {currentStep === 'safety-promise' && (
          <SafetyPromiseStep
            key="safety-promise"
            onAccept={() => setCurrentStep('first-cloud')}
          />
        )}

        {currentStep === 'first-cloud' && (
          <FirstCloudStep
            key="first-cloud"
            suggestedRoomName="Café Nebula ☁️"
            onJoin={handleComplete}
            onSkip={handleComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MagicalOnboarding;
