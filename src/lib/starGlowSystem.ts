/**
 * synclulu STAR-GLOW SYSTEM v2.0
 * "Emotional Engineering at its Finest"
 *
 * EFFECTS:
 * 1. Flying star animation (giver → receiver)
 * 2. Golden particle rain on receiver
 * 3. Haptic feedback patterns
 * 4. Heavenly sound effect
 * 5. Global glow effect in room
 *
 * @design Apple Award Ceremony
 * @version 2.0.0
 */

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

export interface StarGiftEvent {
  fromUserId: string;
  toUserId: string;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
  starCount: number;
  timestamp: number;
}

export interface ParticleConfig {
  count: number;
  colors: string[];
  duration: number;
  spread: number;
  gravity: number;
}

// ═══════════════════════════════════════
// SOUND EFFECTS
// ═══════════════════════════════════════

const SOUNDS = {
  starSend: '/sounds/star-send.mp3',
  starReceive: '/sounds/star-receive.mp3',
  heavenlyChime: '/sounds/heavenly-chime.mp3',
};

class SoundManager {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;

  constructor() {
    // Preload sounds
    Object.entries(SOUNDS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.volume = 0.5;
      this.audioCache.set(key, audio);
    });
  }

  play(soundKey: keyof typeof SOUNDS): void {
    if (!this.enabled) return;

    const audio = this.audioCache.get(soundKey);
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

export const soundManager = new SoundManager();

// ═══════════════════════════════════════
// HAPTIC FEEDBACK
// ═══════════════════════════════════════

export const hapticPatterns = {
  starSend: [15, 30, 15, 30, 50],      // Light double tap + strong
  starReceive: [50, 50, 100, 50, 150], // Celebration pattern
  error: [100, 50, 100],               // Alert
};

export const triggerHaptic = (pattern: keyof typeof hapticPatterns): void => {
  if ('vibrate' in navigator) {
    navigator.vibrate(hapticPatterns[pattern]);
  }
};

// ═══════════════════════════════════════
// PARTICLE SYSTEM
// ═══════════════════════════════════════

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'star' | 'circle' | 'sparkle';
}

export class ParticleSystem {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private animationId: number | null = null;
  private isDestroyed: boolean = false;

  private defaultConfig: ParticleConfig = {
    count: 50,
    colors: ['#FFD700', '#FFA500', '#FF8C00', '#FFE4B5', '#FFFFFF'],
    duration: 2000,
    spread: 360,
    gravity: 0.5,
  };

  /**
   * Create particle burst at position
   */
  burst(
    x: number,
    y: number,
    config?: Partial<ParticleConfig>
  ): Promise<void> {
    return new Promise((resolve) => {
      const cfg = { ...this.defaultConfig, ...config };

      // Create canvas if needed
      if (!this.canvas) {
        this.createCanvas();
      }

      // Generate particles
      for (let i = 0; i < cfg.count; i++) {
        const angle = (Math.random() * cfg.spread * Math.PI) / 180;
        const velocity = 2 + Math.random() * 6;
        const shapes: Particle['shape'][] = ['star', 'circle', 'sparkle'];

        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - 3, // Initial upward boost
          size: 4 + Math.random() * 8,
          color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
          alpha: 1,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
        });
      }

      // Start animation if not running
      if (!this.animationId) {
        this.animate();
      }

      // Resolve after duration
      setTimeout(() => {
        resolve();
      }, cfg.duration);
    });
  }

  /**
   * Create golden rain effect
   */
  goldenRain(duration: number = 3000): Promise<void> {
    return new Promise((resolve) => {
      if (!this.canvas) this.createCanvas();

      const startTime = Date.now();
      const spawnInterval = setInterval(() => {
        if (Date.now() - startTime > duration || this.isDestroyed) {
          clearInterval(spawnInterval);
          setTimeout(resolve, 1000);
          return;
        }

        // Spawn particles along top edge
        for (let i = 0; i < 3; i++) {
          this.particles.push({
            x: Math.random() * window.innerWidth,
            y: -10,
            vx: (Math.random() - 0.5) * 2,
            vy: 2 + Math.random() * 3,
            size: 3 + Math.random() * 5,
            color: ['#FFD700', '#FFA500', '#FFE4B5'][Math.floor(Math.random() * 3)],
            alpha: 1,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 5,
            shape: Math.random() > 0.5 ? 'star' : 'sparkle',
          });
        }
      }, 50);

      if (!this.animationId) {
        this.animate();
      }
    });
  }

  private createCanvas(): void {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    // Handle resize
    window.addEventListener('resize', () => {
      if (this.canvas) {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
      }
    });
  }

  private animate = (): void => {
    if (this.isDestroyed || !this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw particles
    this.particles = this.particles.filter((p) => {
      // Update physics
      p.vy += this.defaultConfig.gravity * 0.1;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.alpha -= 0.01;

      // Remove if faded or off-screen
      if (p.alpha <= 0 || p.y > this.canvas!.height + 50) {
        return false;
      }

      // Draw particle
      this.drawParticle(p);
      return true;
    });

    // Continue animation if particles exist
    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(this.animate);
    } else {
      this.animationId = null;
      this.cleanup();
    }
  };

  private drawParticle(p: Particle): void {
    if (!this.ctx) return;

    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate((p.rotation * Math.PI) / 180);
    this.ctx.globalAlpha = p.alpha;

    switch (p.shape) {
      case 'star':
        this.drawStar(p.size, p.color);
        break;
      case 'sparkle':
        this.drawSparkle(p.size, p.color);
        break;
      default:
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
    }

    this.ctx.restore();
  }

  private drawStar(size: number, color: string): void {
    if (!this.ctx) return;

    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size / 2;

    this.ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.fill();

    // Add glow
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = color;
  }

  private drawSparkle(size: number, color: string): void {
    if (!this.ctx) return;

    this.ctx.beginPath();
    // Vertical line
    this.ctx.moveTo(0, -size);
    this.ctx.lineTo(0, size);
    // Horizontal line
    this.ctx.moveTo(-size, 0);
    this.ctx.lineTo(size, 0);
    // Diagonal lines
    this.ctx.moveTo(-size * 0.7, -size * 0.7);
    this.ctx.lineTo(size * 0.7, size * 0.7);
    this.ctx.moveTo(size * 0.7, -size * 0.7);
    this.ctx.lineTo(-size * 0.7, size * 0.7);

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private cleanup(): void {
    if (this.canvas && this.particles.length === 0) {
      this.canvas.remove();
      this.canvas = null;
      this.ctx = null;
    }
  }

  destroy(): void {
    this.isDestroyed = true;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.canvas) {
      this.canvas.remove();
    }
    this.particles = [];
  }
}

