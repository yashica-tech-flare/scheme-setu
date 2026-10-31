const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testNavbarVoiceOnRefresh() {
  console.log('Testing Navbar Voice Assistant Button on Page Load & Refresh...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  for (let i = 1; i <= 3; i++) {
    console.log(`\n--- Run ${i}: Loading http://localhost:4173/ ---`);
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });

    // Inspect the navbar Listen Aloud button
    const btnInfo = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('header button, nav button, button'));
      const voiceBtn = btns.find(b => b.textContent.includes('Listen') || b.getAttribute('aria-label')?.includes('Listen'));
      if (!voiceBtn) return { found: false };
      return {
        found: true,
        disabled: voiceBtn.disabled,
        text: voiceBtn.textContent.trim(),
        title: voiceBtn.title || '',
        ariaLabel: voiceBtn.getAttribute('aria-label') || '',
        classes: voiceBtn.className
      };
    });

    console.log('   Button Found:', btnInfo.found);
    console.log('   Button Disabled:', btnInfo.disabled);
    console.log('   Button Text:', btnInfo.text);
    console.log('   Button Title:', btnInfo.title);

    if (btnInfo.disabled) {
      console.error('FAIL: Voice Assistant button is disabled on page load/refresh!');
      await browser.close();
      process.exit(1);
    }

    if (btnInfo.text.includes('Voice for this item is not ready yet') || btnInfo.title.includes('not ready yet')) {
      console.error('FAIL: Button shows "Voice for this item is not ready yet" on initial load!');
      await browser.close();
      process.exit(1);
    }

    console.log(`   ✓ Run ${i} PASSED: Button is ACTIVE and ENABLED immediately upon load.`);
  }

  await browser.close();
  console.log('\nAll 3 refresh runs PASSED! Voice Assistant is enabled on start of the page.');
}

testNavbarVoiceOnRefresh().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
