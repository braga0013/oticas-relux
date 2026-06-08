const { chromium } = require('playwright');

const pages = [
  { name: 'index',     url: 'https://relux-pi.vercel.app/index.html' },
  { name: 'catalogo',  url: 'https://relux-pi.vercel.app/catalogo.html' },
  { name: 'produto',   url: 'https://relux-pi.vercel.app/produto.html' },
  { name: 'checkout',  url: 'https://relux-pi.vercel.app/checkout.html' },
  { name: 'conta',     url: 'https://relux-pi.vercel.app/conta.html' },
];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  for (const p of pages) {
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `/tmp/relux_${p.name}.png`, fullPage: true });
    console.log(`✓ ${p.name}`);
  }

  await browser.close();
})();
