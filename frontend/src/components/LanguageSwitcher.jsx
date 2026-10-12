import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ACTIVE_LANGUAGES, getLanguageConfig } from '../config/languages.config';
import { Languages, ChevronDown, Check, Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentCode = i18n.language || 'en';
  const currentConfig = getLanguageConfig(currentCode);

  const handleSelectLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('scheme_setu_lang', langCode);

    const cfg = getLanguageConfig(langCode);
    if (cfg?.rtl) {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
    document.documentElement.lang = langCode;

    setDropdownOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        id="language-switcher-btn"
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs font-semibold text-white shadow-inner backdrop-blur-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-saffron-500"
        aria-haspopup="true"
        aria-expanded={dropdownOpen}
      >
        <Languages className="w-3.5 h-3.5 text-saffron-400" />
        <span className="font-bold tracking-wide">
          {currentConfig.nativeName}
        </span>
        <span className="text-[10px] text-slate-400 uppercase hidden sm:inline">
          ({currentConfig.code})
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div
          id="language-dropdown-menu"
          className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 animate-fadeIn"
          role="menu"
        >
          <div className="px-3 py-1.5 border-b border-slate-800 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-saffron-400 flex items-center gap-1.5">
              <Globe className="w-3 h-3" />
              Verified Regional Languages ({ACTIVE_LANGUAGES.length})
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-0.5 px-1">
            {ACTIVE_LANGUAGES.map((lang) => {
              const isSelected = currentCode === lang.code;
              return (
                <button
                  key={lang.code}
                  id={`lang-select-${lang.code}`}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-saffron-600 text-white font-bold shadow-sm'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                  }`}
                  role="menuitem"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tracking-wide">
                        {lang.nativeName}
                      </span>
                      <span className={`text-[10px] ${isSelected ? 'text-saffron-100' : 'text-slate-400'}`}>
                        ({lang.name})
                      </span>
                    </div>
                    <span className={`text-[10px] block ${isSelected ? 'text-saffron-200' : 'text-slate-500'}`}>
                      {lang.region} {lang.rtl ? '• RTL' : ''}
                    </span>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-white flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Phase Notice Footer */}
          <div className="mt-1 pt-1.5 px-3 border-t border-slate-800 text-[10px] text-slate-400 leading-tight">
            Phase 1 verified rollout: Tamil, Telugu, Bengali, Marathi. Phase 2/3 planned.
          </div>
        </div>
      )}
    </div>
  );
}
