/**
 * SchemeBridge — Audio Clip Manifest & Integrity Verifier
 * 
 * Asserts:
 * 1. audio-manifest.json exists and is valid JSON.
 * 2. Every registered clip file exists on disk.
 * 3. Every clip file is >= 2048 bytes (2 KB) — never a 48-byte stub.
 * 4. Every clip has a valid MP3 header (ID3 tag or MPEG frame sync).
 * 5. SHA-256 hash matches the manifest record.
 * 6. Audio size is proportional to text length (never silent/truncated).
 * 
 * Usage: node scripts/verify-voice-clips.js
 * Exit code: 0 if all clips pass, 1 if any clip fails.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MANIFEST_PATH = path.resolve(__dirname, '../frontend/public/audio/audio-manifest.json');
const AUDIO_BASE_DIR = path.resolve(__dirname, '../frontend/public');

function isValidMp3Header(buf) {
  if (!buf || buf.length < 4) return false;
  // Check for ID3v2 tag (starts with 'ID3')
  const hasId3 = buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33;
  // Check for MPEG Frame Sync (11 bits set: 0xFF followed by 0xEx or 0xFx)
  const hasSync = buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;
  return hasId3 || hasSync;
}

function verifyClips() {
  console.log('===============================================================');
  console.log('       SchemeBridge Audio Clip Manifest Verification          ');
  console.log('===============================================================\n');

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`\x1b[31mFAIL: Manifest not found at ${MANIFEST_PATH}\x1b[0m`);
    process.exit(1);
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch (err) {
    console.error(`\x1b[31mFAIL: Invalid JSON in manifest: ${err.message}\x1b[0m`);
    process.exit(1);
  }

  if (!manifest.clips || typeof manifest.clips !== 'object' || Object.keys(manifest.clips).length === 0) {
    console.error('\x1b[31mFAIL: Manifest has no clips defined.\x1b[0m');
    process.exit(1);
  }

  let totalClips = 0;
  let passedClips = 0;
  let failedClips = 0;
  const errors = [];

  for (const [clipId, langMap] of Object.entries(manifest.clips)) {
    for (const [lang, entry] of Object.entries(langMap)) {
      totalClips++;
      const relativePath = entry.path.startsWith('/') ? entry.path.slice(1) : entry.path;
      const fullPath = path.join(AUDIO_BASE_DIR, relativePath);

      // 1. Check file existence
      if (!fs.existsSync(fullPath)) {
        errors.push(`[${lang}] ${clipId}: File does not exist at ${fullPath}`);
        failedClips++;
        continue;
      }

      const fileBuf = fs.readFileSync(fullPath);
      const actualSize = fileBuf.length;

      // 2. Minimum size check (must be >= 2 KB)
      if (actualSize < 2048) {
        errors.push(`[${lang}] ${clipId}: File size is ${actualSize} bytes (must be >= 2048 bytes; stub detected)`);
        failedClips++;
        continue;
      }

      // 3. Manifest size match
      if (entry.sizeBytes && entry.sizeBytes !== actualSize) {
        errors.push(`[${lang}] ${clipId}: Manifest sizeBytes (${entry.sizeBytes}) does not match disk size (${actualSize})`);
        failedClips++;
        continue;
      }

      // 4. MP3 header check
      if (!isValidMp3Header(fileBuf)) {
        errors.push(`[${lang}] ${clipId}: Invalid MP3 header (first bytes: ${fileBuf.slice(0, 4).toString('hex')})`);
        failedClips++;
        continue;
      }

      // 5. SHA-256 hash match (if present in manifest)
      if (entry.sha256) {
        const actualHash = crypto.createHash('sha256').update(fileBuf).digest('hex');
        if (entry.sha256 !== actualHash) {
          errors.push(`[${lang}] ${clipId}: SHA-256 mismatch (expected: ${entry.sha256.slice(0, 8)}, got: ${actualHash.slice(0, 8)})`);
          failedClips++;
          continue;
        }
      }

      // 6. Proportionality check
      if (entry.text) {
        const textLen = entry.text.length;
        const bytesPerChar = actualSize / Math.max(1, textLen);
        if (bytesPerChar < 25) {
          errors.push(`[${lang}] ${clipId}: Size (${actualSize} bytes) is suspiciously small for text length (${textLen} chars)`);
          failedClips++;
          continue;
        }
      }

      passedClips++;
    }
  }

  console.log(`Verified ${totalClips} clip entries across ${Object.keys(manifest.clips).length} clip groups.`);
  console.log(`Passed: \x1b[32m${passedClips}\x1b[0m`);
  console.log(`Failed: ${failedClips > 0 ? `\x1b[31m${failedClips}\x1b[0m` : '\x1b[32m0\x1b[0m'}\n`);

  if (failedClips > 0) {
    console.error('Errors encountered:');
    errors.forEach(e => console.error(`  - \x1b[31m${e}\x1b[0m`));
    console.error('\nVerification \x1b[31mFAILED\x1b[0m.');
    process.exit(1);
  }

  console.log('\x1b[32mSUCCESS: All audio clips passed integrity checks.\x1b[0m');
  console.log('===============================================================\n');
}

if (require.main === module) {
  verifyClips();
}

module.exports = { verifyClips, isValidMp3Header };
