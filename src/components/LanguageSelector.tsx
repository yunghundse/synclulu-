import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslation, LANGUAGES, Language } from '@/lib/i18n';

interface LanguageSelectorProps {
  compact?: boolean;
}

const LanguageSelector = ({ compact = false }: LanguageSelectorProps) => {
  const { language, setLanguage, currentLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-synclulu-soft hover:bg-synclulu-soft/80 transition-colors"
        >
          <span className="text-lg">{currentLanguage.flag}</span>
          <ChevronDown
            size={16}
            className={`text-synclulu-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 min-w-[160px]">
              {(Object.entries(LANGUAGES) as [Language, typeof LANGUAGES[Language]][]).map(
                ([code, lang]) => (
                  <button
                    key={code}
                    onClick={() => handleSelect(code)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-synclulu-soft transition-colors ${
                      language === code ? 'bg-synclulu-soft' : ''
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="font-medium text-synclulu-text flex-1 text-left">
                      {lang.native}
                    </span>
                    {language === code && (
                      <Check size={16} className="text-synclulu-violet" />
                    )}
                  </button>
                )
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {(Object.entries(LANGUAGES) as [Language, typeof LANGUAGES[Language]][]).map(
        ([code, lang]) => (
          <button
            key={code}
            onClick={() => handleSelect(code)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
              language === code
                ? 'bg-synclulu-violet/10 border-2 border-synclulu-violet'
                : 'bg-synclulu-soft border-2 border-transparent hover:border-synclulu-violet/20'
            }`}
          >
            <span className="text-2xl">{lang.flag}</span>
            <div className="flex-1 text-left">
              <p className="font-semibold text-synclulu-text">{lang.native}</p>
              <p className="text-xs text-synclulu-muted">{lang.name}</p>
            </div>
            {language === code && (
              <div className="w-6 h-6 rounded-full bg-synclulu-violet flex items-center justify-center">
                <Check size={14} className="text-white" />
              </div>
            )}
          </button>
        )
      )}
    </div>
  );
};

export default LanguageSelector;
