const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2 });
  const page = await ctx.newPage();
  const shots = [
    { url:'https://relux-pi.vercel.app/index.html',    scroll:1500, name:'after_bento' },
    { url:'https://relux-pi.vercel.app/index.html',    scroll:700,  name:'after_hero' },
    { url:'https://relux-pi.vercel.app/produto.html',  scroll:750,  name:'after_specs' },
    { url:'https://relux-pi.vercel.app/catalogo.html', scroll:100,  name:'after_catalogo' },
  ];
  for(const s of shots){
    await page.goto(s.url,{waitUntil:'networkidle',timeout:25000});
    await page.waitForTimeout(1500);
    await page.evaluate(y=>window.scrollTo(0,y), s.scroll);
    await page.waitForTimeout(500);
    await page.screenshot({path:`/tmp/${s.name}.png`});
    console.log('✓',s.name);
  }
  await browser.close();
})();
