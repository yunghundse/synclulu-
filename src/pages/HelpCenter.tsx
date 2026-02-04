/**
 * HelpCenter.tsx
 * 📚 HELP CENTER - Clean FAQ Design
 *
 * @version 34.0.0 - Complete Rebuild
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
    <div className="min-h-screen" style={{ background: '#050505' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-50 px-5 py-4 flex items-center gap-4"
        style={{
          background: 'rgba(5, 5, 5, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(168, 85, 247, 0.15)',
        }}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255, 255, 255, 0.05)' }}
        >
          <ArrowLeft size={20} className="text-white/60" />
        </motion.button>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <HelpCircle size={20} className="text-purple-400" />
          Hilfe
        </h1>
      </div>

      {/* Content */}
      <div className="px-5 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(168, 85, 247, 0.1))',
              border: '1px solid rgba(168, 85, 247, 0.3)',
            }}
          >
            <HelpCircle size={36} className="text-purple-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Häufige Fragen</h2>
          <p className="text-white/50 text-sm">Alles was du wissen musst</p>
        </div>

        {/* FAQ List */}
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
                  ? 'rgba(168, 85, 247, 0.08)'
                  : 'rgba(255, 255, 255, 0.02)',
                border: openId === item.id
                  ? '1px solid rgba(168, 85, 247, 0.25)'
                  : '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <button
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
              </button>

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

        {/* Contact */}
        <div
          className="p-5 rounded-2xl text-center"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <p className="text-white/50 text-sm mb-3">Noch Fragen?</p>
          <a
            href="mailto:support@synclulu.app"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm text-white"
            style={{
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
            }}
          >
            <Mail size={16} className="text-purple-400" />
            support@synclulu.app
          </a>
        </div>
      </div>
    </div>
  );
}
