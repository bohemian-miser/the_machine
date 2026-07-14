import { rrectO, rline, INK } from '../render.js?v=3';
import { makeParcel } from '../physics.js?v=3';

export function step(world, dt, mot) {
  if (mot('crushers') > 0.5) {
    for (let i = world.parcels.length - 1; i >= 0; i--) {
      let p = world.parcels[i];
      if (p.state === 'surf' && p.surf === 'cr_belt' && p.s > 40 && p.size === 'lg') {
        const px = p.x, py = p.y, pc = p.color;
        world.parcels.splice(i, 1);
        for (let j = 0; j < 3; j++) {
          let np = makeParcel(p.number, p.shape, pc, 'sm', px, py - 5 - j * 12);
          world.counters.seen.colors[pc] = (world.counters.seen.colors[pc] || 0) + 1;
          world.counters.seen.sizes['sm'] = (world.counters.seen.sizes['sm'] || 0) + 1;
          np.state = 'fall';
          const sf = world.smap['cr_belt'];
          np.vx = p.vt * sf.tx + (world.rnd() - 0.5) * 50;
          np.vy = -10 - world.rnd() * 30;
          world.parcels.push(np);
        }
      }
    }
  }
}

export function render(ctx, world, r, pass, p, amp) {
  const seed = (pass === 'faint' ? 550 : 950) + r.id.length * 29;
  const mt = r.motionTime || 0;
  const csz = 30 + Math.sin(mt * 15) * 10;
  rrectO(120, 260 - csz / 2, 40, csz, p, amp, seed);
  rline([[120, 260], [160, 260]], p, amp, seed + 1);
}

export function renderGlyph(ctx, world, r) {
  ctx.save();
  ctx.strokeStyle = '#2B2B33';
  ctx.fillStyle = '#2B2B33';
  ctx.lineWidth = 2;
  const lx = r.label[0], ly = r.label[1];
 ctx.fillRect(lx+30, ly-15, 20, 10); ctx.strokeRect(lx+30, ly-25, 20, 10);
  ctx.restore();
}
