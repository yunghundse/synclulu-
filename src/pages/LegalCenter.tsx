/**
 * LegalCenter.tsx
 * ⚖️ LEGAL CENTER - Professionelles Sovereign-Panel Design
 *
 * App Store Compliance:
 * - Impressum (§5 TMG)
 * - Nutzungsbedingungen (AGB)
 * - Datenschutzerklärung (DSGVO)
 * - Community-Richtlinien
 *
 * Features:
 * - Sovereign-Panel Design
 * - Akkordeon-Style Sections
 * - Direkte Mail-Links
 * - App Store Ready
 *
 * @version 2.0.0 - Sovereign Edition
 */

import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronDown,
  Shield,
  FileText,
  Building,
  Lock,
  Mail,
  Users,
  Scale,
  Eye,
  Server,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Heart,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// LEGAL SECTION COMPONENT (Sovereign Panel Style)
// ═══════════════════════════════════════════════════════════════════════════

interface LegalSectionProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
}

const LegalSection = memo(function LegalSection({
  title,
  icon,
  iconColor,
  children,
  isOpen,
  onToggle,
  badge,
}: LegalSectionProps) {
  return (
    <motion.div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
      whileHover={{ borderColor: 'rgba(168, 85, 247, 0.15)' }}
    >
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: `${iconColor}15` }}
          >
            {icon}
          </div>
          <div className="text-left">
            <span className="text-sm font-bold text-white block">{title}</span>
            {badge && (
              <span className="text-[10px] text-white/30">{badge}</span>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
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
              className="px-5 pb-5"
              style={{ borderTop: '1px solid rgba(255, 255, 255, 0.03)' }}
            >
              <div className="pt-4 text-sm text-white/50 leading-relaxed">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// SUBSECTION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface SubsectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Subsection = memo(function Subsection({
  title,
  icon,
  children,
}: SubsectionProps) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-purple-400">{icon}</span>}
        <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">
          {title}
        </h4>
      </div>
      <div className="text-white/50 text-sm leading-relaxed">{children}</div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// BULLET LIST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 mt-2">
    {items.map((item, index) => (
      <li key={index} className="flex items-start gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════════════════════

const SectionDivider = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 my-6 px-1">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
      {title}
    </span>
    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/10 to-transparent" />
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function LegalCenter() {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = useCallback((section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  }, []);

  const currentDate = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

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
            Rechtliches
          </h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Hero */}
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
              boxShadow: '0 0 40px rgba(168, 85, 247, 0.15)',
            }}
          >
            <Scale size={36} className="text-purple-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Rechtliche Informationen</h2>
          <p className="text-sm text-white/40">
            Transparenz & Datenschutz sind uns wichtig
          </p>
        </motion.div>
      </div>

      {/* Legal Sections */}
      <div className="px-5 space-y-3">
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* IMPRESSUM */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <LegalSection
          title="Impressum"
          icon={<Building size={20} className="text-blue-400" />}
          iconColor="#3b82f6"
          isOpen={openSection === 'impressum'}
          onToggle={() => toggleSection('impressum')}
          badge="Angaben gem. § 5 TMG"
        >
          <Subsection title="Anbieter">
            <p className="font-medium text-white/70">synclulu</p>
            <p className="text-white/40">(Projekt in Gründung)</p>
          </Subsection>

          <Subsection title="Vertreten durch">
            <p>[Dein vollständiger Name]</p>
            <p>[Deine Straße & Hausnummer]</p>
            <p>[PLZ & Stadt]</p>
            <p>Deutschland</p>
          </Subsection>

          <Subsection title="Kontakt" icon={<Mail size={14} />}>
            <p>
              E-Mail:{' '}
              <a href="mailto:legal@synclulu.app" className="text-purple-400 hover:underline">
                legal@synclulu.app
              </a>
            </p>
          </Subsection>

          <Subsection title="Verantwortlich für den Inhalt (§ 55 Abs. 2 RStV)">
            <p>[Dein vollständiger Name]</p>
            <p>[Deine vollständige Adresse]</p>
          </Subsection>

          <div
            className="mt-4 p-3 rounded-xl"
            style={{ background: 'rgba(255, 255, 255, 0.03)' }}
          >
            <p className="text-[11px] text-white/30">
              <strong>EU-Streitschlichtung:</strong> Die Europäische Kommission stellt eine
              Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline"
              >
                ec.europa.eu/consumers/odr
              </a>
            </p>
          </div>
        </LegalSection>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* NUTZUNGSBEDINGUNGEN */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <LegalSection
          title="Nutzungsbedingungen"
          icon={<FileText size={20} className="text-purple-400" />}
          iconColor="#a855f7"
          isOpen={openSection === 'terms'}
          onToggle={() => toggleSection('terms')}
          badge="AGB"
        >
          <Subsection title="§1 Geltungsbereich">
            <p>
              Diese Nutzungsbedingungen gelten für die Nutzung der synclulu-App und aller
              damit verbundenen Dienste. Mit der Registrierung akzeptierst du diese
              Bedingungen vollständig.
            </p>
          </Subsection>

          <Subsection title="§2 Nutzungsvoraussetzungen" icon={<Users size={14} />}>
            <BulletList
              items={[
                'Mindestalter: 16 Jahre',
                'Maximal ein Account pro Person',
                'Wahrheitsgemäße Angaben bei der Registrierung',
                'Geheimhaltung der Zugangsdaten',
              ]}
            />
          </Subsection>

          <Subsection title="§3 Verhaltensregeln" icon={<AlertTriangle size={14} />}>
            <p className="mb-2">Bei der Nutzung von synclulu ist untersagt:</p>
            <BulletList
              items={[
                'Hassrede, Diskriminierung oder Beleidigungen',
                'Belästigung oder Stalking anderer Nutzer',
                'Teilen von illegalen, anstößigen oder unangemessenen Inhalten',
                'Spam, kommerzielle Werbung oder Phishing',
                'Manipulation oder technischer Missbrauch des Systems',
                'Weitergabe von Inhalten aus privaten Räumen ohne Zustimmung',
              ]}
            />
          </Subsection>

          <Subsection title="§4 KI-Moderation" icon={<Shield size={14} />}>
            <p>
              synclulu verwendet KI-gestützte Moderation zur Erkennung von Verstößen.
              Maßnahmen bei Verstößen:
            </p>
            <BulletList
              items={[
                'Erste Verwarnung mit Hinweis',
                'Temporäre Sperre (24h bis 30 Tage)',
                'Permanenter Ausschluss bei schweren/wiederholten Verstößen',
              ]}
            />
          </Subsection>

          <Subsection title="§5 Account & Löschung" icon={<Trash2 size={14} />}>
            <p>
              Du kannst deinen Account jederzeit in den Einstellungen löschen.
              Bei Löschung werden alle deine Daten innerhalb von 30 Tagen vollständig
              entfernt. Wir behalten uns vor, Accounts bei schweren Verstößen ohne
              Vorwarnung zu sperren.
            </p>
          </Subsection>

          <Subsection title="§6 Haftung">
            <p>
              synclulu haftet nicht für Inhalte, die von Nutzern erstellt werden.
              Die Nutzung erfolgt auf eigene Verantwortung. Wir übernehmen keine
              Gewähr für die ständige Verfügbarkeit des Dienstes.
            </p>
          </Subsection>
        </LegalSection>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* DATENSCHUTZ */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <LegalSection
          title="Datenschutzerklärung"
          icon={<Lock size={20} className="text-emerald-400" />}
          iconColor="#10b981"
          isOpen={openSection === 'privacy'}
          onToggle={() => toggleSection('privacy')}
          badge="DSGVO-konform"
        >
          <Subsection title="1. Verantwortlicher">
            <p>
              Verantwortlich für die Datenverarbeitung im Sinne der DSGVO ist
              [Dein Name], erreichbar unter{' '}
              <a href="mailto:privacy@synclulu.app" className="text-purple-400">
                privacy@synclulu.app
              </a>
            </p>
          </Subsection>

          <Subsection title="2. Erhobene Daten" icon={<Server size={14} />}>
            <p>Wir erheben und verarbeiten:</p>
            <BulletList
              items={[
                'Profildaten: Name, Avatar, Interessen (freiwillig)',
                'Standortdaten: Nur während aktiver Nutzung, nie dauerhaft gespeichert',
                'Nutzungsdaten: Aktivität, Interaktionen, XP-Stand',
                'Gerätedaten: Anonymisierte technische Informationen',
              ]}
            />
          </Subsection>

          <Subsection title="3. Standortdaten" icon={<Eye size={14} />}>
            <div
              className="p-3 rounded-xl mb-2"
              style={{ background: 'rgba(16, 185, 129, 0.1)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="text-emerald-400 font-bold text-xs">Wichtig</span>
              </div>
              <p className="text-emerald-400/70 text-xs">
                Dein genauer Standort wird niemals mit anderen geteilt oder dauerhaft
                gespeichert. Wir verwenden Geohash-Anonymisierung.
              </p>
            </div>
            <p>
              Standortdaten werden nur während der aktiven Nutzung verarbeitet und
              sofort nach Beendigung der Session verworfen.
            </p>
          </Subsection>

          <Subsection title="4. Voice-Daten">
            <div
              className="p-3 rounded-xl mb-2"
              style={{ background: 'rgba(16, 185, 129, 0.1)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="text-emerald-400 font-bold text-xs">Keine Aufnahmen</span>
              </div>
              <p className="text-emerald-400/70 text-xs">
                Audio aus Voice-Rooms wird in Echtzeit übertragen und NICHT
                aufgezeichnet oder gespeichert.
              </p>
            </div>
            <p>
              Wir verwenden Ende-zu-Ende verschlüsselte Signalisierung (WebRTC).
              Gesprächsinhalte sind für uns nicht zugänglich.
            </p>
          </Subsection>

          <Subsection title="5. Speicherung & Sicherheit">
            <p>
              Deine Daten werden auf Servern in der EU (Firebase/Google Cloud)
              gespeichert und nach den Standards der DSGVO verarbeitet. Alle
              Übertragungen sind TLS-verschlüsselt.
            </p>
          </Subsection>

          <Subsection title="6. Deine Rechte">
            <p>Nach DSGVO hast du das Recht auf:</p>
            <BulletList
              items={[
                'Auskunft über deine gespeicherten Daten (Art. 15)',
                'Berichtigung unrichtiger Daten (Art. 16)',
                'Löschung deiner Daten (Art. 17)',
                'Einschränkung der Verarbeitung (Art. 18)',
                'Datenübertragbarkeit (Art. 20)',
                'Widerspruch gegen die Verarbeitung (Art. 21)',
              ]}
            />
          </Subsection>

          <Subsection title="7. Kontakt" icon={<Mail size={14} />}>
            <p>
              Bei Fragen zum Datenschutz wende dich an:{' '}
              <a href="mailto:privacy@synclulu.app" className="text-purple-400 font-medium">
                privacy@synclulu.app
              </a>
            </p>
          </Subsection>
        </LegalSection>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* COMMUNITY GUIDELINES */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <LegalSection
          title="Community-Richtlinien"
          icon={<Shield size={20} className="text-amber-400" />}
          iconColor="#f59e0b"
          isOpen={openSection === 'guidelines'}
          onToggle={() => toggleSection('guidelines')}
          badge="Für ein sicheres Miteinander"
        >
          <Subsection title="Unser Ziel">
            <p>
              synclulu soll ein sicherer Raum für echte menschliche Verbindungen sein.
              Wir setzen auf Respekt, Offenheit und gegenseitige Wertschätzung.
            </p>
          </Subsection>

          <Subsection title="Was wir erwarten" icon={<CheckCircle size={14} />}>
            <BulletList
              items={[
                'Behandle andere so, wie du behandelt werden möchtest',
                'Respektiere die Privatsphäre und Grenzen anderer',
                'Verlasse Räume, wenn du dich unwohl fühlst',
                'Melde problematisches Verhalten - anonym',
                'Keine Weitergabe persönlicher Daten Dritter',
              ]}
            />
          </Subsection>

          <Subsection title="Nulltoleranz" icon={<AlertTriangle size={14} />}>
            <div
              className="p-3 rounded-xl"
              style={{ background: 'rgba(239, 68, 68, 0.1)' }}
            >
              <p className="text-red-400/80 text-xs">
                Bei Hassrede, Belästigung, Doxxing oder illegalem Verhalten greifen
                unsere KI-Moderation und das Team sofort ein. Accounts werden ohne
                Vorwarnung gesperrt.
              </p>
            </div>
          </Subsection>
        </LegalSection>

        <SectionDivider title="Kontakt" />

        {/* Contact Card */}
        <motion.div
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
              <Mail size={22} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Rechtliche Anfragen</h3>
              <p className="text-xs text-white/40">Wir antworten innerhalb von 48h</p>
            </div>
          </div>

          <div className="space-y-2">
            <motion.a
              href="mailto:legal@synclulu.app"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-sm"
              style={{
                background: 'rgba(168, 85, 247, 0.2)',
                color: '#a855f7',
              }}
            >
              <Mail size={16} />
              legal@synclulu.app
            </motion.a>

            <motion.a
              href="mailto:privacy@synclulu.app"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 p-3 rounded-xl font-medium text-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              <Lock size={16} />
              privacy@synclulu.app
            </motion.a>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="px-5 pt-8 pb-8">
        <div className="text-center">
          <p className="text-[9px] text-white/20 uppercase tracking-widest mb-1">
            synclulu // Synchronizing Humanity
          </p>
          <p className="text-[8px] text-white/10">
            Stand: {currentDate} • Made with <Heart size={8} className="inline text-purple-400" /> in Germany
          </p>
        </div>
      </div>
    </div>
  );
}
