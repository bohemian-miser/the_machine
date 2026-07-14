const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, searchRegex, replaceString) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = content.replace(searchRegex, replaceString);
    fs.writeFileSync(filePath, newContent);
}

// 1. modules/index.js
replaceInFile('modules/index.js', /import \* as teleport from '\.\/tool_teleport\.js';\n/, '');
replaceInFile('modules/index.js', /\s*teleport,/, '');

// 2. tool_pinball.js
replaceInFile('modules/tool_pinball.js', /export function step\(world, dt, mot\) \{[\s\S]*?^\}/m, `export function step(world, dt, mot) {
  for (const b of world.bumpers) if (b.hitTimer > 0) b.hitTimer -= dt;
  for (const p of world.parcels) {
    if (p.state === 'fall' && p.x > 300 && p.x < 900 && p.y > 600) {
      for (const b of world.bumpers) {
        let dx = p.x - b.x, dy = p.y - b.y;
        let dist = Math.hypot(dx, dy);
        if (dist < b.r + p.hw + 2) {
          let nx = dx / dist, ny = dy / dist;
          let dp = p.vx * nx + p.vy * ny;
          if (dp < 0) {
            p.vx = p.vx - 1.8 * dp * nx + nx * 500;
            p.vy = p.vy - 1.8 * dp * ny + ny * 500;
            b.hitTimer = 0.25;
          }
        }
      }
    }
  }
}`);
replaceInFile('modules/tool_pinball.js', /rcircle\(b\.x, b\.y, b\.r, p, Math\.min\(amp \* 2, 2\.5\), seed \+ b\.y\);/, `rcircle(b.x, b.y, b.r + (b.hitTimer>0?b.hitTimer*60:0), p, Math.min(amp * 2, 2.5), seed + b.y);`);

