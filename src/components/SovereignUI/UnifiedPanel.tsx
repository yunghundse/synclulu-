/**
 * UnifiedPanel.tsx
 * Settings-Style Panel Design - Head of Design System Edition
 *
 * Features:
 * - Breite, flache Kacheln (border-radius: 24px)
 * - Glass-Morphism Effekt
 * - Links Icon, Mitte Titel/Beschreibung, Rechts Pfeil/Status
 * - Konsistentes Design für alle Seiten
 * - Animations mit Framer Motion
 */

import React, { memo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
interface UnifiedPanelProps {
  icon: ReactNode;
  iconColor?: string;
  iconBg?: string;
  title: string;
  description?: string;
  rightContent?: ReactNode;
  showArrow?: boolean;
  showCheck?: boolean;
  badge?: string | number;
  badgeColor?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'highlight' | 'success' | 'warning';
  className?: string;
}

// ═══════════════════════════════════════════════════════════════
// UNIFIED PANEL COMPONENT
// ═══════════════════════════════════════════════════════════════
export const UnifiedPanel = memo(function UnifiedPanel({
  icon,
  iconColor = '#a855f7',
  iconBg,
  title,
  description,
  rightContent,
  showArrow = true,
  showCheck = false,
  badge,
  badgeColor = '#a855f7',
  onClick,
  disabled = false,
  variant = 'default',
  className = '',
}: UnifiedPanelProps) {
  // Variant Styles
  const variantStyles = {
    default: {
      bg: 'rgba(255, 255, 255, 0.02)',
      border: 'rgba(255, 255, 255, 0.05)',
      hoverBg: 'rgba(255, 255, 255, 0.04)',
    },
    highlight: {
      bg: 'rgba(168, 85, 247, 0.08)',
      border: 'rgba(168, 85, 247, 0.15)',
      hoverBg: 'rgba(168, 85, 247, 0.12)',
    },
    success: {
      bg: 'rgba(34, 197, 94, 0.08)',
      border: 'rgba(34, 197, 94, 0.15)',
      hoverBg: 'rgba(34, 197, 94, 0.12)',
    },
    warning: {
      bg: 'rgba(251, 191, 36, 0.08)',
      border: 'rgba(251, 191, 36, 0.15)',
      hoverBg: 'rgba(251, 191, 36, 0.12)',
    },
  };

  const styles = variantStyles[variant];

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.01, backgroundColor: styles.hoverBg } : {}}
      whileTap={!disabled ? { scale: 0.99 } : {}}
      className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all text-left ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
      style={{
        background: styles.bg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${styles.border}`,
      }}
    >
      {/* Left: Icon */}
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{
          background: iconBg || `${iconColor}15`,
          color: iconColor,
        }}
      >
        {icon}
      </div>

      {/* Center: Title & Description */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-white block truncate">
          {title}
        </span>
        {description && (
          <span className="text-[11px] text-white/40 block truncate mt-0.5">
            {description}
          </span>
        )}
      </div>

      {/* Right: Badge / Check / Arrow / Custom */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {badge !== undefined && (
          <span
            className="px-2.5 py-1 rounded-full text-[10px] font-bold"
            style={{
              background: `${badgeColor}20`,
              color: badgeColor,
            }}
          >
            {badge}
          </span>
        )}

        {rightContent}

        {showCheck && (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(34, 197, 94, 0.2)' }}
          >
            <Check size={14} className="text-green-400" />
          </div>
        )}

        {showArrow && !showCheck && !rightContent && (
          <ChevronRight size={18} className="text-white/20" />
        )}
      </div>
    </motion.button>
  );
});

// ═══════════════════════════════════════════════════════════════
// PANEL GROUP (Für gruppierte Panels)
// ═══════════════════════════════════════════════════════════════
interface PanelGroupProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export const PanelGroup = memo(function PanelGroup({
  title,
  children,
  className = '',
}: PanelGroupProps) {
  return (
    <div className={className}>
      {title && (
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-1">
          {title}
        </h3>
      )}
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// PANEL DIVIDER
// ═══════════════════════════════════════════════════════════════
export const PanelDivider = memo(function PanelDivider() {
  return (
    <div className="h-[1px] bg-white/5 my-4 mx-4" />
  );
});

// ═══════════════════════════════════════════════════════════════
// TOGGLE PANEL (Mit Switch)
// ═══════════════════════════════════════════════════════════════
interface TogglePanelProps {
  icon: ReactNode;
  iconColor?: string;
  title: string;
  description?: string;
  isActive: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const TogglePanel = memo(function TogglePanel({
  icon,
  iconColor = '#a855f7',
  title,
  description,
  isActive,
  onToggle,
  disabled = false,
}: TogglePanelProps) {
  return (
    <UnifiedPanel
      icon={icon}
      iconColor={iconColor}
      title={title}
      description={description}
      onClick={onToggle}
      disabled={disabled}
      showArrow={false}
      variant={isActive ? 'highlight' : 'default'}
      rightContent={
        <div
          className={`w-12 h-7 rounded-full p-1 transition-colors ${
            isActive ? 'bg-violet-500' : 'bg-white/10'
          }`}
        >
          <motion.div
            className="w-5 h-5 rounded-full bg-white shadow-md"
            animate={{ x: isActive ? 20 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </div>
      }
    />
  );
});

// ═══════════════════════════════════════════════════════════════
// STATUS PANEL (Mit Status-Indikator)
// ═══════════════════════════════════════════════════════════════
interface StatusPanelProps {
  icon: ReactNode;
  iconColor?: string;
  title: string;
  description?: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  statusText?: string;
  onClick?: () => void;
}

export const StatusPanel = memo(function StatusPanel({
  icon,
  iconColor = '#a855f7',
  title,
  description,
  status,
  statusText,
  onClick,
}: StatusPanelProps) {
  const statusColors = {
    online: '#22c55e',
    offline: '#6b7280',
    busy: '#ef4444',
    away: '#fbbf24',
  };

  const color = statusColors[status];

  return (
    <UnifiedPanel
      icon={icon}
      iconColor={iconColor}
      title={title}
      description={description}
      onClick={onClick}
      showArrow={!!onClick}
      rightContent={
        <div className="flex items-center gap-2">
          {statusText && (
            <span className="text-[10px] text-white/40">{statusText}</span>
          )}
          <motion.div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: color, boxShadow: `0 0 8px ${color}` }}
            animate={status === 'online' ? { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      }
    />
  );
});

export default UnifiedPanel;
