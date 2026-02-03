/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SOVEREIGN HOME V2 - Aura-Knoten-Netzwerk Edition
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The new psychologically addictive home screen featuring:
 * - Interactive Aura Node Network (3D-like visualization)
 * - Swipe navigation through the network
 * - Long-press Discovery Scan
 * - Quick Preview on node tap
 * - Seamless integration with header and bottom navigation
 *
 * Performance optimized for smooth animations on all devices.
 *
 * @design Midnight Obsidian with Violet/Indigo accents
 * @version 2.0.0
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  MessageCircle, Settings, Plus, User, Bell,
  Sparkles, Cloud
} from 'lucide-react';

// Local Components
import { AuraNetwork, AuraNode, AuraEdge } from './AuraNetwork';
import { AuraQuickPreview } from './AuraQuickPreview';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      const patterns = { light: 10, medium: 25, heavy: 50 };
      navigator.vibrate(patterns[type]);
    } catch (e) {
      // Haptic not supported
    }
  }
}

// Generate edges between nearby nodes
function generateEdges(nodes: AuraNode[]): AuraEdge[] {
  const edges: AuraEdge[] = [];
  const maxDistance = 0.4; // Maximum distance for connection

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < maxDistance) {
        edges.push({
          from: nodes[i].id,
          to: nodes[j].id,
          strength: 1 - (distance / maxDistance),
        });
      }
    }
  }

  return edges;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface ProfileButtonProps {
  user: any;
  onClick: () => void;
  hasNotifications?: boolean;
}

