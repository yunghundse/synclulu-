/**
 * LegalScreen.tsx
 * 📜 SOLID NEBULA v22.0 - Clean Typography Legal Display
 *
 * Features:
 * - Midnight Obsidian theme
 * - Clean, readable typography
 * - Glass panel styling
 * - Accept button
 *
 * @design Solid Nebula v22.0
 * @version 22.0.0
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface LegalScreenProps {
  title: string;
  content: React.ReactNode;
  onAccept?: () => void;
  onBack?: () => void;
  showAcceptButton?: boolean;
  acceptButtonText?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[type]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const LegalScreen: React.FC<LegalScreenProps> = memo(({
  title,
  content,
  onAccept,
  onBack,
  showAcceptButton = true,
  acceptButtonText = 'Verstanden & Akzeptiert',
}) => {
  return (
    <div
      className="min-h-screen p-4 pt-6 pb-32"
      style={{ backgroundColor: '#050505' }}
    >
      {/* Header */}
      {onBack && (
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => {
            triggerHaptic('light');
            onBack();
          }}
          className="mb-6 flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors"
        >
          <ChevronLeft size={20} />
          <span className="text-xs font-bold uppercase tracking-widest">Zurück</span>
        </motion.button>
      )}

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-[32px] p-8"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Title */}
        <h1
          className="text-2xl font-black italic mb-8 tracking-tight uppercase"
          style={{ color: '#a855f7' }}
        >
          {title}
        </h1>

        {/* Content */}
        <div className="space-y-6 text-sm leading-relaxed font-medium" style={{ color: '#9ca3af' }}>
          {typeof content === 'string' ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            content
          )}
        </div>

        {/* Accept Button */}
        {showAcceptButton && onAccept && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => {
              triggerHaptic('medium');
              onAccept();
            }}
            className="mt-12 w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            {acceptButtonText}
          </motion.button>
        )}
      </motion.div>

      {/* Last Updated */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center mt-6 text-[10px] uppercase tracking-widest"
        style={{ color: 'rgba(255, 255, 255, 0.2)' }}
      >
        Zuletzt aktualisiert: Februar 2026
      </motion.p>
    </div>
  );
});

LegalScreen.displayName = 'LegalScreen';

// ═══════════════════════════════════════════════════════════════════════════
// LEGAL SECTION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface LegalSectionProps {
  title: string;
  children: React.ReactNode;
}

export const LegalSection: React.FC<LegalSectionProps> = memo(({ title, children }) => (
  <div className="mb-8">
    <h2
      className="text-sm font-bold uppercase tracking-wider mb-3"
      style={{ color: 'rgba(255, 255, 255, 0.5)' }}
    >
      {title}
    </h2>
    <div className="space-y-3" style={{ color: '#9ca3af' }}>
      {children}
    </div>
  </div>
));

LegalSection.displayName = 'LegalSection';

// ═══════════════════════════════════════════════════════════════════════════
// LEGAL LIST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface LegalListProps {
  items: string[];
}

export const LegalList: React.FC<LegalListProps> = memo(({ items }) => (
  <ul className="space-y-2 pl-4">
    {items.map((item, index) => (
      <li key={index} className="flex items-start gap-3">
        <span style={{ color: '#a855f7' }}>•</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
));

LegalList.displayName = 'LegalList';

export default LegalScreen;
