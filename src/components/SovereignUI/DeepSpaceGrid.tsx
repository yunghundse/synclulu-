/**
 * DeepSpaceGrid.tsx
 * Dynamisches Deep-Space Grid das auf Scroll reagiert
 * Perspektivisches Grid mit Nebula-Effekten
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

interface DeepSpaceGridProps {
  intensity?: 'subtle' | 'normal' | 'intense';
  color?: string;
  showNebula?: boolean;
}

// Canvas-basiertes Sternenfeld für Performance
const StarField = React.memo(function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const starsRef = useRef<Array<{ x: number; y: number; size: number; speed: number; opacity: number }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive Canvas
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Generiere Sterne
      starsRef.current = [];
      const starCount = Math.floor((canvas.width * canvas.height) / 8000);
      for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.5,
          speed: Math.random() * 0.02 + 0.005,
          opacity: Math.random() * 0.5 + 0.3,
        });
      }
    };

    resize();
    window.addEventListener('resize', resize);

    // Animation Loop
    let time = 0;
    const animate = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      starsRef.current.forEach((star) => {
        // Twinkling effect
        const twinkle = Math.sin(time * star.speed * 100 + star.x) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${star.opacity * twinkle * 0.2})`;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.7 }}
    />
  );
});

// Perspektivisches Grid
const PerspectiveGrid = React.memo(function PerspectiveGrid({
  scrollProgress,
  color,
}: {
  scrollProgress: number;
  color: string;
}) {
  // Grid bewegt sich basierend auf Scroll
  const gridOffset = scrollProgress * 60;

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{
        perspective: '800px',
        perspectiveOrigin: '50% 100%',
      }}
    >
      <div
        className="absolute w-[200%] h-[200%] left-[-50%]"
        style={{
          transform: `rotateX(70deg) translateY(${gridOffset}px)`,
          transformOrigin: 'center top',
          background: `
            linear-gradient(${color}15 1px, transparent 1px),
            linear-gradient(90deg, ${color}15 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          maskImage: 'linear-gradient(to top, transparent, black 20%, black 80%, transparent)',
          WebkitMaskImage: 'linear-gradient(to top, transparent, black 20%, black 80%, transparent)',
        }}
      />
    </div>
  );
});

// Nebula-Wolken
const NebulaCloud = React.memo(function NebulaCloud({
  x,
  y,
  size,
  color,
  delay,
}: {
  x: string;
  y: string;
  size: number;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}30 0%, ${color}10 40%, transparent 70%)`,
        filter: 'blur(40px)',
      }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      }}
    />
  );
});

// Ambient Glow
const AmbientGlow = React.memo(function AmbientGlow({
  color,
  intensity,
}: {
  color: string;
  intensity: 'subtle' | 'normal' | 'intense';
}) {
  const opacityMap = { subtle: 0.03, normal: 0.06, intense: 0.1 };
  const opacity = opacityMap[intensity];

  return (
    <>
      {/* Top center glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[60%] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 60%)`,
        }}
      />

      {/* Bottom ambient */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[40%] pointer-events-none"
        style={{
          background: `linear-gradient(to top, ${color}${Math.floor(opacity * 0.5 * 255).toString(16).padStart(2, '0')} 0%, transparent 100%)`,
        }}
      />
    </>
  );
});

export const DeepSpaceGrid = React.memo(function DeepSpaceGrid({
  intensity = 'normal',
  color = '#8b5cf6',
  showNebula = true,
}: DeepSpaceGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  // Scroll-Progress für Parallax-Effekte
  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollProgress = Math.min(scrollY / 500, 1);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ background: '#000' }}
    >
      {/* OLED Black Base */}
      <div className="absolute inset-0 bg-black" />

      {/* Ambient Glow */}
      <AmbientGlow color={color} intensity={intensity} />

      {/* Star Field */}
      <StarField />

      {/* Perspective Grid */}
      <PerspectiveGrid scrollProgress={scrollProgress} color={color} />

      {/* Nebula Clouds */}
      {showNebula && (
        <>
          <NebulaCloud x="10%" y="20%" size={400} color="#a855f7" delay={0} />
          <NebulaCloud x="70%" y="10%" size={300} color="#7c3aed" delay={2} />
          <NebulaCloud x="80%" y="60%" size={350} color="#8b5cf6" delay={4} />
          <NebulaCloud x="20%" y="70%" size={250} color="#6366f1" delay={6} />
        </>
      )}

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(0, 0, 0, 0.4) 100%)',
        }}
      />
    </div>
  );
});

export default DeepSpaceGrid;
