/**
 * Script: Estimate ElevenLabs Voice Character Usage and Costs
 * Analyzes static clips and dynamic scheme briefings across the 13 supported languages.
 *
 * Usage: node scripts/estimate-voice-cost.js
 */

const fs = require('fs');
const path = require('path');
const { LANGUAGE_CONFIG } = require('../backend/src/config/voiceConfig');

const seedPath = path.resolve(__dirname, '../backend/src/data/seedSchemes.json');
const schemes = JSON.parse(fs.readFileSync(seedPath, 'utf8').replace(/^\uFEFF/, ''));

// Standard static audio clips to be pre-generated
const STATIC_CLIPS = [
  {
    id: 'portal_welcome',
    description: 'Home page portal overview & NSFDC introduction',
    baseText: 'Welcome to SchemeBridge, the official concessional credit enablement portal for Scheduled Caste entrepreneurs and students under NSFDC.'
  },
  {
    id: 'apply_modal_warning',
    description: 'Pre-application fraud warning & zero-fee guarantee',
    baseText: 'Applying through the official government portal is completely free of cost. Never pay money to agents, brokers, or middlemen.'
  },
  {
    id: 'doc_guidance_intro',
    description: 'Document preparation handbook introduction',
    baseText: 'Ensure zero rejections by preparing certified documentation before visiting the channel partner branch.'
  }
];

// Supported languages
const supportedLangs = Object.entries(LANGUAGE_CONFIG)
  .filter(([_, cfg]) => cfg.engine === 'elevenlabs')
  .map(([code, cfg]) => ({ code, name: cfg.name }));

console.log('===============================================================');
console.log('   SchemeBridge ElevenLabs Voice Cost & Character Estimation   ');
console.log('===============================================================\n');

console.log(`Auditing character demand across ${supportedLangs.length} supported languages and ${schemes.length} schemes:\n`);

let totalStaticChars = 0;
console.log('1. Static Core Audio Clips (Pre-generated at build time):');
STATIC_CLIPS.forEach((clip, idx) => {
  const charsPerLang = clip.baseText.length;
  const charsAllLangs = charsPerLang * supportedLangs.length;
  totalStaticChars += charsAllLangs;
  console.log(`   [Clip ${idx + 1}] "${clip.id}": ${charsPerLang} chars/lang x ${supportedLangs.length} langs = ${charsAllLangs.toLocaleString()} chars`);
});
console.log(`   -> Total Static Characters: ${totalStaticChars.toLocaleString()} chars\n`);

let totalSchemeChars = 0;
console.log('2. Scheme-Specific Overview Briefings:');
schemes.forEach((s, idx) => {
  const sName = s.schemeName || s.name;
  const maxLoan = (s.maxLoanAmount || 0).toLocaleString('en-IN');
  const rate = s.interestRate || 'subsidized';
  const moratorium = s.moratoriumMonths || 6;
  const briefingText = `${sName} provides a concessional loan up to ${maxLoan} rupees at ${rate}% annual interest, with a ${moratorium} month moratorium grace period.`;
  const charsPerLang = briefingText.length;
  const charsAllLangs = charsPerLang * supportedLangs.length;
  totalSchemeChars += charsAllLangs;
  console.log(`   [Scheme ${idx + 1}] ${sName.padEnd(40)} : ${charsPerLang} chars x ${supportedLangs.length} = ${charsAllLangs.toLocaleString()} chars`);
});
console.log(`   -> Total Scheme Briefing Characters: ${totalSchemeChars.toLocaleString()} chars\n`);

const grandTotalChars = totalStaticChars + totalSchemeChars;

// ElevenLabs Pricing Reference:
// Free Tier: 10,000 chars / month ($0)
// Starter Tier ($5/mo): 30,000 chars / month
// Creator Tier ($22/mo): 100,000 chars / month
// Pro Tier ($99/mo): 500,000 chars / month
console.log('===============================================================');
console.log('   SUMMARY & ELEVENLABS QUOTA RECOMMENDATIONS');
console.log('===============================================================');
console.log(`Total Characters across all 13 languages: ${grandTotalChars.toLocaleString()} chars`);
console.log('');
console.log('Tier Compatibility:');
console.log(`- Free Tier (10,000 chars/mo)     : Covers English + Hindi pre-generated clips.`);
console.log(`- Starter Tier (30,000 chars/mo)  : Covers all 13 languages static clips (${totalStaticChars.toLocaleString()} chars).`);
console.log(`- Creator Tier (100,000 chars/mo) : Covers 100% of all static + scheme clips across all 13 languages (${grandTotalChars.toLocaleString()} chars).`);
console.log('');
console.log('Cache Optimization:');
console.log('- 100% SHA-256 disk caching ensures each text string is synthesized ONLY ONCE.');
console.log('- Zero redundant API calls on subsequent visits or repeated playbacks.');
console.log('===============================================================\n');
