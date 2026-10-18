/**
 * Curated Scheme Refresh Script
 *
 * Enforces human-in-the-loop governance for official NSFDC scheme updates.
 * Compares current stored records against verified updates, prints a visual field-by-field diff,
 * runs the security allow-list validator on applyUrl, and requires explicit confirmation (--commit)
 * before persisting changes to seed and fallback data.
 *
 * Usage:
 *   node scripts/refresh-schemes.js                       # Displays current records & verification status
 *   node scripts/refresh-schemes.js --diff updates.json   # Compares updates against stored records
 *   node scripts/refresh-schemes.js --commit updates.json # Applies verified diff after human review
 */

const fs = require('fs');
const path = require('path');
const { isValidGovernmentUrl } = require('../backend/src/utils/urlValidator');

const seedPath = path.resolve(__dirname, '../backend/src/data/seedSchemes.json');
const fallbackPath = path.resolve(__dirname, '../frontend/src/data/fallbackSchemes.json');

const currentSchemes = JSON.parse(fs.readFileSync(seedPath, 'utf8').replace(/^\uFEFF/, ''));

function printSchemeSummary() {
  console.log('===============================================================');
  console.log('       SchemeBridge Official Scheme Provenance Audit           ');
  console.log('===============================================================\n');

  currentSchemes.forEach((s, idx) => {
    console.log(`[${idx + 1}] ${s.schemeName || s.name}`);
    console.log(`    Interest Rate:       ${s.interestRate}% p.a.`);
    console.log(`    Max Loan:            ₹${(s.maxLoanAmount || 0).toLocaleString('en-IN')}`);
    console.log(`    Moratorium:          ${s.moratoriumMonths || 0} months`);
    console.log(`    Apply Mode:          ${s.applyMode}`);
    console.log(`    Official Portal:     ${s.applyPortalName || 'N/A (Offline/Branch)'}`);
    console.log(`    Apply URL:           ${s.applyUrl || 'None (Branch Route)'}`);
    console.log(`    Official Source:     ${s.sourceUrl}`);
    console.log(`    Last Verified:       ${s.applyUrlVerified || s.lastVerified || 'Not set'}`);
    console.log('');
  });

  console.log('To review proposed updates from the official NSFDC gazette/portal:');
  console.log('  node scripts/refresh-schemes.js --diff <path-to-updates.json>');
  console.log('To apply verified changes after human review:');
  console.log('  node scripts/refresh-schemes.js --commit <path-to-updates.json>\n');
}

function computeDiff(currentList, updatedList) {
  const diffs = [];

  for (const updated of updatedList) {
    const sName = updated.schemeName || updated.name;
    const existing = currentList.find(s => (s.schemeName || s.name) === sName);

    if (!existing) {
      diffs.push({ type: 'NEW_SCHEME', name: sName, changes: updated });
      continue;
    }

    const fieldChanges = {};
    for (const [key, newVal] of Object.entries(updated)) {
      const oldVal = existing[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        fieldChanges[key] = { oldVal, newVal };
      }
    }

    if (Object.keys(fieldChanges).length > 0) {
      diffs.push({ type: 'MODIFIED', name: sName, fieldChanges });
    }
  }

  return diffs;
}

function run() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printSchemeSummary();
    process.exit(0);
  }

  const isCommit = args.includes('--commit');
  const isDiff = args.includes('--diff');
  const filePath = args.find(a => !a.startsWith('--'));

  if (!filePath || (!isCommit && !isDiff)) {
    console.error('Invalid arguments. Use --diff <file.json> or --commit <file.json>');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Update file not found: ${filePath}`);
    process.exit(1);
  }

  const proposedUpdates = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
  if (!Array.isArray(proposedUpdates)) {
    console.error('Update file must contain an array of scheme objects.');
    process.exit(1);
  }

  // Security Validation Check
  for (const p of proposedUpdates) {
    if (p.applyUrl && !isValidGovernmentUrl(p.applyUrl)) {
      console.error(`\x1b[31m[SECURITY REJECTION] Scheme '${p.schemeName || p.name}' has non-government applyUrl: ${p.applyUrl}\x1b[0m`);
      console.error('Only HTTPS URLs ending in .gov.in or .nic.in are permitted.');
      process.exit(1);
    }
  }

  const diffs = computeDiff(currentSchemes, proposedUpdates);

  if (diffs.length === 0) {
    console.log('No differences detected. Stored records are identical to proposed data.');
    process.exit(0);
  }

  console.log('===============================================================');
  console.log('                 PROPOSED SCHEME REVISION DIFF                 ');
  console.log('===============================================================\n');

  diffs.forEach(d => {
    if (d.type === 'NEW_SCHEME') {
      console.log(`\x1b[32m+ [NEW SCHEME] ${d.name}\x1b[0m`);
    } else {
      console.log(`\x1b[33m~ [UPDATE] ${d.name}\x1b[0m`);
      for (const [field, delta] of Object.entries(d.fieldChanges)) {
        console.log(`    ${field}:`);
        console.log(`      \x1b[31m- ${JSON.stringify(delta.oldVal)}\x1b[0m`);
        console.log(`      \x1b[32m+ ${JSON.stringify(delta.newVal)}\x1b[0m`);
      }
    }
    console.log('');
  });

  if (isCommit) {
    // Merge updates into current schemes
    const merged = currentSchemes.map(s => {
      const up = proposedUpdates.find(u => (u.schemeName || u.name) === (s.schemeName || s.name));
      return up ? { ...s, ...up, lastVerified: new Date().toISOString() } : s;
    });

    fs.writeFileSync(seedPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
    fs.writeFileSync(fallbackPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
    console.log('\x1b[32m[SUCCESS] Scheme revisions successfully persisted with provenance audit timestamp.\x1b[0m');
  } else {
    console.log('\x1b[36mDiff review complete. Run with --commit to apply verified changes.\x1b[0m');
  }
}

run();
