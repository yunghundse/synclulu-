/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ALLGEMEINE GESCHÄFTSBEDINGUNGEN (AGB) v5.5
 * "Anti-Klage-Architektur"
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Rechtliche Absicherung durch:
 * - Haftungsausschluss für technische Grenzen
 * - Sanktionen bei Missbrauch des Meldesystems
 * - Verpflichtung zur Nutzung von Sicherheitsfeatures
 *
 * @version 5.5.0
 */

export const TOS_VERSION = '5.5.0';
export const TOS_DATE = '2025-02-01';

export const ALLGEMEINE_GESCHAEFTSBEDINGUNGEN = {
  version: TOS_VERSION,
  lastUpdated: TOS_DATE,

  // ═══════════════════════════════════════
  // PRÄAMBEL
  // ═══════════════════════════════════════
  preamble: `
# Allgemeine Geschäftsbedingungen (AGB)

**Stand: ${TOS_DATE} | Version ${TOS_VERSION}**

Diese Allgemeinen Geschäftsbedingungen regeln die Nutzung der mobilen Anwendung "Delulu" (nachfolgend "App" oder "Dienst") zwischen dem Anbieter [FIRMENNAME] (nachfolgend "wir", "uns" oder "Anbieter") und Ihnen als Nutzer (nachfolgend "Sie" oder "Nutzer").

Mit der Registrierung und Nutzung der App erklären Sie sich mit diesen AGB einverstanden.
  `,

  // ═══════════════════════════════════════
  // LEISTUNGSBESCHREIBUNG
  // ═══════════════════════════════════════
  services: `
## 1. Leistungsbeschreibung

### 1.1 Kernfunktionen
Delulu ist eine proximity-basierte Social-Discovery-Plattform, die folgende Funktionen bereitstellt:
- Standortbasiertes Matching mit anderen Nutzern
- Kommunikation via Text, Voice und Medien
- Profildarstellung und -verwaltung

### 1.2 Sicherheitsfunktionen
Integrale Bestandteile des Dienstes sind:
- **Aegis-System:** Altersverifikation und Nutzersegmentierung
- **Sanctuary-System:** KI-gestützte Gewaltprävention
- **Guardian-System:** Automatisierte Inhaltsprüfung

**Diese Sicherheitssysteme sind keine optionalen Zusatzfeatures, sondern essentielle Bestandteile des Dienstes.** Die Nutzung der App setzt die Akzeptanz und Aktivierung dieser Systeme voraus.
  `,

  // ═══════════════════════════════════════
  // ZUGANGSVORAUSSETZUNGEN
  // ═══════════════════════════════════════
  eligibility: `
## 2. Zugangsvoraussetzungen

### 2.1 Mindestalter
Die Nutzung der App erfordert ein Mindestalter von **16 Jahren** in Deutschland bzw. das in Ihrem Land geltende digitale Volljährigkeitsalter.

### 2.2 Altersverifikation
Zur Gewährleistung des Jugendschutzes ist eine Altersverifikation **verpflichtend**:
- Für Nutzer unter 18 Jahren: Beschränkter Zugang mit erhöhtem Schutz
- Für Nutzer ab 18 Jahren: Vollzugang nach erfolgreicher Verifikation

### 2.3 Getrennte Nutzerbereiche
Volljährige und minderjährige Nutzer werden in **technisch vollständig getrennten Bereichen** geführt. Eine Interaktion zwischen diesen Gruppen ist **systemseitig ausgeschlossen**.

### 2.4 Wahrhaftigkeit
Sie versichern, dass alle bei der Registrierung gemachten Angaben wahrheitsgemäß sind. Falsche Altersangaben oder Identitätsmanipulation führen zur **sofortigen Sperrung** ohne Anspruch auf Erstattung.
  `,

  // ═══════════════════════════════════════
  // SANCTUARY PFLICHTNUTZUNG
  // ═══════════════════════════════════════
  sanctuaryObligation: `
## 3. Sanctuary-System (Verpflichtende Sicherheitsfunktion)

### 3.1 Definition
Das Sanctuary-System ist ein KI-gestütztes Sicherheitssystem, das Kommunikation in Echtzeit auf Anzeichen von:
- Bedrohungen und Gewaltandrohungen
- Grooming-Versuchen
- Sexueller Belästigung
analysiert.

### 3.2 Verpflichtende Aktivierung
**Die Nutzung des Sanctuary-Systems ist Voraussetzung für die Nutzung der Kommunikationsfunktionen der App.**

Begründung: Das Sanctuary-System dient dem Schutz aller Nutzer, insbesondere Minderjähriger. Ohne dieses System kann ein angemessenes Sicherheitsniveau nicht gewährleistet werden.

### 3.3 Funktionsweise
- Lokale Analyse auf dem Endgerät (Privacy by Design)
- Keine Speicherung normaler Kommunikation
- Verschlüsselte Dokumentation nur bei kritischen Vorfällen

### 3.4 Konsequenzen bei Deaktivierung
Nutzer, die das Sanctuary-System deaktivieren:
- Verlieren Zugang zu Sprach- und Video-Funktionen
- Können nur eingeschränkt kommunizieren (Text mit Verzögerung)
- Werden in der Sichtbarkeit reduziert
  `,

  // ═══════════════════════════════════════
  // VERHALTENSREGELN
  // ═══════════════════════════════════════
  conduct: `
## 4. Verhaltensregeln

### 4.1 Verbotene Inhalte und Verhaltensweisen
Folgende Handlungen sind strikt untersagt:
- Belästigung, Stalking oder Bedrohung anderer Nutzer
- Verbreitung expliziter Inhalte ohne Einwilligung
- Grooming oder jegliche unangemessene Kontaktaufnahme zu Minderjährigen
- Identitätsbetrug oder Catfishing
- Spam, Werbung oder kommerzielle Nutzung
- Umgehung von Sicherheitsfunktionen
- Manipulation des Safety-Score-Systems
- Missbrauch des Meldesystems

### 4.2 Safety-Score
Ihr Verhalten wird durch einen Safety-Score (0-100) reflektiert:
- Verstöße führen zu Punktabzügen
- Bei Score unter 20: Permanente Sperrung
- Score-Historie ist für Sie einsehbar

### 4.3 Konsequenzen bei Verstößen
Bei Verstößen behalten wir uns vor:
- Temporäre Sperrung des Accounts
- Permanente Sperrung des Accounts
- Sperrung des Geräts (Device-Ban)
- Meldung an Strafverfolgungsbehörden
  `,

  // ═══════════════════════════════════════
  // MELDESYSTEM & FALSE REPORTING
  // ═══════════════════════════════════════
  reporting: `
## 5. Meldesystem und Missbrauchsprävention

### 5.1 Ghost-Reporting
Nutzer können verdächtige Vorfälle melden. Das System sichert automatisch relevante Beweise.

### 5.2 Missbrauch des Meldesystems (False Reporting)
**Falschmeldungen werden als schwerwiegender Verstoß behandelt.**

Unter Missbrauch des Meldesystems fallen:
- Wissentlich falsche Meldungen
- Meldungen zur Belästigung anderer Nutzer
- Mehrfachmeldungen desselben Sachverhalts ohne neue Informationen
- Instrumentalisierung des Systems für persönliche Konflikte

### 5.3 Sanktionen bei False Reporting
Bei nachgewiesenem Missbrauch:
- **Erste Falschmeldung:** Warnung + 15 Punkte Abzug vom Safety-Score
- **Zweite Falschmeldung:** 30 Punkte Abzug + 7 Tage Sperrung
- **Weitere Falschmeldungen:** Permanente Sperrung

### 5.4 Dokumentation
Alle Meldungen werden dokumentiert. Diese Dokumentation dient:
- Der Nachverfolgung von Mustern
- Dem Schutz unberechtigt Gemeldeter
- Als Beweis bei Rechtsstreitigkeiten
  `,

  // ═══════════════════════════════════════
  // HAFTUNG UND HAFTUNGSAUSSCHLUSS
  // ═══════════════════════════════════════
  liability: `
## 6. Haftung

### 6.1 Haftung des Anbieters
Wir haften:
- Unbeschränkt für Vorsatz und grobe Fahrlässigkeit
- Bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten)
- Im Rahmen der gesetzlichen Produkthaftung

### 6.2 Haftungsausschluss für KI-gestützte Systeme
**Der Anbieter haftet NICHT für Schäden, die trotz ordnungsgemäßer Funktion der Sicherheitssysteme (Sanctuary, Guardian, Aegis) entstehen, wenn:**

a) Das System einen Verstoß nicht erkannt hat, obwohl:
   - Der Nutzer das System aktiviert hatte
   - Das System nach dem Stand der Technik funktioniert hat
   - Die Grenzen automatisierter Inhaltserkennung die Erkennung verhinderten

b) Ein Verstoß außerhalb der überwachten Kanäle stattfand (z.B. nach Wechsel auf externe Plattformen)

c) Der geschädigte Nutzer:
   - Das Sanctuary-System deaktiviert hatte
   - Warnhinweise des Systems ignoriert hatte
   - Das Ghost-Reporting-System nicht genutzt hat, obwohl Anlass bestand

### 6.3 Technische Grenzen der KI
Wir weisen ausdrücklich darauf hin, dass:
- KI-Systeme keine 100%ige Erkennungsrate garantieren können
- Kontextuelle Nuancen möglicherweise nicht erkannt werden
- Das System auf statistische Wahrscheinlichkeiten basiert

**Trotz dieser Einschränkungen stellt das Sanctuary-System einen wesentlichen Sicherheitsmehrwert dar, dessen Nutzung wir allen Nutzern dringend empfehlen.**

### 6.4 Haftung für Nutzerinhalte
Für Inhalte, die von Nutzern erstellt oder geteilt werden, haften ausschließlich die jeweiligen Nutzer. Wir übernehmen keine Verantwortung für nutzergenerierten Content.
  `,

  // ═══════════════════════════════════════
  // DATENSCHUTZ VERWEIS
  // ═══════════════════════════════════════
  privacy: `
## 7. Datenschutz

Die Verarbeitung Ihrer personenbezogenen Daten erfolgt gemäß unserer Datenschutzerklärung, die integraler Bestandteil dieser AGB ist. Mit der Annahme dieser AGB bestätigen Sie, die Datenschutzerklärung zur Kenntnis genommen zu haben.
  `,

  // ═══════════════════════════════════════
  // KÜNDIGUNG UND SPERRUNG
  // ═══════════════════════════════════════
  termination: `
## 8. Kündigung und Sperrung

### 8.1 Kündigung durch den Nutzer
Sie können Ihren Account jederzeit in den Einstellungen löschen. Mit der Löschung werden Ihre Daten gemäß unserer Datenschutzerklärung behandelt.

### 8.2 Kündigung und Sperrung durch den Anbieter
Wir behalten uns vor, Accounts zu sperren oder zu löschen bei:
- Verstößen gegen diese AGB
- Safety-Score unter 20
- Verdacht auf strafbare Handlungen
- Inaktivität von mehr als 12 Monaten

### 8.3 Device-Ban
Bei schwerwiegenden Verstößen oder wiederholtem Fehlverhalten kann eine Gerätesperre verhängt werden. Diese verhindert die Registrierung neuer Accounts auf dem betroffenen Gerät.

### 8.4 Kein Anspruch auf Erstattung
Bei Sperrung wegen Verstoßes gegen diese AGB besteht kein Anspruch auf Erstattung etwaiger Zahlungen.
  `,

  // ═══════════════════════════════════════
  // ÄNDERUNGEN DER AGB
  // ═══════════════════════════════════════
  changes: `
## 9. Änderungen der AGB

### 9.1 Änderungsrecht
Wir behalten uns vor, diese AGB zu ändern, um:
- Neue Funktionen zu integrieren
- Rechtlichen Anforderungen zu entsprechen
- Die Sicherheit zu verbessern

### 9.2 Benachrichtigung
Über wesentliche Änderungen werden Sie mindestens 30 Tage im Voraus informiert. Bei fortgesetzter Nutzung nach Inkrafttreten der Änderungen gelten diese als akzeptiert.
  `,

  // ═══════════════════════════════════════
  // SCHLUSSBESTIMMUNGEN
  // ═══════════════════════════════════════
  finalProvisions: `
## 10. Schlussbestimmungen

### 10.1 Anwendbares Recht
Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.

### 10.2 Gerichtsstand
Soweit gesetzlich zulässig, ist Gerichtsstand [ORT EINFÜGEN].

### 10.3 Salvatorische Klausel
Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.

### 10.4 Vertragssprache
Die Vertragssprache ist Deutsch.

---

**Mit der Registrierung und Nutzung von Delulu akzeptieren Sie diese AGB in vollem Umfang.**
  `,
};

