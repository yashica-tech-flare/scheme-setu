import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Automatically load all locale files across all 22 Eighth Schedule languages + English using Vite's glob import
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

    // Assign to namespace (e.g. track, common, form, emi, documents, locator)
    resources[lang][ns] = content;

    // Merge into default 'translation' namespace for backwards compatibility with un-prefixed keys
    if (typeof content === 'object' && content !== null) {
      Object.assign(resources[lang].translation, content);
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
    fallbackNS: ['common', 'translation'],
    ns: ['common', 'form', 'emi', 'documents', 'locator', 'track', 'translation'],
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
