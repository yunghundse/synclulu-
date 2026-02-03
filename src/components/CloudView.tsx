import { useState, useEffect } from 'react';
import { NearbyUser } from '@/types';
import { getLevelTitle } from '@/lib/uiCopy';

interface CloudViewProps {
  users: NearbyUser[];
  onUserClick?: (user: NearbyUser) => void;
  onCloudClick?: (users: NearbyUser[]) => void;
}

interface Particle {
  id: string;
  user: NearbyUser;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  clusterId?: string;
}

interface Cloud {
  id: string;
  x: number;
  y: number;
  radius: number;
  users: NearbyUser[];
  pulsePhase: number;
}

const CloudView = ({ users, onUserClick, onCloudClick }: CloudViewProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [clouds, setClouds] = useState<Cloud[]>([]);
  const [hoveredCloud, setHoveredCloud] = useState<string | null>(null);
  const [time, setTime] = useState(0);

  // Animation frame
  useEffect(() => {
    let animationId: number;
    const animate = () => {
      setTime(t => t + 0.016); // ~60fps
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Initialize particles from users
  useEffect(() => {
    const newParticles: Particle[] = users.map((user) => ({
      id: user.id,
      user,
      x: 50 + Math.random() * 200,
      y: 50 + Math.random() * 200,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: user.level ? Math.min(12 + user.level / 10, 20) : 10,
      opacity: user.isActive ? 1 : 0.5,
    }));
    setParticles(newParticles);

    // Create cloud clusters based on proximity
    const clusterRadius = 60;
    const cloudClusters: Cloud[] = [];

    newParticles.forEach(p => {
      const nearbyCloud = cloudClusters.find(c =>
        Math.hypot(c.x - p.x, c.y - p.y) < clusterRadius
      );

      if (nearbyCloud) {
        nearbyCloud.users.push(p.user);
        // Recalculate center
        nearbyCloud.x = (nearbyCloud.x + p.x) / 2;
        nearbyCloud.y = (nearbyCloud.y + p.y) / 2;
        nearbyCloud.radius = Math.min(nearbyCloud.radius + 5, 80);
      } else {
        cloudClusters.push({
          id: `cloud_${p.id}`,
          x: p.x,
          y: p.y,
          radius: 40,
          users: [p.user],
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    });

    setClouds(cloudClusters);
  }, [users]);

  // Update particle positions with smooth drifting
  useEffect(() => {
    setParticles(prev => prev.map(p => {
      // Organic drift motion
      const drift = Math.sin(time * 0.5 + p.x * 0.01) * 0.2;
      let newX = p.x + p.vx + drift;
      let newY = p.y + p.vy + Math.cos(time * 0.3 + p.y * 0.01) * 0.15;

      // Bounce off edges
      if (newX < 20 || newX > 280) p.vx *= -1;
      if (newY < 20 || newY > 280) p.vy *= -1;

      newX = Math.max(20, Math.min(280, newX));
      newY = Math.max(20, Math.min(280, newY));

      return { ...p, x: newX, y: newY };
    }));
  }, [time]);

  const containerSize = 300;

  return (
    <div className="relative w-full aspect-square max-w-[320px] mx-auto">
      {/* Background gradient */}
      <div
        className="absolute inset-0 rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #E8E0F0 0%, #F5F0FA 50%, #E0E8F5 100%)',
        }}
      >
        {/* Animated background clouds */}
        <svg
          viewBox="0 0 300 300"
          className="absolute inset-0 w-full h-full"
          style={{ filter: 'blur(20px)', opacity: 0.5 }}
        >
          {[0, 1, 2].map(i => (
            <ellipse
              key={i}
              cx={150 + Math.sin(time * 0.2 + i * 2) * 50}
              cy={150 + Math.cos(time * 0.15 + i * 2) * 30}
              rx={80 + Math.sin(time * 0.3 + i) * 20}
              ry={50 + Math.cos(time * 0.25 + i) * 15}
              fill="rgba(139, 92, 246, 0.15)"
            />
          ))}
        </svg>
      </div>

      {/* Main SVG with GPU acceleration */}
      <svg
        viewBox={`0 0 ${containerSize} ${containerSize}`}
        className="relative w-full h-full"
        style={{ willChange: 'transform' }}
      >
        <defs>
          {/* Cloud gradient */}
          <radialGradient id="cloudGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.4)" />
            <stop offset="70%" stopColor="rgba(139, 92, 246, 0.15)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
          </radialGradient>

          {/* Active user glow */}
          <filter id="activeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Anonymous blur */}
          <filter id="anonBlur">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* Cloud clusters */}
        {clouds.map(cloud => {
          const isHovered = hoveredCloud === cloud.id;
          const pulse = 1 + Math.sin(time * 2 + cloud.pulsePhase) * 0.1;
          const activeCount = cloud.users.filter(u => u.isActive).length;

          return (
            <g
              key={cloud.id}
              onClick={() => onCloudClick?.(cloud.users)}
              onMouseEnter={() => setHoveredCloud(cloud.id)}
              onMouseLeave={() => setHoveredCloud(null)}
              className="cursor-pointer"
              style={{ transform: `scale(${isHovered ? 1.1 : 1})`, transformOrigin: `${cloud.x}px ${cloud.y}px` }}
            >
              {/* Cloud shape */}
              <ellipse
                cx={cloud.x}
                cy={cloud.y}
                rx={cloud.radius * pulse}
                ry={cloud.radius * 0.7 * pulse}
                fill="url(#cloudGradient)"
                className="transition-all duration-300"
              />

              {/* Pulsing ring for active users */}
              {activeCount > 0 && (
                <ellipse
                  cx={cloud.x}
                  cy={cloud.y}
                  rx={cloud.radius * 1.2}
                  ry={cloud.radius * 0.85}
                  fill="none"
                  stroke="rgba(139, 92, 246, 0.3)"
                  strokeWidth="2"
                  className="animate-ping"
                  style={{ animationDuration: '2s' }}
                />
              )}

              {/* User count badge */}
              <g transform={`translate(${cloud.x + cloud.radius * 0.6}, ${cloud.y - cloud.radius * 0.5})`}>
                <circle r="12" fill="#8B5CF6" />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {cloud.users.length}
                </text>
              </g>
            </g>
          );
        })}

        {/* User particles */}
        {particles.map(particle => {
          const levelInfo = getLevelTitle(particle.user.level || 1);
          const isAnonymous = particle.user.visibilityMode === 'anonymous';

          return (
            <g
              key={particle.id}
              onClick={() => onUserClick?.(particle.user)}
              className="cursor-pointer"
              style={{
                transform: `translate(${particle.x}px, ${particle.y}px)`,
                willChange: 'transform',
              }}
            >
              {/* Particle glow for active users */}
              {particle.user.isActive && (
                <circle
                  r={particle.size + 4}
                  fill="rgba(139, 92, 246, 0.2)"
                  filter="url(#activeGlow)"
                />
              )}

              {/* Main particle */}
              <circle
                r={particle.size}
                fill={particle.user.isActive ? '#8B5CF6' : '#CBD5E1'}
                opacity={particle.opacity}
                filter={isAnonymous ? 'url(#anonBlur)' : undefined}
              />

              {/* Level indicator for high-level users */}
              {particle.user.level && particle.user.level >= 20 && (
                <text
                  y={-particle.size - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#8B5CF6"
                >
                  {levelInfo.emoji}
                </text>
              )}

              {/* Trust badge */}
              {particle.user.trustScore && particle.user.trustScore >= 4.5 && (
                <circle
                  cx={particle.size * 0.7}
                  cy={-particle.size * 0.7}
                  r="4"
                  fill="#10B981"
                />
              )}
            </g>
          );
        })}

        {/* Center point (You) */}
        <g transform={`translate(${containerSize / 2}, ${containerSize / 2})`}>
          <circle r="18" fill="#8B5CF6" filter="url(#activeGlow)" />
          <circle r="10" fill="white" />
          <text textAnchor="middle" dominantBaseline="central" fontSize="8" fill="#8B5CF6" fontWeight="bold">
            DU
          </text>
        </g>
      </svg>

      {/* Hovered cloud info */}
      {hoveredCloud && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-lg">
          <p className="text-sm font-semibold text-delulu-text">
            {clouds.find(c => c.id === hoveredCloud)?.users.length} User
          </p>
          <p className="text-xs text-delulu-muted">Tippen zum Beitreten</p>
        </div>
      )}

      {/* User count badge */}
      <div className="absolute top-3 right-3 bg-delulu-violet text-white px-3 py-1.5 rounded-xl shadow-lg">
        <span className="text-xs font-bold">{users.length} in der Nähe</span>
      </div>
    </div>
  );
};

export default CloudView;
