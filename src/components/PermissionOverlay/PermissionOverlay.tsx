/**
 * PermissionOverlay.tsx
 * High-End blocking overlay when permissions are missing
 * "Delulu benötigt deine permanente Aura (GPS) und deine Stimme (Mikrofon)"
 */

import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Mic, Bell, Shield, Settings, ChevronRight, Loader2 } from 'lucide-react';

interface PermissionOverlayProps {
  isVisible: boolean;
  missingPermissions: string[];
  onRequestGeolocation: () => Promise<boolean>;
  onRequestMicrophone: () => Promise<boolean>;
  onRequestNotifications: () => Promise<boolean>;
  onOpenSettings: () => void;
}

const PermissionItem = memo(function PermissionItem({
  icon: Icon,
  title,
  description,
  isGranted,
  isLoading,
  onRequest,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  isGranted: boolean;
  isLoading: boolean;
  onRequest: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onRequest}
      disabled={isGranted || isLoading}
      className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all"
      style={{
        background: isGranted
          ? 'rgba(16, 185, 129, 0.1)'
          : 'rgba(255, 255, 255, 0.03)',
        border: isGranted
          ? '1px solid rgba(16, 185, 129, 0.3)'
          : '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Icon */}
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center ${
          isGranted
            ? 'bg-emerald-500/20'
            : 'bg-gradient-to-r from-violet-500 to-purple-600'
        }`}
      >
        {isLoading ? (
          <Loader2 size={22} className="text-white animate-spin" />
        ) : (
          <Icon size={22} className={isGranted ? 'text-emerald-400' : 'text-white'} />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 text-left">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <p className="text-xs text-white/50">{description}</p>
      </div>

      {/* Status */}
      {isGranted ? (
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ) : (
        <ChevronRight size={20} className="text-white/30" />
      )}
    </motion.button>
  );
});

export const PermissionOverlay = memo(function PermissionOverlay({
  isVisible,
  missingPermissions,
  onRequestGeolocation,
  onRequestMicrophone,
  onRequestNotifications,
  onOpenSettings,
}: PermissionOverlayProps) {
  const [loadingPermission, setLoadingPermission] = useState<string | null>(null);
  const [grantedPermissions, setGrantedPermissions] = useState<Set<string>>(new Set());

  const handleRequest = async (
    permission: string,
    requestFn: () => Promise<boolean>
  ) => {
    setLoadingPermission(permission);
    const granted = await requestFn();
    if (granted) {
      setGrantedPermissions((prev) => new Set(prev).add(permission));
    }
    setLoadingPermission(null);
  };

  const hasGeolocation = grantedPermissions.has('geo') || !missingPermissions.includes('Standort (GPS)');
  const hasMicrophone = grantedPermissions.has('mic') || !missingPermissions.includes('Mikrofon');
  const hasNotifications = grantedPermissions.has('notif') || !missingPermissions.includes('Benachrichtigungen');

  const allGranted = hasGeolocation && hasMicrophone && hasNotifications;

  return (
    <AnimatePresence>
      {isVisible && !allGranted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          style={{
            background: 'rgba(5, 5, 5, 0.95)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
          }}
        >
          {/* Background Nebula Effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute w-96 h-96 rounded-full bg-violet-600/20 blur-3xl"
              style={{ left: '10%', top: '20%' }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
              className="absolute w-80 h-80 rounded-full bg-purple-600/20 blur-3xl"
              style={{ right: '10%', bottom: '20%' }}
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.3, 0.2, 0.3],
              }}
              transition={{ duration: 6, repeat: Infinity }}
            />
          </div>

          {/* Content */}
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="relative max-w-md w-full"
          >
            {/* Header */}
            <div className="text-center mb-8">
              {/* Shield Icon */}
              <motion.div
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center"
                animate={{
                  boxShadow: [
                    '0 0 30px rgba(139, 92, 246, 0.3)',
                    '0 0 60px rgba(139, 92, 246, 0.5)',
                    '0 0 30px rgba(139, 92, 246, 0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Shield size={36} className="text-white" />
              </motion.div>

              <h2 className="text-2xl font-bold text-white mb-2">
                Nebula-Verbindung
              </h2>
              <p className="text-sm text-white/60 max-w-xs mx-auto">
                Delulu benötigt deine <span className="text-violet-400">permanente Aura (GPS)</span> und
                deine <span className="text-violet-400">Stimme (Mikrofon)</span>, um die Nebula stabil zu halten.
              </p>
            </div>

            {/* Permission Cards */}
            <div className="space-y-3 mb-6">
              <PermissionItem
                icon={MapPin}
                title="Standort (GPS)"
                description="Für Hotspots und Leute in deiner Nähe"
                isGranted={hasGeolocation}
                isLoading={loadingPermission === 'geo'}
                onRequest={() => handleRequest('geo', onRequestGeolocation)}
              />

              <PermissionItem
                icon={Mic}
                title="Mikrofon"
                description="Für Voice-Chats in Wölkchen"
                isGranted={hasMicrophone}
                isLoading={loadingPermission === 'mic'}
                onRequest={() => handleRequest('mic', onRequestMicrophone)}
              />

              <PermissionItem
                icon={Bell}
                title="Benachrichtigungen"
                description="Für Sterne, Anfragen und Updates"
                isGranted={hasNotifications}
                isLoading={loadingPermission === 'notif'}
                onRequest={() => handleRequest('notif', onRequestNotifications)}
              />
            </div>

            {/* Help Text */}
            <div
              className="p-4 rounded-xl mb-4"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <p className="text-xs text-white/40 text-center">
                Tippe auf jede Berechtigung, um sie zu aktivieren. Falls der Browser blockiert,
                öffne die Systemeinstellungen.
              </p>
            </div>

            {/* Settings Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onOpenSettings}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Settings size={18} className="text-white/60" />
              <span className="text-sm text-white/60">Systemeinstellungen öffnen</span>
            </motion.button>

            {/* Progress Indicator */}
            <div className="mt-6 flex justify-center gap-2">
              {[hasGeolocation, hasMicrophone, hasNotifications].map((granted, i) => (
                <motion.div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    granted ? 'bg-emerald-500' : 'bg-white/20'
                  }`}
                  animate={granted ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default PermissionOverlay;