// ═══════════════════════════════════════
// KURZFASSUNGEN FÜR UI
// ═══════════════════════════════════════

export const TOS_HIGHLIGHTS = {
  sanctuary: {
    title: 'Sanctuary-System Pflicht',
    text: 'Das Sanctuary-System ist ein essentielles Sicherheitsfeature. Es analysiert Kommunikation lokal auf Bedrohungen und Grooming-Versuche. Die Aktivierung ist Voraussetzung für die Nutzung von Sprach- und Video-Funktionen.',
    required: true,
  },
  ageVerification: {
    title: 'Altersverifikation',
    text: 'Zur Gewährleistung des Jugendschutzes ist eine Altersverifikation verpflichtend. Minderjährige und Erwachsene werden in getrennten Bereichen geführt.',
    required: true,
  },
  safetyScore: {
    title: 'Safety-Score',
    text: 'Ihr Verhalten wird durch einen Safety-Score (0-100) gemessen. Verstöße führen zu Punktabzügen. Bei Score unter 20 erfolgt eine permanente Sperrung.',
    required: false,
  },
  falseReporting: {
    title: 'Missbrauch des Meldesystems',
    text: 'Wissentlich falsche Meldungen werden sanktioniert. Wiederholter Missbrauch führt zur permanenten Sperrung.',
    required: false,
  },
  liability: {
    title: 'Haftungshinweis',
    text: 'KI-Systeme können keine 100%ige Erkennungsrate garantieren. Wir haften nicht für Schäden, die trotz ordnungsgemäßer Funktion der Sicherheitssysteme entstehen.',
    required: false,
  },
};

// ═══════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════

export function getFullTermsOfService(): string {
  return Object.values(ALLGEMEINE_GESCHAEFTSBEDINGUNGEN)
    .filter(v => typeof v === 'string')
    .join('\n\n');
}

export function getTOSSection(section: keyof typeof ALLGEMEINE_GESCHAEFTSBEDINGUNGEN): string {
  return ALLGEMEINE_GESCHAEFTSBEDINGUNGEN[section] as string || '';
}

export default ALLGEMEINE_GESCHAEFTSBEDINGUNGEN;
