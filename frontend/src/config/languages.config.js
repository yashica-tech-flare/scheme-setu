/**
 * Scheme Setu — Comprehensive 22 Scheduled Languages + English Manifest Configuration
 * Controls active localization, font family mapping, RTL layout direction,
 * and phased rollout status ('complete' | 'partial' | 'planned').
 *
 * ONLY 'complete' and 'partial' languages are exposed in the UI language switcher.
 * 'planned' languages remain documented in config for Phase 2/3 rollout.
 */

export const LANGUAGES = [
  // Base Working Languages
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    scriptFamily: 'Latin',
    rtl: false,
    fontFamily: 'Inter, sans-serif',
    status: 'complete',
    phase: 'Core',
    region: 'Pan-India'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    scriptFamily: 'Devanagari',
    rtl: false,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
    status: 'complete',
    phase: 'Core',
    region: 'North & Central India'
  },

  // PHASE 1 ROLLOUT (Major NSFDC Beneficiary Population Centers)
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    scriptFamily: 'Tamil',
    rtl: false,
    fontFamily: "'Noto Sans Tamil', sans-serif",
    status: 'complete',
    phase: 'Phase 1',
    region: 'Tamil Nadu (TAHDCO) & Puducherry'
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    scriptFamily: 'Telugu',
    rtl: false,
    fontFamily: "'Noto Sans Telugu', sans-serif",
    status: 'complete',
    phase: 'Phase 1',
    region: 'Andhra Pradesh (APSCCFC) & Telangana (TSCCDC)'
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    scriptFamily: 'Bengali',
    rtl: false,
    fontFamily: "'Noto Sans Bengali', sans-serif",
    status: 'complete',
    phase: 'Phase 1',
    region: 'West Bengal (WBSCSTDFC) & Tripura'
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    scriptFamily: 'Devanagari',
    rtl: false,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
    status: 'complete',
    phase: 'Phase 1',
    region: 'Maharashtra (MPBCDC)'
  },

  // RTL VALIDATION LANGUAGE (Phase 3 scheduled language with Perso-Arabic RTL script)
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    scriptFamily: 'Perso-Arabic',
    rtl: true,
    fontFamily: "'Noto Nastaliq Urdu', serif",
    status: 'partial',
    phase: 'Phase 3 (RTL Anchor)',
    region: 'Pan-India (Northern & Deccan)'
  },

  // PHASE 2 (Next 4 Scheduled Languages)
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    scriptFamily: 'Gujarati',
    rtl: false,
    fontFamily: "'Noto Sans Gujarati', sans-serif",
    status: 'planned',
    phase: 'Phase 2',
    region: 'Gujarat (GSCDC)'
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    scriptFamily: 'Kannada',
    rtl: false,
    fontFamily: "'Noto Sans Kannada', sans-serif",
    status: 'planned',
    phase: 'Phase 2',
    region: 'Karnataka (KSDC)'
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    scriptFamily: 'Malayalam',
    rtl: false,
    fontFamily: "'Noto Sans Malayalam', sans-serif",
    status: 'planned',
    phase: 'Phase 2',
    region: 'Kerala (KSCDC)'
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    scriptFamily: 'Gurmukhi',
    rtl: false,
    fontFamily: "'Noto Sans Gurmukhi', sans-serif",
    status: 'planned',
    phase: 'Phase 2',
    region: 'Punjab (PSCFC) & Haryana'
  },

  // PHASE 3 (Remaining Constitutional Scheduled Languages)
  {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    scriptFamily: 'Odia',
    rtl: false,
    fontFamily: "'Noto Sans Oriya', sans-serif",
    status: 'planned',
    phase: 'Phase 3',
    region: 'Odisha (OSFDC)'
  },
  {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    scriptFamily: 'Bengali-Assamese',
    rtl: false,
    fontFamily: "'Noto Sans Bengali', sans-serif",
    status: 'planned',
    phase: 'Phase 3',
    region: 'Assam SC Corporation'
  },
  {
    code: 'sa',
    name: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    scriptFamily: 'Devanagari',
    rtl: false,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
    status: 'planned',
    phase: 'Phase 3',
    region: 'National Heritage'
  },
  {
    code: 'kok',
    name: 'Konkani',
    nativeName: 'कोंकणी',
    scriptFamily: 'Devanagari',
    rtl: false,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
    status: 'planned',
    phase: 'Phase 3',
    region: 'Goa & Coastal Karnataka'
  },
  {
    code: 'mni',
    name: 'Manipuri',
    nativeName: 'মৈতৈলোন্',
    scriptFamily: 'Meetei Mayek / Bengali',
    rtl: false,
    fontFamily: "'Noto Sans Meetei Mayek', sans-serif",
    status: 'planned',
    phase: 'Phase 3',
    region: 'Manipur'
  },
  {
    code: 'brx',
    name: 'Bodo',
    nativeName: 'बर’',
    scriptFamily: 'Devanagari',
    rtl: false,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
    status: 'planned',
    phase: 'Phase 3',
    region: 'Bodoland (Assam)'
  },
  {
    code: 'sat',
    name: 'Santali',
    nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ',
    scriptFamily: 'Ol Chiki',
    rtl: false,
    fontFamily: "'Noto Sans Ol Chiki', sans-serif",
    status: 'planned',
    phase: 'Phase 3',
    region: 'Jharkhand, Odisha, West Bengal'
  },
  {
    code: 'ks',
    name: 'Kashmiri',
    nativeName: 'کٲشُر',
    scriptFamily: 'Perso-Arabic',
    rtl: true,
    fontFamily: "'Noto Nastaliq Urdu', serif",
    status: 'planned',
    phase: 'Phase 3',
    region: 'Jammu & Kashmir'
  },
  {
    code: 'ne',
    name: 'Nepali',
    nativeName: 'नेपाली',
    scriptFamily: 'Devanagari',
    rtl: false,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
    status: 'planned',
    phase: 'Phase 3',
    region: 'Sikkim & North Bengal'
  },
  {
    code: 'sd',
    name: 'Sindhi',
    nativeName: 'سنڌي',
    scriptFamily: 'Perso-Arabic',
    rtl: true,
    fontFamily: "'Noto Nastaliq Urdu', serif",
    status: 'planned',
    phase: 'Phase 3',
    region: 'Western India'
  },
  {
    code: 'doi',
    name: 'Dogri',
    nativeName: 'डोगरी',
    scriptFamily: 'Devanagari',
    rtl: false,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
    status: 'planned',
    phase: 'Phase 3',
    region: 'Jammu'
  },
  {
    code: 'mai',
    name: 'Maithili',
    nativeName: 'मैथिली',
    scriptFamily: 'Devanagari',
    rtl: false,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
    status: 'planned',
    phase: 'Phase 3',
    region: 'Bihar & Mithila'
  }
];

/**
 * Filtered list of languages active in the UI switcher.
 * Never includes 'planned' languages to ensure no broken English-fallback placeholders.
 */
export const ACTIVE_LANGUAGES = LANGUAGES.filter(
  (lang) => lang.status === 'complete' || lang.status === 'partial'
);

export function getLanguageConfig(code) {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}

export function isRTL(code) {
  const cfg = getLanguageConfig(code);
  return Boolean(cfg?.rtl);
}

export default LANGUAGES;
