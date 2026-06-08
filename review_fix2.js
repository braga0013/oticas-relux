const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2 });
  const page = await ctx.newPage();

  // Nav
  await page.goto('https://relux-pi.vercel.app/index.html',{waitUntil:'networkidle',timeout:20000});
  await page.waitForTimeout(1500);
  await page.screenshot({path:'/tmp/fix_nav.png'});

  // Menu lateral aberto
  await page.click('#hamburger');
  await page.waitForTimeout(600);
  await page.screenshot({path:'/tmp/fix_menu.png'});
  await page.click('#hamburger');

  // Conta - email longo
  await page.goto('https://relux-pi.vercel.app/conta.html',{waitUntil:'networkidle',timeout:20000});
  await page.waitForTimeout(1500);
  // simula login local para mostrar tela de conta
  await page.evaluate(() => {
    localStorage.setItem('relux-user', JSON.stringify({name:'Bruno Braga',email:'bpedrozomoralesbraga@gmail.com',phone:'(51) 99376-9899'}));
    location.reload();
  });
  await page.waitForTimeout(2000);
  await page.screenshot({path:'/tmp/fix_conta.png'});

  // Toast
  await page.goto('https://relux-pi.vercel.app/catalogo.html',{waitUntil:'networkidle',timeout:20000});
  await page.waitForTimeout(2000);
  const btn = await page.$('.product .btn-primary, .btn-primary');
  if(btn){ await btn.click(); await page.waitForTimeout(800); }
  await page.screenshot({path:'/tmp/fix_toast.png'});

  console.log('done');
  await browser.close();
})();
