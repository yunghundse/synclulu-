/**
 * Help.tsx
 * 💬 SOVEREIGN DISCOVERY v23.0 - Theme-Aware Help & FAQ Page
 *
 * Features:
 * - Light/Dark mode support
 * - Searchable FAQ
 * - Category filters
 * - Smooth animations
 *
 * @design Sovereign Discovery v23.0
 * @version 23.0.0
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronDown, ChevronRight, HelpCircle,
  MessageCircle, Shield, Star, Users, Mic,
  Mail, ExternalLink, Search
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // Allgemein
  {
    category: 'allgemein',
    question: 'Was ist delulu?',
    answer: 'delulu ist eine hyperlocal Community-App, die Menschen in deiner Nähe per Voice-Chat verbindet. Tauche in die "Wolke" ein und triff neue Leute spontan und unkompliziert.',
  },
  {
    category: 'allgemein',
    question: 'Wie funktioniert die Wolke?',
    answer: 'Die Wolke zeigt dir Räume mit aktiven Usern in deiner Umgebung. Tippe einfach auf die große Wolke auf der Home-Seite, und du wirst automatisch mit jemandem verbunden, der gerade online ist.',
  },
  {
    category: 'allgemein',
    question: 'Ist delulu kostenlos?',
    answer: 'Ja! Die Grundfunktionen sind komplett kostenlos. Mit Catalyst Premium bekommst du zusätzliche Features wie 1.5x XP, unbegrenzte Sterne und die Möglichkeit zu sehen, wer dein Profil besucht hat.',
  },

  // Voice Chat
  {
    category: 'voice',
    question: 'Wie starte ich einen Voice-Chat?',
    answer: 'Gehe auf die Home-Seite und tippe auf die Wolke. Du wirst gefragt, ob du anonym oder öffentlich beitreten möchtest. Danach wirst du mit einem aktiven Raum verbunden.',
  },
  {
    category: 'voice',
    question: 'Warum bin ich am Anfang stumm geschaltet?',
    answer: 'Neue Teilnehmer haben eine kurze Redepause von 4 Sekunden. Das gibt dir Zeit, erst mal zuzuhören und den Kontext des Gesprächs zu verstehen, bevor du dich einbringst.',
  },
  {
    category: 'voice',
    question: 'Kann ich aus einem Raum rausgeworfen werden?',
    answer: 'Einzelne Personen können dich nicht kicken. Bei schlechtem Verhalten können andere User jedoch eine Abstimmung starten, um dich aus dem Raum zu entfernen.',
  },

  // Sicherheit & Privatsphäre
  {
    category: 'sicherheit',
    question: 'Was ist der Anonym-Modus?',
    answer: 'Im Anonym-Modus wird dein Profilbild verschwommen angezeigt und du erscheinst unter einem zufälligen Alias wie "Wanderer_4821". Dein echter Username bleibt verborgen.',
  },
  {
    category: 'sicherheit',
    question: 'Wie blockiere ich jemanden?',
    answer: 'Gehe zu Einstellungen → Blockierte User. Dort kannst du User blockieren und auch den Grund angeben (Belästigung, Spam, etc.). Blockierte User können dich nicht mehr sehen oder kontaktieren.',
  },
  {
    category: 'sicherheit',
    question: 'Werden meine Gespräche aufgezeichnet?',
    answer: 'Nein. Voice-Chats werden nicht aufgezeichnet oder gespeichert. Alle Gespräche sind live und ephemer - sobald du den Raum verlässt, sind sie weg.',
  },

  // XP & Level
  {
    category: 'xp',
    question: 'Wie verdiene ich XP?',
    answer: 'Du verdienst XP durch: Voice-Chats (pro Minute), Sterne erhalten (15 XP pro Stern), tägliche Logins (Streak-Bonus), und regionale Events (bis zu 3x XP in bestimmten Zonen).',
  },
  {
    category: 'xp',
    question: 'Was bringt mir ein höheres Level?',
    answer: 'Mit jedem Level steigt dein Ansehen in der Community. Höhere Level bekommen spezielle Titel (z.B. "Socialite" ab Level 31), vergrößerte Trust-Badges und Zugang zu exklusiven Features.',
  },
  {
    category: 'xp',
    question: 'Was sind Sterne und wie funktionieren sie?',
    answer: 'Sterne sind virtuelle Geschenke, die du anderen Usern geben kannst. Jeder Stern ist 15 XP wert. Free User können 3 Sterne pro Tag verschenken, Premium User unbegrenzt viele.',
  },

  // Freundschaften
  {
    category: 'freunde',
    question: 'Wie füge ich Freunde hinzu?',
    answer: 'Sende eine Freundschaftsanfrage über das Profil eines Users. Freundschaft in delulu funktioniert nach dem "Handshake"-Prinzip - beide müssen bestätigen.',
  },
  {
    category: 'freunde',
    question: 'Was ist der Unterschied zwischen Folgen und Freundschaft?',
    answer: 'Folgen ist einseitig (wie auf Twitter) - du siehst Updates von jemandem. Freundschaft ist gegenseitig und schaltet zusätzliche Features wie Direktnachrichten frei.',
  },
  {
    category: 'freunde',
    question: 'Mit wem kann ich chatten?',
    answer: 'Du kannst nur mit Freunden oder Usern chatten, die du bereits in der App getroffen hast. Das schützt vor unerwünschten Nachrichten von Fremden.',
  },
];

const categories = [
  { id: 'allgemein', label: 'Allgemein', icon: HelpCircle },
  { id: 'voice', label: 'Voice Chat', icon: Mic },
  { id: 'sicherheit', label: 'Sicherheit', icon: Shield },
  { id: 'xp', label: 'XP & Level', icon: Star },
  { id: 'freunde', label: 'Freundschaften', icon: Users },
];

const Help = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFAQ = searchQuery
    ? faqData.filter(
        item =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeCategory
    ? faqData.filter(item => item.category === activeCategory)
    : faqData;

  const toggleQuestion = (question: string) => {
    setExpandedQuestion(expandedQuestion === question ? null : question);
  };

  return (
    <div className="min-h-screen bg-[var(--delulu-bg)] safe-top safe-bottom pb-24 theme-transition">
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--delulu-accent)]/5 via-transparent to-transparent" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-20 glass-nav border-b border-[var(--delulu-border)]">
        <div className="px-6 py-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-[var(--delulu-card)] flex items-center justify-center text-[var(--delulu-muted)] hover:text-[var(--delulu-text)] transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-[var(--delulu-text)]">
              Hilfe & FAQ
            </h1>
            <p className="text-xs text-[var(--delulu-muted)]">Finde Antworten auf deine Fragen</p>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--delulu-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suche in den FAQ..."
              className="w-full pl-11 pr-4 py-3 bg-[var(--delulu-card)] border border-[var(--delulu-border)] rounded-xl text-sm text-[var(--delulu-text)] placeholder-[var(--delulu-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--delulu-accent)]/30"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <AnimatePresence>
        {!searchQuery && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 py-4"
          >
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              <button
                onClick={() => setActiveCategory(null)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  !activeCategory
                    ? 'bg-[var(--delulu-accent)] text-white shadow-lg'
                    : 'bg-[var(--delulu-card)] text-[var(--delulu-muted)] hover:text-[var(--delulu-text)] border border-[var(--delulu-border)]'
                }`}
              >
                Alle
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? 'bg-[var(--delulu-accent)] text-white shadow-lg'
                      : 'bg-[var(--delulu-card)] text-[var(--delulu-muted)] hover:text-[var(--delulu-text)] border border-[var(--delulu-border)]'
                  }`}
                >
                  <cat.icon size={16} />
                  {cat.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAQ List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-6 space-y-3"
      >
        {filteredFAQ.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle size={48} className="mx-auto text-[var(--delulu-muted)] opacity-30 mb-4" />
            <p className="text-[var(--delulu-muted)]">Keine Ergebnisse gefunden</p>
          </div>
        ) : (
          filteredFAQ.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-[var(--delulu-card)] rounded-2xl shadow-sm overflow-hidden border border-[var(--delulu-border)]"
            >
              <button
                onClick={() => toggleQuestion(item.question)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="font-semibold text-[var(--delulu-text)] pr-4">
                  {item.question}
                </span>
                {expandedQuestion === item.question ? (
                  <ChevronDown size={20} className="text-[var(--delulu-accent)] flex-shrink-0" />
                ) : (
                  <ChevronRight size={20} className="text-[var(--delulu-muted)] flex-shrink-0" />
                )}
              </button>

              <AnimatePresence>
                {expandedQuestion === item.question && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0">
                      <div className="bg-[var(--delulu-bg)] rounded-xl p-4 border border-[var(--delulu-border)]">
                        <p className="text-sm text-[var(--delulu-text)] leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Contact Support */}
      <div className="px-6 py-8">
        <div className="bg-gradient-to-br from-[var(--delulu-accent)]/10 to-[var(--delulu-accent)]/5 rounded-2xl p-6 text-center border border-[var(--delulu-accent)]/20">
          <MessageCircle size={32} className="mx-auto text-[var(--delulu-accent)] mb-3" />
          <h3 className="font-display font-bold text-[var(--delulu-text)] mb-2">
            Noch Fragen?
          </h3>
          <p className="text-sm text-[var(--delulu-muted)] mb-4">
            Unser Support-Team hilft dir gerne weiter
          </p>

          <div className="flex flex-col gap-3">
            <a
              href="mailto:support@delulu.app"
              className="flex items-center justify-center gap-2 py-3 px-4 bg-[var(--delulu-accent)] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              <Mail size={18} />
              E-Mail schreiben
            </a>
            <a
              href="https://delulu.app/help"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 px-4 bg-[var(--delulu-card)] text-[var(--delulu-text)] rounded-xl font-semibold hover:opacity-90 transition-opacity border border-[var(--delulu-border)]"
            >
              <ExternalLink size={18} />
              Hilfe-Center besuchen
            </a>
          </div>
        </div>
      </div>

      {/* Legal Links */}
      <div className="px-6 pb-8">
        <div className="flex justify-center gap-6 text-xs text-[var(--delulu-muted)]">
          <button onClick={() => navigate('/privacy')} className="hover:text-[var(--delulu-accent)] transition-colors">
            Datenschutz
          </button>
          <button onClick={() => navigate('/terms')} className="hover:text-[var(--delulu-accent)] transition-colors">
            AGB
          </button>
          <button onClick={() => navigate('/imprint')} className="hover:text-[var(--delulu-accent)] transition-colors">
            Impressum
          </button>
        </div>
      </div>
    </div>
  );
};

export default Help;
