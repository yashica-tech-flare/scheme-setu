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
