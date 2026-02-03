/**
 * Datenschutz.tsx
 * 📜 SOLID NEBULA v22.0 - Privacy Policy Page
 *
 * Clean Typography Design with Midnight Obsidian theme
 *
 * @design Solid Nebula v22.0
 * @version 22.0.0
 */

import { useNavigate } from 'react-router-dom';
import { LegalScreen, LegalSection, LegalList } from '@/components/LegalScreen';

const Datenschutz = () => {
  const navigate = useNavigate();

  return (
    <LegalScreen
      title="Datenschutz"
      onBack={() => navigate(-1)}
      showAcceptButton={false}
      content={
        <>
          <LegalSection title="1. Datenschutz auf einen Blick">
            <p>
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
              personenbezogenen Daten passiert, wenn Sie diese App nutzen. Personenbezogene
              Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
            </p>
          </LegalSection>

          <LegalSection title="2. Welche Daten erfassen wir?">
            <LegalList
              items={[
                'Registrierungsdaten (E-Mail, Benutzername, Passwort)',
                'Profilinformationen (Avatar, Bio, Display-Name)',
                'Nutzungsdaten (Level, XP, Voice-Minuten, Sterne)',
                'Standortdaten (bei aktivierter Standortfreigabe)',
                'Geräte-Informationen',
              ]}
            />
            <p className="mt-4">
              Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen
              (z.B. bei der Registrierung). Andere Daten werden automatisch beim Nutzen
              der App durch unsere IT-Systeme erfasst.
            </p>
          </LegalSection>

          <LegalSection title="3. Standortdaten">
            <p>
              delulu nutzt Standortdaten, um Nutzer in deiner Nähe zu finden und Voice-Räume
              basierend auf der Region anzuzeigen. Die Standortfreigabe ist optional und kann
              jederzeit in den Einstellungen deaktiviert werden.
            </p>
            <p className="mt-3" style={{ color: '#a855f7' }}>
              <strong>Wichtig:</strong> Wir speichern keine genauen GPS-Koordinaten, sondern
              nur eine ungefähre Region (z.B. Stadt oder Stadtteil).
            </p>
          </LegalSection>

          <LegalSection title="4. Voice-Chat Daten">
            <p>
              Voice-Chats werden <strong style={{ color: '#10b981' }}>nicht</strong> aufgezeichnet
              oder gespeichert. Alle Gespräche sind live und werden nach Beendigung nicht archiviert.
            </p>
            <p className="mt-3">
              Wir erfassen lediglich Metadaten wie Dauer der Teilnahme (zur XP-Berechnung)
              und Bewertungen durch andere Nutzer.
            </p>
          </LegalSection>

          <LegalSection title="5. Ihre Rechte">
            <p>Sie haben jederzeit das Recht:</p>
            <LegalList
              items={[
                'Auskunft über Ihre gespeicherten Daten zu erhalten',
                'Berichtigung unrichtiger Daten zu verlangen',
                'Löschung Ihrer Daten zu verlangen',
                'Die Verarbeitung einzuschränken',
                'Datenübertragbarkeit zu verlangen',
                'Widerspruch gegen die Verarbeitung einzulegen',
              ]}
            />
          </LegalSection>

          <LegalSection title="6. Datenlöschung">
            <p>
              Über die Einstellungen → "Account löschen" können Sie Ihre gesamten Daten
              unwiderruflich löschen. Nach Bestätigung werden alle personenbezogenen
              Daten innerhalb von 30 Tagen vollständig entfernt.
            </p>
          </LegalSection>

          <LegalSection title="7. Kontakt">
            <p>
              Bei Fragen zum Datenschutz erreichen Sie uns unter:
            </p>
            <div className="mt-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p><strong style={{ color: 'white' }}>Butterbread UG (haftungsbeschränkt)</strong></p>
              <p className="mt-2">Musterstraße 123</p>
              <p>12345 Musterstadt</p>
              <p className="mt-2" style={{ color: '#a855f7' }}>datenschutz@delulu.app</p>
            </div>
          </LegalSection>

          <LegalSection title="8. Änderungen">
            <p>
              Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie
              stets den aktuellen rechtlichen Anforderungen entspricht oder um Änderungen
              unserer Leistungen umzusetzen.
            </p>
          </LegalSection>
        </>
      }
    />
  );
};

export default Datenschutz;