// ═══════════════════════════════════════
// FLYING STAR ANIMATION
// ═══════════════════════════════════════

export const animateFlyingStar = (
  from: { x: number; y: number },
  to: { x: number; y: number },
  duration: number = 800
): Promise<void> => {
  return new Promise((resolve) => {
    // Create star element
    const star = document.createElement('div');
    star.innerHTML = '⭐';
    star.style.cssText = `
      position: fixed;
      left: ${from.x}px;
      top: ${from.y}px;
      font-size: 32px;
      z-index: 10000;
      pointer-events: none;
      filter: drop-shadow(0 0 10px #FFD700);
      transition: all ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1);
    `;
    document.body.appendChild(star);

    // Trigger animation
    requestAnimationFrame(() => {
      star.style.left = `${to.x}px`;
      star.style.top = `${to.y}px`;
      star.style.transform = 'scale(1.5) rotate(360deg)';
    });

    // Cleanup
    setTimeout(() => {
      star.style.opacity = '0';
      star.style.transform = 'scale(2) rotate(720deg)';
      setTimeout(() => star.remove(), 300);
      resolve();
    }, duration);
  });
};

// ═══════════════════════════════════════
// GLOBAL GLOW EFFECT
// ═══════════════════════════════════════

export const triggerGlobalGlow = (color: string = '#FFD700', duration: number = 1500): void => {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: radial-gradient(circle at center, ${color}20 0%, transparent 70%);
    pointer-events: none;
    z-index: 9998;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  document.body.appendChild(overlay);

  // Fade in
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  });

  // Fade out and remove
  setTimeout(() => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 300);
  }, duration);
};

// ═══════════════════════════════════════
// STAR GIFT ORCHESTRATOR
// ═══════════════════════════════════════

export class StarGiftOrchestrator {
  private particleSystem: ParticleSystem;

  constructor() {
    this.particleSystem = new ParticleSystem();
  }

  /**
   * Execute full star gift sequence
   */
  async sendStar(event: StarGiftEvent): Promise<void> {
    // 1. Haptic feedback for sender
    triggerHaptic('starSend');

    // 2. Sound effect
    soundManager.play('starSend');

    // 3. Flying star animation
    await animateFlyingStar(event.fromPosition, event.toPosition);

    // 4. Arrival effects
    triggerHaptic('starReceive');
    soundManager.play('starReceive');
    soundManager.play('heavenlyChime');

    // 5. Particle burst at destination
    this.particleSystem.burst(event.toPosition.x, event.toPosition.y, {
      count: 30 + event.starCount * 10,
      colors: ['#FFD700', '#FFA500', '#FF8C00', '#FFFFE0', '#FFFFFF'],
    });

    // 6. Global glow effect
    triggerGlobalGlow('#FFD700', 1000);

    // 7. Golden rain for receiver
    if (event.starCount >= 3) {
      this.particleSystem.goldenRain(2000);
    }
  }

  /**
   * Execute receive animation (for remote users)
   */
  async receiveStars(position: { x: number; y: number }, count: number): Promise<void> {
    triggerHaptic('starReceive');
    soundManager.play('heavenlyChime');

    this.particleSystem.burst(position.x, position.y, {
      count: 30 + count * 10,
    });

    triggerGlobalGlow('#FFD700', 1500);

    if (count >= 3) {
      await this.particleSystem.goldenRain(2000);
    }
  }

  destroy(): void {
    this.particleSystem.destroy();
  }
}

// Singleton instance
export const starGiftOrchestrator = new StarGiftOrchestrator();
