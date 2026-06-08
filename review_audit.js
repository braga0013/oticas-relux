const { chromium } = require('playwright');

const PAGES = [
  { name: 'index',    url: 'https://relux-pi.vercel.app/index.html' },
  { name: 'catalogo', url: 'https://relux-pi.vercel.app/catalogo.html' },
  { name: 'produto',  url: 'https://relux-pi.vercel.app/produto.html' },
];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await context.newPage();

  for (const p of PAGES) {
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1500);

    const issues = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const found = [];
      document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        const tag = el.tagName.toLowerCase();
        const cls = el.className && typeof el.className === 'string' ? el.className.trim().slice(0,60) : '';
        const id = el.id ? '#' + el.id : '';

        // overflow horizontal
        if (r.right > vw + 2 && style.overflow !== 'hidden' && style.overflowX !== 'hidden') {
          found.push({ type: 'OVERFLOW_X', el: tag + (id||'') + (cls ? ' .'+cls.split(' ')[0] : ''), right: Math.round(r.right), vw });
        }
        // elemento mais largo que viewport
        if (r.width > vw + 2) {
          found.push({ type: 'TOO_WIDE', el: tag + (id||'') + (cls ? ' .'+cls.split(' ')[0] : ''), width: Math.round(r.width), vw });
        }
        // altura zero mas visível (possível rasgo)
        if (r.height === 0 && style.display !== 'none' && style.visibility !== 'hidden' && r.width > 50) {
          found.push({ type: 'ZERO_HEIGHT', el: tag + (id||'') + (cls ? ' .'+cls.split(' ')[0] : ''), width: Math.round(r.width) });
        }
      });
      // remove duplicatas por tipo+el
      const seen = new Set();
      return found.filter(f => { const k = f.type+f.el; if(seen.has(k)) return false; seen.add(k); return true; });
    });

    console.log(`\n=== ${p.name.toUpperCase()} ===`);
    if (!issues.length) { console.log('  ✓ Sem overflow detectado'); continue; }
    issues.slice(0, 30).forEach(i => console.log(`  [${i.type}] ${i.el}`, i.width ? `width:${i.width}px` : '', i.right ? `right:${i.right}px (vw:${i.vw})` : ''));
  }

  await browser.close();
})();