// 3. tool_ferris_wheel.js
replaceInFile('modules/tool_ferris_wheel.js', /if \(riderId\) \{\n\s*const p = world\.parcels\.find\(q => q\.id === riderId\);\n\s*if \(p && p\.shape === 'triangle'\) \{/m, 
`if (riderId && world.caro.tool === i && !world.caro.rotating) {
            const p = world.parcels.find(q => q.id === riderId);
            if (p && p.shape === 'triangle') {`);

// 4. tool_works.js (Rewrite entirely to relocate stamp to beltA)
fs.writeFileSync('modules/tool_works.js', `import { rrectO, rline, rcircle, INK } from '../render.js';

const weighedSet = new Set();
export function step(world, dt, mot) {
  for(const p of world.parcels){
    if(p.state==='surf' && p.surf==='beltA' && p.s>30 && p.s<100 && !weighedSet.has(p.id)){
      world.weighBucket = world.weighBucket || {weight: 0};
      world.weighBucket.weight += p.wid;
      weighedSet.add(p.id);
    }
  }

  const m=mot('intake'), P=world.press;
  if(m>-1){ 
    P.timer+=dt;
    if(P.state==='ARMED'){
      P.piston+= (0-P.piston)*Math.min(1,8*dt);
      const front=world.parcels.find(p=>p.state==='surf'&&p.surf==='beltA'
        &&!p.stamped
        &&p.s>130-p.hw-6&&p.s<=130-p.hw+0.5&&Math.abs(p.vt)<6);
      if(front && world.weighBucket && world.weighBucket.weight >= 40){ 
         P.state='STAMP'; P.timer=0; P.target=front.id; P.misfire=false; 
      }
    }else if(P.state==='STAMP'){
      P.piston=Math.min(1,P.piston+dt*3.2);
      if(P.timer>0.55){
        const p=world.parcels.find(q=>q.id===P.target);
        if(p){ p.stamped=true; p.number = Math.floor(world.weighBucket.weight); world.weighBucket.weight = 0; }
        P.state='RELEASE';P.timer=0;P.pinOn=false;
      }
    }else if(P.state==='RELEASE'){
      P.piston+= (0-P.piston)*Math.min(1,6*dt);
      const straddling=world.parcels.some(p=>p.state==='surf'&&p.surf==='beltA'&&p.s>120&&p.s<140);
      if(P.timer>0.7&&!straddling){P.state='ARMED';P.timer=0;P.pinOn=true;}
    }
  }
}

export function render(ctx, world, r, pass, p, amp) {
  const seed = (pass === 'faint' ? 550 : 950) + r.id.length * 29;
  const P=world.press, py=160+P.piston*30; 
  const px=328;
  rline([[px-14, 130],[px-14, 185]],p,amp,seed+1);
  rline([[px+14, 130],[px+14, 185]],p,amp,seed+2);
  rline([[px-22, 130],[px+22, 130]],p,amp,seed+3);
  rline([[px, 130],[px, py]],p,amp,seed+4);
  rline([[px-12, py],[px+12, py]],p,amp,seed+5);
  rline([[px-12, py+7],[px+12, py+7]],p,amp,seed+6);
  if(P.pinOn)rline([[px+12, 175],[px+12, 215]],Math.min(1,p*1.3),amp*.6,seed+7);
  
  const wbH = 10 + Math.min((world.weighBucket?.weight||0)/2, 120);
  ctx.save();
  ctx.fillStyle = 'rgba(200, 240, 255, 0.4)';
  ctx.fillRect(px-100, 190 - wbH, 36, wbH);
  ctx.restore();
  rrectO(px-100, 190 - wbH, 36, wbH, p, amp, seed+15);
}

export function renderGlyph(ctx, world, r) {
  ctx.save();
  ctx.strokeStyle = '#2B2B33';
  ctx.fillStyle = '#2B2B33';
  ctx.lineWidth = 2;
  const lx = r.label[0], ly = r.label[1];
  ctx.beginPath(); ctx.moveTo(lx+30, ly-15); ctx.lineTo(lx+50, ly-15); ctx.lineTo(lx+40, ly-5); ctx.fill();
  ctx.restore();
}
`);

// 5. Transform all remaining renderGlyphs
const glyphs = {
 'tool_painters.js': ` ctx.fillRect(lx+30, ly-15, 4, 15); ctx.fillRect(lx+30, ly-15, 20, 3); ctx.fillRect(lx+46, ly-20, 8, 20);`,
 'tool_pinball.js': ` ctx.beginPath(); ctx.arc(lx+40, ly-10, 10, 0, Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.arc(lx+40, ly-10, 4, 0, Math.PI*2); ctx.fill();`,
 'tool_ferris_wheel.js': ` ctx.beginPath(); ctx.moveTo(lx+30, ly-5); ctx.lineTo(lx+50, ly-5); ctx.lineTo(lx+40, ly-20); ctx.stroke();`,
 'tool_intake.js': ` ctx.fillRect(lx+38, ly-20, 4, 16); ctx.fillRect(lx+32, ly-14, 16, 4);`,
 'tool_sorter.js': ` ctx.beginPath(); ctx.moveTo(lx+40, ly-5); ctx.lineTo(lx+30, ly-20); ctx.moveTo(lx+40, ly-5); ctx.lineTo(lx+50, ly-20); ctx.stroke();`,
 'tool_dispatch.js': ` ctx.beginPath(); ctx.moveTo(lx+30, ly-10); ctx.lineTo(lx+50, ly-10); ctx.lineTo(lx+40, ly-20); ctx.fill();`,
 'tool_crushers.js': ` ctx.fillRect(lx+30, ly-15, 20, 10); ctx.strokeRect(lx+30, ly-25, 20, 10);`,
 'tool_check.js': ` ctx.beginPath(); ctx.moveTo(lx+30, ly-10); ctx.lineTo(lx+38, ly-4); ctx.lineTo(lx+50, ly-20); ctx.stroke();`,
 'tool_skyway.js': ` ctx.beginPath(); ctx.moveTo(lx+20, ly-5); ctx.lineTo(lx+35, ly-20); ctx.lineTo(lx+50, ly-5); ctx.stroke();`
};

const files = fs.readdirSync('modules').filter(f => f.startsWith('tool_'));
for (const f of files) {
  if (f === 'tool_works.js' || f === 'tool_teleport.js') continue;
  let p = 'modules/' + f;
  let code = fs.readFileSync(p, 'utf8');
  if (code.includes('renderGlyph')) {
      code = code.replace(/export function renderGlyph[\s\S]*?^\}/m, 
`export function renderGlyph(ctx, world, r) {
  ctx.save();
  ctx.strokeStyle = '#2B2B33';
  ctx.fillStyle = '#2B2B33';
  ctx.lineWidth = 2;
  const lx = r.label[0], ly = r.label[1];
${glyphs[f] || `  ctx.beginPath(); ctx.arc(lx + 40, ly - 10, 8, 0, Math.PI * 2); ctx.fill();`}
  ctx.restore();
}`);
  } else {
      code += `\nexport function renderGlyph(ctx, world, r) {
  ctx.save();
  ctx.strokeStyle = '#2B2B33';
  ctx.fillStyle = '#2B2B33';
  ctx.lineWidth = 2;
  const lx = r.label[0], ly = r.label[1];
${glyphs[f] || `  ctx.beginPath(); ctx.arc(lx + 40, ly - 10, 8, 0, Math.PI * 2); ctx.fill();`}
  ctx.restore();
}\n`;
  }
  fs.writeFileSync(p, code);
}

// 6. main.js updateStatsPanel rewrite
replaceInFile('main.js', /function updateStatsPanel[\s\S]*?\}\n/, 
`function updateStatsPanel(w) {
  const panel = document.getElementById('statsPanel');
  if(!panel) return;
  const telemetry = w.counters.telemetry || [];
  let map = {};
  for (let t of telemetry) {
     if(!t.in) continue;
     let key = \`\${t.in.size} \${t.in.color} \${t.in.shape}\`;
     if (!map[key]) map[key] = [];
     map[key].push(\`\${t.out.size} \${t.out.color} \${t.out.shape} (#\${t.out.number}) => \${t.bin}\`);
  }
  let s = '<strong>Box Telemetry (Inputs -> Outputs)</strong><br><hr>';
  const keys = Object.keys(map).sort();
  for (let key of keys) {
     let outs = map[key].slice().sort();
     s += \`<strong>\${key}</strong><br>\`;
     for (let out of outs) s += \` &nbsp;&nbsp;&rarr; \${out}<br>\`;
  }
  if(keys.length === 0) s += '<i>No telemetry yet...</i>';
  panel.innerHTML = s;
}
`);
