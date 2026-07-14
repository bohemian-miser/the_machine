const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('favicon.ico')) {
         errors.push(txt);
      }
    }
  });

  await page.goto('http://localhost:8002');
  
  // Wait a bit to see if any errors happen on tick
  await new Promise(r => setTimeout(r, 1000));
  
  if (errors.length > 0) {
    console.error("Encountered errors:");
    errors.forEach(e => console.error(e));
    process.exit(1);
  } else {
    console.log("No errors.");
    process.exit(0);
  }
})();
