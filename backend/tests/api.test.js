const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');

let server;
let baseUrl;

test.before(async () => {
  await connectDB();
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
});

test.after(async () => {
  await new Promise(resolve => server.close(resolve));
  await disconnectDB();
});

test('API Health check returns ok', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'ok');
});

test('POST /api/recommend matches eligible schemes correctly', async () => {
  const res = await fetch(`${baseUrl}/api/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      income: 250000,
      projectCost: 100000,
      projectType: 'micro_project',
      isEducation: false
    })
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data), 'Result should be an array of schemes');
  assert.ok(data.length > 0, 'Should match at least one scheme');

  // Verify matchScore presence
  const first = data[0];
  assert.ok(first.schemeName, 'Should have schemeName');
  assert.ok(first.interestRate, 'Should have interestRate');
  assert.ok(first.matchScore !== undefined, 'Should have matchScore');
});

test('POST /api/recommend rejects income > 500000', async () => {
  const res = await fetch(`${baseUrl}/api/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      income: 600000,
      projectCost: 100000,
      projectType: 'small_business',
      isEducation: false
    })
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.eligible, false);
  assert.strictEqual(data.schemes.length, 0);
});

test('POST /api/emi returns accurate calculations', async () => {
  const res = await fetch(`${baseUrl}/api/emi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      principal: 100000,
      annualRate: 6.5,
      tenureMonths: 36,
      moratoriumMonths: 3
    })
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.monthlyEMI > 0, 'Monthly EMI should be calculated');
  assert.ok(data.totalPayment > 100000, 'Total payment calculated');
  assert.ok(data.totalInterest > 0, 'Total interest calculated');
  assert.strictEqual(data.moratoriumMonths, 3);
  assert.strictEqual(data.effectiveTenure, 33);
});

test('GET /api/partners filters out high NPA and >90% fund utilization', async () => {
  const res = await fetch(`${baseUrl}/api/partners?lat=28.63&lng=77.22`);
  assert.strictEqual(res.status, 200);
  const partners = await res.json();

  assert.ok(partners.length > 0, 'Should return partners');

  // Verify that NO partner has npaStatus === 'high'
  const hasHighNpa = partners.some(p => p.npaStatus === 'high');
  assert.strictEqual(hasHighNpa, false, 'Partners with npaStatus=high must be filtered out');

  // Verify that NO partner has fundUtilizationPercent > 90
  const hasOverUtilized = partners.some(p => p.fundUtilizationPercent > 90);
  assert.strictEqual(hasOverUtilized, false, 'Partners with fundUtilizationPercent > 90 must be filtered out');

  // Verify sorted by distance ascending
  for (let i = 0; i < partners.length - 1; i++) {
    if (partners[i].distanceKm !== null && partners[i + 1].distanceKm !== null) {
      assert.ok(
        partners[i].distanceKm <= partners[i + 1].distanceKm,
        `Partners should be sorted by distance: ${partners[i].distanceKm} <= ${partners[i + 1].distanceKm}`
      );
    }
  }
});

test('Security Validator: isValidGovernmentUrl allow-lists only HTTPS .gov.in and .nic.in', () => {
  const { isValidGovernmentUrl, sanitizeSchemeApplyFields } = require('../src/utils/urlValidator');

  // Valid official domains
  assert.strictEqual(isValidGovernmentUrl('https://pmsuraj.dosje.gov.in'), true);
  assert.strictEqual(isValidGovernmentUrl('https://nsfdc.nic.in/apply'), true);
  assert.strictEqual(isValidGovernmentUrl('https://sub.portal.gov.in/register'), true);

  // Rejected invalid domains & protocols
  assert.strictEqual(isValidGovernmentUrl('http://pmsuraj.dosje.gov.in'), false, 'Non-HTTPS must be rejected');
  assert.strictEqual(isValidGovernmentUrl('https://pmsuraj.com'), false, 'Non-government domain must be rejected');
  assert.strictEqual(isValidGovernmentUrl('https://phishing-gov.in.fraud.com'), false, 'Phishing subdomain must be rejected');
  assert.strictEqual(isValidGovernmentUrl('javascript:alert(1)'), false, 'XSS/malicious protocol must be rejected');
  assert.strictEqual(isValidGovernmentUrl(''), false);
  assert.strictEqual(isValidGovernmentUrl(null), false);

  // Sanitation test
  const tamperedScheme = {
    schemeName: 'Malicious Test Scheme',
    applyMode: 'online',
    applyUrl: 'https://attacker-phishing.com/steal-creds'
  };
  const sanitized = sanitizeSchemeApplyFields(tamperedScheme);
  assert.strictEqual(sanitized.applyMode, 'offline', 'Invalid URL must force applyMode to offline');
  assert.strictEqual(sanitized.applyUrl, null, 'Invalid URL must be cleared to null');
});

test('GET /api/schemes returns schemes with sanitized apply fields and verified portals', async () => {
  const res = await fetch(`${baseUrl}/api/schemes`);
  assert.strictEqual(res.status, 200);
  const schemes = await res.json();
  assert.ok(Array.isArray(schemes) && schemes.length > 0);

  schemes.forEach(s => {
    assert.ok(['online', 'offline', 'both'].includes(s.applyMode), `Scheme ${s.schemeName} has valid applyMode`);
    if (s.applyUrl) {
      assert.ok(s.applyUrl.startsWith('https://'), `applyUrl must use HTTPS: ${s.applyUrl}`);
      assert.ok(s.applyUrl.includes('.gov.in') || s.applyUrl.includes('.nic.in'), `applyUrl must be gov: ${s.applyUrl}`);
      assert.ok(s.applyPortalName, `applyPortalName must be set for online scheme: ${s.schemeName}`);
    }
  });

  // Verify at least one scheme has offline route (e.g. Voctech)
  const hasOffline = schemes.some(s => s.applyMode === 'offline');
  assert.strictEqual(hasOffline, true, 'At least one scheme must demonstrate offline/branch application');
});

test('POST /api/analytics/apply-redirect logs anonymous metric with no PII', async () => {
  const res = await fetch(`${baseUrl}/api/analytics/apply-redirect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      schemeId: 'scheme_1',
      languageCode: 'hi'
    })
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
});

