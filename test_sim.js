import { JSDOM } from 'jsdom';
import fs from 'fs';

const html = fs.readFileSync('the-machine.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
const window = dom.window;

setTimeout(() => {
  const world = window.world;
  for (let i = 0; i < 24; i++) {
    const el = window.document.getElementById('machine-container');
    const ev = new window.MouseEvent('click');
    el.dispatchEvent(ev);
  }
  
  const speedEl = window.document.getElementById('speed-dial');
  speedEl.value = 10;
  speedEl.dispatchEvent(new window.Event('input'));

  console.log("Simulating 30s...");
  let start = Date.now();
  
  let loop = setInterval(() => {
    if (Date.now() - start > 6000) {
      clearInterval(loop);
      console.log("FINAL STATE:");
      console.log("t:", world.t);
      const locs = {};
      world.parcels.forEach(p => {
        const loc = p.state === 'surf' ? p.surf : p.state;
        locs[loc] = (locs[loc] || 0) + 1;
      });
      const stalled = world.parcels.filter(p => p.state === 'surf' && p.vt === 0).length;
      console.log("total:", world.parcels.length);
      console.log("stalled:", stalled);
      console.log("locations:", JSON.stringify(locs));
      const bins = {grey:0, blue:0, rej:0, A:0, B:0};
      world.parcels.forEach(p => { if(p.bin) bins[p.bin]++; });
      console.log("bins:", JSON.stringify(bins));
      process.exit(0);
    }
  }, 100);
}, 2000);
