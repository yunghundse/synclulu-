/**
 * PERMISSION GATE - "Aktiviere deine Aura"
 *
 * Full-screen modal for permission requests
 * Hard-blocks until Location is granted
 *
 * @design Neo-Glassmorphism with Aura Effects
 * @version 2.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import {
  MapPin, Mic, Bell, Shield, Check,
  ChevronRight, Sparkles, AlertCircle, Loader2
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'checking';

interface PermissionState {
  location: PermissionStatus;
  microphone: PermissionStatus;
  notifications: PermissionStatus;
}

interface PermissionGateProps {
  onComplete: () => void;
  requireLocation?: boolean;
  requireMicrophone?: boolean;
  requireNotifications?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED BACKGROUND
// ═══════════════════════════════════════════════════════════════════════════

const AuraBackground = () => (
  <div className="absolute inset-0 overflow-hidden">
    {/* Base */}
    <div className="absolute inset-0 bg-[#050508]" />

    {/* Central Aura */}
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 40%, transparent 70%)',
        filter: 'blur(60px)'
      }}
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.5, 0.8, 0.5]
      }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* Orbiting particles */}
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full"
        style={{
          background: 'linear-gradient(135deg, #A78BFA, #8B5CF6)',
          left: '50%',
          top: '50%',
          boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
        }}
        animate={{
          rotate: 360,
          x: Math.cos((i / 12) * Math.PI * 2) * (150 + (i % 3) * 50),
          y: Math.sin((i / 12) * Math.PI * 2) * (150 + (i % 3) * 50),
          opacity: [0.3, 0.8, 0.3]
        }}
        transition={{
          rotate: { duration: 20 + i * 2, repeat: Infinity, ease: 'linear' },
          opacity: { duration: 2, repeat: Infinity, delay: i * 0.2 }
        }}
      />
    ))}

    {/* Grid overlay */}
    <div
      className="absolute inset-0 opacity-[0.015]"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
        backgroundSize: '30px 30px'
      }}
    />
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSION CARD
// ═══════════════════════════════════════════════════════════════════════════

interface PermissionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: PermissionStatus;
  required: boolean;
  onClick: () => void;
  index: number;
}

