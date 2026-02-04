/**
 * Admin User Management - Sovereign Control Panel
 *
 * User management with quick toggles for role and premium status
 * Founder-only rights enforcement
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  useIsFounder,
  usePermissions,
  useUserBadge,
  UserRole
} from '../hooks/useFounderAccess';
import {
  FOUNDER_ID,
  checkPowerLevel,
  logAdminAction
} from '../lib/founderProtection';
import { RoleBadge, PremiumIndicator } from './FounderBadge';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ManagedUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isPremium: boolean;
  premiumUntil?: Date;
  photoURL?: string;
  createdAt?: Date;
  lastSeen?: Date;
  safetyScore?: number;
}

type FilterType = 'all' | 'admins' | 'premium' | 'users';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AdminUserManagement() {
  const { user } = useAuth();
  const founderAccess = useIsFounder(user?.uid || null);
  const permissions = usePermissions(founderAccess.role, user?.uid || null);

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const PAGE_SIZE = 20;

  // Load users on mount
  useEffect(() => {
    loadUsers(true);
  }, [filter]);

  const loadUsers = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setUsers([]);
      setLastDoc(null);
    }

    try {
      let q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );

      // Apply filter
      if (filter === 'admins') {
        q = query(
          collection(db, 'users'),
          where('role', 'in', ['admin', 'moderator', 'founder']),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE)
        );
      } else if (filter === 'premium') {
        q = query(
          collection(db, 'users'),
          where('isPremium', '==', true),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE)
        );
      }

      // Pagination
      if (!reset && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const newUsers: ManagedUser[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        newUsers.push({
          id: doc.id,
          username: data.username || 'Unknown',
          email: data.email || '',
          role: data.role || 'user',
          isPremium: data.isPremium || false,
          premiumUntil: data.premiumUntil?.toDate(),
          photoURL: data.photoURL,
          createdAt: data.createdAt?.toDate(),
          lastSeen: data.lastSeen?.toDate(),
          safetyScore: data.safetyScore
        });
      });

      setUsers(prev => reset ? newUsers : [...prev, ...newUsers]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadUsers(true);
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('username', '>=', searchQuery),
        where('username', '<=', searchQuery + '\uf8ff'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const results: ManagedUser[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        results.push({
          id: doc.id,
          username: data.username || 'Unknown',
          email: data.email || '',
          role: data.role || 'user',
          isPremium: data.isPremium || false,
          premiumUntil: data.premiumUntil?.toDate(),
          photoURL: data.photoURL,
          createdAt: data.createdAt?.toDate(),
          lastSeen: data.lastSeen?.toDate(),
          safetyScore: data.safetyScore
        });
      });

      setUsers(results);
      setHasMore(false);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle user role (admin only)
  const toggleAdmin = async (targetUser: ManagedUser) => {
    if (!user) return;

    // Security check
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const action = newRole === 'admin' ? 'UPDATE_ROLE' : 'DEMOTE_ADMIN';

    // Only Founder can demote admins
    if (action === 'DEMOTE_ADMIN' && !founderAccess.isFounder) {
      alert('Nur der Founder kann Admins degradieren.');
      return;
    }

    // Only Founder can promote to admin
    if (newRole === 'admin' && !founderAccess.isFounder) {
      alert('Nur der Founder kann zu Admin befördern.');
      return;
    }

    // Power check
    const powerCheck = checkPowerLevel(
      user.uid,
      founderAccess.role,
      targetUser.id,
      targetUser.role,
      action as any
    );

    if (!powerCheck.allowed) {
      alert(powerCheck.reason);
      return;
    }

    setActionLoading(targetUser.id);
    try {
      await updateDoc(doc(db, 'users', targetUser.id), {
        role: newRole,
        roleUpdatedAt: serverTimestamp(),
        roleUpdatedBy: user.uid
      });

      await logAdminAction(user.uid, action, targetUser.id, {
        previousRole: targetUser.role,
        newRole
      });

      // Update local state
      setUsers(prev =>
        prev.map(u =>
          u.id === targetUser.id ? { ...u, role: newRole as UserRole } : u
        )
      );
    } catch (error) {
      console.error('Error toggling admin:', error);
      alert('Fehler beim Ändern der Rolle');
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle premium status
  const togglePremium = async (targetUser: ManagedUser) => {
    if (!user || !permissions.canGrantPremium) {
      alert('Keine Berechtigung für diese Aktion.');
      return;
    }

    // Can't modify founder
    if (targetUser.id === FOUNDER_ID || targetUser.role === 'founder') {
      alert('Founder hat automatisch Premium-Status.');
      return;
    }

    setActionLoading(targetUser.id);
    try {
      const newPremiumStatus = !targetUser.isPremium;
      const updates: any = {
        isPremium: newPremiumStatus,
        premiumUpdatedAt: serverTimestamp(),
        premiumUpdatedBy: user.uid
      };

      if (newPremiumStatus) {
        // Grant 30 days premium
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);
        updates.premiumUntil = expirationDate;
      } else {
        updates.premiumUntil = null;
      }

      await updateDoc(doc(db, 'users', targetUser.id), updates);

      await logAdminAction(user.uid, newPremiumStatus ? 'NEBULA_GRANT' : 'REVOKE_PREMIUM', targetUser.id, {
        previousStatus: targetUser.isPremium,
        newStatus: newPremiumStatus
      });

      // Update local state
      setUsers(prev =>
        prev.map(u =>
          u.id === targetUser.id
            ? { ...u, isPremium: newPremiumStatus, premiumUntil: newPremiumStatus ? updates.premiumUntil : undefined }
            : u
        )
      );
    } catch (error) {
      console.error('Error toggling premium:', error);
      alert('Fehler beim Ändern des Premium-Status');
    } finally {
      setActionLoading(null);
    }
  };

  // Access check
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
    <div className="min-h-screen bg-[var(--synclulu-bg)] text-[var(--synclulu-text)] p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">User Management</h1>
        <p className="text-[var(--synclulu-text-secondary)]">
          Verwalte Benutzer, Rollen und Premium-Status
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Username suchen..."
            className="flex-1 px-4 py-3 bg-[var(--synclulu-surface)] border border-[var(--synclulu-border)] rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
          />
          <motion.button
            onClick={handleSearch}
            className="px-6 py-3 rounded-xl font-medium bg-purple-500 text-white"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            🔍 Suchen
          </motion.button>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'admins', 'premium', 'users'] as FilterType[]).map((f) => (
            <motion.button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400'
                  : 'bg-[var(--synclulu-surface)] border border-[var(--synclulu-border)] text-[var(--synclulu-text-secondary)]'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {f === 'all' && '👥 Alle'}
              {f === 'admins' && '⚡ Admins'}
              {f === 'premium' && '✨ Premium'}
              {f === 'users' && '👤 Users'}
            </motion.button>
          ))}
        </div>
      </div>

      {/* User List */}
      {loading && users.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                isFounder={founderAccess.isFounder}
                actorRole={founderAccess.role}
                isLoading={actionLoading === u.id}
                onToggleAdmin={() => toggleAdmin(u)}
                onTogglePremium={() => togglePremium(u)}
              />
            ))}
          </AnimatePresence>

          {users.length === 0 && (
            <div className="text-center py-10 text-[var(--synclulu-text-secondary)]">
              Keine Benutzer gefunden
            </div>
          )}

          {/* Load More */}
          {hasMore && !loading && (
            <motion.button
              onClick={() => loadUsers(false)}
              className="w-full py-3 rounded-xl bg-[var(--synclulu-surface)] border border-[var(--synclulu-border)] text-[var(--synclulu-text-secondary)]"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              Mehr laden...
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// USER ROW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface UserRowProps {
  user: ManagedUser;
  isFounder: boolean;
  actorRole: UserRole;
  isLoading: boolean;
  onToggleAdmin: () => void;
  onTogglePremium: () => void;
}

function UserRow({
  user,
  isFounder,
  actorRole,
  isLoading,
  onToggleAdmin,
  onTogglePremium
}: UserRowProps) {
  const isTargetFounder = user.id === FOUNDER_ID || user.role === 'founder';
  const isTargetAdmin = user.role === 'admin' || user.role === 'moderator';

  // Can current user modify this user?
  const canModifyRole = isFounder && !isTargetFounder;
  const canModifyPremium = !isTargetFounder;

  return (
    <motion.div
      className={`p-4 rounded-xl border transition-all ${
        isTargetFounder
          ? 'border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-purple-500/10'
          : isTargetAdmin
            ? 'border-purple-500/30 bg-purple-500/5'
            : 'border-[var(--synclulu-border)] bg-[var(--synclulu-surface)]'
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      layout
    >
      <div className="flex items-center justify-between gap-4">
        {/* User Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-[var(--synclulu-soft)] flex items-center justify-center overflow-hidden flex-shrink-0">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl">👤</span>
            )}
          </div>

          {/* Details */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold truncate">{user.username}</span>
              <RoleBadge role={user.role} isPremium={user.isPremium} size="sm" />
            </div>
            <p className="text-sm text-[var(--synclulu-text-secondary)] truncate">
              {user.email}
            </p>
            {user.lastSeen && (
              <p className="text-xs text-[var(--synclulu-muted)]">
                Zuletzt: {user.lastSeen.toLocaleDateString('de-DE')}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isLoading ? (
            <motion.div
              className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <>
              {/* Admin Toggle - Only for Founder */}
              {canModifyRole && (
                <ToggleSwitch
                  label="Admin"
                  enabled={isTargetAdmin}
                  onChange={onToggleAdmin}
                  color="purple"
                />
              )}

              {/* Premium Toggle */}
              {canModifyPremium && (
                <ToggleSwitch
                  label="Premium"
                  enabled={user.isPremium}
                  onChange={onTogglePremium}
                  color="yellow"
                />
              )}

              {/* Founder Badge (no toggle) */}
              {isTargetFounder && (
                <div
                  className="px-3 py-1 rounded-lg text-xs font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700, #9333EA)',
                    color: '#000'
                  }}
                >
                  👑 FOUNDER
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOGGLE SWITCH COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface ToggleSwitchProps {
  label: string;
  enabled: boolean;
  onChange: () => void;
  color: 'purple' | 'yellow' | 'green' | 'red';
}

function ToggleSwitch({ label, enabled, onChange, color }: ToggleSwitchProps) {
  const colors = {
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    red: 'bg-red-500'
  };

  return (
    <button
      onClick={onChange}
      className="flex items-center gap-2"
    >
      <span className="text-xs text-[var(--synclulu-text-secondary)]">{label}</span>
      <motion.div
        className={`w-10 h-6 rounded-full p-1 transition-colors ${
          enabled ? colors[color] : 'bg-gray-600'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="w-4 h-4 bg-white rounded-full"
          animate={{ x: enabled ? 16 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.div>
    </button>
  );
}

export default AdminUserManagement;
