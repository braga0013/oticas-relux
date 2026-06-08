const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Index — scrollar por todas as seções
  await page.goto('https://relux-pi.vercel.app/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const heights = [0, 800, 1600, 2400, 3200, 4000, 5000, 6000, 7000, 8000, 9000];
  for (const y of heights) {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `/tmp/r_idx_${y}.png` });
  }

  // Produto — todas as seções
  await page.goto('https://relux-pi.vercel.app/produto.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  for (const y of [0, 800, 1600]) {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `/tmp/r_prod_${y}.png` });
  }

  console.log('done');
  await browser.close();
})();
