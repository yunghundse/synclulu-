/**
 * synclulu DEVICES SETTINGS v2.0
 * "iOS System Preferences Style"
 *
 * DESIGN:
 * - Minimalistic icons
 * - Clear typography
 * - Status indicators
 * - "Dieses Gerät" highlight
 *
 * @design Apple System Preferences
 * @version 2.0.0
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import {
  ChevronLeft, Smartphone, Laptop, Tablet, Monitor,
  Check, X, Shield, Clock, MapPin, LogOut, Trash2,
  AlertTriangle, Wifi, WifiOff
} from 'lucide-react';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface DeviceSession {
  id: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  deviceName: string;
  browser: string;
  os: string;
  location?: string;
  ipAddress?: string;
  lastActive: Date;
  createdAt: Date;
  isCurrent: boolean;
}

// ═══════════════════════════════════════
// DEVICE ICON COMPONENT
// ═══════════════════════════════════════

const DeviceIcon: React.FC<{ type: string; size?: number; className?: string }> = ({
  type,
  size = 24,
  className = '',
}) => {
  const icons = {
    mobile: Smartphone,
    tablet: Tablet,
    desktop: Monitor,
    unknown: Laptop,
  };
  const Icon = icons[type as keyof typeof icons] || Laptop;
  return <Icon size={size} className={className} />;
};

// ═══════════════════════════════════════
// DEVICE CARD COMPONENT
// ═══════════════════════════════════════

interface DeviceCardProps {
  device: DeviceSession;
  onRevoke: () => void;
  isRevoking: boolean;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onRevoke, isRevoking }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const formatLastActive = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Gerade aktiv';
    if (minutes < 60) return `Vor ${minutes} Min`;
    if (hours < 24) return `Vor ${hours} Std`;
    if (days < 7) return `Vor ${days} Tagen`;
    return date.toLocaleDateString('de-DE');
  };

  return (
    <div
      className={`
        relative rounded-2xl p-4 transition-all
        ${device.isCurrent
          ? 'bg-purple-500/10 border-2 border-purple-500/30'
          : 'bg-white/5 border border-white/10 hover:border-white/20'
        }
      `}
    >
      {/* Current device badge */}
      {device.isCurrent && (
        <div className="absolute -top-2 left-4 px-2 py-0.5 bg-purple-500 rounded-full">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
            Dieses Gerät
          </span>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Device Icon */}
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center
          ${device.isCurrent
            ? 'bg-purple-500/20 text-purple-400'
            : 'bg-white/10 text-gray-400'
          }
        `}>
          <DeviceIcon type={device.deviceType} size={24} />
        </div>

        {/* Device Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white truncate">
              {device.deviceName}
            </h3>
            {device.isCurrent && (
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            )}
          </div>
          <p className="text-sm text-gray-400 truncate">
            {device.browser} • {device.os}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatLastActive(device.lastActive)}
            </span>
            {device.location && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {device.location}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {!device.isCurrent && (
          <div>
            {showConfirm ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onRevoke();
                    setShowConfirm(false);
                  }}
                  disabled={isRevoking}
                  className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors"
                >
                  {isRevoking ? (
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 text-gray-400 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                className="w-8 h-8 rounded-lg bg-white/5 text-gray-400 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
// MAIN DEVICES SETTINGS PAGE
// ═══════════════════════════════════════

const DevicesSettings = () => {
  const navigate = useNavigate();
  const { user } = useStore();

  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [showRevokeAll, setShowRevokeAll] = useState(false);

  // Get current session ID
  const getCurrentSessionId = () => {
    return sessionStorage.getItem('synclulu_session_id') || 'unknown';
  };

  // Detect device info
  const detectDeviceInfo = () => {
    const ua = navigator.userAgent;

    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (/tablet|ipad/i.test(ua)) deviceType = 'tablet';
    else if (/mobile|android|iphone/i.test(ua)) deviceType = 'mobile';

    let browser = 'Unbekannt';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edge')) browser = 'Edge';

    let os = 'Unbekannt';
    if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('Linux')) os = 'Linux';

    const deviceName = deviceType === 'mobile'
      ? `${os} Smartphone`
      : deviceType === 'tablet'
      ? `${os} Tablet`
      : `${browser} auf ${os}`;

    return { deviceType, deviceName, browser, os };
  };

  // Load devices
  useEffect(() => {
    const loadDevices = async () => {
      if (!user?.id) return;

      setIsLoading(true);

      try {
        const sessionsQuery = query(
          collection(db, 'user_sessions'),
          where('userId', '==', user.id)
        );

        const snapshot = await getDocs(sessionsQuery);
        const currentSessionId = getCurrentSessionId();

        const loadedDevices: DeviceSession[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            deviceType: data.deviceType || 'unknown',
            deviceName: data.deviceName || 'Unbekanntes Gerät',
            browser: data.browser || 'Unbekannt',
            os: data.os || 'Unbekannt',
            location: data.location,
            ipAddress: data.ipAddress,
            lastActive: data.lastActive?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            isCurrent: doc.id === currentSessionId,
          };
        });

        // Sort: current device first, then by last active
        loadedDevices.sort((a, b) => {
          if (a.isCurrent) return -1;
          if (b.isCurrent) return 1;
          return b.lastActive.getTime() - a.lastActive.getTime();
        });

        // If no sessions exist, create mock current device
        if (loadedDevices.length === 0) {
          const deviceInfo = detectDeviceInfo();
          loadedDevices.push({
            id: 'current',
            ...deviceInfo,
            lastActive: new Date(),
            createdAt: new Date(),
            isCurrent: true,
          });
        }

        setDevices(loadedDevices);
      } catch (error) {
        console.error('[DevicesSettings] Load error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDevices();
  }, [user?.id]);

  // Revoke session
  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);

    try {
      await deleteDoc(doc(db, 'user_sessions', sessionId));
      setDevices((prev) => prev.filter((d) => d.id !== sessionId));
      if ('vibrate' in navigator) navigator.vibrate(20);
    } catch (error) {
      console.error('[DevicesSettings] Revoke error:', error);
    } finally {
      setRevokingId(null);
    }
  };

  // Revoke all other sessions
  const handleRevokeAll = async () => {
    const currentSessionId = getCurrentSessionId();
    const otherDevices = devices.filter((d) => !d.isCurrent);

    for (const device of otherDevices) {
      try {
        await deleteDoc(doc(db, 'user_sessions', device.id));
      } catch (error) {
        console.error('[DevicesSettings] Revoke error:', error);
      }
    }

    setDevices((prev) => prev.filter((d) => d.isCurrent));
    setShowRevokeAll(false);
    if ('vibrate' in navigator) navigator.vibrate([20, 50, 20]);
  };

  const otherDevicesCount = devices.filter((d) => !d.isCurrent).length;

  return (
    <div
      className="min-h-screen"
      style={{ background: colors.dark.bg.primary }}
    >
      {/* Header */}
      <div className="sticky top-0 z-50 px-4 pt-6 pb-4 bg-gradient-to-b from-[#0A0A0B] to-transparent backdrop-blur-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Verknüpfte Geräte</h1>
            <p className="text-sm text-gray-500">
              {devices.length} {devices.length === 1 ? 'Gerät' : 'Geräte'} aktiv
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-32 space-y-6">
        {/* Security Info */}
        <div
          className="rounded-2xl p-4 border flex items-start gap-4"
          style={{
            background: colors.dark.bg.secondary,
            borderColor: colors.dark.border.default,
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Shield size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">Sicherheitsübersicht</h3>
            <p className="text-sm text-gray-400">
              Hier siehst du alle Geräte, auf denen dein synclulu-Account aktiv ist.
              Entferne unbekannte Geräte sofort.
            </p>
          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Device List */}
            <div className="space-y-3">
              {devices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onRevoke={() => handleRevokeSession(device.id)}
                  isRevoking={revokingId === device.id}
                />
              ))}
            </div>

            {/* Revoke All Button */}
            {otherDevicesCount > 0 && (
              <div className="pt-4">
                {showRevokeAll ? (
                  <div
                    className="rounded-2xl p-4 border"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      borderColor: 'rgba(239, 68, 68, 0.2)',
                    }}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-white mb-1">
                          Alle anderen Geräte abmelden?
                        </h3>
                        <p className="text-sm text-gray-400">
                          Du wirst auf {otherDevicesCount} anderen{' '}
                          {otherDevicesCount === 1 ? 'Gerät' : 'Geräten'} abgemeldet.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleRevokeAll}
                        className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                      >
                        Ja, alle abmelden
                      </button>
                      <button
                        onClick={() => setShowRevokeAll(false)}
                        className="flex-1 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRevokeAll(true)}
                    className="w-full py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={18} />
                    Alle anderen Geräte abmelden
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DevicesSettings;
