/**
 * Impressum.tsx
 * 📜 SOVEREIGN DISCOVERY v23.0 - Theme-Aware Legal Page
 *
 * Features:
 * - Light/Dark mode support
 * - Glassmorphism effects
 * - Smooth animations
 *
 * @design Sovereign Discovery v23.0
 * @version 23.0.0
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building, Mail, Phone, Scale, FileText } from 'lucide-react';

const Impressum = () => {
  const navigate = useNavigate();

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
          <h1 className="font-display text-xl font-bold text-[var(--delulu-text)]">
            Impressum
          </h1>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-6 space-y-6"
      >
        {/* Angaben gemäß § 5 TMG */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Building size={18} className="text-[var(--delulu-accent)]" />
            <h2 className="font-semibold text-[var(--delulu-text)] text-lg">
              Angaben gemäß § 5 TMG
            </h2>
          </div>
          <div className="bg-[var(--delulu-card)] rounded-2xl p-4 shadow-sm border border-[var(--delulu-border)] space-y-2">
            <p className="text-[var(--delulu-text)] font-medium">Butterbread UG (haftungsbeschränkt)</p>
            <p className="text-[var(--delulu-muted)]">Musterstraße 123</p>
            <p className="text-[var(--delulu-muted)]">12345 Musterstadt</p>
            <p className="text-[var(--delulu-muted)]">Deutschland</p>
          </div>
        </section>

        {/* Kontakt */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Mail size={18} className="text-[var(--delulu-accent)]" />
            <h2 className="font-semibold text-[var(--delulu-text)] text-lg">
              Kontakt
            </h2>
          </div>
          <div className="bg-[var(--delulu-card)] rounded-2xl p-4 shadow-sm border border-[var(--delulu-border)] space-y-2">
            <p className="text-[var(--delulu-muted)] flex items-center gap-2">
              <Mail size={14} className="text-[var(--delulu-accent)]" />
              <span className="text-[var(--delulu-text)]">E-Mail:</span> kontakt@delulu.app
            </p>
            <p className="text-[var(--delulu-muted)] flex items-center gap-2">
              <Phone size={14} className="text-[var(--delulu-accent)]" />
              <span className="text-[var(--delulu-text)]">Telefon:</span> +49 (0) 123 456789
            </p>
          </div>
        </section>

        {/* Vertreten durch */}
        <section>
          <h2 className="font-semibold text-[var(--delulu-text)] text-lg mb-3">
            Vertreten durch
          </h2>
          <div className="bg-[var(--delulu-card)] rounded-2xl p-4 shadow-sm border border-[var(--delulu-border)]">
            <p className="text-[var(--delulu-muted)]">Geschäftsführer: Jan Hundsdorff</p>
          </div>
        </section>

        {/* Handelsregister */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={18} className="text-[var(--delulu-accent)]" />
            <h2 className="font-semibold text-[var(--delulu-text)] text-lg">
              Handelsregister
            </h2>
          </div>
          <div className="bg-[var(--delulu-card)] rounded-2xl p-4 shadow-sm border border-[var(--delulu-border)] space-y-2">
            <p className="text-[var(--delulu-muted)]">
              <span className="text-[var(--delulu-text)]">Registergericht:</span> Amtsgericht Musterstadt
            </p>
            <p className="text-[var(--delulu-muted)]">
              <span className="text-[var(--delulu-text)]">Registernummer:</span> HRB 12345
            </p>
          </div>
        </section>

        {/* Umsatzsteuer-ID */}
        <section>
          <h2 className="font-semibold text-[var(--delulu-text)] text-lg mb-3">
            Umsatzsteuer-ID
          </h2>
          <div className="bg-[var(--delulu-card)] rounded-2xl p-4 shadow-sm border border-[var(--delulu-border)]">
            <p className="text-[var(--delulu-muted)]">
              Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
              <span className="text-[var(--delulu-accent)] font-medium">DE 123456789</span>
            </p>
          </div>
        </section>

        {/* Verantwortlich */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Scale size={18} className="text-[var(--delulu-accent)]" />
            <h2 className="font-semibold text-[var(--delulu-text)] text-lg">
              Verantwortlich für den Inhalt
            </h2>
          </div>
          <div className="bg-[var(--delulu-card)] rounded-2xl p-4 shadow-sm border border-[var(--delulu-border)] space-y-2">
            <p className="text-[var(--delulu-text)] font-medium">Jan Hundsdorff</p>
            <p className="text-[var(--delulu-muted)]">Musterstraße 123</p>
            <p className="text-[var(--delulu-muted)]">12345 Musterstadt</p>
            <p className="text-xs text-[var(--delulu-muted)] mt-2 opacity-60">
              (§ 55 Abs. 2 RStV)
            </p>
          </div>
        </section>

        {/* Streitschlichtung */}
        <section>
          <h2 className="font-semibold text-[var(--delulu-text)] text-lg mb-3">
            Streitschlichtung
          </h2>
          <div className="bg-[var(--delulu-card)] rounded-2xl p-4 shadow-sm border border-[var(--delulu-border)]">
            <p className="text-[var(--delulu-muted)] text-sm leading-relaxed">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
              <br />
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--delulu-accent)] hover:underline"
              >
                https://ec.europa.eu/consumers/odr
              </a>
              <br /><br />
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
              <br /><br />
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-[var(--delulu-muted)] pt-4 opacity-60">
          <span className="text-lg mr-2">☁️</span>
          Stand: Februar 2026
        </div>
      </motion.div>
    </div>
  );
};

export default Impressum;
