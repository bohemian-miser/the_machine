import { rrectO, INK } from '../render.js?v=3';

export function step(world, dt, mot) {
  if (mot('painters') > 0.5) {
    for (const p of world.parcels) {
      if (p.state === 'surf' && p.surf.startsWith('pt_b') && p.s > 30 && p.s < 50) {
        let sf = world.smap[p.surf];
        if (sf && sf.painter) {
          let shouldPaint = false;
          if (sf.painter === 'magenta' && p.shape === 'circle') shouldPaint = true;
          if (sf.painter === 'green' && p.shape === 'triangle') shouldPaint = true;
          if (sf.painter === 'cyan' && p.shape === 'square') shouldPaint = true;
          if (sf.painter === 'white' && p.number > 50) shouldPaint = true;
          if (shouldPaint) p.color = sf.painter;
        }
      }
    }
  }
}

export function render(ctx, world, r, pass, p, amp) {
  const seed = (pass === 'faint' ? 550 : 950) + r.id.length * 29;
  rrectO(100, 510 - 15, 20, 10, p, amp, seed);
  rrectO(100, 560 - 15, 20, 10, p, amp, seed+1);
  rrectO(100, 610 - 15, 20, 10, p, amp, seed+2);
  rrectO(100, 660 - 15, 20, 10, p, amp, seed+3);
}

export function renderGlyph(ctx, world, r) {
  ctx.save();
  ctx.fillStyle = '#2B2B33';
  ctx.font = '10px "IBM Plex Mono"';
  ctx.fillText('Cir -> Mag', 125, 510 - 5);
  ctx.fillText('Tri -> Grn', 125, 560 - 5);
  ctx.fillText('Squ -> Cy', 125, 610 - 5);
  ctx.fillText('#>50 -> Wht', 125, 660 - 5);
  ctx.restore();
}
