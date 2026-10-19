const fs = require('fs');
const path = require('path');

const manifestPath = path.resolve(__dirname, '../frontend/public/audio/audio-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const brokenLangs = {
  te: { name: 'Telugu', range: [0x0C00, 0x0C7F] },
  bn: { name: 'Bengali', range: [0x0980, 0x09FF] },
  gu: { name: 'Gujarati', range: [0x0A80, 0x0AFF] },
  kn: { name: 'Kannada', range: [0x0C80, 0x0CFF] },
  ml: { name: 'Malayalam', range: [0x0D00, 0x0D7F] },
  pa: { name: 'Punjabi', range: [0x0A00, 0x0A7F] },
  or: { name: 'Odia', range: [0x0B00, 0x0B7F] },
  as: { name: 'Assamese', range: [0x0980, 0x09FF], specificChars: [0x09F0, 0x09F1] }
};

const devanagariRange = [0x0900, 0x097F];
const asciiLatinRange = [0x0041, 0x007A]; // Basic Latin letters

console.log('===============================================================');
console.log('       PHASE 1.1: SCRIPT PURITY AUDIT (8 BROKEN LANGUAGES)     ');
console.log('===============================================================\n');

let totalSentencesChecked = 0;
let failingSentencesCount = 0;

for (const [code, info] of Object.entries(brokenLangs)) {
  console.log(`--- [${code.toUpperCase()}] ${info.name} ---`);
  
  for (const [clipId, langMap] of Object.entries(manifest.clips)) {
    const entry = langMap[code];
    if (!entry || !entry.text) {
      console.log(`  ${clipId}: EMPTY or MISSING`);
      failingSentencesCount++;
      continue;
    }
    
    totalSentencesChecked++;
    const text = entry.text.trim();
    let letterCount = 0;
    let targetScriptLetters = 0;
    let devanagariLetters = 0;
    let latinLetters = 0;
    let assameseSpecificCount = 0;

    for (const char of text) {
      const codePoint = char.codePointAt(0);
      // Ignore spaces, common punctuation, digits, symbols
      if (/[\s\d\p{P}\p{S}]/u.test(char)) continue;

      letterCount++;
      if (codePoint >= info.range[0] && codePoint <= info.range[1]) {
        targetScriptLetters++;
      }
      if (codePoint >= devanagariRange[0] && codePoint <= devanagariRange[1]) {
        devanagariLetters++;
      }
      if ((codePoint >= 0x0041 && codePoint <= 0x005A) || (codePoint >= 0x0061 && codePoint <= 0x007A)) {
        latinLetters++;
      }
      if (info.specificChars && info.specificChars.includes(codePoint)) {
        assameseSpecificCount++;
      }
    }

    const targetPct = letterCount > 0 ? ((targetScriptLetters / letterCount) * 100).toFixed(1) : 0;
    const isPass = targetPct >= 90.0;

    if (!isPass) failingSentencesCount++;

    let note = '';
    if (code === 'as') {
      note = ` (Assamese specific chars ৰ/ৱ: ${assameseSpecificCount})`;
    }
    if (devanagariLetters > 0) {
      note += ` [WARN: Devanagari chars found: ${devanagariLetters}]`;
    }
    if (latinLetters > 0) {
      note += ` [WARN: Latin chars found: ${latinLetters}]`;
    }

    console.log(`  ${clipId.padEnd(20)}: ${targetPct}% in ${info.name} block (${targetScriptLetters}/${letterCount} letters) -> ${isPass ? 'PASS' : 'FAIL'}${note}`);
  }
  console.log('');
}

console.log(`Total sentences checked: ${totalSentencesChecked}`);
console.log(`Sentences below 90% target script: ${failingSentencesCount}`);
console.log('Script check result:', failingSentencesCount === 0 ? 'ALL PASS (C2 text bug is FALSE for script block purity)' : 'FAILURES DETECTED (C2 confirmed)');
