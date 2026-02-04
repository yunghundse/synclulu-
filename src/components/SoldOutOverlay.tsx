/**
 * Sold Out Overlay - Cloud Full State
 *
 * Beautiful overlay when registration is closed
 * Includes waitlist signup
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { addToWaitlist, extractReferralCode } from '../lib/gatekeeperSystem';

interface SoldOutOverlayProps {
  spotsRemaining?: number;
  waitlistCount?: number;
  onWaitlistJoined?: (position: number) => void;
  onClose?: () => void;
}

export function SoldOutOverlay({
  spotsRemaining = 0,
  waitlistCount = 0,
  onWaitlistJoined,
  onClose
}: SoldOutOverlayProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const referralCode = extractReferralCode();
      const result = await addToWaitlist(email, referralCode || undefined);

      if (result.success) {
        setJoined(true);
        setPosition(result.position);
        onWaitlistJoined?.(result.position);
      } else {
        setError('Fehler beim Beitritt zur Warteliste.');
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: '#0b0b0b' }}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating clouds */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-6xl opacity-10"
            style={{
              left: `${10 + i * 20}%`,
              top: `${20 + (i % 3) * 25}%`
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5
            }}
          >
            ☁️
          </motion.div>
        ))}

        {/* Gradient orbs */}
        <motion.div
          className="absolute w-96 h-96 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)',
            top: '-10%',
            right: '-10%'
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-80 h-80 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, #A78BFA 0%, transparent 70%)',
            bottom: '-5%',
            left: '-5%'
          }}
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {/* Close Button */}
      {onClose && (
        <motion.button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ✕
        </motion.button>
      )}

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-md w-full text-center"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Cloud Icon */}
        <motion.div
          className="text-8xl mb-6 inline-block"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 3, -3, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          style={{
            filter: 'drop-shadow(0 0 30px rgba(139, 92, 246, 0.5))'
          }}
        >
          ☁️
        </motion.div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-4">
          Die Cloud ist{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            voll besetzt
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-gray-400 mb-8 text-lg">
          Nur 10 auserwählte Seelen schweben derzeit in unserer Cloud.
          <br />
          Aber keine Sorge – du kannst dich auf die Warteliste setzen. ✨
        </p>

        <AnimatePresence mode="wait">
          {!joined ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Waitlist Form */}
              <form onSubmit={handleJoinWaitlist} className="space-y-4">
                {/* Glassmorphism Input */}
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Deine E-Mail-Adresse"
                    className="w-full px-5 py-4 rounded-2xl text-white placeholder-gray-500 transition-all duration-300"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                      e.target.style.boxShadow = '0 0 20px rgba(139, 92, 246, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <motion.p
                    className="text-sm px-4 py-2 rounded-xl"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#F87171'
                    }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.p>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full py-4 rounded-2xl font-semibold text-white relative overflow-hidden disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Shimmer */}
                  <motion.div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: 'linear-gradient(90deg, transparent, white, transparent)'
                    }}
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />

                  <span className="relative z-10">
                    {isSubmitting ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="inline-block"
                      >
                        ⏳
                      </motion.span>
                    ) : (
                      '✨ Auf die Warteliste'
                    )}
                  </span>
                </motion.button>
              </form>

              {/* Waitlist Count */}
              {waitlistCount > 0 && (
                <p className="text-gray-500 text-sm mt-4">
                  {waitlistCount} {waitlistCount === 1 ? 'Person wartet' : 'Personen warten'} bereits
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="success"
              className="p-8 rounded-3xl"
              style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)'
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                🎉
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Du bist auf der Liste!
              </h3>
              {position && (
                <p className="text-purple-400 text-lg mb-4">
                  Deine Position: <strong>#{position}</strong>
                </p>
              )}
              <p className="text-gray-400 text-sm">
                Wir benachrichtigen dich, sobald ein Platz frei wird.
                <br />
                Halte die Wolken im Blick! ☁️
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <p className="text-gray-600 text-xs mt-8">
          synclulu – Where dreamers float together
        </p>
      </motion.div>
    </motion.div>
  );
}

export default SoldOutOverlay;
