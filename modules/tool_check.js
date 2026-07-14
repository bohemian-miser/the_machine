import { drawEye, drawBin, rline, rcircle, rrectO, INK } from '../render.js?v=3';

export function step(world, dt, mot) {
  world.ckFlap.angle+=(world.ckFlap.target-world.ckFlap.angle)*Math.min(1,8*dt);
}

export function render(ctx, world, r, pass, p, amp) {
  const seed = (pass === 'faint' ? 550 : 950) + r.id.length * 29;
  const bin = (id) => world.bins.find(b=>b.id===id);
  
  drawEye(1270,496,11,p,amp,seed);
  const a=world.ckFlap.angle;
  rline([[1304,526],[1304+Math.cos(a)*26,526+Math.sin(a)*26]],p,amp*.8,seed+8);
  rcircle(1304,526,2.6,p,amp*.6,seed+9);
  drawBin(bin('rej'),p,amp,seed+12,true);
  if(true){
    rrectO(1250, 460, 19, 14, p, amp, seed+70);
    rline([[1254,463],[1262,470]], p, amp*.7, seed+71); 
    rline([[1262,463],[1254,470]], p, amp*.7, seed+72); 
    rline([[1275, 467], [1285, 467]], p, amp, seed+73); 

    rrectO(1200, 460, 25, 30, p, amp, seed+95);
    rline([[1210, 470], [1215, 460]], p, amp, seed+96); 
    rline([[1210, 480], [1210, 488]], p, amp, seed+97); 
    rline([[1215, 480], [1215, 488]], p, amp, seed+98);
  }
}

export function renderGlyph(ctx, world, r) {
  ctx.save();
  ctx.strokeStyle = '#2B2B33';
  ctx.fillStyle = '#2B2B33';
  ctx.lineWidth = 2;
  const lx = r.label[0], ly = r.label[1];
 ctx.beginPath(); ctx.moveTo(lx+30, ly-10); ctx.lineTo(lx+38, ly-4); ctx.lineTo(lx+50, ly-20); ctx.stroke();
  ctx.restore();
}
