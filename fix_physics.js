const fs = require('fs');

let content = fs.readFileSync('physics.js', 'utf8');

// 1. Remove spawnCap
content = content.replace(/spawnCap:102/, 'spawnCap:Infinity');

// 2. Add holdIf logic in physics.js step for surfaces
let searchStr = `      // end-stop walls on queue ledges (and conditional jams)
      if((sf.endStop||(sf.stopIf&&sf.stopIf(mot)))&&p.s>sf.len-2){p.s=sf.len-2;p.vt=0;}`;

let replaceStr = `      // end-stop walls on queue ledges (and conditional jams)
      if((sf.endStop||(sf.stopIf&&sf.stopIf(mot)))&&p.s>sf.len-2){p.s=sf.len-2;p.vt=0;}
      // custom holding logic in the middle of a belt (e.g. stamp press)
      if (sf.holdIf && sf.holdIf(p, world)) {
         let holdS = sf.holdAt || 130;
         if (p.s > holdS) { p.s = holdS; p.vt = 0; }
      }`;

content = content.replace(searchStr, replaceStr);

// 3. Remove grey bucket eruption from physics.js entirely since user hates "the explode thing"
let eruptSearch = `  // Handle grey bucket eruption\\s*let greyBucket = world\\.bins\\.find\\(b=>b\\.id==='grey'\\);\\s*if \\(greyBucket && greyBucket\\.count > 15.*\\{\\s*world\\.manualEruption = true;[\\s\\S]*?greyBucket\\.count = 0;\\s*\\}`;
content = content.replace(new RegExp(eruptSearch, 'm'), '');

// 4. In createWorld, add the infinite spawner logic if it stops.
let spawnLogic = `if(p\\.bin)\\{p\\.fade\\+=dt;continue;\\}`;
content = content.replace(/if\(p\.bin\)\{p\.fade\+=dt;continue;\}/, `if(p.bin){p.fade+=dt;continue;}`);
// wait, the actual spawn logic is missing from physics.js view?
// Actually in physics.js, spawn logic is not in \`step()\`, it's injected? Let me check where spawn logic lives.
fs.writeFileSync('physics.js', content);
