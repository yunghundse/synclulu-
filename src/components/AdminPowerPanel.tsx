/**
 * Admin Power Panel - Executive Dashboard
 *
 * Founder-exclusive management interface for admin hierarchy
 * Features: Admin list, Demote/Promote, Nebula Grant
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  useIsFounder,
  usePermissions,
  useUserBadge,
  useFounderModeStyles,
  UserRole
} from '../hooks/useFounderAccess';
import {
  demoteAdmin,
  promoteToAdmin,
  grantNebulaPremium,
  revokeNebulaPremium,
  FOUNDER_ID
} from '../lib/founderProtection';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  photoURL?: string;
  promotedAt?: Date;
  promotedBy?: string;
}

interface SearchResult {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  photoURL?: string;
  isPremium?: boolean;
  premiumUntil?: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AdminPowerPanel() {
  const { user } = useAuth();
  const founderAccess = useIsFounder(user?.uid || null);
  const permissions = usePermissions(founderAccess.role, user?.uid || null);
  const founderStyles = useFounderModeStyles(founderAccess.isFounder);

  const [activeTab, setActiveTab] = useState<'admins' | 'nebula' | 'audit'>('admins');
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load admins on mount
  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const adminQuery = query(
        collection(db, 'users'),
        where('role', 'in', ['admin', 'moderator', 'founder']),
        orderBy('role'),
        limit(50)
      );

      const snapshot = await getDocs(adminQuery);
      const adminList: AdminUser[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        adminList.push({
          id: doc.id,
          username: data.username || 'Unknown',
          email: data.email || '',
          role: data.role || 'user',
          photoURL: data.photoURL,
          promotedAt: data.promotedAt?.toDate(),
          promotedBy: data.promotedBy
        });
      });

      setAdmins(adminList);
    } catch (error) {
      console.error('Error loading admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDemote = async (admin: AdminUser) => {
    if (!user || !founderAccess.isFounder) return;

    setActionLoading(admin.id);
    try {
      const result = await demoteAdmin(
        user.uid,
        founderAccess.role,
        admin.id,
        admin.role
      );

      if (result.success) {
        // Refresh list
        await loadAdmins();
      } else {
        alert(result.error);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handlePromote = async (userId: string) => {
    if (!user || !founderAccess.isFounder) return;

    setActionLoading(userId);
    try {
      const result = await promoteToAdmin(user.uid, founderAccess.role, userId);

      if (result.success) {
        await loadAdmins();
      } else {
        alert(result.error);
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Only show if user has at least admin access
  if (!founderAccess.isAdmin && !founderAccess.isFounder) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-500">
        <div className="text-center">
          <span className="text-4xl mb-4 block">🔒</span>
          <p>Zugriff verweigert</p>
          <p className="text-sm mt-2">Admin-Rechte erforderlich</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black text-white p-6"
      style={founderAccess.isFounder ? founderStyles as React.CSSProperties : undefined}
    >
      {/* Header */}
      <FounderHeader isFounder={founderAccess.isFounder} role={founderAccess.role} />

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-800 pb-4">
        <TabButton
          active={activeTab === 'admins'}
          onClick={() => setActiveTab('admins')}
          icon="⚡"
          label="Admin-Verwaltung"
          isFounder={founderAccess.isFounder}
        />
        <TabButton
          active={activeTab === 'nebula'}
          onClick={() => setActiveTab('nebula')}
          icon="✨"
          label="Nebula Grant"
          isFounder={founderAccess.isFounder}
        />
        <TabButton
          active={activeTab === 'audit'}
          onClick={() => setActiveTab('audit')}
          icon="📋"
          label="Audit Log"
          isFounder={founderAccess.isFounder}
        />
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'admins' && (
          <AdminList
            key="admins"
            admins={admins}
            loading={loading}
            isFounder={founderAccess.isFounder}
            actionLoading={actionLoading}
            onDemote={handleDemote}
            onPromote={handlePromote}
            onRefresh={loadAdmins}
          />
        )}
        {activeTab === 'nebula' && (
          <NebulaGrantPanel
            key="nebula"
            userId={user?.uid || ''}
            userRole={founderAccess.role}
            isFounder={founderAccess.isFounder}
          />
        )}
        {activeTab === 'audit' && (
          <AuditLogPanel key="audit" />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function FounderHeader({ isFounder, role }: { isFounder: boolean; role: UserRole }) {
  const badge = useUserBadge(role);

  return (
    <motion.div
      className="mb-8"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="flex items-center gap-4">
        <motion.div
          className={`text-5xl ${isFounder ? 'animate-pulse' : ''}`}
          style={isFounder ? {
            filter: 'drop-shadow(0 0 10px gold)'
          } : undefined}
        >
          {badge.icon}
        </motion.div>
        <div>
          <h1
            className="text-3xl font-bold"
            style={isFounder ? {
              background: 'linear-gradient(135deg, #FFD700 0%, #9333EA 50%, #FFD700 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'founderShimmer 3s ease infinite'
            } : undefined}
          >
            {isFounder ? 'Founder Command Center' : 'Admin Dashboard'}
          </h1>
          <p className="text-gray-400 mt-1">
            {isFounder
              ? 'Absolute Kontrolle über das System'
              : 'Verwaltung & Moderation'
            }
          </p>
        </div>
      </div>

      {isFounder && (
        <motion.div
          className="mt-4 p-3 rounded-lg border"
          style={{
            borderImage: 'linear-gradient(135deg, #FFD700, #9333EA) 1',
            background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(147,51,234,0.1))'
          }}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
        >
          <p className="text-sm text-yellow-400">
            👑 Founder-Modus aktiv – Alle Systembeschränkungen aufgehoben
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  isFounder
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  isFounder: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-all ${
        active
          ? isFounder
            ? 'bg-gradient-to-r from-yellow-500/20 to-purple-500/20 border border-yellow-500/50'
            : 'bg-purple-500/20 border border-purple-500/50'
          : 'bg-gray-800/50 hover:bg-gray-700/50'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </motion.button>
  );
}

function AdminList({
  admins,
  loading,
  isFounder,
  actionLoading,
  onDemote,
  onPromote,
  onRefresh
}: {
  admins: AdminUser[];
  loading: boolean;
  isFounder: boolean;
  actionLoading: string | null;
  onDemote: (admin: AdminUser) => void;
  onPromote: (userId: string) => void;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin text-4xl">⚡</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Aktive Admins ({admins.length})</h2>
        <motion.button
          onClick={onRefresh}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700"
          whileTap={{ scale: 0.95 }}
        >
          🔄
        </motion.button>
      </div>

      <div className="space-y-3">
        {admins.map((admin) => (
          <AdminCard
            key={admin.id}
            admin={admin}
            isFounder={isFounder}
            isLoading={actionLoading === admin.id}
            onDemote={() => onDemote(admin)}
          />
        ))}
      </div>

      {admins.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          Keine Admins gefunden
        </div>
      )}
    </motion.div>
  );
}

function AdminCard({
  admin,
  isFounder,
  isLoading,
  onDemote
}: {
  admin: AdminUser;
  isFounder: boolean;
  isLoading: boolean;
  onDemote: () => void;
}) {
  const badge = useUserBadge(admin.role);
  const isFounderAccount = admin.id === FOUNDER_ID || admin.role === 'founder';

  return (
    <motion.div
      className={`p-4 rounded-xl border ${
        isFounderAccount
          ? 'border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-purple-500/10'
          : 'border-gray-700 bg-gray-800/50'
      }`}
      whileHover={{ scale: 1.01 }}
      layout
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
            style={{
              background: badge.gradient || badge.color
            }}
          >
            {admin.photoURL ? (
              <img
                src={admin.photoURL}
                alt={admin.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              badge.icon
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{admin.username}</span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  background: badge.gradient || badge.color,
                  color: '#000'
                }}
              >
                {badge.label}
              </span>
            </div>
            <p className="text-sm text-gray-400">{admin.email}</p>
            {admin.promotedAt && (
              <p className="text-xs text-gray-500 mt-1">
                Promoted: {admin.promotedAt.toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Actions - Only visible for Founder */}
        {isFounder && !isFounderAccount && (
          <motion.button
            onClick={onDemote}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <>⬇️ Demote</>
            )}
          </motion.button>
        )}

        {/* Founder Badge */}
        {isFounderAccount && (
          <div
            className="px-4 py-2 rounded-lg text-sm font-bold"
            style={{
              background: 'linear-gradient(135deg, #FFD700, #9333EA)',
              color: '#000'
            }}
          >
            👑 UNTOUCHABLE
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NEBULA GRANT PANEL
// ═══════════════════════════════════════════════════════════════════════════

function NebulaGrantPanel({
  userId,
  userRole,
  isFounder
}: {
  userId: string;
  userRole: UserRole;
  isFounder: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [grantDuration, setGrantDuration] = useState(30);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      // Search by username
      const usernameQuery = query(
        collection(db, 'users'),
        where('username', '>=', searchQuery),
        where('username', '<=', searchQuery + '\uf8ff'),
        limit(10)
      );

      const snapshot = await getDocs(usernameQuery);
      const results: SearchResult[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        results.push({
          id: doc.id,
          username: data.username || 'Unknown',
          email: data.email || '',
          role: data.role || 'user',
          photoURL: data.photoURL,
          isPremium: data.isPremium,
          premiumUntil: data.premiumUntil?.toDate()
        });
      });

      // Also try direct ID lookup
      if (results.length === 0) {
        try {
          const directDoc = await getDoc(doc(db, 'users', searchQuery));
          if (directDoc.exists()) {
            const data = directDoc.data();
            results.push({
              id: directDoc.id,
              username: data.username || 'Unknown',
              email: data.email || '',
              role: data.role || 'user',
              photoURL: data.photoURL,
              isPremium: data.isPremium,
              premiumUntil: data.premiumUntil?.toDate()
            });
          }
        } catch {}
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleGrant = async (targetUser: SearchResult) => {
    setActionLoading(targetUser.id);
    try {
      const result = await grantNebulaPremium(
        userId,
        userRole,
        targetUser.id,
        grantDuration
      );

      if (result.success) {
        // Update local state
        setSearchResults(prev =>
          prev.map(u =>
            u.id === targetUser.id
              ? { ...u, isPremium: true, premiumUntil: result.grantedUntil }
              : u
          )
        );
      } else {
        alert(result.error);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (targetUser: SearchResult) => {
    setActionLoading(targetUser.id);
    try {
      const result = await revokeNebulaPremium(userId, userRole, targetUser.id);

      if (result.success) {
        setSearchResults(prev =>
          prev.map(u =>
            u.id === targetUser.id
              ? { ...u, isPremium: false, premiumUntil: undefined }
              : u
          )
        );
      } else {
        alert(result.error);
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span className="text-2xl">✨</span>
          Nebula Grant System
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Verteile Premium-Status an würdige User
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Username oder User-ID eingeben..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>
          <motion.button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              isFounder
                ? 'bg-gradient-to-r from-yellow-500 to-purple-500 text-black'
                : 'bg-purple-500 text-white'
            } disabled:opacity-50`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {searching ? '🔍' : 'Suchen'}
          </motion.button>
        </div>

        {/* Duration selector */}
        <div className="mt-4 flex items-center gap-4">
          <span className="text-sm text-gray-400">Premium-Dauer:</span>
          <select
            value={grantDuration}
            onChange={(e) => setGrantDuration(Number(e.target.value))}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none"
          >
            <option value={7}>7 Tage</option>
            <option value={30}>30 Tage</option>
            <option value={90}>90 Tage</option>
            <option value={365}>1 Jahr</option>
            <option value={9999}>∞ Permanent</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {searchResults.map((user) => (
          <motion.div
            key={user.id}
            className="p-4 rounded-xl border border-gray-700 bg-gray-800/50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xl">👤</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{user.username}</span>
                    {user.isPremium && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                        ✨ Premium
                      </span>
                    )}
                    {user.role === 'founder' && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gradient-to-r from-yellow-500 to-purple-500 text-black font-bold">
                        👑 Founder
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{user.email}</p>
                  {user.premiumUntil && (
                    <p className="text-xs text-gray-500">
                      Premium bis: {user.premiumUntil.toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Grant/Revoke Buttons */}
              {user.role !== 'founder' && (
                <div className="flex gap-2">
                  {!user.isPremium ? (
                    <motion.button
                      onClick={() => handleGrant(user)}
                      disabled={actionLoading === user.id}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        isFounder
                          ? 'bg-gradient-to-r from-yellow-500 to-purple-500 text-black'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      } disabled:opacity-50`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {actionLoading === user.id ? '⏳' : '✨ Grant Premium'}
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={() => handleRevoke(user)}
                      disabled={actionLoading === user.id}
                      className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {actionLoading === user.id ? '⏳' : '❌ Revoke'}
                    </motion.button>
                  )}
                </div>
              )}

              {user.role === 'founder' && (
                <div className="text-sm text-yellow-400">
                  👑 Ghost Premium aktiv
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {searchResults.length === 0 && searchQuery && !searching && (
          <div className="text-center py-10 text-gray-500">
            Keine User gefunden für "{searchQuery}"
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT LOG PANEL
// ═══════════════════════════════════════════════════════════════════════════

interface AuditEntry {
  id: string;
  actorId: string;
  action: string;
  targetUserId: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

function AuditLogPanel() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLog();
  }, []);

  const loadAuditLog = async () => {
    try {
      const logsQuery = query(
        collection(db, 'admin_audit_log'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(logsQuery);
      const logEntries: AuditEntry[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        logEntries.push({
          id: doc.id,
          actorId: data.actorId,
          action: data.action,
          targetUserId: data.targetUserId,
          metadata: data.metadata || {},
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });

      setLogs(logEntries);
    } catch (error) {
      console.error('Error loading audit log:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'DEMOTE_ADMIN': return '⬇️';
      case 'PROMOTE_ADMIN': return '⬆️';
      case 'NEBULA_GRANT': return '✨';
      case 'REVOKE_PREMIUM': return '❌';
      case 'BAN_USER': return '🚫';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin text-4xl">📋</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 className="text-xl font-semibold mb-4">Admin Audit Log</h2>

      <div className="space-y-2">
        {logs.map((log) => (
          <motion.div
            key={log.id}
            className="p-3 rounded-lg bg-gray-800/50 border border-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{getActionIcon(log.action)}</span>
                <div>
                  <span className="font-medium">{log.action}</span>
                  <p className="text-sm text-gray-400">
                    Target: {log.targetUserId.slice(0, 8)}...
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">
                  {log.timestamp.toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  {log.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {logs.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            Keine Audit-Einträge vorhanden
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS KEYFRAMES (Add to global styles)
// ═══════════════════════════════════════════════════════════════════════════

export const founderKeyframes = `
@keyframes founderShimmer {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes founderPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(147, 51, 234, 0.3); }
  50% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(147, 51, 234, 0.5); }
}

@keyframes founderFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}
`;

export default AdminPowerPanel;