test('Data Consistency: seedSchemes.json and fallbackSchemes.json are 100% synchronized', () => {
  const fs = require('fs');
  const path = require('path');
  const { isValidGovernmentUrl } = require('../src/utils/urlValidator');

  const seedPath = path.resolve(__dirname, '../src/data/seedSchemes.json');
  const fallbackPath = path.resolve(__dirname, '../../frontend/src/data/fallbackSchemes.json');

  assert.ok(fs.existsSync(seedPath), 'seedSchemes.json exists');
  assert.ok(fs.existsSync(fallbackPath), 'fallbackSchemes.json exists');

  const seedSchemes = JSON.parse(fs.readFileSync(seedPath, 'utf8').replace(/^\uFEFF/, ''));
  const fallbackSchemes = JSON.parse(fs.readFileSync(fallbackPath, 'utf8').replace(/^\uFEFF/, ''));

  assert.strictEqual(seedSchemes.length, fallbackSchemes.length, 'Both schemes datasets must have identical lengths');

  seedSchemes.forEach((seed, idx) => {
    const sName = seed.schemeName || seed.name;
    const fallback = fallbackSchemes.find(f => (f.schemeName || f.name) === sName);
    assert.ok(fallback, `Scheme '${sName}' must exist in fallbackSchemes.json`);

    // Verify applyMode parity
    assert.strictEqual(seed.applyMode, fallback.applyMode, `applyMode must match for ${sName}`);
    assert.ok(['online', 'offline', 'both'].includes(seed.applyMode));

    // Verify applyUrl parity
    assert.strictEqual(seed.applyUrl, fallback.applyUrl, `applyUrl must match for ${sName}`);
    if (seed.applyUrl) {
      assert.strictEqual(isValidGovernmentUrl(seed.applyUrl), true, `applyUrl must pass gov validator for ${sName}`);
    }

    // Verify stateApplyLinks parity
    const seedStateLinks = seed.stateApplyLinks || [];
    const fallbackStateLinks = fallback.stateApplyLinks || [];
    assert.strictEqual(seedStateLinks.length, fallbackStateLinks.length, `stateApplyLinks count must match for ${sName}`);

    seedStateLinks.forEach((link, lIdx) => {
      const fbLink = fallbackStateLinks[lIdx];
      assert.strictEqual(link.state, fbLink.state, `state must match at index ${lIdx} for ${sName}`);
      assert.strictEqual(link.url, fbLink.url, `url must match at index ${lIdx} for ${sName}`);
      assert.strictEqual(isValidGovernmentUrl(link.url), true, `state portal url must pass gov validator: ${link.url}`);
    });
  });

  // Specifically verify Voctech is offline
  const voctech = seedSchemes.find(s => (s.schemeName || s.name).includes('Voctech'));
  assert.ok(voctech, 'Voctech scheme must exist');
  assert.strictEqual(voctech.applyMode, 'offline', 'Voctech must be strictly offline');
  assert.strictEqual(voctech.applyUrl, null, 'Voctech applyUrl must be null');
});

test('GET /api/voice/status returns voice service status and supported languages', async () => {
  const res = await fetch(`${baseUrl}/api/voice/status`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.provider, 'Should specify provider');
  assert.ok(Array.isArray(data.supportedLanguages), 'Should return supportedLanguages array');
  assert.ok(Array.isArray(data.disabledLanguages), 'Should return disabledLanguages array');
  assert.ok(data.supportedCount >= 13, 'Should support at least 13 languages');
  assert.ok(data.disabledCount >= 8, 'Should include 8 unsupported languages with engine none');
});

test('POST /api/voice/speak validates character length (<= 900 chars)', async () => {
  const longText = 'A'.repeat(950);
  const res = await fetch(`${baseUrl}/api/voice/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: longText,
      languageCode: 'en'
    })
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.error, 'text_too_long');
});

test('POST /api/voice/speak rejects unsupported language with engine: none', async () => {
  const res = await fetch(`${baseUrl}/api/voice/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Testing unsupported language rejection',
      languageCode: 'sa' // Sanskrit (engine: none)
    })
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.error, 'language_not_supported');
  assert.strictEqual(data.engine, 'none');
});

test('POST /api/voice/speak enforces zero PII (rejects Aadhaar pattern)', async () => {
  const res = await fetch(`${baseUrl}/api/voice/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Applicant Aadhaar number is 1234 5678 9012 for loan sanction.',
      languageCode: 'en'
    })
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.error, 'pii_detected');
});

test('POST /api/voice/speak gracefully degrades or serves cache', async () => {
  // Test valid scheme briefing text
  const res = await fetch(`${baseUrl}/api/voice/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Mahila Samriddhi Yojana provides concessional micro credit.',
      languageCode: 'en'
    })
  });

  // Either 503 (no api key in test environment) or 200 (if cached/synthesized)
  assert.ok([200, 503].includes(res.status), `Status should be 200 or 503, got ${res.status}`);
  if (res.status === 503) {
    const data = await res.json();
    assert.strictEqual(data.fallback, 'speechSynthesis');
  } else if (res.status === 200) {
    assert.strictEqual(res.headers.get('content-type'), 'audio/mpeg');
  }
});


