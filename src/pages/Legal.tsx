/**
 * Legal.tsx
 * ⚖️ SOVEREIGN LEGAL CENTER v30.0
 *
 * SEKTIONEN:
 * - AGB: Verhaltensregeln & Nutzungsbedingungen
 * - Nutzerbestimmungen: Haftungsausschluss für User-Content
 * - Datenschutz: Transparenz über GPS- und Audiodaten
 * - Impressum: Anbieterkennzeichnung
 *
 * DESIGN: Minimalistisch, seriös, OLED-Black
 *
 * @version 30.0.0 - Legal Sovereign Edition
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  FileText,
  Shield,
  Building,
  Scale,
  Mail,
  Phone,
  MapPin,
  Mic,
  Users,
  AlertCircle,
  CheckCircle,
  Lock,
} from 'lucide-react';

type LegalSection = 'agb' | 'nutzung' | 'datenschutz' | 'impressum';

const SECTIONS = [
  { id: 'agb' as const, title: 'AGB', subtitle: 'Allgemeine Geschäftsbedingungen', icon: FileText, color: '#60a5fa' },
  { id: 'nutzung' as const, title: 'Nutzerbestimmungen', subtitle: 'Haftung & User-Content', icon: Users, color: '#a855f7' },
  { id: 'datenschutz' as const, title: 'Datenschutz', subtitle: 'GPS, Audio & Privatsphäre', icon: Shield, color: '#22d3ee' },
  { id: 'impressum' as const, title: 'Impressum', subtitle: 'Anbieterkennzeichnung', icon: Building, color: '#f97316' },
];

function triggerHaptic(type: 'light' | 'medium' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(type === 'light' ? 10 : 25);
  }
}

// ═══════════════════════════════════════════════════════════════
// AGB CONTENT
// ═══════════════════════════════════════════════════════════════

const AGBContent = () => (
  <div className="space-y-6 text-sm text-white/70 leading-relaxed">
    <section>
      <h3 className="text-white font-semibold mb-2">§ 1 Geltungsbereich</h3>
      <p>
        Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der synclulu-Plattform
        (nachfolgend "App" oder "Dienst"). Mit der Registrierung und Nutzung der App
        akzeptieren Sie diese AGB in vollem Umfang.
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">§ 2 Verhaltensregeln</h3>
      <p className="mb-2">Bei der Nutzung von synclulu verpflichten Sie sich:</p>
      <ul className="list-disc list-inside space-y-1 text-white/60 pl-2">
        <li>Respektvoll mit anderen Nutzern umzugehen</li>
        <li>Keine beleidigenden, diskriminierenden oder bedrohenden Inhalte zu verbreiten</li>
        <li>Keine illegalen Aktivitäten zu fördern</li>
        <li>Die Privatsphäre anderer zu respektieren</li>
        <li>Keine Spam-Nachrichten zu versenden</li>
        <li>Keine falschen Identitäten zu verwenden</li>
      </ul>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">§ 3 Altersfreigabe</h3>
      <p>
        Die Nutzung von synclulu ist erst ab 18 Jahren gestattet. Mit der Registrierung
        bestätigen Sie, dass Sie mindestens 18 Jahre alt sind.
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">§ 4 Kontoführung</h3>
      <p>
        Jeder Nutzer darf nur ein Konto führen. Das Teilen von Zugangsdaten ist untersagt.
        Sie sind für alle Aktivitäten unter Ihrem Konto verantwortlich.
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">§ 5 Sperrung & Kündigung</h3>
      <p>
        Wir behalten uns das Recht vor, Konten bei Verstößen vorübergehend oder dauerhaft
        zu sperren. Sie können Ihr Konto jederzeit in den Einstellungen löschen.
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">§ 6 Schlussbestimmungen</h3>
      <p>
        Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist, soweit
        gesetzlich zulässig, der Sitz des Betreibers.
      </p>
    </section>

    <p className="text-white/40 text-xs mt-8">Stand: Februar 2026</p>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// NUTZERBESTIMMUNGEN CONTENT
// ═══════════════════════════════════════════════════════════════

const NutzungContent = () => (
  <div className="space-y-6 text-sm text-white/70 leading-relaxed">
    <section>
      <h3 className="text-white font-semibold mb-2">1. User-Generated Content</h3>
      <p>
        synclulu ermöglicht das Erstellen und Teilen von Inhalten durch Nutzer:
        Profilinformationen, Chat-Nachrichten, Sprachbeiträge und Medien.
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">2. Haftungsausschluss</h3>
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-3">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-200/80 text-xs">
            synclulu ist nicht verantwortlich für Inhalte, die von Nutzern erstellt werden.
            Jeder Nutzer trägt die alleinige Verantwortung für seine Beiträge.
          </p>
        </div>
      </div>
      <p>
        Wir überprüfen nicht aktiv alle nutzergenerierten Inhalte und können keine Garantie
        für deren Richtigkeit oder Rechtmäßigkeit übernehmen.
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">3. XP & Level-System</h3>
      <p>
        XP werden für positive Interaktionen vergeben. Manipulation führt zur Kontosperre.
        XP und Level haben keinen monetären Wert und sind nicht übertragbar.
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">4. Wölkchen (Räume)</h3>
      <p>
        Ersteller eines Wölkchens sind für die Moderation verantwortlich. Wir können
        Wölkchen bei Regelverstößen schließen.
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">5. Konsequenzen bei Verstößen</h3>
      <ul className="list-disc list-inside space-y-1 text-white/60 pl-2">
        <li>Verwarnung</li>
        <li>Temporäre Sperre (1-30 Tage)</li>
        <li>Permanente Kontosperrung</li>
        <li>Anzeige bei Behörden bei Straftaten</li>
      </ul>
    </section>

    <p className="text-white/40 text-xs mt-8">Stand: Februar 2026</p>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// DATENSCHUTZ CONTENT
// ═══════════════════════════════════════════════════════════════

const DatenschutzContent = () => (
  <div className="space-y-6 text-sm text-white/70 leading-relaxed">
    <section>
      <h3 className="text-white font-semibold mb-2">1. Verantwortlicher</h3>
      <p>
        Verantwortlich für die Datenverarbeitung:<br />
        <span className="text-white/80">synclulu • Jan Hundse</span><br />
        Kontakt: datenschutz@synclulu.app
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-3">2. Erhobene Daten</h3>
      <div className="space-y-3">
        {/* GPS Data */}
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-3 mb-2">
            <MapPin size={18} className="text-blue-400" />
            <span className="font-semibold text-white">Standortdaten (GPS)</span>
          </div>
          <p className="text-white/60 text-xs">
            Wir erheben Ihren Standort, um nahegelegene Räume und Nutzer anzuzeigen.
            Die Standortfreigabe ist optional. Sie können die Genauigkeit anpassen oder
            den Zugriff komplett deaktivieren. Ihr genauer Standort wird nie anderen
            Nutzern angezeigt – nur eine ungefähre Entfernung.
          </p>
        </div>

        {/* Audio Data */}
        <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Mic size={18} className="text-violet-400" />
            <span className="font-semibold text-white">Audiodaten</span>
          </div>
          <p className="text-white/60 text-xs">
            In Sprachräumen wird Ihr Mikrofon aktiviert, wenn Sie sprechen. Audiodaten
            werden in Echtzeit übertragen, aber <span className="text-white/80">nicht dauerhaft gespeichert</span>.
            Wir zeichnen keine Gespräche auf. Die Übertragung ist Ende-zu-Ende verschlüsselt.
          </p>
        </div>

        {/* Profile Data */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Users size={18} className="text-emerald-400" />
            <span className="font-semibold text-white">Profildaten</span>
          </div>
          <p className="text-white/60 text-xs">
            Name, Nutzername, Profilbild und Bio werden gespeichert und sind für andere
            sichtbar. Sie können Ihre Sichtbarkeit in den Privatsphäre-Einstellungen anpassen.
          </p>
        </div>
      </div>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">3. Verwendungszwecke</h3>
      <ul className="space-y-2">
        <li className="flex items-start gap-2">
          <CheckCircle size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>Bereitstellung und Verbesserung der App</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>Personalisierung Ihrer Erfahrung</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>Sicherheit und Betrugsprävention</span>
        </li>
      </ul>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">4. Ihre Rechte (DSGVO)</h3>
      <ul className="list-disc list-inside space-y-1 text-white/60 pl-2">
        <li>Auskunft über Ihre gespeicherten Daten</li>
        <li>Berichtigung unrichtiger Daten</li>
        <li>Löschung ("Recht auf Vergessenwerden")</li>
        <li>Einschränkung der Verarbeitung</li>
        <li>Datenübertragbarkeit</li>
        <li>Widerspruch gegen die Verarbeitung</li>
      </ul>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">5. Datensicherheit</h3>
      <p>
        Wir verwenden SSL-Verschlüsselung, sichere Serverinfrastruktur und regelmäßige
        Sicherheitsaudits zum Schutz Ihrer Daten.
      </p>
    </section>

    <p className="text-white/40 text-xs mt-8">Stand: Februar 2026</p>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// IMPRESSUM CONTENT
// ═══════════════════════════════════════════════════════════════

const ImpressumContent = () => (
  <div className="space-y-6 text-sm text-white/70 leading-relaxed">
    <section>
      <h3 className="text-white font-semibold mb-3">Angaben gemäß § 5 TMG</h3>
      <div className="p-4 rounded-xl space-y-3 bg-orange-500/5 border border-orange-500/10">
        <div className="flex items-start gap-3">
          <Building size={18} className="text-orange-400 mt-0.5" />
          <div>
            <p className="text-white font-medium">synclulu</p>
            <p>Jan Hundse (Einzelunternehmer)</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin size={18} className="text-orange-400 mt-0.5" />
          <div>
            <p>Musterstraße 123</p>
            <p>12345 Musterstadt, Deutschland</p>
          </div>
        </div>
      </div>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-3">Kontakt</h3>
      <div className="p-4 rounded-xl space-y-3 bg-orange-500/5 border border-orange-500/10">
        <div className="flex items-center gap-3">
          <Mail size={18} className="text-orange-400" />
          <a href="mailto:contact@synclulu.app" className="text-orange-400 hover:underline">
            contact@synclulu.app
          </a>
        </div>
      </div>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">Verantwortlich für den Inhalt</h3>
      <p>
        Jan Hundse<br />
        Musterstraße 123<br />
        12345 Musterstadt
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">EU-Streitschlichtung</h3>
      <p>
        Online-Streitbeilegung:{' '}
        <a
          href="https://ec.europa.eu/consumers/odr/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-400 hover:underline"
        >
          ec.europa.eu/consumers/odr
        </a>
      </p>
    </section>

    <p className="text-white/40 text-xs mt-8">Stand: Februar 2026</p>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function Legal() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<LegalSection | null>('agb');

  const toggleSection = (section: LegalSection) => {
    triggerHaptic('light');
    setActiveSection(activeSection === section ? null : section);
  };

  const renderContent = (section: LegalSection) => {
    switch (section) {
      case 'agb': return <AGBContent />;
      case 'nutzung': return <NutzungContent />;
      case 'datenschutz': return <DatenschutzContent />;
      case 'impressum': return <ImpressumContent />;
    }
  };

  return (
    <div className="min-h-screen pb-32" style={{ background: '#050505' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(5, 5, 5, 0.92)',
          backdropFilter: 'blur(40px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="px-5 py-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <ArrowLeft size={20} className="text-white/60" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Scale size={20} className="text-cyan-400" />
              Rechtliches
            </h1>
            <p className="text-xs text-white/40">AGB, Datenschutz & Impressum</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-3">
        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.08), rgba(34, 211, 238, 0.02))',
            border: '1px solid rgba(34, 211, 238, 0.15)',
          }}
        >
          <div className="flex items-start gap-3">
            <Lock size={18} className="text-cyan-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-white/70">
                Ihre Sicherheit und Privatsphäre sind uns wichtig.
              </p>
              <p className="text-xs text-white/40 mt-1">
                Bei Fragen: legal@synclulu.app
              </p>
            </div>
          </div>
        </motion.div>

        {/* Sections */}
        {SECTIONS.map((section, index) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              layout
              className="rounded-2xl overflow-hidden"
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${section.color}10, ${section.color}03)`
                  : 'rgba(255, 255, 255, 0.02)',
                border: isActive
                  ? `1px solid ${section.color}30`
                  : '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <motion.button
                onClick={() => toggleSection(section.id)}
                className="w-full p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: isActive ? `${section.color}20` : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${isActive ? `${section.color}40` : 'rgba(255, 255, 255, 0.06)'}`,
                    }}
                  >
                    <Icon size={18} style={{ color: isActive ? section.color : 'rgba(255, 255, 255, 0.4)' }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">{section.title}</p>
                    <p className="text-xs text-white/40">{section.subtitle}</p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isActive ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={20} className="text-white/40" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-2 border-t border-white/5">
                      {renderContent(section.id)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Footer */}
        <div className="pt-6 text-center">
          <p className="text-xs text-white/30">
            © 2026 synclulu • Alle Rechte vorbehalten
          </p>
        </div>
      </div>
    </div>
  );
}
