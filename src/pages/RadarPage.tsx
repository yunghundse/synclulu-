/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RADAR PAGE v2.0 - Elastic Proximity Engine Edition
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Features:
 * - Patent-level Elastic Proximity Engine visualization
 * - Dynamic aura that breathes with network activity
 * - Privacy-preserving user discovery
 * - Hotspot tunneling for sparse areas
 *
 * @design Apple Maps meets Social Discovery
 * @version 2.0.0 - Silicon Valley Edition
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
  Navigation, Compass, Shield, Eye, EyeOff
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
      <div className="min-h-screen bg-gradient-to-b from-violet-950 via-purple-950 to-black flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Navigation className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Standort aktivieren</h1>
          <p className="text-violet-200 mb-6 max-w-xs mx-auto">
            Um deine Aura zu entfalten und Menschen in der Nähe zu entdecken
          </p>
          <button
            onClick={requestPermission}
            className="px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg shadow-violet-500/30"
          >
            Standort freigeben
          </button>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (geoError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-950 via-purple-950 to-black flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Standort nicht verfügbar</h1>
          <p className="text-violet-200">{geoError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-950 via-purple-950 to-black">
      {/* Expansion Indicator */}
      <AuraExpansionIndicator aura={aura} />

      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between bg-black/20 backdrop-blur-lg">
        <button onClick={() => navigate(-1)} className="p-2">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <div className="flex items-center gap-2">
          <Radar className="w-5 h-5 text-violet-400" />
          <span className="font-bold text-white">Elastic Aura</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrivacyInfo(true)}
            className="p-2 rounded-full hover:bg-white/10"
          >
            <Shield className="w-5 h-5 text-green-400" />
          </button>
          <button
            onClick={refreshAura}
            className={`p-2 rounded-full hover:bg-white/10 ${auraLoading ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1">
        {/* View Toggle */}
        <div className="flex justify-center gap-2 p-4">
          <button
            onClick={() => setViewMode('aura')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              viewMode === 'aura'
                ? 'bg-violet-500 text-white'
                : 'bg-white/10 text-white/60'
            }`}
          >
            <Compass className="w-4 h-4 inline mr-2" />
            Aura
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-violet-500 text-white'
                : 'bg-white/10 text-white/60'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Liste ({stats.totalNearby})
          </button>
        </div>

        {/* Aura View */}
        {viewMode === 'aura' && (
          <div className="px-4">
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
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{aura?.currentRadius.toFixed(0) || '-'}</div>
                <div className="text-xs text-violet-300">km Radius</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.activeNearby}</div>
                <div className="text-xs text-violet-300">Aktiv</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-amber-400">{aura?.magicDensity.toFixed(1) || '-'}</div>
                <div className="text-xs text-violet-300">/km² Magie</div>
              </div>
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="px-4 pb-24">
            {/* Filter */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setFilterActive(!filterActive)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
                  filterActive
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-white/10 text-white/60'
                }`}
              >
                {filterActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {filterActive ? 'Nur Aktive' : 'Alle zeigen'}
              </button>
              <span className="text-white/40 text-sm">{nearbyUsers.length} gefunden</span>
            </div>

            {/* User List */}
            <div className="space-y-3">
              {nearbyUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-violet-400 mx-auto mb-4 opacity-50" />
                  <p className="text-white/60">Keine Nutzer in der Nähe</p>
                  <p className="text-white/40 text-sm mt-1">Deine Aura weitet sich aus...</p>
                </div>
              ) : (
                nearbyUsers.map((user, index) => (
                  <motion.button
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleUserTap(user.id)}
                    className="w-full bg-white/5 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all"
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold text-lg">
                            {user.displayName[0]}
                          </span>
                        )}
                      </div>
                      {user.isActive && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-violet-950" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{user.displayName}</span>
                        {user.isPremium && <Crown className="w-4 h-4 text-amber-400" />}
                        {user.isStar && <Star className="w-4 h-4 text-pink-400" fill="currentColor" />}
                      </div>
                      <div className="text-sm text-white/50">@{user.username}</div>
                    </div>

                    {/* Distance Badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.distance === 'same'
                        ? 'bg-green-500/20 text-green-400'
                        : user.distance === 'near'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-white/10 text-white/50'
                    }`}>
                      {user.distance === 'same' ? 'Sehr nah' :
                       user.distance === 'near' ? 'In der Nähe' : 'Weiter weg'}
                    </div>

                    <ChevronRight className="w-5 h-5 text-white/30" />
                  </motion.button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Privacy Info Modal */}
      <AnimatePresence>
        {showPrivacyInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShowPrivacyInfo(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-gradient-to-b from-violet-900 to-purple-950 rounded-t-3xl p-6"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />

              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-8 h-8 text-green-400" />
                <h2 className="text-xl font-bold text-white">Privacy by Design</h2>
              </div>

              <div className="space-y-4 text-white/80 text-sm">
                <p>
                  <strong className="text-white">Deine exakten Koordinaten werden NIE gespeichert.</strong>
                </p>
                <p>
                  Wir verwenden ein Hexagonal-Cell-System (ähnlich H3 von Uber), das nur ungefähre Bereiche vergleicht.
                </p>
                <p>
                  <strong className="text-green-400">Dein Geohash:</strong> {privacyLocation?.geohash || 'Lädt...'}
                </p>
                <p>
                  <strong className="text-violet-400">Deine Hex-Cell:</strong> {privacyLocation?.hexCell || 'Lädt...'}
                </p>
                <p>
                  Andere User sehen nur, ob sie in derselben oder benachbarten Cell sind - nie deinen genauen Standort.
                </p>
              </div>

              <button
                onClick={() => setShowPrivacyInfo(false)}
                className="w-full mt-6 py-4 bg-white/10 rounded-2xl text-white font-semibold"
              >
                Verstanden
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RadarPage;
