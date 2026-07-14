// main.js
import { createWorld, step } from './physics.js?v=3';
import { REG, initRender, render, setCtx, setWobbleSeed } from './render.js?v=3';
import { beats, setBeat, computeTargets } from './story.js?v=3';

const cv=document.getElementById('cv');
const ctx=cv.getContext('2d');
setCtx(ctx);
const capEl=document.getElementById('cap');
const subEl=document.getElementById('sub');
const pipsEl=document.getElementById('pips');
const REDUCED=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let world=createWorld(11);
window.world = world;
initRender(world);

let beat=0;
let target=computeTargets(0, REG);
const live={dim:0,heroA:0,cam:{x:800,y:500,z:1}};

capEl.textContent=beats[0].cap;
subEl.textContent=beats[0].sub;

const updateBeatInfo = (info) => {
  beat = info.beat;
  target = info.target;
};

window.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();setBeat(beat+1, pipsEl, capEl, subEl, REDUCED, REG, updateBeatInfo);}
  if(e.key==='ArrowLeft'){e.preventDefault();setBeat(beat-1, pipsEl, capEl, subEl, REDUCED, REG, updateBeatInfo);}
});
cv.addEventListener('click',()=>setBeat(beat+1, pipsEl, capEl, subEl, REDUCED, REG, updateBeatInfo));

const speedDialEl = document.getElementById('speedDial');
const resetBtn = document.getElementById('resetBtn');
resetBtn.addEventListener('click', (e) => {
   e.stopPropagation();
   world = createWorld(Date.now()); window.world = world;
   initRender(world);
   // clear stats panel
   const panel = document.getElementById('statsPanel');
   if(panel) panel.innerHTML = '';
});

let last=performance.now(),acc=0,lastStatsUpdate=0;
const HSTEP=1/120;
function lerp(a,b,k){return a+(b-a)*k;}
function tick(now){
  let speedDialValue = parseFloat(speedDialEl.value) || 0;
  const rawDt = (now-last)/1000;
  const dt = Math.min(0.05, rawDt) * speedDialValue;
  last = now;
  if(!REDUCED) setWobbleSeed(Math.floor(now/450)*0.7);

  const kCam=1-Math.pow(0.0025,dt);
  live.cam.x=lerp(live.cam.x,target.cam.x,kCam);
  live.cam.y=lerp(live.cam.y,target.cam.y,kCam);
  live.cam.z=lerp(live.cam.z,target.cam.z,kCam);
  live.dim=lerp(live.dim,target.dim,1-Math.pow(0.05,dt));
  live.heroA=lerp(live.heroA,target.hero,1-Math.pow(0.08,dt));
  for(const id in REG){
    const r=REG[id],t=target[id];
    const kEtch=1-Math.pow(t.crisp>r.crisp?0.32:0.02,dt);
    r.crisp=lerp(r.crisp,t.crisp,kEtch);
    r.mot = 1; // Always animate visually regardless of story beats
    r.wash = lerp(r.wash,t.wash,1-Math.pow(0.1,dt));
    r.labelA=lerp(r.labelA,t.label,1-Math.pow(0.06,dt));
    r.motionTime += Math.min(0.05, rawDt) * speedDialValue;
  }

  if(beat===beats.length-1){
    const heroAlive=world.parcels.some(p=>p.hero&&!p.bin);
    if(!heroAlive&&!world.forceBlue)world.forceBlue=true;
  }

  const motFn=id=>1;

  acc+=dt;let n=0;
  while(acc>=HSTEP&&n<200){step(world,HSTEP,motFn);acc-=HSTEP;n++;}
  if(n===200)acc=0;

  render(cv, world, live);
  
  if (now - lastStatsUpdate > 250) {
     updateStatsPanel(world);
     lastStatsUpdate = now;
  }

  requestAnimationFrame(tick);
}