const ProfileButton = memo<ProfileButtonProps>(({ user, onClick, hasNotifications }) => {
  const isFounder = user?.id === FOUNDER_UID;
  const photoURL = user?.photoURL || user?.avatarUrl;
  const trustScore = user?.trustScore || 500;

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative"
    >
      {/* Trust Ring */}
      <svg className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)]" viewBox="0 0 60 60">
        <circle
          cx="30" cy="30" r="28"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2"
        />
        <motion.circle
          cx="30" cy="30" r="28"
          fill="none"
          stroke={trustScore >= 800 ? '#10b981' : trustScore >= 500 ? '#8b5cf6' : '#f59e0b'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${(trustScore / 1000) * 176} 176`}
          initial={{ strokeDashoffset: 176 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />
      </svg>

      {/* Avatar */}
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-black relative z-10">
        {photoURL ? (
          <img src={photoURL} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-lg font-bold">
            {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Founder Crown */}
      {isFounder && (
        <div className="absolute -top-1 -right-1 text-sm z-20">👑</div>
      )}

      {/* Online Indicator */}
      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black z-20" />

      {/* Notification Badge */}
      {hasNotifications && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center z-20"
        >
          <span className="text-[8px] text-white font-bold">!</span>
        </motion.div>
      )}
    </motion.button>
  );
});

ProfileButton.displayName = 'ProfileButton';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const SovereignHomeV2: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useStore();

  // State
  const [nodes, setNodes] = useState<AuraNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedNode, setSelectedNode] = useState<AuraNode | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Generate edges from nodes
  const edges = useMemo(() => generateEdges(nodes), [nodes]);

  // ═══════════════════════════════════════════════════════════════════════════
  // FIREBASE SUBSCRIPTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // Load active rooms as nodes
  useEffect(() => {
    const roomsRef = collection(db, 'rooms');
    const roomsQuery = query(roomsRef, limit(20));

    const unsubscribe = onSnapshot(roomsQuery, (snapshot) => {
      const roomNodes: AuraNode[] = [];

      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        if (data.isActive !== false) {
          // Distribute nodes in a pleasing pattern
          const angle = (index / snapshot.docs.length) * Math.PI * 2;
          const radius = 0.2 + Math.random() * 0.25;
          const x = 0.5 + Math.cos(angle) * radius;
          const y = 0.5 + Math.sin(angle) * radius;

          roomNodes.push({
            id: doc.id,
            x: Math.max(0.1, Math.min(0.9, x)),
            y: Math.max(0.1, Math.min(0.9, y)),
            type: 'activeCloud',
            name: data.name || 'Wölkchen',
            count: (data.participants || []).length,
            roomId: doc.id,
            xpMultiplier: data.xpMultiplier,
            isNew: Date.now() - (data.createdAt?.toMillis() || 0) < 300000, // 5 min
          });
        }
      });

      // Add some decorative nodes if there are few rooms
      if (roomNodes.length < 5) {
        const decorativeNodes: AuraNode[] = [
          {
            id: 'hotspot-1',
            x: 0.15,
            y: 0.3,
            type: 'newHotspot',
            name: 'Entdecken',
            count: 0,
          },
          {
            id: 'hotspot-2',
            x: 0.85,
            y: 0.25,
            type: 'newHotspot',
            name: 'Deine Gegend',
            count: 0,
          },
        ];
        roomNodes.push(...decorativeNodes);
      }

      setNodes(roomNodes);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching rooms:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load unread messages count
  useEffect(() => {
    if (!user?.id) return;

    const messagesRef = collection(db, 'conversations');
    const messagesQuery = query(
      messagesRef,
      where('participants', 'array-contains', user.id),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      let unread = 0;
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const lastRead = data.lastRead?.[user.id]?.toMillis() || 0;
        const lastMessage = data.updatedAt?.toMillis() || 0;
        if (lastMessage > lastRead) unread++;
      });
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleNodeTap = useCallback((node: AuraNode) => {
    triggerHaptic('light');
    setSelectedNode(node);
  }, []);

  const handleScan = useCallback(async (): Promise<AuraNode[]> => {
    setIsScanning(true);
    triggerHaptic('medium');

    // Simulate finding new nodes
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newNode: AuraNode = {
      id: `scan-${Date.now()}`,
      x: 0.3 + Math.random() * 0.4,
      y: 0.3 + Math.random() * 0.4,
      type: 'newHotspot',
      name: 'Neuer Vibe',
      count: 0,
      isNew: true,
    };

    setNodes(prev => [...prev, newNode]);
    setIsScanning(false);
    triggerHaptic('heavy');

    return [newNode];
  }, []);

  const handleJoinRoom = useCallback((roomId: string) => {
    triggerHaptic('medium');
    navigate('/discover', { state: { joinRoomId: roomId } });
  }, [navigate]);

  const handleViewProfile = useCallback((userId: string) => {
    triggerHaptic('light');
    navigate(`/user/${userId}`);
  }, [navigate]);

  const handleExplore = useCallback(() => {
    triggerHaptic('medium');
    navigate('/discover');
  }, [navigate]);

  const handleClosePreview = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Background Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(160deg, #0a0a0c 0%, #1a1a2e 50%, #0a0a0c 100%)',
        }}
      />

      {/* Ambient Glow */}
      <motion.div
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 8,
          ease: 'easeInOut',
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 60%)',
        }}
      />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 safe-top">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Profile Button */}
          <ProfileButton
            user={user}
            onClick={() => navigate('/profile')}
            hasNotifications={unreadCount > 0}
          />

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/notifications')}
              className="relative w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
            >
              <Bell size={20} className="text-white/60" />
            </motion.button>

            {/* Messages */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/messages')}
              className="relative w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
            >
              <MessageCircle size={20} className="text-white/60" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </div>
              )}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Aura Network */}
      <div className="absolute inset-0 pt-24 pb-32">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            >
              <Cloud size={48} className="text-purple-500/50" />
            </motion.div>
          </div>
        ) : (
          <AuraNetwork
            nodes={nodes}
            edges={edges}
            onNodeTap={handleNodeTap}
            onScan={handleScan}
            isScanning={isScanning}
            className="w-full h-full"
          />
        )}
      </div>

      {/* Quick Preview Overlay */}
      <AnimatePresence>
        {selectedNode && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 z-40"
              onClick={handleClosePreview}
            />

            {/* Preview Card */}
            <AuraQuickPreview
              node={selectedNode}
              onClose={handleClosePreview}
              onJoinRoom={handleJoinRoom}
              onViewProfile={handleViewProfile}
              onExplore={handleExplore}
            />
          </>
        )}
      </AnimatePresence>

      {/* Bottom Create Button */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 safe-bottom">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            triggerHaptic('medium');
            navigate('/discover');
          }}
          className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            boxShadow: '0 0 40px rgba(139, 92, 246, 0.5)',
          }}
        >
          {/* Pulse Ring */}
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            }}
          />

          <Plus size={28} className="text-white relative z-10" />
        </motion.button>

        {/* Label */}
        <p className="text-center text-[10px] text-white/30 mt-2 font-semibold tracking-wider uppercase">
          Entdecken
        </p>
      </div>

      {/* Floating Stats Indicator */}
      {nodes.filter(n => n.type === 'activeCloud').length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-32 left-1/2 -translate-x-1/2 z-40"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-lg border border-white/10">
            <Cloud size={14} className="text-purple-400" />
            <span className="text-xs text-white/60">
              {nodes.filter(n => n.type === 'activeCloud').length} aktive Wölkchen
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SovereignHomeV2;
