/**
 * NebulaMap.tsx
 * 🌌 INTERACTIVE LIVE MAP - Nebula Space Visualization v2.0
 *
 * Now with DUAL MODE:
 * - Radar View: Original CSS-based radar visualization
 * - Map View: Real Leaflet map with OpenStreetMap tiles
 *
 * Features:
 * - User's current position (pulsing dot)
 * - Nearby hotspots with activity indicators
 * - Real-time distance calculations
 * - Touch interactions for hotspot selection
 * - Toggle between Radar and Map view
 *
 * @version 2.0.0
 */

import React, { memo, useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Compass, Navigation, Zap, Radio, Map, Radar } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface MapHotspot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  userCount: number;
  activityLevel: 'ruhig' | 'aktiv' | 'sehr_aktiv' | 'hot';
  category?: string;
  distance?: number; // in meters
}

type ViewMode = 'radar' | 'map';

interface NebulaMapProps {
  userLocation?: { lat: number; lng: number } | null;
  hotspots: MapHotspot[];
  selectedHotspotId?: string | null;
  onHotspotSelect?: (hotspotId: string) => void;
  onHotspotJoin?: (hotspotId: string) => void;
  maxDistance?: number; // Max distance to show in meters
  isLoading?: boolean;
  defaultView?: ViewMode; // Default view mode
}

// Map tile URLs (free, no API key required)
const DARK_MAP_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const MAP_ATTRIBUTION = '&copy; OpenStreetMap &copy; CARTO';

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const getActivityColor = (level: MapHotspot['activityLevel']): string => {
  switch (level) {
    case 'hot': return '#ef4444';
    case 'sehr_aktiv': return '#f97316';
    case 'aktiv': return '#a855f7';
    default: return '#6b7280';
  }
};

const getActivityGlow = (level: MapHotspot['activityLevel']): string => {
  switch (level) {
    case 'hot': return 'rgba(239, 68, 68, 0.5)';
    case 'sehr_aktiv': return 'rgba(249, 115, 22, 0.4)';
    case 'aktiv': return 'rgba(168, 85, 247, 0.3)';
    default: return 'rgba(107, 114, 128, 0.2)';
  }
};

const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

// Convert lat/lng to relative position within a bounding box
const geoToPosition = (
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  scale: number
): { x: number; y: number } => {
  // Simple mercator-like projection
  const x = (lng - centerLng) * scale * 100 + 50;
  const y = (centerLat - lat) * scale * 100 + 50;
  return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// User Position Marker
const UserMarker = memo(function UserMarker() {
  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 will-change-transform"
      style={{ transform: 'translate(-50%, -50%) translateZ(0)' }}
    >
      {/* Outer Pulse */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: 'rgba(139, 92, 246, 0.3)' }}
        animate={{
          scale: [1, 2.5, 1],
          opacity: [0.6, 0, 0.6],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Middle Pulse */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: 'rgba(139, 92, 246, 0.4)' }}
        animate={{
          scale: [1, 1.8, 1],
          opacity: [0.7, 0, 0.7],
        }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
      />

      {/* Core */}
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
          boxShadow: '0 0 20px rgba(139, 92, 246, 0.6), 0 0 40px rgba(139, 92, 246, 0.3)',
        }}
      >
        <div className="w-2 h-2 rounded-full bg-white" />
      </div>
    </div>
  );
});

