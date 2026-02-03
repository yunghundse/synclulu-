/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AURA NETWORK - Interactive Node Visualization v1.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * A 3D-like interactive network of glowing nodes representing:
 * - Active voice rooms (Wölkchen)
 * - Online friends nearby
 * - New discovery hotspots
 *
 * Features:
 * - Swipe navigation through the network
 * - Long-press to scan for new nodes
 * - Tap nodes for quick preview
 * - GPU-accelerated animations
 *
 * @design Midnight Obsidian with Violet/Indigo accents
 * @version 1.0.0
 */

import React, { useState, useCallback, useMemo, memo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AuraNode {
  id: string;
  x: number; // 0-1 normalized position
  y: number; // 0-1 normalized position
  type: 'activeCloud' | 'friendOnline' | 'newHotspot' | 'regionalBonus';
  name: string;
  count: number;
  roomId?: string;
  userId?: string;
  avatarUrl?: string;
  xpMultiplier?: number;
  isNew?: boolean;
}

export interface AuraEdge {
  from: string;
  to: string;
  strength?: number; // 0-1 connection strength
}

interface AuraNetworkProps {
  nodes: AuraNode[];
  edges: AuraEdge[];
  onNodeTap: (node: AuraNode) => void;
  onScan: () => Promise<AuraNode[]>;
  isScanning?: boolean;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const NODE_COLORS = {
  activeCloud: {
    primary: '#8b5cf6',
    secondary: '#c084fc',
    glow: 'rgba(139, 92, 246, 0.5)',
  },
  friendOnline: {
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16, 185, 129, 0.5)',
  },
  newHotspot: {
    primary: '#f59e0b',
    secondary: '#fbbf24',
    glow: 'rgba(245, 158, 11, 0.5)',
  },
  regionalBonus: {
    primary: '#ec4899',
    secondary: '#f472b6',
    glow: 'rgba(236, 72, 153, 0.5)',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SINGLE NODE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface NodeProps {
  node: AuraNode;
  onTap: (node: AuraNode) => void;
  isScanning: boolean;
}

const NetworkNode = memo<NodeProps>(({ node, onTap, isScanning }) => {
  const colors = NODE_COLORS[node.type];
  const size = node.type === 'activeCloud' ? 24 : node.type === 'friendOnline' ? 20 : 16;

  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: isScanning ? [0.3, 1, 0.3] : 1,
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        scale: { type: 'spring', stiffness: 300, damping: 20 },
        opacity: isScanning ? { repeat: Infinity, duration: 1.5 } : { duration: 0.3 },
      }}
      whileHover={{ scale: 1.3 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => onTap(node)}
      style={{ cursor: 'pointer' }}
    >
      {/* Outer Glow */}
      <motion.circle
        cx={node.x * 100}
        cy={node.y * 100}
        r={size * 1.5}
        fill={colors.glow}
        animate={{
          r: [size * 1.5, size * 2, size * 1.5],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          repeat: Infinity,
          duration: 2 + Math.random(),
          ease: 'easeInOut',
        }}
      />

      {/* Main Node */}
      <circle
        cx={node.x * 100}
        cy={node.y * 100}
        r={size}
        fill={`url(#gradient-${node.type})`}
        stroke={colors.primary}
        strokeWidth="0.5"
      />

      {/* Inner Highlight */}
      <circle
        cx={node.x * 100}
        cy={node.y * 100}
        r={size * 0.4}
        fill="rgba(255, 255, 255, 0.3)"
      />

      {/* Count Badge for active rooms */}
      {node.count > 0 && node.type === 'activeCloud' && (
        <g>
          <circle
            cx={node.x * 100 + size * 0.7}
            cy={node.y * 100 - size * 0.7}
            r={6}
            fill="#ef4444"
            stroke="#0a0a0a"
            strokeWidth="1"
          />
          <text
            x={node.x * 100 + size * 0.7}
            y={node.y * 100 - size * 0.7 + 2}
            fill="white"
            fontSize="5"
            textAnchor="middle"
            fontWeight="bold"
          >
            {node.count > 9 ? '9+' : node.count}
          </text>
        </g>
      )}

      {/* New Indicator */}
      {node.isNew && (
        <motion.circle
          cx={node.x * 100 - size * 0.7}
          cy={node.y * 100 - size * 0.7}
          r={4}
          fill="#fbbf24"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      )}
    </motion.g>
  );
});

NetworkNode.displayName = 'NetworkNode';

// ═══════════════════════════════════════════════════════════════════════════
// EDGE (CONNECTION LINE) COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface EdgeProps {
  from: AuraNode;
  to: AuraNode;
  strength?: number;
}

