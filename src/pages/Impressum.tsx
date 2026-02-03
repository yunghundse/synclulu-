import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Impressum = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-delulu-soft/50 to-white safe-top safe-bottom pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-lg border-b border-gray-100">
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-delulu-muted hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display text-xl font-bold text-delulu-text">
            Impressum
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        <section>
          <h2 className="font-semibold text-delulu-text text-lg mb-3">
            Angaben gemäß § 5 TMG
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
            <p className="text-delulu-text font-medium">Butterbread UG (haftungsbeschränkt)</p>
            <p className="text-delulu-muted">Musterstraße 123</p>
            <p className="text-delulu-muted">12345 Musterstadt</p>
            <p className="text-delulu-muted">Deutschland</p>
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-delulu-text text-lg mb-3">
            Kontakt
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
            <p className="text-delulu-muted">
              <span className="text-delulu-text">E-Mail:</span> kontakt@delulu.app
            </p>
            <p className="text-delulu-muted">
              <span className="text-delulu-text">Telefon:</span> +49 (0) 123 456789
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-delulu-text text-lg mb-3">
            Vertreten durch
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-delulu-muted">Geschäftsführer: Jan Hundsdorff</p>
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-delulu-text text-lg mb-3">
            Handelsregister
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
            <p className="text-delulu-muted">
              <span className="text-delulu-text">Registergericht:</span> Amtsgericht Musterstadt
            </p>
            <p className="text-delulu-muted">
              <span className="text-delulu-text">Registernummer:</span> HRB 12345
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-delulu-text text-lg mb-3">
            Umsatzsteuer-ID
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-delulu-muted">
              Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
              DE 123456789
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-delulu-text text-lg mb-3">
            Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
            <p className="text-delulu-text font-medium">Jan Hundsdorff</p>
            <p className="text-delulu-muted">Musterstraße 123</p>
            <p className="text-delulu-muted">12345 Musterstadt</p>
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-delulu-text text-lg mb-3">
            Streitschlichtung
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-delulu-muted text-sm">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
              <span className="text-delulu-violet"> https://ec.europa.eu/consumers/odr</span>
              <br /><br />
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
              <br /><br />
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </div>
        </section>

        <div className="text-center text-xs text-delulu-muted pt-4">
          Stand: Januar 2025
        </div>
      </div>
    </div>
  );
};

export default Impressum;