const PermissionCard = ({
  icon, title, description, status, required, onClick, index
}: PermissionCardProps) => {
  const isGranted = status === 'granted';
  const isDenied = status === 'denied';
  const isChecking = status === 'checking';

  return (
    <motion.button
      onClick={onClick}
      disabled={isGranted || isChecking}
      className="w-full p-5 rounded-3xl text-left relative overflow-hidden group"
      style={{
        background: isGranted
          ? 'rgba(34, 197, 94, 0.08)'
          : isDenied
          ? 'rgba(239, 68, 68, 0.08)'
          : 'rgba(255, 255, 255, 0.02)',
        border: `1px solid ${
          isGranted
            ? 'rgba(34, 197, 94, 0.25)'
            : isDenied
            ? 'rgba(239, 68, 68, 0.25)'
            : 'rgba(255, 255, 255, 0.05)'
        }`,
        boxShadow: isGranted
          ? '0 0 30px rgba(34, 197, 94, 0.1)'
          : 'none'
      }}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.2 + index * 0.1, type: 'spring', stiffness: 100 }}
      whileHover={!isGranted && !isChecking ? {
        background: 'rgba(139, 92, 246, 0.08)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
        scale: 1.02
      } : {}}
      whileTap={!isGranted && !isChecking ? { scale: 0.98 } : {}}
    >
      {/* Shimmer effect on hover */}
      {!isGranted && (
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.1), transparent)'
          }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <div className="relative flex items-center gap-4">
        {/* Icon */}
        <motion.div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            isGranted
              ? 'bg-green-500/20'
              : isDenied
              ? 'bg-red-500/20'
              : 'bg-purple-500/15'
          }`}
          animate={isGranted ? {
            scale: [1, 1.1, 1],
            boxShadow: [
              '0 0 0 rgba(34, 197, 94, 0)',
              '0 0 20px rgba(34, 197, 94, 0.3)',
              '0 0 0 rgba(34, 197, 94, 0)'
            ]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {isChecking ? (
            <Loader2 className="animate-spin text-purple-400" size={24} />
          ) : isGranted ? (
            <Check size={24} className="text-green-400" />
          ) : (
            <div className={isDenied ? 'text-red-400' : 'text-purple-400'}>
              {icon}
            </div>
          )}
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white">{title}</span>
            {required && !isGranted && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: '#A78BFA'
                }}
              >
                PFLICHT
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">{description}</p>

          {/* Denied warning */}
          {isDenied && (
            <motion.p
              className="text-xs text-red-400 mt-2 flex items-center gap-1"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={12} />
              In den Einstellungen aktivieren
            </motion.p>
          )}
        </div>

        {/* Arrow */}
        {!isGranted && !isChecking && (
          <motion.div
            className="text-gray-500 group-hover:text-purple-400 transition-colors"
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronRight size={20} />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const PermissionGate = ({
  onComplete,
  requireLocation = true,
  requireMicrophone = true,
  requireNotifications = false
}: PermissionGateProps) => {
  const { user } = useStore();

  const [permissions, setPermissions] = useState<PermissionState>({
    location: 'checking',
    microphone: 'checking',
    notifications: 'checking'
  });

  const [isCompleting, setIsCompleting] = useState(false);

  // Check if all required permissions are granted
  const allRequiredGranted =
    (!requireLocation || permissions.location === 'granted') &&
    (!requireMicrophone || permissions.microphone === 'granted') &&
    (!requireNotifications || permissions.notifications === 'granted');

  // ═══════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Check current permission states
  useEffect(() => {
    const checkPermissions = async () => {
      // Location
      if ('permissions' in navigator) {
        try {
          const loc = await navigator.permissions.query({ name: 'geolocation' });
          setPermissions(prev => ({ ...prev, location: loc.state as PermissionStatus }));

          loc.addEventListener('change', () => {
            setPermissions(prev => ({ ...prev, location: loc.state as PermissionStatus }));
          });
        } catch {
          setPermissions(prev => ({ ...prev, location: 'prompt' }));
        }

        // Microphone
        try {
          const mic = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissions(prev => ({ ...prev, microphone: mic.state as PermissionStatus }));

          mic.addEventListener('change', () => {
            setPermissions(prev => ({ ...prev, microphone: mic.state as PermissionStatus }));
          });
        } catch {
          setPermissions(prev => ({ ...prev, microphone: 'prompt' }));
        }
      } else {
        setPermissions(prev => ({
          ...prev,
          location: 'prompt',
          microphone: 'prompt'
        }));
      }

      // Notifications
      if ('Notification' in window) {
        setPermissions(prev => ({
          ...prev,
          notifications: Notification.permission as PermissionStatus
        }));
      } else {
        setPermissions(prev => ({ ...prev, notifications: 'prompt' }));
      }
    };

    checkPermissions();
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const requestLocation = useCallback(async () => {
    setPermissions(prev => ({ ...prev, location: 'checking' }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });

      setPermissions(prev => ({ ...prev, location: 'granted' }));

      // Save location to Firestore
      if (user?.id) {
        await setDoc(doc(db, 'users', user.id), {
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            updatedAt: serverTimestamp()
          },
          'permissions.location': true
        }, { merge: true });
      }

    } catch (error) {
      console.error('Location permission denied:', error);
      setPermissions(prev => ({ ...prev, location: 'denied' }));
    }
  }, [user?.id]);

  const requestMicrophone = useCallback(async () => {
    setPermissions(prev => ({ ...prev, microphone: 'checking' }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());

      setPermissions(prev => ({ ...prev, microphone: 'granted' }));

      if (user?.id) {
        await setDoc(doc(db, 'users', user.id), {
          'permissions.microphone': true
        }, { merge: true });
      }

    } catch (error) {
      console.error('Microphone permission denied:', error);
      setPermissions(prev => ({ ...prev, microphone: 'denied' }));
    }
  }, [user?.id]);

  const requestNotifications = useCallback(async () => {
    setPermissions(prev => ({ ...prev, notifications: 'checking' }));

    try {
      const result = await Notification.requestPermission();
      setPermissions(prev => ({ ...prev, notifications: result as PermissionStatus }));

      if (user?.id) {
        await setDoc(doc(db, 'users', user.id), {
          'permissions.notifications': result === 'granted'
        }, { merge: true });
      }

    } catch (error) {
      console.error('Notification permission denied:', error);
      setPermissions(prev => ({ ...prev, notifications: 'denied' }));
    }
  }, [user?.id]);

  const handleComplete = async () => {
    if (!allRequiredGranted) return;

    setIsCompleting(true);

    try {
      if (user?.id) {
        await setDoc(doc(db, 'users', user.id), {
          onboardingCompleted: true,
          permissionsGrantedAt: serverTimestamp()
        }, { merge: true });
      }

      onComplete();
    } catch (error) {
      console.error('Complete error:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AuraBackground />

      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Shield Icon */}
          <motion.div
            className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.25)'
            }}
            animate={{
              boxShadow: [
                '0 0 30px rgba(139, 92, 246, 0.2)',
                '0 0 60px rgba(139, 92, 246, 0.4)',
                '0 0 30px rgba(139, 92, 246, 0.2)'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Shield size={40} className="text-purple-400" />

            {/* Orbiting ring */}
            <motion.div
              className="absolute inset-0 rounded-3xl"
              style={{
                border: '2px solid transparent',
                borderTopColor: 'rgba(139, 92, 246, 0.5)',
                borderRightColor: 'rgba(139, 92, 246, 0.3)'
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>

          <h1
            className="text-3xl font-black mb-3"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #A78BFA 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Aktiviere deine Aura
          </h1>
          <p className="text-gray-400 leading-relaxed">
            Diese Berechtigungen machen dich sichtbar<br />
            und verbinden dich mit anderen Träumern.
          </p>
        </motion.div>

        {/* Permission Cards */}
        <div className="space-y-4 mb-8">
          {requireLocation && (
            <PermissionCard
              icon={<MapPin size={24} />}
              title="Standort aktivieren"
              description="Ohne Standort bist du unsichtbar für andere Träumer."
              status={permissions.location}
              required={true}
              onClick={requestLocation}
              index={0}
            />
          )}

          {requireMicrophone && (
            <PermissionCard
              icon={<Mic size={24} />}
              title="Mikrofon freigeben"
              description="Deine Stimme ist dein Schlüssel zur Cloud."
              status={permissions.microphone}
              required={true}
              onClick={requestMicrophone}
              index={1}
            />
          )}

          {requireNotifications && (
            <PermissionCard
              icon={<Bell size={24} />}
              title="Benachrichtigungen"
              description="Verpasse keine Matches & Nachrichten."
              status={permissions.notifications}
              required={false}
              onClick={requestNotifications}
              index={2}
            />
          )}
        </div>

        {/* Complete Button */}
        <motion.button
          onClick={handleComplete}
          disabled={!allRequiredGranted || isCompleting}
          className="w-full py-4 rounded-2xl font-semibold text-white relative overflow-hidden disabled:opacity-40"
          style={{
            background: allRequiredGranted
              ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
              : 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
            boxShadow: allRequiredGranted
              ? '0 4px 30px rgba(34, 197, 94, 0.4)'
              : 'none'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={allRequiredGranted ? { scale: 1.02 } : {}}
          whileTap={allRequiredGranted ? { scale: 0.98 } : {}}
        >
          {/* Shimmer */}
          {allRequiredGranted && (
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
              }}
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}

          <span className="relative flex items-center justify-center gap-2">
            {isCompleting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : allRequiredGranted ? (
              <>
                <Sparkles size={18} />
                In die Cloud eintreten
              </>
            ) : (
              'Berechtigungen erforderlich'
            )}
          </span>
        </motion.button>

        {/* Skip hint */}
        <motion.p
          className="text-xs text-gray-500 text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Du kannst Berechtigungen später in den Einstellungen ändern
        </motion.p>
      </div>
    </motion.div>
  );
};

export default PermissionGate;
