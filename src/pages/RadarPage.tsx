/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RADAR PAGE - Sovereign Discovery v23.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Features:
 * - Theme-aware design (light/dark mode)
 * - Elastic Proximity Engine visualization
 * - Dynamic aura with breathing animation
 * - Privacy-preserving user discovery
 * - Hotspot tunneling for sparse areas
 *
 * @design Sovereign Discovery v23.0
 * @version 23.0.0
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuraVisualization, AuraBadge, AuraExpansionIndicator } from '@/components/AuraVisualization';
import { useElasticProximity, GeoCoordinates, AuraState } from '@/lib/elasticProximityEngine';
import { usePrivacyLocation, findNearbyUsersPrivate } from '@/lib/geohashPrivacy';
import { useStore } from '@/lib/store';
import { useGeolocation } from '@/hooks/useGeolocation';
import {
  ChevronLeft, Settings, Filter, MapPin, Users,
  Sparkles, Crown, Star, Clock, ChevronRight,
  Zap, Heart, MessageCircle, Radar, RefreshCw,
  Navigation, Compass, Shield, Eye, EyeOff, User
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface NearbyUser {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  distance: 'same' | 'near' | 'far';
  hexCell: string;
  isActive: boolean;
  isPremium?: boolean;
  isStar?: boolean;
  lastSeen?: Date;
  interests?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// RADAR PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const RadarPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const { location, error: geoError, requestPermission } = useGeolocation();

  // EPE State
  const userLocation: GeoCoordinates | null = location ? {
    latitude: location.latitude,
    longitude: location.longitude
  } : null;

  const userInterests = user?.interests || [];
  const { aura, isLoading: auraLoading, refresh: refreshAura } = useElasticProximity(
    userLocation,
    userInterests
  );

  // Privacy Location
  const privacyLocation = usePrivacyLocation(userLocation);

  // Nearby users
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // UI State
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);
  const [filterActive, setFilterActive] = useState(false);
  const [viewMode, setViewMode] = useState<'aura' | 'list'>('aura');

  // Fetch nearby users when location changes
  useEffect(() => {
    if (!userLocation) return;

    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const users = await findNearbyUsersPrivate(
          userLocation.latitude,
          userLocation.longitude,
          aura?.currentRadius || 5
        );

        // Mock user data - in production this would come from Firestore
        const mockUsers: NearbyUser[] = users.map((u, i) => ({
          id: u.id,
          displayName: `User ${i + 1}`,
          username: `user${i + 1}`,
          avatarUrl: undefined,
          distance: u.distance,
          hexCell: u.hexCell,
          isActive: Math.random() > 0.3,
          isPremium: Math.random() > 0.7,
          isStar: Math.random() > 0.9
        }));

        setNearbyUsers(filterActive
          ? mockUsers.filter(u => u.isActive)
          : mockUsers
        );
      } catch (error) {
        console.error('Error fetching nearby users:', error);
      }
      setIsLoadingUsers(false);
    };

    fetchUsers();
  }, [userLocation, aura?.currentRadius, filterActive]);

  // Stats
  const stats = useMemo(() => ({
    totalNearby: nearbyUsers.length,
    activeNearby: nearbyUsers.filter(u => u.isActive).length,
    sameCell: nearbyUsers.filter(u => u.distance === 'same').length,
    nearCell: nearbyUsers.filter(u => u.distance === 'near').length
  }), [nearbyUsers]);

  // Handle user tap
  const handleUserTap = (userId: string) => {
    navigate(`/user/${userId}`);
  };

  // Request location permission
  if (!location && !geoError) {
    return (
      <div className="min-h-screen bg-[var(--synclulu-bg)] flex flex-col items-center justify-center p-6 theme-transition">
        {/* Background gradient */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--synclulu-accent)]/10 via-transparent to-transparent" />
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center relative z-10"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--synclulu-accent)] to-pink-500 flex items-center justify-center shadow-xl"
            style={{ boxShadow: '0 0 40px var(--synclulu-accent)' }}
          >
            <Navigation className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-[var(--synclulu-text)] mb-2">
            Standort aktivieren
          </h1>
          <p className="text-[var(--synclulu-muted)] mb-6 max-w-xs mx-auto">
            Um deine Aura zu entfalten und Menschen in der Nähe zu entdecken
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={requestPermission}
            className="px-8 py-4 bg-gradient-to-r from-[var(--synclulu-accent)] to-pink-500 text-white font-semibold rounded-2xl shadow-lg"
            style={{ boxShadow: '0 4px 20px var(--synclulu-accent)' }}
          >
            Standort freigeben
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (geoError) {
    return (
      <div className="min-h-screen bg-[var(--synclulu-bg)] flex flex-col items-center justify-center p-6 theme-transition">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <MapPin className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-[var(--synclulu-text)] mb-2">
            Standort nicht verfügbar
          </h1>
          <p className="text-[var(--synclulu-muted)]">{geoError}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-6 py-3 bg-[var(--synclulu-card)] text-[var(--synclulu-text)] rounded-xl border border-[var(--synclulu-border)]"
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--synclulu-bg)] safe-top safe-bottom pb-24 theme-transition">
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--synclulu-accent)]/5 via-transparent to-transparent" />
        {/* Animated glow */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, var(--synclulu-accent) 0%, transparent 70%)' }}
        />
      </div>

      {/* Expansion Indicator */}
      <AuraExpansionIndicator aura={aura} />

      {/* Header */}
      <header className="sticky top-0 z-40 glass-nav border-b border-[var(--synclulu-border)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-[var(--synclulu-card)] flex items-center justify-center shadow-sm border border-[var(--synclulu-border)]"
          >
            <ChevronLeft className="w-5 h-5 text-[var(--synclulu-muted)]" />
          </motion.button>

          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <Radar className="w-5 h-5 text-[var(--synclulu-accent)]" />
            </motion.div>
            <span className="font-display font-bold text-[var(--synclulu-text)]">Elastic Aura</span>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPrivacyInfo(true)}
              className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center"
            >
              <Shield className="w-5 h-5 text-green-500" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={refreshAura}
              className={`w-10 h-10 rounded-xl bg-[var(--synclulu-card)] flex items-center justify-center shadow-sm border border-[var(--synclulu-border)] ${auraLoading ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-5 h-5 text-[var(--synclulu-muted)]" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10">
        {/* View Toggle */}
        <div className="flex justify-center gap-2 p-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('aura')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              viewMode === 'aura'
                ? 'bg-[var(--synclulu-accent)] text-white shadow-lg'
                : 'bg-[var(--synclulu-card)] text-[var(--synclulu-muted)] border border-[var(--synclulu-border)]'
            }`}
          >
            <Compass className="w-4 h-4 inline mr-2" />
            Aura
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('list')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-[var(--synclulu-accent)] text-white shadow-lg'
                : 'bg-[var(--synclulu-card)] text-[var(--synclulu-muted)] border border-[var(--synclulu-border)]'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Liste ({stats.totalNearby})
          </motion.button>
        </div>

        {/* Aura View */}
        <AnimatePresence mode="wait">
          {viewMode === 'aura' && (
            <motion.div
              key="aura"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="px-4"
            >
              <div className="relative aspect-square max-w-md mx-auto">
                <AuraVisualization
                  userLocation={userLocation}
                  userInterests={userInterests}
                  showMiniMap={true}
                  onUserTap={handleUserTap}
                  className="w-full h-full"
                />
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-[var(--synclulu-card)] backdrop-blur-sm rounded-2xl p-4 text-center shadow-sm border border-[var(--synclulu-border)]"
                >
                  <div className="text-2xl font-bold text-[var(--synclulu-text)]">
                    {aura?.currentRadius.toFixed(0) || '-'}
                  </div>
                  <div className="text-xs text-[var(--synclulu-muted)]">km Radius</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-[var(--synclulu-card)] backdrop-blur-sm rounded-2xl p-4 text-center shadow-sm border border-[var(--synclulu-border)]"
                >
                  <div className="text-2xl font-bold text-green-500">{stats.activeNearby}</div>
                  <div className="text-xs text-[var(--synclulu-muted)]">Aktiv</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-[var(--synclulu-card)] backdrop-blur-sm rounded-2xl p-4 text-center shadow-sm border border-[var(--synclulu-border)]"
                >
                  <div className="text-2xl font-bold text-amber-500">
                    {aura?.magicDensity.toFixed(1) || '-'}
                  </div>
                  <div className="text-xs text-[var(--synclulu-muted)]">/km² Magie</div>
                </motion.div>
              </div>

              {/* Info Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 p-4 bg-[var(--synclulu-accent)]/10 rounded-2xl border border-[var(--synclulu-accent)]/20"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[var(--synclulu-accent)] mt-0.5" />
                  <div>
                    <p className="font-semibold text-[var(--synclulu-text)] text-sm">
                      Deine Aura passt sich an
                    </p>
                    <p className="text-xs text-[var(--synclulu-muted)] mt-1">
                      Je mehr Menschen in deiner Nähe sind, desto fokussierter wird dein Radius.
                      In ruhigeren Gegenden dehnt sich deine Aura automatisch aus.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-4 pb-24"
            >
              {/* Filter */}
              <div className="flex items-center justify-between mb-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilterActive(!filterActive)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    filterActive
                      ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                      : 'bg-[var(--synclulu-card)] text-[var(--synclulu-muted)] border border-[var(--synclulu-border)]'
                  }`}
                >
                  {filterActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {filterActive ? 'Nur Aktive' : 'Alle zeigen'}
                </motion.button>
                <span className="text-[var(--synclulu-muted)] text-sm">
                  {nearbyUsers.length} gefunden
                </span>
              </div>

              {/* User List */}
              <div className="space-y-3">
                {nearbyUsers.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--synclulu-accent)]/10 flex items-center justify-center"
                    >
                      <Sparkles className="w-8 h-8 text-[var(--synclulu-accent)]" />
                    </motion.div>
                    <p className="text-[var(--synclulu-text)] font-semibold">Keine Nutzer in der Nähe</p>
                    <p className="text-[var(--synclulu-muted)] text-sm mt-1">
                      Deine Aura weitet sich aus...
                    </p>
                  </motion.div>
                ) : (
                  nearbyUsers.map((nearbyUser, index) => (
                    <motion.button
                      key={nearbyUser.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleUserTap(nearbyUser.id)}
                      className="w-full bg-[var(--synclulu-card)] backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-[var(--synclulu-border)] hover:border-[var(--synclulu-accent)]/30 transition-all"
                    >
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--synclulu-accent)] to-pink-500 flex items-center justify-center">
                          {nearbyUser.avatarUrl ? (
                            <img src={nearbyUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-6 h-6 text-white" />
                          )}
                        </div>
                        {nearbyUser.isActive && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[var(--synclulu-card)]" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--synclulu-text)]">
                            {nearbyUser.displayName}
                          </span>
                          {nearbyUser.isPremium && <Crown className="w-4 h-4 text-amber-500" />}
                          {nearbyUser.isStar && <Star className="w-4 h-4 text-pink-500" fill="currentColor" />}
                        </div>
                        <div className="text-sm text-[var(--synclulu-muted)]">@{nearbyUser.username}</div>
                      </div>

                      {/* Distance Badge */}
                      <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                        nearbyUser.distance === 'same'
                          ? 'bg-green-500/10 text-green-500'
                          : nearbyUser.distance === 'near'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-[var(--synclulu-bg)] text-[var(--synclulu-muted)]'
                      }`}>
                        {nearbyUser.distance === 'same' ? 'Sehr nah' :
                         nearbyUser.distance === 'near' ? 'In der Nähe' : 'Weiter weg'}
                      </div>

                      <ChevronRight className="w-5 h-5 text-[var(--synclulu-muted)]" />
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Privacy Info Modal */}
      <AnimatePresence>
        {showPrivacyInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShowPrivacyInfo(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-[var(--synclulu-card)] rounded-t-3xl p-6 border-t border-x border-[var(--synclulu-border)]"
            >
              <div className="w-12 h-1 bg-[var(--synclulu-border)] rounded-full mx-auto mb-6" />

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-[var(--synclulu-text)]">Privacy by Design</h2>
              </div>

              <div className="space-y-4 text-[var(--synclulu-muted)] text-sm">
                <p>
                  <strong className="text-[var(--synclulu-text)]">Deine exakten Koordinaten werden NIE gespeichert.</strong>
                </p>
                <p>
                  Wir verwenden ein Hexagonal-Cell-System (ähnlich H3 von Uber), das nur ungefähre Bereiche vergleicht.
                </p>
                <div className="p-4 bg-[var(--synclulu-bg)] rounded-xl space-y-2">
                  <p className="flex items-center justify-between">
                    <span className="text-green-500 font-medium">Dein Geohash:</span>
                    <code className="text-[var(--synclulu-text)] font-mono text-xs bg-[var(--synclulu-card)] px-2 py-1 rounded">
                      {privacyLocation?.geohash || 'Lädt...'}
                    </code>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-[var(--synclulu-accent)] font-medium">Deine Hex-Cell:</span>
                    <code className="text-[var(--synclulu-text)] font-mono text-xs bg-[var(--synclulu-card)] px-2 py-1 rounded">
                      {privacyLocation?.hexCell || 'Lädt...'}
                    </code>
                  </p>
                </div>
                <p>
                  Andere User sehen nur, ob sie in derselben oder benachbarten Cell sind - nie deinen genauen Standort.
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPrivacyInfo(false)}
                className="w-full mt-6 py-4 bg-[var(--synclulu-accent)] rounded-2xl text-white font-semibold"
              >
                Verstanden
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RadarPage;
