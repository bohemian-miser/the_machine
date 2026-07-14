import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Very basic static file server
const server = http.createServer((req, res) => {
  console.log(`Server requested: ${req.url}`);
  const reqUrl = req.url.split('?')[0];
  let filePath = path.join(__dirname, reqUrl === '/' ? 'index.html' : reqUrl);
  let extname = String(path.extname(filePath)).toLowerCase();
  
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }
  
  let mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif'
  };
  let contentType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code == 'ENOENT') {
        res.writeHead(404); res.end('Not Found');
      } else {
        res.writeHead(500); res.end('Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

async function runTests() {
  let browser;
  try {
    const port = 8002;
    await new Promise((resolve) => server.listen(port, resolve));
    console.log(`Server listening on port ${port}`);

    browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    const errors = [];
    
    page.on('pageerror', err => {
      console.error(`=> Page Error: ${err.stack || err.toString()}`);
      errors.push(`Page Error: ${err.stack || err.toString()}`);
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        const loc = msg.location();
        if (text.includes('favicon.ico') || (loc && loc.url && loc.url.includes('favicon.ico'))) return; 
        
        console.error(`=> Console Error [${loc.url}:${loc.lineNumber}]: ${text}`);
        errors.push(`Console Error [${loc.url}:${loc.lineNumber}]: ${text}`);
      }
    });

    console.log("Navigating to http://localhost:8002/index.html");
    await page.goto('http://localhost:8002/index.html', { waitUntil: 'load' });
    
    console.log("Waiting for app to initialize...");
    await page.waitForFunction(() => {
      const el = document.querySelector('#cap');
      return el && el.textContent.length > 0;
    }, { timeout: 10000 });
    
    console.log("Clicking through story beats...");
    
    let previousPips = "";
    let beatsAdvanced = 0;
    const maxBeats = 50; // Safeguard against infinite loops

    for (let i = 0; i < maxBeats; i++) {
      let pipsText;
      try {
        pipsText = await page.$eval('#pips', el => el.textContent);
      } catch (e) {
        console.log("No #pips element found, waiting a second to see if it loads...");
        await new Promise(r => setTimeout(r, 1000));
        pipsText = await page.$eval('#pips', el => el.textContent);
      }
      
      console.log(`Beat ${i + 1}: ${pipsText}`);
      const [currentStr, totalStr] = pipsText.split('/').map(s => s.trim());
      const current = parseInt(currentStr, 10);
      const total = parseInt(totalStr, 10);

      beatsAdvanced++;

      if (current === total) {
        console.log(`Reached the last beat: ${current} / ${total}`);
        break;
      }
      
      if (pipsText === previousPips && i > 0) {
        throw new Error(`Story did not advance after click. Stuck at ${pipsText}`);
      }
      previousPips = pipsText;
      
      await page.click('canvas#cv');
      
      await page.waitForFunction(
        (prev) => {
          const el = document.querySelector('#pips');
          return el && el.textContent !== prev;
        },
        { timeout: 5000 },
        pipsText
      );
      
      // Allow logic to settle before next click
      await new Promise(r => setTimeout(r, 200));
    }
    
    if (errors.length > 0) {
      console.error("Errors encountered during E2E flow:");
      errors.forEach(e => console.error(e));
      process.exit(1);
    }
    
    console.log(`Successfully clicked through ${beatsAdvanced} beats with no errors.`);
    
    // START INJECTION
    const state = await page.evaluate(() => {
      let output = '';
      if(window.world) {
         let stalled = 0;
         window.world.parcels.forEach(p => { if(p.vt === 0) stalled++; });
         output += 'total: ' + window.world.parcels.length + '\n';
         output += 'stalled: ' + stalled + '\n';
         let locs = {};
         window.world.parcels.forEach(p => {
             let key = p.state==='surf' ? p.surf : p.state;
             locs[key] = (locs[key]||0)+1;
         });
         output += 'locations: ' + JSON.stringify(locs) + '\n';
      }
      return output;
    });
    console.log("FINAL WORLD STATE:\n" + state);
    // END INJECTION
    
  } catch (err) {
    console.error("E2E Test Failed:", err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

runTests();
