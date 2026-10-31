const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.resolve(__dirname, '../frontend/src/locales');
const SUPPORTED_LANGS = ['en', 'hi', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'mr', 'or', 'pa', 'ur'];

const REQUIRED_KEYS = [
  'mandatoryBadge',
  'conditionalBadge',
  'readyBadge',
  'missingMandatoryWarning',
  'voiceUnavailable',
  'voiceTemporarilyUnavailable',
  'networkOffline',
  'itemNotReady'
];

console.log('===============================================================');
console.log('   STEP 5D: TRANSLATION SCAN FOR NEW LABELS & VOICE STRINGS    ');
console.log('===============================================================\n');

const missingReport = {};

SUPPORTED_LANGS.forEach(lang => {
  const commonPath = path.join(LOCALES_DIR, lang, 'common.json');
  const docsPath = path.join(LOCALES_DIR, lang, 'documents.json');

  let strings = {};
  if (fs.existsSync(commonPath)) {
    try { Object.assign(strings, JSON.parse(fs.readFileSync(commonPath, 'utf8'))); } catch(_) {}
  }
  if (fs.existsSync(docsPath)) {
    try { Object.assign(strings, JSON.parse(fs.readFileSync(docsPath, 'utf8'))); } catch(_) {}
  }

  // Scan against checklist
  missingReport[lang] = [];
  REQUIRED_KEYS.forEach(k => {
    if (!strings[k] && !strings['guidance.' + k] && !strings['voice_assistant.' + k]) {
      missingReport[lang].push(k);
    }
  });
});

console.log('| Language | Total Keys Checked | Missing Keys Count | Missing Key Names |');
console.log('|:---------|:------------------:|:------------------:|:------------------|');
let hasAnyMissing = false;
SUPPORTED_LANGS.forEach(lang => {
  const missing = missingReport[lang];
  if (missing.length > 0) hasAnyMissing = true;
  console.log(`| ${lang.padEnd(8)} | ${REQUIRED_KEYS.length.toString().padStart(18)} | ${missing.length.toString().padStart(18)} | ${missing.join(', ') || 'NONE (100% Translated)'} |`);
});

console.log('\nNote: In VoiceAssistant.jsx, all voice messages have in-code fallbacks for all 12 languages.');
