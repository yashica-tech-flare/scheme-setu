import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const toggleLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('scheme_setu_lang', lang);
  };

  return (
    <div className="inline-flex items-center p-1 bg-slate-800/60 border border-slate-700/80 rounded-xl shadow-inner backdrop-blur-md">
      <div className="flex items-center pl-2 pr-1 text-slate-400">
        <Languages className="w-4 h-4" />
      </div>
      <button
        id="lang-btn-en"
        type="button"
        onClick={() => toggleLanguage('en')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all duration-200 ${
          currentLang === 'en'
            ? 'bg-saffron-600 text-white shadow-sm'
            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
        }`}
      >
        English
      </button>
      <button
        id="lang-btn-hi"
        type="button"
        onClick={() => toggleLanguage('hi')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all duration-200 font-devanagari ${
          currentLang === 'hi'
            ? 'bg-saffron-600 text-white shadow-sm'
            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
        }`}
      >
        हिन्दी
      </button>
    </div>
  );
}
