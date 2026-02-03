import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import {
  Shield, Users, Cloud, Trash2, RefreshCw, AlertTriangle,
  UserX, Home, Settings, Database, Activity,
  Loader2, Wrench, Power, Clock, Zap, Gift, TrendingUp
} from 'lucide-react';
import {
  collection, getDocs, deleteDoc, doc, getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { toggleMaintenanceMode, updateSystemConfig, SystemConfig } from '@/lib/systemConfig';

interface UserData {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  createdAt: Date;
  level: number;
  isAdmin?: boolean;
}

interface RoomData {
  id: string;
  name: string;
  type: string;
  participantCount: number;
  createdAt: Date;
  createdBy: string;
}

interface Stats {
  totalUsers: number;
  totalRooms: number;
  activeRooms: number;
  totalFriendRequests: number;
}

// ═══════════════════════════════════════
// SETTINGS TAB COMPONENT
// ═══════════════════════════════════════

interface SettingsTabProps {
  user: any;
  addLog: (message: string) => void;
}

const SettingsTab = ({ user, addLog }: SettingsTabProps) => {
  const { config, isLoading: configLoading } = useSystemConfig();
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceDuration, setMaintenanceDuration] = useState(30);

  const handleToggleMaintenance = async () => {
    setIsTogglingMaintenance(true);
    try {
      const newState = !config.maintenanceMode;
      await toggleMaintenanceMode(
        newState,
        user.id,
        maintenanceMessage || undefined,
        newState ? maintenanceDuration : undefined
      );
      addLog(newState ? '🔧 Wartungsmodus AKTIVIERT' : '✅ Wartungsmodus DEAKTIVIERT');
    } catch (error) {
      addLog('❌ Fehler beim Umschalten des Wartungsmodus');
    }
    setIsTogglingMaintenance(false);
  };

  const handleUpdateFeature = async (feature: string, value: boolean) => {
    try {
      await updateSystemConfig({
        features: {
          ...config.features,
          [feature]: value,
        },
      }, user.id);
      addLog(`Feature "${feature}" ${value ? 'aktiviert' : 'deaktiviert'}`);
    } catch (error) {
      addLog(`❌ Fehler beim Aktualisieren von "${feature}"`);
    }
  };

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════ */}
      {/* GODMODE CONTROL - REALITY BENDING */}
      {/* ═══════════════════════════════════════ */}
      <div
        className={`rounded-2xl p-6 border-2 relative overflow-hidden ${
          config.maintenanceMode
            ? 'bg-gradient-to-br from-purple-900/50 via-fuchsia-900/30 to-purple-900/50 border-fuchsia-500/50'
            : 'bg-gray-800 border-gray-700'
        }`}
        style={config.maintenanceMode ? {
          boxShadow: '0 0 30px rgba(192, 38, 211, 0.3), inset 0 0 30px rgba(192, 38, 211, 0.1)',
        } : {}}
      >
        {/* Animated glow when active */}
        {config.maintenanceMode && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(192, 38, 211, 0.2) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }}
            />
          </div>
        )}

        <div className="relative flex items-start gap-4 mb-6">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
              config.maintenanceMode
                ? 'bg-gradient-to-br from-fuchsia-500 to-purple-600'
                : 'bg-gray-700'
            }`}
            style={config.maintenanceMode ? {
              boxShadow: '0 0 25px rgba(192, 38, 211, 0.5)',
              animation: 'pulse 2s ease-in-out infinite',
            } : {}}
          >
            <Zap size={32} className={config.maintenanceMode ? 'text-white animate-pulse' : 'text-gray-400'} />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-2xl mb-1 flex items-center gap-3">
              <span
                className={config.maintenanceMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400' : 'text-white'}
              >
                REALITY BENDING MODE
              </span>
              {config.maintenanceMode && (
                <span
                  className="px-3 py-1 bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white text-xs font-bold rounded-full"
                  style={{
                    animation: 'pulse 1.5s ease-in-out infinite',
                    boxShadow: '0 0 15px rgba(192, 38, 211, 0.5)',
                  }}
                >
                  ⚡ GODMODE AKTIV ⚡
                </span>
              )}
            </h2>
            <p className="text-gray-400 text-sm">
              Blockiert den Zugriff für alle Sterblichen während die Götter das Universum neu konfigurieren.
            </p>
          </div>
        </div>

        {!config.maintenanceMode && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Nachricht für Benutzer</label>
              <input
                type="text"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="Wir machen eine kurze Pause..."
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Geschätzte Dauer (Minuten)</label>
              <div className="flex gap-2">
                {[15, 30, 60, 120].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setMaintenanceDuration(mins)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      maintenanceDuration === mins
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {mins} Min
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {config.maintenanceMode && config.maintenanceEstimatedEnd && (
          <div className="flex items-center gap-3 p-4 bg-amber-600/20 rounded-xl mb-6">
            <Clock size={20} className="text-amber-400" />
            <div>
              <p className="text-amber-200 font-medium">Geschätztes Ende</p>
              <p className="text-amber-100/70 text-sm">
                {new Date(config.maintenanceEstimatedEnd).toLocaleString('de-DE')}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleToggleMaintenance}
          disabled={isTogglingMaintenance}
          className={`relative w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all overflow-hidden ${
            config.maintenanceMode
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
              : 'bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-600 hover:from-fuchsia-600 hover:via-purple-600 hover:to-violet-700 text-white'
          } disabled:opacity-50`}
          style={!config.maintenanceMode ? {
            boxShadow: '0 0 30px rgba(192, 38, 211, 0.4)',
          } : {
            boxShadow: '0 0 30px rgba(34, 197, 94, 0.4)',
          }}
        >
          {/* Shimmer effect */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
              animation: 'shimmer-button 2s ease-in-out infinite',
            }}
          />
          {isTogglingMaintenance ? (
            <Loader2 size={28} className="animate-spin" />
          ) : (
            <>
              <Zap size={28} className={config.maintenanceMode ? '' : 'animate-pulse'} />
              {config.maintenanceMode ? '🌍 REALITÄT WIEDERHERSTELLEN' : '⚡ ACTIVATE GODMODE ⚡'}
            </>
          )}
        </button>

        {/* Shimmer animation style */}
        <style>{`
          @keyframes shimmer-button {
            0%, 100% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
          }
        `}</style>
      </div>

      {/* Feature Flags */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Zap size={20} className="text-purple-400" />
          Feature Flags
        </h2>
        <div className="space-y-3">
          {Object.entries(config.features).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 bg-gray-900 rounded-xl"
            >
              <div className="flex items-center gap-3">
                {key === 'referralSystem' && <Gift size={20} className="text-pink-400" />}
                {key === 'premiumPurchases' && <TrendingUp size={20} className="text-amber-400" />}
                {key === 'voiceChat' && <Activity size={20} className="text-blue-400" />}
                {key === 'anonymousMode' && <Shield size={20} className="text-green-400" />}
                {key === 'starEvents' && <Zap size={20} className="text-purple-400" />}
                <div>
                  <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-xs text-gray-400">
                    {key === 'referralSystem' && 'Einladungs-System mit 5 Links'}
                    {key === 'premiumPurchases' && 'Premium-Käufe aktivieren'}
                    {key === 'voiceChat' && 'Voice Chat in Wölkchen'}
                    {key === 'anonymousMode' && 'Anonymer Modus verfügbar'}
                    {key === 'starEvents' && 'Star Events & Zeitpläne'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleUpdateFeature(key, !value)}
                className={`w-14 h-8 rounded-full transition-colors relative ${
                  value ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${
                    value ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* System Limits */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Database size={20} className="text-blue-400" />
          System Limits
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-900 rounded-xl">
            <p className="text-2xl font-bold text-white">{config.limits.maxUsersPerRoom}</p>
            <p className="text-xs text-gray-400">Max. User pro Wölkchen</p>
          </div>
          <div className="p-4 bg-gray-900 rounded-xl">
            <p className="text-2xl font-bold text-white">{config.limits.maxRoomsPerUser}</p>
            <p className="text-xs text-gray-400">Max. Wölkchen pro User</p>
          </div>
          <div className="p-4 bg-gray-900 rounded-xl">
            <p className="text-2xl font-bold text-white">{config.limits.maxDailyXP}</p>
            <p className="text-xs text-gray-400">Max. XP pro Tag</p>
          </div>
          <div className="p-4 bg-gray-900 rounded-xl">
            <p className="text-2xl font-bold text-white">{config.limits.maxLevel}</p>
            <p className="text-xs text-gray-400">Max. Level</p>
          </div>
        </div>
      </div>

      {/* Level System Info */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-green-400" />
          Level System 2.0
        </h2>
        <div className="space-y-3 text-sm">
          <div className="p-4 bg-gray-900 rounded-xl font-mono">
            <p className="text-gray-400 mb-2">XP Formula:</p>
            <p className="text-green-400">XP_n = {config.levelConfig.baseXP} × n^{config.levelConfig.exponent}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-900 rounded-xl">
              <p className="text-xl font-bold text-white">{config.levelConfig.prestigeUnlockLevel}</p>
              <p className="text-xs text-gray-400">Prestige Unlock Level</p>
            </div>
            <div className="p-4 bg-gray-900 rounded-xl">
              <p className="text-xl font-bold text-white">{config.levelConfig.communityPrestigeThreshold}</p>
              <p className="text-xs text-gray-400">Community Prestige</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Info */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">Admin-Infos</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 p-3 bg-green-600/10 border border-green-600/30 rounded-xl">
            <Shield size={20} className="text-green-400" />
            <div>
              <p className="font-medium text-green-400">Sicher authentifiziert</p>
              <p className="text-xs text-gray-400">Via Firebase Firestore isAdmin Flag</p>
            </div>
          </div>
          <p><span className="text-gray-400">Deine User-ID:</span> <code className="bg-gray-700 px-2 py-1 rounded">{user.id}</code></p>
          <p><span className="text-gray-400">Username:</span> <code className="bg-gray-700 px-2 py-1 rounded">{user.username}</code></p>
        </div>
      </div>

      {/* Add New Admin */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">Neuen Admin hinzufügen</h2>
        <p className="text-gray-400 text-sm mb-4">
          Um einen neuen Admin hinzuzufügen, setze in der Firebase Console:
        </p>
        <div className="p-4 bg-gray-900 rounded-xl font-mono text-sm">
          <p className="text-gray-400">Firestore → users → [user-id]</p>
          <p className="text-green-400 mt-2">isAdmin: true</p>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
// MAIN ADMIN COMPONENT
// ═══════════════════════════════════════

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useStore();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'rooms' | 'settings'>('overview');

  const [users, setUsers] = useState<UserData[]>([]);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalRooms: 0, activeRooms: 0, totalFriendRequests: 0 });

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<'users' | 'rooms' | null>(null);
  const [actionLog, setActionLog] = useState<string[]>([]);

  // Check admin authorization via Firebase
  useEffect(() => {
    const checkAuth = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Check admin status from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.id));
        const userData = userDoc.data();

        // User must have isAdmin: true in their Firestore document
        const isAdmin = userData?.isAdmin === true;

        if (isAdmin) {
          setIsAuthorized(true);
          await loadData();
        }
      } catch (error) {
        // Silent fail - not authorized
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [user]);

  const loadData = async () => {
    try {
      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const loadedUsers: UserData[] = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        username: doc.data().username || 'unknown',
        displayName: doc.data().displayName || 'Unbekannt',
        email: doc.data().email,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        level: doc.data().level || 1,
        isAdmin: doc.data().isAdmin || false,
      }));
      setUsers(loadedUsers);

      // Load rooms
      const roomsSnapshot = await getDocs(collection(db, 'rooms'));
      const loadedRooms: RoomData[] = roomsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Unnamed',
        type: doc.data().type || 'public',
        participantCount: (doc.data().participants || []).length,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        createdBy: doc.data().createdBy || 'unknown',
      }));
      setRooms(loadedRooms);

      // Load friend requests count
      const friendRequestsSnapshot = await getDocs(collection(db, 'friendRequests'));

      // Calculate stats
      setStats({
        totalUsers: loadedUsers.length,
        totalRooms: loadedRooms.length,
        activeRooms: loadedRooms.filter(r => r.participantCount > 0).length,
        totalFriendRequests: friendRequestsSnapshot.size,
      });

      addLog('Daten erfolgreich geladen');
    } catch (error) {
      addLog('Fehler beim Laden der Daten');
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('de-DE');
    setActionLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  const deleteAllUsers = async () => {
    setIsDeleting(true);
    addLog('Starte Löschung aller Benutzer...');

    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let deleted = 0;

      for (const userDoc of usersSnapshot.docs) {
        // Don't delete admin users
        if (userDoc.data().isAdmin) continue;

        await deleteDoc(doc(db, 'users', userDoc.id));
        deleted++;
        addLog(`Benutzer gelöscht: ${userDoc.id}`);
      }

      // Delete all blocks
      const blocksSnapshot = await getDocs(collection(db, 'blocks'));
      for (const blockDoc of blocksSnapshot.docs) {
        await deleteDoc(doc(db, 'blocks', blockDoc.id));
      }
      addLog(`${blocksSnapshot.size} Block-Einträge gelöscht`);

      // Delete all referrals (except admin's)
      const referralsSnapshot = await getDocs(collection(db, 'referrals'));
      let deletedReferrals = 0;
      for (const refDoc of referralsSnapshot.docs) {
        // Keep admin's referrals
        const adminUser = usersSnapshot.docs.find(u => u.data().isAdmin && u.id === refDoc.id);
        if (adminUser) continue;

        await deleteDoc(doc(db, 'referrals', refDoc.id));
        deletedReferrals++;
      }
      addLog(`${deletedReferrals} Referral-Einträge gelöscht`);

      // Also delete all friend requests
      const friendRequestsSnapshot = await getDocs(collection(db, 'friendRequests'));
      for (const frDoc of friendRequestsSnapshot.docs) {
        await deleteDoc(doc(db, 'friendRequests', frDoc.id));
      }
      addLog(`${friendRequestsSnapshot.size} Freundschaftsanfragen gelöscht`);

      // Delete notifications
      const notificationsSnapshot = await getDocs(collection(db, 'notifications'));
      for (const notifDoc of notificationsSnapshot.docs) {
        await deleteDoc(doc(db, 'notifications', notifDoc.id));
      }
      addLog(`${notificationsSnapshot.size} Benachrichtigungen gelöscht`);

      addLog(`✅ ${deleted} Benutzer erfolgreich gelöscht`);
      await loadData(); // Refresh data
    } catch (error) {
      addLog('❌ Fehler beim Löschen der Benutzer');
    }

    setIsDeleting(false);
    setDeleteConfirm(null);
  };

  const deleteAllRooms = async () => {
    setIsDeleting(true);
    addLog('Starte Löschung aller Wölkchen...');

    try {
      const roomsSnapshot = await getDocs(collection(db, 'rooms'));
      let deleted = 0;

      for (const roomDoc of roomsSnapshot.docs) {
        await deleteDoc(doc(db, 'rooms', roomDoc.id));
        deleted++;
        addLog(`Wölkchen gelöscht: ${roomDoc.data().name}`);
      }

      // Also delete star events
      const starEventsSnapshot = await getDocs(collection(db, 'starEvents'));
      for (const eventDoc of starEventsSnapshot.docs) {
        await deleteDoc(doc(db, 'starEvents', eventDoc.id));
      }
      addLog(`${starEventsSnapshot.size} Star Events gelöscht`);

      addLog(`✅ ${deleted} Wölkchen erfolgreich gelöscht`);
      await loadData(); // Refresh data
    } catch (error) {
      addLog('❌ Fehler beim Löschen der Wölkchen');
    }

    setIsDeleting(false);
    setDeleteConfirm(null);
  };

  const deleteEverything = async () => {
    setIsDeleting(true);
    addLog('🔥 KOMPLETTER RESET GESTARTET...');

    await deleteAllRooms();
    await deleteAllUsers();

    addLog('🔥 KOMPLETTER RESET ABGESCHLOSSEN');
    setIsDeleting(false);
  };

  const deleteSingleUser = async (userId: string) => {
    try {
      // Check if trying to delete admin
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.data()?.isAdmin) {
        addLog('❌ Admin-Benutzer können nicht gelöscht werden');
        return;
      }

      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
      addLog(`Benutzer ${userId} gelöscht`);
    } catch (error) {
      addLog(`Fehler beim Löschen von ${userId}`);
    }
  };

  const deleteSingleRoom = async (roomId: string, roomName: string) => {
    try {
      await deleteDoc(doc(db, 'rooms', roomId));
      setRooms(prev => prev.filter(r => r.id !== roomId));
      setStats(prev => ({ ...prev, totalRooms: prev.totalRooms - 1 }));
      addLog(`Wölkchen "${roomName}" gelöscht`);
    } catch (error) {
      addLog(`Fehler beim Löschen von "${roomName}"`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-purple-500" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center">
          <Shield size={64} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Zugriff verweigert</h1>
          <p className="text-gray-400 mb-6">Du musst eingeloggt sein.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold"
          >
            Zur Startseite
          </button>
        </div>
      </div>
    );
  }

  // Not authorized (no isAdmin flag in Firestore)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto bg-red-600/20 rounded-2xl flex items-center justify-center mb-6">
            <Shield size={40} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Zugriff verweigert</h1>
          <p className="text-gray-400 mb-6">
            Du hast keine Admin-Berechtigung. Admin-Rechte werden über die Firestore-Datenbank vergeben.
          </p>
          <div className="p-4 bg-gray-800 rounded-xl text-left mb-6">
            <p className="text-sm text-gray-400 mb-2">So wirst du Admin:</p>
            <code className="text-xs text-green-400 block">
              Firestore → users → [deine-id] → isAdmin: true
            </code>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold"
          >
            Zur Startseite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg">Delulu Admin Panel</h1>
              <p className="text-xs text-gray-400">Eingeloggt als {user.username}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Home size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 border-b border-gray-700 px-6">
        <div className="flex gap-1">
          {[
            { id: 'overview', label: 'Übersicht', icon: Activity },
            { id: 'users', label: 'Benutzer', icon: Users },
            { id: 'rooms', label: 'Wölkchen', icon: Cloud },
            { id: 'settings', label: 'Einstellungen', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-purple-400 border-purple-500'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Users size={20} className="text-blue-400" />
                  <span className="text-gray-400 text-sm">Benutzer</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Cloud size={20} className="text-purple-400" />
                  <span className="text-gray-400 text-sm">Wölkchen</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalRooms}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Activity size={20} className="text-green-400" />
                  <span className="text-gray-400 text-sm">Aktiv</span>
                </div>
                <p className="text-2xl font-bold">{stats.activeRooms}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Database size={20} className="text-amber-400" />
                  <span className="text-gray-400 text-sm">Anfragen</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalFriendRequests}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-400" />
                Gefährliche Aktionen
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setDeleteConfirm('users')}
                  disabled={isDeleting}
                  className="p-4 bg-red-600/20 border border-red-600/50 rounded-xl text-left hover:bg-red-600/30 transition-colors disabled:opacity-50"
                >
                  <UserX size={24} className="text-red-400 mb-2" />
                  <p className="font-semibold text-red-400">Alle Benutzer löschen</p>
                  <p className="text-xs text-gray-400 mt-1">Löscht {stats.totalUsers} Benutzer (außer Admins)</p>
                </button>
                <button
                  onClick={() => setDeleteConfirm('rooms')}
                  disabled={isDeleting}
                  className="p-4 bg-orange-600/20 border border-orange-600/50 rounded-xl text-left hover:bg-orange-600/30 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={24} className="text-orange-400 mb-2" />
                  <p className="font-semibold text-orange-400">Alle Wölkchen löschen</p>
                  <p className="text-xs text-gray-400 mt-1">Löscht {stats.totalRooms} Wölkchen</p>
                </button>
                <button
                  onClick={deleteEverything}
                  disabled={isDeleting}
                  className="p-4 bg-purple-600/20 border border-purple-600/50 rounded-xl text-left hover:bg-purple-600/30 transition-colors disabled:opacity-50"
                >
                  <Database size={24} className="text-purple-400 mb-2" />
                  <p className="font-semibold text-purple-400">KOMPLETTER RESET</p>
                  <p className="text-xs text-gray-400 mt-1">Alles löschen & neu starten</p>
                </button>
              </div>
            </div>

            {/* Action Log */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Aktivitätslog</h2>
                <button
                  onClick={loadData}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-xs">
                {actionLog.length === 0 ? (
                  <p className="text-gray-500">Noch keine Aktivitäten</p>
                ) : (
                  actionLog.map((log, i) => (
                    <div key={i} className="py-1 text-gray-300">{log}</div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Benutzer ({users.length})</h2>
              <button
                onClick={loadData}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="bg-gray-800 rounded-xl overflow-hidden">
              {users.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  Keine Benutzer vorhanden
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {users.map((u) => (
                    <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-700/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          u.isAdmin ? 'bg-amber-600/20' : 'bg-purple-600/20'
                        }`}>
                          <span className={`text-sm font-bold ${
                            u.isAdmin ? 'text-amber-400' : 'text-purple-400'
                          }`}>
                            {u.displayName[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {u.displayName}
                            {u.isAdmin && (
                              <span className="px-1.5 py-0.5 bg-amber-600/20 text-amber-400 text-[10px] font-bold rounded">
                                ADMIN
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400">@{u.username} · Level {u.level}</p>
                        </div>
                      </div>
                      {!u.isAdmin && (
                        <button
                          onClick={() => deleteSingleUser(u.id)}
                          className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Wölkchen ({rooms.length})</h2>
              <button
                onClick={loadData}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="bg-gray-800 rounded-xl overflow-hidden">
              {rooms.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  Keine Wölkchen vorhanden
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {rooms.map((room) => (
                    <div key={room.id} className="p-4 flex items-center justify-between hover:bg-gray-700/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                          <Cloud size={20} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium">{room.name}</p>
                          <p className="text-xs text-gray-400">
                            {room.type} · {room.participantCount} Teilnehmer
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSingleRoom(room.id, room.name)}
                        className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <SettingsTab user={user} addLog={addLog} />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80">
          <div className="w-full max-w-md bg-gray-800 rounded-2xl p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Bist du sicher?</h2>
              <p className="text-gray-400">
                {deleteConfirm === 'users'
                  ? `${stats.totalUsers} Benutzer werden unwiderruflich gelöscht (außer Admins).`
                  : `${stats.totalRooms} Wölkchen werden unwiderruflich gelöscht.`}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-semibold"
              >
                Abbrechen
              </button>
              <button
                onClick={deleteConfirm === 'users' ? deleteAllUsers : deleteAllRooms}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Lösche...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Löschen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
