const fs = require('fs');
const path = require('path');
const https = require('https');

// Read key safely from backend/.env without ever printing it
const envContent = fs.readFileSync(path.resolve(__dirname, '../backend/.env'), 'utf8');
const match = envContent.match(/^\s*ELEVENLABS_API_KEY\s*=\s*(.*)?\s*$/m);
const apiKey = match ? match[1].trim() : '';

if (!apiKey) {
  console.error('ERROR: No ELEVENLABS_API_KEY found in backend/.env');
  process.exit(1);
}

const langs = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'mr', name: 'Marathi' },
  { code: 'ur', name: 'Urdu' },
  { code: 'te', name: 'Telugu' },
  { code: 'bn', name: 'Bengali' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'or', name: 'Odia' },
  { code: 'as', name: 'Assamese' }
];

const req = https.request({
  hostname: 'api.elevenlabs.io',
  path: '/v1/models',
  method: 'GET',
  headers: {
    'xi-api-key': apiKey
  }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error(`HTTP ${res.statusCode}: ${body}`);
      process.exit(1);
    }

    const models = JSON.parse(body);
    console.log('===============================================================');
    console.log('       PHASE 1.2: ELEVENLABS MODEL CAPABILITIES AUDIT          ');
    console.log('===============================================================\n');
    console.log('Total models returned by ElevenLabs API:', models.length);
    models.forEach(m => {
      console.log(`- Model ID: ${m.model_id.padEnd(28)} Name: ${m.name}`);
    });

    const v2Model = models.find(m => m.model_id === 'eleven_multilingual_v2');
    const v3Model = models.find(m => m.model_id === 'eleven_v3');
    const flashModel = models.find(m => m.model_id === 'eleven_flash_v2_5');

    console.log('\n--- Model Language Support Verification (true/false) ---');
    console.log('| Lang Code | Lang Name | eleven_multilingual_v2 | eleven_v3 (if exists) | eleven_flash_v2_5 |');
    console.log('| :--- | :--- | :---: | :---: | :---: |');

    const v2Langs = v2Model && v2Model.languages ? v2Model.languages.map(l => l.language_id.toLowerCase()) : [];
    const v3Langs = v3Model && v3Model.languages ? v3Model.languages.map(l => l.language_id.toLowerCase()) : [];
    const flashLangs = flashModel && flashModel.languages ? flashModel.languages.map(l => l.language_id.toLowerCase()) : [];

    for (const l of langs) {
      const inV2 = v2Langs.includes(l.code);
      const inV3 = v3Langs.includes(l.code);
      const inFlash = flashLangs.includes(l.code);
      console.log(`| ${l.code.padEnd(9)} | ${l.name.padEnd(9)} | ${String(inV2).padEnd(22)} | ${String(inV3).padEnd(21)} | ${String(inFlash).padEnd(17)} |`);
    }

    console.log('\nFull language list in eleven_multilingual_v2:');
    console.log(v2Langs.join(', '));

    if (v3Model) {
      console.log('\nFull language list in eleven_v3:');
      console.log(v3Langs.join(', '));
    } else {
      console.log('\nNOTE: eleven_v3 is NOT in /v1/models response for this API key/tier.');
    }
  });
});

req.on('error', e => {
  console.error('Request error:', e.message);
  process.exit(1);
});

req.end();