// Hotspot Marker
const HotspotMarker = memo(function HotspotMarker({
  hotspot,
  position,
  isSelected,
  onClick,
}: {
  hotspot: MapHotspot;
  position: { x: number; y: number };
  isSelected: boolean;
  onClick: () => void;
}) {
  const color = getActivityColor(hotspot.activityLevel);
  const glow = getActivityGlow(hotspot.activityLevel);

  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.9 }}
      className="absolute z-10 will-change-transform"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%) translateZ(0)',
      }}
    >
      {/* Selection Ring */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${color}`,
            transform: 'scale(1.8)',
          }}
          animate={{ scale: [1.8, 2.2, 1.8], opacity: [0.8, 0.4, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* Activity Pulse */}
      {hotspot.activityLevel === 'hot' && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: glow }}
          animate={{
            scale: [1, 2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      {/* Marker Body */}
      <div
        className="relative w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
          boxShadow: `0 0 15px ${glow}`,
          border: isSelected ? '2px solid white' : 'none',
        }}
      >
        <Users size={16} className="text-white" />

        {/* User Count Badge */}
        <div
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1"
          style={{
            background: '#050505',
            border: `2px solid ${color}`,
          }}
        >
          <span className="text-[9px] font-bold text-white">
            {hotspot.userCount > 99 ? '99+' : hotspot.userCount}
          </span>
        </div>
      </div>

      {/* Label */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap"
        >
          <div
            className="px-2 py-1 rounded-lg text-[10px] font-medium text-white"
            style={{
              background: 'rgba(5, 5, 5, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {hotspot.name}
          </div>
        </motion.div>
      )}
    </motion.button>
  );
});

// Grid Lines
const MapGrid = memo(function MapGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Horizontal Lines */}
      {[20, 40, 60, 80].map((pos) => (
        <div
          key={`h-${pos}`}
          className="absolute left-0 right-0 h-px"
          style={{
            top: `${pos}%`,
            background: 'linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.1) 50%, transparent 100%)',
          }}
        />
      ))}

      {/* Vertical Lines */}
      {[20, 40, 60, 80].map((pos) => (
        <div
          key={`v-${pos}`}
          className="absolute top-0 bottom-0 w-px"
          style={{
            left: `${pos}%`,
            background: 'linear-gradient(180deg, transparent 0%, rgba(139, 92, 246, 0.1) 50%, transparent 100%)',
          }}
        />
      ))}

      {/* Center Crosshair */}
      <div
        className="absolute left-1/2 top-0 bottom-0 w-px"
        style={{ background: 'rgba(139, 92, 246, 0.2)' }}
      />
      <div
        className="absolute top-1/2 left-0 right-0 h-px"
        style={{ background: 'rgba(139, 92, 246, 0.2)' }}
      />
    </div>
  );
});

// Radar Sweep Animation - GPU Accelerated
const RadarSweep = memo(function RadarSweep() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute left-1/2 top-1/2 w-full h-full origin-center will-change-transform"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(139, 92, 246, 0.15) 30deg, transparent 60deg)',
          transform: 'translate(-50%, -50%) translateZ(0)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
});

// Distance Rings
const DistanceRings = memo(function DistanceRings({ maxDistance }: { maxDistance: number }) {
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {rings.map((ratio) => (
        <div
          key={ratio}
          className="absolute rounded-full"
          style={{
            width: `${ratio * 90}%`,
            height: `${ratio * 90}%`,
            border: '1px dashed rgba(139, 92, 246, 0.15)',
          }}
        />
      ))}

      {/* Distance Labels */}
      <span
        className="absolute text-[8px] text-white/20 font-medium"
        style={{ top: '12%', left: '52%' }}
      >
        {formatDistance(maxDistance * 0.25)}
      </span>
      <span
        className="absolute text-[8px] text-white/20 font-medium"
        style={{ top: '25%', left: '52%' }}
      >
        {formatDistance(maxDistance * 0.5)}
      </span>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// LEAFLET MAP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// Custom user marker icon for Leaflet
const createUserMarkerIcon = () => L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div style="position: relative; width: 24px; height: 24px;">
      <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(139, 92, 246, 0.3); animation: pulse 2s infinite;"></div>
      <div style="position: absolute; inset: 4px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6, #a855f7); box-shadow: 0 0 20px rgba(139, 92, 246, 0.6);"></div>
      <div style="position: absolute; inset: 8px; border-radius: 50%; background: white;"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Custom hotspot marker icon for Leaflet
const createHotspotMarkerIcon = (hotspot: MapHotspot, isSelected: boolean) => {
  const color = getActivityColor(hotspot.activityLevel);
  return L.divIcon({
    className: 'custom-hotspot-marker',
    html: `
      <div style="position: relative; width: 40px; height: 40px;">
        <div style="
          position: absolute; inset: 0; border-radius: 50%;
          background: linear-gradient(135deg, ${color}, ${color}dd);
          box-shadow: 0 0 15px ${getActivityGlow(hotspot.activityLevel)};
          ${isSelected ? 'border: 2px solid white;' : ''}
          display: flex; align-items: center; justify-content: center;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div style="
          position: absolute; top: -4px; right: -4px;
          min-width: 18px; height: 18px; border-radius: 50%;
          background: #050505; border: 2px solid ${color};
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: bold; color: white;
        ">${hotspot.userCount > 99 ? '99+' : hotspot.userCount}</div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Map Controller for centering
const MapCenterController = memo(function MapCenterController({
  center
}: {
  center: { lat: number; lng: number }
}) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], 15);
  }, [map, center.lat, center.lng]);
  return null;
});

