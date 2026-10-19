import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Automatically load all locale files across all 32 supported Indian languages using Vite's eager glob import
const localeModules = import.meta.glob('./locales/*/*.json', { eager: true });

const resources = {};

for (const filePath in localeModules) {
  const match = filePath.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/);
  if (match) {
    const [, lang, ns] = match;
    const content = localeModules[filePath].default || localeModules[filePath];

    if (!resources[lang]) {
      resources[lang] = {
        translation: {}
      };
    }

    // Assign to primary filename namespace
    resources[lang][ns] = content;

    // Semantic aliases for components that request shorthand namespaces
    if (ns === 'eligibility-form') {
      resources[lang]['form'] = content.form || content;
    }
    if (ns === 'emi-simulator') {
      resources[lang]['emi'] = content.emi || content;
    }
    if (ns === 'partner-locator') {
      resources[lang]['locator'] = content.locator || content;
    }
    if (ns === 'documents') {
      resources[lang]['guidance'] = content.guidance || content;
    }
    if (content.voice_assistant) {
      resources[lang]['voice_assistant'] = content.voice_assistant;
      resources[lang]['voiceAssistant'] = content.voice_assistant;
    }

    // Merge into default 'translation' namespace for backwards compatibility with un-prefixed keys
    if (typeof content === 'object' && content !== null) {
      Object.assign(resources[lang].translation, content);
      // Also unwrap root sub-objects so t('key') or t('form.key') both resolve cleanly
      if (content.form) Object.assign(resources[lang].translation, content.form);
      if (content.emi) Object.assign(resources[lang].translation, content.emi);
      if (content.locator) Object.assign(resources[lang].translation, content.locator);
      if (content.guidance) Object.assign(resources[lang].translation, content.guidance);
      if (content.voice_assistant) {
        Object.assign(resources[lang].translation, content.voice_assistant);
        resources[lang].translation.voice_assistant = content.voice_assistant;
        resources[lang].translation.voiceAssistant = content.voice_assistant;
      }
    }
  }
}

// Ensure 'as' is deleted from resources and never loaded
delete resources.as;

let savedLanguage = 'en';
try {
  const stored = localStorage.getItem('scheme_setu_lang');
  if (stored && stored !== 'as') {
    savedLanguage = stored;
  } else if (stored === 'as') {
    localStorage.setItem('scheme_setu_lang', 'en');
  }
} catch (_) {}

const supportedLngs = Object.keys(resources).filter((l) => l !== 'as');

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    supportedLngs,
    defaultNS: 'translation',
    fallbackNS: [
      'common',
      'translation',
      'eligibility-form',
      'emi-simulator',
      'documents',
      'partner-locator'
    ],
    ns: [
      'common',
      'form',
      'eligibility-form',
      'emi',
      'emi-simulator',
      'documents',
      'guidance',
      'locator',
      'partner-locator',
      'translation'
    ],
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded'
    }
  });

export default i18n;
