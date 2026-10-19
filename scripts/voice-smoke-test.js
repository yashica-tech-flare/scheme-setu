/**
 * SchemeBridge — Live Voice Smoke Test Suite
 * 
 * Verifies live audio playback across:
 * 1. Pre-generated static clips on FRONTEND_URL for all 13 supported languages.
 * 2. Dynamic runtime ElevenLabs proxy on BACKEND_URL for all 13 supported languages.
 * 3. Diagnostic check on GET /api/voice/status (keyConfigured: true).
 * 4. Error safety check on 8 unsupported languages (clean JSON error, no crash/audio).
 * 
 * Usage:
 *   node scripts/voice-smoke-test.js <BACKEND_URL> <FRONTEND_URL>
 * 
 * Example:
 *   node scripts/voice-smoke-test.js https://scheme-setu-wccq.onrender.com https://scheme-setu-beryl.vercel.app
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const backendUrlArg = process.argv[2] || process.env.BACKEND_URL || 'https://scheme-setu-wccq.onrender.com';
const frontendUrlArg = process.argv[3] || process.env.FRONTEND_URL || 'https://scheme-setu-beryl.vercel.app';

const BACKEND_URL = backendUrlArg.replace(/\/+$/, '');
const FRONTEND_URL = frontendUrlArg.replace(/\/+$/, '');

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', text: 'Welcome to SchemeBridge concessional portal.' },
  { code: 'hi', name: 'Hindi', text: 'योजना सेतु में आपका स्वागत है।' },
  { code: 'ta', name: 'Tamil', text: 'திட்டம் சேதுவுக்கு உங்களை வரவேற்கிறோம்.' },
  { code: 'te', name: 'Telugu', text: 'స్కీమ్ సేతుకు స్వాగతం.' },
  { code: 'bn', name: 'Bengali', text: 'স্কিম সেতুতে আপনাকে স্বাগতম।' },
  { code: 'mr', name: 'Marathi', text: 'योजना सेतूमध्ये आपले स्वागत आहे.' },
  { code: 'ur', name: 'Urdu', text: 'اسکیم سیتو میں خوش آمدید۔' },
  { code: 'gu', name: 'Gujarati', text: 'સ્કીમ સેતુમાં આપનું સ્વાગત છે.' },
  { code: 'kn', name: 'Kannada', text: 'ಸ್ಕೀಮ್ ಸೇತುಗೆ ಸುಸ್ವಾಗತ.' },
  { code: 'ml', name: 'Malayalam', text: 'സ്കീം സേതുവിലേക്ക് സ്വാഗതം.' },
  { code: 'pa', name: 'Punjabi', text: 'ਸਕੀਮ ਸੇਤੂ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ।' },
  { code: 'or', name: 'Odia', text: 'ସ୍କିମ୍ ସେତୁକୁ ସ୍ୱାଗତ।' },
  { code: 'as', name: 'Assamese', text: 'স্কিম সেতুলৈ স্বাগতম।' }
];

const UNSUPPORTED_LANGUAGES = [
  { code: 'sa', name: 'Sanskrit' },
  { code: 'ks', name: 'Kashmiri' },
  { code: 'kok', name: 'Konkani' },
  { code: 'brx', name: 'Bodo' },
  { code: 'sat', name: 'Santali' },
  { code: 'mai', name: 'Maithili' },
  { code: 'doi', name: 'Dogri' },
  { code: 'mni', name: 'Manipuri' }
];

function isValidMp3Header(buf) {
  if (!buf || buf.length < 4) return false;
  const hasId3 = buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33;
  const hasSync = buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;
  return hasId3 || hasSync;
}

function makeRequest(targetUrl, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve) => {
    try {
      const u = new URL(targetUrl);
      const isHttps = u.protocol === 'https:';
      const lib = isHttps ? https : http;

      const defaultHeaders = {
        'User-Agent': 'SchemeBridge-VoiceSmokeTest/1.0',
        ...headers
      };

      if (data) {
        defaultHeaders['Content-Length'] = Buffer.byteLength(data);
      }

      const req = lib.request({
        hostname: u.hostname,
        port: u.port || (isHttps ? 443 : 80),
        path: u.pathname + u.search,
        method,
        headers: defaultHeaders,
        timeout: 30000
      }, (res) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks)
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ error: 'Request timed out after 30s' });
      });

      req.on('error', (e) => resolve({ error: e.message }));

      if (data) req.write(data);
      req.end();
    } catch (e) {
      resolve({ error: e.message });
    }
  });
}

async function runSmokeTest() {
  console.log('===============================================================');
  console.log('       SchemeBridge Live Audio & Voice Smoke Test Suite        ');
  console.log('===============================================================');
  console.log(`Backend URL : ${BACKEND_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}\n`);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  // 1. Diagnostic Status Test
  totalTests++;
  process.stdout.write('1. Testing GET /api/voice/status... ');
  const statusRes = await makeRequest(`${BACKEND_URL}/api/voice/status`);
  if (!statusRes.error && statusRes.statusCode === 200) {
    try {
      const json = JSON.parse(statusRes.body.toString());
      if (json.keyConfigured === true || json.enabled === true) {
        console.log(`\x1b[32mPASS\x1b[0m (keyConfigured: true, supported: ${json.supportedCount})`);
        passedTests++;
      } else {
        console.log(`\x1b[31mFAIL\x1b[0m (keyConfigured is not true)`);
        failedTests++;
      }
    } catch (e) {
      console.log(`\x1b[31mFAIL\x1b[0m (invalid JSON: ${e.message})`);
      failedTests++;
    }
  } else {
    console.log(`\x1b[31mFAIL\x1b[0m (${statusRes.error || `HTTP ${statusRes.statusCode}`})`);
    failedTests++;
  }

  // 2. Static Clips on Frontend (13 Languages)
  console.log('\n2. Testing Static Frontend Audio Clips (/audio/<lang>/portal_welcome.mp3):');
  console.log('Lang | Status | Size (KB) | MP3 Header | Result');
  console.log('-----|--------|-----------|------------|-------');

  for (const item of SUPPORTED_LANGUAGES) {
    totalTests++;
    const clipUrl = `${FRONTEND_URL}/audio/${item.code}/portal_welcome.mp3`;
    const res = await makeRequest(clipUrl);

    if (res.error) {
      console.log(`${item.code.padEnd(4)} | ERR    | 0.0 KB    | FAIL       | \x1b[31mFAIL (${res.error})\x1b[0m`);
      failedTests++;
      continue;
    }

    const size = res.body.length;
    const sizeKb = (size / 1024).toFixed(1);
    const hasHeader = isValidMp3Header(res.body);
    const contentType = res.headers['content-type'] || '';
    const isAudio = contentType.includes('audio') || hasHeader;
    const isAbove2Kb = size >= 2048;

    if (res.statusCode === 200 && isAbove2Kb && isAudio && hasHeader) {
      console.log(`${item.code.padEnd(4)} | 200    | ${sizeKb.padStart(7)} KB | VALID      | \x1b[32mPASS\x1b[0m`);
      passedTests++;
    } else {
      console.log(`${item.code.padEnd(4)} | ${String(res.statusCode).padEnd(6)} | ${sizeKb.padStart(7)} KB | ${hasHeader ? 'VALID' : 'INVALID'}    | \x1b[31mFAIL (stub or non-audio)\x1b[0m`);
      failedTests++;
    }
  }

  // 3. Dynamic Backend Synthesis Proxy (13 Languages)
  console.log('\n3. Testing Dynamic Backend Voice Proxy (POST /api/voice/speak):');
  console.log('Lang | Status | Size (KB) | MP3 Header | Result');
  console.log('-----|--------|-----------|------------|-------');

  for (const item of SUPPORTED_LANGUAGES) {
    totalTests++;
    const payload = JSON.stringify({ text: item.text, languageCode: item.code });
    const res = await makeRequest(`${BACKEND_URL}/api/voice/speak`, 'POST', payload, {
      'Content-Type': 'application/json'
    });

    if (res.error) {
      console.log(`${item.code.padEnd(4)} | ERR    | 0.0 KB    | FAIL       | \x1b[31mFAIL (${res.error})\x1b[0m`);
      failedTests++;
      continue;
    }

    const size = res.body.length;
    const sizeKb = (size / 1024).toFixed(1);
    const hasHeader = isValidMp3Header(res.body);
    const contentType = res.headers['content-type'] || '';
    const isAudio = contentType.includes('audio');
    const isAbove2Kb = size >= 2048;

    if (res.statusCode === 200 && isAbove2Kb && isAudio && hasHeader) {
      console.log(`${item.code.padEnd(4)} | 200    | ${sizeKb.padStart(7)} KB | VALID      | \x1b[32mPASS\x1b[0m`);
      passedTests++;
    } else {
      let errDetail = '';
      try {
        const j = JSON.parse(res.body.toString());
        errDetail = j.code || j.error || j.message || '';
      } catch (_) {}
      console.log(`${item.code.padEnd(4)} | ${String(res.statusCode).padEnd(6)} | ${sizeKb.padStart(7)} KB | ${hasHeader ? 'VALID' : 'INVALID'}    | \x1b[31mFAIL (${errDetail})\x1b[0m`);
      failedTests++;
    }
  }

  // 4. Unsupported Languages Safety Check (8 Languages)
  console.log('\n4. Testing Unsupported Languages Safety (Expecting clean 400 error):');
  console.log('Lang | Name      | Status | Error Code          | Result');
  console.log('-----|-----------|--------|---------------------|-------');

  for (const item of UNSUPPORTED_LANGUAGES) {
    totalTests++;
    const payload = JSON.stringify({ text: 'Test phrase', languageCode: item.code });
    const res = await makeRequest(`${BACKEND_URL}/api/voice/speak`, 'POST', payload, {
      'Content-Type': 'application/json'
    });

    let codeFound = 'none';
    try {
      const json = JSON.parse(res.body.toString());
      codeFound = json.code || json.error || 'json';
    } catch (_) {}

    if (res.statusCode === 400 && codeFound !== 'none') {
      console.log(`${item.code.padEnd(4)} | ${item.name.padEnd(9)} | 400    | ${codeFound.padEnd(19)} | \x1b[32mPASS\x1b[0m`);
      passedTests++;
    } else {
      console.log(`${item.code.padEnd(4)} | ${item.name.padEnd(9)} | ${String(res.statusCode).padEnd(6)} | ${codeFound.padEnd(19)} | \x1b[31mFAIL\x1b[0m`);
      failedTests++;
    }
  }

  console.log('\n===============================================================');
  console.log(`Smoke Test Summary: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    console.error('\x1b[31mSmoke test encountered failures.\x1b[0m');
    process.exit(1);
  } else {
    console.log('\x1b[32mAll smoke tests passed with flying colors!\x1b[0m');
    process.exit(0);
  }
}

if (require.main === module) {
  runSmokeTest();
}

module.exports = { runSmokeTest };
