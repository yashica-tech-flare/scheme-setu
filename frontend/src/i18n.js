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

    // Merge into default 'translation' namespace for backwards compatibility with un-prefixed keys
    if (typeof content === 'object' && content !== null) {
      Object.assign(resources[lang].translation, content);
      // Also unwrap root sub-objects so t('key') or t('form.key') both resolve cleanly
      if (content.form) Object.assign(resources[lang].translation, content.form);
      if (content.emi) Object.assign(resources[lang].translation, content.emi);
      if (content.locator) Object.assign(resources[lang].translation, content.locator);
      if (content.guidance) Object.assign(resources[lang].translation, content.guidance);
      if (content.track) Object.assign(resources[lang].translation, content.track);
    }
  }
}

const savedLanguage = localStorage.getItem('scheme_setu_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    defaultNS: 'translation',
    fallbackNS: [
      'common',
      'translation',
      'eligibility-form',
      'emi-simulator',
      'documents',
      'partner-locator',
      'track'
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
      'track',
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
