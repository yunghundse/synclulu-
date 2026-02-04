/**
 * Legal.tsx
 * ⚖️ LEGAL-CORE - AGB, Nutzungsbedingungen & Impressum
 *
 * Professionelles Legal-Design mit OLED-Black Ästhetik
 * Deutsche Rechtsnormen-konforme Platzhaltertexte
 *
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Shield,
  Building,
  Scale,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

type LegalSection = 'agb' | 'nutzung' | 'impressum';

const SECTIONS = [
  { id: 'agb' as const, title: 'AGB', subtitle: 'Allgemeine Geschäftsbedingungen', icon: FileText },
  { id: 'nutzung' as const, title: 'Nutzungsbedingungen', subtitle: 'Regeln für die Nutzung', icon: Shield },
  { id: 'impressum' as const, title: 'Impressum', subtitle: 'Anbieterkennzeichnung', icon: Building },
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
      <h3 className="text-white font-semibold mb-2">§ 2 Vertragsgegenstand</h3>
      <p>
        synclulu bietet eine Plattform für soziale Interaktionen in Echtzeit. Nutzer können
        virtuelle "Wölkchen" (Räume) erstellen, betreten und mit anderen Nutzern kommunizieren.
        Der Dienst umfasst sowohl kostenlose als auch kostenpflichtige Funktionen.
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">§ 3 Registrierung und Nutzerkonto</h3>
      <p>
        3.1 Für die Nutzung der App ist eine Registrierung erforderlich. Sie müssen mindestens
        16 Jahre alt sein.<br /><br />
        3.2 Sie sind verpflichtet, wahrheitsgemäße Angaben zu machen und Ihre Zugangsdaten
        geheim zu halten.<br /><br />
        3.3 Die Übertragung des Nutzerkontos an Dritte ist nicht gestattet.
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">§ 4 Leistungen</h3>
      <p>
        4.1 synclulu stellt die technische Infrastruktur für Echtzeit-Kommunikation bereit.<br /><br />
        4.2 Wir behalten uns das Recht vor, Funktionen zu ändern, zu erweitern oder einzustellen.<br /><br />
        4.3 Es besteht kein Anspruch auf ständige Verfügbarkeit des Dienstes.
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">§ 5 Kündigung</h3>
      <p>
        5.1 Sie können Ihr Konto jederzeit in den Einstellungen löschen.<br /><br />
        5.2 Bei Verstößen gegen diese AGB können wir Ihr Konto sperren oder löschen.<br /><br />
        5.3 Bei Kündigung werden Ihre Daten gemäß unserer Datenschutzrichtlinie behandelt.
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">§ 6 Haftung</h3>
      <p>
        6.1 Wir haften nur für Schäden, die auf vorsätzlichem oder grob fahrlässigem
        Verhalten beruhen.<br /><br />
        6.2 Für Inhalte der Nutzer übernehmen wir keine Haftung.<br /><br />
        6.3 Die Haftung für leichte Fahrlässigkeit ist ausgeschlossen.
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">§ 7 Schlussbestimmungen</h3>
      <p>
        7.1 Es gilt das Recht der Bundesrepublik Deutschland.<br /><br />
        7.2 Gerichtsstand ist, soweit gesetzlich zulässig, der Sitz des Betreibers.<br /><br />
        7.3 Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der
        übrigen Bestimmungen unberührt.
      </p>
    </section>

    <p className="text-white/40 text-xs mt-8">Stand: Februar 2025</p>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// NUTZUNGSBEDINGUNGEN CONTENT
// ═══════════════════════════════════════════════════════════════

const NutzungContent = () => (
  <div className="space-y-6 text-sm text-white/70 leading-relaxed">
    <section>
      <h3 className="text-white font-semibold mb-2">1. Verhaltensregeln</h3>
      <p>
        Bei der Nutzung von synclulu verpflichten Sie sich zu respektvollem Umgang mit
        anderen Nutzern. Folgendes ist untersagt:
      </p>
      <ul className="list-disc list-inside mt-2 space-y-1 text-white/60">
        <li>Beleidigung, Diskriminierung oder Mobbing</li>
        <li>Verbreitung von Hassrede oder Gewaltaufrufen</li>
        <li>Sexuelle Belästigung oder unangemessene Inhalte</li>
        <li>Spam, Werbung oder betrügerische Aktivitäten</li>
        <li>Impersonation anderer Personen</li>
      </ul>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">2. Inhalte</h3>
      <p>
        2.1 Sie sind für alle von Ihnen erstellten Inhalte verantwortlich.<br /><br />
        2.2 Inhalte, die gegen geltendes Recht verstoßen, sind verboten.<br /><br />
        2.3 Wir behalten uns das Recht vor, Inhalte ohne Vorankündigung zu entfernen.
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">3. Privatsphäre & Sicherheit</h3>
      <p>
        3.1 Teilen Sie keine persönlichen Daten anderer ohne deren Zustimmung.<br /><br />
        3.2 Verwenden Sie die Standortfunktion verantwortungsvoll.<br /><br />
        3.3 Melden Sie verdächtige Aktivitäten über die Meldefunktion.
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">4. XP & Levelsystem</h3>
      <p>
        4.1 XP (Erfahrungspunkte) werden für positive Interaktionen vergeben.<br /><br />
        4.2 Manipulation des XP-Systems führt zur Kontosperre.<br /><br />
        4.3 XP und Level haben keinen monetären Wert und sind nicht übertragbar.
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">5. Wölkchen (Räume)</h3>
      <p>
        5.1 Ersteller eines Wölkchens sind für die Moderation verantwortlich.<br /><br />
        5.2 Öffentliche Wölkchen müssen die Gemeinschaftsrichtlinien einhalten.<br /><br />
        5.3 Wir können Wölkchen bei Regelverstößen schließen.
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">6. Konsequenzen bei Verstößen</h3>
      <p>
        Bei Verstößen gegen diese Nutzungsbedingungen können folgende Maßnahmen ergriffen werden:
      </p>
      <ul className="list-disc list-inside mt-2 space-y-1 text-white/60">
        <li>Verwarnung</li>
        <li>Temporäre Sperre (1-30 Tage)</li>
        <li>Permanente Kontosperrung</li>
        <li>Anzeige bei den zuständigen Behörden</li>
      </ul>
    </section>

    <p className="text-white/40 text-xs mt-8">Stand: Februar 2025</p>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// IMPRESSUM CONTENT
// ═══════════════════════════════════════════════════════════════

const ImpressumContent = () => (
  <div className="space-y-6 text-sm text-white/70 leading-relaxed">
    <section>
      <h3 className="text-white font-semibold mb-3">Angaben gemäß § 5 TMG</h3>
      <div
        className="p-4 rounded-xl space-y-3"
        style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.1)' }}
      >
        <div className="flex items-start gap-3">
          <Building size={18} className="text-violet-400 mt-0.5" />
          <div>
            <p className="text-white font-medium">synclulu</p>
            <p>Jan Hundse (Einzelunternehmer)</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin size={18} className="text-violet-400 mt-0.5" />
          <div>
            <p>Musterstraße 123</p>
            <p>12345 Musterstadt</p>
            <p>Deutschland</p>
          </div>
        </div>
      </div>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-3">Kontakt</h3>
      <div
        className="p-4 rounded-xl space-y-3"
        style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.1)' }}
      >
        <div className="flex items-center gap-3">
          <Mail size={18} className="text-violet-400" />
          <a href="mailto:contact@synclulu.com" className="text-violet-400 hover:underline">
            contact@synclulu.com
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Phone size={18} className="text-violet-400" />
          <span>+49 (0) 123 456789</span>
        </div>
      </div>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">Umsatzsteuer-ID</h3>
      <p>
        Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
        DE XXX XXX XXX (in Beantragung)
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h3>
      <p>
        Jan Hundse<br />
        Musterstraße 123<br />
        12345 Musterstadt
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">EU-Streitschlichtung</h3>
      <p>
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
        <a
          href="https://ec.europa.eu/consumers/odr/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-400 hover:underline ml-1"
        >
          https://ec.europa.eu/consumers/odr/
        </a>
      </p>
      <p className="mt-2">
        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">Haftung für Inhalte</h3>
      <p>
        Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten
        nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
        Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
        Informationen zu überwachen.
      </p>
    </section>

    <section>
      <h3 className="text-white font-semibold mb-2">Haftung für Links</h3>
      <p>
        Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
        Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
      </p>
    </section>

    <p className="text-white/40 text-xs mt-8">Stand: Februar 2025</p>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function Legal() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<LegalSection | null>(null);

  const toggleSection = (section: LegalSection) => {
    triggerHaptic('light');
    setActiveSection(activeSection === section ? null : section);
  };

  const renderContent = (section: LegalSection) => {
    switch (section) {
      case 'agb':
        return <AGBContent />;
      case 'nutzung':
        return <NutzungContent />;
      case 'impressum':
        return <ImpressumContent />;
    }
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: '#050505' }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic('light');
              navigate(-1);
            }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <ChevronLeft size={20} className="text-white/60" />
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-white">Rechtliches</h1>
            <p className="text-xs text-white/40">AGB, Nutzung & Impressum</p>
          </div>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <motion.div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(168, 85, 247, 0.05))',
              border: '1px solid rgba(168, 85, 247, 0.2)',
            }}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            <Scale size={36} className="text-violet-400" />
          </motion.div>
        </div>
      </div>

      {/* Sections */}
      <div className="px-5 space-y-3">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <motion.div
              key={section.id}
              layout
              className="rounded-2xl overflow-hidden"
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.03))'
                  : 'rgba(255, 255, 255, 0.02)',
                border: isActive
                  ? '1px solid rgba(168, 85, 247, 0.2)'
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
                      background: isActive ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <Icon size={18} className={isActive ? 'text-violet-400' : 'text-white/40'} />
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
      </div>

      {/* Footer */}
      <div className="px-5 mt-8 text-center">
        <p className="text-xs text-white/30">
          Bei Fragen kontaktieren Sie uns unter{' '}
          <a href="mailto:legal@synclulu.com" className="text-violet-400 hover:underline">
            legal@synclulu.com
          </a>
        </p>
      </div>
    </div>
  );
}
