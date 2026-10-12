import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English (Core)
import enCommon from './locales/en/common.json';
import enForm from './locales/en/eligibility-form.json';
import enEmi from './locales/en/emi-simulator.json';
import enDocs from './locales/en/documents.json';
import enLocator from './locales/en/partner-locator.json';
import enTrack from './locales/en/track.json';

// Hindi (Core)
import hiCommon from './locales/hi/common.json';
import hiForm from './locales/hi/eligibility-form.json';
import hiEmi from './locales/hi/emi-simulator.json';
import hiDocs from './locales/hi/documents.json';
import hiLocator from './locales/hi/partner-locator.json';
import hiTrack from './locales/hi/track.json';

// Tamil (Phase 1)
import taCommon from './locales/ta/common.json';
import taForm from './locales/ta/eligibility-form.json';
import taEmi from './locales/ta/emi-simulator.json';
import taDocs from './locales/ta/documents.json';
import taLocator from './locales/ta/partner-locator.json';
import taTrack from './locales/ta/track.json';

// Telugu (Phase 1)
import teCommon from './locales/te/common.json';
import teForm from './locales/te/eligibility-form.json';
import teEmi from './locales/te/emi-simulator.json';
import teDocs from './locales/te/documents.json';
import teLocator from './locales/te/partner-locator.json';
import teTrack from './locales/te/track.json';

// Bengali (Phase 1)
import bnCommon from './locales/bn/common.json';
import bnForm from './locales/bn/eligibility-form.json';
import bnEmi from './locales/bn/emi-simulator.json';
import bnDocs from './locales/bn/documents.json';
import bnLocator from './locales/bn/partner-locator.json';
import bnTrack from './locales/bn/track.json';

// Marathi (Phase 1)
import mrCommon from './locales/mr/common.json';
import mrForm from './locales/mr/eligibility-form.json';
import mrEmi from './locales/mr/emi-simulator.json';
import mrDocs from './locales/mr/documents.json';
import mrLocator from './locales/mr/partner-locator.json';
import mrTrack from './locales/mr/track.json';

// Urdu (Phase 3 RTL validation)
import urCommon from './locales/ur/common.json';
import urForm from './locales/ur/eligibility-form.json';
import urEmi from './locales/ur/emi-simulator.json';
import urDocs from './locales/ur/documents.json';
import urLocator from './locales/ur/partner-locator.json';
import urTrack from './locales/ur/track.json';

function assembleBundle(common, form, emi, docs, locator, track) {
  return {
    common,
    form,
    emi,
    documents: docs,
    locator,
    track,
    // Bundled default translation for backwards compatibility with un-namespaced keys
    translation: {
      ...common,
      ...form,
      ...emi,
      ...docs,
      ...locator,
      ...track
    }
  };
}

const resources = {
  en: assembleBundle(enCommon, enForm, enEmi, enDocs, enLocator, enTrack),
  hi: assembleBundle(hiCommon, hiForm, hiEmi, hiDocs, hiLocator, hiTrack),
  ta: assembleBundle(taCommon, taForm, taEmi, taDocs, taLocator, taTrack),
  te: assembleBundle(teCommon, teForm, teEmi, teDocs, teLocator, teTrack),
  bn: assembleBundle(bnCommon, bnForm, bnEmi, bnDocs, bnLocator, bnTrack),
  mr: assembleBundle(mrCommon, mrForm, mrEmi, mrDocs, mrLocator, mrTrack),
  ur: assembleBundle(urCommon, urForm, urEmi, urDocs, urLocator, urTrack)
};

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
