/**
 * LegalPopup.tsx
 * Standalone Legal Page (No Auth Required)
 */

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function LegalPopup() {
  const [openSection, setOpenSection] = useState<string | null>('nutzung');

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      <h1 className="text-xl font-bold mb-6 text-center">Nutzungsbedingungen</h1>
      <p className="text-xs text-white/40 text-center mb-6">synclulu - Butterbread UG - Stand: Februar 2026</p>

      <div className="max-w-lg mx-auto rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
        
        <div className="border-b border-white/10">
          <button onClick={() => toggleSection('nutzung')} className="w-full p-4 flex items-center justify-between text-left">
            <span className="font-bold text-white">1. Geltungsbereich</span>
            <ChevronDown className={`text-white/40 transition-transform ${openSection === 'nutzung' ? 'rotate-180' : ''}`} size={18} />
          </button>
          {openSection === 'nutzung' && (
            <div className="px-4 pb-4 text-sm text-white/60 leading-relaxed">
              <p>Diese Nutzungsbedingungen gelten fuer die Nutzung der synclulu App, betrieben von Butterbread UG (haftungsbeschraenkt). Mit der Registrierung akzeptierst du diese Bedingungen.</p>
            </div>
          )}
        </div>

        <div className="border-b border-white/10">
          <button onClick={() => toggleSection('konto')} className="w-full p-4 flex items-center justify-between text-left">
            <span className="font-bold text-white">2. Nutzerkonto</span>
            <ChevronDown className={`text-white/40 transition-transform ${openSection === 'konto' ? 'rotate-180' : ''}`} size={18} />
          </button>
          {openSection === 'konto' && (
            <div className="px-4 pb-4 text-sm text-white/60 leading-relaxed">
              <p>Du musst mindestens 16 Jahre alt sein. Pro Person ist nur ein Konto erlaubt. Du bist fuer alle Aktivitaeten unter deinem Konto verantwortlich.</p>
            </div>
          )}
        </div>

        <div className="border-b border-white/10">
          <button onClick={() => toggleSection('verhalten')} className="w-full p-4 flex items-center justify-between text-left">
            <span className="font-bold text-white">3. Verhaltensregeln</span>
            <ChevronDown className={`text-white/40 transition-transform ${openSection === 'verhalten' ? 'rotate-180' : ''}`} size={18} />
          </button>
          {openSection === 'verhalten' && (
            <div className="px-4 pb-4 text-sm text-white/60 leading-relaxed">
              <ul className="list-disc list-inside space-y-2">
                <li>Respektvoller Umgang mit anderen Nutzern</li>
                <li>Keine Belaestigung, Mobbing oder Hate Speech</li>
                <li>Keine sexuellen oder gewalttaetigen Inhalte</li>
                <li>Keine illegalen Aktivitaeten</li>
                <li>Kein Spam oder kommerzielle Werbung</li>
              </ul>
            </div>
          )}
        </div>

        <div className="border-b border-white/10">
          <button onClick={() => toggleSection('moderation')} className="w-full p-4 flex items-center justify-between text-left">
            <span className="font-bold text-white">4. KI-Moderation</span>
            <ChevronDown className={`text-white/40 transition-transform ${openSection === 'moderation' ? 'rotate-180' : ''}`} size={18} />
          </button>
          {openSection === 'moderation' && (
            <div className="px-4 pb-4 text-sm text-white/60 leading-relaxed">
              <p>synclulu nutzt KI-gestuetzte Moderation um die Community zu schuetzen. Verstoesse koennen zur Einschraenkung oder Sperrung deines Kontos fuehren.</p>
            </div>
          )}
        </div>

        <div className="border-b border-white/10">
          <button onClick={() => toggleSection('haftung')} className="w-full p-4 flex items-center justify-between text-left">
            <span className="font-bold text-white">5. Haftung</span>
            <ChevronDown className={`text-white/40 transition-transform ${openSection === 'haftung' ? 'rotate-180' : ''}`} size={18} />
          </button>
          {openSection === 'haftung' && (
            <div className="px-4 pb-4 text-sm text-white/60 leading-relaxed">
              <p>synclulu haftet nicht fuer Inhalte, die von Nutzern erstellt werden. Die Nutzung erfolgt auf eigene Gefahr.</p>
            </div>
          )}
        </div>

      </div>

      <p className="text-center text-xs text-white/30 mt-6">2026 Butterbread UG. Alle Rechte vorbehalten.</p>
    </div>
  );
}
