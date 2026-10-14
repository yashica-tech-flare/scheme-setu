/**
 * SchemeBridge — Comprehensive 22 Scheduled Languages + English Manifest Configuration
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

  // RTL VALIDATION LANGUAGE
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    scriptFamily: 'Perso-Arabic',
    rtl: true,
    fontFamily: "'Noto Nastaliq Urdu', serif",
    status: 'complete',
    phase: 'All-India',
    region: 'Pan-India (Northern & Deccan)'
  },

  // Western & Southern Scheduled Languages
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    scriptFamily: 'Gujarati',
    rtl: false,
    fontFamily: "'Noto Sans Gujarati', sans-serif",
    status: 'complete',
    phase: 'All-India',
    region: 'Gujarat (GSCDC)'
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    scriptFamily: 'Kannada',
    rtl: false,
    fontFamily: "'Noto Sans Kannada', sans-serif",
    status: 'complete',
    phase: 'All-India',
    region: 'Karnataka (KSDC)'
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    scriptFamily: 'Malayalam',
    rtl: false,
    fontFamily: "'Noto Sans Malayalam', sans-serif",
    status: 'complete',
    phase: 'All-India',
    region: 'Kerala (KSCDC)'
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    scriptFamily: 'Gurmukhi',
    rtl: false,
    fontFamily: "'Noto Sans Gurmukhi', sans-serif",
    status: 'complete',
    phase: 'All-India',
    region: 'Punjab (PSCFC) & Haryana'
  },

  // Eastern & Central Scheduled Languages
  {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    scriptFamily: 'Odia',
    rtl: false,
    fontFamily: "'Noto Sans Oriya', sans-serif",
    status: 'complete',
    phase: 'All-India',
    region: 'Odisha (OSFDC)'
  },
  {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    scriptFamily: 'Bengali-Assamese',
    rtl: false,
    fontFamily: "'Noto Sans Bengali', sans-serif",
    status: 'complete',
    phase: 'All-India',
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
    phase: 'All-India',
    region: 'National Classical Heritage'
  },
  {
    code: 'kok',
    name: 'Konkani',
    nativeName: 'कोंकणी',
    scriptFamily: 'Devanagari',
    rtl: false,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
    status: 'planned',
    phase: 'All-India',
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
    phase: 'All-India',
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
    phase: 'All-India',
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
    phase: 'All-India',
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
    phase: 'All-India',
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
    phase: 'All-India',
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
    phase: 'All-India',
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
    phase: 'All-India',
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
    phase: 'All-India',
    region: 'Bihar & Mithila'
  },

  // MAJOR REGIONAL & MOTHER TONGUE SPOKEN LANGUAGES (Grassroots Beneficiaries)
  {
    code: 'bho',
    name: 'Bhojpuri',
    nativeName: 'भोजपुरी',
    scriptFamily: 'Devanagari',
    rtl: false,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
    status: 'planned',
    phase: 'Grassroots Spoken',
    region: 'Eastern UP, Bihar & Jharkhand (50M+ speakers)'
  },
  {
    code: 'raj',
    name: 'Rajasthani',
    nativeName: 'राजस्थानी',
    scriptFamily: 'Devanagari',
    rtl: false,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
    status: 'planned',
    phase: 'Grassroots Spoken',
    region: 'Rajasthan & Western MP (30M+ speakers)'
  },
  {
    code: 'hne',
    name: 'Chhattisgarhi',
    nativeName: 'छत्तीसगढ़ी',
    scriptFamily: 'Devanagari',
    rtl: false,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
    status: 'planned',
    phase: 'Grassroots Spoken',
    region: 'Chhattisgarh (18M+ speakers)'
  },
  {
    code: 'bgc',
    name: 'Haryanvi',
    nativeName: 'हरियाणवी',
    scriptFamily: 'Devanagari',
    rtl: false,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
    status: 'planned',
    phase: 'Grassroots Spoken',
    region: 'Haryana & Delhi NCR (10M+ speakers)'
  },
  {
    code: 'mag',
    name: 'Magahi',
    nativeName: 'मगही',
    scriptFamily: 'Devanagari',
    rtl: false,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
    status: 'planned',
    phase: 'Grassroots Spoken',
    region: 'Central Bihar & Magadh (13M+ speakers)'
  },
  {
    code: 'tcy',
    name: 'Tulu',
    nativeName: 'ತುಳು',
    scriptFamily: 'Kannada',
    rtl: false,
    fontFamily: "'Noto Sans Kannada', sans-serif",
    status: 'planned',
    phase: 'Grassroots Spoken',
    region: 'Coastal Karnataka & Kasaragod (2M+ speakers)'
  },
  {
    code: 'lus',
    name: 'Mizo',
    nativeName: 'Mizo ṭawng',
    scriptFamily: 'Latin',
    rtl: false,
    fontFamily: 'Inter, sans-serif',
    status: 'planned',
    phase: 'Grassroots Spoken',
    region: 'Mizoram & North-East (1M+ speakers)'
  },
  {
    code: 'kha',
    name: 'Khasi',
    nativeName: 'Ka Ktien Khasi',
    scriptFamily: 'Latin',
    rtl: false,
    fontFamily: 'Inter, sans-serif',
    status: 'planned',
    phase: 'Grassroots Spoken',
    region: 'Meghalaya (1.5M+ speakers)'
  },
  {
    code: 'gon',
    name: 'Gondi',
    nativeName: 'गोंडी',
    scriptFamily: 'Devanagari',
    rtl: false,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
    status: 'planned',
    phase: 'Grassroots Spoken',
    region: 'Central India Tribal Belts (3M+ speakers)'
  }
];

/**
 * Filtered list of languages active in the UI switcher.
 * All 22 Constitutional Languages + English + 9 Grassroots Regional Mother Tongues (32 total).
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
