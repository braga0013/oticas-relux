const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await context.newPage();

  // Zoom em seções específicas problemáticas
  const shots = [
    { url: 'https://relux-pi.vercel.app/index.html',   scroll: 700,  name: 'hero_float_marquee' },
    { url: 'https://relux-pi.vercel.app/index.html',   scroll: 1500, name: 'bento_cards' },
    { url: 'https://relux-pi.vercel.app/index.html',   scroll: 6500, name: 'features_icons' },
    { url: 'https://relux-pi.vercel.app/index.html',   scroll: 10000,name: 'footer' },
    { url: 'https://relux-pi.vercel.app/produto.html', scroll: 750,  name: 'prod_specs' },
    { url: 'https://relux-pi.vercel.app/catalogo.html',scroll: 100,  name: 'catalogo_chips' },
  ];

  for (const s of shots) {
    await page.goto(s.url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1500);
    await page.evaluate(y => window.scrollTo(0, y), s.scroll);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `/tmp/z_${s.name}.png` });
    console.log('✓', s.name);
  }

  await browser.close();
})();
