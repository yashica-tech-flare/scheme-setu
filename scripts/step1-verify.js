import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\yashi\\.gemini\\antigravity\\brain\\aa47fa2f-2ae3-4c9c-9396-51bb1a6cc635';

async function runStep1() {
  console.log('===============================================================');
  console.log('                    STEP 1 LIVE VERIFICATION                   ');
  console.log('===============================================================\n');

  // 1. Backend Status
  console.log('--- 1. Querying Live Render Backend Status ---');
  try {
    const res = await fetch('https://scheme-setu-wccq.onrender.com/api/voice/status');
    const data = await res.json();
    console.log('Live Backend commitHash:', data.commitHash);
    console.log('keyConfigured (ElevenLabs):', data.keyConfigured);
    console.log('sarvamConfigured:', data.sarvamConfigured);
  } catch (err) {
    console.error('Failed to query backend:', err.message);
  }

  // 2. Vercel Audio Manifest
  console.log('\n--- 2. Querying Live Vercel Audio Manifest ---');
  try {
    const rnd = Math.floor(Math.random() * 1000000);
    const res = await fetch(`https://scheme-setu-beryl.vercel.app/audio/audio-manifest.json?nocache=${rnd}`);
    const manifest = await res.json();
    console.log('Manifest version:', manifest.version);
    
    // Total clips count across all languages
    let totalClips = 0;
    const langCounts = {};
    const missingSchemes = [];
    const missingDocs = [];

    const expectedSchemes = ['scheme_lvy', 'scheme_gbs', 'scheme_els', 'scheme_voctech'];
    const expectedDocs = [
      'doc_caste', 'doc_income', 'doc_aadhaar', 'doc_bank_passbook', 'doc_dpr',
      'doc_quotation', 'doc_edu_admission', 'doc_fee_schedule', 'doc_transcripts',
      'doc_coborrower', 'doc_trade_license', 'doc_land_lease', 'doc_udyam',
      'doc_green_invoice', 'doc_transport_permit', 'doc_solar_site', 'doc_business_note',
      'doc_shg_photo', 'doc_voctech_admission', 'doc_voctech_toolkit'
    ];

    for (const [clipId, langMap] of Object.entries(manifest.clips || {})) {
      for (const [lang, entry] of Object.entries(langMap || {})) {
        totalClips++;
        langCounts[lang] = (langCounts[lang] || 0) + 1;
      }
    }

    console.log('Total individual clips registered in manifest:', totalClips);
    console.log('Clips per language:');
    console.table(langCounts);

    // Check scheme presence
    for (const s of expectedSchemes) {
      if (!manifest.clips[s]) missingSchemes.push(s);
    }
    console.log('New Scheme Summaries Present:', expectedSchemes.map(s => `${s}: ${manifest.clips[s] ? 'YES' : 'NO'}`).join(', '));

    // Check doc presence
    for (const d of expectedDocs) {
      if (!manifest.clips[d]) missingDocs.push(d);
    }
    console.log('All 20 Doc IDs in manifest?', missingDocs.length === 0 ? 'YES (All 20 present)' : `Missing: ${missingDocs.join(', ')}`);
  } catch (err) {
    console.error('Failed to query manifest:', err.message);
  }

  // 3. Browser Screenshots
  console.log('\n--- 3. Capturing Live Screenshots with Chrome ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // Live Guide Page
    console.log('Navigating to live Guide page: https://scheme-setu-beryl.vercel.app/guide');
    await page.goto('https://scheme-setu-beryl.vercel.app/guide', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    const guideScreenshot = path.join(ARTIFACTS_DIR, 'live-guide-page.png');
    await page.screenshot({ path: guideScreenshot, fullPage: true });
    console.log(`Saved Guide screenshot: ${guideScreenshot} (${fs.statSync(guideScreenshot).size} bytes)`);

    // Live Results Page (Submit standard profile to view Results)
    console.log('Navigating to live Home page and submitting profile for Results...');
    await page.goto('https://scheme-setu-beryl.vercel.app/#recommender', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Direct navigation to Results with query params
    await page.goto('https://scheme-setu-beryl.vercel.app/results?income=250000&cost=140000&type=small_business&edu=false&gender=female', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    await new Promise(r => setTimeout(r, 3000));
    const resultsScreenshot = path.join(ARTIFACTS_DIR, 'live-results-page.png');
    await page.screenshot({ path: resultsScreenshot, fullPage: true });
    console.log(`Saved Results screenshot: ${resultsScreenshot} (${fs.statSync(resultsScreenshot).size} bytes)`);
  } catch (err) {
    console.error('Screenshot error:', err.message);
  } finally {
    await browser.close();
  }
}

runStep1();