function drawSVGBox(b) {
  let w = b.size==='lg'?24:16;
  let h = b.size==='lg'?24:16;
  let colHex = '#FFF';
  switch(b.color){
    case 'blue': colHex='#6B9EEE'; break;
    case 'ochre': colHex='#E0B050'; break;
    case 'rust': colHex='#D06040'; break;
    case 'grey': colHex='#888'; break;
    case 'magenta': colHex='#E050D0'; break;
    case 'cyan': colHex='#50E0D0'; break;
    case 'green': colHex='#50D050'; break;
  }
  let svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="vertical-align:middle; margin-right:4px;" title="${b.size} ${b.color} ${b.shape}">`;
  if (b.shape === 'square') {
     svg += `<rect x="2" y="2" width="${w-4}" height="${h-4}" fill="none" stroke="${colHex}" stroke-width="2"/>`;
  } else if (b.shape === 'circle') {
     svg += `<circle cx="${w/2}" cy="${h/2}" r="${(w-4)/2}" fill="none" stroke="${colHex}" stroke-width="2"/>`;
  } else if (b.shape === 'triangle') {
     svg += `<polygon points="${w/2},2 ${w-2},${h-2} 2,${h-2}" fill="none" stroke="${colHex}" stroke-width="2"/>`;
  }
  if (b.number !== null && b.number !== undefined) {
     svg += `<text x="${w/2}" y="${h/2 + 3}" fill="${colHex}" font-size="${w===24?10:7}px" text-anchor="middle" font-family="'IBM Plex Mono',monospace">${b.number}</text>`;
  }
  if (b.hero === true) {
     let cx = w - 4, cy = 4;
     svg += `<path d="M${cx},${cy-3} Q${cx},${cy} ${cx+3},${cy} Q${cx},${cy} ${cx},${cy+3} Q${cx},${cy} ${cx-3},${cy} Q${cx},${cy} ${cx},${cy-3} Z" fill="#F0E840" stroke="#888" stroke-width="0.5" />`;
  }
  svg += `</svg>`;
  return svg;
}

function updateStatsPanel(w) {
  const panel = document.getElementById('statsPanel');
  if(!panel) return;
  const telemetry = w.counters.telemetry || [];
  let map = {};
  for (let t of telemetry) {
     if(!t.in) continue;
     let inKey = JSON.stringify(t.in);
     let outKey = JSON.stringify({size: t.out.size, color: t.out.color, shape: t.out.shape, number: t.out.number, hero: t.out.hero});
     if (!map[inKey]) map[inKey] = { obj: t.in, outs: {} };
     if (!map[inKey].outs[outKey]) map[inKey].outs[outKey] = { obj: t.out, count: 0 };
     map[inKey].outs[outKey].count++;
  }
  let s = '<div style="background:#2B2B33; color:#EFEAE0; padding:8px 12px; border-radius:4px 4px 0 0; font-weight:bold; font-size:14px;">TELEMETRY LOG</div><div style="padding:12px;">';
  const keys = Object.keys(map).sort();
  for (let key of keys) {
     let item = map[key];
     s += `<div style="display:flex; align-items:center; margin-bottom:12px; border-bottom: 1px dotted #ccc; padding-bottom:12px;">`;
     s += `<div style="flex:0 0 100px; text-align:center;">${drawSVGBox(item.obj)}<br/><span style="font-size:10px; color:#666;">Original</span></div>`;
     s += `<div style="flex:0 0 30px; font-size:16px;">&rarr;</div>`;
     s += `<div style="flex:1; display:flex; flex-wrap:wrap; gap:16px;">`;
     let valKeys = Object.keys(item.outs).sort();
     for (let vk of valKeys) {
        let outItem = item.outs[vk];
        s += `<div style="display:flex; align-items:center; background:#eee; padding:4px 8px; border-radius:4px;">${drawSVGBox(outItem.obj)} <strong style="margin-left:4px;">x${outItem.count}</strong></div>`;
     }
     s += `</div></div>`;
  }
  if(keys.length === 0) s += '<i>No telemetry yet (waiting for boxes to drop into bins).</i>';
  s += '</div>';
  panel.innerHTML = s;
}

requestAnimationFrame(tick);
