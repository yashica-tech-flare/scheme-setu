const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const baseDir = path.resolve(__dirname, '../frontend/public/audio');
const frozenLangs = ['en', 'hi', 'ta', 'mr', 'ur'];

const baseline = {
  createdAt: new Date().toISOString(),
  frozenLanguages: frozenLangs,
  clips: {}
};

for (const lang of frozenLangs) {
  const langDir = path.join(baseDir, lang);
  if (!fs.existsSync(langDir)) {
    console.error('Missing directory for ' + lang);
    continue;
  }
  const files = fs.readdirSync(langDir).filter(f => f.endsWith('.mp3'));
  for (const file of files) {
    const filePath = path.join(langDir, file);
    const buf = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(buf).digest('hex');
    const key = lang + '/' + file;
    baseline.clips[key] = {
      path: '/audio/' + lang + '/' + file,
      sizeBytes: buf.length,
      sha256: hash
    };
  }
}

const outputPath = path.resolve(__dirname, 'voice-baseline.json');
fs.writeFileSync(outputPath, JSON.stringify(baseline, null, 2), 'utf8');
console.log('Saved baseline with ' + Object.keys(baseline.clips).length + ' clips to ' + outputPath);
