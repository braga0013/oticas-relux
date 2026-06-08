const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  async function shot(name, url, scrollY) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1500);
    if (scrollY) await page.evaluate(y => window.scrollTo(0,y), scrollY);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `/tmp/${name}.png` });
  }

  await shot('r_index_top',      'https://relux-pi.vercel.app/index.html', 0);
  await shot('r_index_mid',      'https://relux-pi.vercel.app/index.html', 1200);
  await shot('r_checkout_top',   'https://relux-pi.vercel.app/checkout.html', 0);
  await shot('r_checkout_mid',   'https://relux-pi.vercel.app/checkout.html', 900);
  await shot('r_catalogo_top',   'https://relux-pi.vercel.app/catalogo.html', 0);
  await shot('r_produto_top',    'https://relux-pi.vercel.app/produto.html', 0);
  await shot('r_produto_mid',    'https://relux-pi.vercel.app/produto.html', 600);

  console.log('done');
  await browser.close();
})();
