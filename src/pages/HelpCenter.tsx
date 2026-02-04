/**
 * HelpCenter.tsx
 * 📚 HELP CENTER - Settings-Style Design mit Q&A Akkordeon
 *
 * Features:
 * - Settings-Kachel Design (UnifiedPanel Style)
 * - Akkordeon Q&A Bereich
 * - Schnellzugriff auf wichtige Themen
 * - Kontakt & Support Optionen
 *
 * @version 1.0.0
 */

import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronDown,
  HelpCircle,
  Zap,
  Palette,
  Shield,
  Users,
  MessageCircle,
  Sparkles,
  Volume2,
  Map,
  Heart,
  Mail,
  ExternalLink,
  BookOpen,
  Lightbulb,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// FAQ ITEM COMPONENT (Akkordeon)
// ═══════════════════════════════════════════════════════════════════════════

interface FAQItemProps {
  question: string;
  answer: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItem = memo(function FAQItem({
  question,
  answer,
  icon,
  isOpen,
  onToggle,
}: FAQItemProps) {
  return (
    <motion.div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(168, 85, 247, 0.1)' }}
          >
            {icon}
          </div>
          <span className="text-sm font-bold text-white text-left">{question}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 ml-2"
        >
          <ChevronDown size={18} className="text-white/40" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="px-4 pb-4 text-sm text-white/60 leading-relaxed"
              style={{ borderTop: '1px solid rgba(255, 255, 255, 0.03)' }}
            >
              <div className="pt-3 pl-13">{answer}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// HELP CARD COMPONENT (Settings-Kachel Style)
// ═══════════════════════════════════════════════════════════════════════════

interface HelpCardProps {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  description: string;
  onClick?: () => void;
}

const HelpCard = memo(function HelpCard({
  icon,
  iconColor,
  title,
  description,
  onClick,
}: HelpCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full p-4 rounded-2xl flex items-center gap-4 text-left"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${iconColor}15` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-white mb-0.5">{title}</h3>
        <p className="text-xs text-white/40 truncate">{description}</p>
      </div>
      <ChevronDown size={16} className="text-white/20 -rotate-90 flex-shrink-0" />
    </motion.button>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════════════════════

const SectionHeader = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 mb-3 px-1">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
      {title}
    </span>
    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/10 to-transparent" />
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function HelpCenter() {
  const navigate = useNavigate();
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);

  const toggleFAQ = useCallback((id: string) => {
    setOpenFAQ((prev) => (prev === id ? null : id));
  }, []);

  // FAQ Data
  const faqItems = [
    {
      id: 'sync',
      question: 'Wie starte ich einen Sync?',
      answer:
        'Tippe auf den Kaugummi-Button in der Mitte der Navigation. Wähle "Create Room" um einen neuen Sync-Raum zu erstellen, oder "Discover" um nach existierenden Räumen in deiner Nähe zu suchen. Aktiviere deinen Standort für die beste Erfahrung.',
      icon: <Zap size={18} className="text-purple-400" />,
    },
    {
      id: 'aura',
      question: 'Was bedeuten die Aura-Farben?',
      answer:
        'Die Aura-Farben zeigen deinen Aktivitätslevel und Status. Violett (Standard) = Aktiv, Gold = Founder-Status, Grün = Verfügbar für neue Connections, Pulsierend = Gerade in einem Voice-Room aktiv.',
      icon: <Palette size={18} className="text-purple-400" />,
    },
    {
      id: 'privacy',
      question: 'Wie schütze ich meine Privatsphäre?',
      answer:
        'Gehe zu Einstellungen → Privatsphäre. Dort kannst du deinen Standort-Radius anpassen (50m bis 5km), festlegen wer dir schreiben darf, und den Ghost-Mode aktivieren um unsichtbar zu bleiben. Deine genaue Position wird nie mit anderen geteilt.',
      icon: <Shield size={18} className="text-purple-400" />,
    },
    {
      id: 'voice',
      question: 'Wie funktionieren Voice-Rooms?',
      answer:
        'Voice-Rooms sind temporäre Sprach-Chats basierend auf deinem Standort. Du kannst einem öffentlichen Room beitreten oder einen privaten erstellen. Alle Gespräche werden verschlüsselt und NICHT aufgezeichnet.',
      icon: <Volume2 size={18} className="text-purple-400" />,
    },
    {
      id: 'discover',
      question: 'Was ist die Discover-Map?',
      answer:
        'Die Map zeigt dir anonymisierte Aktivitäts-Hotspots in deiner Umgebung. Du siehst keine einzelnen Nutzer, sondern Bereiche mit aktiven Syncs. Tippe auf einen Hotspot um zu sehen welche Themen dort gerade diskutiert werden.',
      icon: <Map size={18} className="text-purple-400" />,
    },
    {
      id: 'xp',
      question: 'Wie sammle ich XP und Level auf?',
      answer:
        'Du erhältst XP für: Tägliche Logins (Streak-Bonus!), aktive Teilnahme an Voice-Rooms, hilfreiche Bewertungen von anderen Nutzern, und das Einladen von Freunden. Je höher dein Level, desto mehr Features werden freigeschaltet.',
      icon: <Sparkles size={18} className="text-purple-400" />,
    },
    {
      id: 'report',
      question: 'Wie melde ich problematisches Verhalten?',
      answer:
        'In jedem Chat oder Voice-Room kannst du über das Drei-Punkte-Menü einen Nutzer melden. Unsere KI-Moderation prüft Meldungen sofort. Bei ernsten Verstößen werden Accounts umgehend gesperrt. Deine Meldung bleibt anonym.',
      icon: <Shield size={18} className="text-purple-400" />,
    },
    {
      id: 'friends',
      question: 'Wie füge ich Freunde hinzu?',
      answer:
        'Nach einem positiven Sync kannst du eine Freundschaftsanfrage senden. Alternativ kannst du deinen persönlichen Invite-Code teilen (Profil → Freunde einladen). Freunde sehen deinen Online-Status und können dich direkt anschreiben.',
      icon: <Users size={18} className="text-purple-400" />,
    },
  ];

  return (
    <div className="min-h-screen pb-28" style={{ background: '#050505' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-50 px-5 pt-safe pb-4"
        style={{ background: '#050505' }}
      >
        <div className="flex items-center justify-between pt-4">
          <motion.button
            onClick={() => navigate(-1)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-2 text-white/60"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Zurück</span>
          </motion.button>
          <h1 className="text-xs font-black uppercase tracking-[0.3em] text-white/30">
            Hilfe
          </h1>
          <div className="w-16" /> {/* Spacer */}
        </div>
      </div>

      {/* Hero Section */}
      <div className="px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(168, 85, 247, 0.05))',
              boxShadow: '0 0 40px rgba(168, 85, 247, 0.2)',
            }}
          >
            <BookOpen size={36} className="text-purple-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Wie können wir helfen?</h2>
          <p className="text-sm text-white/40">
            Finde Antworten auf häufige Fragen oder kontaktiere uns
          </p>
        </motion.div>
      </div>

      {/* Quick Help Cards */}
      <div className="px-5 mb-6">
        <SectionHeader title="Schnellzugriff" />
        <div className="grid grid-cols-2 gap-3">
          <HelpCard
            icon={<Zap size={20} className="text-purple-400" />}
            iconColor="#a855f7"
            title="Erste Schritte"
            description="Schnellstart-Guide"
            onClick={() => setOpenFAQ('sync')}
          />
          <HelpCard
            icon={<Shield size={20} className="text-emerald-400" />}
            iconColor="#10b981"
            title="Sicherheit"
            description="Privatsphäre-Tipps"
            onClick={() => setOpenFAQ('privacy')}
          />
          <HelpCard
            icon={<Users size={20} className="text-blue-400" />}
            iconColor="#3b82f6"
            title="Community"
            description="Richtlinien"
            onClick={() => navigate('/legal')}
          />
          <HelpCard
            icon={<Lightbulb size={20} className="text-amber-400" />}
            iconColor="#f59e0b"
            title="Features"
            description="Alle Funktionen"
            onClick={() => setOpenFAQ('xp')}
          />
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="px-5 mb-6">
        <SectionHeader title="Häufige Fragen" />
        <div className="space-y-2">
          {faqItems.map((item) => (
            <FAQItem
              key={item.id}
              question={item.question}
              answer={item.answer}
              icon={item.icon}
              isOpen={openFAQ === item.id}
              onToggle={() => toggleFAQ(item.id)}
            />
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="px-5 mb-6">
        <SectionHeader title="Kontakt" />
        <div
          className="p-5 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.02))',
            border: '1px solid rgba(168, 85, 247, 0.15)',
          }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(168, 85, 247, 0.2)' }}
            >
              <MessageCircle size={22} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Noch Fragen?</h3>
              <p className="text-xs text-white/40">Wir sind für dich da</p>
            </div>
          </div>

          <div className="space-y-2">
            <motion.a
              href="mailto:support@synclulu.app"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
            >
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-purple-400" />
                <span className="text-sm text-white">support@synclulu.app</span>
              </div>
              <ExternalLink size={14} className="text-white/30" />
            </motion.a>

            <motion.button
              onClick={() => navigate('/legal')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
            >
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-emerald-400" />
                <span className="text-sm text-white">Rechtliches & Datenschutz</span>
              </div>
              <ChevronDown size={14} className="text-white/30 -rotate-90" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* App Info Footer */}
      <div className="px-5 pb-8">
        <div className="text-center">
          <p className="text-[9px] text-white/20 uppercase tracking-widest mb-1">
            synclulu // Synchronizing Humanity
          </p>
          <p className="text-[8px] text-white/10">
            Version 1.0.0 • Made with <Heart size={8} className="inline text-purple-400" /> in Germany
          </p>
        </div>
      </div>
    </div>
  );
}
