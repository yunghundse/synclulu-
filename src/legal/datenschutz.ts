/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DATENSCHUTZERKLÄRUNG v5.5
 * DSGVO-konform mit Aegis & Sanctuary Integration
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Rechtsgrundlagen:
 * - Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)
 * - Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
 * - Art. 6 Abs. 1 lit. f DSGVO (Berechtigtes Interesse)
 * - Art. 9 Abs. 2 lit. a DSGVO (Besondere Kategorien)
 *
 * @version 5.5.0
 */

export const PRIVACY_POLICY_VERSION = '5.5.0';
export const PRIVACY_POLICY_DATE = '2025-02-01';

export const DATENSCHUTZERKLAERUNG = {
  version: PRIVACY_POLICY_VERSION,
  lastUpdated: PRIVACY_POLICY_DATE,

  // ═══════════════════════════════════════
  // PRÄAMBEL
  // ═══════════════════════════════════════
  preamble: `
# Datenschutzerklärung

**Stand: ${PRIVACY_POLICY_DATE} | Version ${PRIVACY_POLICY_VERSION}**

Der Schutz Ihrer personenbezogenen Daten ist uns ein besonderes Anliegen. Diese Datenschutzerklärung informiert Sie über Art, Umfang und Zweck der Verarbeitung personenbezogener Daten innerhalb unserer App "Delulu" (nachfolgend "App" oder "Dienst").

Verantwortlicher im Sinne der DSGVO:
[FIRMENNAME EINFÜGEN]
[ADRESSE EINFÜGEN]
E-Mail: privacy@delulu.app
  `,

  // ═══════════════════════════════════════
  // DATENERHEBUNG
  // ═══════════════════════════════════════
  dataCollection: `
## 1. Welche Daten erheben wir?

### 1.1 Registrierungsdaten
Bei der Registrierung erheben wir:
- E-Mail-Adresse (zur Kontoerstellung und Kommunikation)
- Benutzername (öffentlich sichtbar)
- Geschlecht (für Matching-Funktionen)

**Wichtiger Hinweis zur Datensparsamkeit:**
Wir erheben und speichern **niemals** Ihr Geburtsdatum oder Ausweisdokumente. Die Altersverifikation erfolgt ausschließlich über verschlüsselte Ja/Nein-Bestätigungen (kryptografische Hashes), die keine Rückschlüsse auf Ihr tatsächliches Alter zulassen.

### 1.2 Standortdaten
Wir verarbeiten Ihren Standort ausschließlich:
- Während aktiver Nutzung der App
- Zur Berechnung der "Elastic Proximity" (Entfernungsberechnung zu anderen Nutzern)
- Verschlüsselt und anonymisiert

**Ihre Standortdaten werden NICHT:**
- Dauerhaft gespeichert
- An Dritte verkauft
- Für Werbezwecke verwendet

### 1.3 Gerätedaten
Zur Betrugsprävention und Account-Sicherheit erheben wir:
- Einen anonymisierten Geräte-Fingerprint (Hash)
- Dieses dient ausschließlich der Verhinderung von Mehrfach-Accounts und Account-Missbrauch

### 1.4 Kommunikationsdaten
Nachrichten zwischen Nutzern werden:
- Ende-zu-Ende verschlüsselt übertragen
- Nur bei Aktivierung des Sanctuary-Systems temporär analysiert (siehe Abschnitt 5)
  `,

  // ═══════════════════════════════════════
  // ZWECKE DER VERARBEITUNG
  // ═══════════════════════════════════════
  purposes: `
## 2. Zwecke der Datenverarbeitung

### 2.1 Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)
- Bereitstellung der App-Funktionen
- Matching mit anderen Nutzern
- Kommunikationsermöglichung

### 2.2 Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO)
- Schutz vor Betrug und Missbrauch
- Gewährleistung der Systemsicherheit
- Verbesserung unserer Dienste

### 2.3 Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)
- Audio-Analyse zur Gewaltprävention (Sanctuary-System)
- Optionale Altersverifikation via Drittanbieter
  `,

  // ═══════════════════════════════════════
  // ALTERSVERIFIKATION (AEGIS SYSTEM)
  // ═══════════════════════════════════════
  ageVerification: `
## 3. Altersverifikation (Aegis-System)

### 3.1 Privacy-by-Design
Unser Altersverifikationssystem wurde nach dem Grundsatz "Privacy by Design" entwickelt:

**Was wir NICHT speichern:**
- Geburtsdatum
- Alter in Jahren
- Ausweisbilder oder -daten
- Biometrische Rohdaten

**Was wir speichern:**
- Einen einzigen booleschen Wert: "ist_volljährig" (ja/nein)
- Zeitpunkt der Verifikation
- Verwendete Methode (KI-Schätzung oder Dokument-Hash)

### 3.2 Getrennte Nutzergruppen
Zum Schutz Minderjähriger werden verifizierte volljährige und minderjährige Nutzer in **vollständig getrennten Datenbanken** geführt. Ein "Cross-Matching" (Anzeige eines Minderjährigen bei einem Erwachsenen oder umgekehrt) ist **technisch unmöglich**.

### 3.3 Rechtsgrundlage
Die Altersverifikation dient:
- Dem Jugendschutz nach JuSchG
- Der Einhaltung des Digital Services Act (DSA)
- Der Vertragserfüllung (Mindestalter für Nutzung)
  `,

  // ═══════════════════════════════════════
  // SAFETY SCORE
  // ═══════════════════════════════════════
  safetyScore: `
## 4. Safety-Score-System

### 4.1 Funktionsweise
Jeder Nutzer erhält einen "Safety Score" (0-100), der sein Verhalten auf der Plattform widerspiegelt:
- Start: 100 Punkte
- Abzüge: Bei bestätigten Verstößen gegen Gemeinschaftsrichtlinien
- Erholung: Automatische tägliche Regeneration bei gutem Verhalten

### 4.2 Konsequenzen
- Score 80-100: Volle Funktionen
- Score 50-79: Eingeschränkte Sichtbarkeit
- Score 20-49: Temporäre Sperrung (24h)
- Score < 20: Permanente Sperrung inkl. Geräte-Sperre

### 4.3 Transparenz
Sie können Ihren Score und dessen Historie jederzeit in den Einstellungen einsehen. Bei Sperrungen informieren wir Sie über den Grund.
  `,

  // ═══════════════════════════════════════
  // SANCTUARY SYSTEM
  // ═══════════════════════════════════════
  sanctuarySystem: `
## 5. Sanctuary-System (Audio-Analyse)

### 5.1 Zweck
Das Sanctuary-System dient ausschließlich dem Schutz vor:
- Bedrohungen und Gewaltandrohungen
- Grooming-Versuchen gegenüber Minderjährigen
- Sexueller Belästigung

### 5.2 Funktionsweise
**Lokale Verarbeitung:** Die Audio-Analyse erfolgt primär auf Ihrem Gerät (On-Device). Es werden keine Sprachaufnahmen an Server übertragen, es sei denn, das System erkennt einen kritischen Sicherheitsvorfall.

**Was analysiert wird:**
- Sprachmuster und Tonfall (lokal)
- Schlüsselwörter, die auf Gefährdung hindeuten (lokal)

**Was NICHT analysiert wird:**
- Der allgemeine Inhalt Ihrer Gespräche
- Private Informationen wie Namen oder Adressen

### 5.3 Bei Erkennung einer Gefährdung
Erkennt das System mit hoher Sicherheit (Konfidenz > 85%) eine Bedrohungssituation:
1. Der betroffene Nutzer wird benachrichtigt
2. Der Vorfall wird verschlüsselt dokumentiert
3. Bei schwerwiegenden Verstößen erfolgt eine automatische Account-Sperrung

### 5.4 Einwilligung
Die Nutzung des Sanctuary-Systems erfordert Ihre **ausdrückliche Einwilligung** gemäß Art. 6 Abs. 1 lit. a DSGVO. Sie können diese Einwilligung jederzeit in den Einstellungen widerrufen. **Hinweis:** Ohne aktives Sanctuary-System können bestimmte Kommunikationsfunktionen eingeschränkt sein.

### 5.5 Rechtsgrundlage für Speicherung bei Vorfällen
Bei Erkennung strafrechtlich relevanter Inhalte (Bedrohung, Grooming) stützen wir uns auf:
- Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Gefahrenabwehr)
- § 8 TMG (Mitwirkungspflicht bei Strafverfolgung)
  `,

  // ═══════════════════════════════════════
  // GHOST REPORTING
  // ═══════════════════════════════════════
  ghostReporting: `
## 6. Ghost-Reporting-System

### 6.1 Funktion
Nutzer können verdächtige Vorfälle mit einem Klick melden. Dabei werden automatisch:
- Relevante Chat-Verläufe verschlüsselt gesichert
- Zeitstempel und Kontextdaten dokumentiert
- Beweise manipulationssicher archiviert (SHA-256 Hash)

### 6.2 Verschlüsselung
Alle gemeldeten Inhalte werden mit AES-256 verschlüsselt gespeichert. Der Zugriff erfolgt ausschließlich durch:
- Autorisierte Moderatoren bei der Fallprüfung
- Strafverfolgungsbehörden auf richterliche Anordnung

### 6.3 Aufbewahrung
Gemeldete Vorfälle werden:
- Bei Bestätigung: 3 Jahre gespeichert (Verjährungsfrist)
- Bei Abweisung: Nach 30 Tagen gelöscht
- Bei Eskalation an Behörden: Gemäß behördlicher Anforderung
  `,

  // ═══════════════════════════════════════
  // IHRE RECHTE
  // ═══════════════════════════════════════
  rights: `
## 7. Ihre Rechte

### 7.1 Auskunftsrecht (Art. 15 DSGVO)
Sie haben das Recht, Auskunft über Ihre gespeicherten Daten zu erhalten.

### 7.2 Berichtigungsrecht (Art. 16 DSGVO)
Sie können die Berichtigung unrichtiger Daten verlangen.

### 7.3 Löschungsrecht (Art. 17 DSGVO)
Sie können die Löschung Ihrer Daten verlangen, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.

### 7.4 Widerspruchsrecht (Art. 21 DSGVO)
Sie können der Verarbeitung Ihrer Daten widersprechen.

### 7.5 Datenübertragbarkeit (Art. 20 DSGVO)
Sie können Ihre Daten in einem maschinenlesbaren Format anfordern.

### 7.6 Widerruf der Einwilligung
Erteilte Einwilligungen können Sie jederzeit mit Wirkung für die Zukunft widerrufen.

### 7.7 Beschwerderecht
Sie haben das Recht, sich bei einer Aufsichtsbehörde zu beschweren.
  `,

  // ═══════════════════════════════════════
  // KONTAKT
  // ═══════════════════════════════════════
  contact: `
## 8. Kontakt

Bei Fragen zum Datenschutz wenden Sie sich an:
- E-Mail: privacy@delulu.app
- Datenschutzbeauftragter: dpo@delulu.app

---

Diese Datenschutzerklärung kann bei Bedarf angepasst werden. Die aktuelle Version ist stets in der App und auf unserer Website verfügbar.
  `,
};

// ═══════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════

export function getFullPrivacyPolicy(): string {
  return Object.values(DATENSCHUTZERKLAERUNG)
    .filter(v => typeof v === 'string')
    .join('\n\n');
}

export function getPrivacyPolicySection(section: keyof typeof DATENSCHUTZERKLAERUNG): string {
  return DATENSCHUTZERKLAERUNG[section] as string || '';
}

export default DATENSCHUTZERKLAERUNG;
