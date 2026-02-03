/**
 * Nebula Upgrade Component - Premium Paywall
 *
 * Beautiful upgrade UI for standard users
 * Hidden automatically for Founder/Admin/Premium
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TIER_CONFIG, TierLevel } from '../lib/nebulaSubscription';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface NebulaUpgradeProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: (plan: 'monthly' | 'yearly') => void;
  currentTier?: TierLevel;
}

interface PricingPlan {
  id: 'monthly' | 'yearly';
  name: string;
  price: string;
  pricePerMonth: string;
  savings?: string;
  popular?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRICING DATA
// ═══════════════════════════════════════════════════════════════════════════

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'monthly',
    name: 'Monatlich',
    price: '9,99 €',
    pricePerMonth: '9,99 €/Monat'
  },
  {
    id: 'yearly',
    name: 'Jährlich',
    price: '79,99 €',
    pricePerMonth: '6,67 €/Monat',
    savings: 'Spare 33%',
    popular: true
  }
];

const PREMIUM_FEATURES = [
  {
    icon: '🌟',
    title: '15 km Sterne-Radius',
    description: 'Erweitere deinen Horizont auf das Dreifache'
  },
  {
    icon: '☁️',
    title: 'Unbegrenzte Voice-Wölkchen',
    description: 'Schwebe in so vielen Clouds wie du willst'
  },
  {
    icon: '✨',
    title: '10 Sterne täglich',
    description: 'Mehr Chancen auf magische Verbindungen'
  },
  {
    icon: '🎙️',
    title: 'Crystal Audio (256 kbps)',
    description: 'Kristallklare Sprachqualität'
  },
  {
    icon: '👻',
    title: 'Ghost Mode',
    description: 'Verstecke deinen Online-Status'
  },
  {
    icon: '🔮',
    title: 'Nebula Badge',
    description: 'Exklusives Premium-Abzeichen'
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function NebulaUpgrade({ isOpen, onClose, onUpgrade, currentTier = 'FREE' }: NebulaUpgradeProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      onUpgrade?.(selectedPlan);
      // Here you would integrate with your payment provider
      // e.g., Stripe, RevenueCat, etc.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
            style={{
              background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)'
            }}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            {/* Header with Animation */}
            <div className="relative p-6 pb-4 text-center overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 opacity-30">
                <motion.div
                  className="absolute top-0 left-1/4 w-32 h-32 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, #A78BFA 0%, transparent 70%)'
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute top-10 right-1/4 w-24 h-24 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)'
                  }}
                  animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.6, 0.4, 0.6]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>

              {/* Nebula Icon */}
              <motion.div
                className="relative inline-block mb-4"
                animate={{
                  y: [0, -5, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <span className="text-6xl">✨</span>
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(167,139,250,0.4) 0%, transparent 70%)'
                  }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              <h2
                className="text-3xl font-bold mb-2"
                style={{
                  background: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 50%, #C4B5FD 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Nebula Premium
              </h2>
              <p className="text-gray-400">
                Entfessle das volle Potenzial deiner Verbindungen
              </p>
            </div>

            {/* Features */}
            <div className="px-6 pb-4">
              <div className="grid grid-cols-2 gap-3">
                {PREMIUM_FEATURES.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    className="p-3 rounded-xl bg-white/5 border border-white/10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <span className="text-2xl mb-1 block">{feature.icon}</span>
                    <h4 className="text-sm font-medium text-white mb-0.5">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-gray-500 leading-tight">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Pricing Plans */}
            <div className="px-6 pb-4">
              <div className="flex gap-3">
                {PRICING_PLANS.map((plan) => (
                  <motion.button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all relative ${
                      selectedPlan === plan.id
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-700 bg-gray-800/50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Popular Badge */}
                    {plan.popular && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-purple-500 text-xs font-bold text-white">
                        Beliebt
                      </div>
                    )}

                    <div className="text-sm text-gray-400 mb-1">{plan.name}</div>
                    <div className="text-2xl font-bold text-white mb-1">{plan.price}</div>
                    <div className="text-xs text-gray-500">{plan.pricePerMonth}</div>

                    {plan.savings && (
                      <div className="mt-2 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs inline-block">
                        {plan.savings}
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <div className="p-6 pt-2">
              <motion.button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full py-4 rounded-xl font-semibold text-white relative overflow-hidden disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Shimmer Effect */}
                <motion.div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: 'linear-gradient(90deg, transparent, white, transparent)'
                  }}
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                <span className="relative z-10">
                  {isLoading ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="inline-block"
                    >
                      ⏳
                    </motion.span>
                  ) : (
                    `Jetzt upgraden für ${selectedPlan === 'yearly' ? '79,99 €/Jahr' : '9,99 €/Monat'}`
                  )}
                </span>
              </motion.button>

              {/* Terms */}
              <p className="text-xs text-gray-500 text-center mt-4">
                Jederzeit kündbar. Es gelten unsere{' '}
                <a href="/agb" className="text-purple-400 hover:underline">AGB</a>
                {' '}und{' '}
                <a href="/datenschutz" className="text-purple-400 hover:underline">Datenschutzrichtlinien</a>.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UPGRADE PROMPT BANNER
// ═══════════════════════════════════════════════════════════════════════════

interface UpgradeBannerProps {
  onUpgradeClick: () => void;
  feature?: string;
}

export function UpgradeBanner({ onUpgradeClick, feature }: UpgradeBannerProps) {
  return (
    <motion.div
      className="p-4 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-violet-500/10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-4">
        <motion.span
          className="text-3xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ✨
        </motion.span>
        <div className="flex-1">
          <h4 className="font-semibold text-white">
            {feature ? `${feature} freischalten` : 'Upgrade auf Nebula'}
          </h4>
          <p className="text-sm text-gray-400">
            Erweitere deine Möglichkeiten mit Premium
          </p>
        </div>
        <motion.button
          onClick={onUpgradeClick}
          className="px-4 py-2 rounded-lg font-medium text-sm"
          style={{
            background: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Upgrade
        </motion.button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPARISON TABLE
// ═══════════════════════════════════════════════════════════════════════════

export function TierComparisonTable() {
  const features = [
    { name: 'Sterne-Radius', free: '5 km', premium: '15 km', sovereign: '100 km' },
    { name: 'Voice-Wölkchen', free: '1', premium: '∞', sovereign: '∞' },
    { name: 'Tägliche Sterne', free: '3', premium: '10', sovereign: '∞' },
    { name: 'Audio-Qualität', free: '96 kbps', premium: '256 kbps', sovereign: '256 kbps' },
    { name: 'Ghost Mode', free: '❌', premium: '✅', sovereign: '✅' },
    { name: 'Admin Panel', free: '❌', premium: '❌', sovereign: '✅' }
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-3 px-4 text-gray-400">Feature</th>
            <th className="text-center py-3 px-4 text-gray-400">Free</th>
            <th className="text-center py-3 px-4 text-purple-400">Nebula</th>
            <th className="text-center py-3 px-4 text-yellow-400">Sovereign</th>
          </tr>
        </thead>
        <tbody>
          {features.map((row) => (
            <tr key={row.name} className="border-b border-gray-800">
              <td className="py-3 px-4 text-white">{row.name}</td>
              <td className="text-center py-3 px-4 text-gray-400">{row.free}</td>
              <td className="text-center py-3 px-4 text-purple-300">{row.premium}</td>
              <td className="text-center py-3 px-4 text-yellow-300">{row.sovereign}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default NebulaUpgrade;
