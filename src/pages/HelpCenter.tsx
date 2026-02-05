/**
 * HelpCenter.tsx
 * 📚 SOVEREIGN HELP CENTER - Glass Panel Design
 *
 * DESIGN: Sovereign Glass Rezept
 * - bg-[#050505] (OLED Black)
 * - bg-white/5 backdrop-blur-xl border border-white/10
 * - Purple Glow accent
 *
 * @version 35.0.0 - Sovereign Glass Edition
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  HelpCircle,
  Cloud,
  Zap,
  Trophy,
  UserPlus,
  Shield,
  Mail,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: React.ReactNode;
  color: string;
}

export default function HelpCenter() {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<string | null>(null);

  const faqItems: FAQItem[] = [
    {
      id: '1',
      question: 'Wie starte ich ein Wölkchen?',
      answer: 'Gehe zur Discover-Seite und tippe auf das Plus-Symbol. Gib deinem Wölkchen einen Namen und wähle, ob es öffentlich oder anonym sein soll. Dein Wölkchen erscheint dann für andere Nutzer in deiner Nähe.',
      icon: <Cloud size={18} />,
      color: '#ec4899',
    },
    {
      id: '2',
      question: 'Wie steige ich im Level auf?',
      answer: 'Du sammelst XP durch verschiedene Aktivitäten: Tägliches Einloggen, Zeit in Voice-Rooms verbringen, und Freunde einladen. Je mehr XP du sammelst, desto höher steigt dein Level automatisch.',
      icon: <Zap size={18} />,
      color: '#f59e0b',
    },
    {
      id: '3',
      question: 'Was ist der Battle Pass?',
      answer: 'Der Battle Pass ist unser kommendes Belohnungssystem - Coming Summer 2026! Sammle jetzt schon XP durch Einladungen, um dir Vorab-Boni zu sichern. Im Battle Pass warten exklusive Rewards auf dich.',
      icon: <Trophy size={18} />,
      color: '#a855f7',
    },
    {
      id: '4',
      question: 'Wie lade ich Freunde ein?',
      answer: 'Gehe zu den Einstellungen und tippe auf "Freunde einladen". Du erhältst einen persönlichen Einladungslink, den du teilen kannst. Für jeden Freund der beitritt, bekommst du 100 XP!',
      icon: <UserPlus size={18} />,
      color: '#22c55e',
    },
    {
      id: '5',
      question: 'Ist mein Standort sicher?',
      answer: 'Ja! Deine genaue Position wird niemals geteilt. Wir zeigen anderen nur einen ungefähren Bereich an. Du kannst den Radius in den Einstellungen anpassen oder den Ghost-Mode aktivieren.',
      icon: <Shield size={18} />,
      color: '#10b981',
    },
  ];

  return (
    <div className="min-h-screen pb-32" style={{ background: '#050505' }}>
      {/* Header - Sovereign Glass Style */}
      <div
        className="sticky top-0 z-50 px-5 py-4"
        style={{
          background: 'rgba(5, 5, 5, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <ArrowLeft size={20} className="text-white/60" />
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <HelpCircle size={20} className="text-purple-400" />
              Hilfe
            </h1>
            <p className="text-xs text-white/40">FAQ & Support</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-6">
        {/* Hero Panel - Sovereign Glass */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl mb-6 text-center"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.1)',
          }}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(168, 85, 247, 0.1))',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)',
            }}
          >
            <HelpCircle size={32} className="text-purple-400" />
          </motion.div>
          <h2 className="text-xl font-bold text-white mb-2">Häufige Fragen</h2>
          <p className="text-sm text-white/40">Alles was du wissen musst</p>
        </motion.div>

        {/* FAQ List - Sovereign Glass Panels */}
        <div className="space-y-3 mb-8">
          {faqItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl overflow-hidden"
              style={{
                background: openId === item.id
                  ? 'rgba(168, 85, 247, 0.1)'
                  : 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                border: openId === item.id
                  ? '1px solid rgba(168, 85, 247, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setOpenId(openId === item.id ? null : item.id)}
                className="w-full p-4 flex items-center gap-3"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.color}20`, color: item.color }}
                >
                  {item.icon}
                </div>
                <span className="flex-1 text-left text-sm font-semibold text-white">
                  {item.question}
                </span>
                <motion.div
                  animate={{ rotate: openId === item.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={18} className="text-white/40" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {openId === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-4 pb-4">
                      <div
                        className="p-4 rounded-xl text-sm text-white/70 leading-relaxed"
                        style={{ background: 'rgba(0, 0, 0, 0.3)' }}
                      >
                        {item.answer}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Contact Panel - Sovereign Glass */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-5 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(168, 85, 247, 0.2)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
              }}
            >
              <MessageCircle size={18} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Noch Fragen?</h3>
              <p className="text-xs text-white/40">Wir helfen dir gerne</p>
            </div>
          </div>

          <motion.a
            href="mailto:support@synclulu.app"
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium text-sm text-white"
            style={{
              background: 'rgba(168, 85, 247, 0.2)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.2)',
            }}
          >
            <Mail size={16} className="text-purple-400" />
            support@synclulu.app
            <ExternalLink size={14} className="text-purple-400/50" />
          </motion.a>
        </motion.div>
      </div>
    </div>
  );
}
