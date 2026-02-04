/**
 * LegalCenter.tsx
 * ⚖️ LEGAL CENTER - AGB, Datenschutz, Impressum
 *
 * App Store Compliance:
 * - Nutzungsbedingungen
 * - Datenschutzerklärung
 * - Impressum
 * - Akkordeon-Style für bessere UX
 *
 * @version 1.0.0
 */

import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, Shield, FileText, Building, Lock, Mail } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// LEGAL SECTION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface LegalSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const LegalSection = memo(function LegalSection({
  title,
  icon,
  children,
  isOpen,
  onToggle,
}: LegalSectionProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(168, 85, 247, 0.1)' }}
          >
            {icon}
          </div>
          <span className="text-sm font-bold text-white">{title}</span>
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
              className="px-5 pb-5 text-xs text-white/50 leading-relaxed"
              style={{ borderTop: '1px solid rgba(255, 255, 255, 0.03)' }}
            >
              <div className="pt-4">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function LegalCenter() {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = useCallback((section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  }, []);

  return (
    <div
      className="min-h-screen pb-safe"
      style={{ background: '#050505' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-50 px-5 pt-safe pb-4" style={{ background: '#050505' }}>
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/60"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Zurück</span>
          </button>
          <h1 className="text-xs font-black uppercase tracking-[0.3em] text-white/30">
            Legal
          </h1>
          <div className="w-16" /> {/* Spacer */}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 space-y-4">
        {/* Impressum */}
        <LegalSection
          title="Impressum"
          icon={<Building size={18} className="text-purple-400" />}
          isOpen={openSection === 'impressum'}
          onToggle={() => toggleSection('impressum')}
        >
          <div className="space-y-4">
            <div>
              <p className="text-white/70 font-medium mb-2">Angaben gemäß § 5 TMG:</p>
              <p>synclulu</p>
              <p>(in Gründung)</p>
            </div>

            <div>
              <p className="text-white/70 font-medium mb-2">Vertreten durch:</p>
              <p>[Dein vollständiger Name]</p>
            </div>

            <div>
              <p className="text-white/70 font-medium mb-2">Kontakt:</p>
              <p>E-Mail: legal@synclulu.app</p>
            </div>

            <div>
              <p className="text-white/70 font-medium mb-2">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</p>
              <p>[Dein vollständiger Name]</p>
              <p>[Deine Adresse]</p>
            </div>

            <div className="pt-4 border-t border-white/5">
              <p className="text-[10px] text-white/30">
                EU-Streitschlichtung: Die Europäische Kommission stellt eine Plattform zur
                Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr/
              </p>
            </div>
          </div>
        </LegalSection>

        {/* Nutzungsbedingungen */}
        <LegalSection
          title="Nutzungsbedingungen"
          icon={<FileText size={18} className="text-purple-400" />}
          isOpen={openSection === 'terms'}
          onToggle={() => toggleSection('terms')}
        >
          <div className="space-y-4">
            <div>
              <p className="text-white/70 font-medium mb-2">§1 Geltungsbereich</p>
              <p>
                Diese Nutzungsbedingungen gelten für die Nutzung der synclulu-App.
                Mit der Registrierung akzeptierst du diese Bedingungen vollständig.
              </p>
            </div>

            <div>
              <p className="text-white/70 font-medium mb-2">§2 Nutzungsvoraussetzungen</p>
              <p>
                Du musst mindestens 16 Jahre alt sein, um synclulu zu nutzen.
                Du darfst nur einen Account pro Person erstellen.
              </p>
            </div>

            <div>
              <p className="text-white/70 font-medium mb-2">§3 Verhaltensregeln</p>
              <p>Bei der Nutzung von synclulu ist folgendes untersagt:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Hassrede, Diskriminierung oder Beleidigungen</li>
                <li>Belästigung anderer Nutzer</li>
                <li>Teilen von illegalen oder unangemessenen Inhalten</li>
                <li>Spam oder kommerzielle Werbung</li>
                <li>Manipulation oder Missbrauch des Systems</li>
              </ul>
            </div>

            <div>
              <p className="text-white/70 font-medium mb-2">§4 KI-Moderation</p>
              <p>
                synclulu verwendet KI-gestützte Moderation. Verstöße werden automatisch erkannt
                und können zu Verwarnungen, temporären Sperren oder permanentem Ausschluss führen.
              </p>
            </div>

            <div>
              <p className="text-white/70 font-medium mb-2">§5 Kontolöschung</p>
              <p>
                Du kannst deinen Account jederzeit in den Einstellungen löschen.
                Wir behalten uns vor, Accounts bei schweren Verstößen ohne Vorwarnung zu sperren.
              </p>
            </div>

            <div>
              <p className="text-white/70 font-medium mb-2">§6 Haftungsausschluss</p>
              <p>
                synclulu haftet nicht für Inhalte, die von Nutzern erstellt werden.
                Die Nutzung erfolgt auf eigene Verantwortung.
              </p>
            </div>
          </div>
        </LegalSection>

        {/* Datenschutz */}
        <LegalSection
          title="Datenschutzerklärung"
          icon={<Lock size={18} className="text-purple-400" />}
          isOpen={openSection === 'privacy'}
          onToggle={() => toggleSection('privacy')}
        >
          <div className="space-y-4">
            <div>
              <p className="text-white/70 font-medium mb-2">1. Verantwortlicher</p>
              <p>
                Verantwortlich für die Datenverarbeitung ist [Dein Name],
                erreichbar unter legal@synclulu.app.
              </p>
            </div>

            <div>
              <p className="text-white/70 font-medium mb-2">2. Erhobene Daten</p>
              <p>Wir erheben und verarbeiten:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Profildaten (Name, Avatar, Interessen)</li>
                <li>Standortdaten (nur während aktiver Nutzung)</li>
                <li>Nutzungsdaten (Aktivität, Interaktionen)</li>
                <li>Gerätedaten (anonymisierte technische Informationen)</li>
              </ul>
            </div>

            <div>
              <p className="text-white/70 font-medium mb-2">3. Standortdaten</p>
              <p>
                <strong className="text-emerald-400">Wichtig:</strong> Deine Standortdaten werden
                nur während der aktiven Nutzung verarbeitet und niemals dauerhaft gespeichert.
                Wir verwenden Geohash-Anonymisierung, um deine genaue Position zu schützen.
              </p>
            </div>

            <div>
              <p className="text-white/70 font-medium mb-2">4. Voice-Daten</p>
              <p>
                Audio aus Voice-Rooms wird in Echtzeit übertragen und <strong className="text-emerald-400">
                nicht aufgezeichnet oder gespeichert</strong>. Wir verwenden Ende-zu-Ende
                verschlüsselte Signalisierung.
              </p>
            </div>

            <div>
              <p className="text-white/70 font-medium mb-2">5. Datenspeicherung</p>
              <p>
                Deine Daten werden auf Servern in der EU (Firebase/Google Cloud) gespeichert
                und nach den Standards der DSGVO verarbeitet.
              </p>
            </div>

            <div>
              <p className="text-white/70 font-medium mb-2">6. Deine Rechte</p>
              <p>Du hast das Recht auf:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Auskunft über deine gespeicherten Daten</li>
                <li>Berichtigung unrichtiger Daten</li>
                <li>Löschung deiner Daten</li>
                <li>Datenübertragbarkeit</li>
                <li>Widerspruch gegen die Verarbeitung</li>
              </ul>
            </div>

            <div>
              <p className="text-white/70 font-medium mb-2">7. Kontakt</p>
              <p>
                Bei Fragen zum Datenschutz wende dich an:
                <span className="text-purple-400 ml-1">privacy@synclulu.app</span>
              </p>
            </div>
          </div>
        </LegalSection>

        {/* Community Guidelines */}
        <LegalSection
          title="Community-Richtlinien"
          icon={<Shield size={18} className="text-purple-400" />}
          isOpen={openSection === 'guidelines'}
          onToggle={() => toggleSection('guidelines')}
        >
          <div className="space-y-4">
            <div>
              <p className="text-white/70 font-medium mb-2">Unser Ziel</p>
              <p>
                synclulu soll ein sicherer Raum für echte menschliche Verbindungen sein.
                Respekt und gegenseitige Wertschätzung stehen an erster Stelle.
              </p>
            </div>

            <div>
              <p className="text-white/70 font-medium mb-2">Was wir erwarten</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Behandle andere so, wie du behandelt werden möchtest</li>
                <li>Respektiere die Privatsphäre anderer</li>
                <li>Verlasse Räume, wenn du dich unwohl fühlst</li>
                <li>Melde problematisches Verhalten</li>
              </ul>
            </div>

            <div>
              <p className="text-white/70 font-medium mb-2">Nulltoleranz</p>
              <p>
                Bei Hassrede, Belästigung oder illegalem Verhalten greifen
                unsere KI-Moderation und das Team sofort ein.
              </p>
            </div>
          </div>
        </LegalSection>

        {/* Contact */}
        <div className="pt-6 pb-8">
          <div
            className="p-5 rounded-2xl"
            style={{
              background: 'rgba(168, 85, 247, 0.05)',
              border: '1px solid rgba(168, 85, 247, 0.1)',
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Mail size={18} className="text-purple-400" />
              <span className="text-sm font-bold text-white">Kontakt</span>
            </div>
            <p className="text-xs text-white/50 mb-4">
              Bei rechtlichen Fragen oder Anfragen wende dich an:
            </p>
            <a
              href="mailto:legal@synclulu.app"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-purple-400"
              style={{ background: 'rgba(168, 85, 247, 0.1)' }}
            >
              legal@synclulu.app
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="text-[9px] text-white/20 uppercase tracking-widest">
            synclulu // Synchronizing Humanity
          </p>
          <p className="text-[8px] text-white/10 mt-1">
            Stand: {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
