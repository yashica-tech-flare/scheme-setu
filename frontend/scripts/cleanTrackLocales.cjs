const fs = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '../src/locales');
const langs = fs.readdirSync(localesDir).filter(f => fs.statSync(path.join(localesDir, f)).isDirectory());

let cleaned = 0;
for (const lang of langs) {
  const dir = path.join(localesDir, lang);

  // 1. common.json
  const commonPath = path.join(dir, 'common.json');
  if (fs.existsSync(commonPath)) {
    const json = JSON.parse(fs.readFileSync(commonPath, 'utf8'));
    let modified = false;
    if (json.nav && json.nav.track) {
      delete json.nav.track;
      modified = true;
    }
    if (json.voice_assistant && json.voice_assistant.track_summary) {
      delete json.voice_assistant.track_summary;
      modified = true;
    }
    if (json.track_summary) {
      delete json.track_summary;
      modified = true;
    }
    if (json.track) {
      delete json.track;
      modified = true;
    }
    if (modified) {
      fs.writeFileSync(commonPath, JSON.stringify(json, null, 2) + '\n', 'utf8');
      cleaned++;
    }
  }

  // 2. documents.json
  const docsPath = path.join(dir, 'documents.json');
  if (fs.existsSync(docsPath)) {
    const json = JSON.parse(fs.readFileSync(docsPath, 'utf8'));
    let modified = false;
    const targetKeys = ['activeTrackedInquiry', 'activeInquiryPrompt', 'trackApplicationLink', 'trackDesc', 'haveActiveRef'];
    const targetObj = json.guidance || json;
    for (const k of targetKeys) {
      if (targetObj[k] !== undefined) {
        delete targetObj[k];
        modified = true;
      }
      if (json[k] !== undefined) {
        delete json[k];
        modified = true;
      }
    }
    if (modified) {
      fs.writeFileSync(docsPath, JSON.stringify(json, null, 2) + '\n', 'utf8');
      cleaned++;
    }
  }

  // 3. eligibility-form.json
  const formPath = path.join(dir, 'eligibility-form.json');
  if (fs.existsSync(formPath)) {
    const json = JSON.parse(fs.readFileSync(formPath, 'utf8'));
    let modified = false;
    if (json.results && json.results.registerTrackBtn) {
      delete json.results.registerTrackBtn;
      modified = true;
    }
    if (json.registerTrackBtn) {
      delete json.registerTrackBtn;
      modified = true;
    }
    if (modified) {
      fs.writeFileSync(formPath, JSON.stringify(json, null, 2) + '\n', 'utf8');
      cleaned++;
    }
  }
}

// Also check root en.json and hi.json in locales/
for (const file of ['en.json', 'hi.json']) {
  const filePath = path.join(localesDir, file);
  if (fs.existsSync(filePath)) {
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let modified = false;
    if (json.nav && json.nav.track) { delete json.nav.track; modified = true; }
    if (json.track) { delete json.track; modified = true; }
    if (json.track_summary) { delete json.track_summary; modified = true; }
    if (json.voice_assistant && json.voice_assistant.track_summary) { delete json.voice_assistant.track_summary; modified = true; }
    if (json.guidance) {
      for (const k of ['activeTrackedInquiry', 'activeInquiryPrompt', 'trackApplicationLink', 'trackDesc', 'haveActiveRef']) {
        if (json.guidance[k] !== undefined) { delete json.guidance[k]; modified = true; }
      }
    }
    if (json.results && json.results.registerTrackBtn) { delete json.results.registerTrackBtn; modified = true; }
    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
      cleaned++;
    }
  }
}

console.log('Cleaned locale files count:', cleaned);

// Also clean any SETU- and track properties from scripts
const scriptsDir = path.resolve(__dirname);
for (const file of fs.readdirSync(scriptsDir)) {
  if (file.endsWith('.cjs') && file !== 'cleanTrackLocales.cjs') {
    const p = path.join(scriptsDir, file);
    let content = fs.readFileSync(p, 'utf8');
    let changed = false;
    if (content.includes('SETU-')) {
      content = content.replace(/SETU-[A-Za-z0-9_-]+/g, 'REF-DEMO');
      changed = true;
    }
    // Remove track property in nav
    if (/track:\s*['"][^'"]*['"],?/.test(content)) {
      content = content.replace(/track:\s*['"][^'"]*['"],?\s*/g, '');
      changed = true;
    }
    if (content.includes('clonedTrack.track')) {
      content = content.replace(/if\s*\(def\.track\)[\s\S]*?clonedTrack\.track\.docs\s*=\s*\{\s*\.\.\.clonedTrack\.track\.docs,\s*\.\.\.def\.track\.docs\s*\};\s*\}/g, '');
      changed = true;
    }
    if (changed) {
      fs.writeFileSync(p, content, 'utf8');
      console.log('Cleaned script:', file);
    }
  }
}

