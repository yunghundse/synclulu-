/**
 * DatenschutzPopup.tsx
 * Standalone Privacy Page (No Auth Required)
 */

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function DatenschutzPopup() {
  const [openSection, setOpenSection] = useState<string | null>('ueberblick');

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      <h1 className="text-xl font-bold mb-6 text-center">Datenschutzerklärung</h1>
      <p className="text-xs text-white/40 text-center mb-6">synclulu - Butterbread UG - Stand: Februar 2026</p>

      <div className="max-w-lg mx-auto rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>

        <div className="border-b border-white/10">
          <button onClick={() => toggleSection('ueberblick')} className="w-full p-4 flex items-center justify-between text-left">
            <span className="font-bold text-white">1. Datenschutz auf einen Blick</span>
            <ChevronDown className={`text-white/40 transition-transform ${openSection === 'ueberblick' ? 'rotate-180' : ''}`} size={18} />
          </button>
          {openSection === 'ueberblick' && (
            <div className="px-4 pb-4 text-sm text-white/60 leading-relaxed">
              <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese App nutzen.</p>
            </div>
          )}
        </div>

        <div className="border-b border-white/10">
          <button onClick={() => toggleSection('daten')} className="w-full p-4 flex items-center justify-between text-left">
            <span className="font-bold text-white">2. Welche Daten erfassen wir?</span>
            <ChevronDown className={`text-white/40 transition-transform ${openSection === 'daten' ? 'rotate-180' : ''}`} size={18} />
          </button>
          {openSection === 'daten' && (
            <div className="px-4 pb-4 text-sm text-white/60 leading-relaxed">
              <ul className="list-disc list-inside space-y-2">
                <li>Registrierungsdaten (E-Mail, Benutzername)</li>
                <li>Profilinformationen (Avatar, Bio, Display-Name)</li>
                <li>Nutzungsdaten (Level, XP, Voice-Minuten)</li>
                <li>Standortdaten (bei aktivierter Standortfreigabe)</li>
              </ul>
            </div>
          )}
        </div>

        <div className="border-b border-white/10">
          <button onClick={() => toggleSection('standort')} className="w-full p-4 flex items-center justify-between text-left">
            <span className="font-bold text-white">3. Standortdaten</span>
            <ChevronDown className={`text-white/40 transition-transform ${openSection === 'standort' ? 'rotate-180' : ''}`} size={18} />
          </button>
          {openSection === 'standort' && (
            <div className="px-4 pb-4 text-sm text-white/60 leading-relaxed">
              <p>synclulu nutzt Standortdaten, um Nutzer in deiner Nähe zu finden. Die Standortfreigabe ist optional und kann jederzeit deaktiviert werden.</p>
              <p className="mt-2 text-purple-400"><strong>Wichtig:</strong> Wir speichern keine genauen GPS-Koordinaten, sondern nur eine ungefähre Region.</p>
            </div>
          )}
        </div>

        <div className="border-b border-white/10">
          <button onClick={() => toggleSection('voice')} className="w-full p-4 flex items-center justify-between text-left">
            <span className="font-bold text-white">4. Voice-Chat Daten</span>
            <ChevronDown className={`text-white/40 transition-transform ${openSection === 'voice' ? 'rotate-180' : ''}`} size={18} />
          </button>
          {openSection === 'voice' && (
            <div className="px-4 pb-4 text-sm text-white/60 leading-relaxed">
              <p>Voice-Chats werden <span className="text-emerald-400 font-bold">NICHT</span> aufgezeichnet oder gespeichert. Alle Gespräche sind live und werden nach Beendigung nicht archiviert.</p>
            </div>
          )}
        </div>

        <div className="border-b border-white/10">
          <button onClick={() => toggleSection('rechte')} className="w-full p-4 flex items-center justify-between text-left">
            <span className="font-bold text-white">5. Ihre Rechte</span>
            <ChevronDown className={`text-white/40 transition-transform ${openSection === 'rechte' ? 'rotate-180' : ''}`} size={18} />
          </button>
          {openSection === 'rechte' && (
            <div className="px-4 pb-4 text-sm text-white/60 leading-relaxed">
              <ul className="list-disc list-inside space-y-2">
                <li>Auskunft über Ihre gespeicherten Daten</li>
                <li>Berichtigung unrichtiger Daten</li>
                <li>Löschung Ihrer Daten</li>
                <li>Widerspruch gegen die Verarbeitung</li>
              </ul>
            </div>
          )}
        </div>

        <div className="border-b border-white/10">
          <button onClick={() => toggleSection('kontakt')} className="w-full p-4 flex items-center justify-between text-left">
            <span className="font-bold text-white">6. Kontakt</span>
            <ChevronDown className={`text-white/40 transition-transform ${openSection === 'kontakt' ? 'rotate-180' : ''}`} size={18} />
          </button>
          {openSection === 'kontakt' && (
            <div className="px-4 pb-4 text-sm text-white/60 leading-relaxed">
              <p><strong className="text-white">Butterbread UG (haftungsbeschränkt)</strong></p>
              <p className="mt-2 text-purple-400">datenschutz@synclulu.app</p>
            </div>
          )}
        </div>

      </div>

      <p className="text-center text-xs text-white/30 mt-6">© 2026 Butterbread UG. Alle Rechte vorbehalten.</p>
    </div>
  );
}
