/**
 * verify-results-localization.js
 * Scans Results page content and localization helpers across all 12 languages
 * for any leftover English strings (ignoring brand names, statutory acronyms, and currency).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SCHEME_TRANSLATIONS,
  SCHEME_DESCRIPTIONS,
  localizeSchemeName,
  localizeSchemeDesc,
  localizeMatchReason,
  localizeDocumentName
} from '../frontend/src/utils/localizationHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ACTIVE_LANGUAGES = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'ur'];

// Allow-list for valid acronyms, brand names, and untranslated proper nouns
const ALLOWED_ENGLISH_WORDS = new Set([
  'schemebridge',
  'nsfdc',
  'msy',
  'mcf',
  'tls',
  'els',
  'gbs',
  'lvy',
  'may',
  'voctech',
  'el',
  'emi',
  'pm-suraj',
  'pmsuraj',
  'shg',
  'sca',
  'rrb',
  'nbfc-mfi',
  'nbfc',
  'ifsc',
  'dbt',
  'dpr',
  'sdm',
  'sc',
  'all',
  'gj',
  'dl',
  'od',
  'tn',
  'ka',
  'ts',
  'ap',
  'kl',
  'up',
  'mh',
  'wb',
  'rj',
  'mp',
  'br',
  'pb',
  'oct',
  '2026'
]);

function extractEnglishWords(text) {
  if (!text || typeof text !== 'string') return [];
  // Match Latin alphabet words of length >= 3
  const words = text.match(/[A-Za-z]{3,}/g) || [];
  return words.filter(w => !ALLOWED_ENGLISH_WORDS.has(w.toLowerCase()));
}

console.log('===============================================================');
console.log('       SCHEMEBRIDGE RESULTS PAGE LOCALIZATION AUDIT            ');
console.log('===============================================================\n');

const fallbackSchemes = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../frontend/src/data/fallbackSchemes.json'), 'utf8')
);

let totalErrors = 0;

ACTIVE_LANGUAGES.forEach(lang => {
  if (lang === 'en') {
    console.log(`[OK] en: English Baseline`);
    return;
  }

  const commonPath = path.join(__dirname, `../frontend/src/locales/${lang}/common.json`);
  if (!fs.existsSync(commonPath)) {
    console.error(`[FAIL] ${lang}: common.json missing`);
    totalErrors++;
    return;
  }

  const common = JSON.parse(fs.readFileSync(commonPath, 'utf8'));
  const res = common.results || {};

  // Check UI badges and controls
  const badgesToCheck = [
    res.badgeConcessional,
    res.badgeWomenOnly,
    res.category_micro,
    res.category_term,
    res.category_business,
    res.category_education,
    res.sourcePortal,
    res.verifySource,
    res.viewOfficialPortal
  ];

  let leftoverEnglish = [];
  badgesToCheck.forEach(b => {
    leftoverEnglish.push(...extractEnglishWords(b));
  });

  // Check each scheme rendered name & description
  fallbackSchemes.forEach(s => {
    const name = localizeSchemeName(s, lang);
    const desc = localizeSchemeDesc(s, lang);

    const nameLeftover = extractEnglishWords(name);
    const descLeftover = extractEnglishWords(desc);

    if (nameLeftover.length > 0) leftoverEnglish.push(...nameLeftover);
    if (descLeftover.length > 0) leftoverEnglish.push(...descLeftover);
  });

  const uniqueLeftovers = Array.from(new Set(leftoverEnglish));

  if (uniqueLeftovers.length === 0) {
    console.log(`[PASS] ${lang}: 0 unexpected English words found on Results elements.`);
  } else {
    console.warn(`[WARN] ${lang}: Found leftover English words:`, uniqueLeftovers);
    totalErrors += uniqueLeftovers.length;
  }
});

console.log('\n===============================================================');
if (totalErrors === 0) {
  console.log('RESULT: ALL 11 NON-ENGLISH LANGUAGES PASSED PURITY AUDIT (0 LEFTOVER WORDS)');
  process.exit(0);
} else {
  console.error(`RESULT: FAILED WITH ${totalErrors} LEFTOVER ENGLISH WORDS`);
  process.exit(1);
}
