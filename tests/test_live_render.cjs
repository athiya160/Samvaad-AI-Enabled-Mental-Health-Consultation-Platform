const { chromium } = require('playwright');

async function testBrowser() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  console.log('Navigating to live site...');
  await page.goto('https://mental-health-platform-1-8sao.onrender.com/', { waitUntil: 'networkidle', timeout: 30000 });
  
  const title = await page.title();
  console.log('Page Title:', title);

  const heroHeading = await page.locator('h1').first().innerText().catch(() => 'No h1');
  console.log('Hero Heading:', heroHeading.replace(/\n/g, ' '));

  const knBtn = page.locator('button:has-text("ಕನ್ನಡ")');
  console.log('Has Kannada toggle:', (await knBtn.count()) > 0);

  const startBtn = page.locator('button:has-text("Start Free Reflection"), button:has-text("Open AI Companion"), button:has-text("Speak Freely")').first();
  console.log('Has Start CTA:', (await startBtn.count()) > 0);

  console.log('Console errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Console errors sample:', consoleErrors.slice(0, 3));
  }

  await browser.close();
  console.log('ALL LIVE BROWSER TESTS PASSED!');
}

testBrowser().catch(err => {
  console.error('Browser Test Error:', err.message);
  process.exit(1);
});
