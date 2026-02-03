/**
 * BETA COUNTER COMPONENT
 * Live-Counter für die verbleibenden Beta-Plätze
 */

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Users, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  BetaCounter as BetaCounterType,
  subscribeToBetaCounter,
  getUrgencyLevel,
  getUrgencyColor,
  getCounterDisplayText,
  BETA_CONFIG,
} from '@/lib/betaCounterSystem';

interface BetaCounterProps {
  variant?: 'hero' | 'compact' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  showWaitlist?: boolean;
  showProgress?: boolean;
  animated?: boolean;
  onWaitlistClick?: () => void;
  onSlotsChange?: (slots: number) => void;
}

const BetaCounterComponent = ({
  variant = 'hero',
  size = 'md',
  showWaitlist = true,
  showProgress = false,
  animated = true,
  onWaitlistClick,
  onSlotsChange,
}: BetaCounterProps) => {
  const [counter, setCounter] = useState<BetaCounterType | null>(null);
  const [displayNumber, setDisplayNumber] = useState(0);
  const prevNumberRef = useRef(0);

  useEffect(() => {
    const unsubscribe = subscribeToBetaCounter((newCounter) => {
      setCounter(newCounter);
      // Notify parent about slot changes
      if (onSlotsChange && newCounter) {
        onSlotsChange(newCounter.availableSlots);
      }
    });

    return () => unsubscribe();
  }, [onSlotsChange]);

  // Animated counter
  useEffect(() => {
    if (!counter) return;

    const target = counter.availableSlots;
    const prev = prevNumberRef.current;

    if (prev === target) {
      setDisplayNumber(target);
      return;
    }

    // Animate from prev to target
    const duration = 1500;
    const steps = 30;
    const stepValue = (target - prev) / steps;
    const stepDuration = duration / steps;

    let current = prev;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current += stepValue;

      if (step >= steps) {
        setDisplayNumber(target);
        prevNumberRef.current = target;
        clearInterval(interval);
      } else {
        setDisplayNumber(Math.round(current));
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [counter?.availableSlots]);

  if (!counter) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-2xl h-24" />
    );
  }

  const urgencyLevel = getUrgencyLevel(counter.availableSlots);
  const urgencyColor = getUrgencyColor(counter.availableSlots);
  const displayText = getCounterDisplayText(counter.availableSlots);

  // Hero variant (for landing/register page)
  if (variant === 'hero') {
    return (
      <div
        className="relative overflow-hidden rounded-3xl p-6 text-center"
        style={{
          background: `linear-gradient(135deg, ${urgencyColor}15 0%, ${urgencyColor}05 100%)`,
          border: `2px solid ${urgencyColor}30`,
        }}
      >
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full opacity-50"
              style={{
                backgroundColor: urgencyColor,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Urgency icon */}
        <div
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: `${urgencyColor}20` }}
        >
          {urgencyLevel === 'closed' ? (
            <Clock size={32} style={{ color: urgencyColor }} />
          ) : urgencyLevel === 'critical' ? (
            <AlertTriangle size={32} style={{ color: urgencyColor }} className="animate-pulse" />
          ) : (
            <Users size={32} style={{ color: urgencyColor }} />
          )}
        </div>

        {/* Counter display */}
        <div className="relative z-10">
          <p className="text-sm text-gray-600 mb-2">{displayText.prefix}</p>

          <div className="flex items-center justify-center gap-3 mb-2">
            <span
              className="text-6xl font-black tabular-nums"
              style={{ color: urgencyColor }}
            >
              {displayNumber}
            </span>
            {urgencyLevel === 'critical' && (
              <Sparkles
                size={24}
                style={{ color: urgencyColor }}
                className="animate-pulse"
              />
            )}
          </div>

          <p className="text-sm text-gray-500">{displayText.suffix}</p>

          {/* Progress bar */}
          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${(counter.usedSlots / BETA_CONFIG.maxSlots) * 100}%`,
                backgroundColor: urgencyColor,
              }}
            />
          </div>

          {/* Urgency message */}
          {urgencyLevel !== 'none' && (
            <p
              className="mt-4 text-sm font-medium"
              style={{ color: urgencyColor }}
            >
              {urgencyLevel === 'closed'
                ? '🔒 Die Beta ist voll!'
                : urgencyLevel === 'critical'
                ? '🔥 Fast ausverkauft!'
                : '⚡ Schnell sein!'}
            </p>
          )}
        </div>

        {/* Waitlist button (if closed) */}
        {urgencyLevel === 'closed' && showWaitlist && (
          <button
            onClick={onWaitlistClick}
            className="mt-6 w-full py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
          >
            Auf die Warteliste
          </button>
        )}

        {/* Styles */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
      </div>
    );
  }

  // Compact variant (for sidebar/cards)
  if (variant === 'compact') {
    return (
      <div
        className="flex items-center gap-4 p-4 rounded-2xl"
        style={{
          backgroundColor: `${urgencyColor}10`,
          border: `1px solid ${urgencyColor}20`,
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${urgencyColor}20` }}
        >
          {urgencyLevel === 'closed' ? (
            <Clock size={24} style={{ color: urgencyColor }} />
          ) : (
            <Users size={24} style={{ color: urgencyColor }} />
          )}
        </div>
        <div className="flex-1">
          <p className="font-bold text-lg" style={{ color: urgencyColor }}>
            {displayNumber} von {BETA_CONFIG.maxSlots}
          </p>
          <p className="text-xs text-gray-500">Beta-Plätze verfügbar</p>
        </div>
        {urgencyLevel === 'critical' && (
          <Sparkles size={20} style={{ color: urgencyColor }} className="animate-pulse" />
        )}
      </div>
    );
  }

  // Inline variant (for headers/banners)
  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
      style={{
        backgroundColor: `${urgencyColor}15`,
        color: urgencyColor,
      }}
    >
      {urgencyLevel === 'critical' ? (
        <AlertTriangle size={16} className="animate-pulse" />
      ) : (
        <Users size={16} />
      )}
      <span>
        {counter.availableSlots > 0
          ? `${displayNumber} Beta-Plätze`
          : 'Warteliste aktiv'}
      </span>
    </div>
  );
};

export default BetaCounterComponent;