const NetworkEdge = memo<EdgeProps>(({ from, to, strength = 0.5 }) => (
  <motion.line
    x1={from.x * 100}
    y1={from.y * 100}
    x2={to.x * 100}
    y2={to.y * 100}
    stroke="rgba(139, 92, 246, 0.3)"
    strokeWidth={0.5 + strength * 0.5}
    initial={{ pathLength: 0, opacity: 0 }}
    animate={{ pathLength: 1, opacity: 0.3 + strength * 0.4 }}
    transition={{ duration: 1, ease: 'easeOut' }}
  />
));

NetworkEdge.displayName = 'NetworkEdge';

// ═══════════════════════════════════════════════════════════════════════════
// SCAN EFFECT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const ScanEffect = memo(() => (
  <motion.circle
    cx="50"
    cy="50"
    r="5"
    fill="none"
    stroke="rgba(139, 92, 246, 0.8)"
    strokeWidth="1"
    initial={{ r: 5, opacity: 1 }}
    animate={{ r: 60, opacity: 0 }}
    transition={{
      repeat: Infinity,
      duration: 1.5,
      ease: 'easeOut',
    }}
  />
));

ScanEffect.displayName = 'ScanEffect';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN AURA NETWORK COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const AuraNetwork: React.FC<AuraNetworkProps> = memo(({
  nodes,
  edges,
  onNodeTap,
  onScan,
  isScanning = false,
  className = '',
}) => {
  const [translation, setTranslation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create node lookup map for edges
  const nodeMap = useMemo(() => {
    const map = new Map<string, AuraNode>();
    nodes.forEach(node => map.set(node.id, node));
    return map;
  }, [nodes]);

  // Handle touch/mouse start
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - translation.x,
      y: e.clientY - translation.y
    };

    // Start long press timer for scan
    longPressTimer.current = setTimeout(async () => {
      if ('vibrate' in navigator) {
        navigator.vibrate([20, 10, 30]);
      }
      setScanActive(true);
      try {
        await onScan();
      } finally {
        setScanActive(false);
      }
    }, 600);
  }, [translation, onScan]);

  // Handle movement
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    // Cancel long press if user is dragging
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;

    // Limit translation range
    const maxOffset = 100;
    setTranslation({
      x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
      y: Math.max(-maxOffset, Math.min(maxOffset, newY)),
    });
  }, [isDragging]);

  // Handle release
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{
        touchAction: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Background Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(30, 20, 50, 0.8) 0%, transparent 70%)',
        }}
      />

      {/* SVG Network */}
      <motion.svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        style={{
          x: translation.x * 0.3,
          y: translation.y * 0.3,
        }}
      >
        {/* Gradient Definitions */}
        <defs>
          {Object.entries(NODE_COLORS).map(([type, colors]) => (
            <radialGradient key={type} id={`gradient-${type}`} cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor={colors.secondary} />
              <stop offset="100%" stopColor={colors.primary} />
            </radialGradient>
          ))}

          {/* Glow Filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges (Connections) */}
        <g filter="url(#glow)">
          {edges.map((edge, index) => {
            const fromNode = nodeMap.get(edge.from);
            const toNode = nodeMap.get(edge.to);
            if (!fromNode || !toNode) return null;
            return (
              <NetworkEdge
                key={`edge-${index}`}
                from={fromNode}
                to={toNode}
                strength={edge.strength}
              />
            );
          })}
        </g>

        {/* Scan Effect */}
        <AnimatePresence>
          {(scanActive || isScanning) && <ScanEffect />}
        </AnimatePresence>

        {/* Nodes */}
        <g filter="url(#glow)">
          <AnimatePresence>
            {nodes.map((node) => (
              <NetworkNode
                key={node.id}
                node={node}
                onTap={onNodeTap}
                isScanning={scanActive || isScanning}
              />
            ))}
          </AnimatePresence>
        </g>
      </motion.svg>

      {/* Scan Instruction Overlay */}
      <AnimatePresence>
        {(scanActive || isScanning) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-purple-600/20 backdrop-blur-sm px-6 py-3 rounded-full border border-purple-500/30">
              <p className="text-sm font-semibold text-purple-300">
                Scanne nach neuen Vibes...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Long Press Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
        <p className="text-[10px] text-white/20 font-medium tracking-wider uppercase">
          Gedrückt halten zum Scannen
        </p>
      </div>
    </motion.div>
  );
});

AuraNetwork.displayName = 'AuraNetwork';

export default AuraNetwork;