// Leaflet Map View Component
const LeafletMapView = memo(function LeafletMapView({
  userLocation,
  hotspots,
  selectedId,
  onHotspotClick,
  onHotspotJoin,
}: {
  userLocation: { lat: number; lng: number };
  hotspots: MapHotspot[];
  selectedId: string | null;
  onHotspotClick: (id: string) => void;
  onHotspotJoin?: (id: string) => void;
}) {
  return (
    <MapContainer
      center={[userLocation.lat, userLocation.lng]}
      zoom={15}
      className="w-full h-full rounded-[24px]"
      zoomControl={false}
      attributionControl={false}
      style={{ background: '#050505' }}
    >
      <TileLayer url={DARK_MAP_URL} attribution={MAP_ATTRIBUTION} />
      <MapCenterController center={userLocation} />

      {/* User location marker */}
      <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserMarkerIcon()}>
        <Popup className="nebula-popup">
          <div className="text-center p-2">
            <p className="font-bold text-sm">Du bist hier</p>
          </div>
        </Popup>
      </Marker>

      {/* Activity zone circles */}
      <Circle
        center={[userLocation.lat, userLocation.lng]}
        radius={500}
        pathOptions={{ color: 'rgba(139, 92, 246, 0.3)', fillColor: 'rgba(139, 92, 246, 0.1)', weight: 1 }}
      />
      <Circle
        center={[userLocation.lat, userLocation.lng]}
        radius={1000}
        pathOptions={{ color: 'rgba(139, 92, 246, 0.2)', fillColor: 'transparent', weight: 1, dashArray: '5, 10' }}
      />

      {/* Hotspot markers */}
      {hotspots.map((hotspot) => (
        <Marker
          key={hotspot.id}
          position={[hotspot.latitude, hotspot.longitude]}
          icon={createHotspotMarkerIcon(hotspot, selectedId === hotspot.id)}
          eventHandlers={{
            click: () => onHotspotClick(hotspot.id),
          }}
        >
          <Popup className="nebula-popup">
            <div className="p-3 min-w-[180px]" style={{ background: '#1a1a1a', borderRadius: '12px' }}>
              <h4 className="font-bold text-white text-sm mb-1">{hotspot.name}</h4>
              <p className="text-xs text-white/60 mb-3">
                {formatDistance(hotspot.distance || 0)} • {hotspot.userCount} Personen
              </p>
              <button
                onClick={() => onHotspotJoin?.(hotspot.id)}
                className="w-full py-2 rounded-lg text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)' }}
              >
                Beitreten
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const NebulaMap = memo(function NebulaMap({
  userLocation,
  hotspots,
  selectedHotspotId,
  onHotspotSelect,
  onHotspotJoin,
  maxDistance = 2000,
  isLoading = false,
  defaultView = 'map',
}: NebulaMapProps) {
  const [localSelected, setLocalSelected] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);

  const selectedId = selectedHotspotId ?? localSelected;
  const selectedHotspot = hotspots.find((h) => h.id === selectedId);

  // Calculate positions for hotspots
  const hotspotPositions = useMemo(() => {
    if (!userLocation) return [];

    // Dynamic scale based on max distance
    const scale = 40 / maxDistance;

    return hotspots
      .filter((h) => (h.distance || 0) <= maxDistance)
      .map((hotspot) => ({
        hotspot,
        position: geoToPosition(
          hotspot.latitude,
          hotspot.longitude,
          userLocation.lat,
          userLocation.lng,
          scale
        ),
      }));
  }, [hotspots, userLocation, maxDistance]);

  const handleHotspotClick = useCallback((id: string) => {
    setLocalSelected(id);
    onHotspotSelect?.(id);
  }, [onHotspotSelect]);

  // No location state
  if (!userLocation && !isLoading) {
    return (
      <div
        className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden"
        style={{
          background: 'rgba(5, 5, 5, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Compass size={48} className="text-white/20" />
          </motion.div>
          <p className="text-sm text-white/40 text-center px-8">
            Aktiviere GPS um die Nebula-Karte zu sehen
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* View Mode Toggle */}
      <div className="absolute top-3 left-3 z-[1000] flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(5, 5, 5, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <button
          onClick={() => setViewMode('map')}
          className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-violet-500 text-white' : 'text-white/50 hover:text-white'}`}
        >
          <Map size={16} />
        </button>
        <button
          onClick={() => setViewMode('radar')}
          className={`p-2 rounded-lg transition-all ${viewMode === 'radar' ? 'bg-violet-500 text-white' : 'text-white/50 hover:text-white'}`}
        >
          <Radio size={16} />
        </button>
      </div>

      {/* MAP VIEW - Leaflet */}
      {viewMode === 'map' && userLocation && (
        <div className="w-full h-full rounded-[24px] overflow-hidden" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <LeafletMapView
            userLocation={userLocation}
            hotspots={hotspots.filter(h => (h.distance || 0) <= maxDistance)}
            selectedId={selectedId}
            onHotspotClick={handleHotspotClick}
            onHotspotJoin={onHotspotJoin}
          />
        </div>
      )}

      {/* RADAR VIEW - Original CSS visualization */}
      {viewMode === 'radar' && (
      <div
        className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden"
        style={{
          background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.05) 0%, rgba(5, 5, 5, 0.95) 70%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: 'inset 0 0 40px rgba(139, 92, 246, 0.1)',
        }}
      >
        {/* Background Elements */}
        <MapGrid />
        <DistanceRings maxDistance={maxDistance} />
        <RadarSweep />

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Radio size={32} className="text-violet-400" />
            </motion.div>
          </div>
        )}

        {/* Hotspot Markers */}
        {!isLoading && hotspotPositions.map(({ hotspot, position }) => (
          <HotspotMarker
            key={hotspot.id}
            hotspot={hotspot}
            position={position}
            isSelected={selectedId === hotspot.id}
            onClick={() => handleHotspotClick(hotspot.id)}
          />
        ))}

        {/* User Marker (always in center) */}
        {userLocation && <UserMarker />}

        {/* Empty State */}
        {!isLoading && hotspots.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
            <Zap size={32} className="text-white/20 mb-2" />
            <p className="text-xs text-white/30 text-center">
              Keine Wölkchen in deiner Nähe
            </p>
          </div>
        )}

        {/* Compass Rose */}
        <div className="absolute top-3 right-3 z-20">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(5, 5, 5, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Navigation size={14} className="text-violet-400" />
          </div>
        </div>
      </div>
      )}

      {/* Selected Hotspot Details - Shows for both views */}
      <AnimatePresence>
        {selectedHotspot && viewMode === 'radar' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-0 left-0 right-0 p-3"
          >
            <div
              className="p-4 rounded-2xl"
              style={{
                background: 'rgba(5, 5, 5, 0.95)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-white">{selectedHotspot.name}</h4>
                  <p className="text-xs text-white/40">
                    {formatDistance(selectedHotspot.distance || 0)} entfernt • {selectedHotspot.userCount} Personen
                  </p>
                </div>
                <div
                  className="px-2 py-1 rounded-full text-[10px] font-bold uppercase"
                  style={{
                    background: getActivityGlow(selectedHotspot.activityLevel),
                    color: getActivityColor(selectedHotspot.activityLevel),
                  }}
                >
                  {selectedHotspot.activityLevel}
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onHotspotJoin?.(selectedHotspot.id)}
                className="w-full py-3 rounded-xl text-sm font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                }}
              >
                Jetzt beitreten
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default NebulaMap;
